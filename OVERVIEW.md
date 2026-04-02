# Arborist — Project Overview

> **Edit this document** to refine the scope and features before implementation begins.

## Vision

A VS Code extension that makes Git worktree workflows feel native. Developers should be able to create, switch between, and clean up worktrees without leaving their editor or memorizing git commands.

## Target Workflow

```
~/projects/my-app/              ← main worktree (main branch, kept clean)
~/projects/my-app-feature-login/ ← worktree for feature-login
~/projects/my-app-fix-header/    ← worktree for fix-header-bug
```

Each worktree = one branch. Folders are siblings named `{repo}-{branch}`. When a branch is merged, the worktree and branch are cleaned up together.

## Core Features (MVP)

### 1. Sidebar Panel — Worktree Explorer
- Tree view listing all worktrees for the current repo
- Show branch name, path, and dirty/clean status
- Click to open a worktree in a new VS Code window

### 2. Create Worktree
- Command palette: "Arborist: New Worktree"
- Prompts for branch name (new or existing)
- Creates worktree as sibling directory `../{repo}-{branch}`
- Optionally opens the new worktree in a new window

### 3. Remove Worktree
- Context menu on worktree in sidebar, or command palette
- Runs `git worktree remove` + `git branch -d`
- Warns if branch has unmerged changes

### 4. Quick Switch
- Command palette: "Arborist: Switch Worktree"
- Quick pick list of all worktrees
- Opens selected worktree in current or new window

### 5. Status Bar
- Shows current worktree/branch info
- Indicator for total number of active worktrees

### 6. Worktree Color Theming
- Each worktree gets a distinct color applied to the VS Code window (title bar, activity bar, status bar via `workbench.colorCustomizations`)
- The main/primary worktree is always **green** — visual signal that this is the clean trunk
- New worktrees are auto-assigned a color from a rotating palette
- Users can override the color for any worktree via the sidebar context menu or command palette
- Colors persist across sessions (stored in extension global state)
- Makes it immediately obvious which worktree you're in when switching between windows

## Future Features (Post-MVP)

- **PR Review mode**: Create a worktree from a PR number (via GitHub CLI)
- **Auto-cleanup**: Detect merged branches and prompt for worktree removal
- **Multi-root workspace**: Option to add worktrees to current workspace instead of opening new windows
- **Branch protection**: Prevent accidental work on main/master in the primary worktree

## Technical Decisions

| Decision | Rationale |
|---|---|
| Shell out to `git` CLI | Lightweight, respects user's git config, no native dependency |
| Sibling directory naming `{repo}-{branch}` | Convention from the worktree community, easy to navigate |
| TypeScript + VS Code Extension API | Standard for VS Code extensions |
| No git library dependency | Fewer deps, smaller bundle, consistent behavior with user's git |

## Non-Goals

- Not a full Git GUI (use GitLens, Git Graph, etc. for that)
- Not a branch manager — only manages branches tied to worktree lifecycle
- Not a replacement for the terminal — power users can still use git commands directly

## Extension Settings (Planned)

```jsonc
{
  // Where to create worktrees (default: sibling to repo)
  "arborist.worktreeLocation": "sibling",

  // Auto-open new worktree in a new window
  "arborist.autoOpenNewWindow": true,

  // Commands to run after creating a worktree
  "arborist.postCreateCommands": ["npm install"],

  // Naming pattern for worktree directories
  "arborist.namingPattern": "{repo}-{branch}",

  // Files/folders to copy from the main worktree into new worktrees
  // Supports globs. These are copied (not symlinked) after worktree creation.
  "arborist.filesToCopy": [".env", ".env.local", "node_modules"],

  // Color for the main/primary worktree (default: green)
  "arborist.mainWorktreeColor": "#2ea043",

  // Palette of colors auto-assigned to new worktrees
  "arborist.colorPalette": [
    "#1f6feb",  // blue
    "#a371f7",  // purple
    "#f0883e",  // orange
    "#f85149",  // red
    "#3fb950",  // light green
    "#58a6ff",  // light blue
    "#d2a8ff",  // lavender
    "#e3b341"   // yellow
  ]
}
```
