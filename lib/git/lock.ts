import { EventEmitter } from "events";

export interface FileLock {
  path: string;
  owner: string;
  acquired: Date;
  expires: Date;
}

export interface LockOptions {
  owner: string;
  duration?: number; // Duration in milliseconds, defaults to 5 minutes
}

export class LockManager extends EventEmitter {
  private locks: Map<string, FileLock> = new Map();
  private cleanupInterval: NodeJS.Timeout | null = null;

  constructor() {
    super();
    this.startCleanup();
  }

  /**
   * Acquire a lock on a file
   * @param path File path to lock
   * @param options Lock options
   * @returns The acquired lock or null if already locked
   */
  acquireLock(path: string, options: LockOptions): FileLock | null {
    const existingLock = this.locks.get(path);
    if (existingLock && !this.isLockExpired(existingLock)) {
      return null;
    }

    const lock: FileLock = {
      path,
      owner: options.owner,
      acquired: new Date(),
      expires: new Date(Date.now() + (options.duration || 5 * 60 * 1000)), // Default 5 minutes
    };

    this.locks.set(path, lock);
    this.emit("lock:acquired", lock);
    return lock;
  }

  /**
   * Release a lock on a file
   * @param path File path to unlock
   * @param owner Lock owner
   * @returns true if lock was released, false if not found or not owned
   */
  releaseLock(path: string, owner: string): boolean {
    const lock = this.locks.get(path);
    if (!lock || lock.owner !== owner) {
      return false;
    }

    this.locks.delete(path);
    this.emit("lock:released", lock);
    return true;
  }

  /**
   * Check if a file is locked
   * @param path File path to check
   * @returns The lock if file is locked, null otherwise
   */
  isLocked(path: string): FileLock | null {
    const lock = this.locks.get(path);
    if (!lock || this.isLockExpired(lock)) {
      return null;
    }
    return lock;
  }

  /**
   * Get all active locks
   * @returns Array of active locks
   */
  getActiveLocks(): FileLock[] {
    return Array.from(this.locks.values()).filter(
      (lock) => !this.isLockExpired(lock),
    );
  }

  /**
   * Start the cleanup interval
   */
  private startCleanup() {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }

    this.cleanupInterval = setInterval(() => {
      const now = Date.now();
      for (const [path, lock] of this.locks.entries()) {
        if (lock.expires.getTime() <= now) {
          this.locks.delete(path);
          this.emit("lock:expired", lock);
        }
      }
    }, 60000); // Check every minute
  }

  /**
   * Check if a lock is expired
   * @param lock Lock to check
   * @returns true if lock is expired
   */
  private isLockExpired(lock: FileLock): boolean {
    return lock.expires.getTime() <= Date.now();
  }

  /**
   * Stop the cleanup interval
   */
  stop() {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
  }
}
