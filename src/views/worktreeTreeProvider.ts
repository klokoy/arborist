import * as vscode from "vscode";
import { WorktreeTreeItem } from "./worktreeTreeItem";
import { listWorktrees } from "../git/worktree";

export class WorktreeTreeProvider
  implements vscode.TreeDataProvider<WorktreeTreeItem>
{
  private _onDidChangeTreeData =
    new vscode.EventEmitter<WorktreeTreeItem | undefined | void>();
  readonly onDidChangeTreeData = this._onDidChangeTreeData.event;

  private refreshInFlight = false;

  constructor(private mainWorktreePath: string | undefined) {}

  refresh(): void {
    if (this.refreshInFlight) return;
    this.refreshInFlight = true;
    // Small delay to coalesce rapid calls
    setTimeout(() => {
      this._onDidChangeTreeData.fire();
      this.refreshInFlight = false;
    }, 100);
  }

  getTreeItem(element: WorktreeTreeItem): vscode.TreeItem {
    return element;
  }

  async getChildren(
    element?: WorktreeTreeItem,
  ): Promise<WorktreeTreeItem[]> {
    if (element || !this.mainWorktreePath) return [];

    try {
      const worktrees = await listWorktrees(this.mainWorktreePath);
      return worktrees.map((wt) => new WorktreeTreeItem(wt));
    } catch {
      return [];
    }
  }
}
