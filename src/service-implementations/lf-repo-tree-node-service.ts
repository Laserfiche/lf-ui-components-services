import { LfRepoTreeNode } from '../helper-types/lf-repo-browser-types';
import { LfLocalizationService, IconUtils, PathUtils, StringUtils } from '@laserfiche/lf-js-utils';
import { getFolderChildrenDefaultParameters } from '../utils/repo-client-utils.js';
import {
  Entry,
  Document,
  Folder,
  Shortcut,
  RecordSeries,
  ODataValueContextOfIListOfEntry,
  EntryType,
  FindEntryResult,
} from '@laserfiche/lf-repository-api-client';
import { IRepositoryApiClientEx } from '../helper-types/repository-api-ex.js';
import { defaultSupportedColumnIds } from '../helper-types/lf-repo-browser-types';
import {
  ColumnOrderBy,
  LfTreeNode,
  LfTreeNodePage,
  LfTreeNodeService,
  PropertyValue,
} from '@laserfiche/types-lf-ui-components';

export const nodeAttrName_extension = 'extension';
export const nodeAttrName_elecDocumentSize = 'elecDocumentSize';
export const nodeAttrName_templateName = 'templateName';
export const nodeAttrName_creationTime = 'creationTime';
const rootFolderId: number = 1;

export class LfRepoTreeNodeService implements LfTreeNodeService {
  /**
   * An array containing entryTypes (defined in '@laserfiche/lf-repository-api-client') for viewable entries
   * @example
   * ```ts
   * const service = new LfRepoTreeNodeService(repoClient);
   * service.viewableEntryTypes = [EntryType.Folder]; // entries of other types (document, shortcut) are not viewable
   * ```
   */
  viewableEntryTypes?: EntryType[];

  /**
   * An array containing the ids of the columns that the
   * LfRepoTreeNodeService will select on and add to the attributes
   * of the LfRepoTreeNode. <br>
   * This array should only contain column ids that are supported by the service. <br>
   * If an unsupported column id is passed in, it will be ignored and the LfRepoTreeNode returned
   * will not contain the unsupported column. <br>
   * Use the getSupportedColumnIdsAsync() method to get the supported columns.
   * @example
   * ```ts
   * const service = new LfRepoTreeNodeService(repoClient);
   * service.columnIds = ['creationDate', 'serialNumber'];
   * const folderChildren = await service.getFolderChildrenAsync(folder);
   * const entryArray = folderChildren.page;
   * for (entry in entryArray) {
   *    assert(entry.attributes.get('creationDate')).toBeDefined(); // entries should (in general) have every supported property specified in columnIds.
   *    assert(entry.attributes.get('serialNumber')).toBeUndefined(); // unsupported columns will not be part of the returned entry.
   * }
   * ```
   */
  columnIds?: string[];

  private localizationService = new LfLocalizationService();

  constructor(private repoClient: IRepositoryApiClientEx) {
    if (!this.repoClient) {
      console.error('getParentNodeAsync() _selectedRepositoryClient was undefined');
      throw new Error(this.localizationService.getString('ERRORS.ENTRY_NOT_FOUND'));
    }
  }

  /**
   * Get the columns that are supported by the LfRepoTreeNodeService
   * There are a limited number of columns that can be selected on the Laserfiche repository
   * API.
   * @returns - Promise with an array of the supported column ids
   * @example
   * ```ts
   * const service = new LfRepoTreeNodeService(repoClient);
   * service.getSupportedColumnIdsAsync() ->
   * ['name',
   * 'entryId',
   * 'elecDocumentSize',
   * 'extension',
   * 'isElectronicDocument',
   * 'isRecord',
   * 'mimeType',
   * 'pageCount',
   * 'isCheckedOut',
   * 'isUnderVersionControl',
   * 'creator',
   * 'creationTime',
   * 'lastModifiedTime',
   * 'templateName']
   * ```
   */
  async getSupportedColumnIdsAsync(): Promise<string[]> {
    // TODO: add support for custom repository-specific columns
    return defaultSupportedColumnIds;
  }

