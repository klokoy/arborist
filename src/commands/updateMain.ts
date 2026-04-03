import * as vscode from "vscode";
import { getMainBranchName, pull } from "../git/branch";
import { WorktreeTreeProvider } from "../views/worktreeTreeProvider";
import { GitError } from "../git/executor";

export async function updateMain(
  mainWorktreePath: string,
  treeProvider: WorktreeTreeProvider,
): Promise<void> {
  const mainBranch = await getMainBranchName(mainWorktreePath);

  await vscode.window.withProgress(
    {
      location: vscode.ProgressLocation.Notification,
      title: `Pulling latest ${mainBranch}`,
      cancellable: false,
    },
    async () => {
      try {
        await pull(mainWorktreePath);
        treeProvider.refresh();
        vscode.window.showInformationMessage(
          `Updated ${mainBranch} successfully.`,
        );
      } catch (err) {
        if (err instanceof GitError) {
          vscode.window.showErrorMessage(
            `Failed to update ${mainBranch}: ${err.stderr || err.message}`,
          );
        } else {
          vscode.window.showErrorMessage(
            `Failed to update ${mainBranch}: ${err instanceof Error ? err.message : String(err)}`,
          );
        }
      }
    },
  );
}
