import { gitExec } from "./executor";

export async function isDirty(cwd: string): Promise<boolean> {
  const output = await gitExec(["status", "--porcelain"], cwd);
  return output.trim().length > 0;
}

export async function getStatusSummary(
  cwd: string,
): Promise<{ modified: number; untracked: number; staged: number }> {
  const output = await gitExec(["status", "--porcelain"], cwd);
  const lines = output.trim().split("\n").filter((l) => l.length > 0);

  let modified = 0;
  let untracked = 0;
  let staged = 0;

  for (const line of lines) {
    const x = line[0];
    const y = line[1];
    if (x === "?" && y === "?") {
      untracked++;
    } else {
      if (x !== " " && x !== "?") staged++;
      if (y !== " " && y !== "?") modified++;
    }
  }

  return { modified, untracked, staged };
}
