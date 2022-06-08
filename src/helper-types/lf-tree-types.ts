import { EntryType } from "@laserfiche/lf-repository-api-client";
import { TreeNode } from "@laserfiche/types-laserfiche-ui-components";

export interface LfRepoTreeNode extends TreeNode {
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
