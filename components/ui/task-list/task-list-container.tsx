"use client";

import { Task } from "@/lib/tasks";
import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
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
import { TaskDialog } from "@/components/task-dialog";
import { completeTaskAction } from "@/lib/actions";

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

  // Debounce taskOrder updates to localStorage
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      localStorage.setItem("taskOrder", JSON.stringify(taskOrder));
    }, 1000); // Save after 1 second of no changes

    return () => clearTimeout(timeoutId);
  }, [taskOrder]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
  );

  // Memoize filtered tasks with stable references
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
      if (selectedEpic === "none") {
        tasks = tasks.filter((task) => !task.epic);
      } else {
        const epicTitle = epics.find((e) => e.id === selectedEpic)?.title;
        if (epicTitle) {
          const normalizedEpicTitle = epicTitle
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, "-");
          tasks = tasks.filter((task) => {
            if (!task.epic) return false;
            const normalizedTaskEpic = task.epic
              .toLowerCase()
              .replace(/[^a-z0-9]+/g, "-");
            return normalizedTaskEpic === normalizedEpicTitle;
          });
        }
      }
    }

    // Filter by tags
    if (selectedTags.length > 0) {
      tasks = tasks.filter((task) =>
        selectedTags.every((tag) => task.tags?.includes(tag)),
      );
    }

    // Create stable sort functions
    const sortFunctions = {
      "date-newest": (a: Task, b: Task) =>
        new Date(b.created).getTime() - new Date(a.created).getTime(),
      "date-oldest": (a: Task, b: Task) =>
        new Date(a.created).getTime() - new Date(b.created).getTime(),
      "priority-high": (a: Task, b: Task) => {
        const priorities = { high: 3, medium: 2, low: 1 };
        return (
          priorities[b.priority || "medium"] -
          priorities[a.priority || "medium"]
        );
      },
      "priority-low": (a: Task, b: Task) => {
        const priorities = { high: 3, medium: 2, low: 1 };
        return (
          priorities[a.priority || "medium"] -
          priorities[b.priority || "medium"]
        );
      },
      manual: (a: Task, b: Task) => {
        if (!taskOrder.length) return 0;
        const aIndex = taskOrder.indexOf(a.filename);
        const bIndex = taskOrder.indexOf(b.filename);
        if (aIndex === -1 && bIndex === -1) return 0;
        if (aIndex === -1) return 1;
        if (bIndex === -1) return -1;
        return aIndex - bIndex;
      },
    };

    // Sort tasks with stable function
    return [...tasks].sort(
      sortFunctions[sortOption as keyof typeof sortFunctions] ||
        sortFunctions.manual,
    );
  }, [
    initialTasks,
    searchQuery,
    selectedEpic,
    selectedTags,
    sortOption,
    taskOrder,
    epics,
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
      <TaskDialog
        isOpen={showCreateDialog}
        onOpenChange={setShowCreateDialog}
      />
    </div>
  );
}
