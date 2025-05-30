"use client";

import { Card, CardHeader } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Task } from "@/lib/tasks";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Link2, Calendar, Shirt, Tag } from "lucide-react";
import { updateTaskStatusAction, completeTaskAction } from "@/lib/actions";
import { TaskCategory } from "@/lib/types/tags";

interface TaskCardProps {
  task: Task;
  onClick: (task: Task) => void;
}

const priorityColors = {
  low: "bg-green-400",
  medium: "bg-blue-400",
  high: "bg-amber-400",
};

export function TaskCard({ task, onClick }: TaskCardProps) {
  const router = useRouter();
  const [isUpdating, setIsUpdating] = useState(false);

  const handleStatusChange = async (checked: boolean) => {
    if (isUpdating) return;

    setIsUpdating(true);
    try {
      if (task.status === "done") {
        // From done -> todo
        await updateTaskStatusAction(task.filename, "todo");
      } else if (task.status === "todo" && checked) {
        // From todo -> in-progress
        await updateTaskStatusAction(task.filename, "in-progress");
      } else if (task.status === "in-progress" && checked) {
        // From in-progress -> done
        await updateTaskStatusAction(task.filename, "done");
      } else if (task.status === "in-progress" && !checked) {
        // From in-progress -> todo
        await updateTaskStatusAction(task.filename, "todo");
      }
      // Use router.refresh() for a smoother update
      router.refresh();
    } catch (error) {
      console.error("Failed to change status:", error);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleCardClick = (e: React.MouseEvent) => {
    if (
      e.defaultPrevented ||
      (e.target as HTMLElement).closest(".checkbox-container")
    )
      return;
    onClick(task);
  };

  const dependenciesCount = Array.isArray(task.dependencies)
    ? task.dependencies.length
    : 0;
  const hasDependencies = dependenciesCount > 0;
  const date = new Date(task.created || Date.now());
  const formattedDate = new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);

  return (
    <Card
      className={cn(
        "transition-all duration-200 cursor-pointer hover:shadow-xl shadow-md border relative w-full",
        "bg-zinc-800/40 hover:bg-zinc-800/60 border-zinc-800/50",
        task.status === "done" && "opacity-60",
      )}
      onClick={handleCardClick}
    >
      <div
        className="absolute left-0 top-0 bottom-0 w-1 rounded-l"
        style={{
          backgroundColor:
            task.priority === "high"
              ? "#fbbf24"
              : task.priority === "medium"
                ? "#60a5fa"
                : "#94a3b8",
        }}
      />
      <CardHeader className="flex flex-row items-center gap-4 py-4">
        <div
          className="checkbox-container"
          onClick={(e) => {
            e.stopPropagation();
          }}
        >
          <Checkbox
            checked={task.status === "done"}
            disabled={isUpdating}
            onCheckedChange={handleStatusChange}
            className={cn(
              "h-5 w-5 border-2 data-[state=checked]:bg-transparent data-[state=checked]:text-green-500 data-[state=checked]:border-green-500 border-zinc-500 hover:border-zinc-400 transition-colors",
              isUpdating && "opacity-50 cursor-wait",
            )}
          />
        </div>
        <div className="flex-1">
          <h3
            className={cn(
              "font-medium text-base tracking-tight text-zinc-100 font-mono",
              task.status === "done" && "line-through text-zinc-400",
            )}
          >
            <span className="text-zinc-500">{task.ref}</span> {task.title}
          </h3>
          <div className="flex flex-wrap items-center gap-4 text-sm text-zinc-300 mt-2.5">
            {task.epic && (
              <span className="flex items-center gap-1.5 font-inter">
                <span className="w-2 h-2 rounded-full bg-blue-400" />
                {task.epic}
              </span>
            )}
            <span className="flex items-center gap-1.5 font-inter">
              <span
                className={cn(
                  "w-2 h-2 rounded-full",
                  priorityColors[task.priority],
                )}
              />
              {task.priority}
            </span>
            {task.complexity && (
              <span className="flex items-center gap-1.5 font-inter">
                <Shirt className="h-3.5 w-3.5 text-purple-400" />
                {task.complexity === "XS"
                  ? "Extra Small"
                  : task.complexity === "S"
                    ? "Small"
                    : task.complexity === "M"
                      ? "Medium"
                      : task.complexity === "L"
                        ? "Large"
                        : "Extra Large"}
              </span>
            )}
            {task.category && (
              <span className="flex items-center gap-1.5 font-inter">
                <Tag className="h-3.5 w-3.5 text-amber-400" />
                {task.category.charAt(0) + task.category.slice(1).toLowerCase()}
              </span>
            )}
            {hasDependencies && (
              <span className="flex items-center gap-1.5 font-inter text-zinc-400">
                <Link2 className="h-3.5 w-3.5" />
                {dependenciesCount}
              </span>
            )}
            <span className="flex items-center gap-1.5 font-inter text-zinc-400">
              <Calendar className="h-3.5 w-3.5" />
              {formattedDate}
            </span>
            {task.tags && task.tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {task.tags.map((tag, i) => (
                  <span
                    key={i}
                    className="flex items-center gap-1 bg-zinc-700/50 px-2 py-0.5 rounded-full text-xs text-zinc-200 font-inter"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      </CardHeader>
    </Card>
  );
}
