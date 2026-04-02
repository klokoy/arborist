import * as vscode from "vscode";
import { WorktreeTreeItem } from "../views/worktreeTreeItem";

export async function openWorktree(item?: WorktreeTreeItem): Promise<void> {
  if (!item) return;

  const uri = vscode.Uri.file(item.worktree.path);
  await vscode.commands.executeCommand("vscode.openFolder", uri, {
    forceNewWindow: true,
  });
}
