"use client";

import { Task } from "@/lib/tasks";
import { cn } from "@/lib/utils";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";

interface TaskItemProps {
  task: Task;
  onClick: () => void;
  onComplete: () => void;
  disabled?: boolean;
}

export function TaskItem({
  task,
  onClick,
  onComplete,
  disabled,
}: TaskItemProps) {
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
  };

  const priorityColors = {
    high: "text-red-400",
    medium: "text-yellow-400",
    low: "text-green-400",
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "group flex items-center gap-2 px-3 py-2 bg-zinc-900/50 border border-zinc-800 rounded-md",
        "hover:bg-zinc-800/50 cursor-pointer transition-colors",
        isDragging && "opacity-50",
        disabled && "opacity-50 cursor-not-allowed pointer-events-none",
      )}
    >
      <div
        {...attributes}
        {...listeners}
        className="touch-none flex items-center self-stretch px-1 -ml-2 opacity-0 group-hover:opacity-100 transition-opacity cursor-grab"
      >
        <GripVertical className="w-4 h-4 text-zinc-400" />
      </div>
      <Checkbox
        checked={task.status === "done"}
        onCheckedChange={() => onComplete()}
        className="data-[state=checked]:bg-green-500 data-[state=checked]:border-green-500"
        disabled={disabled}
      />
      <div className="flex-1 min-w-0" onClick={onClick}>
        <div className="flex items-center gap-2">
          <span
            className={cn(
              "text-sm font-medium truncate",
              task.status === "done" && "line-through text-zinc-500",
            )}
          >
            {task.title}
          </span>
          {task.ref && (
            <Badge
              variant="outline"
              className="shrink-0 border-zinc-700 text-zinc-400"
            >
              {task.ref}
            </Badge>
          )}
          {task.epic && (
            <Badge
              variant="outline"
              className="shrink-0 border-zinc-700 text-zinc-400"
            >
              {task.epic}
            </Badge>
          )}
          <Badge
            variant="outline"
            className={cn(
              "shrink-0 border-zinc-700",
              priorityColors[task.priority],
            )}
          >
            {task.priority}
          </Badge>
          <Badge
            variant="outline"
            className="shrink-0 border-zinc-700 text-zinc-400"
          >
            {task.complexity}
          </Badge>
        </div>
        {task.tags && task.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-1.5">
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
      </div>
    </div>
  );
}
