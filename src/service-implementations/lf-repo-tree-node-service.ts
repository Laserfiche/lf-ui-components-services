import { LfTreeNodeService, LfTreeNodePage } from '@laserfiche/types-lf-ui-components';
import { LfRepoTreeNode } from '../helper-types/lf-repo-browser-types';
import {
  LfLocalizationService,
  IconUtils,
  PathUtils
} from '@laserfiche/lf-js-utils';
import { getFolderChildrenDefaultParametersAsync } from '../utils/repo-client-utils.js';
import { Entry, Shortcut, Document, ODataValueContextOfIListOfEntry, EntryType } from '@laserfiche/lf-repository-api-client';
import { IRepositoryApiClientEx } from '../helper-types/repository-api-ex.js';

export const nodeAttrName_extension = 'extension';
export const nodeAttrName_elecDocumentSize = 'elecDocumentSize';
export const nodeAttrName_templateName = 'templateName';

export class LfRepoTreeNodeService implements LfTreeNodeService {

  /**
   * An array containing entryTypes (defined in '@laserfiche/lf-repository-api-client') for viewable entries
   * @example
   * ```ts
   * const service = new LfRepoTreeNodeService(repoClient);
   * service.viewableEntryTypes = [EntryType.Folder]; // entries of other types (document, shortcut) are not viewable
   * ```
   */
  viewableEntryTypes: EntryType[] = [];

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
    const repoName: string = await this.repoClient.getCurrentRepoName();
    if (treeNode.id === '1') {
      return undefined;
    }
    if (treeNode.path?.endsWith('\\')) {
      treeNode.path = treeNode.path.slice(0,-1);
    }

    try {
      const parentPath = this.getParentPath(treeNode.path);
      if (parentPath) {
        const parentEntry = await this.getFolderEntryAsync(parentPath);
        if (parentEntry) {
          return this.createNode(parentEntry, repoName);
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
      }
      else {
        throw err;
      }
    }
  }

