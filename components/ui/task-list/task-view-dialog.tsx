"use client";

import { Task } from "@/lib/tasks";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { format } from "date-fns";
import { MarkdownPreview } from "@/components/ui/markdown-preview";

interface TaskViewDialogProps {
  task: Task | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEdit?: () => void;
  epics: { id: string; title: string }[];
  initialTasks: Task[];
  disabled?: boolean;
}

export function TaskViewDialog({
  task,
  open,
  onOpenChange,
  onEdit,
  epics,
  initialTasks,
  disabled,
}: TaskViewDialogProps) {
  if (!task) return null;

  const epic = epics.find((e) => e.id === task.epic);
  const dependencies = task.dependencies?.map((ref) =>
    initialTasks.find((t) => t.ref === ref),
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle className="sr-only">View Task</DialogTitle>
        </DialogHeader>
        <div className="space-y-6">
          <div className="grid grid-cols-3 gap-4">
            {/* Left Column - Main Content */}
            <div className="col-span-2 space-y-4">
              <div>
                <h2 className="text-2xl font-semibold text-zinc-100">
                  {task.title}
                </h2>
                <div className="mt-1 text-sm font-mono text-zinc-400">
                  {task.ref}
                </div>
              </div>

              <div className="prose prose-invert max-w-none">
                <MarkdownPreview content={task.content || ""} />
              </div>
            </div>

            {/* Right Column - Metadata */}
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-medium text-zinc-400">Status</h3>
                <div className="mt-1">
                  <Badge
                    className={cn(
                      "capitalize",
                      task.status === "todo"
                        ? "bg-zinc-500/20 text-zinc-300 hover:bg-zinc-500/30"
                        : task.status === "in-progress"
                          ? "bg-blue-500/20 text-blue-300 hover:bg-blue-500/30"
                          : "bg-green-500/20 text-green-300 hover:bg-green-500/30",
                    )}
                  >
                    {task.status.replace("-", " ")}
                  </Badge>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-medium text-zinc-400">Priority</h3>
                <div className="mt-1">
                  <Badge
                    className={cn(
                      "capitalize",
                      task.priority === "low"
                        ? "bg-zinc-500/20 text-zinc-300 hover:bg-zinc-500/30"
                        : task.priority === "medium"
                          ? "bg-yellow-500/20 text-yellow-300 hover:bg-yellow-500/30"
                          : "bg-red-500/20 text-red-300 hover:bg-red-500/30",
                    )}
                  >
                    {task.priority}
                  </Badge>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-medium text-zinc-400">
                  Complexity
                </h3>
                <div className="mt-1">
                  <Badge
                    className={cn(
                      task.complexity === "XS" || task.complexity === "S"
                        ? "bg-green-500/20 text-green-300 hover:bg-green-500/30"
                        : task.complexity === "M"
                          ? "bg-yellow-500/20 text-yellow-300 hover:bg-yellow-500/30"
                          : "bg-red-500/20 text-red-300 hover:bg-red-500/30",
                    )}
                  >
                    {task.complexity}
                  </Badge>
                </div>
              </div>

              {epic && (
                <div>
                  <h3 className="text-sm font-medium text-zinc-400">Epic</h3>
                  <div className="mt-1">
                    <Badge
                      variant="outline"
                      className="border-zinc-800 text-zinc-300 hover:bg-zinc-800/50"
                    >
                      {epic.title}
                    </Badge>
                  </div>
                </div>
              )}

              {task.tags && task.tags.length > 0 && (
                <div>
                  <h3 className="text-sm font-medium text-zinc-400">Tags</h3>
                  <div className="mt-1 flex flex-wrap gap-2">
                    {task.tags.map((tag) => (
                      <Badge
                        key={tag}
                        variant="outline"
                        className="border-zinc-800 text-zinc-300 hover:bg-zinc-800/50"
                      >
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <h3 className="text-sm font-medium text-zinc-400">Created</h3>
                <div className="mt-1 text-sm text-zinc-300">
                  {format(new Date(task.created), "MMM d, yyyy")}
                </div>
              </div>
            </div>
          </div>

          {/* Dependencies Section */}
          {dependencies && dependencies.length > 0 && (
            <div className="pt-4 border-t border-zinc-800">
              <h3 className="text-sm font-medium text-zinc-400 mb-2">
                Dependencies
              </h3>
              <div className="space-y-2">
                {dependencies.map(
                  (dep) =>
                    dep && (
                      <div
                        key={dep.ref}
                        className="flex items-center gap-3 p-2 bg-zinc-900/50 rounded-md border border-zinc-800"
                      >
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-mono text-zinc-400">
                              {dep.ref}
                            </span>
                            <span className="text-sm text-zinc-100 truncate">
                              {dep.title}
                            </span>
                          </div>
                          {dep.epic && (
                            <div className="text-xs text-zinc-500 truncate">
                              {epics.find((e) => e.id === dep.epic)?.title ||
                                dep.epic}
                            </div>
                          )}
                        </div>
                        <Badge
                          className={cn(
                            "capitalize",
                            dep.status === "todo"
                              ? "bg-zinc-500/20 text-zinc-300 hover:bg-zinc-500/30"
                              : dep.status === "in-progress"
                                ? "bg-blue-500/20 text-blue-300 hover:bg-blue-500/30"
                                : "bg-green-500/20 text-green-300 hover:bg-green-500/30",
                          )}
                        >
                          {dep.status.replace("-", " ")}
                        </Badge>
                      </div>
                    ),
                )}
              </div>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-4 mt-2 border-t border-zinc-800">
            <Button
              variant="outline"
              type="button"
              onClick={() => {
                onOpenChange(false);
              }}
              className="bg-zinc-900/50 border-zinc-800 text-zinc-100 hover:bg-zinc-800/50"
            >
              Close
            </Button>
            {onEdit && (
              <Button
                type="button"
                onClick={() => {
                  onEdit();
                  onOpenChange(false);
                }}
                disabled={disabled}
                className="bg-blue-500 text-white hover:bg-blue-600"
              >
                Edit Task
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
