import { LfRepoTreeNode } from '../helper-types/lf-repo-browser-types';
import {
  LfLocalizationService,
  IconUtils,
  PathUtils,
  StringUtils
} from '@laserfiche/lf-js-utils';
import { getFolderChildrenDefaultParameters } from '../utils/repo-client-utils.js';
import { Entry, Document, Folder, Shortcut, RecordSeries, ODataValueContextOfIListOfEntry, EntryType, FindEntryResult } from '@laserfiche/lf-repository-api-client';
import { IRepositoryApiClientEx } from '../helper-types/repository-api-ex.js';
import { defaultSupportedColumnIds } from '../helper-types/lf-repo-browser-types';
import { ColumnOrderBy, LfTreeNodePage, LfTreeNodeService, PropertyValue } from '@laserfiche/types-lf-ui-components';
export const nodeAttrName_extension = 'extension';
export const nodeAttrName_elecDocumentSize = 'elecDocumentSize';
export const nodeAttrName_templateName = 'templateName';
export const nodeAttrName_creationTime = 'creationTime';

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

  constructor(
    private repoClient: IRepositoryApiClientEx,
  ) {
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
        const parentEntry: FindEntryResult = await this.repoClient.entriesClient.getEntryByPath({ repoId, fullPath: parentPath });
        if (parentEntry.entry && parentEntry.entry.entryType === EntryType.Folder) {
          const foundParentEntry = parentEntry.entry;
          if (foundParentEntry.id === 1) {
          return this.getRootTreeNodeAsync();
          }
          const parentNode = this.createFolderNodeWithPath(foundParentEntry.name, parentPath, foundParentEntry.id);
          this.setNodeProperties(parentNode, foundParentEntry);
          return parentNode;
        }
        else {
          throw new Error('Parent is not found');
        }
      }
      else {
        return this.getRootTreeNodeAsync();
      }

    }
    catch (err: any) {
      if (err.errorCode === 9013) {
        const rootNode = await this.getRootTreeNodeAsync();
        return rootNode;
      }
      else {
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
  async getFolderChildrenAsync(folder: LfRepoTreeNode, nextPage?: string, orderBy?: ColumnOrderBy): Promise<LfTreeNodePage> {
    const repoName: string = await this.repoClient.getCurrentRepoName();
    let listChildrenEntriesResponse: ODataValueContextOfIListOfEntry;
    if (!nextPage) {
      listChildrenEntriesResponse = await this.getFolderChildrenFirstPageAsync(folder, orderBy);
    }
    else {
      listChildrenEntriesResponse = await this.repoClient.entriesClient.getEntryListingNextLink({ nextLink: nextPage, maxPageSize: 100 })
    }
    const dataMap = this.parseFolderChildrenResponse(folder, repoName, listChildrenEntriesResponse);
    const nextPageLink: string | undefined = listChildrenEntriesResponse.odataNextLink;
    return Promise.resolve({
      page: dataMap,
      nextPage: nextPageLink
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
   * service.getRootTreeNodeAsync() // returns the root node, with id of 1
   * ```
   */
  async getRootTreeNodeAsync(): Promise<LfRepoTreeNode> {
    const repoName: string = await this.repoClient.getCurrentRepoName();
    const repoId: string = await this.repoClient.getCurrentRepoId();
    const rootFolderId: number = 1;
    const treeNode = this.createFolderNodeWithPath(repoName, '\\', rootFolderId);
    const rootEntry: Entry = await this.repoClient.entriesClient.getEntry(
      {
        repoId,
        entryId: rootFolderId
      }
    );
    this.setNodeProperties(treeNode, rootEntry);
    return treeNode;
  }

  /**
   * Converts an Entry to the corresponding LfRepoTreeNode and returns it
   * @param entry entry
   * @param parent parent LfRepoTreeNode
   * @returns the corresponding LfRepoTreeNode
   * @example
   * ```ts
   * const entry: Shortcut = createShortcut({
   *  id: 14,
   *  name: 'shortcutFolder',
   *  fullPath: '\\shortcutFolder',
   *  entryType: EntryType.Shortcut,
   *  targetId: 20000,
   *  targetType: EntryType.Folder
   * });
   * const service = new LfRepoTreeNodeService(repoClient);
   * service.createLfRepoTreeNodeWithParent(entry, { id: 1, path: '\\parent', name: 'root'});
   * // returns {
   *  name: 'dummyShortcutFolder',
   *  path: '\\parent\\dummyShortcutFolder',
   *  id: '14',
   *  icon: [
   *   "https://lfxstatic.com/npm/@laserfiche/lf-resource-library@4/resources/icons/document-icons.svg#folder-20",
   *   "https://lfxstatic.com/npm/@laserfiche/lf-resource-library@4/resources/icons/document-icons.svg#shortcut-overlay",
   *  ],
   *  isContainer: true,
   *  isLeaf: false,
   *  attributes: new Map<string, string>(),
   *  entryType: EntryType.Shortcut,
   *  targetId: 20000,
   *  targetType: EntryType.Folder
   * };
   *  ```
   */
  createLfRepoTreeNodeWithParent(entry: Entry, parent: LfRepoTreeNode): LfRepoTreeNode {
    let treeNode: LfRepoTreeNode | undefined;
    if (!entry.entryType) {
      throw new Error('entry type is undefined');
    }
    switch (entry.entryType) {
      case EntryType.Folder:
        treeNode = this.createFolderNodeWithParent(entry, parent);
        break
      case EntryType.RecordSeries:
        treeNode = this.createFolderNodeWithParent(entry, parent);
        break
      case EntryType.Document:
        treeNode = this.createLeafNode(entry, parent);
        break
      case EntryType.Shortcut:
          switch ((entry as Shortcut).targetType) {
            case EntryType.Folder:
              treeNode = this.createFolderNodeWithParent(entry as Shortcut, parent);
              break
            case EntryType.RecordSeries:
              treeNode = this.createFolderNodeWithParent(entry as Shortcut, parent);
              break
            case EntryType.Document:
              treeNode = this.createLeafNode(entry as Shortcut, parent);
              break
            default:
              throw new Error('Unexpected shortcut targetType');
          }
          break
      default:
        throw new Error('Unsupported entry type');
    }
    this.setNodeProperties(treeNode, entry, parent);
    return treeNode;
  }

  private isViewable(entry: Entry): boolean {
    return (this.viewableEntryTypes?.includes(entry.entryType) && entry.entryType !== EntryType.Shortcut)
      || (this.viewableEntryTypes?.includes(EntryType.Shortcut) && entry.entryType === EntryType.Shortcut && this.viewableEntryTypes?.includes((entry as Shortcut).targetType));
  }

  private createLeafNode(entry: Entry, parent: LfRepoTreeNode): LfRepoTreeNode {
    let entryName: string | undefined = entry.name;
    if (!entryName || entryName.length === 0) {
      entryName = entry.id.toString();
    }
    const path = this.getFullPath(parent, entry.name)

    const leafNode: LfRepoTreeNode = {
      name: entryName,
      path: path,
      id: entry.id!.toString(),
      entryType: entry.entryType,
      icon: [],
      isContainer: false,
      isLeaf: true,
      attributes: new Map<string, PropertyValue>()
    };
    return leafNode;
  }

  private valueToPropertyValue(value: string | Date | number | undefined, columnId: string | undefined): PropertyValue {
    let displayValue: string = value ? value.toString() : undefined;

    switch (columnId) {
      case 'creationTime':
      case 'lastModifiedTime': {
        const date = new Date(value);
        displayValue = new Intl.DateTimeFormat('en-US', { year: 'numeric', month: 'numeric', day: 'numeric', hour: 'numeric', minute: 'numeric', second: 'numeric' }).format(date);
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

  private setNodeProperties(node: LfRepoTreeNode, entry: Entry, parent?: LfRepoTreeNode): void {
    this.setAttributesForEntry(entry, node);
    if (entry.entryType === EntryType.Document) {
      const document = entry as Document;
      if (document.extension) {
        const iconId = IconUtils.getDocumentIconIdFromExtension(document.extension);
        node.icon = IconUtils.getDocumentIconUrlFromIconId(iconId);
      }
      else {
        node.icon = IconUtils.getDocumentIconUrlFromIconId('document-20');
      }
    }
    else if (entry.entryType === EntryType.Folder) {
      if (parent?.entryType === EntryType.RecordSeries ||
        (parent?.entryType === EntryType.Shortcut && parent?.targetType === EntryType.RecordSeries)) {
        node.icon = IconUtils.getDocumentIconUrlFromIconId('recordfolder-20');
      }
      else {
        node.icon = IconUtils.getDocumentIconUrlFromIconId('folder-20');
      }
    }
    else if (entry.entryType === EntryType.RecordSeries) {
      node.icon = IconUtils.getDocumentIconUrlFromIconId('recordseries-20');
    }
    else if (entry.entryType === EntryType.Shortcut) {
      const shortcut = entry as Shortcut;
      // TODO: shortcut doesn't have elecDocumentSize
      node.targetType = shortcut.targetType;
      node.targetId = shortcut.targetId;
      if (shortcut.targetType === EntryType.Document) {
        const iconId = shortcut.extension ? IconUtils.getDocumentIconIdFromExtension(shortcut.extension) : undefined;
        const iconUrl = IconUtils.getDocumentIconUrlFromIconId(iconId ?? 'document-20');
        const shortcutUrl = IconUtils.getDocumentIconUrlFromIconId('shortcut-overlay');
        node.icon = [iconUrl, shortcutUrl];
      } else if (shortcut.targetType === EntryType.Folder) {
        const iconUrl = IconUtils.getDocumentIconUrlFromIconId('folder-20');
        const shortcutUrl = IconUtils.getDocumentIconUrlFromIconId('shortcut-overlay');
        node.icon = [iconUrl, shortcutUrl];
      } else if (shortcut.targetType === EntryType.RecordSeries) {
        const iconUrl = IconUtils.getDocumentIconUrlFromIconId('recordseries-20');
        const shortcutUrl = IconUtils.getDocumentIconUrlFromIconId('shortcut-overlay');
        node.icon = [iconUrl, shortcutUrl];
      } else {
        throw new Error('unsupported shortcut targetType');
      }
    }
    else {
      throw new Error('unsupported entryType');
    }
  }

  private setAttributesForEntry(entry: Document | Folder | Shortcut | RecordSeries, node: LfRepoTreeNode) {
    if (this.columnIds) {
      for (const columnId of this.columnIds) {
        node.attributes.set(columnId, this.valueToPropertyValue(entry[columnId], columnId));
      }
    }
  }

  private createFolderNodeWithParent(entry: Entry, parent: LfRepoTreeNode): LfRepoTreeNode {
    if (!entry.id) {
      throw new Error('entryId is undefined');
    }
    let entryName: string | undefined = entry.name;
    if (!entryName || entryName.length === 0) {
      entryName = entry.id.toString();
    }
    const path = this.getFullPath(parent, entryName);

    const folderNode: LfRepoTreeNode = {
      name: entryName,
      path: path,
      id: entry.id!.toString(),
      entryType: entry.entryType,
      icon: [],
      isContainer: true,
      isLeaf: false,
      attributes: new Map<string, PropertyValue>()
    };
    return folderNode;
  }

  private getFullPath(parent: LfRepoTreeNode, entryName: string) {
    let path = PathUtils.combinePaths(parent.path, entryName);
    if (path.endsWith('\\') && path.length > 1) {
      path = path.slice(0, -1);
    }
    return path;
  }

  private createFolderNodeWithPath(entryName: string, path: string, id: number): LfRepoTreeNode {
    if (!entryName || !path || !id) {
      throw new Error('failed to create folder node with path');
    }
    const folderNode: LfRepoTreeNode = {
      name: entryName,
      path: path,
      id: id.toString(),
      entryType: EntryType.Folder,
      icon: [],
      isContainer: true,
      isLeaf: false,
      attributes: new Map<string, PropertyValue>()
    };
    return folderNode;
  }

  private async getFolderChildrenFirstPageAsync(folder: LfRepoTreeNode, orderBy?: ColumnOrderBy): Promise<ODataValueContextOfIListOfEntry> {
    let entryId: number;
    if (folder.targetId) {
      entryId = folder.targetId;
    }
    else {
      entryId = parseInt(folder.id, 10);
    }
    const repoId: string = await this.repoClient.getCurrentRepoId();
    if (orderBy && !defaultSupportedColumnIds.includes(orderBy.columnId)) {
      orderBy = undefined;
      console.error(`Cannot order by unsupported column: ${orderBy.columnId}`);
    }

    const requestParameters = getFolderChildrenDefaultParameters(repoId, entryId, this.columnIds, orderBy);
    const listChildrenEntriesResponse: ODataValueContextOfIListOfEntry = await this.repoClient.entriesClient.getEntryListing(
      requestParameters
    );
    return listChildrenEntriesResponse;
  }

  private parseFolderChildrenResponse(parent: LfRepoTreeNode, repoName: string, listChildrenEntriesResponse: ODataValueContextOfIListOfEntry): LfRepoTreeNode[] {
    const dataMap: LfRepoTreeNode[] = [];
    const childrenEntries: Entry[] | undefined = listChildrenEntriesResponse.value;
    if (childrenEntries) {
      for (const childEntry of childrenEntries) {
        if (this.isViewable(childEntry)) {
          const childNode: LfRepoTreeNode = this.createLfRepoTreeNodeWithParent(childEntry, parent);
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

