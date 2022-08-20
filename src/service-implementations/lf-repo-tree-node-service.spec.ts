import { LfRepoTreeNodeService } from './lf-repo-tree-node-service'
import { LfRepoTreeEntryType, LfRepoTreeNode } from '../helper-types/lf-repo-browser-types';
import { Entry, PostEntryChildrenRequest, EntryType, ODataValueContextOfIListOfEntry } from '@laserfiche/lf-repository-api-client';
import { RepositoryApiClientMockBuilder } from './repository-api-client-mock-builder';

const dummyFolderEntry: Entry = new Entry({
    id: 10,
    name: 'DummyFolder',
    fullPath: '\\DummyFolder',
    entryType: EntryType.Folder
});

const dummyFolderRootEntry: Entry = new Entry({
    id: 1,
    name: '',
    fullPath: '\\',
    entryType: EntryType.Folder
});

const dummyDocumentEntry: Entry = new Entry({
    id: 11,
    name: 'DummyDocument',
    fullPath: '\\DummyDocument',
    entryType: EntryType.Document
});

const dummyInvalidEntry = {
    id: 12,
    name: 'DummyFolder',
    fullPath: '\\DummyFolder',
};

let service: LfRepoTreeNodeService;

const mockChildren: Entry[] = [
    new Entry({ id: 1, name: 'root', fullPath: '\\', entryType: EntryType.Folder, parentId: 0 }),
    new Entry({ id: 11, name: 'DocInRoot', fullPath: '\\DocInRoot', entryType: EntryType.Document }),
    new Entry({ id: 12, name: 'FolderInRoot', fullPath: '\\FolderInRoot', entryType: EntryType.Folder }),
    new Entry({ id: 52, name: 'FolderInRoot1', fullPath: '\\FolderInRoot1', entryType: EntryType.Folder }),
    new Entry({ id: 53, name: 'FolderInRoot2', fullPath: '\\FolderInRoot2', entryType: EntryType.Folder }),
    new Entry({ id: 54, name: 'FolderInRoot3', fullPath: '\\FolderInRoot3', entryType: EntryType.Folder }),
    new Entry({ id: 55, name: 'FolderInRoot4', fullPath: '\\FolderInRoot4', entryType: EntryType.Folder }),
    new Entry({ id: 56, name: 'FolderInRoot5', fullPath: '\\FolderInRoot5', entryType: EntryType.Folder }),
    new Entry({ id: 57, name: 'FolderInRoot6', fullPath: '\\FolderInRoot6', entryType: EntryType.Folder }),
    new Entry({ id: 58, name: 'FolderInRoot7', fullPath: '\\FolderInRoot7', entryType: EntryType.Folder }),
    new Entry({ id: 59, name: 'FolderInRoot8', fullPath: '\\FolderInRoot8', entryType: EntryType.Folder }),
    new Entry({ id: 60, name: 'FolderInRoot9', fullPath: '\\FolderInRoot9', entryType: EntryType.Folder }),
    new Entry({ id: 61, name: 'FolderInRoot10', fullPath: '\\FolderInRoot10', entryType: EntryType.Folder }),
    new Entry({ id: 62, name: 'FolderInRoot11', fullPath: '\\FolderInRoot11', entryType: EntryType.Folder }),
    new Entry({ id: 63, name: 'FolderInRoot12', fullPath: '\\FolderInRoot12', entryType: EntryType.Folder }),
    new Entry({ id: 64, name: 'FolderInRoot13', fullPath: '\\FolderInRoot13', entryType: EntryType.Folder }),
    new Entry({ id: 65, name: 'FolderInRoot14', fullPath: '\\FolderInRoot14', entryType: EntryType.Folder }),
    new Entry({ id: 66, name: 'FolderInRoot15', fullPath: '\\FolderInRoot15', entryType: EntryType.Folder }),
    new Entry({ id: 67, name: 'FolderInRoot16', fullPath: '\\FolderInRoot16', entryType: EntryType.Folder }),
    new Entry({ id: 68, name: 'FolderInRoot17', fullPath: '\\FolderInRoot17', entryType: EntryType.Folder }),
    new Entry({ id: 69, name: 'FolderInRoot18', fullPath: '\\FolderInRoot18', entryType: EntryType.Folder }),
    new Entry({ id: 70, name: 'FolderInRoot19', fullPath: '\\FolderInRoot19', entryType: EntryType.Folder }),
    new Entry({ id: 71, name: 'FolderInRoot20', fullPath: '\\FolderInRoot20', entryType: EntryType.Folder }),
    new Entry({ id: 72, name: 'FolderInRoot21', fullPath: '\\FolderInRoot21', entryType: EntryType.Folder }),
    new Entry({ id: 73, name: 'FolderInRoot22', fullPath: '\\FolderInRoot22', entryType: EntryType.Folder }),
    new Entry({ id: 74, name: 'FolderInRoot23', fullPath: '\\FolderInRoot23', entryType: EntryType.Folder }),
    new Entry({ id: 75, name: 'FolderInRoot24', fullPath: '\\FolderInRoot24', entryType: EntryType.Folder }),
    new Entry({ id: 76, name: 'FolderInRoot25', fullPath: '\\FolderInRoot25', entryType: EntryType.Folder }),
    new Entry({ id: 13, name: 'DocInFolderInRoot', fullPath: '\\FolderInRoot\\DocInFolderInRoot', entryType: EntryType.Document }),
    new Entry({ id: 20, name: 'RsInFolderInRoot', fullPath: '\\FolderInRoot\\RsInFolderInRoot', entryType: EntryType.Document }),
    new Entry({ id: 21, name: 'RsInFolderInRoot1', fullPath: '\\FolderInRoot\\RsInFolderInRoot1', entryType: EntryType.Document }),
    new Entry({ id: 22, name: 'RsInFolderInRoot2', fullPath: '\\FolderInRoot\\RsInFolderInRoot2', entryType: EntryType.Document }),
    new Entry({ id: 23, name: 'RsInFolderInRoot3', fullPath: '\\FolderInRoot\\RsInFolderInRoot3', entryType: EntryType.Document }),
    new Entry({ id: 24, name: 'RsInFolderInRoot4', fullPath: '\\FolderInRoot\\RsInFolderInRoot4', entryType: EntryType.Document }),
    new Entry({ id: 25, name: 'RsInFolderInRoot5', fullPath: '\\FolderInRoot\\RsInFolderInRoot5', entryType: EntryType.Document }),
    new Entry({ id: 26, name: 'RsInFolderInRoot6', fullPath: '\\FolderInRoot\\RsInFolderInRoot6', entryType: EntryType.Document }),
    new Entry({ id: 27, name: 'RsInFolderInRoot7', fullPath: '\\FolderInRoot\\RsInFolderInRoot7', entryType: EntryType.Document }),
    new Entry({ id: 28, name: 'RsInFolderInRoot8', fullPath: '\\FolderInRoot\\RsInFolderInRoot8', entryType: EntryType.Document }),
    new Entry({ id: 29, name: 'RsInFolderInRoot9', fullPath: '\\FolderInRoot\\RsInFolderInRoot9', entryType: EntryType.Document }),
    new Entry({ id: 30, name: 'RsInFolderInRoot10', fullPath: '\\FolderInRoot\\RsInFolderInRoot10', entryType: EntryType.Document }),
    new Entry({ id: 31, name: 'RsInFolderInRoot11', fullPath: '\\FolderInRoot\\RsInFolderInRoot11', entryType: EntryType.Document }),
    new Entry({ id: 32, name: 'RsInFolderInRoot12', fullPath: '\\FolderInRoot\\RsInFolderInRoot12', entryType: EntryType.Document }),
    new Entry({ id: 33, name: 'RsInFolderInRoot13', fullPath: '\\FolderInRoot\\RsInFolderInRoot13', entryType: EntryType.Document }),
    new Entry({ id: 34, name: 'RsInFolderInRoot14', fullPath: '\\FolderInRoot\\RsInFolderInRoot14', entryType: EntryType.Document }),
    new Entry({ id: 35, name: 'RsInFolderInRoot15', fullPath: '\\FolderInRoot\\RsInFolderInRoot15', entryType: EntryType.Document }),
    new Entry({ id: 36, name: 'RsInFolderInRoot16', fullPath: '\\FolderInRoot\\RsInFolderInRoot16', entryType: EntryType.Document }),
    new Entry({ id: 37, name: 'RsInFolderInRoot17', fullPath: '\\FolderInRoot\\RsInFolderInRoot17', entryType: EntryType.Document }),
    new Entry({ id: 38, name: 'RsInFolderInRoot18', fullPath: '\\FolderInRoot\\RsInFolderInRoot18', entryType: EntryType.Document }),
    new Entry({ id: 39, name: 'RsInFolderInRoot19', fullPath: '\\FolderInRoot\\RsInFolderInRoot19', entryType: EntryType.Document }),
    new Entry({ id: 40, name: 'RsInFolderInRoot20', fullPath: '\\FolderInRoot\\RsInFolderInRoot20', entryType: EntryType.Document }),
    new Entry({ id: 41, name: 'RsInFolderInRoot21', fullPath: '\\FolderInRoot\\RsInFolderInRoot21', entryType: EntryType.Document }),
    new Entry({ id: 42, name: 'RsInFolderInRoot22', fullPath: '\\FolderInRoot\\RsInFolderInRoot22', entryType: EntryType.Document }),
    new Entry({ id: 43, name: 'RsInFolderInRoot23', fullPath: '\\FolderInRoot\\RsInFolderInRoot23', entryType: EntryType.Document }),
]

