import { EventEmitter } from "events";
import * as path from "path";
import * as fs from "fs/promises";
import * as chokidar from "chokidar";
import {
  GitStatus,
  GitSyncConfig,
  DEFAULT_GIT_SYNC_CONFIG,
  getGitStatus,
  gitPull,
  gitAdd,
  gitCommit,
  gitPush,
  hasConflicts,
  batchCommitTasks,
  extractTaskRefs,
} from "./utils/git";

export enum SyncState {
  IDLE = "idle",
  PULLING = "pulling",
  PUSHING = "pushing",
  COMMITTING = "committing",
  CONFLICT = "conflict",
  ERROR = "error",
  NOT_CONFIGURED = "not-configured",
}

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
  private watcher: chokidar.FSWatcher | null = null;
  private pendingChanges: Set<string> = new Set();
  private commitTimeout: NodeJS.Timeout | null = null;
  private pullInterval: NodeJS.Timeout | null = null;
  private workDir: string;
  private initialized: boolean = false;

  constructor(
    workDir: string = process.cwd(),
    config: Partial<GitSyncConfig> = {},
  ) {
    super();
    this.workDir = workDir;
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
      // Check if current directory is a Git repository
      const gitStatus = await getGitStatus(this.workDir);
      this.status.gitStatus = gitStatus;

      if (!gitStatus.isRepo) {
        this.status.state = SyncState.NOT_CONFIGURED;
        this.emit("status", this.status);
        return;
      }

      // Setup file watchers
      await this.setupWatchers();

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
    if (this.watcher) {
      this.watcher.close();
      this.watcher = null;
    }

    if (this.pullInterval) {
      clearInterval(this.pullInterval);
      this.pullInterval = null;
    }

    if (this.commitTimeout) {
      clearTimeout(this.commitTimeout);
      this.commitTimeout = null;
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
      // First pull
      await this.performPull();

      // Then commit and push any pending changes
      if (this.pendingChanges.size > 0) {
        await this.performCommit();
      }

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
   * Setup file watchers for tasks, epics, and docs directories
   */
  private async setupWatchers(): Promise<void> {
    const watchPaths = this.config.gitPaths.map((p) =>
      path.join(this.workDir, p),
    );

    // Ensure the directories exist before watching
    for (const dirPath of watchPaths) {
      try {
        await fs.mkdir(dirPath, { recursive: true });
      } catch (error) {
        console.warn(`Could not create directory ${dirPath}:`, error);
      }
    }

    this.watcher = chokidar.watch(watchPaths, {
      persistent: true,
      ignoreInitial: true,
      awaitWriteFinish: {
        stabilityThreshold: 2000,
        pollInterval: 100,
      },
    });

    this.watcher
      .on("add", (path) => this.handleFileChange(path))
      .on("change", (path) => this.handleFileChange(path))
      .on("unlink", (path) => this.handleFileChange(path));
  }

  /**
   * Handle file changes
   */
  private handleFileChange(filePath: string): void {
    // Only track markdown files
    if (!filePath.endsWith(".md")) return;

    const relativePath = path.relative(this.workDir, filePath);
    this.pendingChanges.add(relativePath);
    this.status.pendingChanges = this.pendingChanges.size;
    this.emit("status", this.status);

    // Schedule commit based on threshold
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
          await this.performCommit();

          // Push if enabled
          if (this.config.autoPushEnabled) {
            await this.performPush();
          }
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
   * Perform a pull operation
   */
  private async performPull(): Promise<void> {
    this.status.state = SyncState.PULLING;
    this.emit("status", this.status);

    try {
      await gitPull(this.workDir);

      // Update status
      this.status.gitStatus = await getGitStatus(this.workDir);

      // Check for conflicts
      if (await hasConflicts(this.workDir)) {
        this.status.state = SyncState.CONFLICT;
        this.emit("status", this.status);
        this.emit("conflict", this.status.gitStatus?.conflicted || []);
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
   * Perform a commit operation
   */
  private async performCommit(): Promise<void> {
    if (this.pendingChanges.size === 0) return;

    this.status.state = SyncState.COMMITTING;
    this.emit("status", this.status);

    try {
      const changedFiles = Array.from(this.pendingChanges);
      const taskRefs = extractTaskRefs(changedFiles);

      await batchCommitTasks(
        taskRefs.length > 0 ? taskRefs : ["TSK-000"],
        this.workDir,
      );

      // Clear pending changes
      this.pendingChanges.clear();
      this.status.pendingChanges = 0;

      // Update status
      this.status.gitStatus = await getGitStatus(this.workDir);
      this.status.state = SyncState.IDLE;
      this.status.lastSync = new Date();

      this.emit("status", this.status);
      this.emit("committed", changedFiles);
    } catch (error) {
      console.error("Commit failed:", error);
      throw error;
    }
  }

  /**
   * Perform a push operation
   */
  private async performPush(): Promise<void> {
    this.status.state = SyncState.PUSHING;
    this.emit("status", this.status);

    try {
      // Get the current branch name
      const gitStatus = await getGitStatus(this.workDir);

      await gitPush("origin", gitStatus.branch, this.workDir);

      // Update status
      this.status.gitStatus = await getGitStatus(this.workDir);
      this.status.state = SyncState.IDLE;
      this.status.lastSync = new Date();

      this.emit("status", this.status);
      this.emit("pushed");
    } catch (error) {
      console.error("Push failed:", error);
      throw error;
    }
  }
}
