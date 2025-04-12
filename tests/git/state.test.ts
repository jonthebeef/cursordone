import { describe, it, expect, beforeEach } from "vitest";
import { StateManager, GitState } from "./state";
import { BranchManager } from "./branch";
import { MockGitState, MockGitServer, BranchState } from "./setup";

describe("State Recovery System", () => {
  let stateManager: StateManager;
  let branchManager: BranchManager;

  beforeEach(() => {
    branchManager = new BranchManager();
    stateManager = new StateManager();
  });

  describe("Snapshot Management", () => {
    it("should create snapshots with metadata", () => {
      const events: any[] = [];
      stateManager.on("snapshotCreated", (event) => events.push(event));

      const id = stateManager.createSnapshot("Test snapshot", [
        "test",
        "backup",
      ]);
      const snapshot = stateManager.getSnapshot(id);

      expect(snapshot).toBeDefined();
      expect(snapshot?.description).toBe("Test snapshot");
      expect(snapshot?.tags).toContain("test");
      expect(events).toHaveLength(1);
    });

    it("should find snapshots by tag", () => {
      stateManager.createSnapshot("Snapshot 1", ["test"]);
      stateManager.createSnapshot("Snapshot 2", ["prod"]);
      stateManager.createSnapshot("Snapshot 3", ["test", "prod"]);

      const testSnapshots = stateManager.findSnapshotsByTag("test");
      expect(testSnapshots).toHaveLength(2);
    });

    it("should list all snapshots", () => {
      stateManager.createSnapshot("Snapshot 1");
      stateManager.createSnapshot("Snapshot 2");
      stateManager.createSnapshot("Snapshot 3");

      const snapshots = stateManager.listSnapshots();
      expect(snapshots).toHaveLength(3);
    });
  });

  describe("Restore Points", () => {
    it("should create restore points with verification", () => {
      const events: any[] = [];
      stateManager.on("restorePointCreated", (event) => events.push(event));

      const id = stateManager.createSnapshot("Test restore point");
      stateManager.createRestorePoint(id);

      expect(events).toHaveLength(1);
      expect(events[0].verification).toBeDefined();
    });

    it("should fail creating restore point for non-existent snapshot", () => {
      expect(() => stateManager.createRestorePoint("non-existent")).toThrow(
        "Snapshot non-existent not found",
      );
    });
  });

  describe("State Restoration", () => {
    it("should restore state from snapshot", async () => {
      // Create initial state
      const initialState: Partial<GitState> = {
        currentBranch: "main",
        branches: new Map([
          [
            "main",
            {
              name: "main",
              current: true,
              ahead: 0,
              behind: 0,
              hasConflicts: false,
              lastSync: null,
              protection: {
                requirePullBeforePush: true,
                preventForcePush: true,
                requireSync: true,
                syncInterval: 300000,
              },
            },
          ],
        ]),
      };

      const manager = new StateManager(initialState);
      const snapshotId = manager.createSnapshot("Initial state");
      manager.createRestorePoint(snapshotId);

      // Modify state
      const currentState = manager.getCurrentState();
      currentState.currentBranch = "feature";
      currentState.branches.set("feature", {
        name: "feature",
        current: true,
        ahead: 1,
        behind: 0,
        hasConflicts: false,
        lastSync: null,
        protection: {
          requirePullBeforePush: false,
          preventForcePush: false,
          requireSync: false,
          syncInterval: null,
        },
      });

      // Restore to initial state
      await manager.restore(snapshotId);
      const restoredState = manager.getCurrentState();

      expect(restoredState.currentBranch).toBe("main");
      expect(restoredState.branches.size).toBe(1);
      expect(restoredState.branches.has("feature")).toBe(false);
    });

    it("should create backup before restore", async () => {
      const id = stateManager.createSnapshot("Test state");
      stateManager.createRestorePoint(id);

      const events: any[] = [];
      stateManager.on("stateRestored", (event) => events.push(event));

      await stateManager.restore(id);

      expect(events).toHaveLength(1);
      expect(events[0].backupId).toBeDefined();
      expect(stateManager.getSnapshot(events[0].backupId)).toBeDefined();
    });

    it("should fail restoring non-existent restore point", async () => {
      await expect(stateManager.restore("non-existent")).rejects.toThrow(
        "Restore point non-existent not found",
      );
    });

    it("should handle restore failures gracefully", async () => {
      const id = stateManager.createSnapshot("Test state");
      stateManager.createRestorePoint(id);

      // Corrupt the restore point verification
      const restorePoint = stateManager.getSnapshot(id);
      if (restorePoint) {
        restorePoint.state.version = -1; // Invalid version
      }

      await expect(stateManager.restore(id)).rejects.toThrow(
        "State verification failed",
      );
    });
  });
});

