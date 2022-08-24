import { LfTreeNodeService, LfTreeNodePage, LfTreeNode } from '@laserfiche/types-lf-ui-components';
import { LfRepoTreeEntryType, LfRepoTreeNode, LfRepoTreeNodePage } from '../helper-types/lf-repo-browser-types';
import {
  LfLocalizationService,
  IconUtils,
  PathUtils
} from '@laserfiche/lf-js-utils';
import { getFolderChildrenDefaultParametersAsync } from '../utils/repo-client-utils.js';
import { Entry, Shortcut, Document, ODataValueContextOfIListOfEntry, EntryType } from '@laserfiche/lf-repository-api-client';
import { IRepositoryApiClientEx } from '../helper-types/repository-api-ex.js';

export class LfRepoTreeNodeService implements LfTreeNodeService {

  viewableEntryTypes: LfRepoTreeEntryType[] = Object.values(LfRepoTreeEntryType);

  private localizationService = new LfLocalizationService();

  private cachedNodes: Record<string, LfRepoTreeNode> = {};
  private cachedChildNodes: Record<string, Record<string, LfRepoTreeNodePage>> = {};

  constructor(
    private repoClient: IRepositoryApiClientEx,
  ) { }

  async getParentTreeNodeAsync(treeNode: LfRepoTreeNode): Promise<LfTreeNode | undefined> {
    if (!this.repoClient) {
      console.error('getParentNodeAsync() _selectedRepositoryClient was undefined');
      throw new Error(this.localizationService.getString('ERRORS.ENTRY_NOT_FOUND'));
    }

    if (!treeNode.parentId) {
      return undefined;
    }

    try {
      const parentNode = await this.getTreeNodeByIdAsync(treeNode.parentId);
      return parentNode;
    }
    catch (err: any) {
      if (err.message === 'Access denied. [9013]') {
        const rootNode = await this.getTreeNodeByIdAsync('1');
        return rootNode;
      }
    }

    return await this.getTreeNodeByIdAsync(treeNode.parentId);
  }

  async getTreeNodeByIdAsync(id: string): Promise<LfTreeNode | undefined> {
    if (!this.repoClient) {
      console.error('getTreeNodeByIdAsync() _selectedRepositoryClient was undefined');
      throw new Error(this.localizationService.getString('ERRORS.ENTRY_NOT_FOUND'));
    }

    if (this.cachedNodes[id]) {
      // eslint-disable-next-line no-restricted-syntax
      console.debug(`using cached entry ${id}`);
      return this.cachedNodes[id];
    }

    else {
      if (isNaN(parseInt(id, 10))) {
        console.error('getTreeNodeByIdAsync() id was NaN');
        throw new Error(this.localizationService.getString('ERRORS.ENTRY_NOT_FOUND'));
      }

      const entryId = parseInt(id, 10);
      const repoId: string = await this.repoClient.getCurrentRepoId();
      const entry: Entry = await this.repoClient.entriesClient.getEntry({ repoId, entryId });

      const node: LfRepoTreeNode | undefined = await this.createNodeAsync(entry);
      if (node) {
        this.cachedNodes[id] = node;
      }
      return node;
    }
  }

  async getFolderChildrenAsync(folder: LfRepoTreeNode, nextPage?: string | undefined): Promise<LfTreeNodePage> {
    let listChildrenEntriesResponse: ODataValueContextOfIListOfEntry;
    try {
      if (this.cachedChildNodes[folder.id]) {
        const cachedChildNode = this.cachedChildNodes[folder.id];
        const nextPageAsCacheEntry = nextPage ?? '0';
        if (cachedChildNode[nextPageAsCacheEntry]) {
          return cachedChildNode[nextPageAsCacheEntry];
        }
      }
      if (!nextPage) {
        listChildrenEntriesResponse = await this.getFolderChildrenFirstPageAsync(folder);
      }
      else {
        listChildrenEntriesResponse = await this.repoClient.entriesClient.getEntryListingNextLink({ nextLink: nextPage, maxPageSize: 20 })
      }
      const dataMap = await this.parseFolderChildrenResponse(folder, listChildrenEntriesResponse);
      const nextPageLink: string | undefined = listChildrenEntriesResponse.odataNextLink;
      this.updateCacheChildrenNodes(folder.id, nextPage, dataMap, nextPageLink);
      return Promise.resolve({
        page: dataMap,
        nextPage: nextPageLink
      });

    }
    catch (err: any) {
      // TODO: delete whole cache?
      if (this.cachedChildNodes[folder.id]) {
        delete this.cachedChildNodes[folder.id];
      }
      throw err;
    }
  }

