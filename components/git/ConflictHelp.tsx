import React from "react";
import {
  HelpCircle,
  GitBranch,
  GitMerge,
  GitPullRequest,
  AlertCircle,
} from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface HelpTipProps {
  content: React.ReactNode;
  children: React.ReactNode;
}

function HelpTip({ content, children }: HelpTipProps) {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>{children}</TooltipTrigger>
        <TooltipContent>{content}</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

export function ConflictHelp() {
  return (
    <div className="rounded-lg border bg-muted/50 p-4">
      <div className="mb-4 flex items-center space-x-2">
        <HelpCircle className="h-5 w-5 text-muted-foreground" />
        <h3 className="font-medium">Resolving Conflicts</h3>
      </div>

      <div className="space-y-3 text-sm text-muted-foreground">
        <div className="flex items-start space-x-3">
          <AlertCircle className="mt-0.5 h-4 w-4" />
          <p>
            Conflicts occur when changes in your branch conflict with changes in
            another branch. You&apos;ll need to resolve these conflicts before
            merging.
          </p>
        </div>

        <div className="space-y-2">
          <p className="font-medium">Resolution Options:</p>
          <div className="ml-4 space-y-2">
            <HelpTip
              content={
                <p>
                  Keep your local changes and discard the changes from the other
                  branch.
                </p>
              }
            >
              <div className="flex items-center space-x-2">
                <GitBranch className="h-4 w-4" />
                <span>Keep Local</span>
              </div>
            </HelpTip>

            <HelpTip
              content={
                <p>
                  Accept the changes from the other branch and discard your
                  local changes.
                </p>
              }
            >
              <div className="flex items-center space-x-2">
                <GitPullRequest className="h-4 w-4" />
                <span>Accept Remote</span>
              </div>
            </HelpTip>

            <HelpTip
              content={
                <p>
                  Open the file in your editor to manually resolve the conflicts
                  by choosing which parts to keep.
                </p>
              }
            >
              <div className="flex items-center space-x-2">
                <GitMerge className="h-4 w-4" />
                <span>Manual Merge</span>
              </div>
            </HelpTip>
          </div>
        </div>

        <div className="mt-4 rounded border border-yellow-200 bg-yellow-50 p-3 text-yellow-800">
          <p className="font-medium">Pro Tips:</p>
          <ul className="ml-4 mt-2 list-disc space-y-1">
            <li>Review changes carefully before accepting</li>
            <li>Use manual merge for complex conflicts</li>
            <li>Test your changes after resolving conflicts</li>
            <li>Commit and push once all conflicts are resolved</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