const mockRepoClient = new RepositoryApiClientMockBuilder()
    .withGetCurrentRepoId(async () => { return 'r-23456789' })
    .withGetCurrentRepoName(async () => { return 'Test Name' })
    .withEntriesClient({
        getEntryListing: jest.fn((args: {
            repoId: string;
            entryId: number;
            groupByEntryType?: boolean;
            fields?: string[];
            formatFields?: boolean;
            prefer?: string;
            culture?: string;
            select?: string;
            orderby?: string;
            top?: number;
            skip?: number;
            count?: boolean;
        }) => {
          const filteredChildren = '';
          return Promise.resolve(
          new ODataValueContextOfIListOfEntry({ value: mockChildren.slice(0, args.top)}))
        }),
        getEntry: jest.fn((args: { repoId, entryId }) => {
            let matchedChild: Entry = new Entry();
            mockChildren.forEach(child => {
                if (child.id === args.entryId) {
                    matchedChild = child;
                }
            })
            return Promise.resolve(matchedChild);
        }),
        createOrCopyEntry: jest.fn((args: { repoId: string, entryId: number, request: PostEntryChildrenRequest }) => {
            const newFolder: Entry = new Entry({ id: 100, name: args.request.name, fullPath: '\\', entryType: EntryType.Folder, parentId: 0 });
            mockChildren.push(newFolder);
            return Promise.resolve(newFolder);
        })
    })
    .build();

