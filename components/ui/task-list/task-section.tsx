"use client";

import { Task } from "@/lib/tasks";
import { cn } from "@/lib/utils";
import { ChevronDown } from "lucide-react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { TaskItem } from "./task-item";
import { useVirtualizer } from "@tanstack/react-virtual";
import { useRef, useEffect } from "react";

interface TaskSectionProps {
  id: string;
  title: string;
  tasks: Task[];
  isOpen: boolean;
  onToggle: () => void;
  onTaskClick: (task: Task) => void;
  onTaskComplete: (task: Task) => void;
  disabled?: boolean;
}

export function TaskSection({
  id,
  title,
  tasks,
  isOpen,
  onToggle,
  onTaskClick,
  onTaskComplete,
  disabled,
}: TaskSectionProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const parentRef = useRef<HTMLDivElement>(null);

  const virtualizer = useVirtualizer({
    count: tasks.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 64, // Estimated height of each task item
    overscan: 5, // Number of items to render outside the viewport
  });

  // Reset virtualizer when section is opened/closed
  useEffect(() => {
    if (isOpen) {
      virtualizer.measure();
    }
  }, [isOpen, virtualizer]);

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "bg-zinc-900/50 border border-zinc-800 rounded-lg overflow-hidden",
        isDragging && "opacity-50",
      )}
    >
      <button
        onClick={onToggle}
        className={cn(
          "w-full flex items-center gap-2 px-4 py-2 hover:bg-zinc-800/50 transition-colors",
          "focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:ring-offset-2 focus:ring-offset-zinc-900",
        )}
        {...attributes}
        {...listeners}
      >
        <ChevronDown
          className={cn(
            "w-4 h-4 text-zinc-400 transition-transform",
            isOpen && "rotate-180",
          )}
        />
        <span className="text-sm font-medium text-zinc-100">{title}</span>
        <span className="text-xs text-zinc-400">({tasks.length})</span>
      </button>
      {isOpen && (
        <div
          ref={parentRef}
          className="p-2 space-y-2 max-h-[400px] overflow-y-auto"
        >
          <div
            style={{
              height: `${virtualizer.getTotalSize()}px`,
              width: "100%",
              position: "relative",
            }}
          >
            {virtualizer.getVirtualItems().map((virtualRow) => {
              const task = tasks[virtualRow.index];
              return (
                <div
                  key={task.filename}
                  style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    width: "100%",
                    height: `${virtualRow.size}px`,
                    transform: `translateY(${virtualRow.start}px)`,
                  }}
                >
                  <TaskItem
                    task={task}
                    onClick={() => onTaskClick(task)}
                    onComplete={() => onTaskComplete(task)}
                    disabled={disabled}
                  />
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
