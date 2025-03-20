"use client";

import React, { useState } from "react";
import {
  GitSyncStatus as GitSyncStatusType,
  SyncState,
} from "@/lib/git-sync-manager";
import { useSettings } from "@/lib/hooks/use-settings";
import {
  CheckCircle2,
  GitCompare,
  AlertCircle,
  RefreshCw,
  Clock,
  Upload,
  Download,
  Settings,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface GitSyncStatusComponentProps {
  status: GitSyncStatusType | null;
  onSyncNow: () => Promise<void>;
  onOpenSettings: () => void;
}

export function GitSyncStatusComponent({
  status,
  onSyncNow,
  onOpenSettings,
}: GitSyncStatusComponentProps) {
  const { settings } = useSettings();
  const [isSyncing, setIsSyncing] = useState(false);

  // Format last sync time
  const formatLastSync = (date: Date | null) => {
    if (!date) return "Never";

    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return "Just now";
    if (diffMins === 1) return "1 minute ago";
    if (diffMins < 60) return `${diffMins} minutes ago`;

    const diffHours = Math.floor(diffMins / 60);
    if (diffHours === 1) return "1 hour ago";
    if (diffHours < 24) return `${diffHours} hours ago`;

    const diffDays = Math.floor(diffHours / 24);
    if (diffDays === 1) return "1 day ago";
    return `${diffDays} days ago`;
  };

  // Handle sync button click
  const handleSyncNow = async () => {
    if (isSyncing) return;

    setIsSyncing(true);
    try {
      await onSyncNow();
    } catch (error) {
      console.error("Sync failed:", error);
    } finally {
      setIsSyncing(false);
    }
  };

  // State icon and color
  const getStateIcon = () => {
    if (!status) return <Settings className="h-4 w-4 text-gray-400" />;

    switch (status.state) {
      case SyncState.IDLE:
        return status.lastSync ? (
          <CheckCircle2 className="h-4 w-4 text-green-500" />
        ) : (
          <GitCompare className="h-4 w-4 text-blue-500" />
        );
      case SyncState.PULLING:
        return <Download className="h-4 w-4 text-blue-500 animate-pulse" />;
      case SyncState.PUSHING:
        return <Upload className="h-4 w-4 text-blue-500 animate-pulse" />;
      case SyncState.COMMITTING:
        return <RefreshCw className="h-4 w-4 text-blue-500 animate-spin" />;
      case SyncState.CONFLICT:
        return <AlertCircle className="h-4 w-4 text-yellow-500" />;
      case SyncState.ERROR:
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      case SyncState.NOT_CONFIGURED:
        return <Settings className="h-4 w-4 text-gray-400" />;
      default:
        return <GitCompare className="h-4 w-4 text-gray-400" />;
    }
  };

  // State label
  const getStateLabel = () => {
    if (!status) return "Not Initialized";

    switch (status.state) {
      case SyncState.IDLE:
        return "Synced";
      case SyncState.PULLING:
        return "Pulling";
      case SyncState.PUSHING:
        return "Pushing";
      case SyncState.COMMITTING:
        return "Committing";
      case SyncState.CONFLICT:
        return "Conflicts";
      case SyncState.ERROR:
        return "Error";
      case SyncState.NOT_CONFIGURED:
        return "Not Configured";
      default:
        return "Unknown";
    }
  };

  // If Git sync is disabled, return minimal UI
  if (!settings?.gitSync?.enabled) {
    return (
      <div className="flex items-center">
        <Button
          variant="ghost"
          size="sm"
          className="h-8 px-2"
          onClick={onOpenSettings}
        >
          <GitCompare className="h-4 w-4 text-gray-400" />
          <span className="ml-2 text-xs">Git Sync Disabled</span>
        </Button>
      </div>
    );
  }

  return (
    <div className="flex items-center">
      <Button
        variant="ghost"
        size="sm"
        className={cn(
          "h-8 gap-2 px-2",
          status?.pendingChanges && status.pendingChanges > 0
            ? "text-amber-500"
            : "",
        )}
        onClick={handleSyncNow}
        disabled={isSyncing || status?.state !== SyncState.IDLE}
      >
        {getStateIcon()}
        <span className="text-xs">{getStateLabel()}</span>

        {status?.pendingChanges && status.pendingChanges > 0 && (
          <span className="bg-amber-100 text-amber-800 rounded-full text-[10px] px-1.5 py-0.5">
            {status.pendingChanges}
          </span>
        )}

        {status?.lastSync && (
          <span className="text-xs text-muted-foreground hidden md:inline">
            <Clock className="inline mr-1 h-3 w-3" />
            {formatLastSync(status.lastSync)}
          </span>
        )}
      </Button>

      <Button
        variant="ghost"
        size="sm"
        className="h-8 w-8 p-0"
        onClick={onOpenSettings}
      >
        <Settings className="h-4 w-4" />
        <span className="sr-only">Git Sync Settings</span>
      </Button>
    </div>
  );
}

// Also export the component as default for dynamic imports
export default { GitSyncStatusComponent };
