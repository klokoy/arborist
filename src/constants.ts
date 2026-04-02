export const COMMANDS = {
  CREATE: "arborist.createWorktree",
  REMOVE: "arborist.removeWorktree",
  SWITCH: "arborist.switchWorktree",
  OPEN: "arborist.openWorktree",
  REFRESH: "arborist.refreshWorktrees",
  SET_COLOR: "arborist.setWorktreeColor",
  REBASE_ON_MAIN: "arborist.rebaseOnMain",
} as const;

export const VIEWS = {
  WORKTREE_EXPLORER: "arborist.worktreeExplorer",
} as const;

export const CONFIG_KEYS = {
  WORKTREE_LOCATION: "worktreeLocation",
  AUTO_OPEN_NEW_WINDOW: "autoOpenNewWindow",
  POST_CREATE_COMMANDS: "postCreateCommands",
  NAMING_PATTERN: "namingPattern",
  FILES_TO_COPY: "filesToCopy",
  MAIN_WORKTREE_COLOR: "mainWorktreeColor",
  COLOR_PALETTE: "colorPalette",
} as const;

export const CONTEXT_VALUES = {
  WORKTREE: "worktree",
  WORKTREE_MAIN: "worktreeMain",
} as const;

export const GLOBAL_STATE_KEYS = {
  COLOR_ASSIGNMENTS: "arborist.colorAssignments",
} as const;
