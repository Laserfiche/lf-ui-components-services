// Copyright (c) Laserfiche.
// Licensed under the MIT License. See LICENSE in the project root for license information.

import { LfRepoTreeNodeService, nodeAttrName_elecDocumentSize, nodeAttrName_extension, nodeAttrName_templateName, nodeAttrName_creationTime } from './lf-repo-tree-node-service'
import { LfRepoTreeNode } from '../helper-types/lf-repo-browser-types';
import { Entry, PostEntryChildrenRequest, EntryType, ODataValueContextOfIListOfEntry, Document, Shortcut, Folder } from '@laserfiche/lf-repository-api-client';
import { RepositoryApiClientMockBuilder } from './repository-api-client-mock-builder';
import { FindEntryResult } from '@laserfiche/lf-repository-api-client';
import * as RepoClientUtils from '../utils/repo-client-utils';
import { LfTreeNode, PropertyValue } from '@laserfiche/types-lf-ui-components';

const getFolderChildrenDefaultParametersSpy = jest.spyOn(RepoClientUtils, 'getFolderChildrenDefaultParameters');

function createFolder(data) {
  return new Folder(data);
}

function createDocument(data) {
  return new Document(data);
}

function createShortcut(data) {
  return new Shortcut(data);
}

function createResultEntryListing(data) {
  return new ODataValueContextOfIListOfEntry(data);
}

function createFindEntryResult(data): FindEntryResult {
  return new FindEntryResult(data);
}

const dummyRootEntry: Folder = createFolder({
  id: 1,
  name: 'DummyRoot',
  entryType: EntryType.Folder
});

const dummyFolderEntry: Folder = createFolder({
  id: 10,
  name: 'DummyFolder',
  entryType: EntryType.Folder
});

const dummyDocumentEntryDocument: Document = createDocument({
  id: 11,
  name: 'DummyDocument',
  entryType: EntryType.Document,
  templateName: 'hi',
  elecDocumentSize: 20000,
  extension: 'docx',
  creationTime: '2000-05-11T00:00:00',
});

const dummyInvalidEntry: Folder = createFolder({
  id: 12,
  name: 'DummyFolder',
});
const dummyShortcutDocumentShortcut: Shortcut = createShortcut({
  id: 13,
  name: 'dummyShortcutDocument',
  entryType: EntryType.Shortcut,
  templateName: 'hi',
  targetId: 20000,
  extension: 'docx',
  targetType: EntryType.Document
});

const dummyShortcutFolderShortcut: Shortcut = createShortcut({
  id: 14,
  name: 'dummyShortcutFolder',
  entryType: EntryType.Shortcut,
  targetId: 20000,
  targetType: EntryType.Folder
});

let service: LfRepoTreeNodeService;

