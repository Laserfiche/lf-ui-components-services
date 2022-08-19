/** @internal */
export async function getFolderChildrenDefaultParametersAsync(repoId: string, folderId: number, skip?: number): Promise<{
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
        $orderby: 'name asc', // sort by name, ascending
        $select: 'creationTime,creator,folderPath,fullPath,elecDocumentSize,extension' +
            ',lastModifiedTime,parentId,templateId,targetType,targetId',
        groupByEntryType: true, // puts all folders before all files,
        top: 20,
        skip: skip
    };
    return requestParameters;
}