  /**
   * Gets the parent LfTreeNode of the passed in node
   * @param treeNode: LfTreeNode object to get the parent of
   * returns - Promise with the parent of the parameter LfTreeNode or undefined if its the root LfTreeNode and does not have a parent
   * @example
   * ```ts
   * // suppose the repository is structured as below
   * - root
   *      - DocInRoot
   *      - FolderInRoot
   *            - DocInFolderInRoot
   *            - FolderInFolderInRoot
   *            - FolderInFolderInRoot1
   *      - FolderInRoot1
   *      - FolderInRoot2
   *      - FolderInRoot3
   *
   * const service = new LfRepoTreeNodeService(repoClient);
   * service.getParentTreeNodeAsync(DocInFolderInRoot) -> FolderInRoot;
   * ```
   */
  async getParentTreeNodeAsync(treeNode: LfRepoTreeNode): Promise<LfRepoTreeNode | undefined> {
    const repoId: string = await this.repoClient.getCurrentRepoId();
    if (treeNode.id === '1') {
      return undefined;
    }
    if (treeNode.path?.endsWith('\\')) {
      treeNode.path = treeNode.path.slice(0, -1);
    }

    try {
      const parentPath = this.getParentPath(treeNode.path);
      if (parentPath) {
        const parentEntry: FindEntryResult = await this.repoClient.entriesClient.getEntryByPath({
          repoId,
          fullPath: parentPath,
        });
        if (parentEntry.entry) {
          const foundParentEntry = parentEntry.entry;
          if (foundParentEntry.id === 1) {
            const repoName = await this.repoClient.getCurrentRepoName();
            return this.createRootFolderNode(repoName, foundParentEntry);
          } else {
            const parentNode = this.createNonRootLfRepoTreeNode(foundParentEntry);
            return parentNode;
          }
        } else {
          throw new Error('Parent is not found');
        }
      } else {
        return await this.getRootTreeNodeAsync();
      }
    } catch (err: any) {
      if (err.errorCode === 9013) {
        const rootNode = await this.getRootTreeNodeAsync();
        return rootNode;
      } else {
        throw err;
      }
    }
  }

  /**
   * Requests a page of size 100 containing the children of the parent tree node, sorted by name, ascending.
   * Only returns the viewable children.
   * @param folder: LfTreeNode representing the folder to get data from
   * @param nextPage: string representing the next page requested. If undefined, the first page is returned
   * @param orderBy: ColumnOrderBy object representing the column to sort by and the direction to sort
   * @example
   * ```ts
   * // suppose the repository is structured as below
   * - root
   *      - DocInRoot
   *      - FolderInRoot
   *            - DocInFolderInRoot
   *            - FolderInFolderInRoot001
   *            - FolderInFolderInRoot002
   *            ...
   *            - FolderInFolderInRoot101
   *            - FolderInFolderInRoot102
   * const service = new LfRepoTreeNodeService(repoClient);
   * service.viewableEntryTypes = [EntryType.Folder];
   * service.columnIds = ['creationDate'];
   * service.getFolderChildrenAsync(FolderInRoot) -> { page:
   *                                                      FolderInFolderInRoot001,
   *                                                      FolderInFolderInRoot002,
   *                                                      ...
   *                                                      FolderInFolderInRoot99,
   *                                                      FolderInFolderInRoot100],
   *                                                      nextPage: <API request for next page>
   *                                                    }  // no DocInFolderInRoot because it is not viewable
   * service.getFolderChildrenAsync(FolderInRoot, <API request for next page>) -> { page:
   *                                                      [FolderInFolderInRoot101,
   *                                                      FolderInFolderInRoot102],
   *                                                      nextPage: undefined
   *                                                    }
   * const orderBy: ColumnOrderBy = { columnId: 'creationDate', isDesc: true };
   * service.getFolderChildrenAsync(FolderInRoot, <API request for next page>, orderBy) -> { page:
   *                                                      [FolderInFolderInRoot102,
   *                                                      FolderInFolderInRoot101],
   *                                                      nextPage: undefined
   *                                                    } // sorted by creationDate descending
   * ```
   **/
  async getFolderChildrenAsync(
    folder: LfRepoTreeNode,
    nextPage?: string,
    orderBy?: ColumnOrderBy
  ): Promise<LfTreeNodePage> {
    let listChildrenEntriesResponse: ODataValueContextOfIListOfEntry;
    if (!nextPage) {
      listChildrenEntriesResponse = await this.getFolderChildrenFirstPageAsync(folder, orderBy);
    } else {
      listChildrenEntriesResponse = await this.repoClient.entriesClient.getEntryListingNextLink({
        nextLink: nextPage,
        maxPageSize: 100,
      });
    }
    const dataMap = this.parseFolderChildrenResponse(folder, listChildrenEntriesResponse);
    const nextPageLink: string | undefined = listChildrenEntriesResponse.odataNextLink;
    return Promise.resolve({
      page: dataMap,
      nextPage: nextPageLink,
    });
  }

