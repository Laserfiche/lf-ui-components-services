import { LfRepoTreeService } from './lf-repo-tree-service'
import { LfRepoTreeEntryType, LfRepoTreeNode } from '../helper-types/lf-tree-types';
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

let service: LfRepoTreeService;

const mockChildren: Entry[] = [
    new Entry({ id: 1, name: 'root', fullPath: '\\', entryType: EntryType.Folder, parentId: 0 }),
    new Entry({ id: 11, name: 'DocInRoot', fullPath: '\\DocInRoot', entryType: EntryType.Document }),
    new Entry({ id: 12, name: 'FolderInRoot', fullPath: '\\FolderInRoot', entryType: EntryType.Folder }),
    new Entry({ id: 13, name: 'DocInFolderInRoot', fullPath: '\\FolderInRoot\\DocInFolderInRoot', entryType: EntryType.Document }),
    new Entry({ id: 20, name: 'RsInFolderInRoot', fullPath: '\\FolderInRoot\\RsInFolderInRoot', entryType: EntryType.Document }),
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
        }) => Promise.resolve(new ODataValueContextOfIListOfEntry({ value: mockChildren }))),
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
        service = new LfRepoTreeService(mockRepoClient);
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
            isSelectable: true,
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
            isSelectable: true,
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
            isSelectable: true,
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

        const childrenNodes = await service.getChildrenAsync({ id: '1' } as LfRepoTreeNode);

        // Assert
        const expectedIds = ['1', '12'];
        const actualIds = childrenNodes.map((entry) => entry.id).sort();
        expect(actualIds).toEqual(expectedIds);
    });

    it('can make only documents selectable', async () => {
        // Act
        service.selectableEntryTypes = [LfRepoTreeEntryType.Document];
        const childrenNodes = await service.getChildrenAsync({} as LfRepoTreeNode);

        // Assert
        childrenNodes.forEach((treeNode) => {
            const entry = mockChildren.find((_entry) => _entry.id === parseInt(treeNode.id, 10));
            expect(entry).toBeDefined();
            if (entry?.entryType === EntryType.Document) {
                expect(treeNode.isSelectable).toBeTruthy();
            } else {
                expect(treeNode.isSelectable).toBeFalsy();
            }
        });
    });

    it('getRootNodesAsync should call API getEntryAsync and coerce parentId = 0 into parentId = undefined', async () => {
        // Act
        const rootNodes = await service.getRootNodesAsync();
        // @ts-ignore
        const expectedNode = await service.createNodeAsync(mockChildren[0]);

        // Assert
        expect(rootNodes.length).toEqual(1);
        expect(rootNodes[0].id).toEqual('1');
        expect(rootNodes[0].parentId).toBeUndefined();
        expect(rootNodes[0]).toEqual(expectedNode);
    });

    it('getChildrenAsync should call API getChildrenAsync ', async () => {
        // Act
        const childrenNodes = await service.getChildrenAsync({} as LfRepoTreeNode);

        // Assert
        expect(childrenNodes.length).toEqual(mockChildren.length);
        childrenNodes.forEach((childNode, i) => {
            expect(childNode.name).toEqual(mockChildren[i].name);
        })
    });

    it('addNewFolderAsync should call API addNewFolderAsync', async () => {
        // Act
        await service.addNewFolderAsync({} as LfRepoTreeNode, "testAddedNode");
        const childrenNodes = await service.getChildrenAsync({} as LfRepoTreeNode);
        const newAddedNodes = await service.getNodeByIdAsync("100");

        // Assert
        expect(childrenNodes.length).toEqual(6);
        expect(newAddedNodes?.name).toEqual("testAddedNode");
    });

    it('getNodeByIdAsync should call API getEntryAsync', async () => {
        // Act
        const testNode1 = await service.getNodeByIdAsync("12");
        const testNode2 = await service.getNodeByIdAsync("20");

        // Assert
        expect(testNode1?.name).toEqual("FolderInRoot");
        expect(testNode2?.name).toEqual("RsInFolderInRoot");
    });
})