  async getRootTreeNodeAsync(): Promise<LfRepoTreeNode | undefined> {
    const rootEntryId: string = '1';
    if (this.cachedNodes[rootEntryId]) {
      // eslint-disable-next-line no-restricted-syntax
      console.debug('using cached root entry');
      return this.cachedNodes[rootEntryId];
    }
    else {
      const rootFolderId: number = 1;
      const repoId: string = await this.repoClient.getCurrentRepoId();

      const response: Entry = await this.repoClient.entriesClient.getEntry(
        {
          repoId,
          entryId: rootFolderId
        }
      );

      const rootEntry = response;
      if (rootEntry) {
        const rootNode: LfRepoTreeNode | undefined = await this.createNodeAsync(rootEntry);
        if (rootNode) {
          this.cachedNodes[rootEntryId] = rootNode;
          return rootNode;
        }
      }
      return undefined;
    }
  }

  clearCache() {
    // eslint-disable-next-line no-restricted-syntax
    console.debug('clearing cache');
    this.cachedNodes = {};
    this.cachedChildNodes = {};
  }

  private async createNodeAsync(entry: Entry, fullPath?: string): Promise<LfRepoTreeNode | undefined> {
    let treeNode: LfRepoTreeNode | undefined;
    if (entry.entryType) {
      if (entry.entryType === EntryType.Folder &&
        this.viewableEntryTypes.includes(LfRepoTreeEntryType.Folder)) {
        treeNode = await this.createFolderNodeAsync(entry, false, fullPath);
      } else if (
        entry.entryType === EntryType.Document
        && this.viewableEntryTypes.includes(LfRepoTreeEntryType.Document)
      ) {
        treeNode = this.createLeafDocumentNode(entry, fullPath);
      } else if (entry.entryType === EntryType.Shortcut) {
        treeNode = await this.createShortcutNodeAsync(entry, fullPath);
      } else if (entry.entryType === EntryType.RecordSeries &&
        this.viewableEntryTypes.includes(LfRepoTreeEntryType.RecordSeries)) {
        // TODO add record series support (treat like folder)
        console.warn('RecordSeries is not yet supported');
      } else if (LfRepoTreeEntryType[entry.entryType] && !this.viewableEntryTypes.includes(LfRepoTreeEntryType[entry.entryType])) {
        // Skip Entry
      } else {
        console.warn(`Unknown entry type ${entry.entryType}`);
      }
    } else {
      console.warn('Unable to determine entry type');
    }
    return treeNode;
  }

  private async createShortcutNodeAsync(entry: Entry, fullPath?: string) {
    const shortcut = entry as Shortcut;
    const targetType: EntryType | undefined = shortcut?.targetType;
    const targetId = shortcut.targetId;
    let treeNode: LfRepoTreeNode | undefined;
    if (targetType === EntryType.Folder &&
      this.viewableEntryTypes.includes(LfRepoTreeEntryType.ShortcutFolder)) {
      treeNode = await this.getFolderShortcutNodeAsync(shortcut, fullPath);
    } else if (targetType === EntryType.Document &&
      this.viewableEntryTypes.includes(LfRepoTreeEntryType.ShortcutDocument)) {
      treeNode = this.getLeafShortcutNode(shortcut, fullPath);
    }
    if (targetType && treeNode) {
      treeNode.targetType = targetType;
    }
    if (targetId && treeNode) {
      treeNode.targetId = targetId;
    }
    return treeNode;
  }

  private createLeafDocumentNode(entry: Entry, fullPath?: string): LfRepoTreeNode {
    const leafNode: LfRepoTreeNode = this.createLeafNode(entry, false, fullPath);

    if (entry.entryType === EntryType.Document) {
      const document: Document = entry as Document;
      const extension = document.extension;
      const elecDocumentSize = document.elecDocumentSize;
      if (extension) {
        leafNode.extension = extension;
        const iconId = IconUtils.getDocumentIconIdFromExtension(extension);
        leafNode.icon = IconUtils.getDocumentIconUrlFromIconId(iconId);
      }
      if (elecDocumentSize) {
        leafNode.elecDocumentSize = elecDocumentSize;
      }
    }
    return leafNode;
  }


