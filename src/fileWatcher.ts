import * as fs from "fs";
import * as path from "path";

export class FileWatcher {
  private watchers: fs.FSWatcher[] = [];
  private debounceTimer: ReturnType<typeof setTimeout> | null = null;

  constructor(
    mainWorktreePath: string,
    private onChanged: () => void,
  ) {
    // Watch .git/worktrees/ — the most reliable signal for worktree changes
    const worktreesDir = path.join(mainWorktreePath, ".git", "worktrees");

    try {
      // Ensure the directory exists (it may not if there are no extra worktrees yet)
      fs.mkdirSync(worktreesDir, { recursive: true });

      this.addWatcher(worktreesDir, { persistent: false });
    } catch {
      // If we can't watch, that's okay — user can manually refresh
    }

    // Also watch the parent directory for sibling worktree creation/removal
    const parentDir = path.dirname(mainWorktreePath);
    this.addWatcher(parentDir, { persistent: false });
  }

  private addWatcher(
    dir: string,
    options: fs.WatchOptions,
  ): void {
    try {
      const watcher = fs.watch(dir, options, () => {
        this.debouncedRefresh();
      });
      this.watchers.push(watcher);
    } catch {
      // Non-critical — user can manually refresh
    }
  }

  private debouncedRefresh(): void {
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
    }
    this.debounceTimer = setTimeout(() => {
      this.onChanged();
      this.debounceTimer = null;
    }, 500);
  }

  dispose(): void {
    for (const watcher of this.watchers) {
      watcher.close();
    }
    this.watchers = [];
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
      this.debounceTimer = null;
    }
  }
}
