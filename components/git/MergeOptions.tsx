import React from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { GitBranch, GitMerge, GitPullRequest } from "lucide-react";

interface MergeOptionsProps {
  onResolve: (resolution: "local" | "remote" | "manual") => Promise<void>;
  isResolving: boolean;
}

export function MergeOptions({ onResolve, isResolving }: MergeOptionsProps) {
  return (
    <Card className="p-4">
      <h3 className="mb-4 text-sm font-medium">Resolution Options</h3>
      <div className="grid grid-cols-3 gap-4">
        <Button
          variant="outline"
          className="flex flex-col items-center space-y-2 p-4"
          onClick={() => onResolve("local")}
          disabled={isResolving}
        >
          <GitBranch className="h-6 w-6" />
          <span className="text-sm">Keep Local</span>
          <span className="text-xs text-muted-foreground">
            Use your local changes
          </span>
        </Button>
        <Button
          variant="outline"
          className="flex flex-col items-center space-y-2 p-4"
          onClick={() => onResolve("remote")}
          disabled={isResolving}
        >
          <GitPullRequest className="h-6 w-6" />
          <span className="text-sm">Accept Remote</span>
          <span className="text-xs text-muted-foreground">
            Use remote changes
          </span>
        </Button>
        <Button
          variant="default"
          className="flex flex-col items-center space-y-2 p-4"
          onClick={() => onResolve("manual")}
          disabled={isResolving}
        >
          <GitMerge className="h-6 w-6" />
          <span className="text-sm">Manual Merge</span>
          <span className="text-xs text-muted-foreground">
            Resolve conflicts manually
          </span>
        </Button>
      </div>
    </Card>
  );
}
