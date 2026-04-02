import * as path from "path";
import * as vscode from "vscode";
import { WorktreeInfo } from "../types";
import { COMMANDS, CONTEXT_VALUES } from "../constants";

export class WorktreeTreeItem extends vscode.TreeItem {
  constructor(public readonly worktree: WorktreeInfo) {
    super(worktree.branchShort, vscode.TreeItemCollapsibleState.None);

    const dirtyIndicator = worktree.isDirty ? " \u25cf" : "";
    const currentIndicator = worktree.isCurrent ? " (current)" : "";
    this.description = `${dirtyIndicator}${currentIndicator}`;

    const relativePath = path.relative(
      path.dirname(worktree.path),
      worktree.path,
    );
    this.tooltip = new vscode.MarkdownString(
      [
        `**${worktree.branchShort}**`,
        `Path: \`${relativePath}\``,
        `HEAD: \`${worktree.head.substring(0, 8)}\``,
        worktree.isDirty ? "Status: uncommitted changes" : "Status: clean",
      ].join("\n\n"),
    );

    this.contextValue = worktree.isMain
      ? CONTEXT_VALUES.WORKTREE_MAIN
      : CONTEXT_VALUES.WORKTREE;

    this.iconPath = new vscode.ThemeIcon(
      "git-branch",
      worktree.isDirty
        ? new vscode.ThemeColor("charts.yellow")
        : worktree.isMain
          ? new vscode.ThemeColor("charts.green")
          : undefined,
    );

    this.command = {
      command: COMMANDS.OPEN,
      title: "Open Worktree",
      arguments: [this],
    };
  }
}
