import { EventEmitter } from "events";
import { RetryManager, RetryConfig } from "./retry";

export interface BranchStatus {
  name: string;
  isActive: boolean;
  lastSync: Date | null;
  ahead: number;
  behind: number;
  hasConflicts: boolean;
  syncEnabled: boolean;
}

export interface BranchSyncConfig {
  autoPullEnabled: boolean;
  autoPushEnabled: boolean;
  protected: boolean;
  requirePullRequest: boolean;
  syncInterval: number; // in milliseconds
}

export interface BranchError extends Error {
  code: string;
  branch: string;
  operation: string;
  recoverable: boolean;
}

export class BranchManager extends EventEmitter {
  private branches: Map<string, BranchStatus> = new Map();
  private configs: Map<string, BranchSyncConfig> = new Map();
  private activeBranch: string | null = null;
  private retryManager: RetryManager;

  constructor(retryConfig?: Partial<RetryConfig>) {
    super();
    this.retryManager = new RetryManager(retryConfig);

    // Listen for retry events
    this.retryManager.on("retrying", (status) => {
      this.emit("operationRetrying", status);
    });
  }

  /**
   * Initialize branch manager and load current branch status
   */
  async initialize(): Promise<void> {
    try {
      await this.retryManager.enqueue(
        async () => {
          // Get current branch from Git
          const response = await fetch("/api/git", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ action: "getCurrentBranch" }),
          });

          if (!response.ok) {
            throw new Error("Failed to get current branch");
          }

          const { data } = await response.json();
          this.activeBranch = data.branch;

          // Load branch statuses
          await this.refreshBranchStatuses();
        },
        "initialize",
        10, // High priority for initialization
      );
    } catch (error) {
      this.emit(
        "error",
        this.createError("INIT_FAILED", "initialization", error),
      );
      throw error;
    }
  }

  /**
   * Switch to a different branch
   */
  async switchBranch(branchName: string): Promise<void> {
    try {
      await this.retryManager.enqueue(
        async () => {
          // Verify branch exists
          if (!this.branches.has(branchName)) {
            throw new Error(`Branch ${branchName} does not exist`);
          }

          // Check if branch is protected
          const config = this.configs.get(branchName);
          if (config?.protected) {
            throw new Error(`Branch ${branchName} is protected`);
          }

          // Attempt to switch branch
          const response = await fetch("/api/git", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              action: "switchBranch",
              branch: branchName,
            }),
          });

          if (!response.ok) {
            throw new Error(`Failed to switch to branch ${branchName}`);
          }

          this.activeBranch = branchName;
          await this.refreshBranchStatuses();
          this.emit("branchChanged", branchName);
        },
        `switchBranch-${branchName}`,
        5, // Medium priority for branch switching
      );
    } catch (error) {
      this.emit("error", this.createError("SWITCH_FAILED", branchName, error));
      throw error;
    }
  }

  /**
   * Get status of all branches
   */
  getBranchStatuses(): Map<string, BranchStatus> {
    return new Map(this.branches);
  }

  /**
   * Get active branch name
   */
  getActiveBranch(): string | null {
    return this.activeBranch;
  }

  /**
   * Update branch sync configuration
   */
  async updateBranchConfig(
    branch: string,
    config: Partial<BranchSyncConfig>,
  ): Promise<void> {
    const currentConfig = this.configs.get(branch) || {
      autoPullEnabled: true,
      autoPushEnabled: true,
      protected: false,
      requirePullRequest: false,
      syncInterval: 5 * 60 * 1000, // 5 minutes
    };

    this.configs.set(branch, { ...currentConfig, ...config });
    this.emit("configUpdated", branch, this.configs.get(branch));
  }

  /**
   * Refresh status of all branches
   */
  private async refreshBranchStatuses(): Promise<void> {
    try {
      await this.retryManager.enqueue(
        async () => {
          const response = await fetch("/api/git", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ action: "getBranchStatuses" }),
          });

          if (!response.ok) {
            throw new Error("Failed to refresh branch statuses");
          }

          interface BranchStatusResponse {
            lastSync: string | null;
            ahead: number;
            behind: number;
            hasConflicts: boolean;
          }

          const { data } = await response.json();

          // Update branch statuses
          this.branches.clear();
          for (const [name, status] of Object.entries<BranchStatusResponse>(
            data.branches,
          )) {
            this.branches.set(name, {
              name,
              isActive: name === this.activeBranch,
              lastSync: status.lastSync ? new Date(status.lastSync) : null,
              ahead: status.ahead || 0,
              behind: status.behind || 0,
              hasConflicts: status.hasConflicts || false,
              syncEnabled: true,
            });
          }

          this.emit("statusesUpdated", this.branches);
        },
        "refreshBranchStatuses",
        1, // Lower priority for status updates
      );
    } catch (error) {
      this.emit(
        "error",
        this.createError("REFRESH_FAILED", "status refresh", error),
      );
    }
  }

  /**
   * Create a standardized branch error
   */
  private createError(
    code: string,
    operation: string,
    error: any,
  ): BranchError {
    return {
      name: "BranchError",
      message: error.message || `Branch operation failed: ${operation}`,
      code,
      branch: this.activeBranch || "unknown",
      operation,
      recoverable: code !== "INIT_FAILED",
      cause: error,
    } as BranchError;
  }

  /**
   * Get the retry manager status
   */
  getRetryStatus() {
    return this.retryManager.getStatus();
  }
}
