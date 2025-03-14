"use client";

import { Task } from "@/lib/tasks";
import { TaskCategory } from "@/lib/types/tags";
import {
  completeTaskAction,
  deleteTaskAction,
  updateTaskAction,
  createTaskAction,
  saveTaskOrderAction,
  updateTaskStatusAction,
} from "@/lib/actions";
import { TaskCard } from "@/components/ui/task-card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useState, useEffect, useMemo } from "react";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Pencil,
  Trash2,
  ImagePlus,
  X,
  Search,
  ListTodo,
  CheckCircle2,
  ListOrdered,
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import { DndContext, DragEndEvent, closestCenter } from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
  arrayMove,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/components/ui/use-toast";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { TagInput } from "@/components/ui/tag-input";
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
import { getOrderKey } from "@/lib/task-order";
import Image from "next/image";
import { CategorySelect } from "@/components/ui/category-select";
import { MagicEnhanceButton } from '@/components/MagicEnhanceButton';
import { TextEditor } from "@/components/ui/text-editor";

interface TaskListProps {
  initialTasks: Task[];
  epics: { id: string; title: string }[];
  selectedEpic: string | null;
  selectedTags: string[];
  onStateChange?: () => void;
  disabled?: boolean;
}

// Update Task interface to include category
interface TaskWithCategory extends Task {
  category: TaskCategory;
}

// Add SortableTaskCard component
function SortableTaskCard({
  task,
  number,
  onClick,
}: {
  task: Task;
  number: number;
  onClick: (task: Task) => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.filename });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} className="flex items-center gap-3">
      <div
        {...attributes}
        {...listeners}
        className="flex items-center justify-center w-6 h-6 rounded-full bg-zinc-800/50 text-zinc-600 text-sm font-medium cursor-grab hover:bg-zinc-800 hover:text-zinc-500 transition-colors"
        onClick={(e) => e.stopPropagation()}
      >
        {number}
      </div>
      <div className="flex-1">
        <TaskCard task={task} onClick={onClick} />
      </div>
    </div>
  );
}

// Add ImageViewer component
function ImageViewer({ src, alt }: { src: string; alt: string }) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <>
      <div className="my-4">
        <Image
          src={src}
          alt={alt}
          width={200}
          height={150}
          className="rounded-lg max-w-[200px] h-auto cursor-pointer hover:opacity-90 transition-opacity"
          onClick={() => setIsExpanded(true)}
        />
      </div>
      {isExpanded && (
        <div
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-8"
          onClick={() => setIsExpanded(false)}
        >
          <button
            className="absolute top-4 right-4 text-white hover:text-gray-300"
            onClick={() => setIsExpanded(false)}
          >
            <X className="h-6 w-6" />
          </button>
          <Image
            src={src}
            alt={alt}
            width={1200}
            height={800}
            className="max-w-full max-h-full object-contain rounded-lg"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </>
  );
}

