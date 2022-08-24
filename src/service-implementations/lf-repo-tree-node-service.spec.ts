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
          return Promise.resolve(
          new ODataValueContextOfIListOfEntry({ value: mockChildren.slice(0, 20), odataNextLink: 'a test link returned by getEntryListing' }))
        }),
        getEntryListingNextLink: jest.fn((args: {
          nextLink: string;
          maxPageSize?: number
        }) => {
          return Promise.resolve(
            new ODataValueContextOfIListOfEntry({ value: mockChildren.slice(0, args.maxPageSize), odataNextLink: 'a test link returned by getEntryListingNextLink'})
          )
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

describe('LfRepoTreeNodeService', () => {

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

    it('should return undefined LfTreeNode if entryType not set', async () => {
        // @ts-ignore
        const createdNode = await service.createNodeAsync(dummyInvalidEntry);
        expect(createdNode).toEqual(undefined);
    });

    it('can choose to view only folders, not documents or record series', async () => {
        // Act
        service.viewableEntryTypes = [LfRepoTreeEntryType.Folder];

        const childrenNodes = await service.getFolderChildrenAsync({ id: '1' } as LfRepoTreeNode);

        // Assert
        const expectedIds = ['1', '12', '52', '53', '54',
                            '55', '56', '57', '58', '59',
                            '60', '61'];
        const actualIds = childrenNodes.page.map((entry) => entry.id).sort();
        expect(actualIds).toEqual(expectedIds);
        expect(childrenNodes.page.length).toEqual(12);
    });

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

    it('getFolderChildrenAsync with undefined nextPage should call API getEntryListing ', async () => {
        // Act
        const childrenNodes = await service.getFolderChildrenAsync({} as LfRepoTreeNode);

        // Assert
        expect(childrenNodes.page.length).toEqual(20);
        expect(childrenNodes.nextPage).toEqual("a test link returned by getEntryListing");
        childrenNodes.page.forEach((childNode, i) => {
            expect(childNode.name).toEqual(mockChildren[i].name);
        })
    });

    it('getFolderChildrenAsync with nextPage should call API getEntryListingNextLink ', async () => {
      // Act
      const childrenNodes = await service.getFolderChildrenAsync({} as LfRepoTreeNode, '3');

      // Assert
      expect(childrenNodes.page.length).toEqual(20);
      expect(childrenNodes.nextPage).toEqual('a test link returned by getEntryListingNextLink');
      childrenNodes.page.forEach((childNode, i) => {
          expect(childNode.name).toEqual(mockChildren[i].name);
      })
  });

    it('getNodeByIdAsync should call API getEntryAsync', async () => {
        // Act
        const testNode1 = await service.getTreeNodeByIdAsync("12");
        const testNode2 = await service.getTreeNodeByIdAsync("20");

        // Assert
        expect(testNode1?.name).toEqual("FolderInRoot");
        expect(testNode2?.name).toEqual("RsInFolderInRoot");
    });

    it('updateCacheChildrenNodes should update cache if entry does not exist in cache', async () => {
      // Arrange
      const addedFolder = { id: '10' } as LfRepoTreeNode;
      const nextPage = 'updated next page';

      // Act
      // @ts-ignore
      service.updateCacheChildrenNodes('1', '0', [addedFolder], nextPage);

      // Assert
      // @ts-ignore
      expect(service.cachedChildNodes).toEqual({
        '1': {
          '0': {
            page: [addedFolder],
            nextPage: nextPage
          }
        }
      });
  });

    it('updateCacheChildrenNodes should overwrite cache if entry exists in cache', async () => {
      // Arrange
      const addedFolder = { id: '10' } as LfRepoTreeNode;
      // @ts-ignore
      service.cachedChildNodes = {
        '1': {
          '0': {
            page: [],
            nextPage: undefined
            }
          }
      };
      const nextPage = 'updated next page';

      // Act
      // @ts-ignore
      service.updateCacheChildrenNodes('1', '0', [addedFolder], nextPage);

      // Assert
      // @ts-ignore
      expect(
        // @ts-ignore
        service.cachedChildNodes
        ).toEqual({
        '1': {
          '0': {
            page: [addedFolder],
            nextPage: nextPage
          }
        }
      });
  });

  it('updateCacheChildrenNodes should update cache if entry exists in cache', async () => {
    // Arrange
    const addedFolder = { id: '10' } as LfRepoTreeNode;
    // @ts-ignore
    service.cachedChildNodes = {
      '1': {
        '0': {
          page: [addedFolder],
          nextPage: undefined
          }
        }
    };
    const nextPage = 'updated next page';

    // Act
    // @ts-ignore
    service.updateCacheChildrenNodes('1', '30', [addedFolder, addedFolder], nextPage);

    // Assert
    // @ts-ignore
    expect(
      // @ts-ignore
      service.cachedChildNodes
      ).toEqual({
      '1': {
        '0': {
          page: [addedFolder],
          nextPage: undefined
        },
        '30': {
          page: [addedFolder, addedFolder],
          nextPage: nextPage
        }
      }
    });
});

  it('getFolderChildrenAsync uses cache if requested nextPage is undefined, but exists in cache colder', async () => {
    // Arrange
    const addedFolder = { id: '10' } as LfRepoTreeNode;
    // @ts-ignore
    service.cachedChildNodes = {
      '10': {
        '0': {
          page: [addedFolder],
          nextPage: 'updated next page'
        }
      }
    };

    // Act
    const childrenNodes = await service.getFolderChildrenAsync(addedFolder, undefined);

    // Assert
    // @ts-ignore
    expect(childrenNodes).toEqual(service.cachedChildNodes['10']['0']);
});

it('getFolderChildrenAsync uses cache if requested nextPage is defined, but exists in cache colder', async () => {
  // Arrange
  const addedFolder = { id: '10' } as LfRepoTreeNode;
  // @ts-ignore
  service.cachedChildNodes = {
    '10': {
      'a random string': {
        page: [addedFolder],
        nextPage: 'updated next page'
      }
    }
  };

  // Act
  const childrenNodes = await service.getFolderChildrenAsync(addedFolder, 'a random string');

  // Assert
  // @ts-ignore
  expect(childrenNodes).toEqual(service.cachedChildNodes['10']['a random string']);
});

it('getFolderChildrenAsync calls API getEntryListing if requested nextPage is undefined, and nextPage does not exist in cached folder', async () => {
  // Arrange
  const addedFolder = { id: '10' } as LfRepoTreeNode;
  // @ts-ignore
  service.cachedChildNodes = {
    '10': {
      'a random key': {
        page: [addedFolder],
        nextPage: undefined}
    }
  };

  // Act
  const childrenNodes = await service.getFolderChildrenAsync(addedFolder, undefined);

  // Assert
  // @ts-ignore
  expect(childrenNodes.nextPage).toEqual('a test link returned by getEntryListing');
});

it('getFolderChildrenAsync calls API getEntryListingNextLink if requested nextPage is defined, and nextPage does not exist in cached folder', async () => {
    // Arrange
    const addedFolder = { id: '10' } as LfRepoTreeNode;
    const nextPage = 'updated next page';

    // Act
    const childrenNodes = await service.getFolderChildrenAsync(addedFolder, nextPage);

    // Assert
    expect(childrenNodes.nextPage).toEqual('a test link returned by getEntryListingNextLink');
    // @ts-ignore
    expect(service.cachedChildNodes['10'][nextPage]).toEqual(childrenNodes);
});
})