describe("MockGitState", () => {
  let mockState: MockGitState;
  let mockServer: MockGitServer;

  beforeEach(() => {
    mockState = {
      branches: {
        main: {
          lastSync: Date.now(),
          ahead: 0,
          behind: 0,
          status: "clean",
          retryCount: 0,
          lastError: null,
        },
        "feature/test": {
          lastSync: Date.now() - 1000 * 60, // 1 minute ago
          ahead: 1,
          behind: 0,
          status: "dirty",
          retryCount: 2,
          lastError: "Network timeout",
        },
      },
      currentBranch: "main",
      uncommittedChanges: false,
    };
    mockServer = new MockGitServer(mockState);
  });

  describe("getCurrentBranch", () => {
    it("should return the current branch", async () => {
      const branch = await mockServer.getCurrentBranch();
      expect(branch).toBe("main");
    });
  });

  describe("getBranchStatuses", () => {
    it("should return status for main branch", async () => {
      const statuses = await mockServer.getBranchStatuses();
      expect(statuses.main).toEqual({
        lastSync: expect.any(Number),
        ahead: 0,
        behind: 0,
        status: "clean",
        retryCount: 0,
        lastError: null,
      });
    });

    it("should return status for feature branch", async () => {
      const statuses = await mockServer.getBranchStatuses();
      expect(statuses["feature/test"]).toEqual({
        lastSync: expect.any(Number),
        ahead: 1,
        behind: 0,
        status: "dirty",
        retryCount: 2,
        lastError: "Network timeout",
      });
    });

    it("should not throw for non-existent branch", async () => {
      const statuses = await mockServer.getBranchStatuses();
      expect(statuses["nonexistent"]).toBeUndefined();
    });
  });

  describe("switchBranch", () => {
    it("should switch to existing branch", async () => {
      await mockServer.switchBranch("feature/test");
      expect(mockServer.getCurrentBranch()).resolves.toBe("feature/test");
    });

    it("should throw when switching with uncommitted changes", async () => {
      mockState.uncommittedChanges = true;
      await expect(mockServer.switchBranch("feature/test")).rejects.toThrow(
        "error: Your local changes would be overwritten by merge",
      );
    });

    it("should throw for non-existent branch", async () => {
      await expect(mockServer.switchBranch("nonexistent")).rejects.toThrow(
        "error: pathspec 'branch-name' did not match any file(s) known to git",
      );
    });
  });

  describe("updateState", () => {
    it("should update branch state", async () => {
      mockServer.updateState({
        branches: {
          main: {
            lastSync: Date.now(),
            ahead: 1,
            behind: 0,
            status: "dirty",
            retryCount: 1,
            lastError: "Test error",
          },
        },
      });

      const statuses = await mockServer.getBranchStatuses();
      expect(statuses.main).toEqual({
        lastSync: expect.any(Number),
        ahead: 1,
        behind: 0,
        status: "dirty",
        retryCount: 1,
        lastError: "Test error",
      });
    });
  });
});
