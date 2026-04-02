# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Arborist** is a VS Code extension that streamlines Git worktree-based workflows. It manages the lifecycle of worktrees — creating, switching between, and cleaning up worktrees tied to branches — so developers never need to stash or switch branches mid-work.

The core workflow: each worktree maps to one branch, worktrees live as sibling directories next to the main repo, and cleanup happens after merge.

## Build & Development Commands

```bash
# Install dependencies
npm install

# Compile the extension
npm run compile

# Watch mode (auto-recompile on change)
npm run watch

# Run linting
npm run lint

# Run all tests
npm test

# Run a single test file
npx mocha out/test/suite/someTest.test.js

# Package the extension as .vsix
npx vsce package
```

To debug: press F5 in VS Code to launch the Extension Development Host.

## Architecture

This is a standard VS Code extension using the [VS Code Extension API](https://code.visualstudio.com/api).

- **Entry point**: `src/extension.ts` — registers commands, tree views, and event handlers
- **Worktree operations**: `src/worktree/` — wraps `git worktree` CLI commands (add, remove, list, prune)
- **Branch management**: `src/branch/` — handles branch creation/deletion tied to worktree lifecycle
- **Tree view provider**: `src/views/` — sidebar panel showing active worktrees and their status
- **Commands**: `src/commands/` — VS Code command implementations (create worktree, remove worktree, open worktree in new window, etc.)

Key design decisions:
- All git operations shell out to the `git` CLI rather than using a git library — keeps the extension lightweight and consistent with the user's git config
- Worktree directories are created as siblings to the main repo, named `{repo}-{branch}` by convention
- The extension watches the filesystem for worktree changes to keep the sidebar in sync
