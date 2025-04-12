import { EventEmitter } from "events";
import { GitErrors } from "./setup";

export interface BranchStatus {
  name: string;
  current: boolean;
  ahead: number;
  behind: number;
  hasConflicts: boolean;
  lastSync: number | null;
  protection: BranchProtection;
}

export interface BranchProtection {
  requirePullBeforePush: boolean;
  preventForcePush: boolean;
  requireSync: boolean;
  syncInterval: number | null;
}

export interface BranchSyncSettings {
  autoSync: boolean;
  syncInterval: number;
  retryStrategy: "aggressive" | "conservative" | "manual";
  maxRetries: number;
}

export class BranchManager extends EventEmitter {
  private branches: Map<string, BranchStatus> = new Map();
  private syncSettings: Map<string, BranchSyncSettings> = new Map();
  private currentBranch: string | null = null;

  constructor() {
    super();
    // Initialize main branch by default
    this.addBranch("main", {
      requirePullBeforePush: true,
      preventForcePush: true,
      requireSync: true,
      syncInterval: 300000, // 5 minutes
    });
    this.setCurrentBranch("main");
  }

  addBranch(name: string, protection: BranchProtection): void {
    if (this.branches.has(name)) {
      throw new Error(`Branch ${name} already exists`);
    }

    this.branches.set(name, {
      name,
      current: false,
      ahead: 0,
      behind: 0,
      hasConflicts: false,
      lastSync: null,
      protection,
    });

    // Set default sync settings
    this.syncSettings.set(name, {
      autoSync: true,
      syncInterval: 300000,
      retryStrategy: "conservative",
      maxRetries: 3,
    });

    this.emit("branchAdded", { name, protection });
  }

  async switchBranch(name: string): Promise<void> {
    const branch = this.branches.get(name);
    if (!branch) {
      throw GitErrors.BRANCH_NOT_FOUND;
    }

    // Check for uncommitted changes
    if (this.hasUncommittedChanges()) {
      throw GitErrors.UNCOMMITTED_CHANGES;
    }

    const oldBranch = this.currentBranch;
    this.currentBranch = name;

    // Update branch statuses
    for (const [branchName, status] of this.branches.entries()) {
      this.branches.set(branchName, {
        ...status,
        current: branchName === name,
      });
    }

    this.emit("branchSwitched", {
      from: oldBranch,
      to: name,
      timestamp: Date.now(),
    });
  }

  getBranchStatus(name: string): BranchStatus {
    const status = this.branches.get(name);
    if (!status) {
      throw new Error(`Branch ${name} not found`);
    }
    return { ...status };
  }

  setSyncSettings(branch: string, settings: Partial<BranchSyncSettings>): void {
    const current = this.syncSettings.get(branch) || {
      autoSync: true,
      syncInterval: 300000,
      retryStrategy: "conservative",
      maxRetries: 3,
    };

    this.syncSettings.set(branch, {
      ...current,
      ...settings,
    });

    this.emit("syncSettingsUpdated", { branch, settings });
  }

  updateBranchStatus(name: string, updates: Partial<BranchStatus>): void {
    const current = this.branches.get(name);
    if (!current) {
      throw new Error(`Branch ${name} not found`);
    }

    const updated = {
      ...current,
      ...updates,
      name, // Prevent name changes
      current: name === this.currentBranch, // Maintain current flag
    };

    this.branches.set(name, updated);
    this.emit("branchStatusUpdated", { branch: name, status: updated });
  }

  private hasUncommittedChanges(): boolean {
    // In real implementation, this would check Git status
    return false;
  }

  // For testing purposes
  _reset(): void {
    this.branches.clear();
    this.syncSettings.clear();
    this.currentBranch = null;
    this.addBranch("main", {
      requirePullBeforePush: true,
      preventForcePush: true,
      requireSync: true,
      syncInterval: 300000,
    });
    this.setCurrentBranch("main");
  }

  private setCurrentBranch(name: string): void {
    this.currentBranch = name;
    const status = this.branches.get(name);
    if (status) {
      this.updateBranchStatus(name, { current: true });
    }
  }
}
