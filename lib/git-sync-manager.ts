"use client";

import { EventEmitter } from "events";

export enum SyncState {
  IDLE = "idle",
  PULLING = "pulling",
  PUSHING = "pushing",
  COMMITTING = "committing",
  CONFLICT = "conflict",
  ERROR = "error",
  NOT_CONFIGURED = "not-configured",
}

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

export interface GitSyncStatus {
  state: SyncState;
  lastSync: Date | null;
  pendingChanges: number;
  config: GitSyncConfig;
  error?: Error;
  gitStatus?: GitStatus;
}

/**
 * Git Sync Manager responsible for handling automatic Git synchronization
 */
export class GitSyncManager extends EventEmitter {
  private config: GitSyncConfig;
  private status: GitSyncStatus;
  private pendingChanges: Set<string> = new Set();
  private commitTimeout: NodeJS.Timeout | null = null;
  private pullInterval: NodeJS.Timeout | null = null;
  private initialized: boolean = false;
  private watchInterval: NodeJS.Timeout | null = null;

  constructor(config: Partial<GitSyncConfig> = {}) {
    super();
    this.config = {
      ...DEFAULT_GIT_SYNC_CONFIG,
      ...config,
    };
    this.status = {
      state: SyncState.IDLE,
      lastSync: null,
      pendingChanges: 0,
      config: this.config,
    };
  }

  /**
   * Initialize the Git sync manager
   */
  async initialize(): Promise<void> {
    if (this.initialized) return;

    try {
      // Check Git repository status
      const gitStatus = await this.fetchGitStatus();
      this.status.gitStatus = gitStatus;

      if (!gitStatus.isRepo) {
        this.status.state = SyncState.NOT_CONFIGURED;
        this.emit("status", this.status);
        return;
      }

      // Setup file watchers via polling
      this.setupWatchers();

      // Setup auto-pull interval
      this.setupAutoPull();

      this.initialized = true;
      this.status.state = SyncState.IDLE;
      this.emit("status", this.status);
    } catch (error) {
      this.status.state = SyncState.ERROR;
      this.status.error = error as Error;
      this.emit("status", this.status);
      this.emit("error", error);
    }
  }

  /**
   * Stop the Git sync manager
   */
  stop(): void {
    if (this.pullInterval) {
      clearInterval(this.pullInterval);
      this.pullInterval = null;
    }

    if (this.commitTimeout) {
      clearTimeout(this.commitTimeout);
      this.commitTimeout = null;
    }

    if (this.watchInterval) {
      clearInterval(this.watchInterval);
      this.watchInterval = null;
    }

    this.initialized = false;
    this.status.state = SyncState.IDLE;
    this.emit("status", this.status);
  }

  /**
   * Update the sync configuration
   */
  updateConfig(config: Partial<GitSyncConfig>): void {
    this.config = {
      ...this.config,
      ...config,
    };
    this.status.config = this.config;

    // Restart with new config if we're initialized
    if (this.initialized) {
      this.stop();
      this.initialize();
    }

    this.emit("config", this.config);
  }

  /**
   * Get the current sync status
   */
  getStatus(): GitSyncStatus {
    return { ...this.status };
  }

  /**
   * Manually trigger a sync operation
   */
  async syncNow(): Promise<void> {
    if (!this.initialized || this.status.state !== SyncState.IDLE) {
      return;
    }

    try {
      // Sync using the API
      await this.performSync();

      this.status.lastSync = new Date();
      this.status.state = SyncState.IDLE;
      this.emit("status", this.status);
    } catch (error) {
      this.status.state = SyncState.ERROR;
      this.status.error = error as Error;
      this.emit("status", this.status);
      this.emit("error", error);
    }
  }