  /**
   * Returns the root LfTreeNode
   * @example
   * ```ts
   * // suppose the repository is structured as below
   * - root
   *      - DocInRoot
   *      - FolderInRoot1
   *            - DocInFolderInRoot
   *            - FolderInFolderInRoot
   *      - FolderInRoot2
   * const service = new LfRepoTreeNodeService(repoClient);
   * await service.getRootTreeNodeAsync() // returns the root node, with id of 1
   * ```
   */
  async getRootTreeNodeAsync(): Promise<LfRepoTreeNode> {
    const repoName: string = await this.repoClient.getCurrentRepoName();
    const repoId: string = await this.repoClient.getCurrentRepoId();
    const rootEntry: Entry = await this.repoClient.entriesClient.getEntry({
      repoId,
      entryId: rootFolderId,
    });
    const treeNode = this.createRootFolderNode(repoName, rootEntry);
    return treeNode;
  }

  private createRootFolderNode(repoName: string, rootEntry: Entry) {
    const icon = this.getSingleIconForEntryType(EntryType.Folder);
    const treeNode = this.createFolderNode(repoName, '\\', rootFolderId, EntryType.Folder, icon);
    this.setColumnAttributesForEntry(rootEntry, treeNode);
    return treeNode;
  }

  async getTreeNodeById(id: string): Promise<LfTreeNode> {
    const repoName: string = await this.repoClient.getCurrentRepoName();
    const repoId: string = await this.repoClient.getCurrentRepoId();
    const pathToNode: string = id;

    const entryFound: FindEntryResult = await this.repoClient.entriesClient.getEntryByPath({
      repoId,
      fullPath: pathToNode,
    });

    if (entryFound.entry) {
      const entryWithSpecifiedPath: Entry = entryFound.entry;
      let treeNode: LfTreeNode;
      if (entryWithSpecifiedPath.id === 1) {
        treeNode = this.createRootFolderNode(repoName, entryWithSpecifiedPath);
      } else {
        treeNode = this.createNonRootLfRepoTreeNode(entryWithSpecifiedPath);
      }

      return treeNode;
    } else {
      throw new Error(`Unable to get entry with path: ${pathToNode}`);
    }
  }

