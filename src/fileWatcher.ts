import * as fs from "fs";
import * as path from "path";

export class FileWatcher {
  private watcher: fs.FSWatcher | null = null;
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

      this.watcher = fs.watch(worktreesDir, { persistent: false }, () => {
        this.debouncedRefresh();
      });
    } catch {
      // If we can't watch, that's okay — user can manually refresh
    }

    // Also watch the parent directory for sibling worktree creation/removal
    const parentDir = path.dirname(mainWorktreePath);
    try {
      const parentWatcher = fs.watch(parentDir, { persistent: false }, () => {
        this.debouncedRefresh();
      });
      // Store original watcher's close to chain both
      const originalDispose = this.dispose.bind(this);
      this.dispose = () => {
        originalDispose();
        parentWatcher.close();
      };
    } catch {
      // Parent dir watch failure is non-critical
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
    if (this.watcher) {
      this.watcher.close();
      this.watcher = null;
    }
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
      this.debounceTimer = null;
    }
  }
}
