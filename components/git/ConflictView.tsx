import React from "react";
import { useGitSync } from "@/lib/hooks/use-git-sync";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { AlertCircle, Check, GitBranch, RefreshCw } from "lucide-react";
import { DiffViewer } from "./DiffViewer";
import { MergeOptions } from "./MergeOptions";

interface ConflictFile {
  path: string;
  status: "conflict" | "modified" | "deleted";
  localChanges: string;
  remoteChanges: string;
}

interface ConflictViewProps {
  onResolve: (
    file: ConflictFile,
    resolution: "local" | "remote" | "manual",
  ) => Promise<void>;
  onRefresh: () => Promise<void>;
}

export function ConflictView({ onResolve, onRefresh }: ConflictViewProps) {
  const { status } = useGitSync();
  const [selectedFile, setSelectedFile] = React.useState<ConflictFile | null>(
    null,
  );
  const [isResolving, setIsResolving] = React.useState(false);
  const [isRefreshing, setIsRefreshing] = React.useState(false);

  // Extract conflicted files from git status
  const conflictedFiles: ConflictFile[] = React.useMemo(() => {
    if (!status?.gitStatus?.conflicted) return [];
    return status.gitStatus.conflicted.map((path) => ({
      path,
      status: "conflict",
      localChanges: "", // Will be populated when file is selected
      remoteChanges: "", // Will be populated when file is selected
    }));
  }, [status?.gitStatus?.conflicted]);

  const handleFileSelect = async (file: ConflictFile) => {
    // TODO: Load file contents and diffs
    setSelectedFile(file);
  };

  const handleResolve = async (resolution: "local" | "remote" | "manual") => {
    if (!selectedFile) return;
    setIsResolving(true);
    try {
      await onResolve(selectedFile, resolution);
      setSelectedFile(null);
    } catch (error) {
      console.error("Failed to resolve conflict:", error);
    } finally {
      setIsResolving(false);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await onRefresh();
    } finally {
      setIsRefreshing(false);
    }
  };

  if (!conflictedFiles.length) {
    return (
      <Card className="p-4 text-center text-muted-foreground">
        <Check className="mx-auto h-8 w-8 text-green-500" />
        <p className="mt-2">No conflicts detected</p>
        <Button
          variant="outline"
          size="sm"
          className="mt-4"
          onClick={handleRefresh}
          disabled={isRefreshing}
        >
          <RefreshCw
            className={`mr-2 h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`}
          />
          Check for conflicts
        </Button>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <AlertCircle className="h-5 w-5 text-yellow-500" />
          <h2 className="text-lg font-semibold">Merge Conflicts</h2>
          <Badge variant="warning">{conflictedFiles.length}</Badge>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleRefresh}
          disabled={isRefreshing}
        >
          <RefreshCw
            className={`mr-2 h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`}
          />
          Refresh
        </Button>
      </div>

      <div className="grid grid-cols-[300px_1fr] gap-4">
        <ScrollArea className="h-[600px] rounded-md border">
          <div className="space-y-1 p-2">
            {conflictedFiles.map((file) => (
              <button
                key={file.path}
                onClick={() => handleFileSelect(file)}
                className={`w-full rounded-lg p-2 text-left hover:bg-accent ${
                  selectedFile?.path === file.path ? "bg-accent" : ""
                }`}
              >
                <div className="flex items-center space-x-2">
                  <GitBranch className="h-4 w-4" />
                  <span className="flex-1 truncate font-mono text-sm">
                    {file.path}
                  </span>
                </div>
              </button>
            ))}
          </div>
        </ScrollArea>

        {selectedFile && (
          <div className="space-y-4">
            <DiffViewer
              fileName={selectedFile.path}
              localContent={selectedFile.localChanges}
              remoteContent={selectedFile.remoteChanges}
            />
            <MergeOptions onResolve={handleResolve} isResolving={isResolving} />
          </div>
        )}
      </div>
    </div>
  );
}
