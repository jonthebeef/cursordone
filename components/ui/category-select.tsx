import React from "react";
import { TaskCategory } from "@/lib/types/tags";

interface CategorySelectProps {
  value: TaskCategory | undefined;
  onChange: (category: TaskCategory) => void;
  error?: string;
}

export function CategorySelect({
  value,
  onChange,
  error,
}: CategorySelectProps) {
  return (
    <div className="space-y-2">
      <select
        value={value || ""}
        onChange={(e) => onChange(e.target.value as TaskCategory)}
        className={`w-full p-2 border rounded-md ${
          error ? "border-red-500" : "border-gray-300"
        }`}
      >
        <option value="" disabled>
          Select Category
        </option>
        {Object.entries(TaskCategory).map(([key, value]) => (
          <option key={key} value={value}>
            {key.charAt(0) + key.slice(1).toLowerCase()}
          </option>
        ))}
      </select>
      {error && <p className="text-sm text-red-500">{error}</p>}
    </div>
  );
}
