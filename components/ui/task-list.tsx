"use client";

import { Task } from "@/lib/tasks";
import {
  completeTaskAction,
  deleteTaskAction,
  updateTaskAction,
  createTaskAction,
  saveTaskOrderAction,
} from "@/lib/actions";
import { TaskCard } from "./task-card";
import { SortableTaskCard } from "./sortable-task-card";
import { TaskEditDialogTest } from "./task-list/task-edit-dialog-test";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useState, useEffect, useRef, useMemo } from "react";
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
  Hash,
  Folder,
  ArrowUpDown,
  Shirt,
  Play,
  Loader2,
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import {
  DndContext,
  DragEndEvent,
  closestCenter,
  useSensor,
  useSensors,
  PointerSensor,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
  arrayMove,
} from "@dnd-kit/sortable";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/components/ui/use-toast";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { TagInput } from "@/components/ui/tag-input";
import { SearchInput } from "@/components/ui/search-input";
import { getOrderKey } from "@/lib/task-order";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { TextEditor } from "@/components/ui/text-editor";
import { getDependencyFilename, normalizeDependencyFilename } from "@/lib/utils/dependencies";
import { TaskViewDialog } from "./task-list/task-view-dialog";

const sortOptions = [
  { value: "manual", label: "Default Order" },
  { value: "date-newest", label: "Date Added (Newest)" },
  { value: "date-oldest", label: "Date Added (Oldest)" },
  { value: "priority-high", label: "Priority (High to Low)" },
  { value: "priority-low", label: "Priority (Low to High)" },
] as const;

type SortOption = (typeof sortOptions)[number]["value"];

interface TaskListProps {
  initialTasks: Task[];
  allTasks: Task[];
  epics: { id: string; title: string }[];
  selectedEpic: string | null;
  selectedTags: string[];
  onStateChange?: () => void;
  disabled?: boolean;
}

