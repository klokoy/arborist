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

export async function getMainBranchName(
  mainWorktreePath: string,
): Promise<string> {
  const output = await gitExec(
    ["rev-parse", "--abbrev-ref", "HEAD"],
    mainWorktreePath,
  );
  return output.trim();
}

export async function fetchOrigin(
  cwd: string,
  branch: string,
): Promise<void> {
  await gitExec(["fetch", "origin", branch], cwd);
}

export async function rebase(
  cwd: string,
  onto: string,
): Promise<void> {
  await gitExec(["rebase", onto], cwd);
}

export async function isBranchMerged(
  cwd: string,
  branch: string,
): Promise<boolean> {
  try {
    // Fast path: commit ancestry (normal merges, fast-forwards)
    const revListOutput = await gitExec(
      ["rev-list", "--count", `HEAD..${branch}`],
      cwd,
    );
    if (parseInt(revListOutput.trim(), 10) === 0) {
      return true;
    }

    // Slow path: patch equivalence (squash merges, rebases)
    // Lines with "-" = equivalent patch exists in HEAD
    // Lines with "+" = genuinely unmerged
    const cherryOutput = await gitExec(["cherry", "HEAD", branch], cwd);
    const lines = cherryOutput.trim().split("\n").filter((l) => l.length > 0);
    return lines.every((line) => line.startsWith("-"));
  } catch {
    // If the check fails, assume not merged to be safe
    return false;
  }
}
