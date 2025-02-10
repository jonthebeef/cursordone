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
    // Always update tasks on first load
    if (isInitialLoad) {
      setCurrentTasks(tasks);
      setIsInitialLoad(false);
      return;
    }

    // Create maps for O(1) lookups
    const currentTaskMap = new Map(
      currentTasks.map((task) => [task.filename, task]),
    );
    const newTaskMap = new Map(tasks.map((task) => [task.filename, task]));

    // Check for new or removed tasks
    const hasNewTasks = tasks.some(
      (task) => !currentTaskMap.has(task.filename),
    );
    const hasRemovedTasks = currentTasks.some(
      (task) => !newTaskMap.has(task.filename),
    );

    // Check for changed tasks
    const hasChangedTasks = tasks.some((task) => {
      const currentTask = currentTaskMap.get(task.filename);
      if (!currentTask) return false;

      // Compare all relevant fields
      return (
        currentTask.status !== task.status ||
        currentTask.epic !== task.epic ||
        currentTask.created !== task.created ||
        (currentTask.tags || []).join(",") !== (task.tags || []).join(",")
      );
    });

    if (hasNewTasks || hasRemovedTasks || hasChangedTasks) {
      setCurrentTasks(tasks);

      // Temporarily disabled toasts for demo
      /*
      if (hasNewTasks) {
        toast({
          title: "✨ Task list updated",
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
      */
    }
  }, [tasks, currentTasks, toast, isInitialLoad]);

  const refresh = useCallback(() => {
    startTransition(() => {
      router.refresh();
    });
  }, [router]);

  // Increase refresh frequency for better responsiveness
  useEffect(() => {
    const interval = setInterval(() => {
      refresh();
    }, 2000); // Check for updates every 2 seconds

    return () => clearInterval(interval);
  }, [refresh]);

  // Filter tasks based on selected epic and tags
  const filteredTasks = currentTasks.filter((task) => {
    const selectedEpicTitle = epics.find((e) => e.id === selectedEpic)?.title;

    // Normalize epic titles (lowercase and replace non-alphanumeric with hyphens)
    const normalizeEpicTitle = (title: string | undefined) =>
      title?.toLowerCase().replace(/[^a-z0-9]+/g, "-") || "";

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
