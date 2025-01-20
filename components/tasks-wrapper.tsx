"use client";

import { useState, useEffect, useCallback, useTransition } from "react";
import { Task } from "@/lib/tasks";
import { TaskList } from "@/components/ui/task-list";
import { TaskFilters } from "./task-filters";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ui/use-toast";

interface TasksWrapperProps {
  tasks: Task[];
  epics: { id: string; title: string }[];
  tags: string[];
}

export function TasksWrapper({ tasks, epics, tags }: TasksWrapperProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();
  const [selectedEpic, setSelectedEpic] = useState<string | null>(null);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [currentTasks, setCurrentTasks] = useState<Task[]>(tasks);
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  // Load saved filter state on mount
  useEffect(() => {
    const savedFilters = localStorage.getItem("taskFilters");
    if (savedFilters) {
      const { epic, tags } = JSON.parse(savedFilters);
      setSelectedEpic(epic);
      setSelectedTags(tags);
    }
    setIsInitialLoad(false);
  }, []);

  // Save filter state when it changes
  useEffect(() => {
    localStorage.setItem(
      "taskFilters",
      JSON.stringify({
        epic: selectedEpic,
        tags: selectedTags,
      }),
    );
  }, [selectedEpic, selectedTags]);

  const handleTagSelect = useCallback((tag: string) => {
    setSelectedTags((prev) => {
      const newTags = prev.includes(tag)
        ? prev.filter((t) => t !== tag)
        : [...prev, tag];
      return newTags;
    });
  }, []);

  const handleEpicSelect = useCallback((epic: string | null) => {
    setSelectedEpic(epic);
  }, []);

  // Update tasks when they change from the server
  useEffect(() => {
    if (!isInitialLoad) {
      const hasNewTasks = tasks.some(
        (task) => !currentTasks.find((ct) => ct.filename === task.filename),
      );
      const hasRemovedTasks = currentTasks.some(
        (task) => !tasks.find((t) => t.filename === task.filename),
      );
      const hasChangedTasks = tasks.some((task) => {
        const currentTask = currentTasks.find(
          (ct) => ct.filename === task.filename,
        );
        return (
          currentTask &&
          (currentTask.status !== task.status ||
            currentTask.title !== task.title ||
            currentTask.priority !== task.priority ||
            currentTask.epic !== task.epic ||
            JSON.stringify(currentTask.tags) !== JSON.stringify(task.tags))
        );
      });

      if (hasNewTasks || hasRemovedTasks || hasChangedTasks) {
        setCurrentTasks(tasks);
        if (hasNewTasks) {
          toast({
            title: "🔄 Task list updated",
            description: "New tasks have been added to your list",
            variant: "default",
          });
        } else if (hasChangedTasks) {
          toast({
            title: "🔄 Task list updated",
            description: "Tasks have been modified",
            variant: "default",
          });
        }
      }
    }
  }, [tasks, currentTasks, toast, isInitialLoad]);

  const refresh = useCallback(() => {
    startTransition(() => {
      router.refresh();
    });
  }, [router]);

  // Set up automatic refresh interval
  useEffect(() => {
    const interval = setInterval(() => {
      refresh();
    }, 5000); // Check for updates every 5 seconds

    return () => clearInterval(interval);
  }, [refresh]);

  // Filter tasks based on selected epic and tags
  const filteredTasks = currentTasks.filter((task) => {
    const selectedEpicTitle = epics.find((e) => e.id === selectedEpic)?.title;

    // Normalize epic titles (lowercase and replace spaces with hyphens)
    const normalizeEpicTitle = (title: string | undefined) =>
      title?.toLowerCase().replace(/\s+/g, "-") || "";

    // Filter by epic - match normalized epic titles
    const matchesEpic =
      !selectedEpic ||
      (selectedEpic === "none"
        ? !task.epic
        : normalizeEpicTitle(selectedEpicTitle) ===
          normalizeEpicTitle(task.epic));

    // Filter by tags (handle undefined tags)
    const taskTags = task.tags || [];
    const matchesTags =
      selectedTags.length === 0 ||
      selectedTags.every((tag) => taskTags.includes(tag));

    return matchesEpic && matchesTags;
  });

  return (
    <div className="relative">
      <TaskFilters
        epics={epics}
        tags={tags}
        selectedEpic={selectedEpic}
        selectedTags={selectedTags}
        onEpicSelect={handleEpicSelect}
        onTagSelect={handleTagSelect}
      />
      <div className="mt-1">
        <TaskList
          initialTasks={filteredTasks}
          allTasks={currentTasks}
          epics={epics}
          selectedEpic={selectedEpic}
          selectedTags={selectedTags}
          onStateChange={refresh}
          disabled={isPending}
        />
      </div>
    </div>
  );
}
