import { EventEmitter } from "events";

/**
 * Network condition configuration for simulating different network scenarios
 */
export interface NetworkCondition {
  /** Delay in milliseconds before operation completes */
  delay: number;
  /** Probability of operation failing (0-1) */
  failureRate: number;
  shouldFail(): boolean;
}

/**
 * Predefined network conditions for testing different scenarios
 */
export const NetworkConditions: Record<string, NetworkCondition> = {
  FAST: {
    delay: 50,
    failureRate: 0,
    shouldFail() {
      return false;
    },
  },
  SLOW: {
    delay: 500,
    failureRate: 0,
    shouldFail() {
      return false;
    },
  },
  FLAKY: {
    delay: 100,
    failureRate: 0.3,
    shouldFail() {
      return Math.random() < this.failureRate;
    },
  },
  VERY_FLAKY: {
    delay: 200,
    failureRate: 0.7,
    shouldFail() {
      return Math.random() < this.failureRate;
    },
  },
  OFFLINE: {
    delay: 0,
    failureRate: 1,
    shouldFail() {
      return true;
    },
  },
} as const;

/**
 * Common Git error types that can occur during operations
 */
export enum GitErrorType {
  MERGE_CONFLICT = "MERGE_CONFLICT",
  NETWORK_TIMEOUT = "NETWORK_TIMEOUT",
  AUTH_FAILED = "AUTH_FAILED",
  REMOTE_NOT_FOUND = "REMOTE_NOT_FOUND",
  BRANCH_NOT_FOUND = "BRANCH_NOT_FOUND",
  UNCOMMITTED_CHANGES = "UNCOMMITTED_CHANGES",
  LOCK_ERROR = "LOCK_ERROR",
}

/**
 * Pre-defined Git error instances for testing
 */
export const GitErrors = {
  [GitErrorType.MERGE_CONFLICT]: new Error(
    "CONFLICT (content): Merge conflict in some-file",
  ),
  [GitErrorType.NETWORK_TIMEOUT]: new Error(
    "timeout: failed to receive response",
  ),
  [GitErrorType.AUTH_FAILED]: new Error(
    "Authentication failed. Please check your credentials.",
  ),
  [GitErrorType.REMOTE_NOT_FOUND]: new Error("remote: Repository not found."),
  [GitErrorType.BRANCH_NOT_FOUND]: new Error(
    "error: pathspec 'branch-name' did not match any file(s) known to git",
  ),
  [GitErrorType.UNCOMMITTED_CHANGES]: new Error(
    "error: Your local changes would be overwritten by merge",
  ),
  [GitErrorType.LOCK_ERROR]: new Error(
    "fatal: Unable to create '.git/index.lock': File exists",
  ),
} as const;

/**
 * Status of a Git operation retry attempt
 */
export interface RetryStatus {
  /** Number of retry attempts made */
  attempts: number;
  /** Last error encountered, if any */
  lastError: Error | null;
  /** Timestamp of last attempt */
  lastAttempt: number;
}

/**
 * Operation in the Git operation queue
 */
export interface QueuedOperation {
  /** Name of the operation */
  name: string;
  /** Priority level (higher numbers = higher priority) */
  priority: number;
}

/**
 * Status of a Git branch
 */
export type BranchStatus = "clean" | "dirty" | "conflict";

/**
 * State of a Git branch
 */
export interface BranchState {
  /** Timestamp of last sync with remote */
  lastSync: number;
  /** Number of commits ahead of remote */
  ahead: number;
  /** Number of commits behind remote */
  behind: number;
  /** Current status of the branch */
  status: BranchStatus;
  /** Number of retry attempts made */
  retryCount: number;
  /** Last error encountered, if any */
  lastError: string | null;
}

/**
 * Complete state of the mock Git repository
 */
export interface MockGitState {
  /** Map of branch names to their states */
  branches: Record<string, BranchState>;
  /** Currently checked out branch */
  currentBranch: string;
  /** Whether there are uncommitted changes */
  uncommittedChanges: boolean;
}

/**
 * Retry scenario generator for testing retry mechanisms
 */
export class RetryScenarioBuilder {
  private failures: number = 0;
  private successAfter: number | null = null;
  private customErrors: Error[] = [];
  private networkConditions: NetworkCondition = NetworkConditions.FAST;

  withFailures(count: number): this {
    this.failures = count;
    return this;
  }

  withSuccessAfter(attempts: number): this {
    this.successAfter = attempts;
    return this;
  }

  withCustomErrors(errors: Error[]): this {
    this.customErrors = errors;
    return this;
  }

  withNetworkConditions(conditions: NetworkCondition): this {
    this.networkConditions = conditions;
    return this;
  }

  build(): MockGitServer {
    const server = new MockGitServer();
    server.setNetworkConditions(this.networkConditions);

    if (this.successAfter !== null) {
      server.setRecoveryThreshold(this.successAfter);
    }

    if (this.customErrors.length > 0) {
      let errorIndex = 0;
      server.on("beforeFailure", () => {
        if (errorIndex < this.customErrors.length) {
          throw this.customErrors[errorIndex++];
        }
      });
    }

    return server;
  }
}

/**
 * Helper to track retry attempts and timing
 */
export interface RetryAttempt {
  timestamp: number;
  error: Error | null;
  operation: string;
}

export class RetryTracker {
  private attempts: RetryAttempt[] = [];

  recordAttempt(error: Error | null, operation: string): void {
    this.attempts.push({
      timestamp: Date.now(),
      error,
      operation,
    });
  }

  getAttempts(): RetryAttempt[] {
    return [...this.attempts];
  }

