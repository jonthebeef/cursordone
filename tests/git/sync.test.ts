import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  MockGitServer,
  RetryScenarioBuilder,
  RetryTracker,
  NetworkConditions,
  GitErrors,
  RetryAttempt,
} from "./setup";

describe("Git Sync Operations", () => {
  let server: MockGitServer;
  let tracker: RetryTracker;

  beforeEach(() => {
    server = new MockGitServer();
    tracker = new RetryTracker();
  });

  describe("Retry Mechanism", () => {
    it("should implement exponential backoff", async () => {
      const scenario = new RetryScenarioBuilder()
        .withNetworkConditions(NetworkConditions.FLAKY)
        .withSuccessAfter(3)
        .build();

      try {
        await scenario.push();
      } catch (error) {
        // Expected to fail
      }

      const delays = tracker.getDelaysBetweenAttempts();
      expect(delays[1]).toBeGreaterThan(delays[0]); // Second retry should wait longer
      expect(delays[2]).toBeGreaterThan(delays[1]); // Third retry should wait even longer
    });

    it("should handle specific Git errors appropriately", async () => {
      const scenario = new RetryScenarioBuilder()
        .withCustomErrors([
          GitErrors.NETWORK_TIMEOUT,
          GitErrors.LOCK_ERROR,
          GitErrors.AUTH_FAILED,
        ])
        .build();

      let attempts: RetryAttempt[] = [];
      try {
        await scenario.push();
      } catch (error) {
        attempts = tracker.getAttempts();
      }

      // Network timeout and lock errors should be retried, auth failures should not
      expect(attempts.length).toBe(2);
      expect(attempts[0].error).toEqual(GitErrors.NETWORK_TIMEOUT);
      expect(attempts[1].error).toEqual(GitErrors.LOCK_ERROR);
    });
  });

  describe("Operation Queuing", () => {
    it("should queue operations with correct priorities", async () => {
      const operations = [
        { name: "push", priority: 1 },
        { name: "fetch", priority: 2 },
        { name: "pull", priority: 1 },
      ];

      const executionOrder: string[] = [];
      server.on("operation", (op) => executionOrder.push(op.name));

      await Promise.all(
        operations.map((op) => server.queueOperation(op.name, op.priority)),
      );

      // Higher priority operations should execute first
      expect(executionOrder[0]).toBe("fetch");
    });

    it("should maintain order within same priority level", async () => {
      const operations = [
        { name: "push1", priority: 1 },
        { name: "push2", priority: 1 },
        { name: "push3", priority: 1 },
      ];

      const executionOrder: string[] = [];
      server.on("operation", (op) => executionOrder.push(op.name));

      await Promise.all(
        operations.map((op) => server.queueOperation(op.name, op.priority)),
      );

      expect(executionOrder).toEqual(["push1", "push2", "push3"]);
    });
  });

  describe("Branch-specific Retry Status", () => {
    it("should track retry status per branch", async () => {
      const mainBranch = new RetryScenarioBuilder()
        .withNetworkConditions(NetworkConditions.FLAKY)
        .build();

      const featureBranch = new RetryScenarioBuilder()
        .withNetworkConditions(NetworkConditions.VERY_FLAKY)
        .build();

      await Promise.all([
        mainBranch.push().catch(() => {}),
        featureBranch.push().catch(() => {}),
      ]);

      const mainStatus = mainBranch.getRetryStatus("main");
      const featureStatus = featureBranch.getRetryStatus("feature");

      expect(mainStatus.attempts).toBeLessThan(featureStatus.attempts);
      expect(mainStatus.lastError).toBeDefined();
      expect(featureStatus.lastError).toBeDefined();
    });
  });

  describe("UI Feedback", () => {
    it("should emit progress events for UI updates", async () => {
      const progressEvents: any[] = [];
      server.on("progress", (event) => progressEvents.push(event));

      const scenario = new RetryScenarioBuilder()
        .withNetworkConditions(NetworkConditions.SLOW)
        .build();

      await scenario.push().catch(() => {});

      expect(progressEvents).toContainEqual(
        expect.objectContaining({
          type: "retry",
          attempt: expect.any(Number),
          delay: expect.any(Number),
        }),
      );
    });

    it("should provide detailed error information for UI", async () => {
      const errorEvents: any[] = [];
      server.on("error", (event) => errorEvents.push(event));

      const scenario = new RetryScenarioBuilder()
        .withCustomErrors([GitErrors.MERGE_CONFLICT])
        .build();

      await scenario.push().catch(() => {});

      expect(errorEvents[0]).toMatchObject({
        type: "merge_conflict",
        retryable: false,
        userMessage: expect.any(String),
        details: expect.any(Object),
      });
    });
  });
});
