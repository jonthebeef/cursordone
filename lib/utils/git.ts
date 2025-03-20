import { exec, spawn } from "child_process";
import { promisify } from "util";
import * as fs from "fs/promises";
import * as path from "path";

const execAsync = promisify(exec);

export interface GitStatus {
  isRepo: boolean;
  hasChanges: boolean;
  branch: string;
  conflicted: string[];
  modified: string[];
  added: string[];
  deleted: string[];
  untracked: string[];
}

export interface GitError extends Error {
  code: number;
  stdout: string;
  stderr: string;
}

export interface GitSyncConfig {
  autoPullInterval: number; // In milliseconds
  autoPushEnabled: boolean;
  batchCommitsThreshold: number; // Number of changes before auto-committing
  batchCommitsTimeout: number; // Time in milliseconds to wait before committing if below threshold
  gitPaths: string[]; // Paths to watch for changes (e.g., ["tasks", "epics"])
}

export const DEFAULT_GIT_SYNC_CONFIG: GitSyncConfig = {
  autoPullInterval: 5 * 60 * 1000, // 5 minutes
  autoPushEnabled: true,
  batchCommitsThreshold: 5,
  batchCommitsTimeout: 60 * 1000, // 1 minute
  gitPaths: ["tasks", "epics", "docs"],
};

/**
 * Check if the current directory is a Git repository
 */
export async function isGitRepo(dir: string = process.cwd()): Promise<boolean> {
  try {
    await execAsync("git rev-parse --is-inside-work-tree", { cwd: dir });
    return true;
  } catch (error) {
    return false;
  }
}

/**
 * Get the current Git status
 */
export async function getGitStatus(
  dir: string = process.cwd(),
): Promise<GitStatus> {
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

/**
 * Perform a Git pull
 */
export async function gitPull(dir: string = process.cwd()): Promise<string> {
  try {
    const { stdout } = await execAsync("git pull", { cwd: dir });
    return stdout.trim();
  } catch (error) {
    const gitError = error as GitError;
    console.error("Git pull error:", gitError);
    throw gitError;
  }
}

/**
 * Stage files for commit
 */
export async function gitAdd(
  files: string[] | string = ".",
  dir: string = process.cwd(),
): Promise<string> {
  try {
    const filesToAdd = Array.isArray(files) ? files.join(" ") : files;
    const { stdout } = await execAsync(`git add ${filesToAdd}`, { cwd: dir });
    return stdout.trim();
  } catch (error) {
    const gitError = error as GitError;
    console.error("Git add error:", gitError);
    throw gitError;
  }
}

/**
 * Commit changes with a message
 */
export async function gitCommit(
  message: string,
  dir: string = process.cwd(),
): Promise<string> {
  try {
    const { stdout } = await execAsync(`git commit -m "${message}"`, {
      cwd: dir,
    });
    return stdout.trim();
  } catch (error) {
    const gitError = error as GitError;

    // If there's nothing to commit, it's not an error for our purposes
    if (gitError.stderr && gitError.stderr.includes("nothing to commit")) {
      return "Nothing to commit";
    }

    console.error("Git commit error:", gitError);
    throw gitError;
  }
}

/**
 * Push changes to remote
 */
export async function gitPush(
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
    const gitError = error as GitError;
    console.error("Git push error:", gitError);
    throw gitError;
  }
}

/**
 * Check if there are any conflicts
 */
export async function hasConflicts(
  dir: string = process.cwd(),
): Promise<boolean> {
  const status = await getGitStatus(dir);
  return status.conflicted.length > 0;
}

/**
 * Creates a batch commit for the given task paths
 */
export async function batchCommitTasks(
  taskRefs: string[],
  dir: string = process.cwd(),
): Promise<string> {
  if (!taskRefs || taskRefs.length === 0) {
    return "No tasks to commit";
  }

  try {
    // First, get current status to see what needs to be added
    const status = await getGitStatus(dir);

    // Get all changed files related to tasks and epics
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

    if (relevantFiles.length === 0) {
      return "No task-related changes to commit";
    }

    // Stage these files
    await gitAdd(relevantFiles, dir);

    // Create a commit message
    let commitMessage = "";

    if (taskRefs.length === 1) {
      commitMessage = `[${taskRefs[0]}] chore: auto-sync task updates`;
    } else {
      const firstThree = taskRefs.slice(0, 3);
      const remaining =
        taskRefs.length > 3 ? ` and ${taskRefs.length - 3} more` : "";
      commitMessage = `[${firstThree.join(", ")}${remaining}] chore: auto-sync task updates`;
    }

    // Commit the changes
    return gitCommit(commitMessage, dir);
  } catch (error) {
    console.error("Error batch committing tasks:", error);
    throw error;
  }
}

/**
 * Watch for file changes in the specified paths and commit them
 */
export function watchForChanges(
  config: GitSyncConfig,
  onChangesDetected: (files: string[]) => void,
): () => void {
  let watchTimeout: NodeJS.Timeout | null = null;
  let changedFiles: Set<string> = new Set();

  // Set up auto-pull interval
  const pullInterval = setInterval(async () => {
    try {
      await gitPull();
      console.log("Auto-pull completed successfully");
    } catch (error) {
      console.error("Auto-pull failed:", error);
    }
  }, config.autoPullInterval);

  // Function to handle file changes
  const handleFileChange = (filePath: string) => {
    if (config.gitPaths.some((path) => filePath.startsWith(path))) {
      changedFiles.add(filePath);

      if (watchTimeout) {
        clearTimeout(watchTimeout);
      }

      // If we've reached the threshold, commit immediately
      if (changedFiles.size >= config.batchCommitsThreshold) {
        const files = Array.from(changedFiles);
        changedFiles.clear();
        onChangesDetected(files);
      } else {
        // Otherwise, set a timeout to commit after the specified time
        watchTimeout = setTimeout(() => {
          const files = Array.from(changedFiles);
          changedFiles.clear();
          if (files.length > 0) {
            onChangesDetected(files);
          }
        }, config.batchCommitsTimeout);
      }
    }
  };

  // In a real implementation, you'd set up file watchers here
  // For now, this is just a stub

  // Return a cleanup function
  return () => {
    clearInterval(pullInterval);
    if (watchTimeout) {
      clearTimeout(watchTimeout);
    }
  };
}

/**
 * Extracts task refs from file paths
 */
export function extractTaskRefs(filePaths: string[]): string[] {
  const taskRefRegex = /TSK-\d+/;
  const refs = new Set<string>();

  for (const filePath of filePaths) {
    // Try to extract from filename first (if it contains the ref)
    const fileName = path.basename(filePath);
    const fileMatch = fileName.match(taskRefRegex);
    if (fileMatch) {
      refs.add(fileMatch[0]);
      continue;
    }

    // If we couldn't extract from filename, we'd need to read the file
    // and parse front matter, but that would need to be implemented
    // as an async function
  }

  return Array.from(refs);
}
