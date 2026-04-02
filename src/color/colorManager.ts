import * as vscode from "vscode";
import * as path from "path";
import * as fs from "fs";

function realPath(p: string): string {
  try {
    return fs.realpathSync(p);
  } catch {
    return path.resolve(p);
  }
}
import { GLOBAL_STATE_KEYS } from "../constants";
import { getConfig } from "../config";
import { getForegroundColor, getInactiveBackground, getNextColor } from "./palette";

interface ColorAssignments {
  [worktreePath: string]: string;
}

export class ColorManager {
  constructor(private globalState: vscode.Memento) {}

  private getAssignments(): ColorAssignments {
    return this.globalState.get<ColorAssignments>(
      GLOBAL_STATE_KEYS.COLOR_ASSIGNMENTS,
      {},
    );
  }

  private async saveAssignments(assignments: ColorAssignments): Promise<void> {
    await this.globalState.update(
      GLOBAL_STATE_KEYS.COLOR_ASSIGNMENTS,
      assignments,
    );
  }

  async assignColor(
    worktreePath: string,
    isMain: boolean,
    color?: string,
  ): Promise<string> {
    const config = getConfig();
    const assignments = this.getAssignments();

    if (color) {
      assignments[realPath(worktreePath)] = color;
    } else if (isMain) {
      assignments[realPath(worktreePath)] = config.mainWorktreeColor;
    } else {
      const usedColors = Object.values(assignments);
      assignments[realPath(worktreePath)] = getNextColor(config.colorPalette, usedColors);
    }

    await this.saveAssignments(assignments);
    return assignments[realPath(worktreePath)];
  }

  async removeColor(worktreePath: string): Promise<void> {
    const assignments = this.getAssignments();
    delete assignments[realPath(worktreePath)];
    await this.saveAssignments(assignments);
  }

  getColor(worktreePath: string): string | undefined {
    return this.getAssignments()[realPath(worktreePath)];
  }

  async applyColorToWorktree(
    worktreePath: string,
    color: string,
  ): Promise<void> {
    const fg = getForegroundColor(color);
    const inactiveBg = getInactiveBackground(color);

    const colorCustomizations = {
      "titleBar.activeBackground": color,
      "titleBar.activeForeground": fg,
      "titleBar.inactiveBackground": inactiveBg,
      "titleBar.inactiveForeground": `${fg}cc`,
      "activityBar.background": color,
      "activityBar.foreground": fg,
      "activityBar.inactiveForeground": `${fg}aa`,
      "statusBar.background": color,
      "statusBar.foreground": fg,
      "statusBar.debuggingBackground": color,
      "statusBar.noFolderBackground": color,
    };

    // If this is the current workspace, use the VS Code API for instant apply
    const currentPath = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
    if (currentPath && realPath(currentPath) === realPath(worktreePath)) {
      const config = vscode.workspace.getConfiguration("workbench");
      const existing = config.get<Record<string, string>>("colorCustomizations", {});
      await config.update(
        "colorCustomizations",
        { ...existing, ...colorCustomizations },
        vscode.ConfigurationTarget.Workspace,
      );
      return;
    }

    // For other worktrees, write directly to .vscode/settings.json
    await this.writeSettingsFile(worktreePath, colorCustomizations);
  }

  async applyCurrentWorktreeColor(): Promise<void> {
    const currentPath = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
    if (!currentPath) return;

    const resolved = realPath(currentPath);
    const color = this.getColor(resolved);
    if (color) {
      await this.applyColorToWorktree(resolved, color);
    }
  }

  private async writeSettingsFile(
    worktreePath: string,
    colorCustomizations: Record<string, string>,
  ): Promise<void> {
    const vscodePath = path.join(worktreePath, ".vscode");
    const settingsPath = path.join(vscodePath, "settings.json");

    await fs.promises.mkdir(vscodePath, { recursive: true });

    let existing: Record<string, unknown> = {};
    try {
      const content = await fs.promises.readFile(settingsPath, "utf-8");
      // Strip single-line comments for JSONC compatibility
      const stripped = content
        .replace(/\/\/.*$/gm, "")
        .replace(/,\s*([}\]])/g, "$1");
      existing = JSON.parse(stripped);
    } catch {
      // File doesn't exist or is invalid — start fresh
    }

    existing["workbench.colorCustomizations"] = {
      ...((existing["workbench.colorCustomizations"] as Record<string, string>) ?? {}),
      ...colorCustomizations,
    };

    await fs.promises.writeFile(
      settingsPath,
      JSON.stringify(existing, null, 2) + "\n",
    );
  }
}
