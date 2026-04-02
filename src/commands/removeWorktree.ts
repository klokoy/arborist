import * as vscode from "vscode";
import { listWorktrees, removeWorktree as gitRemoveWorktree } from "../git/worktree";
import { deleteBranch, isBranchMerged } from "../git/branch";
import { WorktreeTreeItem } from "../views/worktreeTreeItem";
import { WorktreeTreeProvider } from "../views/worktreeTreeProvider";
import { ColorManager } from "../color/colorManager";

export async function removeWorktree(
  mainWorktreePath: string,
  treeProvider: WorktreeTreeProvider,
  colorManager: ColorManager,
  item?: WorktreeTreeItem,
): Promise<void> {
  let worktreePath: string;
  let branchName: string | null;

  if (item) {
    worktreePath = item.worktree.path;
    branchName = item.worktree.branchShort;
  } else {
    // Pick from non-main worktrees
    const worktrees = await listWorktrees(mainWorktreePath);
    const removable = worktrees.filter((wt) => !wt.isMain);

    if (removable.length === 0) {
      vscode.window.showInformationMessage("No worktrees to remove.");
      return;
    }

    const selected = await vscode.window.showQuickPick(
      removable.map((wt) => ({
        label: wt.branchShort,
        description: wt.path,
        detail: wt.isDirty ? "$(warning) uncommitted changes" : "",
        worktree: wt,
      })),
      { placeHolder: "Select a worktree to remove" },
    );

    if (!selected) return;
    worktreePath = selected.worktree.path;
    branchName = selected.worktree.branchShort;
  }

  // Build warning messages
  const warnings: string[] = [];

  if (branchName && branchName !== "(detached)") {
    const merged = await isBranchMerged(mainWorktreePath, branchName).catch(
      () => true,
    );
    if (!merged) {
      warnings.push(`Branch '${branchName}' has unmerged changes.`);
    }
  }

  // Confirm
  const message =
    warnings.length > 0
      ? `${warnings.join(" ")} Remove worktree anyway?`
      : `Remove worktree '${branchName}'?`;

  const options = warnings.length > 0
    ? ["Remove", "Force Remove", "Cancel"]
    : ["Remove", "Cancel"];

  const action = await vscode.window.showWarningMessage(
    message,
    ...options,
  );

  if (!action || action === "Cancel") return;

  const force = action === "Force Remove";

  try {
    await gitRemoveWorktree(mainWorktreePath, worktreePath, force);

    if (branchName && branchName !== "(detached)") {
      await deleteBranch(mainWorktreePath, branchName, force).catch(() => {
        // Branch may already be deleted or is checked out elsewhere
      });
    }

    await colorManager.removeColor(worktreePath);
    treeProvider.refresh();

    vscode.window.showInformationMessage(
      `Removed worktree '${branchName}'.`,
    );
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    vscode.window.showErrorMessage(`Failed to remove worktree: ${msg}`);
  }
}