export function TaskList({
  initialTasks,
  allTasks,
  epics,
  selectedEpic,
  selectedTags,
  onStateChange,
  disabled,
}: TaskListProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editedTask, setEditedTask] = useState<Task | null>(null);
  const [editTagInput, setEditTagInput] = useState("");
  const [dependencySearchQuery, setDependencySearchQuery] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteAlert, setShowDeleteAlert] = useState(false);
  const [taskOrder, setTaskOrder] = useState<string[]>(
    initialTasks.map((t) => t.filename),
  );
  const [openSections, setOpenSections] = useState<string[]>([
    "in-progress",
    "backlog",
    "done",
  ]);
  const [isInitialized, setIsInitialized] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [sortOption, setSortOption] = useState<SortOption>("manual");
  const [newTask, setNewTask] = useState<
    Omit<Task, 'ref' | 'filename'> & { content: string }
  >({
    id: '0',
    title: '',
    priority: 'medium',
    status: 'todo',
    content: '',
    created: '',
    owner: 'user',
    complexity: 'M',
    epic: '',
    dependencies: [],
    tags: []
  });
  const [tagInput, setTagInput] = useState("");
  const [tasks, setTasks] = useState<Task[]>(initialTasks);
  const [isLoading, setIsLoading] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
  );

  const filteredDependencyTasks = useMemo(() => {
    if (!dependencySearchQuery) return allTasks;
    const query = dependencySearchQuery.toLowerCase();
    return allTasks.filter(
      (task) =>
        task.title?.toLowerCase().includes(query) ||
        false ||
        task.ref?.toLowerCase().includes(query) ||
        false,
    );
  }, [allTasks, dependencySearchQuery]);

  const handleStartEditing = () => {
    if (!selectedTask) return;
    setIsEditing(true);
    setEditedTask(selectedTask);
    setEditTagInput(selectedTask.tags?.join(", ") || "");
  };

  const handleSave = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!editedTask || !selectedTask || disabled) return;

    try {
      const tags = editTagInput
        .split(",")
        .map((tag) => tag.trim())
        .filter(Boolean);
      const taskToSave = { ...editedTask, tags };
      await updateTaskAction(selectedTask.filename, taskToSave);

      // Update the selected task with the latest content
      const updatedTask = initialTasks.find(
        (t) => t.filename === selectedTask.filename,
      );
      if (updatedTask) {
        setSelectedTask(updatedTask);
      }

      setIsEditing(false);
      setEditedTask(null);
      onStateChange?.();
      router.refresh();
    } catch (error) {
      console.error("Failed to update task:", error);
    }
  };

  const handleDelete = async (filename: string) => {
    if (disabled) return;
    try {
      await deleteTaskAction(filename);
      setSelectedTask(null);
      onStateChange?.();
      toast({
        title: "Task deleted",
        description: "The task has been successfully deleted.",
      });
    } catch (error) {
      console.error("Failed to delete task:", error);
      toast({
        title: "Error",
        description: "Failed to delete task. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Load task order when component mounts or filters change
  useEffect(() => {
    // Don't poll while editing
    if (isEditing) return;

    const loadTaskOrder = async () => {
      try {
        const response = await fetch(
          `/api/task-order?epic=${selectedEpic || ""}&tags=${selectedTags.join(",")}`,
        );
        if (!response.ok) throw new Error("Failed to load task order");
        const data = await response.json();

        // Only update if we have a valid order and it's different from current
        if (Array.isArray(data.order) && data.order.length > 0) {
          setTaskOrder(data.order);
        } else {
          // If no saved order, use the order from initialTasks
          setTaskOrder(initialTasks.map((t) => t.filename));
        }
      } catch (error) {
        console.error("Failed to load task order:", error);
        // Fallback to initialTasks order
        setTaskOrder(initialTasks.map((t) => t.filename));
      }
    };

    loadTaskOrder();
  }, [selectedEpic, selectedTags, initialTasks, isEditing]);

  // Filter tasks based on search query
  const filteredTasks = useMemo(() => {
    if (!searchQuery) return initialTasks;
    const searchLower = searchQuery.toLowerCase();
    return initialTasks.filter(
      (task) =>
        task.title?.toLowerCase().includes(searchLower) ||
        task.content?.toLowerCase().includes(searchLower) ||
        task.ref?.toLowerCase().includes(searchLower) ||
        task.epic?.toLowerCase().includes(searchLower) ||
        task.tags?.some((tag) => tag.toLowerCase().includes(searchLower)),
    );
  }, [initialTasks, searchQuery]);

  // Sort filtered tasks based on current sort option
  const sortedFilteredTasks = useMemo(() => {
    const tasks = [...filteredTasks];

    if (sortOption === "manual") {
      // Create a map for faster lookups
      const orderMap = new Map(taskOrder.map((id, index) => [id, index]));

      return tasks.sort((a, b) => {
        const aIndex = orderMap.get(a.filename) ?? Number.MAX_SAFE_INTEGER;
        const bIndex = orderMap.get(b.filename) ?? Number.MAX_SAFE_INTEGER;
        return aIndex - bIndex;
      });
    }

    switch (sortOption) {
      case "date-newest":
        return tasks.sort(
          (a, b) =>
            new Date(b.created).getTime() - new Date(a.created).getTime(),
        );
      case "date-oldest":
        return tasks.sort(
          (a, b) =>
            new Date(a.created).getTime() - new Date(b.created).getTime(),
        );
      case "priority-high":
        return tasks.sort((a, b) => {
          const priorityOrder = { high: 0, medium: 1, low: 2 };
          return priorityOrder[a.priority] - priorityOrder[b.priority];
        });
      case "priority-low":
        return tasks.sort((a, b) => {
          const priorityOrder = { high: 0, medium: 1, low: 2 };
          return priorityOrder[b.priority] - priorityOrder[a.priority];
        });
      default:
        return tasks;
    }
  }, [filteredTasks, taskOrder, sortOption]);

  // Split into backlog and done
  const sortedBacklogTasks = useMemo(
    () => sortedFilteredTasks.filter((task) => task.status !== "done"),
    [sortedFilteredTasks],
  );

  const sortedDoneTasks = useMemo(
    () => sortedFilteredTasks.filter((task) => task.status === "done"),
    [sortedFilteredTasks],
  );

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    // Force manual sort mode when dragging
    if (sortOption !== "manual") {
      setSortOption("manual");
    }

    // Get all visible tasks in current order
    const visibleTasks = [...sortedBacklogTasks, ...sortedDoneTasks];
    const visibleTaskIds = visibleTasks.map((t) => t.filename);

    // Find indices in the visible tasks array
    const oldIndex = visibleTaskIds.indexOf(active.id as string);
    const newIndex = visibleTaskIds.indexOf(over.id as string);

    if (oldIndex === -1 || newIndex === -1) return;

    // Create new order by preserving non-visible tasks and updating visible ones
    const newVisibleOrder = [...visibleTaskIds];
    const [movedItem] = newVisibleOrder.splice(oldIndex, 1);
    newVisibleOrder.splice(newIndex, 0, movedItem);

    // Merge with full task order
    const newOrder = taskOrder.filter((id) => !visibleTaskIds.includes(id));
    const insertIndex = taskOrder.findIndex((id) =>
      visibleTaskIds.includes(id),
    );
    newOrder.splice(
      insertIndex >= 0 ? insertIndex : newOrder.length,
      0,
      ...newVisibleOrder,
    );

    // Update the order immediately
    setTaskOrder(newOrder);

    try {
      // Save the global order
      await saveTaskOrderAction("global", newOrder);

      // Only save filtered order if we're in a filtered view
      if (selectedEpic || selectedTags.length > 0) {
        const key = getOrderKey(selectedEpic, selectedTags);
        const filteredOrder = newOrder.filter((filename) =>
          filteredTasks.some((task) => task.filename === filename),
        );
        await saveTaskOrderAction(key, filteredOrder);
      }
    } catch (error) {
      console.error("Failed to save task order:", error);
    }
  };

  const handleComplete = async (filename: string) => {
    if (disabled) return;
    try {
      const task = initialTasks.find((t) => t.filename === filename);
      if (!task) return;

      let newStatus: Task["status"];
      if (task.status === "todo") {
        newStatus = "in-progress";
      } else if (task.status === "in-progress") {
        newStatus = "done";
      } else {
        newStatus = "todo";
      }

      await updateTaskAction(filename, { ...task, status: newStatus });
      onStateChange?.();
    } catch (error) {
      console.error("Failed to complete task:", error);
    }
  };

  const handleEdit = () => {
    if (!selectedTask || disabled) return;

    // Get the latest task data from initialTasks
    const latestTask = initialTasks.find(
      (t) => t.filename === selectedTask.filename,
    );
    if (!latestTask) return;

    setEditedTask(latestTask);
    setEditTagInput(latestTask.tags?.join(", ") || "");
    setIsEditing(true);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isCreating || disabled) return;
    setIsCreating(true);
    try {
      // Add guidelines
      const guidelines = `

---

## Guidelines
- The fewer lines of code, the better
- Proceed like a Senior Developer // 10x engineer 
- DO NOT STOP WORKING until task is complete
- Start reasoning paragraphs with uncertainty, then build confidence through analysis`;

      const taskToCreate = {
        ...newTask,
        tags: tagInput ? tagInput.split(',').map(t => t.trim()).filter(Boolean) : [],
        dependencies: (newTask.dependencies || []).map(d => normalizeDependencyFilename(d)),
        id: Date.now().toString(),
        content: (newTask.content || '') + guidelines,
        created: new Date().toISOString().split('T')[0]
      }
      const filename = await createTaskAction(taskToCreate);
      if (filename) {
        setTaskOrder(prev => [...prev, filename]);
      }
      onStateChange?.();
      setShowCreateDialog(false);
      setNewTask({
        id: '0',
        title: '',
        priority: 'medium',
        status: 'todo',
        content: '',
        created: '',
        owner: 'user',
        complexity: 'M',
        epic: '',
        dependencies: [],
        tags: []
      });
      setTagInput('');
    } catch (error) {
      console.error('Failed to create task:', error);
    } finally {
      setIsCreating(false);
    }
  };

  const handleTaskClick = (task: Task) => {
    // Get the latest task data from initialTasks
    const latestTask = initialTasks.find((t) => t.filename === task.filename);
    if (!latestTask) return;

    setSelectedTask(latestTask);
    setIsEditing(false);
    setEditedTask(null);
  };

  // Add section for in-progress tasks
  const inProgressTasks = sortedFilteredTasks.filter(
    (task) => task.status === "in-progress",
  );
  const backlogTasks = sortedFilteredTasks.filter(
    (task) => task.status === "todo",
  );
  const doneTasks = sortedFilteredTasks.filter(
    (task) => task.status === "done",
  );

  // Update tasks when initialTasks changes
  useEffect(() => {
    setTasks(initialTasks);
  }, [initialTasks]);

  // Handle loading state during navigation
  useEffect(() => {
    const handleStart = () => setIsLoading(true);
    const handleComplete = () => setIsLoading(false);

    window.addEventListener("beforeunload", handleStart);
    return () => {
      window.removeEventListener("beforeunload", handleStart);
    };
  }, []);

  // Initialize newTask with current date on mount
  useEffect(() => {
    setNewTask(prev => ({
      ...prev,
      id: Date.now().toString(),
      created: new Date().toISOString().split('T')[0]
    }))
  }, [])

  if (isLoading || tasks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8 space-y-4">
        <Loader2 className="w-6 h-6 text-zinc-400 animate-spin" />
        <div className="text-zinc-400">Loading tasks...</div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Fixed header */}
      <header className="fixed top-0 right-0 left-0 lg:left-[250px] flex flex-col sm:flex-row items-start sm:items-center gap-2 p-2 lg:p-3 bg-[#18181b] z-50">
        <div className="w-full sm:max-w-[40%] lg:max-w-[50%] max-w-[calc(100%-48px)] ml-2.5">
          <div className="relative w-full">
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
        </div>
        <div className="flex items-center gap-2 justify-between w-full sm:w-auto sm:flex-1 sm:justify-end">
          <div className="flex items-center gap-2 sm:-ml-4">
            <ArrowUpDown className="w-4 h-4 text-zinc-400" />
            <Select
              value={sortOption}
              onValueChange={(value: SortOption) => setSortOption(value)}
            >
              <SelectTrigger className="w-[180px] bg-zinc-900 border-zinc-800 text-zinc-100 hover:bg-zinc-800/50 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500/20">
                <SelectValue placeholder="Sort by..." />
              </SelectTrigger>
              <SelectContent className="bg-zinc-900 border border-zinc-800">
                {sortOptions.map((option) => (
                  <SelectItem
                    key={option.value}
                    value={option.value}
                    className="text-zinc-100 hover:bg-zinc-800 focus:bg-zinc-800 cursor-pointer text-left"
                  >
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button
            onClick={() => setShowCreateDialog(true)}
            className="bg-blue-500 text-white hover:bg-blue-600 whitespace-nowrap sm:ml-4 lg:ml-6"
          >
            Create Task
          </Button>
        </div>
      </header>

      {/* Filter indicators */}
      {(selectedEpic || selectedTags.length > 0) && (
        <div className="flex items-center justify-start gap-2 text-sm px-2 mt-[52px] mb-6">
          {selectedEpic && (
            <div className="flex items-center gap-1.5 bg-zinc-800/50 px-2 py-1 rounded-md">
              <Folder className="w-3.5 h-3.5 text-zinc-400" />
              <span className="text-zinc-300">
                {selectedEpic === "none"
                  ? "No Epic"
                  : epics.find((e) => e.id === selectedEpic)?.title ||
                    selectedEpic}
              </span>
            </div>
          )}
          {selectedTags.map((tag, i) => (
            <div
              key={i}
              className="flex items-center gap-1.5 bg-zinc-800/50 px-2 py-1 rounded-md"
            >
              <Hash className="w-3.5 h-3.5 text-zinc-400" />
              <span className="text-zinc-300">{tag}</span>
            </div>
          ))}
        </div>
      )}

      {/* Main content */}
      <main
        className={cn(
          "flex-1 overflow-auto px-2",
          selectedEpic || selectedTags.length > 0 ? "pt-0" : "pt-[52px]",
        )}
      >
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={taskOrder}
            strategy={verticalListSortingStrategy}
          >
            <Accordion
              type="multiple"
              value={openSections}
              onValueChange={setOpenSections}
              className="space-y-8"
            >
              {/* In Progress Section */}
              {inProgressTasks.length > 0 && (
                <AccordionItem value="in-progress" className="border-none mb-8">
                  <AccordionTrigger className="hover:no-underline py-0">
                    <div className="flex items-center gap-2">
                      <Play className="w-5 h-5" />
                      <span className="text-xl font-medium tracking-tight text-zinc-100 font-mono">
                        In Progress ({inProgressTasks.length})
                      </span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="pt-4">
                      {inProgressTasks.map((task, i) => (
                        <SortableTaskCard
                          key={task.filename}
                          task={task}
                          number={i + 1}
                          onClick={handleTaskClick}
                          onComplete={handleComplete}
                        />
                      ))}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              )}

              {/* Backlog Section */}
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
                  {backlogTasks.map((task, i) => (
                    <SortableTaskCard
                      key={task.filename}
                      task={task}
                      number={i + 1}
                      onClick={handleTaskClick}
                      onComplete={handleComplete}
                    />
                  ))}
                </AccordionContent>
              </AccordionItem>

              {/* Done Section */}
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
                  {doneTasks.map((task, i) => (
                    <SortableTaskCard
                      key={task.filename}
                      task={task}
                      number={i + 1}
                      onClick={handleTaskClick}
                      onComplete={handleComplete}
                    />
                  ))}
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </SortableContext>
        </DndContext>
      </main>

      {/* View Dialog */}
      {selectedTask && (
        <TaskViewDialog
          task={selectedTask}
          initialTasks={initialTasks}
          allTasks={allTasks}
          open={!isEditing}
          onOpenChange={(open) => {
            if (!open) setSelectedTask(null);
          }}
          onEdit={handleEdit}
          onDelete={handleDelete}
          setSelectedTask={setSelectedTask}
        />
      )}

      {/* Edit Dialog */}
      <TaskEditDialogTest
        task={editedTask}
        open={isEditing}
        onOpenChange={(open) => {
          if (!open) {
            setIsEditing(false);
            setEditedTask(null);
          }
        }}
        onStateChange={onStateChange}
        disabled={disabled}
        initialTasks={initialTasks}
        epics={epics}
      />

      {/* Create Task Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-4xl max-h-[85vh] overflow-hidden p-0 flex flex-col">
          <DialogHeader className="flex-none p-6 border-b border-zinc-800">
            <DialogTitle className="text-xl font-bold">
              ✨ Create New Task
            </DialogTitle>
          </DialogHeader>
          <form
            onSubmit={handleCreate}
            className="flex-1 min-h-0 flex flex-col"
          >
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
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
                  type="text"
                  value={newTask.title}
                  onChange={(e) =>
                    setNewTask((prev) => ({ ...prev, title: e.target.value }))
                  }
                  className="w-full px-3 py-2 bg-zinc-900/50 border border-zinc-800 rounded-md text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500/20"
                  required
                />
              </div>

              {/* Content */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-zinc-400">
                  Content
                </label>
                <TextEditor
                  value={newTask.content}
                  onChange={(value) =>
                    setNewTask((prev) => ({ ...prev, content: value }))
                  }
                  className="min-h-[200px]"
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
                  onFileUpload={async (file) => {
                    const safeFilename = `${Date.now()}-${file.name.replace(/\s+/g, "-")}`;
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
                />
              </div>

              {/* Metadata Row */}
              <div className="grid grid-cols-3 gap-4">
                {/* Priority */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-zinc-400">
                    Priority
                  </label>
                  <Select
                    value={newTask.priority || "medium"}
                    onValueChange={(value) =>
                      setNewTask((prev) => ({
                        ...prev,
                        priority: value as Task["priority"],
                      }))
                    }
                  >
                    <SelectTrigger className="w-full bg-zinc-900/50 border-zinc-800 text-zinc-100">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="z-[250] bg-zinc-900 border border-zinc-800">
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
                    value={newTask.status || "todo"}
                    onValueChange={(value) =>
                      setNewTask((prev) => ({
                        ...prev,
                        status: value as Task["status"],
                      }))
                    }
                  >
                    <SelectTrigger className="w-full bg-zinc-900/50 border-zinc-800 text-zinc-100">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="z-[250] bg-zinc-900 border border-zinc-800">
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

                {/* Complexity */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-zinc-400">
                    Complexity
                  </label>
                  <Select
                    value={newTask.complexity || "M"}
                    onValueChange={(value) =>
                      setNewTask((prev) => ({
                        ...prev,
                        complexity: value as Task["complexity"],
                      }))
                    }
                  >
                    <SelectTrigger className="w-full bg-zinc-900/50 border-zinc-800 text-zinc-100">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="z-[250] bg-zinc-900 border border-zinc-800">
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
                      <SelectItem
                        value="unknown"
                        className="text-zinc-100 hover:bg-zinc-800 focus:bg-zinc-800"
                      >
                        Unknown
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Epic Selection */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-zinc-400">
                  Epic
                </label>
                <Select
                  value={newTask.epic || "none"}
                  onValueChange={(value) =>
                    setNewTask((prev) => ({
                      ...prev,
                      epic: value === "none" ? undefined : value,
                    }))
                  }
                >
                  <SelectTrigger className="w-full bg-zinc-900/50 border-zinc-800 text-zinc-100">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="z-[250] bg-zinc-900 border border-zinc-800">
                    <SelectItem
                      value="none"
                      className="text-zinc-100 hover:bg-zinc-800 focus:bg-zinc-800"
                    >
                      No Epic
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

              {/* Tags Input */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-zinc-400">
                  Tags
                </label>
                <TagInput
                  value={tagInput}
                  onChange={setTagInput}
                  className="w-full"
                  placeholder="Enter tags separated by commas"
                />
              </div>

              {/* Dependencies */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-zinc-400">
                  Dependencies
                </label>
                <div className="space-y-4">
                  {/* Search Dependencies */}
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                    <input
                      type="text"
                      value={dependencySearchQuery}
                      onChange={(e) => setDependencySearchQuery(e.target.value)}
                      placeholder="Search tasks to add as dependencies..."
                      className="w-full pl-9 pr-4 py-2 bg-zinc-900/50 border border-zinc-800 rounded-md text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500/20"
                    />
                  </div>

                  {/* Dependencies List */}
                  <div className="space-y-2 max-h-[300px] overflow-y-auto">
                    {filteredDependencyTasks.map((task) => (
                      <div
                        key={task.filename}
                        className="flex items-center gap-3 px-3 py-2 bg-zinc-900/50 border border-zinc-800 rounded-md"
                      >
                        <Checkbox
                          checked={newTask.dependencies?.includes(
                            task.filename,
                          )}
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
                        />
                        <div className="flex-1 min-w-0">
                          {task.ref && (
                            <span className="font-mono text-sm text-zinc-400 mr-2">
                              {task.ref}
                            </span>
                          )}
                          <span className="text-zinc-100">{task.title}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="flex-none p-4 border-t border-zinc-800 flex justify-end gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowCreateDialog(false)}
                className="bg-zinc-900/50 border-zinc-800 text-zinc-100 hover:bg-zinc-800/50"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isCreating}
                className="bg-blue-500 hover:bg-blue-600"
              >
                {isCreating ? "Creating..." : "Create Task"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={showDeleteAlert} onOpenChange={setShowDeleteAlert}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Are you sure you want to delete this task?
            </AlertDialogTitle>
            <AlertDialogDescription>
              Deleting this task removes the file from your local system. You
              may be able to retrieve it if you have committed your project
              recently to git. If not, it will be gone forever.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                setShowDeleteAlert(false);
                handleDelete(selectedTask?.filename || "");
              }}
              className="bg-red-600 text-white hover:bg-red-700"
            >
              Delete task
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
