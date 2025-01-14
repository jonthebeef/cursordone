"use client";

import { Task } from "@/lib/tasks";
import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { completeTaskAction } from "@/lib/actions";
import { useToast } from "@/components/ui/use-toast";
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
import { TaskListHeader } from "./task-list-header";
import { TaskSection } from "./task-section";
import { TaskDetails } from "./task-details";
import { TaskCreationDialog } from "./task-creation-dialog";

interface TaskListContainerProps {
  initialTasks: Task[];
  epics: { id: string; title: string }[];
  selectedEpic: string | null;
  selectedTags: string[];
  onStateChange?: () => void;
  disabled?: boolean;
}

export function TaskListContainer({
  initialTasks,
  epics,
  selectedEpic,
  selectedTags,
  onStateChange,
  disabled,
}: TaskListContainerProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [sortOption, setSortOption] = useState("manual");
  const [taskOrder, setTaskOrder] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem("taskOrder");
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    todo: true,
    "in-progress": true,
    done: true,
  });
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);

  useEffect(() => {
    localStorage.setItem("taskOrder", JSON.stringify(taskOrder));
  }, [taskOrder]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
  );

  const filteredTasks = useMemo(() => {
    let tasks = initialTasks;

    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      tasks = tasks.filter(
        (task) =>
          task.title?.toLowerCase().includes(query) ||
          task.content?.toLowerCase().includes(query) ||
          task.ref?.toLowerCase().includes(query) ||
          task.tags?.some((tag) => tag.toLowerCase().includes(query)),
      );
    }

    // Filter by epic
    if (selectedEpic) {
      tasks = tasks.filter((task) => task.epic === selectedEpic);
    }

    // Filter by tags
    if (selectedTags.length > 0) {
      tasks = tasks.filter((task) =>
        selectedTags.every((tag) => task.tags?.includes(tag)),
      );
    }

    // Sort tasks
    switch (sortOption) {
      case "date-newest":
        return [...tasks].sort(
          (a, b) =>
            new Date(b.created).getTime() - new Date(a.created).getTime(),
        );
      case "date-oldest":
        return [...tasks].sort(
          (a, b) =>
            new Date(a.created).getTime() - new Date(b.created).getTime(),
        );
      case "priority-high":
        return [...tasks].sort((a, b) => {
          const priorities = { high: 3, medium: 2, low: 1 };
          return (
            priorities[b.priority || "medium"] -
            priorities[a.priority || "medium"]
          );
        });
      case "priority-low":
        return [...tasks].sort((a, b) => {
          const priorities = { high: 3, medium: 2, low: 1 };
          return (
            priorities[a.priority || "medium"] -
            priorities[b.priority || "medium"]
          );
        });
      default:
        // Manual sorting
        if (taskOrder.length > 0) {
          return [...tasks].sort((a, b) => {
            const aIndex = taskOrder.indexOf(a.filename);
            const bIndex = taskOrder.indexOf(b.filename);
            if (aIndex === -1 && bIndex === -1) return 0;
            if (aIndex === -1) return 1;
            if (bIndex === -1) return -1;
            return aIndex - bIndex;
          });
        }
        return tasks;
    }
  }, [
    initialTasks,
    searchQuery,
    selectedEpic,
    selectedTags,
    sortOption,
    taskOrder,
  ]);

  const sections = useMemo(() => {
    const todo = filteredTasks.filter((task) => task.status === "todo");
    const inProgress = filteredTasks.filter(
      (task) => task.status === "in-progress",
    );
    const done = filteredTasks.filter((task) => task.status === "done");

    return [
      { id: "todo", title: "To Do", tasks: todo },
      { id: "in-progress", title: "In Progress", tasks: inProgress },
      { id: "done", title: "Done", tasks: done },
    ];
  }, [filteredTasks]);

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = taskOrder.indexOf(active.id as string);
    const newIndex = taskOrder.indexOf(over.id as string);

    if (oldIndex !== -1 && newIndex !== -1) {
      const newOrder = arrayMove(taskOrder, oldIndex, newIndex);
      setTaskOrder(newOrder);
    }
  };

  const handleTaskComplete = async (task: Task) => {
    if (disabled) return;

    try {
      await completeTaskAction(task.filename);
      toast({
        title: "Success",
        description: "Task status updated successfully.",
      });
      onStateChange?.();
      router.refresh();
    } catch (error) {
      console.error("Failed to update task status:", error);
      toast({
        title: "Error",
        description: "Failed to update task status. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-4">
      <TaskListHeader
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onCreateClick={() => setShowCreateDialog(true)}
        sortOption={sortOption}
        onSortChange={setSortOption}
        disabled={disabled}
      />
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={sections.map((section) => section.id)}
          strategy={verticalListSortingStrategy}
        >
          <div className="space-y-2">
            {sections.map((section) => (
              <TaskSection
                key={section.id}
                id={section.id}
                title={section.title}
                tasks={section.tasks}
                isOpen={openSections[section.id]}
                onToggle={() =>
                  setOpenSections((prev) => ({
                    ...prev,
                    [section.id]: !prev[section.id],
                  }))
                }
                onTaskClick={setSelectedTask}
                onTaskComplete={handleTaskComplete}
                disabled={disabled}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>
      <TaskDetails
        task={selectedTask}
        onClose={() => setSelectedTask(null)}
        onSuccess={() => {
          onStateChange?.();
          router.refresh();
        }}
        epics={epics}
        disabled={disabled}
      />
      <TaskCreationDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
        epics={epics}
        initialTasks={initialTasks}
        onSuccess={() => {
          onStateChange?.();
          router.refresh();
        }}
        disabled={disabled}
      />
    </div>
  );
}
