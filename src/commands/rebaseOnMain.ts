import * as vscode from "vscode";
import { isDirty } from "../git/status";
import { getMainBranchName, fetchOrigin, rebase } from "../git/branch";
import { WorktreeTreeProvider } from "../views/worktreeTreeProvider";
import { WorktreeTreeItem } from "../views/worktreeTreeItem";
import { GitError } from "../git/executor";

export async function rebaseOnMain(
  mainWorktreePath: string,
  treeProvider: WorktreeTreeProvider,
  item?: WorktreeTreeItem,
): Promise<void> {
  // Determine target worktree path
  const worktreePath =
    item?.worktree.path ??
    vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;

  if (!worktreePath) {
    vscode.window.showErrorMessage("No worktree found.");
    return;
  }

  // Don't rebase the main worktree onto itself
  if (item?.worktree.isMain || worktreePath === mainWorktreePath) {
    vscode.window.showInformationMessage(
      "You're already on the main worktree.",
    );
    return;
  }

  // Check for uncommitted changes
  const dirty = await isDirty(worktreePath);
  if (dirty) {
    vscode.window.showWarningMessage(
      "Worktree has uncommitted changes. Please commit or stash before rebasing.",
    );
    return;
  }

  const mainBranch = await getMainBranchName(mainWorktreePath);

  await vscode.window.withProgress(
    {
      location: vscode.ProgressLocation.Notification,
      title: `Rebasing on ${mainBranch}`,
      cancellable: false,
    },
    async (progress) => {
      try {
        progress.report({ message: `Fetching origin/${mainBranch}...` });
        await fetchOrigin(worktreePath, mainBranch);

        progress.report({ message: "Rebasing..." });
        await rebase(worktreePath, `origin/${mainBranch}`);

        treeProvider.refresh();
        vscode.window.showInformationMessage(
          `Rebased successfully onto origin/${mainBranch}.`,
        );
      } catch (err) {
        if (err instanceof GitError) {
          // Rebase conflict — tell user to resolve in terminal
          if (err.stderr.includes("CONFLICT") || err.stderr.includes("could not apply")) {
            vscode.window.showWarningMessage(
              "Rebase encountered conflicts. Resolve them in the terminal, then run `git rebase --continue`.",
            );
          } else {
            vscode.window.showErrorMessage(
              `Rebase failed: ${err.stderr || err.message}`,
            );
          }
        } else {
          vscode.window.showErrorMessage(
            `Rebase failed: ${err instanceof Error ? err.message : String(err)}`,
          );
        }
      }
    },
  );
}
