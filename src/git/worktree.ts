import * as path from "path";
import * as fs from "fs";
import * as vscode from "vscode";
import { WorktreeInfo } from "../types";
import { gitExec } from "./executor";
import { isDirty } from "./status";

function realPath(p: string): string {
  try {
    return fs.realpathSync(p);
  } catch {
    return path.resolve(p);
  }
}

interface RawWorktree {
  path: string;
  head: string;
  branch: string | null;
}

function parsePorcelain(output: string): RawWorktree[] {
  const worktrees: RawWorktree[] = [];
  const blocks = output.trim().split("\n\n");

  for (const block of blocks) {
    if (!block.trim()) continue;

    const lines = block.trim().split("\n");
    const entry: Partial<RawWorktree> = { branch: null };

    for (const line of lines) {
      if (line.startsWith("worktree ")) {
        entry.path = line.substring("worktree ".length);
      } else if (line.startsWith("HEAD ")) {
        entry.head = line.substring("HEAD ".length);
      } else if (line.startsWith("branch ")) {
        entry.branch = line.substring("branch ".length);
      }
    }

    if (entry.path && entry.head) {
      worktrees.push(entry as RawWorktree);
    }
  }

  return worktrees;
}

function branchShortName(branch: string | null): string {
  if (!branch) return "(detached)";
  const prefix = "refs/heads/";
  return branch.startsWith(prefix) ? branch.substring(prefix.length) : branch;
}

export async function listWorktrees(cwd: string): Promise<WorktreeInfo[]> {
  const output = await gitExec(["worktree", "list", "--porcelain"], cwd);
  const raw = parsePorcelain(output);

  const currentPath = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;

  const worktrees = await Promise.all(
    raw.map(async (entry, index) => {
      const dirty = await isDirty(entry.path).catch(() => false);
      const resolvedCurrent = currentPath ? realPath(currentPath) : null;
      const resolvedEntry = realPath(entry.path);

      return {
        path: entry.path,
        head: entry.head,
        branch: entry.branch,
        branchShort: branchShortName(entry.branch),
        isMain: index === 0,
        isDirty: dirty,
        isCurrent: resolvedCurrent === resolvedEntry,
      };
    }),
  );

  return worktrees;
}

export async function addWorktree(
  cwd: string,
  targetPath: string,
  branch: string,
  createBranch: boolean,
): Promise<void> {
  if (createBranch) {
    await gitExec(["worktree", "add", "-b", branch, targetPath], cwd);
  } else {
    await gitExec(["worktree", "add", targetPath, branch], cwd);
  }
}

export async function removeWorktree(
  cwd: string,
  worktreePath: string,
  force = false,
): Promise<void> {
  const args = ["worktree", "remove", worktreePath];
  if (force) args.push("--force");
  await gitExec(args, cwd);
}

export async function getMainWorktreePath(cwd: string): Promise<string> {
  const output = await gitExec(["worktree", "list", "--porcelain"], cwd);
  const raw = parsePorcelain(output);
  if (raw.length === 0) {
    throw new Error("No worktrees found");
  }
  return raw[0].path;
}

// Exported for testing
export { parsePorcelain, branchShortName };
