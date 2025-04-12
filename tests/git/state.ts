import { EventEmitter } from "events";
import { BranchStatus, BranchProtection, BranchSyncSettings } from "./branch";

export interface GitState {
  branches: Map<string, BranchStatus>;
  syncSettings: Map<string, BranchSyncSettings>;
  currentBranch: string | null;
  timestamp: number;
  version: number;
}

export interface StateSnapshot {
  state: GitState;
  id: string;
  description: string;
  timestamp: number;
  tags: string[];
}

export interface RestorePoint {
  snapshot: StateSnapshot;
  verification: {
    branchCount: number;
    currentBranch: string | null;
    checksum: string;
  };
}

export class StateManager extends EventEmitter {
  private snapshots: Map<string, StateSnapshot> = new Map();
  private restorePoints: Map<string, RestorePoint> = new Map();
  private currentState: GitState;
  private stateVersion: number = 0;

  constructor(initialState?: Partial<GitState>) {
    super();
    this.currentState = {
      branches: new Map(),
      syncSettings: new Map(),
      currentBranch: null,
      timestamp: Date.now(),
      version: 0,
      ...initialState,
    };
  }

  createSnapshot(description: string, tags: string[] = []): string {
    const id = this.generateSnapshotId();
    const snapshot: StateSnapshot = {
      state: this.cloneState(this.currentState),
      id,
      description,
      timestamp: Date.now(),
      tags,
    };

    this.snapshots.set(id, snapshot);
    this.emit("snapshotCreated", { id, description, tags });
    return id;
  }

  createRestorePoint(snapshotId: string): void {
    const snapshot = this.snapshots.get(snapshotId);
    if (!snapshot) {
      throw new Error(`Snapshot ${snapshotId} not found`);
    }

    const verification = this.createVerification(snapshot.state);
    const restorePoint: RestorePoint = {
      snapshot,
      verification,
    };

    this.restorePoints.set(snapshotId, restorePoint);
    this.emit("restorePointCreated", { id: snapshotId, verification });
  }

  async restore(snapshotId: string): Promise<void> {
    const restorePoint = this.restorePoints.get(snapshotId);
    if (!restorePoint) {
      throw new Error(`Restore point ${snapshotId} not found`);
    }

    // Verify state integrity
    const verification = this.createVerification(restorePoint.snapshot.state);
    if (!this.verifyState(verification, restorePoint.verification)) {
      throw new Error("State verification failed");
    }

    // Create backup before restore
    const backupId = this.createSnapshot("Auto-backup before restore");

    try {
      this.currentState = this.cloneState(restorePoint.snapshot.state);
      this.stateVersion++;
      this.currentState.version = this.stateVersion;
      this.currentState.timestamp = Date.now();

      this.emit("stateRestored", {
        id: snapshotId,
        backupId,
        timestamp: this.currentState.timestamp,
      });
    } catch (error) {
      // Restore from backup on failure
      const backup = this.snapshots.get(backupId);
      if (backup) {
        this.currentState = this.cloneState(backup.state);
      }
      throw error;
    }
  }

  getSnapshot(id: string): StateSnapshot | undefined {
    return this.snapshots.get(id);
  }

  listSnapshots(): StateSnapshot[] {
    return Array.from(this.snapshots.values());
  }

  findSnapshotsByTag(tag: string): StateSnapshot[] {
    return Array.from(this.snapshots.values()).filter((snapshot) =>
      snapshot.tags.includes(tag),
    );
  }

  getCurrentState(): GitState {
    return this.cloneState(this.currentState);
  }

  private generateSnapshotId(): string {
    return `snap-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private createVerification(state: GitState): RestorePoint["verification"] {
    return {
      branchCount: state.branches.size,
      currentBranch: state.currentBranch,
      checksum: this.calculateChecksum(state),
    };
  }

  private verifyState(
    current: RestorePoint["verification"],
    original: RestorePoint["verification"],
  ): boolean {
    return (
      current.branchCount === original.branchCount &&
      current.currentBranch === original.currentBranch &&
      current.checksum === original.checksum
    );
  }

  private calculateChecksum(state: GitState): string {
    // Simple checksum implementation for demonstration
    // In production, use a proper hashing algorithm
    const stateString = JSON.stringify({
      branches: Array.from(state.branches.entries()),
      syncSettings: Array.from(state.syncSettings.entries()),
      currentBranch: state.currentBranch,
    });

    let hash = 0;
    for (let i = 0; i < stateString.length; i++) {
      const char = stateString.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash;
    }
    return hash.toString(36);
  }

  private cloneState(state: GitState): GitState {
    return {
      branches: new Map(state.branches),
      syncSettings: new Map(state.syncSettings),
      currentBranch: state.currentBranch,
      timestamp: state.timestamp,
      version: state.version,
    };
  }
}
