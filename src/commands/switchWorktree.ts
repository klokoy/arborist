import * as vscode from "vscode";
import { listWorktrees } from "../git/worktree";

export async function switchWorktree(mainWorktreePath: string): Promise<void> {
  const worktrees = await listWorktrees(mainWorktreePath);

  const items = worktrees.map((wt) => ({
    label: wt.branchShort,
    description: wt.path,
    detail: [
      wt.isCurrent ? "$(check) current" : "",
      wt.isDirty ? "$(warning) uncommitted changes" : "",
      wt.isMain ? "$(home) main" : "",
    ]
      .filter(Boolean)
      .join("  "),
    path: wt.path,
  }));

  const selected = await vscode.window.showQuickPick(items, {
    placeHolder: "Select a worktree to open",
  });

  if (!selected) return;

  const uri = vscode.Uri.file(selected.path);
  await vscode.commands.executeCommand("vscode.openFolder", uri, {
    forceNewWindow: true,
  });
}
