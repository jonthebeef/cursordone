import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  MockGitServer,
  NetworkConditions,
  GitErrors,
  GitErrorType,
  RetryScenarioBuilder,
  RetryTracker,
} from "./setup";

describe("Network Conditions", () => {
  let server: MockGitServer;

  beforeEach(() => {
    server = new MockGitServer();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("should respect network delays", async () => {
    server.setNetworkConditions(NetworkConditions.SLOW);
    const startTime = Date.now();

    const promise = server.getCurrentBranch();
    await vi.advanceTimersByTimeAsync(NetworkConditions.SLOW.delay);

    const result = await promise;
    expect(result).toBe("main");
    expect(Date.now() - startTime).toBe(NetworkConditions.SLOW.delay);
  });

  it("should fail operations when offline", async () => {
    server.goOffline();
    await expect(server.getCurrentBranch()).rejects.toThrow(
      "Network error (simulated)",
    );
  });

  it("should recover operations when going back online", async () => {
    server.goOffline();

    // We need to handle both promises to avoid unhandled rejections
    const failedPromise = server.getCurrentBranch().catch(() => {});
    await vi.advanceTimersByTimeAsync(100);

    server.goOnline();
    const successPromise = server.getCurrentBranch();
    await vi.advanceTimersByTimeAsync(100);

    await failedPromise; // Wait for the failed promise to complete
    const result = await successPromise;
    expect(result).toBe("main");
  });

  it("should simulate flaky connections", async () => {
    const tracker = new RetryTracker();
    server.setNetworkConditions(NetworkConditions.FLAKY);

    // Mock Math.random to force a failure
    const originalRandom = Math.random;
    Math.random = () => 0.1; // Will trigger failure for FLAKY (0.3 failure rate)

    const failedPromise = server.getCurrentBranch().catch((error) => {
      tracker.recordAttempt(error as Error, "getCurrentBranch");
      return error;
    });

    await vi.advanceTimersByTimeAsync(100);
    await failedPromise;

    // Restore Math.random and set to force success
    Math.random = () => 0.9;
    const successPromise = server.getCurrentBranch().then((result) => {
      tracker.recordAttempt(null, "getCurrentBranch");
      return result;
    });

    await vi.advanceTimersByTimeAsync(100);
    const result = await successPromise;

    expect(tracker.getAttempts()).toHaveLength(2);
    expect(tracker.getAttempts()[0].error).toBeTruthy();
    expect(tracker.getAttempts()[1].error).toBeNull();
    expect(result).toBe("main");

    // Cleanup
    Math.random = originalRandom;
  });
});

describe("Retry Mechanism", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("should build retry scenarios", async () => {
    const scenario = new RetryScenarioBuilder()
      .withFailures(2)
      .withSuccessAfter(3)
      .withNetworkConditions(NetworkConditions.FLAKY)
      .withCustomErrors([
        GitErrors[GitErrorType.NETWORK_TIMEOUT],
        GitErrors[GitErrorType.LOCK_ERROR],
      ])
      .build();

    expect(scenario).toBeInstanceOf(MockGitServer);
  });

  it("should track retry attempts", () => {
    const tracker = new RetryTracker();

    tracker.recordAttempt(new Error("First try"), "testOp");
    tracker.recordAttempt(new Error("Second try"), "testOp");
    tracker.recordAttempt(null, "testOp");

    const attempts = tracker.getAttempts();
    expect(attempts).toHaveLength(3);
    expect(attempts[0].error?.message).toBe("First try");
    expect(attempts[1].error?.message).toBe("Second try");
    expect(attempts[2].error).toBeNull();
  });

  it("should emit retry events", async () => {
    const server = new MockGitServer();
    const events: any[] = [];

    server.on("operation:retry", (event) => events.push(event));
    server.setNetworkConditions(NetworkConditions.VERY_FLAKY);

    // Force a failure first
    Math.random = () => 0.1;
    try {
      await server.getCurrentBranch();
    } catch (error) {
      // Expected to fail
      await vi.advanceTimersByTimeAsync(100);
    }

    expect(events.length).toBeGreaterThan(0);
    expect(events[0]).toHaveProperty("operationName", "getCurrentBranch");
    expect(events[0]).toHaveProperty("attempts");

    // Restore Math.random
    Math.random = () => 0.5;
  });
});

describe("Error Handling", () => {
  let server: MockGitServer;

  beforeEach(() => {
    server = new MockGitServer();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("should handle merge conflicts", () => {
    const events: any[] = [];
    server.on("operation:error", (event) => events.push(event));

    // Simulate a merge conflict
    server.updateState({
      branches: {
        main: {
          lastSync: Date.now(),
          ahead: 1,
          behind: 1,
          status: "conflict",
          retryCount: 0,
          lastError: GitErrors[GitErrorType.MERGE_CONFLICT].message,
        },
      },
    });

    // Check the state directly
    expect(server["state"].branches.main.status).toBe("conflict");
    expect(server["state"].branches.main.lastError).toBe(
      GitErrors[GitErrorType.MERGE_CONFLICT].message,
    );
  });

  it("should handle authentication failures", async () => {
    server = new MockGitServer();

    // Set up error handler to throw auth error
    server.on("beforeFailure", () => {
      throw GitErrors[GitErrorType.AUTH_FAILED];
    });

    // Force network failure
    server.setNetworkConditions({
      delay: 0,
      failureRate: 1,
      shouldFail: () => true,
    });

    try {
      await server.getCurrentBranch();
      fail("Should have thrown an error");
    } catch (error: unknown) {
      if (!(error instanceof Error)) {
        throw new Error("Expected error to be an Error instance");
      }
      expect(error).toBe(GitErrors[GitErrorType.AUTH_FAILED]);
      expect(error.message).toBe(
        "Authentication failed. Please check your credentials.",
      );
    }
  });
});
