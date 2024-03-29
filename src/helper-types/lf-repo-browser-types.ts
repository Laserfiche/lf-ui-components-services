// Copyright (c) Laserfiche.
// Licensed under the MIT License. See LICENSE in the project root for license information.

import { EntryType } from "@laserfiche/lf-repository-api-client";
import { LfTreeNode, LfTreeNodePage } from "@laserfiche/types-lf-ui-components";

/**
 * Represents a Laserfiche Repository Entry
 */
export interface LfRepoTreeNode extends LfTreeNode {
  /**
   * EntryType defined in @laserfiche/lf-repository-api-client
   */
  entryType: EntryType;
  /**
   * shortcut EntryType (applies only to shortcut)
   */
  targetType?: EntryType;
  /**
   * shortcut target EntryId (applies only to shortcut)
   */
  targetId?: number;
}

export const allSupportedRepositoryColumnIds: string[] = [
  'name',
  'id',
  'elecDocumentSize',
  'extension',
  'isElectronicDocument',
  'isRecord',
  'mimeType',
  'pageCount',
  'isCheckedOut',
  'isUnderVersionControl',
  'creator',
  'creationTime',
  'lastModifiedTime',
  'templateName',
]
export interface LfRepoTreeNodePage extends LfTreeNodePage {
  page: LfRepoTreeNode[];
  nextPage: string | undefined;
}