  private createLeafNode(entry: Entry, isShortcut: boolean = false, fullPath?: string) {
    let parentId = entry.parentId?.toString();
    if (parentId === '0') {
      parentId = undefined;
    }

    const path = (fullPath) ? fullPath : entry.fullPath;

    const iconUrls = [IconUtils.getDocumentIconUrlFromIconId('document-20')];
    if (isShortcut) {
      const shortcutUrl = IconUtils.getDocumentIconUrlFromIconId('shortcut-overlay');
      iconUrls.push(shortcutUrl);
    }
    const leafNode: LfRepoTreeNode = {
      name: entry.name!,
      path: path ?? '',
      id: entry.id!.toString(),
      parentId,
      icon: iconUrls,
      isContainer: false,
      isLeaf: true
    };
    return leafNode;
  }

  private async getFolderShortcutNodeAsync(shortcut: Shortcut, fullPath?: string): Promise<LfRepoTreeNode> {
    const extension = shortcut.extension;
    const folderNode: LfRepoTreeNode = await this.createFolderNodeAsync(shortcut, true, fullPath);

    if (extension) {
      folderNode.extension = extension;
    }
    return folderNode;
  }

  private getLeafShortcutNode(shortcut: Shortcut, fullPath?: string): LfRepoTreeNode {
    const extension = shortcut.extension;

    const leafNode: LfRepoTreeNode = this.createLeafNode(shortcut, true, fullPath);

    if (extension) {
      leafNode.extension = extension;
      const iconId = IconUtils.getDocumentIconIdFromExtension(extension);
      const iconUrl = IconUtils.getDocumentIconUrlFromIconId(iconId);
      const shortcutUrl = IconUtils.getDocumentIconUrlFromIconId('shortcut-overlay');
      leafNode.icon = [iconUrl, shortcutUrl];
    }
    return leafNode;
  }

  private async createFolderNodeAsync(entry: Entry, shortcut: boolean = false, fullPath?: string): Promise<LfRepoTreeNode> {
    let entryName = entry.name!;

    if (entry.id === 1) {
      const repoClientRepoName: string = await this.repoClient.getCurrentRepoName();
      const repoName = repoClientRepoName ?? '\\';
      if (!entryName || entryName.length === 0) {
        entryName = repoName;
      }
    }

    let parentId = entry.parentId?.toString();
    if (parentId === '0') {
      parentId = undefined;
    }

    const path = fullPath ? fullPath : entry.fullPath;

    const iconUrls = [IconUtils.getDocumentIconUrlFromIconId('folder-20')];
    if (shortcut) {
      const shortcutUrl = IconUtils.getDocumentIconUrlFromIconId('shortcut-overlay');
      iconUrls.push(shortcutUrl);
    }

    const folderNode: LfRepoTreeNode = {
      name: entryName,
      path: path ?? '',
      id: entry.id!.toString(),
      parentId,
      icon: iconUrls,
      isContainer: true,
      isLeaf: false,
    };
    return folderNode;
  }

  private updateCacheChildrenNodes(folderId: string, currentPage: string | undefined, dataMap: LfRepoTreeNode[], nextPage: string | undefined) {
    currentPage = currentPage ?? '0';
    this.cachedChildNodes[folderId] = this.cachedChildNodes[folderId] ?? {};

    this.cachedChildNodes[folderId][currentPage] = {
      page: dataMap,
      nextPage: nextPage
    };
  }

  private async getFolderChildrenFirstPageAsync(folder: LfRepoTreeNode): Promise<ODataValueContextOfIListOfEntry> {
    let entryId: number;
    if (folder.targetId) { // TODO: what is targetId?
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

  private async parseFolderChildrenResponse(folder: LfRepoTreeNode, listChildrenEntriesResponse: ODataValueContextOfIListOfEntry): Promise<LfRepoTreeNode[]> {
    const dataMap: LfRepoTreeNode[] = [];
    const childrenEntries: Entry[] | undefined = listChildrenEntriesResponse.value;
    if (childrenEntries) {
      for (const childEntry of childrenEntries) {
        if (childEntry) {
          const path = folder.path ? PathUtils.combinePaths(folder.path, childEntry.name!) : undefined;
          const childNode: LfRepoTreeNode | undefined = await this.createNodeAsync(childEntry, path);
          if (childNode) {
            dataMap.push(childNode);
          }
        }
      }
    }
    return dataMap;
  }
}
