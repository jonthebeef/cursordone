import React, { useState } from 'react';
import { TaskCategory } from '@/lib/types/tags';
import { CategorySelect } from './ui/category-select';
import { TagInput } from './ui/tag-input';

interface TaskFormProps {
  onSubmit: (data: {
    title: string;
    category: TaskCategory;
    tags: string[];
  }) => void;
  initialData?: {
    title: string;
    category?: TaskCategory;
    tags: string[];
  };
}

export function TaskForm({ onSubmit, initialData }: TaskFormProps) {
  const [title, setTitle] = useState(initialData?.title || '');
  const [category, setCategory] = useState<TaskCategory | undefined>(
    initialData?.category
  );
  const [tags, setTags] = useState<string[]>(initialData?.tags || []);
  const [errors, setErrors] = useState<{
    title?: string;
    category?: string;
    tags?: string;
  }>({});

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validate
    const newErrors: typeof errors = {};
    if (!title.trim()) {
      newErrors.title = 'Title is required';
    }
    if (!category) {
      newErrors.category = 'Category is required';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    // Submit if valid
    onSubmit({
      title: title.trim(),
      category: category!,
      tags
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Title input */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">
          Title
        </label>
        <input
          type="text"
          value={title}
          onChange={e => setTitle(e.target.value)}
          className={`w-full p-2 border rounded-md ${
            errors.title ? 'border-red-500' : 'border-gray-300'
          }`}
        />
        {errors.title && (
          <p className="text-sm text-red-500">{errors.title}</p>
        )}
      </div>

      {/* Category selector */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">
          Category
        </label>
        <CategorySelect
          value={category}
          onChange={setCategory}
          error={errors.category}
        />
      </div>

      {/* Tag input */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">
          Tags
        </label>
        <TagInput
          selectedTags={tags}
          onTagsChange={setTags}
          error={errors.tags}
        />
      </div>

      {/* Submit button */}
      <button
        type="submit"
        className="px-4 py-2 text-white bg-blue-500 rounded-md hover:bg-blue-600"
      >
        Save Task
      </button>
    </form>
  );
} 