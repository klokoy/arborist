# Arborist

Git worktree management for VS Code. Create, switch between, and clean up worktrees without leaving your editor.

Each worktree maps to one branch. Worktrees live as sibling directories next to your main repo. When you're done, clean up the worktree and branch together.

```
~/projects/my-app/                  <- main (green window)
~/projects/my-app-feature-login/    <- feature branch (blue window)
~/projects/my-app-fix-header/       <- bugfix branch (purple window)
```

## Features

### Worktree Explorer

Sidebar panel listing all worktrees with branch name, dirty/clean status, and colored icons matching each worktree's assigned window color. Click to open in a new window.

### Color-Coded Windows

Each worktree gets a distinct color applied to the VS Code title bar, activity bar, and status bar. The main worktree is green by default. New worktrees are auto-assigned colors from a configurable palette. You can also set a custom color per worktree.

### Create Worktree

**Command Palette:** `Arborist: New Worktree`

- Create from a new or existing branch
- Worktree directory is created as a sibling: `../{repo}-{branch}`
- Optionally copies files like `.env` or `node_modules` from the main worktree
- Runs configurable post-create commands (e.g. `npm install`)
- Auto-opens the new worktree in a new VS Code window

### Remove Worktree

Inline trash button in the sidebar, or via command palette. Runs `git worktree remove` and `git branch -d`. Warns if the branch has unmerged changes.

### Quick Switch

**Command Palette:** `Arborist: Switch Worktree`

Quick pick list of all worktrees with dirty indicators. Opens the selected worktree in a new window.

### Status Bar

Shows the current branch name and total worktree count. Click to open the quick switch picker.

## Settings

| Setting | Default | Description |
|---|---|---|
| `arborist.autoOpenNewWindow` | `true` | Open new worktrees in a new VS Code window |
| `arborist.namingPattern` | `{repo}-{branch}` | Directory naming pattern for new worktrees |
| `arborist.filesToCopy` | `[]` | Files/folders to copy into new worktrees (e.g. `.env`, `node_modules`) |
| `arborist.postCreateCommands` | `[]` | Commands to run after creating a worktree |
| `arborist.mainWorktreeColor` | `#2ea043` | Window color for the main worktree |
| `arborist.colorPalette` | 8 colors | Colors auto-assigned to new worktrees |

## Requirements

- Git 2.15+ (for worktree support)
- A git repository open in VS Code

## License

MIT
