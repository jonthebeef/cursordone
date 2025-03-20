import React, { useEffect, useState } from "react";
import { GitSyncStatus, SyncState } from "@/lib/git-sync-manager";
import { useSettings } from "@/lib/hooks/use-settings";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
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
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface GitSyncStatusComponentProps {
  status: GitSyncStatus | null;
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
  const [showErrorDialog, setShowErrorDialog] = useState(false);

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
      setShowErrorDialog(true);
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
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 px-2"
              onClick={onOpenSettings}
            >
              <GitCompare className="h-4 w-4 text-gray-400" />
              <span className="ml-2 text-xs">Git Sync Disabled</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Git sync is disabled. Click to open settings.</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return (
    <>
      <div className="flex items-center">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
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
                  <Badge
                    variant="outline"
                    className="bg-amber-100 text-amber-800 h-5 text-[10px]"
                  >
                    {status.pendingChanges}
                  </Badge>
                )}

                {status?.lastSync && (
                  <span className="text-xs text-muted-foreground hidden md:inline">
                    <Clock className="inline mr-1 h-3 w-3" />
                    {formatLastSync(status.lastSync)}
                  </span>
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              {status?.lastSync ? (
                <div className="space-y-2 max-w-xs">
                  <p>Last synchronized: {status.lastSync.toLocaleString()}</p>

                  {status.pendingChanges > 0 && (
                    <p>Pending changes: {status.pendingChanges} files</p>
                  )}

                  {status.state === SyncState.IDLE && (
                    <p>Click to synchronize now</p>
                  )}

                  {status.state === SyncState.CONFLICT && (
                    <p className="text-yellow-500">
                      Git conflicts detected. Please resolve manually.
                    </p>
                  )}

                  {status.state === SyncState.ERROR && (
                    <p className="text-red-500">
                      {status.error?.message || "An error occurred"}
                    </p>
                  )}
                </div>
              ) : (
                <p>Git synchronization not yet performed</p>
              )}
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

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

      {/* Error Dialog */}
      <AlertDialog open={showErrorDialog} onOpenChange={setShowErrorDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Synchronization Error</AlertDialogTitle>
            <AlertDialogDescription>
              {status?.error ? (
                <div className="space-y-2">
                  <p>An error occurred during Git synchronization:</p>
                  <p className="font-mono text-sm bg-gray-100 dark:bg-gray-800 p-2 rounded overflow-auto">
                    {status.error.message}
                  </p>
                </div>
              ) : (
                <p>An unknown error occurred during Git synchronization.</p>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Close</AlertDialogCancel>
            <AlertDialogAction onClick={onOpenSettings}>
              Open Settings
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
