/** @internal */
export async function getFolderChildrenDefaultParametersAsync(repoId: string, folderId: number): Promise<{
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
}> {
  const requestParameters = {
    repoId,
    entryId: folderId,
    orderby: 'name asc', // sort by name, ascending
    select: 'creationTime,creator,folderPath,fullPath,elecDocumentSize,extension' +
      ',lastModifiedTime,parentId,templateId,targetType,targetId',
    groupByEntryType: true, // puts all folders before all files,
    prefer: 'odata.maxpagesize=20'
  };
  return requestParameters;
}

/** @internal */
export async function getEntryDefaultParametersAsync(repoId: string, folderId: number): Promise<{
  repoId: string;
  entryId: number;
  select?: string;
}> {
  const requestParameters = {
    repoId,
    entryId: folderId,
    select: 'id,isContainer,isLeaf,name,entryType,templateName,templateFieldNames'
     + ',creationTime,creator,folderPath,fullPath,elecDocumentSize,extension' +
      ',lastModifiedTime,parentId,templateId,targetType,targetId'
  };
  return requestParameters;
}
