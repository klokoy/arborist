import * as vscode from "vscode";

const DEFAULT_PALETTE = [
  "#1f6feb",
  "#a371f7",
  "#f0883e",
  "#f85149",
  "#3fb950",
  "#58a6ff",
  "#d2a8ff",
  "#e3b341",
];

export function getConfig() {
  const config = vscode.workspace.getConfiguration("arborist");
  return {
    worktreeLocation: config.get<string>("worktreeLocation", "sibling"),
    autoOpenNewWindow: config.get<boolean>("autoOpenNewWindow", true),
    postCreateCommands: config.get<string[]>("postCreateCommands", []),
    namingPattern: config.get<string>("namingPattern", "{repo}-{branch}"),
    filesToCopy: config.get<string[]>("filesToCopy", []),
    mainWorktreeColor: config.get<string>("mainWorktreeColor", "#2ea043"),
    colorPalette: config.get<string[]>("colorPalette", DEFAULT_PALETTE),
  };
}
