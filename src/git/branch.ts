import { gitExec } from "./executor";

export async function listBranches(cwd: string): Promise<string[]> {
  const output = await gitExec(
    ["branch", "--list", "--format=%(refname:short)"],
    cwd,
  );
  return output
    .trim()
    .split("\n")
    .filter((b) => b.length > 0);
}

export async function listRemoteBranches(cwd: string): Promise<string[]> {
  const output = await gitExec(
    ["branch", "-r", "--format=%(refname:short)"],
    cwd,
  );
  return output
    .trim()
    .split("\n")
    .filter((b) => b.length > 0 && !b.includes("HEAD"));
}

export async function deleteBranch(
  cwd: string,
  branch: string,
  force = false,
): Promise<void> {
  await gitExec(["branch", force ? "-D" : "-d", branch], cwd);
}

export async function isBranchMerged(
  cwd: string,
  branch: string,
): Promise<boolean> {
  // Check if branch is merged into HEAD of the main worktree
  // Use rev-list to see if there are commits on branch not yet in HEAD
  try {
    const output = await gitExec(
      ["rev-list", "--count", `HEAD..${branch}`],
      cwd,
    );
    return parseInt(output.trim(), 10) === 0;
  } catch {
    // If the check fails, assume not merged to be safe
    return false;
  }
}
