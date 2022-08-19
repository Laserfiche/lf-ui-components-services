import { EntryType } from "@laserfiche/lf-repository-api-client";
import { LfTreeNodePage, LfTreeNode } from "@laserfiche/types-lf-ui-components";

export interface LfRepoTreeNode extends LfTreeNode {
  parentId?: string;
  extension?: string;
  elecDocumentSize?: number;
  targetType?: EntryType;
  targetId?: number;
}

export interface LfRepoTreeNodePage extends LfTreeNodePage {
  page: LfRepoTreeNode[];
  nextPage: string | undefined;
}

export enum LfRepoTreeEntryType {
  Document = 'Document',
  RecordSeries = 'RecordSeries',
  Folder = 'Folder',
  ShortcutFolder = 'ShortcutFolder',
  ShortcutDocument = 'ShortcutDocument'
}
