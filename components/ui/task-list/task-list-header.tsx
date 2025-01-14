"use client";

import { Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface TaskListHeaderProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  onCreateClick: () => void;
  sortOption: string;
  onSortChange: (value: string) => void;
  disabled?: boolean;
}

export function TaskListHeader({
  searchQuery,
  onSearchChange,
  onCreateClick,
  sortOption,
  onSortChange,
  disabled,
}: TaskListHeaderProps) {
  const sortOptions = [
    { value: "manual", label: "Default Order" },
    { value: "date-newest", label: "Date Added (Newest)" },
    { value: "date-oldest", label: "Date Added (Oldest)" },
    { value: "priority-high", label: "Priority (High to Low)" },
    { value: "priority-low", label: "Priority (Low to High)" },
  ];

  return (
    <div className="flex flex-col sm:flex-row gap-4">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search tasks..."
          className="w-full pl-9 pr-8 py-1.5 bg-zinc-900/50 border border-zinc-800 rounded-md text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500/20"
        />
        {searchQuery && (
          <button
            onClick={() => onSearchChange("")}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 rounded-sm text-zinc-400 hover:text-zinc-300 focus:outline-none"
            type="button"
            aria-label="Clear search"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>
      <div className="flex gap-4">
        <Select
          value={sortOption}
          onValueChange={onSortChange}
          disabled={disabled}
        >
          <SelectTrigger className="w-[180px] bg-zinc-900/50 border-zinc-800">
            <SelectValue placeholder="Sort by..." />
          </SelectTrigger>
          <SelectContent>
            {sortOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button
          onClick={onCreateClick}
          disabled={disabled}
          className="bg-blue-500 text-white hover:bg-blue-600"
        >
          Create Task
        </Button>
      </div>
    </div>
  );
}
