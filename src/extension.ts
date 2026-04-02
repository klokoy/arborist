import * as vscode from "vscode";
import { COMMANDS, VIEWS } from "./constants";
import { getMainWorktreePath, listWorktrees } from "./git/worktree";
import { WorktreeTreeProvider } from "./views/worktreeTreeProvider";
import { StatusBar } from "./statusBar";
import { ColorManager } from "./color/colorManager";
import { FileWatcher } from "./fileWatcher";
import { createWorktree } from "./commands/createWorktree";
import { removeWorktree } from "./commands/removeWorktree";
import { switchWorktree } from "./commands/switchWorktree";
import { openWorktree } from "./commands/openWorktree";
import { setWorktreeColor } from "./commands/setWorktreeColor";

export async function activate(
  context: vscode.ExtensionContext,
): Promise<void> {
  // Determine the main worktree path
  let mainWorktreePath: string;
  try {
    const workspaceRoot = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
    if (!workspaceRoot) return;
    mainWorktreePath = await getMainWorktreePath(workspaceRoot);
  } catch {
    // Not a git repo or git not available — don't activate
    return;
  }

  const colorManager = new ColorManager(context.globalState);
  const treeProvider = new WorktreeTreeProvider(mainWorktreePath);
  const statusBar = new StatusBar();

  const treeView = vscode.window.createTreeView(VIEWS.WORKTREE_EXPLORER, {
    treeDataProvider: treeProvider,
    showCollapseAll: false,
  });

  // Initial status bar update
  async function refreshStatusBar() {
    try {
      const worktrees = await listWorktrees(mainWorktreePath);
      statusBar.update(worktrees);
    } catch {
      // Silently fail — status bar just won't update
    }
  }

  await refreshStatusBar();

  // Register commands
  context.subscriptions.push(
    treeView,
    statusBar,

    vscode.commands.registerCommand(COMMANDS.CREATE, () =>
      createWorktree(mainWorktreePath, treeProvider, colorManager),
    ),

    vscode.commands.registerCommand(COMMANDS.REMOVE, (item?) =>
      removeWorktree(mainWorktreePath, treeProvider, colorManager, item),
    ),

    vscode.commands.registerCommand(COMMANDS.SWITCH, () =>
      switchWorktree(mainWorktreePath),
    ),

    vscode.commands.registerCommand(COMMANDS.OPEN, (item?) =>
      openWorktree(item),
    ),

    vscode.commands.registerCommand(COMMANDS.REFRESH, () => {
      treeProvider.refresh();
      refreshStatusBar();
    }),

    vscode.commands.registerCommand(COMMANDS.SET_COLOR, (item?) =>
      setWorktreeColor(mainWorktreePath, colorManager, treeProvider, item),
    ),
  );

  // File watcher — refresh tree and status bar on worktree changes
  const fileWatcher = new FileWatcher(mainWorktreePath, () => {
    treeProvider.refresh();
    refreshStatusBar();
  });
  context.subscriptions.push({ dispose: () => fileWatcher.dispose() });

  // Apply color for the current worktree on activation
  await colorManager.applyCurrentWorktreeColor();
}

export function deactivate(): void {
  // Nothing to clean up — subscriptions handle disposal
}
