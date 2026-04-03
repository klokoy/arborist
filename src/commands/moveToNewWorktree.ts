import * as vscode from "vscode";
import * as path from "path";
import * as fs from "fs";
import { getConfig } from "../config";
import { addWorktree } from "../git/worktree";
import { gitExec } from "../git/executor";
import { isDirty } from "../git/status";
import { WorktreeTreeProvider } from "../views/worktreeTreeProvider";
import { ColorManager } from "../color/colorManager";

function sanitizeBranchForPath(branch: string): string {
  return branch.replace(/[/\\:*?"<>|]/g, "-");
}

function computeWorktreePath(
  mainWorktreePath: string,
  branch: string,
  pattern: string,
): string {
  const repo = path.basename(mainWorktreePath);
  const sanitized = sanitizeBranchForPath(branch);
  const name = pattern
    .replace("{repo}", repo)
    .replace("{branch}", sanitized);
  return path.join(path.dirname(mainWorktreePath), name);
}

async function copyFiles(
  mainWorktreePath: string,
  targetPath: string,
  filesToCopy: string[],
): Promise<void> {
  for (const file of filesToCopy) {
    const src = path.join(mainWorktreePath, file);
    const dest = path.join(targetPath, file);

    try {
      const stat = await fs.promises.stat(src);
      if (stat.isDirectory()) {
        await fs.promises.cp(src, dest, { recursive: true });
      } else {
        await fs.promises.mkdir(path.dirname(dest), { recursive: true });
        await fs.promises.copyFile(src, dest);
      }
    } catch {
      // Source doesn't exist — skip silently
    }
  }
}

export async function moveToNewWorktree(
  mainWorktreePath: string,
  treeProvider: WorktreeTreeProvider,
  colorManager: ColorManager,
): Promise<void> {
  // Only works from the main worktree
  const currentPath = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
  if (!currentPath) return;

  // Check for uncommitted changes
  const dirty = await isDirty(mainWorktreePath);
  if (!dirty) {
    vscode.window.showInformationMessage(
      "No uncommitted changes to move.",
    );
    return;
  }

  const config = getConfig();

  // Prompt for branch name
  const branchName = await vscode.window.showInputBox({
    prompt: "Branch name for new worktree",
    placeHolder: "feature/my-feature",
    validateInput: (value) => {
      if (!value.trim()) return "Branch name is required";
      if (/\s/.test(value)) return "Branch name cannot contain spaces";
      return null;
    },
  });

  if (!branchName) return;

  const targetPath = computeWorktreePath(
    mainWorktreePath,
    branchName,
    config.namingPattern,
  );

  // Check if directory already exists
  try {
    await fs.promises.access(targetPath);
    vscode.window.showErrorMessage(
      `Directory already exists: ${path.basename(targetPath)}`,
    );
    return;
  } catch {
    // Good — doesn't exist
  }

  await vscode.window.withProgress(
    {
      location: vscode.ProgressLocation.Notification,
      title: `Moving changes to: ${branchName}`,
      cancellable: false,
    },
    async (progress) => {
      // Stash changes (including untracked files)
      progress.report({ message: "Stashing changes..." });
      await gitExec(
        ["stash", "push", "--include-untracked", "-m", `arborist: move to ${branchName}`],
        mainWorktreePath,
      );

      try {
        // Create the worktree
        progress.report({ message: "Creating worktree..." });
        await addWorktree(mainWorktreePath, targetPath, branchName, true);

        // Pop stash in the new worktree
        progress.report({ message: "Applying changes..." });
        await gitExec(["stash", "pop"], targetPath);
      } catch (err) {
        // If worktree creation or stash pop fails, restore the stash to main
        await gitExec(["stash", "pop"], mainWorktreePath).catch(() => {});
        throw err;
      }

      // Copy files
      if (config.filesToCopy.length > 0) {
        progress.report({ message: "Copying files..." });
        await copyFiles(mainWorktreePath, targetPath, config.filesToCopy);
      }

      // Assign color
      progress.report({ message: "Applying color..." });
      const color = await colorManager.assignColor(targetPath, false);
      await colorManager.applyColorToWorktree(targetPath, color);

      // Run post-create commands
      if (config.postCreateCommands.length > 0) {
        const terminal = vscode.window.createTerminal({
          name: `Arborist: ${branchName}`,
          cwd: targetPath,
        });
        for (const cmd of config.postCreateCommands) {
          terminal.sendText(cmd);
        }
        terminal.show();
      }

      // Refresh tree
      treeProvider.refresh();

      // Open in new window
      if (config.autoOpenNewWindow) {
        const uri = vscode.Uri.file(targetPath);
        await vscode.commands.executeCommand("vscode.openFolder", uri, {
          forceNewWindow: true,
        });
      }
    },
  );
}
