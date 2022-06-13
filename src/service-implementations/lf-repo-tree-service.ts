import { LfTreeService } from '@laserfiche/types-lf-ui-components';
import { LfRepoTreeEntryType, LfRepoTreeNode } from '../helper-types/lf-tree-types.js';
import {
    LfLocalizationService,
    IconUtils,
    PathUtils
} from '@laserfiche/lf-js-utils';
import { getFolderChildrenDefaultParametersAsync } from '../utils/repo-client-utils.js';
import { NotificationService } from '../helper-types/lf-notification.js';
import { Entry, PostEntryChildrenRequest, PostEntryChildrenEntryType, Shortcut, Document, ODataValueContextOfIListOfEntry, EntryType } from '@laserfiche/lf-repository-api-client';
import { IRepositoryApiClientEx } from '../helper-types/repository-api-ex.js';

export class LfRepoTreeService implements LfTreeService {

    viewableEntryTypes: LfRepoTreeEntryType[] = Object.values(LfRepoTreeEntryType);
    selectableEntryTypes: LfRepoTreeEntryType[] = Object.values(LfRepoTreeEntryType);

    private localizationService = new LfLocalizationService();

    private cachedNodes: Record<string, LfRepoTreeNode> = {};
    private cachedChildNodes: Record<string, LfRepoTreeNode[]> = {};

    constructor(
        private repoClient: IRepositoryApiClientEx,
        public notificationService?: NotificationService,
    ) { }

    async getParentNodeAsync(node: LfRepoTreeNode): Promise<LfRepoTreeNode | undefined> {
        if (!this.repoClient) {
            console.error('getParentNodeAsync() _selectedRepositoryClient was undefined');
            throw new Error(this.localizationService.getString('ERRORS.ENTRY_NOT_FOUND'));
        }

        if (!node.parentId) {
            return undefined;
        }

        try {
            const parentNode = await this.getNodeByIdAsync(node.parentId);
            return parentNode;
        }
        catch (err: any) {
            if (err.message === 'Access denied. [9013]') {
                const rootNode = await this.getNodeByIdAsync('1');
                return rootNode;
            }
        }

        return await this.getNodeByIdAsync(node.parentId);
    }

