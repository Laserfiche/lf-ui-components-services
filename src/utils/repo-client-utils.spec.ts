
import { ColumnOrderBy } from '@laserfiche/types-lf-ui-components';
import {getFolderChildrenDefaultParameters}  from './repo-client-utils';

fdescribe('LfRepoClientUtil', () => {
  const repoId = 'testRepoId';
  const folderId = 1;
  const orderBy: ColumnOrderBy = {
    columnId: 'test',
    isDesc: true,
  };
  const defaultParams = 'targetType,targetId,extension,parentId';
  it('should add orderBy parameters if provided', () => {
    const orderBy: ColumnOrderBy = {
      columnId: 'test',
      isDesc: false,
    };
    const expectedParams = getFolderChildrenDefaultParameters(repoId, folderId, undefined, orderBy);
    expect(expectedParams.orderby).toEqual(
     'test asc'
    );
    expect(expectedParams.select).toEqual(
      defaultParams + ',test'
    );
  });

  it('should mirror the isDesc property received', () => {
    const expectedParams = getFolderChildrenDefaultParameters(repoId, folderId, undefined, orderBy);
    expect(expectedParams.orderby).toEqual(
     'test desc'
    );
    expect(expectedParams.select).toEqual(
      defaultParams + ',test'
    );
  });
  it('should give default value for orderby if not provided', () => {

    const expectedParams = getFolderChildrenDefaultParameters(repoId, folderId);
    expect(expectedParams.orderby).toEqual(
     'name asc'
    );
    expect(expectedParams.select).toEqual(
      defaultParams
    );
  });
  it('should append to select when columnIds provided.', () => {
    const columnIDs: string[] = ['test0', 'test1', 'test2'];
    const expectedParams = getFolderChildrenDefaultParameters(repoId, folderId, columnIDs);
    expect(expectedParams.orderby).toEqual(
     'name asc'
    );
    expect(expectedParams.select).toEqual(
      defaultParams + ',test0,test1,test2'
    );
  });
  it('should handle empty array for columnID as if it were undefined', () => {
    const columnIDs: string[] = [];
    const expectedParams = getFolderChildrenDefaultParameters(repoId, folderId, columnIDs);
    expect(expectedParams.orderby).toEqual(
     'name asc'
    );
    expect(expectedParams.select).toEqual(
      defaultParams
    );
  });
  it('should append to select when columnIds provided.', () => {
    const columnIDs: string[] = ['test0', 'test1', 'test2'];
    const expectedParams = getFolderChildrenDefaultParameters(repoId, folderId, columnIDs);
    expect(expectedParams.orderby).toEqual(
     'name asc'
    );
    expect(expectedParams.select).toEqual(
      defaultParams + ',test0,test1,test2'
    );
  });
  it('should append to select when columnIds and orderBy provided.', () => {
    const columnIDs: string[] = ['test0', 'test1', 'test2'];
    const expectedParams = getFolderChildrenDefaultParameters(repoId, folderId, columnIDs, orderBy);
    expect(expectedParams.orderby).toEqual(
     'test desc'
    );
    expect(expectedParams.select).toEqual(
      defaultParams + ',test0,test1,test2,test'
    );
  });

})
