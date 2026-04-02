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
  const workspaceRoot = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
  let mainWorktreePath: string | undefined;
  if (workspaceRoot) {
    try {
      mainWorktreePath = await getMainWorktreePath(workspaceRoot);
    } catch (err) {
      console.error("Arborist: failed to find git worktree:", err);
    }
  }
  console.log("Arborist: workspaceRoot =", workspaceRoot, "mainWorktreePath =", mainWorktreePath);

  const colorManager = new ColorManager(context.globalState);
  const treeProvider = new WorktreeTreeProvider(mainWorktreePath, colorManager);
  const statusBar = new StatusBar();

  const treeView = vscode.window.createTreeView(VIEWS.WORKTREE_EXPLORER, {
    treeDataProvider: treeProvider,
    showCollapseAll: false,
  });

  context.subscriptions.push(treeView, statusBar);

  // If no git repo found, register noop commands and stop
  if (!mainWorktreePath) {
    context.subscriptions.push(
      vscode.commands.registerCommand(COMMANDS.CREATE, () => {}),
      vscode.commands.registerCommand(COMMANDS.REMOVE, () => {}),
      vscode.commands.registerCommand(COMMANDS.SWITCH, () => {}),
      vscode.commands.registerCommand(COMMANDS.OPEN, () => {}),
      vscode.commands.registerCommand(COMMANDS.REFRESH, () => {}),
      vscode.commands.registerCommand(COMMANDS.SET_COLOR, () => {}),
    );
    return;
  }

  const mainPath = mainWorktreePath;

  // Initial status bar update
  async function refreshStatusBar() {
    try {
      const worktrees = await listWorktrees(mainPath);
      statusBar.update(worktrees);
    } catch {
      // Silently fail — status bar just won't update
    }
  }

  await refreshStatusBar();

  // Register commands
  context.subscriptions.push(
    vscode.commands.registerCommand(COMMANDS.CREATE, () =>
      createWorktree(mainPath, treeProvider, colorManager),
    ),

    vscode.commands.registerCommand(COMMANDS.REMOVE, (item?) =>
      removeWorktree(mainPath, treeProvider, colorManager, item),
    ),

    vscode.commands.registerCommand(COMMANDS.SWITCH, () =>
      switchWorktree(mainPath),
    ),

    vscode.commands.registerCommand(COMMANDS.OPEN, (item?) =>
      openWorktree(item),
    ),

    vscode.commands.registerCommand(COMMANDS.REFRESH, () => {
      treeProvider.refresh();
      refreshStatusBar();
    }),

    vscode.commands.registerCommand(COMMANDS.SET_COLOR, (item?) =>
      setWorktreeColor(mainPath, colorManager, treeProvider, item),
    ),
  );

  // File watcher — refresh tree and status bar on worktree changes
  const fileWatcher = new FileWatcher(mainPath, () => {
    treeProvider.refresh();
    refreshStatusBar();
  });
  context.subscriptions.push({ dispose: () => fileWatcher.dispose() });

  // Ensure the main worktree has a color assigned (green by default)
  if (!colorManager.getColor(mainPath)) {
    const color = await colorManager.assignColor(mainPath, true);
    await colorManager.applyColorToWorktree(mainPath, color);
  }

  // Apply color for the current worktree on activation
  await colorManager.applyCurrentWorktreeColor();
}

export function deactivate(): void {
  // Nothing to clean up — subscriptions handle disposal
}