  /**
   * Requests a page of size 20 containing the children of the parent tree node, sorted by name, ascending.
   * Only returns the viewable children.
   * @param folder: LfTreeNode representing the folder to get data from
   * @param nextPage: string representing the next page requested. If undefined, the first page is returned
   * @example
   * ```ts
   * // suppose the repository is structured as below
   * - root
   *      - DocInRoot
   *      - FolderInRoot
   *            - DocInFolderInRoot
   *            - FolderInFolderInRoot
   *            - FolderInFolderInRoot1
   *            - FolderInFolderInRoot2
   *            ...
   *            - FolderInFolderInRoot17
   *            - FolderInFolderInRoot18
   *            - FolderInFolderInRoot19
   *            - FolderInFolderInRoot20
   *            - FolderInFolderInRoot21
   *      - FolderInRoot1
   *      - FolderInRoot2
   *      - FolderInRoot3
   * const service = new LfRepoTreeNodeService(repoClient);
   * service.viewableEntryTypes = [EntryType.Folder];
   * service.getFolderChildrenAsync(FolderInRoot) -> { page:
   *                                                      [FolderInFolderInRoot,
   *                                                      FolderInFolderInRoot1,
   *                                                      FolderInFolderInRoot2,
   *                                                      ...
   *                                                      FolderInFolderInRoot17,
   *                                                      FolderInFolderInRoot18],
   *                                                      nextPage: <API request for next page>
   *                                                    }  // no DocInFolderInRoot because it is not viewable
   * service.getFolderChildrenAsync(FolderInRoot, <API request for next page>) -> { page:
   *                                                      [FolderInFolderInRoot19,
   *                                                      FolderInFolderInRoot20,
   *                                                      FolderInFolderInRoot21],
   *                                                      nextPage: undefined
   *                                                    }
   * ```
   **/
  async getFolderChildrenAsync(folder: LfRepoTreeNode, nextPage?: string | undefined): Promise<LfTreeNodePage> {
    const repoName: string = await this.repoClient.getCurrentRepoName();
    let listChildrenEntriesResponse: ODataValueContextOfIListOfEntry;
    if (!nextPage) {
      listChildrenEntriesResponse = await this.getFolderChildrenFirstPageAsync(folder);
    }
    else {
      listChildrenEntriesResponse = await this.repoClient.entriesClient.getEntryListingNextLink({ nextLink: nextPage, maxPageSize: 20 })
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
   *      - FolderInRoot
   *            - DocInFolderInRoot
   *            - FolderInFolderInRoot
   *            - FolderInFolderInRoot1
   *            - FolderInFolderInRoot2
   *            ...
   *            - FolderInFolderInRoot17
   *            - FolderInFolderInRoot18
   *            - FolderInFolderInRoot19
   *            - FolderInFolderInRoot20
   *            - FolderInFolderInRoot21
   *      - FolderInRoot1
   *      - FolderInRoot2
   *      - FolderInRoot3
   * const service = new LfRepoTreeNodeService(repoClient);
   * service.getRootTreeNodeAsync(FolderInRoot) -> root
   * ```
   */
  async getRootTreeNodeAsync(): Promise<LfRepoTreeNode> {
    const repoName: string = await this.repoClient.getCurrentRepoName();
    const repoId: string = await this.repoClient.getCurrentRepoId();
    const rootFolderId: number = 1;
    const rootEntry: Entry = await this.repoClient.entriesClient.getEntry(
      {
        repoId,
        entryId: rootFolderId
      }
    );
    return this.createNode(rootEntry, repoName);
  }

  private isViewable(entry: Entry): boolean {
    return entry.entryType !== EntryType.RecordSeries && (this.viewableEntryTypes.includes(entry.entryType)
      || (entry.entryType === EntryType.Shortcut && this.viewableEntryTypes.includes((entry as Shortcut).targetType)));
  }

  private createNode(entry: Entry, repoName: string, parent?: LfRepoTreeNode): LfRepoTreeNode {
    let treeNode: LfRepoTreeNode | undefined;
    if (!entry.entryType) {
      throw new Error('entry type is undefined');
    }
    if (entry.entryType === EntryType.Folder) {
      treeNode = this.createFolderNode(entry, repoName, parent);
    } else if (entry.entryType === EntryType.Document) {
      treeNode = this.createLeafNode(entry, parent);
    } else if (entry.entryType === EntryType.Shortcut) {
      const shortcut = entry as Shortcut;
      if (shortcut.targetType === EntryType.Folder) {
        treeNode = this.createFolderNode(shortcut, repoName, parent);
      } else if (shortcut.targetType === EntryType.Document) {
        treeNode = this.createLeafNode(shortcut, parent);
      }
      else {
        throw new Error('Unexpected shortcut targetType');
      }
    } else {
      throw new Error('Unsupported entry type');
    }
    this.setNodeAttributes(treeNode, entry);
    return treeNode;
  }

  private createLeafNode(entry: Entry, parent?: LfRepoTreeNode): LfRepoTreeNode {

    const path = parent ? PathUtils.combinePaths(parent.path, entry.name) : entry.fullPath;
    if (!path) {
      throw new Error('entry fullPath is undefined');
    }

    const leafNode: LfRepoTreeNode = {
      name: entry.name!,
      path: path,
      id: entry.id!.toString(),
      entryType: entry.entryType,
      icon: [],
      isContainer: false,
      isLeaf: true,
      attributes: new Map<string, any>()
    };
    return leafNode;
  }

  private setNodeAttributes(node: LfRepoTreeNode, entry: Entry): void {
    if (entry.templateName) {
      node.attributes.set(nodeAttrName_templateName, entry.templateName);
    }
    if (entry.entryType === EntryType.Document) {
      const document = entry as Document;
      if (document.extension) {
        node.attributes.set(nodeAttrName_extension, document.extension);
        const iconId = IconUtils.getDocumentIconIdFromExtension(document.extension);
        node.icon = IconUtils.getDocumentIconUrlFromIconId(iconId);
      }
      else {
        node.icon = IconUtils.getDocumentIconUrlFromIconId('document-20');

      }
      if (document.elecDocumentSize) {
        node.attributes.set(nodeAttrName_elecDocumentSize, document.elecDocumentSize);
      }
    }
    else if (entry.entryType === EntryType.Folder) {
      node.icon = IconUtils.getDocumentIconUrlFromIconId('folder-20');
    }
    else if (entry.entryType === EntryType.Shortcut) {
      const shortcut = entry as Shortcut;
      node.targetType = shortcut.targetType;
      node.targetId = shortcut.targetId;
      if (shortcut.targetType === EntryType.Document) {
        if (shortcut.extension) {
          node.attributes.set(nodeAttrName_extension, shortcut.extension);
        }
        const iconId = shortcut.extension ? IconUtils.getDocumentIconIdFromExtension(shortcut.extension) : undefined;
        const iconUrl = IconUtils.getDocumentIconUrlFromIconId(iconId ?? 'document-20');
        const shortcutUrl = IconUtils.getDocumentIconUrlFromIconId('shortcut-overlay');
        node.icon = [iconUrl, shortcutUrl];
      } else {
        const iconUrl = IconUtils.getDocumentIconUrlFromIconId('folder-20');
        const shortcutUrl = IconUtils.getDocumentIconUrlFromIconId('shortcut-overlay');
        node.icon = [iconUrl, shortcutUrl];
      }
    }
    else {
      throw new Error('unsupported entryType');
    }
  }

  private createFolderNode(entry: Entry, repoName: string, parent?: LfRepoTreeNode): LfRepoTreeNode {
    if (!entry.id) {
      throw new Error('entryId is undefined');
    }
    if (parent && !parent.path) {
      throw new Error('path is undefined on parent entry');
    }
    let entryName: string | undefined = entry.name;
    let path: string;
    if (entry.id === 1) {
      // rootNode does not have a name, default into repoName
      path = '\\';
      if (!entryName || entryName.length === 0) {
        entryName = repoName;
      }
    }
    else {
      if (!entryName || entryName.length === 0) {
        entryName = entry.id.toString();
      }
      path = parent ? PathUtils.combinePaths(parent.path, entryName) : entry.fullPath;
      if (!path) {
        throw new Error('fullPath is undefined');
      }
      else if (path.endsWith('\\') && path.length > 1) {
        path = path.slice(0,-1);
      }
    }

    const folderNode: LfRepoTreeNode = {
      name: entryName,
      path: path,
      id: entry.id!.toString(),
      entryType: entry.entryType,
      icon: [],
      isContainer: true,
      isLeaf: false,
      attributes: new Map<string, any>()
    };
    return folderNode;
  }

  private async getFolderChildrenFirstPageAsync(folder: LfRepoTreeNode): Promise<ODataValueContextOfIListOfEntry> {
    let entryId: number;
    if (folder.targetId) {
      entryId = folder.targetId;
    }
    else {
      entryId = parseInt(folder.id, 10);
    }
    const repoId: string = await this.repoClient.getCurrentRepoId();
    const requestParameters = await getFolderChildrenDefaultParametersAsync(repoId, entryId);
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
          const childNode: LfRepoTreeNode = this.createNode(childEntry, repoName, parent);
          dataMap.push(childNode);
        }
      }
    }
    return dataMap;
  }
  private async getFolderEntryAsync(path: string): Promise<Entry | undefined> {
    const folderNames: string[] = PathUtils.getListOfFolderNames(path);
    const rootId = 1;
    let parentId: number = rootId;
    let foundParentFolder: Entry;
    let needToCreateRestOfFolders: boolean = false; // Stop checking for existing subfolder if we know it won't exist (fewer API calls)

    for (const folderName of folderNames) {
      if (!needToCreateRestOfFolders) {
        const foundSubfolder = await this.findSubfolderByNameAsync(parentId, folderName);
        if (foundSubfolder) {
          if (foundSubfolder.id) {
            let entryId: number;
            if (foundSubfolder.entryType === EntryType.Shortcut) {
              const shortcut = foundSubfolder as Shortcut;
              entryId = shortcut.targetId;
              foundSubfolder.id = shortcut.targetId;
            } else {
              entryId = foundSubfolder.id;
            }
            parentId = entryId;
            foundParentFolder = foundSubfolder;
            continue;
          } else {
            throw new Error('Failed to find folder');
          }
        }
      }
      needToCreateRestOfFolders = true;
    }
    if (foundParentFolder) {
      foundParentFolder.fullPath = path;
    }
    return foundParentFolder;
  }



  private async findSubfolderByNameAsync(parentEntryId: number, subfolderName: string): Promise<Entry | undefined> {
    const repoId: string = await this.repoClient.getCurrentRepoId();
    const requestParameters = await getFolderChildrenDefaultParametersAsync(repoId, parentEntryId);
    const childrenEntries: Entry[] = [];
    await this.repoClient.entriesClient.getEntryListingForEach({
      callback: async (listOfEntries) => {
        if (listOfEntries.value) {
          childrenEntries.push(...listOfEntries.value);
        }
        return true;
      },
      ...requestParameters,
    });
    const foundSubfolder: Entry | undefined = childrenEntries?.find(
      (entry: Entry) =>
        entry.name === subfolderName &&
        (entry.entryType === EntryType.Folder ||
          (entry.entryType === EntryType.Shortcut && (entry as Shortcut).targetType === EntryType.Folder))
    );
    return foundSubfolder;
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

