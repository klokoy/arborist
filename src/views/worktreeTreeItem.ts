import * as path from "path";
import * as fs from "fs";
import * as os from "os";
import * as vscode from "vscode";
import { WorktreeInfo } from "../types";
import { COMMANDS, CONTEXT_VALUES } from "../constants";

const iconCache = new Map<string, vscode.Uri>();

function getColorIconUri(color: string): vscode.Uri {
  const cached = iconCache.get(color);
  if (cached) return cached;

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16"><circle cx="8" cy="8" r="6" fill="${color}"/></svg>`;
  const iconDir = path.join(os.tmpdir(), "arborist-icons");
  fs.mkdirSync(iconDir, { recursive: true });

  const safeColor = color.replace("#", "");
  const iconPath = path.join(iconDir, `color-${safeColor}.svg`);
  fs.writeFileSync(iconPath, svg);

  const uri = vscode.Uri.file(iconPath);
  iconCache.set(color, uri);
  return uri;
}

export class WorktreeTreeItem extends vscode.TreeItem {
  constructor(
    public readonly worktree: WorktreeInfo,
    assignedColor?: string,
  ) {
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

    if (assignedColor) {
      const iconUri = getColorIconUri(assignedColor);
      this.iconPath = { light: iconUri, dark: iconUri };
    } else {
      this.iconPath = new vscode.ThemeIcon("git-branch");
    }

    this.command = {
      command: COMMANDS.OPEN,
      title: "Open Worktree",
      arguments: [this],
    };
  }
}
