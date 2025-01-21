"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { Task } from "@/lib/tasks";
import {
  getDependencyFilename,
  normalizeDependencyFilename,
} from "@/lib/utils/dependencies";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { updateTaskAction } from "@/lib/actions";
import { Search } from "lucide-react";
import { TagInput } from "@/components/ui/tag-input";
import { TextEditor } from "@/components/ui/text-editor";
import { Checkbox } from "@/components/ui/checkbox";
import { useVirtualizer } from "@tanstack/react-virtual";
import { TaskCategory } from "@/lib/types/tags";

// Only need id and title for the dialog
type EpicSummary = {
  id: string;
  title: string;
};

interface TaskEditDialogTestProps {
  task: Task | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onStateChange?: () => void;
  disabled?: boolean;
  initialTasks?: Task[];
  epics?: EpicSummary[];
}

export function TaskEditDialogTest({
  task,
  open,
  onOpenChange,
  onStateChange,
  disabled: parentDisabled,
  initialTasks = [],
  epics = [],
}: TaskEditDialogTestProps) {
  // Initialize state directly from props
  const [editedTask, setEditedTask] = useState<Task | null>(task);
  const [tags, setTags] = useState<string[]>(task?.tags || []);
  const [dependencySearchQuery, setDependencySearchQuery] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  // Update state when task changes and dialog is open
  useEffect(() => {
    if (open && task) {
      setEditedTask(task);
      setTags(task.tags || []);
    }
  }, [task, open]);

  // Reset state when dialog closes
  useEffect(() => {
    if (!open) {
      setIsSaving(false);
    }
  }, [open]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editedTask || isSaving) return;

    setIsSaving(true);
    try {
      const taskToSave = { ...editedTask, tags };
      await updateTaskAction(editedTask.filename, taskToSave);
      onStateChange?.();
      onOpenChange(false);
    } catch (error) {
      console.error("Failed to save task:", error);
      setIsSaving(false);
    }
  };

  // Prevent any state updates during save
  const updateEditedTask = (updates: Partial<Task>) => {
    if (isSaving) return;
    setEditedTask((prev) => (prev ? { ...prev, ...updates } : null));
  };

  const updateTags = (value: string) => {
    if (isSaving) return;
    setTags(
      value
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean),
    );
  };

  const updateDependencies = (filename: string, checked: boolean) => {
    if (isSaving) return;
    setEditedTask((prev) => {
      if (!prev) return null;
      return {
        ...prev,
        dependencies: checked
          ? [
              ...(prev.dependencies || []),
              normalizeDependencyFilename(filename),
            ]
          : (prev.dependencies || []).filter(
              (d) => d !== normalizeDependencyFilename(filename),
            ),
      };
    });
  };

  // Use tasks from props for filtering
  const filteredDependencyTasks = useMemo(() => {
    return initialTasks
      .filter((t: Task) => {
        if (t.filename === editedTask?.filename) return false;
        const searchLower = dependencySearchQuery.toLowerCase();
        return (
          !dependencySearchQuery ||
          (t.title || "").toLowerCase().includes(searchLower) ||
          (t.ref || "").toLowerCase().includes(searchLower) ||
          (t.content || "").toLowerCase().includes(searchLower)
        );
      })
      .sort((a: Task, b: Task) => {
        if (a.ref && b.ref) return a.ref.localeCompare(b.ref);
        if (a.ref) return -1;
        if (b.ref) return 1;
        return (a.title || "").localeCompare(b.title || "");
      });
  }, [initialTasks, dependencySearchQuery, editedTask?.filename]);

  const parentRef = useRef<HTMLDivElement>(null);
  const rowVirtualizer = useVirtualizer({
    count: filteredDependencyTasks.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 35,
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[85vh] overflow-hidden p-0 flex flex-col z-[100]">
        <DialogHeader className="flex-none p-6 border-b border-zinc-800">
          <DialogTitle>
            {editedTask?.ref && (
              <span className="font-mono text-zinc-400 mr-2">
                {editedTask.ref}
              </span>
            )}
            <span className="font-medium">{editedTask?.title}</span>
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSave} className="flex-1 min-h-0 flex flex-col">
          <div className="flex-1 min-h-0 overflow-y-auto p-6 space-y-6">
            {/* Title */}
            <div className="space-y-2">
              <label
                htmlFor="title"
                className="text-sm font-medium text-zinc-400"
              >
                Title
              </label>
              <input
                id="title"
                value={editedTask?.title || ""}
                onChange={(e) => updateEditedTask({ title: e.target.value })}
                className="w-full px-3 py-2 bg-zinc-900/50 border border-zinc-800 rounded-md text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500/20"
              />
            </div>

            {/* Content */}
            <div className="space-y-2">
              <label
                htmlFor="content"
                className="text-sm font-medium text-zinc-400"
              >
                Content
              </label>
              <TextEditor
                value={editedTask?.content || ""}
                onChange={(value) => updateEditedTask({ content: value })}
                className="min-h-[200px]"
              />
            </div>

            {/* Metadata Grid */}
            <div className="grid grid-cols-4 gap-4">
              {/* Priority */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-zinc-400">
                  Priority
                </label>
                <Select
                  value={editedTask?.priority}
                  onValueChange={(value) =>
                    setEditedTask((prev) =>
                      prev
                        ? { ...prev, priority: value as Task["priority"] }
                        : null,
                    )
                  }
                >
                  <SelectTrigger className="w-full bg-zinc-900/50 border-zinc-800">
                    <SelectValue placeholder="Select a priority" />
                  </SelectTrigger>
                  <SelectContent
                    position="popper"
                    sideOffset={4}
                    className="z-[200] bg-zinc-900 border border-zinc-800"
                  >
                    <SelectItem
                      value="low"
                      className="text-zinc-100 hover:bg-zinc-800 focus:bg-zinc-800"
                    >
                      Low
                    </SelectItem>
                    <SelectItem
                      value="medium"
                      className="text-zinc-100 hover:bg-zinc-800 focus:bg-zinc-800"
                    >
                      Medium
                    </SelectItem>
                    <SelectItem
                      value="high"
                      className="text-zinc-100 hover:bg-zinc-800 focus:bg-zinc-800"
                    >
                      High
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Status */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-zinc-400">
                  Status
                </label>
                <Select
                  value={editedTask?.status}
                  onValueChange={(value) =>
                    setEditedTask((prev) =>
                      prev
                        ? { ...prev, status: value as Task["status"] }
                        : null,
                    )
                  }
                >
                  <SelectTrigger className="w-full bg-zinc-900/50 border-zinc-800">
                    <SelectValue placeholder="Select a status" />
                  </SelectTrigger>
                  <SelectContent
                    position="popper"
                    sideOffset={4}
                    className="z-[200] bg-zinc-900 border border-zinc-800"
                  >
                    <SelectItem
                      value="todo"
                      className="text-zinc-100 hover:bg-zinc-800 focus:bg-zinc-800"
                    >
                      Todo
                    </SelectItem>
                    <SelectItem
                      value="in-progress"
                      className="text-zinc-100 hover:bg-zinc-800 focus:bg-zinc-800"
                    >
                      In Progress
                    </SelectItem>
                    <SelectItem
                      value="done"
                      className="text-zinc-100 hover:bg-zinc-800 focus:bg-zinc-800"
                    >
                      Done
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Category */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-zinc-400">
                  Category
                </label>
                <Select
                  value={editedTask?.category}
                  onValueChange={(value) =>
                    setEditedTask((prev) =>
                      prev
                        ? { ...prev, category: value as TaskCategory }
                        : null,
                    )
                  }
                  required
                >
                  <SelectTrigger className="w-full bg-zinc-900/50 border-zinc-800">
                    <SelectValue placeholder="Select a category" />
                  </SelectTrigger>
                  <SelectContent
                    position="popper"
                    sideOffset={4}
                    className="z-[200] bg-zinc-900 border border-zinc-800"
                  >
                    <SelectItem
                      value={TaskCategory.CHORE}
                      className="text-zinc-100 hover:bg-zinc-800 focus:bg-zinc-800"
                    >
                      Chore
                    </SelectItem>
                    <SelectItem
                      value={TaskCategory.BUG}
                      className="text-zinc-100 hover:bg-zinc-800 focus:bg-zinc-800"
                    >
                      Bug
                    </SelectItem>
                    <SelectItem
                      value={TaskCategory.FEATURE}
                      className="text-zinc-100 hover:bg-zinc-800 focus:bg-zinc-800"
                    >
                      Feature
                    </SelectItem>
                    <SelectItem
                      value={TaskCategory.ITERATION}
                      className="text-zinc-100 hover:bg-zinc-800 focus:bg-zinc-800"
                    >
                      Iteration
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Complexity */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-zinc-400">
                  Complexity
                </label>
                <Select
                  value={editedTask?.complexity}
                  onValueChange={(value) =>
                    setEditedTask((prev) =>
                      prev
                        ? { ...prev, complexity: value as Task["complexity"] }
                        : null,
                    )
                  }
                >
                  <SelectTrigger className="w-full bg-zinc-900/50 border-zinc-800">
                    <SelectValue placeholder="Select complexity" />
                  </SelectTrigger>
                  <SelectContent
                    position="popper"
                    sideOffset={4}
                    className="z-[200] bg-zinc-900 border border-zinc-800"
                  >
                    <SelectItem
                      value="XS"
                      className="text-zinc-100 hover:bg-zinc-800 focus:bg-zinc-800"
                    >
                      XS
                    </SelectItem>
                    <SelectItem
                      value="S"
                      className="text-zinc-100 hover:bg-zinc-800 focus:bg-zinc-800"
                    >
                      S
                    </SelectItem>
                    <SelectItem
                      value="M"
                      className="text-zinc-100 hover:bg-zinc-800 focus:bg-zinc-800"
                    >
                      M
                    </SelectItem>
                    <SelectItem
                      value="L"
                      className="text-zinc-100 hover:bg-zinc-800 focus:bg-zinc-800"
                    >
                      L
                    </SelectItem>
                    <SelectItem
                      value="XL"
                      className="text-zinc-100 hover:bg-zinc-800 focus:bg-zinc-800"
                    >
                      XL
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Epic */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-400">Epic</label>
              <Select
                value={editedTask?.epic || "none"}
                onValueChange={(value) =>
                  updateEditedTask({
                    epic: value === "none" ? undefined : value,
                  })
                }
              >
                <SelectTrigger
                  className="w-full bg-zinc-900/50 border-zinc-800 text-zinc-100 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500/20"
                  onClick={(e) => e.stopPropagation()}
                >
                  <SelectValue placeholder="Select an epic" />
                </SelectTrigger>
                <SelectContent
                  className="z-[200] bg-zinc-900 border border-zinc-800"
                  position="popper"
                  sideOffset={4}
                >
                  <SelectItem
                    value="none"
                    className="text-zinc-100 hover:bg-zinc-800 focus:bg-zinc-800"
                  >
                    None
                  </SelectItem>
                  {epics.map((epic) => (
                    <SelectItem
                      key={epic.id}
                      value={epic.id}
                      className="text-zinc-100 hover:bg-zinc-800 focus:bg-zinc-800"
                    >
                      {epic.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Tags */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-400">Tags</label>
              <TagInput selectedTags={tags} onTagsChange={setTags} />
            </div>

            {/* Dependencies */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-400">
                Dependencies
              </label>
              <div className="relative">
                <div className="flex items-center px-3 py-1.5 bg-zinc-900/50 border border-zinc-800 rounded-md mb-2">
                  <Search className="w-4 h-4 text-zinc-400 mr-2" />
                  <input
                    type="text"
                    value={dependencySearchQuery}
                    onChange={(e) => setDependencySearchQuery(e.target.value)}
                    placeholder="Search tasks by reference, title, or content..."
                    className="flex-1 bg-transparent outline-none text-sm text-zinc-100 placeholder:text-zinc-500"
                  />
                </div>
                <div className="border border-zinc-800 rounded-md bg-zinc-900/50">
                  {filteredDependencyTasks.length === 0 ? (
                    <div className="p-3 text-sm text-zinc-500 text-center">
                      No tasks found
                    </div>
                  ) : (
                    <div className="h-48 overflow-auto">
                      <div
                        ref={parentRef}
                        className="relative w-full"
                        style={{
                          height: `${rowVirtualizer.getTotalSize()}px`,
                        }}
                      >
                        {rowVirtualizer.getVirtualItems().map((virtualRow) => {
                          const task =
                            filteredDependencyTasks[virtualRow.index];
                          return (
                            <div
                              key={task.filename}
                              className="flex items-center gap-3 p-2 hover:bg-zinc-800/50 absolute top-0 left-0 w-full"
                              style={{
                                height: `${virtualRow.size}px`,
                                transform: `translateY(${virtualRow.start}px)`,
                              }}
                            >
                              <Checkbox
                                id={`dep-${task.filename}`}
                                checked={editedTask?.dependencies?.includes(
                                  normalizeDependencyFilename(task.filename),
                                )}
                                onCheckedChange={(checked) =>
                                  updateDependencies(task.filename, !!checked)
                                }
                                className="border-zinc-700 data-[state=checked]:bg-blue-500 data-[state=checked]:border-blue-500"
                              />
                              <label
                                htmlFor={`dep-${task.filename}`}
                                className="flex-1 text-sm cursor-pointer truncate text-zinc-100"
                              >
                                {task.ref && (
                                  <span className="font-mono text-zinc-400 mr-2">
                                    {task.ref}
                                  </span>
                                )}
                                <span className="font-medium">
                                  {task.title}
                                </span>
                                {task.epic && (
                                  <span className="ml-2 text-zinc-400">
                                    in {task.epic}
                                  </span>
                                )}
                              </label>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="flex-none p-4 border-t border-zinc-800 flex justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="bg-zinc-900/50 border-zinc-800 text-zinc-100 hover:bg-zinc-800/50"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSaving}
              className="bg-blue-500 hover:bg-blue-600"
            >
              {isSaving ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
