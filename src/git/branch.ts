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
  const output = await gitExec(["branch", "--merged"], cwd);
  const merged = output
    .trim()
    .split("\n")
    .map((b) => b.trim().replace(/^\*\s*/, ""));
  return merged.includes(branch);
}