    async getNodeByIdAsync(id: string): Promise<LfRepoTreeNode | undefined> {
        if (!this.repoClient) {
            console.error('getNodeByIdAsync() _selectedRepositoryClient was undefined');
            throw new Error(this.localizationService.getString('ERRORS.ENTRY_NOT_FOUND'));
        }

        if (this.cachedNodes[id]) {
            // eslint-disable-next-line no-restricted-syntax
            console.debug(`using cached entry ${id}`);
            return this.cachedNodes[id];
        }

        else {
            if (isNaN(parseInt(id, 10))) {
                console.error('getNodeByIdAsync() id was NaN');
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

    async getChildrenAsync(node: LfRepoTreeNode): Promise<LfRepoTreeNode[]> {
        try {
            if (this.cachedChildNodes[node.id]) {
                // eslint-disable-next-line no-restricted-syntax
                console.debug(`using cached children for entry ${node.id}`);
                return this.cachedChildNodes[node.id];
            }

            else {
                const dataMap: LfRepoTreeNode[] = [];
                let entryId: number;
                if (node.targetId) {
                    entryId = node.targetId;
                }
                else {
                    entryId = parseInt(node.id, 10);
                }
                const repoId: string = await this.repoClient.getCurrentRepoId();
                const requestParameters = await getFolderChildrenDefaultParametersAsync(repoId, entryId);
                const listChildrenEntriesResponse: ODataValueContextOfIListOfEntry =
                    await this.repoClient.entriesClient.getEntryListing(
                        requestParameters
                    );
                const childrenEntries: Entry[] = listChildrenEntriesResponse.value;
                if (childrenEntries) {
                    for (const childEntry of childrenEntries) {
                        if (childEntry) {
                            const path = node.path ? PathUtils.combinePaths(node.path, childEntry.name!) : undefined;
                            const childNode: LfRepoTreeNode | undefined = await this.createNodeAsync(childEntry, path);
                            if (childNode) {
                                dataMap.push(childNode);
                            }
                        }
                    }
                }
                this.cachedChildNodes[node.id] = dataMap;
                return dataMap;
            }
        }
        catch (err: any) {
            this.notificationService?.error(`${this.localizationService.getString('ERRORS.FAILED_TO_OPEN_FOLDER')}: ${err.message}`);
            if (this.cachedChildNodes[node.id]) {
                delete this.cachedChildNodes[node.id];
            }
            throw err;
        }
    }

    async getRootNodesAsync(): Promise<LfRepoTreeNode[]> {
        const rootEntryId: string = '1';
        if (this.cachedNodes[rootEntryId]) {
            // eslint-disable-next-line no-restricted-syntax
            console.debug('using cached root entry');
            return [this.cachedNodes[rootEntryId]];
        }
        else {
            const dataMap: LfRepoTreeNode[] = [];
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
                    dataMap.push(rootNode);
                    this.cachedNodes[rootEntryId] = rootNode;
                }
            }
            return dataMap;
        }
    }

    async refreshAsync(node: LfRepoTreeNode): Promise<LfRepoTreeNode[]> {
        this.clearCache();
        return await this.getChildrenAsync(node);
    }

    clearCache() {
        // eslint-disable-next-line no-restricted-syntax
        console.debug('clearing cache');
        this.cachedNodes = {};
        this.cachedChildNodes = {};
    }

    async addNewFolderAsync(parentNode: LfRepoTreeNode, folderName: string): Promise<void> {
        const requestParameters: { entryId: number, postEntryChildrenRequest: PostEntryChildrenRequest } = {
            entryId: parseInt(parentNode.id, 10),
            postEntryChildrenRequest: new PostEntryChildrenRequest({
                name: folderName,
                entryType: PostEntryChildrenEntryType.Folder
            })
        }
        const repoId: string = await this.repoClient.getCurrentRepoId();
        await this.repoClient?.entriesClient.createOrCopyEntry(
            {
                repoId,
                entryId: requestParameters.entryId,
                request: requestParameters.postEntryChildrenRequest
            }
        );
    }

    private async createNodeAsync(entry: Entry, fullPath?: string): Promise<LfRepoTreeNode | undefined> {
        let treeNode: LfRepoTreeNode | undefined;
        if (entry.entryType) {
            if (entry.entryType === EntryType.Folder &&
                this.viewableEntryTypes.includes(LfRepoTreeEntryType.Folder)) {
                treeNode = await this.createFolderNodeAsync(entry, this.selectableEntryTypes.includes(LfRepoTreeEntryType.Folder), false, fullPath);
            } else if (
                entry.entryType === EntryType.Document
                && this.viewableEntryTypes.includes(LfRepoTreeEntryType.Document)
            ) {
                treeNode = this.createLeafDocumentNode(entry, this.selectableEntryTypes.includes(LfRepoTreeEntryType.Document), fullPath);
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
            treeNode = await this.getFolderShortcutNodeAsync(shortcut, this.selectableEntryTypes.includes(LfRepoTreeEntryType.ShortcutFolder), fullPath);
        } else if (targetType === EntryType.Document &&
            this.viewableEntryTypes.includes(LfRepoTreeEntryType.ShortcutDocument)) {
            treeNode = this.getLeafShortcutNode(shortcut, this.selectableEntryTypes.includes(LfRepoTreeEntryType.ShortcutDocument), fullPath);
        }
        if (targetType && treeNode) {
            treeNode.targetType = targetType;
        }
        if (targetId && treeNode) {
            treeNode.targetId = targetId;
        }
        return treeNode;
    }

    private createLeafDocumentNode(entry: Entry, isSelectable: boolean, fullPath?: string): LfRepoTreeNode {
        const leafNode: LfRepoTreeNode = this.createLeafNode(entry, isSelectable, false, fullPath);

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


    private createLeafNode(entry: Entry, isSelectable: boolean, isShortcut: boolean = false, fullPath?: string) {
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
            isSelectable,
            isLeaf: true
        };
        return leafNode;
    }

    private async getFolderShortcutNodeAsync(shortcut: Shortcut, isSelectable: boolean, fullPath?: string): Promise<LfRepoTreeNode> {
        const extension = shortcut.extension;
        const folderNode: LfRepoTreeNode = await this.createFolderNodeAsync(shortcut, isSelectable, true, fullPath);

        if (extension) {
            folderNode.extension = extension;
        }
        return folderNode;
    }

    private getLeafShortcutNode(shortcut: Shortcut, isSelectable: boolean, fullPath?: string): LfRepoTreeNode {
        const extension = shortcut.extension;

        const leafNode: LfRepoTreeNode = this.createLeafNode(shortcut, isSelectable, true, fullPath);

        if (extension) {
            leafNode.extension = extension;
            const iconId = IconUtils.getDocumentIconIdFromExtension(extension);
            const iconUrl = IconUtils.getDocumentIconUrlFromIconId(iconId);
            const shortcutUrl = IconUtils.getDocumentIconUrlFromIconId('shortcut-overlay');
            leafNode.icon = [iconUrl, shortcutUrl];
        }
        return leafNode;
    }

    private async createFolderNodeAsync(entry: Entry, isSelectable: boolean, shortcut: boolean = false, fullPath?: string): Promise<LfRepoTreeNode> {
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
            isSelectable,
            isLeaf: false,
        };
        return folderNode;
    }
}
