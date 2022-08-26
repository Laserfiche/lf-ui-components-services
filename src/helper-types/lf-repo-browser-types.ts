import { EntryType } from "@laserfiche/lf-repository-api-client";
import { LfTreeNodePage, LfTreeNode } from "@laserfiche/types-lf-ui-components";

/**
 * Represents a Laserfiche Repository Entry
 */
export interface LfRepoTreeNode extends LfTreeNode {
  /**
   * parent EntryId
   */
  parentId?: string;
  /**
   * EntryType
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
