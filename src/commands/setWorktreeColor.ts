import * as vscode from "vscode";
import { getConfig } from "../config";
import { WorktreeTreeItem } from "../views/worktreeTreeItem";
import { WorktreeTreeProvider } from "../views/worktreeTreeProvider";
import { ColorManager } from "../color/colorManager";
import { listWorktrees } from "../git/worktree";

export async function setWorktreeColor(
  mainWorktreePath: string,
  colorManager: ColorManager,
  treeProvider: WorktreeTreeProvider,
  item?: WorktreeTreeItem,
): Promise<void> {
  let worktreePath: string;

  if (item) {
    worktreePath = item.worktree.path;
  } else {
    const worktrees = await listWorktrees(mainWorktreePath);
    const selected = await vscode.window.showQuickPick(
      worktrees.map((wt) => ({
        label: wt.branchShort,
        description: wt.path,
        path: wt.path,
      })),
      { placeHolder: "Select a worktree to color" },
    );
    if (!selected) return;
    worktreePath = selected.path;
  }

  const config = getConfig();
  const paletteItems = config.colorPalette.map((color) => ({
    label: `$(symbol-color) ${color}`,
    description: "",
    color,
  }));

  const colorChoice = await vscode.window.showQuickPick(
    [
      ...paletteItems,
      { label: "$(edit) Custom hex color...", description: "", color: "custom" },
    ],
    { placeHolder: "Choose a color" },
  );

  if (!colorChoice) return;

  let color: string;
  if (colorChoice.color === "custom") {
    const hex = await vscode.window.showInputBox({
      prompt: "Enter hex color (e.g. #ff6600)",
      placeHolder: "#ff6600",
      validateInput: (value) => {
        if (!/^#[0-9a-fA-F]{6}$/.test(value)) {
          return "Enter a valid 6-digit hex color (e.g. #ff6600)";
        }
        return null;
      },
    });
    if (!hex) return;
    color = hex;
  } else {
    color = colorChoice.color;
  }

  await colorManager.assignColor(worktreePath, false, color);
  await colorManager.applyColorToWorktree(worktreePath, color);
  treeProvider.refresh();
}
