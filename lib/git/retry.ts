import { EventEmitter } from "events";

export interface RetryConfig {
  maxAttempts: number;
  initialDelay: number;
  maxDelay: number;
  backoffFactor: number;
  timeout: number;
}

export interface RetryStatus {
  attempt: number;
  nextRetry: Date | null;
  error: Error | null;
  operation: string;
}

export interface QueuedOperation<T> {
  id: string;
  operation: () => Promise<T>;
  name: string;
  priority: number;
  retryConfig?: Partial<RetryConfig>;
  status: RetryStatus;
}

const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxAttempts: 3,
  initialDelay: 1000, // 1 second
  maxDelay: 30000, // 30 seconds
  backoffFactor: 2, // Double delay each retry
  timeout: 10000, // 10 seconds
};

export class RetryManager extends EventEmitter {
  private config: RetryConfig;
  private operationQueue: QueuedOperation<any>[] = [];
  private isProcessing: boolean = false;
  private currentOperation: QueuedOperation<any> | null = null;

  constructor(config: Partial<RetryConfig> = {}) {
    super();
    this.config = { ...DEFAULT_RETRY_CONFIG, ...config };
  }

  /**
   * Add an operation to the retry queue
   */
  async enqueue<T>(
    operation: () => Promise<T>,
    name: string,
    priority: number = 0,
    retryConfig?: Partial<RetryConfig>,
  ): Promise<T> {
    const id = `${name}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    const queuedOp: QueuedOperation<T> = {
      id,
      operation,
      name,
      priority,
      retryConfig,
      status: {
        attempt: 0,
        nextRetry: null,
        error: null,
        operation: name,
      },
    };

    this.operationQueue.push(queuedOp);
    this.sortQueue();

    // Start processing if not already running
    if (!this.isProcessing) {
      this.processQueue();
    }

    // Return a promise that resolves when the operation completes
    return new Promise((resolve, reject) => {
      const handleComplete = (completedOp: QueuedOperation<any>, result: T) => {
        if (completedOp.id === id) {
          this.off("operationComplete", handleComplete);
          this.off("operationFailed", handleFailed);
          resolve(result);
        }
      };

      const handleFailed = (failedOp: QueuedOperation<any>) => {
        if (failedOp.id === id) {
          this.off("operationComplete", handleComplete);
          this.off("operationFailed", handleFailed);
          reject(failedOp.status.error);
        }
      };

      this.on("operationComplete", handleComplete);
      this.on("operationFailed", handleFailed);
    });
  }

  /**
   * Process the operation queue
   */
  private async processQueue(): Promise<void> {
    if (this.isProcessing || this.operationQueue.length === 0) {
      return;
    }

    this.isProcessing = true;

    while (this.operationQueue.length > 0) {
      this.currentOperation = this.operationQueue.shift()!;
      const opConfig = {
        ...this.config,
        ...this.currentOperation.retryConfig,
      };

      try {
        const result = await this.executeWithRetry(
          this.currentOperation.operation,
          this.currentOperation,
          opConfig,
        );

        this.emit("operationComplete", this.currentOperation, result);
      } catch (error) {
        this.currentOperation.status.error = error as Error;
        this.emit("operationFailed", this.currentOperation);
      }
    }

    this.isProcessing = false;
    this.currentOperation = null;
  }

  /**
   * Execute an operation with retry logic
   */
  private async executeWithRetry<T>(
    operation: () => Promise<T>,
    queuedOp: QueuedOperation<T>,
    config: RetryConfig,
  ): Promise<T> {
    let delay = config.initialDelay;

    while (queuedOp.status.attempt < config.maxAttempts) {
      try {
        // Attempt the operation
        const result = await this.executeWithTimeout(operation, config.timeout);
        return result;
      } catch (error) {
        queuedOp.status.attempt++;
        queuedOp.status.error = error as Error;

        // If we've hit max attempts, throw the error
        if (queuedOp.status.attempt >= config.maxAttempts) {
          throw new Error(
            `Operation ${queuedOp.name} failed after ${config.maxAttempts} attempts: ${error}`,
          );
        }

        // Calculate next retry time
        delay = Math.min(delay * config.backoffFactor, config.maxDelay);
        queuedOp.status.nextRetry = new Date(Date.now() + delay);

        this.emit("retrying", {
          operation: queuedOp.name,
          attempt: queuedOp.status.attempt,
          nextRetry: queuedOp.status.nextRetry,
          error: error as Error,
        });

        // Wait before retrying
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }

    throw queuedOp.status.error;
  }

  /**
   * Execute an operation with a timeout
   */
  private executeWithTimeout<T>(
    operation: () => Promise<T>,
    timeout: number,
  ): Promise<T> {
    return Promise.race([
      operation(),
      new Promise<T>((_, reject) => {
        setTimeout(() => {
          reject(new Error(`Operation timed out after ${timeout}ms`));
        }, timeout);
      }),
    ]);
  }

  /**
   * Sort the operation queue by priority (higher numbers first)
   */
  private sortQueue(): void {
    this.operationQueue.sort((a, b) => b.priority - a.priority);
  }

  /**
   * Get the current queue status
   */
  getStatus(): {
    queueLength: number;
    isProcessing: boolean;
    currentOperation: QueuedOperation<any> | null;
  } {
    return {
      queueLength: this.operationQueue.length,
      isProcessing: this.isProcessing,
      currentOperation: this.currentOperation,
    };
  }
}