describe('LfRepoTreeService', () => {

    beforeEach(() => {
        service = new LfRepoTreeNodeService(mockRepoClient);
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });

    it('should create folder if entryType is Folder', async () => {
        const expectedNode: LfRepoTreeNode = {
            name: 'DummyFolder',
            path: '\\DummyFolder',
            id: '10',
            parentId: undefined,
            icon: ['https://cdn.jsdelivr.net/npm/@laserfiche/lf-resource-library@4/resources/icons/document-icons.svg#folder-20'],
            isContainer: true,
            isLeaf: false,
        };
        // @ts-ignore
        const createdNode = await service.createNodeAsync(dummyFolderEntry);
        expect(createdNode).toEqual(expectedNode);
    });

    it('should rewrite root folder name to repo name if name is empty', async () => {
        const expectedNode: LfRepoTreeNode = {
            name: 'Test Name',
            path: '\\',
            id: '1',
            parentId: undefined,
            icon: ['https://cdn.jsdelivr.net/npm/@laserfiche/lf-resource-library@4/resources/icons/document-icons.svg#folder-20'],
            isContainer: true,
            isLeaf: false,
        };
        // @ts-ignore
        const createdNode = await service.createNodeAsync(dummyFolderRootEntry);
        expect(createdNode).toEqual(expectedNode);
    });

    it('should create leaf node if entryType is Document', async () => {
        const expectedNode: LfRepoTreeNode = {
            name: 'DummyDocument',
            path: '\\DummyDocument',
            id: '11',
            parentId: undefined,
            icon: ['https://cdn.jsdelivr.net/npm/@laserfiche/lf-resource-library@4/resources/icons/document-icons.svg#document-20'],
            isContainer: false,
            isLeaf: true,
        };
        // @ts-ignore
        const createdNode = await service.createNodeAsync(dummyDocumentEntry);
        expect(createdNode).toEqual(expectedNode);
    });

    it('should return undefined TreeNode if entryType not set', async () => {
        // @ts-ignore
        const createdNode = await service.createNodeAsync(dummyInvalidEntry);
        expect(createdNode).toEqual(undefined);
    });

    it('can choose to view only folders, not documents or record series', async () => {
        // Act
        service.viewableEntryTypes = [LfRepoTreeEntryType.Folder];

        const childrenNodes = await service.getFolderChildrenAsync({ id: '1' } as LfRepoTreeNode, '3');

        // Assert
        const expectedIds = ['1', '12', '52', '53', '54',
                            '55', '56', '57', '58', '59',
                            '60', '61', '62', '63', '64',
                            '65', '66', '67', '68'];
        const actualIds = childrenNodes.page.map((entry) => entry.id).sort();
        expect(actualIds).toEqual(expectedIds);
        expect(childrenNodes.page.length).toEqual(19);
        expect(childrenNodes.nextPage).toEqual('23');
    });

    // it('can make only documents selectable', async () => {
    //     // Act
    //     service.selectableEntryTypes = [LfRepoTreeEntryType.Document];
    //     const childrenNodes = await service.getChildrenAsync({} as LfRepoTreeNode);

    //     // Assert
    //     childrenNodes.forEach((treeNode) => {
    //         const entry = mockChildren.find((_entry) => _entry.id === parseInt(treeNode.id, 10));
    //         expect(entry).toBeDefined();
    //         if (entry?.entryType === EntryType.Document) {
    //             expect(treeNode.isSelectable).toBeTruthy();
    //         } else {
    //             expect(treeNode.isSelectable).toBeFalsy();
    //         }
    //     });
    // });

    it('getRootNodesAsync should call API getEntryAsync and coerce parentId = 0 into parentId = undefined', async () => {
        // Act
        const rootNodes = await service.getRootTreeNodeAsync();
        // @ts-ignore
        const expectedNode = await service.createNodeAsync(mockChildren[0]);

        // Assert
        expect(rootNodes?.id).toEqual('1');
        expect(rootNodes?.parentId).toBeUndefined();
        expect(rootNodes).toEqual(expectedNode);
    });

    it('getFolderChildrenAsync should call API getChildrenAsync ', async () => {
        // Act
        const childrenNodes = await service.getFolderChildrenAsync({} as LfRepoTreeNode, '3');

        // Assert
        expect(childrenNodes.page.length).toEqual(20);
        expect(childrenNodes.nextPage).toEqual("23");
        childrenNodes.page.forEach((childNode, i) => {
            expect(childNode.name).toEqual(mockChildren[i].name);
        })
    });

    it('addNewFolderAsync should call API addNewFolderAsync', async () => {
        // Act
        await service.addNewFolderAsync({} as LfRepoTreeNode, "testAddedNode");
        const childrenNodes = await service.getFolderChildrenAsync({} as LfRepoTreeNode);
        const newAddedNodes = await service.getTreeNodeByIdAsync("100");

        // Assert
        expect(childrenNodes.page.length).toEqual(20);
        expect(childrenNodes.nextPage).toEqual("20"); // TODO: is this correct?
        expect(newAddedNodes?.name).toEqual("testAddedNode");
    });

    it('getNodeByIdAsync should call API getEntryAsync', async () => {
        // Act
        const testNode1 = await service.getTreeNodeByIdAsync("12");
        const testNode2 = await service.getTreeNodeByIdAsync("20");

        // Assert
        expect(testNode1?.name).toEqual("FolderInRoot");
        expect(testNode2?.name).toEqual("RsInFolderInRoot");
    });
})