  private createNonRootLfRepoTreeNode(entry: Entry, parent?: LfRepoTreeNode): LfRepoTreeNode {
    let treeNode: LfRepoTreeNode | undefined;
    let entryName: string | undefined = entry.name;
    if (!entryName || entryName.length === 0) {
      entryName = entry.id.toString();
    }
    let path: string = entry.fullPath;
    if (!path && parent) {
      path = this.getFullPath(parent, entryName);
    }

    if (!path) {
      // TODO should we catch this here and get root, or throw service method to UI?
      throw new Error(`Unable to determine path of entry: ${entry.id}`);
    }


    const targetEntryType: EntryType = (entry as Shortcut).targetType
      ? (entry as Shortcut).targetType
      : entry.entryType;

    if (!targetEntryType) {
      throw new Error(`Entry type is undefined for entry: ${entry.id}`);
    }

    const icon = this.getIconsForEntry(entry, parent);
  
    switch (targetEntryType) {
      case EntryType.Folder:
      case EntryType.RecordSeries:
        treeNode = this.createFolderNode(entryName, path, entry.id, entry.entryType, icon);
        break;
      case EntryType.Document:
        treeNode = this.createLeafNode(entryName, path, entry.id, entry.entryType, icon);
        break;
      default:
        throw new Error(`Unsupported entry type for entry: ${entry.id}`);
    }

    this.setColumnAttributesForEntry(entry, treeNode);
    this.setTargetIdAndTypeForShortcut(entry, treeNode);
    return treeNode;
  }

  private getSingleIconForEntryType(entryType: EntryType, parent?: LfRepoTreeNode, extension?: string): string {
    switch (entryType) {
      case EntryType.Folder: {
        const isParentShortcutRecordSeries =
          parent?.entryType === EntryType.Shortcut && parent?.targetType === EntryType.RecordSeries;
        const isParentRecordSeries = parent?.entryType === EntryType.RecordSeries;
        if (isParentRecordSeries || isParentShortcutRecordSeries) {
          return IconUtils.getDocumentIconUrlFromIconId('recordfolder-20');
        } else {
          return IconUtils.getDocumentIconUrlFromIconId('folder-20');
        }
      }
      case EntryType.RecordSeries: {
        return IconUtils.getDocumentIconUrlFromIconId('recordseries-20');
      }
      case EntryType.Document: {
        if (extension) {
          const iconId = IconUtils.getDocumentIconIdFromExtension(extension);
          return IconUtils.getDocumentIconUrlFromIconId(iconId);
        } else {
          return IconUtils.getDocumentIconUrlFromIconId('document-20');
        }
      }
      case EntryType.Shortcut: {
        return IconUtils.getDocumentIconUrlFromIconId('shortcut-overlay');
      }
      default: {
        throw new Error('unsupported entry type');
      }
    }
  }

  private isViewable(entry: Entry): boolean {
    return (
      (this.viewableEntryTypes?.includes(entry.entryType) && entry.entryType !== EntryType.Shortcut) ||
      (this.viewableEntryTypes?.includes(EntryType.Shortcut) &&
        entry.entryType === EntryType.Shortcut &&
        this.viewableEntryTypes?.includes((entry as Shortcut).targetType))
    );
  }

  private valueToPropertyValue(value: string | Date | number | undefined, columnId: string | undefined): PropertyValue {
    let displayValue: string = value ? value.toString() : undefined;

    switch (columnId) {
      case 'creationTime':
      case 'lastModifiedTime': {
        const date = new Date(value);
        displayValue = new Intl.DateTimeFormat('en-US', {
          year: 'numeric',
          month: 'numeric',
          day: 'numeric',
          hour: 'numeric',
          minute: 'numeric',
          second: 'numeric',
        }).format(date);
        break;
      }
      case 'elecDocumentSize': {
        if (value) {
          displayValue = StringUtils.convertBytesToString(value as number, 2);
        }
        break;
      }
      default:
      // pass
    }
    return { value: value, displayValue: displayValue } as PropertyValue;
  }

  private setColumnAttributesForEntry(entry: Document | Folder | Shortcut | RecordSeries, node: LfRepoTreeNode) {
    if (this.columnIds) {
      for (const columnId of this.columnIds) {
        node.attributes.set(columnId, this.valueToPropertyValue(entry[columnId], columnId));
      }
    }
  }

