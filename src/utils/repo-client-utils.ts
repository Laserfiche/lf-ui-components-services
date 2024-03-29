// Copyright (c) Laserfiche.
// Licensed under the MIT License. See LICENSE in the project root for license information.

import { ColumnOrderBy } from '@laserfiche/types-lf-ui-components';

/** @internal */
export function getFolderChildrenDefaultParameters(
  repoId: string,
  folderId: number,
  columnIDs?: string[],
  orderBy?: ColumnOrderBy
): {
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
} {
  let orderbyValue: string;

  const selectList = ['targetType', 'targetId', 'extension', 'parentId'];
  if (columnIDs && columnIDs.length > 0) {
    selectList.push(...columnIDs);
  }
  if (orderBy) {
    orderbyValue = `${orderBy.columnId} ${orderBy.isDesc ? 'desc' : 'asc'}`;

    if (!selectList.includes(orderBy.columnId)) {
      selectList.push(orderBy.columnId)
    }
  } else {
    orderbyValue = 'name asc';
  }
  const select = selectList.join(',');

  const requestParameters = {
    repoId,
    entryId: folderId,
    orderby: orderbyValue, // sort by name, ascending
    select,
    groupByEntryType: true, // puts all folders before all files,
    prefer: 'odata.maxpagesize=100',
  };
  return requestParameters;
}
