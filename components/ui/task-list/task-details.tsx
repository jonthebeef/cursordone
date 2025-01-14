"use client";

import { Task } from "@/lib/tasks";
import { useState } from "react";
import { updateTaskAction } from "@/lib/actions";
import { useToast } from "@/components/ui/use-toast";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { TagInput } from "@/components/ui/tag-input";
import { TextEditor } from "@/components/ui/text-editor";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { formatDistanceToNow } from "date-fns";

interface TaskDetailsProps {
  task: Task | null;
  onClose: () => void;
  onSuccess?: () => void;
  epics: { id: string; title: string }[];
  disabled?: boolean;
}

export function TaskDetails({
  task,
  onClose,
  onSuccess,
  epics,
  disabled,
}: TaskDetailsProps) {
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editedTask, setEditedTask] = useState<Task | null>(task);
  const [tagInput, setTagInput] = useState(task?.tags?.join(", ") || "");

  const handleStartEditing = () => {
    setIsEditing(true);
    setEditedTask(task);
    setTagInput(task?.tags?.join(", ") || "");
  };

  const handleSave = async () => {
    if (!editedTask || !task || disabled) return;

    setIsSaving(true);
    try {
      const tags = tagInput
        .split(",")
        .map((tag) => tag.trim())
        .filter(Boolean);

      await updateTaskAction(task.filename, {
        ...editedTask,
        tags,
      });
      toast({
        title: "Success",
        description: "Task updated successfully.",
      });
      onSuccess?.();
      setIsEditing(false);
    } catch (error) {
      console.error("Failed to update task:", error);
      toast({
        title: "Error",
        description: "Failed to update task. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (!task) return null;

  return (
    <Sheet open={!!task} onOpenChange={() => onClose()}>
      <SheetContent className="w-full max-w-2xl">
        <SheetHeader>
          <SheetTitle>Task Details</SheetTitle>
        </SheetHeader>
        <div className="mt-6">
          {isEditing ? (
            <div className="space-y-4">
              <div>
                <input
                  type="text"
                  value={editedTask?.title || ""}
                  onChange={(e) =>
                    setEditedTask((prev) =>
                      prev ? { ...prev, title: e.target.value } : null,
                    )
                  }
                  placeholder="Task title..."
                  className="w-full px-3 py-2 bg-zinc-900/50 border border-zinc-800 rounded-md text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500/20"
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Select
                    value={editedTask?.priority || "medium"}
                    onValueChange={(value) =>
                      setEditedTask((prev) =>
                        prev
                          ? { ...prev, priority: value as Task["priority"] }
                          : null,
                      )
                    }
                  >
                    <SelectTrigger className="bg-zinc-900/50 border-zinc-800">
                      <SelectValue placeholder="Priority" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Select
                    value={editedTask?.complexity || "M"}
                    onValueChange={(value) =>
                      setEditedTask((prev) =>
                        prev
                          ? { ...prev, complexity: value as Task["complexity"] }
                          : null,
                      )
                    }
                  >
                    <SelectTrigger className="bg-zinc-900/50 border-zinc-800">
                      <SelectValue placeholder="Complexity" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="XS">XS</SelectItem>
                      <SelectItem value="S">S</SelectItem>
                      <SelectItem value="M">M</SelectItem>
                      <SelectItem value="L">L</SelectItem>
                      <SelectItem value="XL">XL</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Select
                  value={editedTask?.epic || ""}
                  onValueChange={(value) =>
                    setEditedTask((prev) =>
                      prev ? { ...prev, epic: value } : null,
                    )
                  }
                >
                  <SelectTrigger className="bg-zinc-900/50 border-zinc-800">
                    <SelectValue placeholder="Select epic" />
                  </SelectTrigger>
                  <SelectContent>
                    {epics.map((epic) => (
                      <SelectItem key={epic.id} value={epic.id}>
                        {epic.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <TagInput
                  value={tagInput}
                  onChange={setTagInput}
                  placeholder="Add tags (comma-separated)..."
                />
              </div>
              <div className="min-h-[200px]">
                <TextEditor
                  value={editedTask?.content || ""}
                  onChange={(content) =>
                    setEditedTask((prev) =>
                      prev ? { ...prev, content } : null,
                    )
                  }
                  placeholder="Task description..."
                />
              </div>
              <div className="flex justify-end gap-2 pt-4">
                <Button
                  variant="outline"
                  onClick={() => setIsEditing(false)}
                  disabled={isSaving || disabled}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSave}
                  disabled={isSaving || disabled || !editedTask?.title?.trim()}
                >
                  Save Changes
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="space-y-2">
                <h3 className="text-lg font-medium">{task.title}</h3>
                <div className="flex flex-wrap gap-2">
                  {task.ref && (
                    <Badge variant="outline" className="border-zinc-700">
                      {task.ref}
                    </Badge>
                  )}
                  {task.epic && (
                    <Badge variant="outline" className="border-zinc-700">
                      {task.epic}
                    </Badge>
                  )}
                  <Badge variant="outline" className="border-zinc-700">
                    {task.priority}
                  </Badge>
                  <Badge variant="outline" className="border-zinc-700">
                    {task.complexity}
                  </Badge>
                  <Badge variant="outline" className="border-zinc-700">
                    {task.status}
                  </Badge>
                </div>
              </div>
              {task.tags && task.tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {task.tags.map((tag, i) => (
                    <span
                      key={i}
                      className="px-1.5 py-0.5 bg-zinc-800 rounded text-xs text-zinc-400"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              )}
              <div className="prose prose-invert max-w-none">
                {task.content}
              </div>
              <div className="text-sm text-zinc-400">
                Created {formatDistanceToNow(new Date(task.created))} ago
              </div>
              <div className="flex justify-end gap-2 pt-4">
                <Button variant="outline" onClick={onClose} disabled={disabled}>
                  Close
                </Button>
                <Button onClick={handleStartEditing} disabled={disabled}>
                  Edit Task
                </Button>
              </div>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
