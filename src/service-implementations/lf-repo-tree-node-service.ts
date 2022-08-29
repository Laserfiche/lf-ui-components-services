import { LfTreeNodeService, LfTreeNodePage, LfTreeNode } from '@laserfiche/types-lf-ui-components';
import { LfRepoTreeEntryType, LfRepoTreeNode, LfRepoTreeNodePage } from '../helper-types/lf-repo-browser-types';
import {
  LfLocalizationService,
  IconUtils,
  PathUtils
} from '@laserfiche/lf-js-utils';
import { getEntryDefaultParametersAsync, getFolderChildrenDefaultParametersAsync } from '../utils/repo-client-utils.js';
import { Entry, Shortcut, Document, ODataValueContextOfIListOfEntry, EntryType, Folder } from '@laserfiche/lf-repository-api-client';
import { IRepositoryApiClientEx } from '../helper-types/repository-api-ex.js';

export const nodeAttrName_extension = 'extension';
export const nodeAttrName_elecDocumentSize = 'elecDocumentSize';
export const nodeAttrName_templateName = 'templateName';

export class LfRepoTreeNodeService implements LfTreeNodeService {

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

  async getParentTreeNodeAsync(treeNode: LfRepoTreeNode): Promise<LfTreeNode | undefined> {
    if (!treeNode.parentId) {
      if (treeNode.id === '1') {
        // the root node does not have a parent tree node
        return undefined;
      }
      throw new Error('treeNode.parentId is undefined');
    }

    try {
      const parentNode = await this.getTreeNodeByIdAsync(treeNode.parentId);
      return parentNode;
    }
    catch (err: any) {
      if (err.errorCode === 9013) {
        const rootNode = await this.getTreeNodeByIdAsync('1');
        return rootNode;
      }
      else {
        throw err;
      }
    }
  }

  async getTreeNodeByIdAsync(id: string): Promise<LfTreeNode | undefined> {
    const entryId = parseInt(id, 10);

    if (isNaN(entryId)) {
      throw new Error('id cannot be parsed as Laserfiche EntryId');
    }

    const repoId: string = await this.repoClient.getCurrentRepoId();
    const repoName: string = await this.repoClient.getCurrentRepoName();
    try {
      const requestParameters = getEntryDefaultParametersAsync(repoId, entryId);
      const entry: Entry = await this.repoClient.entriesClient.getEntry(
        await requestParameters
       );
      const node: LfRepoTreeNode = this.createNode(entry, repoName);
      return node;
    }
    catch (err) {
      if (err.errorCode === 9001) {
        // Entry not found
        return undefined;
      }
      throw err;
    }
  }

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
    let parentId = entry.parentId?.toString();
    if (parentId === '0') {
      parentId = undefined;
    }

    const path = parent? PathUtils.combinePaths(parent.path, entry.name): entry.fullPath;
    if (!path) {
      throw new Error('entry fullPath is undefined');
    }

    const leafNode: LfRepoTreeNode = {
      name: entry.name!,
      path: path,
      id: entry.id!.toString(),
      parentId,
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
    }

    const folderNode: LfRepoTreeNode = {
      name: entryName,
      path: path,
      id: entry.id!.toString(),
      parentId: parent?.id,
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
}
