import { exec as execCallback } from "child_process";
import { promisify } from "util";
import { NextResponse } from "next/server";
import * as fs from "fs/promises";
import * as path from "path";

const exec = promisify(execCallback);

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
    await exec("git rev-parse --is-inside-work-tree", { cwd: dir });
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
    const { stdout: branchOutput } = await exec(
      "git rev-parse --abbrev-ref HEAD",
      { cwd: dir },
    );
    const branch = branchOutput.trim();

    // Get status
    const { stdout: statusOutput } = await exec("git status --porcelain", {
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
    const { stdout } = await exec("git pull", { cwd: dir });
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
    const { stdout } = await exec(`git add ${filesToAdd}`, { cwd: dir });
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
    const { stdout } = await exec(`git commit -m "${message}"`, {
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
    const { stdout } = await exec(`git push ${remote}${branchArg}`, {
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
  console.log("Git API: GET request received at", new Date().toISOString());
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
  console.log("Git API: POST request received at", new Date().toISOString());
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

      case "getCurrentBranch":
        result = await getCurrentBranch(workDir);
        break;

      case "getBranchStatuses":
        result = await getBranchStatuses(workDir);
        break;

      case "switchBranch":
        if (!branch) {
          throw new Error("Branch name is required for switchBranch action");
        }
        result = await switchBranch(branch, workDir);
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

async function getCurrentBranch(workDir: string): Promise<{ branch: string }> {
  const { stdout } = await exec("git rev-parse --abbrev-ref HEAD", {
    cwd: workDir,
  });
  return { branch: stdout.trim() };
}

async function getBranchStatuses(
  workDir: string,
): Promise<{ branches: Record<string, any> }> {
  // Get list of branches
  const { stdout: branchOutput } = await exec("git branch -v --no-abbrev", {
    cwd: workDir,
  });
  const branches: Record<string, any> = {};

  // Parse branch output
  const branchLines = branchOutput.split("\n").filter(Boolean);
  for (const line of branchLines) {
    const match = line.match(/^[*\s]\s+(\S+)\s+([a-f0-9]+)\s+(.*)$/);
    if (match) {
      const [, name, commit, message] = match;
      const isActive = line.startsWith("*");

      // Get ahead/behind counts
      const { stdout: countOutput } = await exec(
        `git rev-list --left-right --count origin/${name}...${name}`,
        { cwd: workDir },
      ).catch(() => ({ stdout: "0\t0" }));

      const [behind, ahead] = countOutput.trim().split("\t").map(Number);

      // Check for conflicts
      const { stdout: conflictOutput } = await exec(`git ls-files --unmerged`, {
        cwd: workDir,
      });

      const hasConflicts = conflictOutput.trim().length > 0;

      // Get last sync time (last fetch from remote)
      const { stdout: lastSyncOutput } = await exec(
        `git log -1 --format=%cd ${name}`,
        { cwd: workDir },
      ).catch(() => ({ stdout: "" }));

      branches[name] = {
        commit,
        message: message.trim(),
        isActive,
        ahead,
        behind,
        hasConflicts,
        lastSync: lastSyncOutput.trim()
          ? new Date(lastSyncOutput).toISOString()
          : null,
      };
    }
  }

  return { branches };
}

async function switchBranch(branch: string, workDir: string): Promise<void> {
  // Check if branch exists
  const { stdout: branchExists } = await exec(
    `git show-ref --verify --quiet refs/heads/${branch} || echo "no"`,
    { cwd: workDir },
  );

  if (branchExists.trim() === "no") {
    throw new Error(`Branch ${branch} does not exist`);
  }

  // Check for uncommitted changes
  const status = await getGitStatus(workDir);
  if (
    status.modified.length > 0 ||
    status.added.length > 0 ||
    status.deleted.length > 0
  ) {
    throw new Error("Cannot switch branches with uncommitted changes");
  }

  // Switch branch
  await exec(`git checkout ${branch}`, { cwd: workDir });
}