const mockChildren: Entry[] = [
  createFolder({ id: 1, name: 'root', fullPath: '\\', entryType: EntryType.Folder, parentId: 0 }),
  createDocument({ id: 11, name: 'DocInRoot', fullPath: '\\DocInRoot', entryType: EntryType.Document, templateName: 'test' }),
  createFolder({ id: 12, name: 'FolderInRoot', fullPath: '\\FolderInRoot', entryType: EntryType.Folder }),
  createFolder({ id: 52, name: 'FolderInRoot1', fullPath: '\\FolderInRoot1', entryType: EntryType.Folder }),
  createFolder({ id: 53, name: 'FolderInRoot2', fullPath: '\\FolderInRoot2', entryType: EntryType.Folder }),
  createFolder({ id: 54, name: 'FolderInRoot3', fullPath: '\\FolderInRoot3', entryType: EntryType.Folder }),
  createFolder({ id: 55, name: 'FolderInRoot4', fullPath: '\\FolderInRoot4', entryType: EntryType.Folder }),
  createFolder({ id: 56, name: 'FolderInRoot5', fullPath: '\\FolderInRoot5', entryType: EntryType.Folder }),
  createFolder({ id: 57, name: 'FolderInRoot6', fullPath: '\\FolderInRoot6', entryType: EntryType.Folder }),
  createFolder({ id: 58, name: 'FolderInRoot7', fullPath: '\\FolderInRoot7', entryType: EntryType.Folder }),
  createFolder({ id: 59, name: 'FolderInRoot8', fullPath: '\\FolderInRoot8', entryType: EntryType.Folder }),
  createFolder({ id: 60, name: 'FolderInRoot9', fullPath: '\\FolderInRoot9', entryType: EntryType.Folder }),
  createFolder({ id: 61, name: 'FolderInRoot10', fullPath: '\\FolderInRoot10', entryType: EntryType.Folder }),
  createFolder({ id: 62, name: 'FolderInAFolder', fullPath: '\\FolderInRoot\\FolderInAFolder', entryType: EntryType.Folder }),
  createDocument({ id: 13, name: 'DocInFolderInRoot', fullPath: '\\FolderInRoot\\DocInFolderInRoot', entryType: EntryType.Document }),
  createDocument({ id: 20, name: 'RsInFolderInRoot', fullPath: '\\FolderInRoot\\RsInFolderInRoot', entryType: EntryType.Document }),
  createDocument({ id: 21, name: 'RsInFolderInRoot1', fullPath: '\\FolderInRoot\\RsInFolderInRoot1', entryType: EntryType.Document }),
  createDocument({ id: 22, name: 'RsInFolderInRoot2', fullPath: '\\FolderInRoot\\RsInFolderInRoot2', entryType: EntryType.Document }),
  createDocument({ id: 23, name: 'RsInFolderInRoot3', fullPath: '\\FolderInRoot\\RsInFolderInRoot3', entryType: EntryType.Document }),
  createDocument({ id: 24, name: 'RsInFolderInRoot4', fullPath: '\\FolderInRoot\\RsInFolderInRoot4', entryType: EntryType.Document }),
  createDocument({ id: 25, name: 'RsInFolderInRoot5', fullPath: '\\FolderInRoot\\RsInFolderInRoot5', entryType: EntryType.Document }),
  createDocument({ id: 26, name: 'RsInFolderInRoot6', fullPath: '\\FolderInRoot\\RsInFolderInRoot6', entryType: EntryType.Document }),
  createDocument({ id: 27, name: 'RsInFolderInRoot7', fullPath: '\\FolderInRoot\\RsInFolderInRoot7', entryType: EntryType.Document }),
  createDocument({ id: 28, name: 'RsInFolderInRoot8', fullPath: '\\FolderInRoot\\RsInFolderInRoot8', entryType: EntryType.Document }),
  createDocument({ id: 29, name: 'RsInFolderInRoot9', fullPath: '\\FolderInRoot\\RsInFolderInRoot9', entryType: EntryType.Document }),
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
        createResultEntryListing({ value: mockChildren.slice(0, 20), odataNextLink: 'a test link returned by getEntryListing' }))
    }),
    getEntryListingNextLink: jest.fn((args: {
      nextLink: string;
      maxPageSize?: number
    }) => {
      return Promise.resolve(
        createResultEntryListing({ value: mockChildren.slice(0, 20), odataNextLink: 'a test link returned by getEntryListingNextLink' })
      )
    }),
    getEntry: jest.fn((args: { repoId, entryId }) => {
      let matchedChild: Entry;
      mockChildren.forEach(child => {
        if (child.id === args.entryId) {
          matchedChild = child;
          return Promise.resolve(matchedChild);
        }
      })
      return Promise.resolve(mockChildren[0]);
    }),
    createOrCopyEntry: jest.fn((args: { repoId: string, entryId: number, request: PostEntryChildrenRequest }) => {
      const newFolder: Entry = new Folder({ id: 100, name: args.request.name, entryType: EntryType.Folder, parentId: 0 });
      mockChildren.push(newFolder);
      return Promise.resolve(newFolder);
    }),
    getEntryByPath: jest.fn((args: { repoId: string, fullPath: string, fallbackToClosestAncestor?: boolean }) => {
      const entry: Entry | undefined = mockChildren.find(child => child.fullPath === args.fullPath);
      if (entry) {
        return Promise.resolve(createFindEntryResult({
          entry: entry
      }));
      }
      else {
        return Promise.reject();
      }

    }),
  })
  .build();