export function TaskList({
  initialTasks,
  epics,
  selectedEpic,
  selectedTags,
  onStateChange,
  disabled,
}: TaskListProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [selectedTask, setSelectedTask] = useState<TaskWithCategory | null>(
    null,
  );
  const [isEditing, setIsEditing] = useState(false);
  const [editedTask, setEditedTask] = useState<TaskWithCategory | null>(null);
  const [editTagInput, setEditTagInput] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [taskOrder, setTaskOrder] = useState<string[]>(
    initialTasks.map((t) => t.filename),
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [tagInput, setTagInput] = useState("");
  type NewTaskState = Omit<Task, "filename" | "ref" | "content" | "tags"> & {
    content: string;
    tagInput: string;
  };

  const [newTask, setNewTask] = useState<
    Omit<TaskWithCategory, "filename" | "ref" | "content"> & { content: string }
  >({
    id: "0",
    title: "",
    priority: "medium",
    status: "todo",
    content: "",
    created: "",
    owner: "user",
    category: TaskCategory.CHORE,
    complexity: "M",
    epic: "",
    dependencies: [],
    tags: [],
  });
  const [isCreating, setIsCreating] = useState(false);
  const [openSections, setOpenSections] = useState<string[]>([
    "backlog",
    "done",
  ]);
  const [showDeleteAlert, setShowDeleteAlert] = useState(false);

  // Initialize newTask with current date on mount
  useEffect(() => {
    setNewTask((prev) => ({
      ...prev,
      id: Date.now().toString(),
      created: new Date().toISOString().split("T")[0],
    }));
  }, []);

  // Update task order when tasks change
  useEffect(() => {
    const taskFilenames = initialTasks.map((t) => t.filename);
    setTaskOrder((prev) => {
      // If the filenames are the same (regardless of order), don't update
      if (
        prev.length === taskFilenames.length &&
        taskFilenames.every((f) => prev.includes(f))
      ) {
        return prev;
      }

      // Otherwise, preserve order of existing tasks and add new ones
      const newOrder = prev.filter((f) => taskFilenames.includes(f));
      taskFilenames.forEach((f) => {
        if (!newOrder.includes(f)) {
          newOrder.push(f);
        }
      });
      return newOrder;
    });
  }, [initialTasks]);

  const handleComplete = async (filename: string) => {
    if (disabled) return;
    try {
      await completeTaskAction(filename);
      onStateChange?.();
    } catch (error) {
      console.error("Failed to complete task:", error);
    }
  };

  const handleDelete = async () => {
    if (!selectedTask || isDeleting || disabled) return;
    setIsDeleting(true);
    try {
      await deleteTaskAction(selectedTask.filename);
      onStateChange?.();
      setSelectedTask(null);
      setShowDeleteAlert(false);
      toast({
        title: `🗑️ Task "${selectedTask.title}" deleted`,
        description: "The task has been permanently removed",
        variant: "default",
      });
    } catch (error) {
      console.error("Failed to delete task:", error);
      toast({
        title: "❌ Error",
        description: `Failed to delete task "${selectedTask?.title}"`,
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const handleEdit = () => {
    if (!selectedTask || disabled) return;
    setEditedTask({ ...selectedTask });
    setEditTagInput(selectedTask.tags?.join(", ") || "");
    setIsEditing(true);
  };

  const handleSave = async () => {
    if (!editedTask || !selectedTask || disabled) return;
    try {
      const taskToSave = {
        ...editedTask,
        tags: editTagInput
          ? editTagInput
              .split(",")
              .map((t) => t.trim())
              .filter(Boolean)
          : [],
      };
      await updateTaskAction(selectedTask.filename, taskToSave);
      onStateChange?.();
      setIsEditing(false);
      setSelectedTask(null);
      setEditTagInput("");
    } catch (error) {
      console.error("Failed to update task:", error);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isCreating || disabled) return;
    setIsCreating(true);
    try {
      const taskToCreate = {
        ...newTask,
        tags: tagInput
          ? tagInput
              .split(",")
              .map((t) => t.trim())
              .filter(Boolean)
          : [],
        id: Date.now().toString(),
        created: new Date().toISOString().split("T")[0],
      };
      const filename = await createTaskAction(taskToCreate);
      if (filename) {
        setTaskOrder((prev) => [...prev, filename]);
      }
      onStateChange?.();
      setShowCreateDialog(false);
      setNewTask({
        id: "0",
        title: "",
        priority: "medium",
        status: "todo",
        content: "",
        created: "",
        owner: "user",
        category: TaskCategory.CHORE,
        complexity: "M",
        epic: "",
        dependencies: [],
        tags: [],
      });
      setTagInput("");
    } catch (error) {
      console.error("Failed to create task:", error);
    } finally {
      setIsCreating(false);
    }
  };

  const filteredTasks = searchQuery
    ? initialTasks.filter(
        (task) =>
          task.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          task.content?.toLowerCase().includes(searchQuery.toLowerCase()),
      )
    : initialTasks;

  // Filter tasks for dependencies
  const filteredDependencyTasks = initialTasks.filter((task) => {
    if (!searchQuery) return true;
    const searchLower = searchQuery.toLowerCase();
    return (
      task.title?.toLowerCase().includes(searchLower) ||
      task.epic?.toLowerCase().includes(searchLower)
    );
  });

  // Sort tasks based on taskOrder
  const sortedTasks = filteredTasks.sort((a, b) => {
    const aIndex = taskOrder.indexOf(a.filename);
    const bIndex = taskOrder.indexOf(b.filename);
    if (aIndex === -1 && bIndex === -1) return 0;
    if (aIndex === -1) return 1;
    if (bIndex === -1) return -1;
    return aIndex - bIndex;
  });

  const inProgressTasks = sortedTasks.filter(
    (task) => task.status === "in-progress",
  );
  const backlogTasks = sortedTasks.filter((task) => task.status === "todo");
  const doneTasks = sortedTasks.filter((task) => task.status === "done");

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = taskOrder.indexOf(active.id as string);
    const newIndex = taskOrder.indexOf(over.id as string);

    if (oldIndex === -1 || newIndex === -1) return;

    // Create new order with all tasks
    const newOrder = arrayMove(taskOrder, oldIndex, newIndex);
    setTaskOrder(newOrder);

    try {
      // Save the global order
      await saveTaskOrderAction("global", newOrder);

      // If we're in a filtered view (epic or tags), save the filtered order
      if (selectedEpic || selectedTags.length > 0) {
        const key = getOrderKey(selectedEpic, selectedTags);
        const filteredOrder = newOrder.filter((filename) =>
          [...backlogTasks, ...doneTasks].some(
            (task) => task.filename === filename,
          ),
        );
        await saveTaskOrderAction(key, filteredOrder);
      }
    } catch (error) {
      console.error("Failed to save task order:", error);
    }
  };

  const handleTaskClick = (task: Task) => {
    setSelectedTask(task as TaskWithCategory);
  };

  return (
    <div className="relative -mt-6">
      <div>
        <header className="fixed top-0 right-0 left-0 lg:left-[250px] flex items-center justify-between px-6 py-2 bg-[#18181b] z-10">
          <div className="relative w-[320px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search tasks..."
              className="w-full pl-9 pr-8 py-1.5 bg-zinc-900/50 border border-zinc-800 rounded-md text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500/20"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-300 p-1"
                type="button"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
          <Button
            onClick={() => setShowCreateDialog(true)}
            className="bg-blue-500 text-white hover:bg-blue-600 whitespace-nowrap mr-12"
          >
            Create Task
          </Button>
        </header>

        <main className="pt-[52px]">
          {/* Create Task Dialog */}
          <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Create New Task</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleCreate} className="space-y-4 mt-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="sm:col-span-2 space-y-2">
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
                        setNewTask((prev) => ({
                          ...prev,
                          title: e.target.value,
                        }))
                      }
                      className="w-full px-3 py-1.5 bg-zinc-900/50 border border-zinc-800 rounded-md text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500/20"
                      required
                    />
                  </div>

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
                      Category
                    </label>
                    <CategorySelect
                      value={newTask.category}
                      onChange={(category) =>
                        setNewTask((prev) => ({ ...prev, category }))
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <label
                      htmlFor="epic"
                      className="text-sm font-medium text-zinc-400"
                    >
                      Epic (optional)
                    </label>
                    <select
                      id="epic"
                      value={newTask.epic || ""}
                      onChange={(e) =>
                        setNewTask((prev) => ({
                          ...prev,
                          epic: e.target.value || undefined,
                        }))
                      }
                      className="w-full px-3 py-1.5 bg-zinc-900/50 border border-zinc-800 rounded-md text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500/20"
                    >
                      <option value="">No epic</option>
                      {epics.map((epic) => (
                        <option key={epic.id} value={epic.title}>
                          {epic.title}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="sm:col-span-2 space-y-2">
                    <label className="text-sm font-medium text-zinc-400">
                      Dependencies
                    </label>
                    <div className="relative">
                      <div className="flex items-center px-3 py-1.5 bg-zinc-900/50 border border-zinc-800 rounded-md mb-2">
                        <Search className="w-4 h-4 text-zinc-400 mr-2" />
                        <input
                          type="text"
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          placeholder="Search tasks..."
                          className="flex-1 bg-transparent outline-none text-sm text-zinc-100 placeholder:text-zinc-500"
                        />
                      </div>
                      <div className="border border-zinc-800 rounded-md divide-y divide-zinc-800 max-h-32 overflow-y-auto bg-zinc-900/50">
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
                                checked={newTask.dependencies?.includes(
                                  task.filename,
                                )}
                                onCheckedChange={(checked) => {
                                  setNewTask((prev) => {
                                    const deps = prev.dependencies || [];
                                    return {
                                      ...prev,
                                      dependencies: checked
                                        ? [...deps, task.filename]
                                        : deps.filter(
                                            (d) => d !== task.filename,
                                          ),
                                    };
                                  });
                                }}
                                className="h-4 w-4 border-2 border-zinc-500 data-[state=checked]:bg-zinc-500 data-[state=checked]:border-zinc-500 hover:border-zinc-400 transition-colors"
                              />
                              <label
                                htmlFor={`dep-${task.filename}`}
                                className="flex-1 text-sm cursor-pointer truncate text-zinc-100"
                              >
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
                          ))
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="sm:col-span-2">
                    <TagInput
                      selectedTags={
                        tagInput
                          ? tagInput
                              .split(",")
                              .map((t) => t.trim())
                              .filter(Boolean)
                          : []
                      }
                      onTagsChange={(tags) => setTagInput(tags.join(", "))}
                    />
                  </div>

                  <div className="sm:col-span-2 space-y-2">
                    <label
                      htmlFor="content"
                      className="text-sm font-medium text-zinc-400"
                    >
                      Content
                    </label>
                    <TextEditor
                      value={newTask.content}
                      onChange={(value) =>
                        setNewTask((prev) => ({
                          ...prev,
                          content: value,
                        }))
                      }
                      className="min-h-[200px]"
                      context={{
                        epic: newTask.epic,
                        tags: tagInput ? tagInput.split(',').map(t => t.trim()).filter(Boolean) : []
                      }}
                      onImageUpload={async (file) => {
                        const safeFilename = `${Date.now()}-${file.name.replace(/\s+/g, "-")}`;
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
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-zinc-400">
                      Status
                    </label>
                    <select
                      value={newTask.status}
                      onChange={(e) =>
                        setNewTask((prev) => ({
                          ...prev,
                          status: e.target.value as Task["status"],
                        }))
                      }
                      className="w-full px-3 py-1.5 bg-zinc-900/50 border-zinc-800 rounded-md text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500/20"
                    >
                      <option value="todo">Todo</option>
                      <option value="in-progress">In Progress</option>
                      <option value="done">Done</option>
                    </select>
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-4">
                  <Button
                    variant="outline"
                    type="button"
                    onClick={() => setShowCreateDialog(false)}
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

          <Accordion
            type="multiple"
            value={openSections}
            onValueChange={setOpenSections}
            className="space-y-8"
          >
            <DndContext
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={[...backlogTasks, ...doneTasks].map((t) => t.filename)}
                strategy={verticalListSortingStrategy}
              >
                <AccordionItem value="in-progress" className="border-none mb-8">
                  <AccordionTrigger className="hover:no-underline py-0">
                    <div className="flex items-center gap-2">
                      <div className="p-1 rounded-md bg-amber-400/10">
                        <ListTodo className="h-4 w-4" />
                      </div>
                      <span className="text-xl font-medium tracking-tight text-zinc-100 font-mono">
                        In Progress (
                        {
                          sortedTasks.filter((t) => t.status === "in-progress")
                            .length
                        }
                        )
                      </span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="pt-6 space-y-4">
                    {sortedTasks
                      .filter((t) => t.status === "in-progress")
                      .map((task, i) => (
                        <SortableTaskCard
                          key={task.filename}
                          task={task}
                          number={i + 1}
                          onClick={handleTaskClick}
                        />
                      ))}
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="backlog" className="border-none mb-8">
                  <AccordionTrigger className="hover:no-underline py-0">
                    <div className="flex items-center gap-2">
                      <ListTodo className="w-5 h-5" />
                      <span className="text-xl font-medium tracking-tight text-zinc-100 font-mono">
                        Backlog ({backlogTasks.length})
                      </span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="pt-6 space-y-4">
                    {backlogTasks.map((task, index) => (
                      <SortableTaskCard
                        key={task.filename}
                        task={task}
                        number={index + 1}
                        onClick={handleTaskClick}
                      />
                    ))}
                  </AccordionContent>
                </AccordionItem>

                {doneTasks.length > 0 && (
                  <AccordionItem value="done" className="border-none">
                    <AccordionTrigger className="hover:no-underline py-0">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-5 h-5" />
                        <span className="text-xl font-medium tracking-tight text-zinc-100 font-mono">
                          Done ({doneTasks.length})
                        </span>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="pt-6 space-y-4">
                      {doneTasks.map((task, index) => (
                        <SortableTaskCard
                          key={task.filename}
                          task={task}
                          number={backlogTasks.length + index + 1}
                          onClick={handleTaskClick}
                        />
                      ))}
                    </AccordionContent>
                  </AccordionItem>
                )}
              </SortableContext>
            </DndContext>
          </Accordion>

          <Dialog
            open={!!selectedTask}
            onOpenChange={() => {
              setSelectedTask(null);
              setIsEditing(false);
              setEditedTask(null);
            }}
          >
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
              {selectedTask && (
                <>
                  {isEditing ? (
                    <form
                      onSubmit={(e) => {
                        e.preventDefault();
                        handleSave();
                      }}
                      className="space-y-4"
                    >
                      <DialogHeader>
                        <DialogTitle className="sr-only">Edit Task</DialogTitle>
                      </DialogHeader>
                      <div className="grid gap-6">
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
                            value={editedTask?.title || ""}
                            onChange={(e) =>
                              setEditedTask((prev) =>
                                prev
                                  ? { ...prev, title: e.target.value }
                                  : null,
                              )
                            }
                            className="w-full px-3 py-1.5 bg-zinc-900/50 border-zinc-800 rounded-md text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500/20"
                          />
                        </div>

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
                                  "px-3 py-1.5 rounded-md capitalize text-sm flex-1 transition-colors",
                                  editedTask?.priority === p
                                    ? "bg-zinc-800 text-zinc-100"
                                    : "bg-zinc-900/50 text-zinc-400 hover:text-zinc-300 border border-zinc-800",
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
                          <select
                            value={editedTask?.status || "todo"}
                            onChange={(e) =>
                              setEditedTask((prev) =>
                                prev
                                  ? {
                                      ...prev,
                                      status: e.target.value as Task["status"],
                                    }
                                  : null,
                              )
                            }
                            className="w-full px-3 py-1.5 bg-zinc-900/50 border-zinc-800 rounded-md text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500/20"
                          >
                            <option value="todo">Todo</option>
                            <option value="in-progress">In Progress</option>
                            <option value="done">Done</option>
                          </select>
                        </div>

                        <div className="space-y-2">
                          <label className="text-sm font-medium text-zinc-400">
                            Category
                          </label>
                          <CategorySelect
                            value={editedTask?.category}
                            onChange={(category) =>
                              setEditedTask((prev) =>
                                prev ? { ...prev, category } : null,
                              )
                            }
                          />
                        </div>

                        <div className="space-y-2">
                          <label
                            htmlFor="epic"
                            className="text-sm font-medium text-zinc-400"
                          >
                            Epic (optional)
                          </label>
                          <input
                            id="epic"
                            type="text"
                            value={editedTask?.epic || ""}
                            onChange={(e) =>
                              setEditedTask((prev) =>
                                prev
                                  ? {
                                      ...prev,
                                      epic: e.target.value || undefined,
                                    }
                                  : null,
                              )
                            }
                            className="w-full px-3 py-1.5 bg-zinc-900/50 border-zinc-800 rounded-md text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500/20"
                            placeholder="Epic name"
                          />
                        </div>

                        <div className="space-y-2">
                          <label
                            htmlFor="parent"
                            className="text-sm font-medium text-zinc-400"
                          >
                            Parent (optional)
                          </label>
                          <input
                            id="parent"
                            type="text"
                            value={editedTask?.parent || ""}
                            onChange={(e) =>
                              setEditedTask((prev) =>
                                prev
                                  ? {
                                      ...prev,
                                      parent: e.target.value || undefined,
                                    }
                                  : null,
                              )
                            }
                            className="w-full px-3 py-1.5 bg-zinc-900/50 border-zinc-800 rounded-md text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500/20"
                            placeholder="Parent task"
                          />
                        </div>

                        <div className="sm:col-span-2 space-y-2">
                          <label className="text-sm font-medium text-zinc-400">
                            Dependencies
                          </label>
                          <div className="relative">
                            <div className="flex items-center px-3 py-1.5 bg-zinc-900/50 border-zinc-800 rounded-md mb-2">
                              <Search className="w-4 h-4 text-zinc-400 mr-2" />
                              <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Search tasks..."
                                className="flex-1 bg-transparent outline-none text-sm text-zinc-100 placeholder:text-zinc-500"
                              />
                            </div>
                            <div className="border border-zinc-800 rounded-md divide-y divide-zinc-800 max-h-32 overflow-y-auto bg-zinc-900/50">
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
                                      checked={editedTask?.dependencies?.includes(
                                        task.filename,
                                      )}
                                      onCheckedChange={(checked) => {
                                        setEditedTask((prev) => {
                                          if (!prev) return prev;
                                          const deps = prev.dependencies || [];
                                          return {
                                            ...prev,
                                            dependencies: checked
                                              ? [...deps, task.filename]
                                              : deps.filter(
                                                  (d) => d !== task.filename,
                                                ),
                                          };
                                        });
                                      }}
                                      className="h-4 w-4 border-2 border-zinc-500 data-[state=checked]:bg-zinc-500 data-[state=checked]:border-zinc-500 hover:border-zinc-400 transition-colors"
                                    />
                                    <label
                                      htmlFor={`dep-${task.filename}`}
                                      className="flex-1 text-sm cursor-pointer truncate text-zinc-100"
                                    >
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
                                ))
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="sm:col-span-2">
                          <TagInput
                            selectedTags={
                              editTagInput
                                ? editTagInput
                                    .split(",")
                                    .map((t) => t.trim())
                                    .filter(Boolean)
                                : []
                            }
                            onTagsChange={(tags) =>
                              setEditTagInput(tags.join(", "))
                            }
                          />
                        </div>

                        <div className="space-y-2">
                          <label className="text-sm font-medium text-zinc-400">
                            Category
                          </label>
                          <CategorySelect
                            value={editedTask?.category}
                            onChange={(category) =>
                              setEditedTask((prev) =>
                                prev ? { ...prev, category } : null,
                              )
                            }
                          />
                        </div>

                        <div className="sm:col-span-2 space-y-2">
                          <label
                            htmlFor="content"
                            className="text-sm font-medium text-zinc-400"
                          >
                            Content
                          </label>
                          <TextEditor
                            value={editedTask?.content || ""}
                            onChange={(value) =>
                              setEditedTask((prev) =>
                                prev
                                  ? { ...prev, content: value }
                                  : null,
                              )
                            }
                            className="min-h-[200px]"
                            context={{
                              epic: editedTask?.epic,
                              tags: editTagInput ? editTagInput.split(',').map(t => t.trim()).filter(Boolean) : []
                            }}
                          />
                        </div>
                      </div>

                      <div className="flex justify-end gap-3 pt-4">
                        <Button
                          variant="outline"
                          type="button"
                          onClick={() => {
                            setIsEditing(false);
                            setEditedTask(null);
                          }}
                          className="bg-zinc-900/50 border-zinc-800 text-zinc-100 hover:bg-zinc-800/50"
                        >
                          Cancel
                        </Button>
                        <Button
                          type="submit"
                          className="bg-blue-500 text-white hover:bg-blue-600"
                        >
                          Save Changes
                        </Button>
                      </div>
                    </form>
                  ) : (
                    <div className="space-y-6">
                      <DialogHeader>
                        <DialogTitle className="sr-only">
                          View Task: {selectedTask.title}
                        </DialogTitle>
                      </DialogHeader>
                      <div className="flex items-start justify-between gap-8 pb-4 border-b border-zinc-800">
                        <div className="flex-1">
                          <h2
                            className={cn(
                              "text-2xl font-medium tracking-tight text-zinc-100 font-mono",
                              selectedTask.status === "done" &&
                                "line-through text-zinc-400",
                            )}
                          >
                            {selectedTask.title}
                          </h2>
                        </div>
                        <div className="flex items-center gap-4">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={handleEdit}
                            className="hover:bg-zinc-800"
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setShowDeleteAlert(true)}
                            disabled={isDeleting}
                            className="hover:bg-red-900/20 hover:text-red-400"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>

                      <div className="grid gap-6">
                        <div className="grid gap-6 sm:grid-cols-2 bg-zinc-800/50 p-4 rounded-lg border border-zinc-800">
                          <div className="space-y-1.5">
                            <label className="text-sm font-medium text-zinc-400">
                              Status
                            </label>
                            <div className="flex items-center gap-1.5 bg-zinc-900/50 px-3 py-1.5 rounded-md border border-zinc-800">
                              <span
                                className={cn(
                                  "w-2 h-2 rounded-full",
                                  selectedTask.status === "done"
                                    ? "bg-green-500"
                                    : selectedTask.status === "in-progress"
                                      ? "bg-amber-500"
                                      : "bg-blue-500",
                                )}
                              />
                              <span className="capitalize text-zinc-100">
                                {selectedTask.status}
                              </span>
                            </div>
                          </div>

                          <div className="space-y-1.5">
                            <label className="text-sm font-medium text-zinc-400">
                              Priority
                            </label>
                            <div className="flex items-center gap-1.5 bg-zinc-900/50 px-3 py-1.5 rounded-md border border-zinc-800">
                              <span
                                className={cn(
                                  "w-2 h-2 rounded-full",
                                  selectedTask.priority === "high" &&
                                    "bg-amber-500",
                                  selectedTask.priority === "medium" &&
                                    "bg-blue-500",
                                  selectedTask.priority === "low" &&
                                    "bg-green-500",
                                )}
                              />
                              <span className="capitalize text-zinc-100">
                                {selectedTask.priority}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="grid gap-6 sm:grid-cols-2 bg-zinc-800/50 p-4 rounded-lg border border-zinc-800">
                          <div className="space-y-1.5">
                            <label className="text-sm font-medium text-zinc-400">
                              Epic
                            </label>
                            {selectedTask.epic ? (
                              <div className="flex items-center gap-1.5 bg-zinc-900/50 px-3 py-1.5 rounded-md border border-zinc-800">
                                <span className="w-2 h-2 rounded-full bg-blue-400" />
                                <span className="text-zinc-100">
                                  {selectedTask.epic}
                                </span>
                              </div>
                            ) : (
                              <div className="text-sm text-zinc-500 bg-zinc-900/50 px-3 py-1.5 rounded-md border border-zinc-800">
                                No epic assigned
                              </div>
                            )}
                          </div>

                          <div className="space-y-1.5">
                            <label className="text-sm font-medium text-zinc-400">
                              Parent
                            </label>
                            {selectedTask.parent ? (
                              <div className="flex items-center gap-1.5 bg-zinc-900/50 px-3 py-1.5 rounded-md border border-zinc-800">
                                <span className="w-2 h-2 rounded-full bg-purple-400" />
                                <span className="text-zinc-100">
                                  {selectedTask.parent}
                                </span>
                              </div>
                            ) : (
                              <div className="text-sm text-zinc-500 bg-zinc-900/50 px-3 py-1.5 rounded-md border border-zinc-800">
                                No parent task
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="space-y-1.5 bg-zinc-800/50 p-4 rounded-lg border border-zinc-800">
                          <label className="text-sm font-medium text-zinc-400">
                            Tags
                          </label>
                          {selectedTask.tags?.length ? (
                            <div className="flex flex-wrap gap-2 bg-zinc-900/50 p-3 rounded-md border border-zinc-800">
                              {selectedTask.tags.map((tag, i) => (
                                <span
                                  key={i}
                                  className="flex items-center gap-1 bg-zinc-800 px-2.5 py-1 rounded-full text-sm text-zinc-100"
                                >
                                  #{tag}
                                </span>
                              ))}
                            </div>
                          ) : (
                            <div className="text-sm text-zinc-500 bg-zinc-900/50 px-3 py-1.5 rounded-md border border-zinc-800">
                              No tags
                            </div>
                          )}
                        </div>

                        {selectedTask.dependencies &&
                          selectedTask.dependencies.length > 0 && (
                            <div className="space-y-1.5 bg-zinc-800/50 p-4 rounded-lg border border-zinc-800">
                              <label className="text-sm font-medium text-zinc-400">
                                Dependencies
                              </label>
                              <div className="bg-zinc-900/50 p-3 rounded-md border border-zinc-800">
                                <ul className="space-y-1">
                                  {selectedTask.dependencies.map((dep, i) => (
                                    <li key={i}>
                                      <a
                                        href={dep}
                                        className="text-blue-400 hover:text-blue-300 inline-flex items-center gap-1.5"
                                      >
                                        <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                                        {dep}
                                      </a>
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            </div>
                          )}

                        <div className="space-y-1.5">
                          <label className="text-sm font-medium text-zinc-400">
                            Content
                          </label>
                          <div className="prose prose-invert prose-zinc prose-headings:mt-4 prose-headings:mb-2 prose-p:my-2 prose-ul:my-2 max-w-none border border-zinc-800 rounded-md p-4 bg-zinc-900/50">
                            <ReactMarkdown
                              className="break-words"
                              components={{
                                img: ({ src, alt, ...props }) => {
                                  if (!src || typeof src !== "string")
                                    return null;

                                  return (
                                    <Image
                                      src={src}
                                      alt={alt || ""}
                                      width={200}
                                      height={200}
                                      className="max-w-full h-auto rounded-md my-4"
                                    />
                                  );
                                },
                              }}
                            >
                              {selectedTask.content}
                            </ReactMarkdown>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </>
              )}
            </DialogContent>
          </Dialog>

          <AlertDialog open={showDeleteAlert} onOpenChange={setShowDeleteAlert}>
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
                  onClick={handleDelete}
                  className="bg-red-600 text-white hover:bg-red-700"
                >
                  Delete task
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </main>
      </div>
    </div>
  );
}
