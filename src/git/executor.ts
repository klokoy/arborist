import { execFile } from "child_process";
import { promisify } from "util";

const execFileAsync = promisify(execFile);

export class GitError extends Error {
  constructor(
    message: string,
    public readonly stderr: string,
    public readonly exitCode: number | null,
  ) {
    super(message);
    this.name = "GitError";
  }
}

export async function gitExec(args: string[], cwd: string): Promise<string> {
  try {
    const { stdout } = await execFileAsync("git", args, {
      cwd,
      maxBuffer: 10 * 1024 * 1024,
      timeout: 30000,
    });
    return stdout;
  } catch (err: unknown) {
    const error = err as { stderr?: string; code?: number | null; message?: string };
    throw new GitError(
      error.message ?? `git ${args[0]} failed`,
      error.stderr ?? "",
      error.code ?? null,
    );
  }
}