  /**
   * Setup file watching via polling
   */
  private setupWatchers(): void {
    // Check for changes every minute
    this.watchInterval = setInterval(async () => {
      try {
        const currentStatus = await this.fetchGitStatus();

        // Compare with previous status to detect changes
        if (this.status.gitStatus) {
          const previousStatus = this.status.gitStatus;

          // Check for new changes
          const newChanges = [
            ...currentStatus.modified,
            ...currentStatus.added,
            ...currentStatus.deleted,
          ]
            .filter((file) => {
              return this.config.gitPaths.some((path) =>
                file.startsWith(path + "/"),
              );
            })
            .filter((file) => {
              // Only consider files that weren't already tracked
              return ![
                ...previousStatus.modified,
                ...previousStatus.added,
                ...previousStatus.deleted,
              ].includes(file);
            });

          // Add new changes to pending changes
          for (const file of newChanges) {
            this.pendingChanges.add(file);
          }

          this.status.pendingChanges = this.pendingChanges.size;
          this.status.gitStatus = currentStatus;

          if (newChanges.length > 0) {
            this.emit("status", this.status);

            // Schedule commit if needed
            if (this.pendingChanges.size >= this.config.batchCommitsThreshold) {
              if (this.commitTimeout) {
                clearTimeout(this.commitTimeout);
                this.commitTimeout = null;
              }
              this.scheduleCommit(0); // Immediate commit
            } else if (!this.commitTimeout) {
              this.scheduleCommit(this.config.batchCommitsTimeout);
            }
          }
        } else {
          // First time getting status
          this.status.gitStatus = currentStatus;
        }
      } catch (error) {
        console.error("Error checking Git status:", error);
      }
    }, 60000); // Check every minute
  }

  /**
   * Schedule a commit operation
   */
  private scheduleCommit(timeout: number): void {
    if (this.commitTimeout) {
      clearTimeout(this.commitTimeout);
    }

    this.commitTimeout = setTimeout(async () => {
      if (
        this.pendingChanges.size > 0 &&
        this.status.state === SyncState.IDLE
      ) {
        try {
          await this.performSync();
        } catch (error) {
          this.status.state = SyncState.ERROR;
          this.status.error = error as Error;
          this.emit("status", this.status);
          this.emit("error", error);
        }
      }
      this.commitTimeout = null;
    }, timeout);
  }

  /**
   * Setup auto-pull interval
   */
  private setupAutoPull(): void {
    if (this.pullInterval) {
      clearInterval(this.pullInterval);
    }

    this.pullInterval = setInterval(async () => {
      if (this.status.state === SyncState.IDLE) {
        try {
          await this.performPull();
        } catch (error) {
          console.error("Auto-pull failed:", error);
          this.status.state = SyncState.ERROR;
          this.status.error = error as Error;
          this.emit("status", this.status);
          this.emit("error", error);
        }
      }
    }, this.config.autoPullInterval);
  }

  /**
   * Fetch Git status from API
   */
  private async fetchGitStatus(): Promise<GitStatus> {
    try {
      const response = await fetch("/api/git");

      if (!response.ok) {
        throw new Error(`Failed to fetch Git status: ${response.statusText}`);
      }

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || "Failed to fetch Git status");
      }

      return data.data;
    } catch (error) {
      console.error("Error fetching Git status:", error);
      throw error;
    }
  }

  /**
   * Perform a pull operation via API
   */
  private async performPull(): Promise<void> {
    this.status.state = SyncState.PULLING;
    this.emit("status", this.status);

    try {
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

      // Update status
      this.status.gitStatus = await this.fetchGitStatus();

      // Check for conflicts
      if (this.status.gitStatus.conflicted.length > 0) {
        this.status.state = SyncState.CONFLICT;
        this.emit("status", this.status);
        this.emit("conflict", this.status.gitStatus.conflicted);
        return;
      }

      this.status.state = SyncState.IDLE;
      this.emit("status", this.status);
      this.emit("pulled");
    } catch (error) {
      console.error("Pull failed:", error);
      throw error;
    }
  }

  /**
   * Perform a sync operation via API
   */
  private async performSync(): Promise<void> {
    if (this.pendingChanges.size === 0) return;

    this.status.state = SyncState.COMMITTING;
    this.emit("status", this.status);

    try {
      const changedFiles = Array.from(this.pendingChanges);

      // Extract task refs from filenames (simple implementation)
      const taskRefs = changedFiles
        .map((file) => {
          const match = file.match(/TSK-\d+/);
          return match ? match[0] : null;
        })
        .filter(Boolean);

      const message =
        taskRefs.length > 0
          ? `[${taskRefs.join(", ")}] chore: auto-sync task updates`
          : "chore: auto-sync task updates";

      // Perform sync via API
      const response = await fetch("/api/git", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: "sync",
          message,
          remote: this.config.autoPushEnabled ? "origin" : null,
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to sync: ${response.statusText}`);
      }

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || "Failed to sync");
      }

      // Clear pending changes
      this.pendingChanges.clear();
      this.status.pendingChanges = 0;

      // Update status
      this.status.gitStatus = data.data.status || (await this.fetchGitStatus());
      this.status.state = SyncState.IDLE;
      this.status.lastSync = new Date();

      this.emit("status", this.status);
      this.emit("synced", changedFiles);
    } catch (error) {
      console.error("Sync failed:", error);
      throw error;
    }
  }
}