  private setTargetIdAndTypeForShortcut(entry: Entry, node: LfRepoTreeNode) {
    if (entry.entryType === EntryType.Shortcut) {
      const shortcut = entry as Shortcut;
      node.targetId = shortcut.targetId;
      node.targetType = shortcut.targetType;
    }
  }

  private getIconsForEntry(entry: Entry, parent?: LfRepoTreeNode) {
    const entryType = entry.entryType;
    const extension = (entry as Document).extension;
    let icon: string | string[] = this.getSingleIconForEntryType(entryType, parent, extension);
    if (entry.entryType === EntryType.Shortcut) {
      const shortcutIcon = icon;
      const targetIcon = this.getSingleIconForEntryType((entry as Shortcut).targetType, parent, extension);
      icon = [targetIcon, shortcutIcon];
    }
    return icon;
  }

  private getFullPath(parent: LfRepoTreeNode, entryName: string) {
    let path = PathUtils.combinePaths(parent.path, entryName);
    if (path.endsWith('\\') && path.length > 1) {
      path = path.slice(0, -1);
    }
    return path;
  }

  private createFolderNode(
    entryName: string,
    path: string,
    id: number,
    entryType: EntryType,
    icon: string | string[]
  ): LfRepoTreeNode {
    const folderNode: LfRepoTreeNode = {
      name: entryName,
      path: path,
      id: id.toString(),
      entryType,
      icon,
      isContainer: true,
      isLeaf: false,
      attributes: new Map<string, PropertyValue>(),
    };
    return folderNode;
  }

  private createLeafNode(
    entryName: string,
    path: string,
    id: number,
    entryType: EntryType,
    icon: string | string[]
  ): LfRepoTreeNode {
    const leafNode: LfRepoTreeNode = {
      name: entryName,
      path,
      id: id.toString(),
      entryType,
      icon,
      isContainer: false,
      isLeaf: true,
      attributes: new Map<string, PropertyValue>(),
    };
    return leafNode;
  }

  private async getFolderChildrenFirstPageAsync(
    folder: LfRepoTreeNode,
    orderBy?: ColumnOrderBy
  ): Promise<ODataValueContextOfIListOfEntry> {
    let entryId: number;
    if (folder.targetId) {
      entryId = folder.targetId;
    } else {
      entryId = parseInt(folder.id, 10);
    }
    const repoId: string = await this.repoClient.getCurrentRepoId();
    if (orderBy && !defaultSupportedColumnIds.includes(orderBy.columnId)) {
      orderBy = undefined;
      console.error(`Cannot order by unsupported column: ${orderBy.columnId}`);
    }

    const requestParameters = getFolderChildrenDefaultParameters(repoId, entryId, this.columnIds, orderBy);
    const listChildrenEntriesResponse: ODataValueContextOfIListOfEntry =
      await this.repoClient.entriesClient.getEntryListing(requestParameters);
    return listChildrenEntriesResponse;
  }

  private parseFolderChildrenResponse(
    parent: LfRepoTreeNode,
    listChildrenEntriesResponse: ODataValueContextOfIListOfEntry
  ): LfRepoTreeNode[] {
    const dataMap: LfRepoTreeNode[] = [];
    const childrenEntries: Entry[] | undefined = listChildrenEntriesResponse.value;
    if (childrenEntries) {
      for (const childEntry of childrenEntries) {
        if (this.isViewable(childEntry)) {
          const childNode: LfRepoTreeNode = this.createNonRootLfRepoTreeNode(childEntry, parent);
          dataMap.push(childNode);
        }
      }
    }
    return dataMap;
  }

  private getParentPath(path: string): string {
    if (path === '\\') {
      return undefined;
    }
    const paths = path.split('\\');
    paths.pop(); // remove self
    return paths.join('\\');
  }
}
