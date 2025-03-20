"use client";

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
 * Get the current Git status
 */
export async function getGitStatus(): Promise<GitStatus> {
  try {
    const response = await fetch("/api/git");
    if (!response.ok) {
      throw new Error(`Failed to get Git status: ${response.statusText}`);
    }
    const data = await response.json();
    if (!data.success) {
      throw new Error(data.error || "Failed to get Git status");
    }
    return data.data;
  } catch (error) {
    console.error("Error getting Git status:", error);
    // Return a default empty status on error
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
}

/**
 * Perform a Git pull
 */
export async function gitPull(): Promise<string> {
  const response = await fetch("/api/git", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ action: "pull" }),
  });

  if (!response.ok) {
    throw new Error(`Failed to pull: ${response.statusText}`);
  }

  const data = await response.json();

  if (!data.success) {
    throw new Error(data.error || "Failed to pull");
  }

  return data.data;
}

/**
 * Stage files for commit
 */
export async function gitAdd(files: string[] | string = "."): Promise<string> {
  const response = await fetch("/api/git", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ action: "add", files }),
  });

  if (!response.ok) {
    throw new Error(`Failed to add files: ${response.statusText}`);
  }

  const data = await response.json();

  if (!data.success) {
    throw new Error(data.error || "Failed to add files");
  }

  return data.data;
}

/**
 * Commit changes with a message
 */
export async function gitCommit(message: string): Promise<string> {
  const response = await fetch("/api/git", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ action: "commit", message }),
  });

  if (!response.ok) {
    throw new Error(`Failed to commit: ${response.statusText}`);
  }

  const data = await response.json();

  if (!data.success) {
    throw new Error(data.error || "Failed to commit");
  }

  return data.data;
}

/**
 * Push changes to remote
 */
export async function gitPush(
  remote: string = "origin",
  branch: string = "",
): Promise<string> {
  const response = await fetch("/api/git", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ action: "push", remote, branch }),
  });

  if (!response.ok) {
    throw new Error(`Failed to push: ${response.statusText}`);
  }

  const data = await response.json();

  if (!data.success) {
    throw new Error(data.error || "Failed to push");
  }

  return data.data;
}

/**
 * Check if there are any conflicts
 */
export async function hasConflicts(): Promise<boolean> {
  const status = await getGitStatus();
  return status.conflicted.length > 0;
}

/**
 * Creates a batch commit for the given task paths
 */
export async function batchCommitTasks(taskRefs: string[]): Promise<string> {
  if (!taskRefs || taskRefs.length === 0) {
    return "No tasks to commit";
  }

  // Create a message with task references
  let message = "";
  if (taskRefs.length === 1) {
    message = `[${taskRefs[0]}] chore: auto-sync task updates`;
  } else {
    const firstThree = taskRefs.slice(0, 3);
    const remaining =
      taskRefs.length > 3 ? ` and ${taskRefs.length - 3} more` : "";
    message = `[${firstThree.join(", ")}${remaining}] chore: auto-sync task updates`;
  }

  // Use the sync API endpoint
  const response = await fetch("/api/git", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ action: "sync", message }),
  });

  if (!response.ok) {
    throw new Error(`Failed to sync: ${response.statusText}`);
  }

  const data = await response.json();

  if (!data.success) {
    throw new Error(data.error || "Failed to sync");
  }

  return data.data;
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
    // Try to extract from filename (if it contains the ref)
    const match = filePath.match(taskRefRegex);
    if (match) {
      refs.add(match[0]);
    }
  }

  return Array.from(refs);
}