describe('LfRepoTreeNodeService', () => {

  beforeEach(() => {
    service = new LfRepoTreeNodeService(mockRepoClient);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should create folder if entryType is Folder', () => {
    const expectedNode: LfRepoTreeNode = {
      name: 'DummyFolder',
      path: '\\DummyFolder',
      id: '10',
      icon: 'https://lfxstatic.com/npm/@laserfiche/lf-resource-library@4/resources/icons/document-icons.svg#folder-20',
      isContainer: true,
      isLeaf: false,
      attributes: new Map<string, PropertyValue>(),
      entryType: EntryType.Folder
    };
    
    // @ts-ignore
    const createdNode = service.createNonRootLfRepoTreeNode(dummyFolderEntry, { name: 'Test Name', path: '\\' } as LfRepoTreeNode);
    
    expect(createdNode).toEqual(expectedNode);
  });

  it('should create shortcut Folder if entryType is Shortcut and targetType is Folder', () => {
    const expectedNode: LfRepoTreeNode = {
      name: 'dummyShortcutFolder',
      path: '\\dummyShortcutFolder',
      id: '14',
      icon: [
        "https://lfxstatic.com/npm/@laserfiche/lf-resource-library@4/resources/icons/document-icons.svg#folder-20",
        "https://lfxstatic.com/npm/@laserfiche/lf-resource-library@4/resources/icons/document-icons.svg#shortcut-overlay",
      ],
      isContainer: true,
      isLeaf: false,
      attributes: new Map<string, PropertyValue>(),
      entryType: EntryType.Shortcut,
      targetId: 20000,
      targetType: EntryType.Folder
    };

    // @ts-ignore
    const createdNode = service.createNonRootLfRepoTreeNode(dummyShortcutFolderShortcut, { name: 'Test Name', path: '\\' } as LfRepoTreeNode);
    
    expect(createdNode).toEqual(expectedNode);
  });

  it('should create shortcut Document if entryType is Shortcut and targetType is Document', () => {
    const expectedNode: LfRepoTreeNode = {
      name: 'dummyShortcutDocument',
      path: '\\dummyShortcutDocument',
      id: '13',
      icon: [
        "https://lfxstatic.com/npm/@laserfiche/lf-resource-library@4/resources/icons/document-icons.svg#edoc-wordprocessing-20",
        "https://lfxstatic.com/npm/@laserfiche/lf-resource-library@4/resources/icons/document-icons.svg#shortcut-overlay",
      ],
      isContainer: false,
      isLeaf: true,
      attributes: new Map<string, PropertyValue>(),
      entryType: EntryType.Shortcut,
      targetId: 20000,
      targetType: EntryType.Document
    };
    expectedNode.attributes!.set(nodeAttrName_extension, {value:'docx', displayValue:'docx'});
    expectedNode.attributes!.set(nodeAttrName_templateName, {value:'hi', displayValue: 'hi'});
    service.columnIds = [nodeAttrName_extension, nodeAttrName_templateName];
    
    // @ts-ignore
    const createdNode = service.createNonRootLfRepoTreeNode(dummyShortcutDocumentShortcut, { name: 'Test Name', path: '\\' } as LfRepoTreeNode);
    
    expect(createdNode).toEqual(expectedNode);
  });

  it('if columnIds is not set, should still create leaf node', () => {
    const expectedNode: LfRepoTreeNode = {
      name: 'dummyShortcutDocument',
      path: '\\dummyShortcutDocument',
      id: '13',
      icon: [
        "https://lfxstatic.com/npm/@laserfiche/lf-resource-library@4/resources/icons/document-icons.svg#edoc-wordprocessing-20",
        "https://lfxstatic.com/npm/@laserfiche/lf-resource-library@4/resources/icons/document-icons.svg#shortcut-overlay",
      ],
      isContainer: false,
      isLeaf: true,
      attributes: new Map<string, PropertyValue>(),
      entryType: EntryType.Shortcut,
      targetId: 20000,
      targetType: EntryType.Document
    };

    // @ts-ignore
    const createdNode = service.createNonRootLfRepoTreeNode(dummyShortcutDocumentShortcut, { name: 'Test Name', path: '\\' } as LfRepoTreeNode);
    expect(createdNode).toEqual(expectedNode);
  });

  // TODO: add test for creating RecordSeries when record series class is added in API client libraries

  it('should create leaf node if entryType is Document', () => {
    const expectedNode: LfRepoTreeNode = {
      name: 'DummyDocument',
      path: '\\DummyDocument',
      id: '11',
      icon: 'https://lfxstatic.com/npm/@laserfiche/lf-resource-library@4/resources/icons/document-icons.svg#edoc-wordprocessing-20',
      isContainer: false,
      isLeaf: true,
      entryType: EntryType.Document,
    };
    expectedNode.attributes = new Map<string, PropertyValue>();
    expectedNode.attributes.set(nodeAttrName_elecDocumentSize, {value:20000, displayValue: '19.53 KB'});
    expectedNode.attributes.set(nodeAttrName_extension, {value:'docx', displayValue: 'docx'});
    expectedNode.attributes.set(nodeAttrName_templateName, {value: 'hi', displayValue: 'hi'});
    expectedNode.attributes.set(nodeAttrName_creationTime, {value: '2000-05-11T00:00:00', displayValue: '5/11/2000, 12:00:00 AM'})
    service.columnIds = [nodeAttrName_elecDocumentSize,nodeAttrName_extension,nodeAttrName_templateName, nodeAttrName_creationTime];

    // @ts-ignore
    const createdNode = service.createNonRootLfRepoTreeNode(dummyDocumentEntryDocument, { name: 'Test Name', path: '\\' } as LfRepoTreeNode);
    expect(createdNode).toEqual(expectedNode);

  });

  it('should throw exception if entryType not set', () => {
    // @ts-ignore
    expect(() => service.createNonRootLfRepoTreeNode(dummyInvalidEntry, { name: 'Test Name', path: '\\' } as LfRepoTreeNode)).toThrow(`Entry type is undefined for entry: ${dummyInvalidEntry.id}`);
  });

  it('should throw exception if create a non-root node if parent is not provided', () => {
    // @ts-ignore
    expect(() => service.createNonRootLfRepoTreeNode(dummyShortcutDocumentShortcut)).toThrow(`Unable to determine path of entry: ${dummyShortcutDocumentShortcut.id}`);
  });

  it('can choose to view only folders, not documents or record series', async () => {
    // Act
    service.viewableEntryTypes = [EntryType.Folder];

    const childrenNodes = await service.getFolderChildrenAsync({ id: '1', path: '//' } as LfRepoTreeNode);

    // Assert
    const expectedIds = ['1', '12', '52', '53', '54',
      '55', '56', '57', '58', '59',
      '60', '61', '62'];
    const actualIds = childrenNodes.page.map((entry) => entry.id).sort();
    expect(actualIds).toEqual(expectedIds);
    expect(childrenNodes.page.length).toEqual(13);
  });

  it('getRootNodesAsync should call API getEntryAsync and coerce parentId = 0 into parentId = undefined', async () => {
    // Act
    const rootNodes = await service.getRootTreeNodeAsync();
    const expectedNode : LfRepoTreeNode = {
      name: 'Test Name',
      path: '\\',
      id: '1',
      icon: 'https://lfxstatic.com/npm/@laserfiche/lf-resource-library@4/resources/icons/document-icons.svg#folder-20',
      isContainer: true,
      isLeaf: false,
      entryType: EntryType.Folder,
      attributes: new Map<string, PropertyValue>()
    };

    // Assert
    expect(rootNodes?.id).toEqual('1');
    expect(rootNodes).toEqual(expectedNode);
  });

  it('getFolderChildrenAsync with undefined nextPage should call API getEntryListing ', async () => {
    // Arrange
    service.viewableEntryTypes = [EntryType.Folder, EntryType.Document];

    // Act
    const childrenNodes = await service.getFolderChildrenAsync({ id: '1', path: '//' } as LfRepoTreeNode);

    // Assert
    expect(childrenNodes.page.length).toEqual(20);
    expect(childrenNodes.nextPage).toEqual("a test link returned by getEntryListing");
    childrenNodes.page.forEach((childNode, i) => {
      expect(childNode.name).toEqual(mockChildren[i].name);
    })
  });

  it('getFolderChildrenAsync with nextPage should call API getEntryListingNextLink ', async () => {
    // Arrange
    service.viewableEntryTypes = [EntryType.Folder, EntryType.Document];

    // Act
    const childrenNodes = await service.getFolderChildrenAsync({ id: '1', path: '//' } as LfRepoTreeNode, '3');

    // Assert
    expect(childrenNodes.page.length).toEqual(20);
    expect(childrenNodes.nextPage).toEqual('a test link returned by getEntryListingNextLink');
    childrenNodes.page.forEach((childNode, i) => {
      expect(childNode.name).toEqual(mockChildren[i].name);
    })
  });

  it('getFolderChildrenAsync will call getFolderChildrenDefaultParameters with columnIds', async () => {
    // Arrange
    service.viewableEntryTypes = [EntryType.Folder, EntryType.Document];
    const columnIds = ['testid0', 'testid1'];
    service.columnIds = columnIds;
    const repoId = await mockRepoClient.getCurrentRepoId();
    // Act
    await service.getFolderChildrenAsync({ id: '1', path: '//' } as LfRepoTreeNode);

    // Assert
    expect(getFolderChildrenDefaultParametersSpy).toHaveBeenCalledWith(repoId, 1, columnIds, undefined);
  });

  it('getParentTreeNodeAsync should return undefined if called on rootNode', async () => {
    // Act
    const parent = await service.getParentTreeNodeAsync({ id: '1' } as LfRepoTreeNode);

    // Assert
    expect(parent).toEqual(undefined);
  });

  it('getParentTreeNodeAsync should return parent if parent is root', async () => {
    // Arrange
    const expectedNode: LfRepoTreeNode = {
      name: 'Test Name',
      path: '\\',
      id: '1',
      icon: 'https://lfxstatic.com/npm/@laserfiche/lf-resource-library@4/resources/icons/document-icons.svg#folder-20',
      isContainer: true,
      isLeaf: false,
      entryType: EntryType.Folder,
      attributes: new Map<string, PropertyValue>()
    };

    // Act
    const parent = await service.getParentTreeNodeAsync({ id: '2', path: '\\test', name: 'test' } as LfRepoTreeNode);

    // Assert
    expect(parent).toEqual(expectedNode);
  });

  it('getParentTreeNodeAsync should return parent if parent is folder', async () => {
    // Arrange
    const expectedNode: LfRepoTreeNode = {
      name: 'FolderInRoot',
      path: '\\FolderInRoot',
      id: '12',
      icon: 'https://lfxstatic.com/npm/@laserfiche/lf-resource-library@4/resources/icons/document-icons.svg#folder-20',
      isContainer: true,
      isLeaf: false,
      entryType: EntryType.Folder,
      attributes: new Map<string, PropertyValue>()
    };

    // Act
    const parent = await service.getParentTreeNodeAsync({ id: '2', path: '\\FolderInRoot\\test1', name: 'test1' } as LfRepoTreeNode);

    // Assert
    expect(parent).toEqual(expectedNode);
  });

  it('getParentTreeNodeAsync should return parent if parent is a folder in root', async () => {
    // Arrange
    const expectedNode: LfRepoTreeNode = {
      name: 'FolderInAFolder',
      path: '\\FolderInRoot\\FolderInAFolder',
      id: '62',
      icon: 'https://lfxstatic.com/npm/@laserfiche/lf-resource-library@4/resources/icons/document-icons.svg#folder-20',
      isContainer: true,
      isLeaf: false,
      entryType: EntryType.Folder,
      attributes: new Map<string, PropertyValue>()
    };

    // Act
    const parent = await service.getParentTreeNodeAsync({ id: '2', path: '\\FolderInRoot\\FolderInAFolder\\test1', name: 'test1' } as LfRepoTreeNode);

    // Assert
    expect(parent).toEqual(expectedNode);
  });



})
