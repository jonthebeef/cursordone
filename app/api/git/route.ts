import { exec } from "child_process";
import { promisify } from "util";
import { NextResponse } from "next/server";
import * as fs from "fs/promises";
import * as path from "path";

const execAsync = promisify(exec);

interface GitStatus {
  isRepo: boolean;
  hasChanges: boolean;
  branch: string;
  conflicted: string[];
  modified: string[];
  added: string[];
  deleted: string[];
  untracked: string[];
}

// Helper functions for Git operations
async function isGitRepo(dir: string = process.cwd()): Promise<boolean> {
  try {
    await execAsync("git rev-parse --is-inside-work-tree", { cwd: dir });
    return true;
  } catch (error) {
    return false;
  }
}

async function getGitStatus(dir: string = process.cwd()): Promise<GitStatus> {
  try {
    const isRepo = await isGitRepo(dir);
    if (!isRepo) {
      return {
        isRepo: false,
        hasChanges: false,
        branch: "",
        conflicted: [],
        modified: [],
        added: [],
        deleted: [],
        untracked: [],
      };
    }

    // Get current branch
    const { stdout: branchOutput } = await execAsync(
      "git rev-parse --abbrev-ref HEAD",
      { cwd: dir },
    );
    const branch = branchOutput.trim();

    // Get status
    const { stdout: statusOutput } = await execAsync("git status --porcelain", {
      cwd: dir,
    });
    const lines = statusOutput.trim().split("\n").filter(Boolean);

    const status: GitStatus = {
      isRepo: true,
      hasChanges: lines.length > 0,
      branch,
      conflicted: [],
      modified: [],
      added: [],
      deleted: [],
      untracked: [],
    };

    // Parse status
    for (const line of lines) {
      const state = line.substring(0, 2);
      const file = line.substring(3);

      // Check status
      if (state.includes("U") || state === "DD" || state === "AA") {
        status.conflicted.push(file);
      } else if (state.includes("M")) {
        status.modified.push(file);
      } else if (state.includes("A")) {
        status.added.push(file);
      } else if (state.includes("D")) {
        status.deleted.push(file);
      } else if (state === "??") {
        status.untracked.push(file);
      }
    }

    return status;
  } catch (error) {
    console.error("Error getting Git status:", error);
    throw error;
  }
}

async function gitPull(dir: string = process.cwd()): Promise<string> {
  try {
    const { stdout } = await execAsync("git pull", { cwd: dir });
    return stdout.trim();
  } catch (error) {
    console.error("Git pull error:", error);
    throw error;
  }
}

async function gitAdd(
  files: string[] | string = ".",
  dir: string = process.cwd(),
): Promise<string> {
  try {
    const filesToAdd = Array.isArray(files) ? files.join(" ") : files;
    const { stdout } = await execAsync(`git add ${filesToAdd}`, { cwd: dir });
    return stdout.trim();
  } catch (error) {
    console.error("Git add error:", error);
    throw error;
  }
}

async function gitCommit(
  message: string,
  dir: string = process.cwd(),
): Promise<string> {
  try {
    const { stdout } = await execAsync(`git commit -m "${message}"`, {
      cwd: dir,
    });
    return stdout.trim();
  } catch (error: any) {
    if (error.stderr && error.stderr.includes("nothing to commit")) {
      return "Nothing to commit";
    }
    console.error("Git commit error:", error);
    throw error;
  }
}

async function gitPush(
  remote: string = "origin",
  branch: string = "",
  dir: string = process.cwd(),
): Promise<string> {
  try {
    const branchArg = branch ? ` ${branch}` : "";
    const { stdout } = await execAsync(`git push ${remote}${branchArg}`, {
      cwd: dir,
    });
    return stdout.trim();
  } catch (error) {
    console.error("Git push error:", error);
    throw error;
  }
}

async function hasConflicts(dir: string = process.cwd()): Promise<boolean> {
  const status = await getGitStatus(dir);
  return status.conflicted.length > 0;
}

// API endpoint for getting Git status
export async function GET() {
  try {
    const gitStatus = await getGitStatus();
    return NextResponse.json({ success: true, data: gitStatus });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 },
    );
  }
}

// API endpoint for Git operations
export async function POST(request: Request) {
  try {
    const { action, files, message, remote, branch } = await request.json();
    const workDir = process.cwd();

    let result;

    switch (action) {
      case "pull":
        result = await gitPull(workDir);
        break;
      case "add":
        result = await gitAdd(files, workDir);
        break;
      case "commit":
        result = await gitCommit(message, workDir);
        break;
      case "push":
        result = await gitPush(remote, branch, workDir);
        break;
      case "sync":
        // Pull first
        await gitPull(workDir);

        // Check if there are changes to commit
        const status = await getGitStatus(workDir);
        const relevantFiles = [
          ...status.modified,
          ...status.added,
          ...status.deleted,
        ].filter((file) => {
          return (
            file.startsWith("tasks/") ||
            file.startsWith("epics/") ||
            file.startsWith("docs/")
          );
        });

        if (relevantFiles.length > 0) {
          // Add and commit
          await gitAdd(relevantFiles, workDir);
          await gitCommit(message || "Auto-sync: Task updates", workDir);

          // Push if requested
          if (remote) {
            await gitPush(remote, branch, workDir);
          }
        }

        result = { success: true, status: await getGitStatus(workDir) };
        break;
      default:
        throw new Error(`Unknown action: ${action}`);
    }

    return NextResponse.json({ success: true, data: result });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 },
    );
  }
}
