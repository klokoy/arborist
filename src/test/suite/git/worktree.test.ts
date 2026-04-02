import * as assert from "assert";
import { parsePorcelain, branchShortName } from "../../../git/worktree";

suite("Worktree Parser", () => {
  test("parses multi-worktree porcelain output", () => {
    const output = [
      "worktree /Users/dev/projects/my-app",
      "HEAD abc123def456789012345678901234567890abcd",
      "branch refs/heads/main",
      "",
      "worktree /Users/dev/projects/my-app-feature-login",
      "HEAD def456abc789012345678901234567890abcd1234",
      "branch refs/heads/feature-login",
      "",
    ].join("\n");

    const result = parsePorcelain(output);
    assert.strictEqual(result.length, 2);

    assert.strictEqual(result[0].path, "/Users/dev/projects/my-app");
    assert.strictEqual(result[0].head, "abc123def456789012345678901234567890abcd");
    assert.strictEqual(result[0].branch, "refs/heads/main");

    assert.strictEqual(result[1].path, "/Users/dev/projects/my-app-feature-login");
    assert.strictEqual(result[1].branch, "refs/heads/feature-login");
  });

  test("parses detached HEAD worktree", () => {
    const output = [
      "worktree /Users/dev/projects/my-app",
      "HEAD abc123def456789012345678901234567890abcd",
      "branch refs/heads/main",
      "",
      "worktree /Users/dev/projects/my-app-detached",
      "HEAD def456abc789012345678901234567890abcd1234",
      "detached",
      "",
    ].join("\n");

    const result = parsePorcelain(output);
    assert.strictEqual(result.length, 2);
    assert.strictEqual(result[1].branch, null);
  });

  test("parses single worktree", () => {
    const output = [
      "worktree /Users/dev/projects/my-app",
      "HEAD abc123def456789012345678901234567890abcd",
      "branch refs/heads/main",
      "",
    ].join("\n");

    const result = parsePorcelain(output);
    assert.strictEqual(result.length, 1);
  });

  test("handles empty output", () => {
    const result = parsePorcelain("");
    assert.strictEqual(result.length, 0);
  });

  test("handles nested branch names", () => {
    const output = [
      "worktree /Users/dev/projects/my-app-fix-header",
      "HEAD 789012345678901234567890abcd1234def456ab",
      "branch refs/heads/fix/header-bug",
      "",
    ].join("\n");

    const result = parsePorcelain(output);
    assert.strictEqual(result[0].branch, "refs/heads/fix/header-bug");
  });
});

suite("branchShortName", () => {
  test("strips refs/heads/ prefix", () => {
    assert.strictEqual(branchShortName("refs/heads/main"), "main");
    assert.strictEqual(branchShortName("refs/heads/feature-login"), "feature-login");
    assert.strictEqual(branchShortName("refs/heads/fix/header-bug"), "fix/header-bug");
  });

  test("returns (detached) for null", () => {
    assert.strictEqual(branchShortName(null), "(detached)");
  });
});
