import * as vscode from "vscode";
import * as path from "path";
import * as fs from "fs";
import { getConfig } from "../config";
import { addWorktree } from "../git/worktree";
import { listBranches, listRemoteBranches } from "../git/branch";
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

export async function createWorktree(
  mainWorktreePath: string,
  treeProvider: WorktreeTreeProvider,
  colorManager: ColorManager,
): Promise<void> {
  const config = getConfig();

  // Choose: new branch or existing
  const choice = await vscode.window.showQuickPick(
    [
      { label: "$(add) Create new branch", value: "new" },
      { label: "$(git-branch) Use existing branch", value: "existing" },
    ],
    { placeHolder: "Create worktree from..." },
  );

  if (!choice) return;

  let branchName: string | undefined;
  let createBranch = false;

  if (choice.value === "new") {
    branchName = await vscode.window.showInputBox({
      prompt: "Branch name",
      placeHolder: "feature/my-feature",
      validateInput: (value) => {
        if (!value.trim()) return "Branch name is required";
        if (/\s/.test(value)) return "Branch name cannot contain spaces";
        return null;
      },
    });
    createBranch = true;
  } else {
    const [local, remote] = await Promise.all([
      listBranches(mainWorktreePath),
      listRemoteBranches(mainWorktreePath).catch(() => []),
    ]);

    const allBranches = [
      ...local.map((b) => ({ label: b, description: "local" })),
      ...remote
        .filter((rb) => !local.includes(rb.replace(/^origin\//, "")))
        .map((b) => ({ label: b, description: "remote" })),
    ];

    const selected = await vscode.window.showQuickPick(allBranches, {
      placeHolder: "Select a branch",
    });

    if (!selected) return;
    branchName = selected.label.replace(/^origin\//, "");
  }

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
      title: `Creating worktree: ${branchName}`,
      cancellable: false,
    },
    async (progress) => {
      // Create the worktree
      progress.report({ message: "Creating worktree..." });
      await addWorktree(mainWorktreePath, targetPath, branchName, createBranch);

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
