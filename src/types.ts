export interface StatusSummary {
  modified: number;
  untracked: number;
  staged: number;
}

export interface WorktreeInfo {
  path: string;
  head: string;
  branch: string | null;
  branchShort: string;
  isMain: boolean;
  isDirty: boolean;
  isCurrent: boolean;
  status: StatusSummary;
}
