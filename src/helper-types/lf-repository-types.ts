import { LfTreeNode } from "@laserfiche/types-lf-ui-components";

export interface LfFolder {
  path: string;
  entryId: number | undefined;
  breadcrumbs?: LfTreeNode[];
  displayName?: string;
  displayPath?: string;
}
