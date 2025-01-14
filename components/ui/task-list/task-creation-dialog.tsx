"use client";

import { useState } from "react";
import { Task } from "@/lib/tasks";
import { createTaskAction } from "@/lib/actions";
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

interface TaskCreationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onStateChange?: () => void;
  epics: { id: string; title: string }[];
  initialTasks: Task[];
  disabled?: boolean;
}

export function TaskCreationDialog({
  open,
  onOpenChange,
  onStateChange,
  epics,
  initialTasks,
  disabled,
}: TaskCreationDialogProps) {
  const [isCreating, setIsCreating] = useState(false);
  const [dependencySearchQuery, setDependencySearchQuery] = useState("");
  const [tagInput, setTagInput] = useState("");
  const [newTask, setNewTask] = useState<
    Omit<Task, "ref" | "filename"> & { content: string }
  >({
    id: "0",
    title: "",
    priority: "medium",
    status: "todo",
    content: "",
    created: "",
    dependencies: [],
    complexity: "M",
  });

  // Filter tasks for dependencies
  const filteredDependencyTasks = initialTasks.filter((task) => {
    if (!dependencySearchQuery) return true;
    const searchLower = dependencySearchQuery.toLowerCase();
    return (
      task.title?.toLowerCase().includes(searchLower) ||
      task.epic?.toLowerCase().includes(searchLower)
    );
  });

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isCreating || disabled) return;
    setIsCreating(true);
    try {
      const taskToCreate: Omit<Task, "ref" | "filename"> & { content: string } =
        {
          ...newTask,
          tags: tagInput
            ? tagInput
                .split(",")
                .map((t) => t.trim())
                .filter(Boolean)
            : [],
          dependencies: newTask.dependencies || [],
          id: Date.now().toString(),
          created: new Date().toISOString().split("T")[0],
          content: newTask.content || "",
        };
      await createTaskAction(taskToCreate);
      onStateChange?.();
      onOpenChange(false);
      setNewTask({
        id: "0",
        title: "",
        priority: "medium",
        status: "todo",
        content: "",
        created: "",
        dependencies: [],
        complexity: "M",
      });
      setTagInput("");
    } catch (error) {
      console.error("Failed to create task:", error);
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl">
        <DialogHeader className="pb-4">
          <DialogTitle>Create New Task</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleCreate} className="space-y-4">
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
                  value={newTask.title}
                  onChange={(e) =>
                    setNewTask((prev) => ({ ...prev, title: e.target.value }))
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
                  value={newTask.content}
                  onChange={(value) =>
                    setNewTask((prev) => ({ ...prev, content: value }))
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
                        setNewTask((prev) => ({ ...prev, priority: p }))
                      }
                      className={cn(
                        "px-3 py-1.5 rounded-md capitalize text-sm flex-1 border",
                        newTask.priority === p
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
                  value={newTask.status || "todo"}
                  onValueChange={(value) =>
                    setNewTask((prev) => ({
                      ...prev,
                      status: value as Task["status"],
                    }))
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
                        setNewTask((prev) => ({
                          ...prev,
                          complexity: value as Task["complexity"],
                        }))
                      }
                      className={cn(
                        "px-3 py-1.5 rounded-md text-sm flex-1 border",
                        newTask.complexity === value
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
                  value={newTask.epic || ""}
                  onValueChange={(value) =>
                    setNewTask((prev) => ({
                      ...prev,
                      epic: value || undefined,
                    }))
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
                <TagInput value={tagInput} onChange={setTagInput} />
              </div>
            </div>
          </div>

          {/* Dependencies Section - Full Width */}
          <div className="space-y-2 pt-4 col-span-2">
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
                  placeholder="Search tasks..."
                  className="flex-1 bg-transparent outline-none text-sm text-zinc-100 placeholder:text-zinc-500"
                />
              </div>
              <div className="border border-zinc-800 rounded-md divide-y divide-zinc-800 max-h-48 overflow-y-auto bg-zinc-900/50">
                {filteredDependencyTasks.length === 0 ? (
                  <div className="p-3 text-sm text-zinc-500 text-center">
                    No tasks found
                  </div>
                ) : (
                  filteredDependencyTasks.map((task) => (
                    <div
                      key={task.filename}
                      className="flex items-center gap-3 p-2 hover:bg-zinc-800/50"
                    >
                      <Checkbox
                        id={`dep-${task.filename}`}
                        checked={newTask.dependencies?.includes(task.filename)}
                        onCheckedChange={(checked) => {
                          setNewTask((prev) => ({
                            ...prev,
                            dependencies: checked
                              ? [...(prev.dependencies || []), task.filename]
                              : (prev.dependencies || []).filter(
                                  (d) => d !== task.filename,
                                ),
                          }));
                        }}
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
                        <span className="font-medium">{task.title}</span>
                        {task.epic && (
                          <span className="ml-2 text-zinc-400">
                            in {task.epic}
                          </span>
                        )}
                      </label>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 mt-2 border-t border-zinc-800">
            <Button
              variant="outline"
              type="button"
              onClick={() => onOpenChange(false)}
              className="bg-zinc-900/50 border-zinc-800 text-zinc-100 hover:bg-zinc-800/50"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isCreating}
              className="bg-blue-500 text-white hover:bg-blue-600"
            >
              {isCreating ? "Creating..." : "Create Task"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
