import { describe, it, expect, beforeEach } from "vitest";
import { BranchManager, BranchProtection } from "./branch";
import { GitErrors } from "./setup";

describe("Branch Management", () => {
  let manager: BranchManager;
  const defaultProtection: BranchProtection = {
    requirePullBeforePush: true,
    preventForcePush: true,
    requireSync: true,
    syncInterval: 300000,
  };

  beforeEach(() => {
    manager = new BranchManager();
  });

  describe("Branch Operations", () => {
    it("should initialize with main branch", () => {
      const status = manager.getBranchStatus("main");
      expect(status.current).toBe(true);
      expect(status.protection).toEqual(defaultProtection);
    });

    it("should add new branches", () => {
      const events: any[] = [];
      manager.on("branchAdded", (event) => events.push(event));

      manager.addBranch("feature", defaultProtection);

      const status = manager.getBranchStatus("feature");
      expect(status.name).toBe("feature");
      expect(status.current).toBe(false);
      expect(events).toHaveLength(1);
      expect(events[0].name).toBe("feature");
    });

    it("should prevent duplicate branch creation", () => {
      manager.addBranch("feature", defaultProtection);
      expect(() => manager.addBranch("feature", defaultProtection)).toThrow(
        "Branch feature already exists",
      );
    });
  });

  describe("Branch Switching", () => {
    beforeEach(() => {
      manager.addBranch("feature", defaultProtection);
    });

    it("should switch between branches", async () => {
      const events: any[] = [];
      manager.on("branchSwitched", (event) => events.push(event));

      await manager.switchBranch("feature");

      const mainStatus = manager.getBranchStatus("main");
      const featureStatus = manager.getBranchStatus("feature");

      expect(mainStatus.current).toBe(false);
      expect(featureStatus.current).toBe(true);
      expect(events).toHaveLength(1);
      expect(events[0]).toMatchObject({
        from: "main",
        to: "feature",
      });
    });

    it("should fail switching to non-existent branch", async () => {
      await expect(manager.switchBranch("nonexistent")).rejects.toEqual(
        GitErrors.BRANCH_NOT_FOUND,
      );
    });
  });

  describe("Branch Status", () => {
    beforeEach(() => {
      manager.addBranch("feature", defaultProtection);
    });

    it("should update branch status", () => {
      const events: any[] = [];
      manager.on("branchStatusUpdated", (event) => events.push(event));

      manager.updateBranchStatus("feature", {
        ahead: 2,
        behind: 1,
        hasConflicts: true,
      });

      const status = manager.getBranchStatus("feature");
      expect(status.ahead).toBe(2);
      expect(status.behind).toBe(1);
      expect(status.hasConflicts).toBe(true);
      expect(events).toHaveLength(1);
      expect(events[0].status).toMatchObject({
        ahead: 2,
        behind: 1,
        hasConflicts: true,
      });
    });

    it("should prevent status updates for non-existent branches", () => {
      expect(() =>
        manager.updateBranchStatus("nonexistent", { ahead: 1 }),
      ).toThrow("Branch nonexistent not found");
    });

    it("should maintain branch name and current status on updates", () => {
      manager.updateBranchStatus("feature", {
        name: "attempted-rename",
        current: true,
      });

      const status = manager.getBranchStatus("feature");
      expect(status.name).toBe("feature"); // Name shouldn't change
      expect(status.current).toBe(false); // Current flag maintained
    });
  });

  describe("Sync Settings", () => {
    beforeEach(() => {
      manager.addBranch("feature", defaultProtection);
    });

    it("should update sync settings", () => {
      const events: any[] = [];
      manager.on("syncSettingsUpdated", (event) => events.push(event));

      manager.setSyncSettings("feature", {
        autoSync: false,
        retryStrategy: "aggressive",
      });

      expect(events).toHaveLength(1);
      expect(events[0]).toMatchObject({
        branch: "feature",
        settings: {
          autoSync: false,
          retryStrategy: "aggressive",
        },
      });
    });

    it("should maintain default values for unspecified settings", () => {
      manager.setSyncSettings("feature", {
        autoSync: false,
      });

      const events: any[] = [];
      manager.on("syncSettingsUpdated", (event) => events.push(event));

      manager.setSyncSettings("feature", {
        retryStrategy: "manual",
      });

      expect(events[0].settings).toMatchObject({
        autoSync: false, // Maintained from previous update
        retryStrategy: "manual", // New value
      });
    });
  });
});
