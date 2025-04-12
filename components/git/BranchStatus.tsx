"use client";

import React, { useEffect, useState } from "react";
import {
  BranchManager,
  BranchStatus,
  BranchSyncConfig,
} from "@/lib/git/branch";
import {
  GitBranch,
  RefreshCw,
  AlertTriangle,
  Check,
  Clock,
} from "lucide-react";
import { RetryStatus } from "@/lib/git/retry";
import type { BranchStatus as BranchStatusType } from "../../tests/git/branch";

interface BranchStatusProps {
  status: BranchStatusType;
  onSwitchBranch?: () => void;
  onSync?: () => void;
  className?: string;
}

export function BranchStatus({
  status,
  onSwitchBranch,
  onSync,
  className = "",
}: BranchStatusProps) {
  const { name, current, ahead, behind, hasConflicts, lastSync, protection } =
    status;

  const needsSync = ahead > 0 || behind > 0;
  const lastSyncTime = lastSync ? new Date(lastSync).toLocaleString() : "Never";

  return (
    <div
      className={`flex flex-col p-4 rounded-lg border ${hasConflicts ? "border-red-500" : "border-gray-200"} ${className}`}
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="font-semibold">{name}</span>
          {current && (
            <span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded">
              Current
            </span>
          )}
          {hasConflicts && (
            <span className="px-2 py-1 text-xs bg-red-100 text-red-800 rounded">
              Conflicts
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {!current && onSwitchBranch && (
            <button
              onClick={onSwitchBranch}
              className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded"
            >
              Switch
            </button>
          )}
          {onSync && needsSync && (
            <button
              onClick={onSync}
              className="px-3 py-1 text-sm bg-blue-500 hover:bg-blue-600 text-white rounded"
            >
              Sync
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 text-sm">
        <div>
          <div className="text-gray-500">Status</div>
          <div className="flex items-center gap-2 mt-1">
            {ahead > 0 && (
              <span className="px-2 py-1 bg-green-100 text-green-800 rounded">
                {ahead} ahead
              </span>
            )}
            {behind > 0 && (
              <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded">
                {behind} behind
              </span>
            )}
            {!needsSync && (
              <span className="px-2 py-1 bg-gray-100 text-gray-800 rounded">
                Up to date
              </span>
            )}
          </div>
        </div>

        <div>
          <div className="text-gray-500">Last Sync</div>
          <div className="mt-1">{lastSyncTime}</div>
        </div>

        <div>
          <div className="text-gray-500">Protection</div>
          <div className="flex flex-wrap gap-1 mt-1">
            {protection.requirePullBeforePush && (
              <span className="px-2 py-1 text-xs bg-purple-100 text-purple-800 rounded">
                Pull First
              </span>
            )}
            {protection.preventForcePush && (
              <span className="px-2 py-1 text-xs bg-purple-100 text-purple-800 rounded">
                No Force Push
              </span>
            )}
          </div>
        </div>

        {protection.requireSync && (
          <div>
            <div className="text-gray-500">Sync Interval</div>
            <div className="mt-1">
              {protection.syncInterval
                ? `${protection.syncInterval / 1000}s`
                : "Manual"}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

interface BranchStatusComponentProps {
  className?: string;
}

export function BranchStatusComponent({
  className = "",
}: BranchStatusComponentProps) {
  const [branchManager] = useState(() => new BranchManager());
  const [branches, setBranches] = useState<Map<string, BranchStatus>>(
    new Map(),
  );
  const [activeBranch, setActiveBranch] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryStatus, setRetryStatus] = useState<RetryStatus | null>(null);

  useEffect(() => {
    const initialize = async () => {
      try {
        await branchManager.initialize();
        setBranches(branchManager.getBranchStatuses());
        setActiveBranch(branchManager.getActiveBranch());
        setIsLoading(false);
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Failed to initialize branch manager",
        );
        setIsLoading(false);
      }
    };

    initialize();

    // Listen for branch changes
    branchManager.on("branchChanged", (branch: string) => {
      setActiveBranch(branch);
      setBranches(branchManager.getBranchStatuses());
    });

    // Listen for status updates
    branchManager.on(
      "statusesUpdated",
      (newBranches: Map<string, BranchStatus>) => {
        setBranches(new Map(newBranches));
      },
    );

    // Listen for retry events
    branchManager.on("operationRetrying", (status: RetryStatus) => {
      setRetryStatus(status);
      setError(`Retrying ${status.operation} (Attempt ${status.attempt})`);
    });

    return () => {
      branchManager.removeAllListeners();
    };
  }, [branchManager]);

  const handleBranchSwitch = async (branchName: string) => {
    try {
      setIsLoading(true);
      setError(null);
      setRetryStatus(null);
      await branchManager.switchBranch(branchName);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to switch branch");
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className={`flex items-center space-x-2 ${className}`}>
        <RefreshCw className="animate-spin h-4 w-4" />
        <span>Loading branches...</span>
      </div>
    );
  }

  return (
    <div className={className}>
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <GitBranch className="h-5 w-5" />
          <h3 className="text-lg font-semibold">Git Branches</h3>
        </div>

        {error && (
          <div className="flex items-center space-x-2 text-yellow-500">
            {retryStatus ? (
              <>
                <Clock className="h-4 w-4 animate-pulse" />
                <span>
                  Retrying... (Attempt {retryStatus.attempt})
                  {retryStatus.nextRetry && (
                    <span className="ml-1 text-xs">
                      Next: {formatRetryTime(retryStatus.nextRetry)}
                    </span>
                  )}
                </span>
              </>
            ) : (
              <>
                <AlertTriangle className="h-4 w-4" />
                <span>{error}</span>
              </>
            )}
          </div>
        )}
      </div>

      <div className="space-y-2">
        {Array.from(branches.values()).map((branch) => (
          <div
            key={branch.name}
            className={`flex items-center justify-between p-2 rounded ${
              branch.isActive
                ? "bg-blue-500 bg-opacity-20"
                : "hover:bg-zinc-700 cursor-pointer"
            } ${
              retryStatus?.operation === `switchBranch-${branch.name}`
                ? "border border-yellow-500"
                : ""
            }`}
            onClick={() => !branch.isActive && handleBranchSwitch(branch.name)}
          >
            <div className="flex items-center space-x-2">
              <GitBranch className="h-4 w-4" />
              <span>{branch.name}</span>
              {branch.isActive && (
                <span className="text-xs bg-blue-500 px-1.5 py-0.5 rounded">
                  active
                </span>
              )}
            </div>

            <div className="flex items-center space-x-4 text-sm">
              {branch.hasConflicts && (
                <span className="text-red-400 flex items-center space-x-1">
                  <AlertTriangle className="h-4 w-4" />
                  <span>Conflicts</span>
                </span>
              )}

              {(branch.ahead > 0 || branch.behind > 0) && (
                <div className="space-x-2">
                  {branch.ahead > 0 && (
                    <span className="text-green-400">↑{branch.ahead}</span>
                  )}
                  {branch.behind > 0 && (
                    <span className="text-yellow-400">↓{branch.behind}</span>
                  )}
                </div>
              )}

              {branch.lastSync && (
                <span
                  className="text-zinc-400"
                  title={new Date(branch.lastSync).toLocaleString()}
                >
                  {formatLastSync(branch.lastSync)}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function formatLastSync(date: Date | null): string {
  if (!date) return "Never";

  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) return `${days}d ago`;
  if (hours > 0) return `${hours}h ago`;
  if (minutes > 0) return `${minutes}m ago`;
  return "Just now";
}

function formatRetryTime(date: Date): string {
  const diff = date.getTime() - Date.now();
  const seconds = Math.ceil(diff / 1000);
  return `${seconds}s`;
}
