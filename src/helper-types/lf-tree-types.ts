import { EntryType } from "@laserfiche/lf-repository-api-client";
import { LfTreeNode } from "@laserfiche/types-lf-ui-components";

export interface LfRepoTreeNode extends LfTreeNode {
  parentId?: string;
  extension?: string;
  elecDocumentSize?: number;
  targetType?: EntryType;
  targetId?: number;
}

export enum LfRepoTreeEntryType {
  Document = 'Document',
  RecordSeries = 'RecordSeries',
  Folder = 'Folder',
  ShortcutFolder = 'ShortcutFolder',
  ShortcutDocument = 'ShortcutDocument'
}
