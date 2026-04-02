import * as vscode from "vscode";
import { WorktreeInfo } from "./types";
import { COMMANDS } from "./constants";

export class StatusBar implements vscode.Disposable {
  private item: vscode.StatusBarItem;

  constructor() {
    this.item = vscode.window.createStatusBarItem(
      vscode.StatusBarAlignment.Left,
      100,
    );
    this.item.command = COMMANDS.SWITCH;
    this.item.show();
  }

  update(worktrees: WorktreeInfo[]): void {
    const current = worktrees.find((wt) => wt.isCurrent);
    const branchName = current?.branchShort ?? "unknown";
    const count = worktrees.length;

    this.item.text = `$(git-branch) ${branchName} $(list-tree) ${count}`;
    this.item.tooltip = `Worktree: ${branchName} (${count} total)\nClick to switch`;
  }

  dispose(): void {
    this.item.dispose();
  }
}
