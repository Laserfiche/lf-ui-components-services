import { LfRepoTreeNode } from "./lf-repo-browser-types";

export interface LfFolder {
  path: string;
  entryId: number | undefined;
  breadcrumbs?: LfRepoTreeNode[];
  displayName?: string;
  displayPath?: string;
}
