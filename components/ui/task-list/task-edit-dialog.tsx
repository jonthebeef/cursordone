"use client";

import { useState, useEffect } from "react";
import { Task } from "@/lib/tasks";
import { getDependencyFilename, normalizeDependencyFilename } from "@/lib/utils/dependencies";
import { updateTaskAction } from "@/lib/actions";
import { Button } from "@/components/ui/button";
import { Search } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { TagInput } from "@/components/ui/tag-input";
import { SearchInput } from "@/components/ui/search-input";
import { TextEditor } from "@/components/ui/text-editor";
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
import { cn } from "@/lib/utils";

interface TaskEditDialogProps {
  task: Task | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onStateChange?: () => void;
  epics: { id: string; title: string }[];
  initialTasks: Task[];
  disabled?: boolean;
}

export function TaskEditDialog({
  task,
  open,
  onOpenChange,
  onStateChange,
  epics,
  initialTasks,
  disabled,
}: TaskEditDialogProps) {
  const [isSaving, setIsSaving] = useState(false);
  const [dependencySearchQuery, setDependencySearchQuery] = useState("");
  const [editTagInput, setEditTagInput] = useState(
    task?.tags?.join(", ") || "",
  );
  const [editedTask, setEditedTask] = useState<Task | null>(task);

  // Reset state when task changes
  useEffect(() => {
    setEditedTask(task);
    setEditTagInput(task?.tags?.join(", ") || "");
  }, [task]);

  // Filter tasks for dependencies
  const filteredDependencyTasks = initialTasks.filter((t) => {
    if (!dependencySearchQuery) return true;
    const searchLower = dependencySearchQuery.toLowerCase();
    return (
      t.title?.toLowerCase().includes(searchLower) ||
      t.epic?.toLowerCase().includes(searchLower)
    );
  });

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editedTask || !task || disabled || isSaving) return;

    setIsSaving(true);
    try {
      const tags = editTagInput
        .split(",")
        .map((tag) => tag.trim())
        .filter(Boolean);
      const taskToSave = { ...editedTask, tags };
      await updateTaskAction(task.filename, taskToSave);
      onStateChange?.();
      onOpenChange(false);
    } catch (error) {
      console.error("Failed to update task:", error);
    } finally {
      setIsSaving(false);
    }
  };

  if (!task || !editedTask) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle className="sr-only">Edit Task</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSave} className="space-y-6">
          <div className="grid grid-cols-3 gap-4">
            {/* Left Column - Main Content */}
            <div className="col-span-2 space-y-4">
              <div className="space-y-2">
                <label
                  htmlFor="title"
                  className="text-sm font-medium text-zinc-400"
                >
                  Title
                </label>
                <input
                  id="title"
                  type="text"
                  value={editedTask.title}
                  onChange={(e) =>
                    setEditedTask((prev) =>
                      prev ? { ...prev, title: e.target.value } : null,
                    )
                  }
                  className="w-full px-3 py-2 bg-zinc-900/50 border border-zinc-800 rounded-md text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500/20 text-lg"
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-zinc-400">
                  Content
                </label>
                <TextEditor
                  value={editedTask.content || ""}
                  onChange={(value) =>
                    setEditedTask((prev) =>
                      prev ? { ...prev, content: value } : null,
                    )
                  }
                  onImageUpload={async (file) => {
                    const safeFilename = `${Date.now()}-${file.name.replace(
                      /\s+/g,
                      "-",
                    )}`;
                    const formData = new FormData();
                    formData.append("file", file);
                    formData.append("filename", safeFilename);

                    const response = await fetch("/api/upload", {
                      method: "POST",
                      body: formData,
                    });

                    if (!response.ok) {
                      throw new Error("Failed to upload image");
                    }

                    return `/task-images/${safeFilename}`;
                  }}
                  onFileUpload={async (file) => {
                    const safeFilename = `${Date.now()}-${file.name.replace(
                      /\s+/g,
                      "-",
                    )}`;
                    const formData = new FormData();
                    formData.append("file", file);
                    formData.append("filename", safeFilename);

                    const response = await fetch("/api/upload", {
                      method: "POST",
                      body: formData,
                    });

                    if (!response.ok) {
                      throw new Error("Failed to upload file");
                    }

                    return `/task-files/${safeFilename}`;
                  }}
                  className="h-[280px]"
                />
              </div>
            </div>

            {/* Right Column - Metadata */}
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-zinc-400">
                  Priority
                </label>
                <div className="flex gap-2">
                  {(["low", "medium", "high"] as const).map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() =>
                        setEditedTask((prev) =>
                          prev ? { ...prev, priority: p } : null,
                        )
                      }
                      className={cn(
                        "px-3 py-1.5 rounded-md capitalize text-sm flex-1 border",
                        editedTask.priority === p
                          ? "bg-zinc-800 text-zinc-100 border-zinc-700"
                          : "bg-zinc-900/50 text-zinc-400 hover:text-zinc-300 border-zinc-800",
                      )}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-zinc-400">
                  Status
                </label>
                <Select
                  value={editedTask.status}
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
                  <SelectContent>
                    <SelectItem value="todo">Todo</SelectItem>
                    <SelectItem value="in-progress">In Progress</SelectItem>
                    <SelectItem value="done">Done</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-zinc-400">
                  Complexity
                </label>
                <div className="flex gap-2">
                  {[
                    { value: "XS", label: "XS" },
                    { value: "S", label: "S" },
                    { value: "M", label: "M" },
                    { value: "L", label: "L" },
                    { value: "XL", label: "XL" },
                  ].map(({ value }) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() =>
                        setEditedTask((prev) =>
                          prev
                            ? {
                                ...prev,
                                complexity: value as Task["complexity"],
                              }
                            : null,
                        )
                      }
                      className={cn(
                        "px-3 py-1.5 rounded-md text-sm flex-1 border",
                        editedTask.complexity === value
                          ? "bg-zinc-800 text-zinc-100 border-zinc-700"
                          : "bg-zinc-900/50 text-zinc-400 hover:text-zinc-300 border-zinc-800",
                      )}
                    >
                      {value}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <label
                  htmlFor="epic"
                  className="text-sm font-medium text-zinc-400"
                >
                  Epic (optional)
                </label>
                <Select
                  value={editedTask.epic || ""}
                  onValueChange={(value) =>
                    setEditedTask((prev) =>
                      prev ? { ...prev, epic: value || undefined } : null,
                    )
                  }
                >
                  <SelectTrigger className="w-full bg-zinc-900/50 border-zinc-800 text-zinc-100 hover:bg-zinc-800/50">
                    <SelectValue placeholder="Select an epic" />
                  </SelectTrigger>
                  <SelectContent className="bg-zinc-900 border border-zinc-800">
                    {epics.map((epic) => (
                      <SelectItem
                        key={epic.id}
                        value={epic.id}
                        className="text-zinc-100 hover:bg-zinc-800 focus:bg-zinc-800 cursor-pointer"
                      >
                        {epic.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <TagInput value={editTagInput} onChange={setEditTagInput} />
              </div>
            </div>
          </div>

          {/* Dependencies Section */}
          <div className="space-y-2 pt-4 col-span-2">
            <label className="text-sm font-medium text-zinc-400">
              Dependencies
            </label>
            <div className="space-y-2">
              <SearchInput
                value={dependencySearchQuery}
                onChange={setDependencySearchQuery}
                placeholder="Search tasks..."
                className="w-full"
              />
              <div className="max-h-48 overflow-y-auto border border-zinc-800 rounded-md divide-y divide-zinc-800">
                {filteredDependencyTasks.map((t) => (
                  <div
                    key={t.filename}
                    className="flex items-center gap-3 p-2 hover:bg-zinc-800/50"
                  >
                    <Checkbox
                      checked={
                        editedTask.dependencies?.includes(normalizeDependencyFilename(t.filename)) || false
                      }
                      onCheckedChange={(checked) => {
                        setEditedTask((prev) => {
                          if (!prev) return null;
                          const deps = new Set(prev.dependencies || []);
                          const normalizedFilename = normalizeDependencyFilename(t.filename);
                          if (checked) {
                            deps.add(normalizedFilename);
                          } else {
                            deps.delete(normalizedFilename);
                          }
                          return {
                            ...prev,
                            dependencies: Array.from(deps),
                          };
                        });
                      }}
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-mono text-zinc-400">
                          {t.ref}
                        </span>
                        <span className="text-sm text-zinc-100 truncate">
                          {t.title}
                        </span>
                      </div>
                      {t.epic && (
                        <div className="text-xs text-zinc-500 truncate">
                          {epics.find((e) => e.id === t.epic)?.title || t.epic}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 mt-2 border-t border-zinc-800">
            <Button
              variant="outline"
              type="button"
              onClick={() => {
                onOpenChange(false);
              }}
              className="bg-zinc-900/50 border-zinc-800 text-zinc-100 hover:bg-zinc-800/50"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSaving}
              className="bg-blue-500 text-white hover:bg-blue-600"
            >
              {isSaving ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