  getDelaysBetweenAttempts(): number[] {
    const delays: number[] = [];
    for (let i = 1; i < this.attempts.length; i++) {
      delays.push(this.attempts[i].timestamp - this.attempts[i - 1].timestamp);
    }
    return delays;
  }

  clear(): void {
    this.attempts = [];
  }
}

/**
 * Mock Git server for testing Git operations with simulated network conditions
 * and error scenarios
 */
export class MockGitServer extends EventEmitter {
  private state: MockGitState;
  private networkCondition: NetworkCondition;
  private retryStatus: Map<string, RetryStatus>;
  private operationQueue: QueuedOperation[];
  private recoveryThreshold = 3;

  constructor(initialState?: Partial<MockGitState>) {
    super();
    this.state = {
      branches: {},
      currentBranch: "main",
      uncommittedChanges: false,
      ...initialState,
    };
    this.networkCondition = NetworkConditions.FAST;
    this.retryStatus = new Map();
    this.operationQueue = [];
  }

  /**
   * Simulates a Git operation with network delay and potential failures
   * @param operationName Name of the operation being performed
   * @param operation Function that performs the actual operation
   * @returns Promise that resolves when operation completes
   */
  async simulateOperation<T>(
    operationName: string,
    operation: () => Promise<T>,
  ): Promise<T> {
    const retryStatus = this.getRetryStatus(operationName);

    try {
      if (this.networkCondition.shouldFail()) {
        this.emit("beforeFailure", { operationName });
        throw new Error("Network error (simulated)");
      }

      await this.simulateNetworkDelay();
      const result = await operation();

      // Reset retry status on success
      this.retryStatus.delete(operationName);
      this.emit("operation:success", { operationName });

      return result;
    } catch (error) {
      if (error instanceof Error) {
        retryStatus.attempts++;
        retryStatus.lastError = error;
        retryStatus.lastAttempt = Date.now();

        this.retryStatus.set(operationName, retryStatus);
        this.emit("operation:error", {
          operationName,
          error,
          retryStatus,
          type: this.getErrorType(error),
        });

        if (this.isRetryableError(error)) {
          this.emit("operation:retry", {
            operationName,
            attempts: retryStatus.attempts,
          });
        }

        throw error;
      }
      throw error;
    }
  }

  /**
   * Gets the current branch name
   * @returns Promise that resolves with the current branch name
   */
  async getCurrentBranch(): Promise<string> {
    return this.simulateOperation("getCurrentBranch", async () => {
      return this.state.currentBranch;
    });
  }

  /**
   * Gets the status of all branches
   * @returns Promise that resolves with a map of branch names to their states
   */
  async getBranchStatuses(): Promise<Record<string, BranchState>> {
    return this.simulateOperation("getBranchStatuses", async () => {
      return this.state.branches;
    });
  }

  /**
   * Switches to a different branch
   * @param branchName Name of the branch to switch to
   * @throws {Error} If branch doesn't exist or there are uncommitted changes
   */
  async switchBranch(branchName: string): Promise<void> {
    return this.simulateOperation("switchBranch", async () => {
      if (!this.state.branches[branchName]) {
        throw GitErrors[GitErrorType.BRANCH_NOT_FOUND];
      }

      if (this.state.uncommittedChanges) {
        throw GitErrors[GitErrorType.UNCOMMITTED_CHANGES];
      }

      this.state.currentBranch = branchName;
    });
  }

  /**
   * Updates the mock Git state
   * @param newState Partial state to merge with current state
   */
  updateState(newState: Partial<MockGitState>): void {
    this.state = {
      ...this.state,
      ...newState,
      branches: {
        ...this.state.branches,
        ...(newState.branches || {}),
      },
    };
  }

  /**
   * Sets the network condition for simulating different scenarios
   * @param condition Network condition configuration
   */
  setNetworkConditions(condition: Partial<NetworkCondition>): void {
    this.networkCondition = {
      ...this.networkCondition,
      ...condition,
    };
    this.emit("network:condition:changed", this.networkCondition);
  }

  setRecoveryThreshold(threshold: number) {
    this.recoveryThreshold = threshold;
  }

  private async simulateNetworkDelay(): Promise<void> {
    const delay = this.networkCondition.delay;
    if (delay > 0) {
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  /**
   * Gets the retry status for an operation
   * @param operationName Name of the operation
   * @returns Current retry status
   */
  private getRetryStatus(operationName: string): RetryStatus {
    return (
      this.retryStatus.get(operationName) || {
        attempts: 0,
        lastError: null,
        lastAttempt: 0,
      }
    );
  }

  private isRetryableError(error: Error): boolean {
    return (
      error === GitErrors[GitErrorType.NETWORK_TIMEOUT] ||
      error === GitErrors[GitErrorType.LOCK_ERROR] ||
      error.message.includes("Network error (simulated)")
    );
  }

  private getErrorType(error: Error): string {
    if (error === GitErrors[GitErrorType.MERGE_CONFLICT])
      return "merge_conflict";
    if (error === GitErrors[GitErrorType.NETWORK_TIMEOUT])
      return "network_timeout";
    if (error === GitErrors[GitErrorType.AUTH_FAILED]) return "auth_failed";
    if (error === GitErrors[GitErrorType.LOCK_ERROR]) return "lock_error";
    return "unknown";
  }

  /**
   * Simulates switching to offline mode
   */
  goOffline(): void {
    this.setNetworkConditions(NetworkConditions.OFFLINE);
  }

  /**
   * Simulates switching to online mode with default (fast) network
   */
  goOnline(): void {
    this.setNetworkConditions(NetworkConditions.FAST);
  }
}
