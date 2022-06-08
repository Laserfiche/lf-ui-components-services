import { LfRepoTreeNode } from './lf-tree-types.js';

export interface LfFolder {
  path: string;
  entryId: number | undefined;
  breadcrumbs?: LfRepoTreeNode[];
  displayName?: string;
  displayPath?: string;
}