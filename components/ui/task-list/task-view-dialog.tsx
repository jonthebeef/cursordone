"use client";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Pencil, Trash2 } from "lucide-react";
import type { Task } from "@/lib/tasks";
import { Badge } from "../badge";
import { format } from "date-fns";
import { normalizeDependencyFilename } from "@/lib/utils/dependencies";
import { MarkdownPreview } from "@/components/ui/markdown-preview";

interface TaskViewDialogProps {
  task: Task | null;
  initialTasks: Task[];
  allTasks: Task[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEdit?: () => void;
  onDelete?: (filename: string) => void;
  setSelectedTask: (task: Task | null) => void;
}

export function TaskViewDialog({
  task,
  initialTasks,
  allTasks,
  open,
  onOpenChange,
  onEdit,
  onDelete,
  setSelectedTask,
}: TaskViewDialogProps) {
  if (!task) return null;

  const missingDependencies =
    task.dependencies?.filter((dep) => {
      const normalizedDep = dep.replace(".md", "");
      return !allTasks.some(
        (t) => t.filename.replace(".md", "") === normalizedDep,
      );
    }) || [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] flex flex-col p-0">
        <DialogHeader className="border-b py-6 px-6">
          <DialogTitle className="flex items-center">
            {task.ref && (
              <span className="font-mono text-zinc-400 mr-2">{task.ref}</span>
            )}
            <span className="font-medium">{task.title}</span>
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-6">
          {/* Metadata Grid */}
          <div className="rounded-lg border bg-muted/40 p-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <div className="font-medium mb-1 text-muted-foreground">
                  Status
                </div>
                <Badge variant="outline">{task.status}</Badge>
              </div>
              <div>
                <div className="font-medium mb-1 text-muted-foreground">
                  Priority
                </div>
                <Badge variant="outline">{task.priority}</Badge>
              </div>
              <div>
                <div className="font-medium mb-1 text-muted-foreground">
                  Category
                </div>
                <Badge variant="outline">{task.category}</Badge>
              </div>
              <div>
                <div className="font-medium mb-1 text-muted-foreground">
                  Complexity
                </div>
                <Badge variant="outline">{task.complexity}</Badge>
              </div>
              {task.epic && (
                <div>
                  <div className="font-medium mb-1 text-muted-foreground">
                    Epic
                  </div>
                  <Badge variant="outline">{task.epic}</Badge>
                </div>
              )}
              <div>
                <div className="font-medium mb-1 text-muted-foreground">
                  Owner
                </div>
                <Badge variant="outline">{task.owner}</Badge>
              </div>
              <div>
                <div className="font-medium mb-1 text-muted-foreground">
                  Created
                </div>
                <span className="text-muted-foreground">
                  {format(new Date(task.created), "MMMM do, yyyy")}
                </span>
              </div>
            </div>

            {/* Tags */}
            {task.tags && task.tags.length > 0 && (
              <div className="mt-4">
                <div className="font-medium mb-2 text-muted-foreground">
                  Tags
                </div>
                <div className="flex flex-wrap gap-2">
                  {task.tags.map((tag) => (
                    <Badge key={tag} variant="secondary">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Content */}
          <div>
            <MarkdownPreview
              content={task.content?.replace(/\r\n/g, "\n") || ""}
            />
          </div>

          {/* Dependencies */}
          {task.dependencies &&
            (task.dependencies.length > 0 ||
              missingDependencies.length > 0) && (
              <div className="rounded-lg border bg-muted/40 p-4">
                <div className="font-medium mb-2">Dependencies</div>
                <div className="space-y-2">
                  {task.dependencies.map((dep) => {
                    const depTask = allTasks.find(
                      (t) =>
                        t.filename.replace(".md", "") ===
                        dep.replace(".md", ""),
                    );
                    return (
                      <div key={dep} className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          className="p-0 h-auto hover:bg-transparent"
                          onClick={() => {
                            const foundTask = allTasks.find(
                              (t) =>
                                t.filename.replace(".md", "") ===
                                dep.replace(".md", ""),
                            );
                            if (foundTask) {
                              setSelectedTask(foundTask);
                            }
                          }}
                          disabled={!depTask}
                        >
                          <div className="flex items-center gap-2 text-base">
                            <Badge
                              variant={depTask ? "outline" : "destructive"}
                              className="text-base"
                            >
                              {depTask?.ref || dep}
                            </Badge>
                            {depTask && (
                              <span className="text-base text-muted-foreground hover:text-foreground">
                                {depTask.title}
                              </span>
                            )}
                          </div>
                        </Button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
        </div>

        <div className="border-t p-6 flex justify-between items-center">
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="destructive"
                className="gap-2"
                disabled={!onDelete}
              >
                <Trash2 className="h-4 w-4" />
                Delete
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>
                  Are you sure you want to delete this task?
                </AlertDialogTitle>
                <AlertDialogDescription>
                  Deleting this task removes the file from your local system.
                  You may be able to retrieve it if you have committed your
                  project recently to git. If not, it will be gone forever.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => onDelete && onDelete(task.filename)}
                  className="bg-red-600 text-white hover:bg-red-700"
                >
                  Delete task
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          <Button className="gap-2" onClick={onEdit} disabled={!onEdit}>
            <Pencil className="h-4 w-4" />
            Edit Task
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
