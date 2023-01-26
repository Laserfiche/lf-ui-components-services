import { ColumnOrderBy } from "@laserfiche/types-lf-ui-components";

/** @internal */
export async function getFolderChildrenDefaultParametersAsync(repoId: string, folderId: number, orderBy?: ColumnOrderBy): Promise<{
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
  let orderbyValue : string;
  if ( orderBy ) {
    orderbyValue = `${orderBy.columnId} ${ orderBy.isDesc ? 'desc' : 'asc'}`;
  }
  else {
    orderbyValue = 'name asc';
  }
  const requestParameters = {
    repoId,
    entryId: folderId,
    orderby: orderbyValue, // sort by name, ascending
    select: 'creationTime,creator,folderPath,fullPath,elecDocumentSize,extension' +
      ',lastModifiedTime,parentId,templateId,targetType,targetId',
    groupByEntryType: true, // puts all folders before all files,
    prefer: 'odata.maxpagesize=100'
  };
  return requestParameters;
}
