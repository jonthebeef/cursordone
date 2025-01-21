import React, { useState, useEffect, useRef } from "react";
import { Tag, TAG_VALIDATION } from "@/lib/tags/types";
import { getTagSuggestions, updateTagUsage } from "@/lib/tags/cache";
import { cn } from "@/lib/utils";
import { X } from "lucide-react";

interface TagInputProps {
  selectedTags: string[];
  onTagsChange: (tags: string[]) => void;
  error?: string;
  onDropdownOpenChange?: (isOpen: boolean) => void;
}

export function TagInput({
  selectedTags = [],
  onTagsChange,
  error,
  onDropdownOpenChange,
}: TagInputProps) {
  const [input, setInput] = useState("");
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  // Notify parent of dropdown state changes
  useEffect(() => {
    onDropdownOpenChange?.(isOpen);
  }, [isOpen, onDropdownOpenChange]);

  // Fetch suggestions when input changes
  useEffect(() => {
    const fetchSuggestions = async () => {
      if (!input.trim()) {
        setSuggestions([]);
        return;
      }
      try {
        const results = await getTagSuggestions(input);
        // Filter out already selected tags
        const filteredResults = results.filter(
          (tag) => !selectedTags.includes(tag),
        );
        setSuggestions(filteredResults);
        setSelectedIndex(0);
      } catch (error) {
        console.error("Failed to fetch tag suggestions:", error);
        setSuggestions([]);
      }
    };

    fetchSuggestions();
  }, [input, selectedTags]);

  // Validate tag name
  const isValidTag = (name: string): boolean => {
    return (
      name.length <= TAG_VALIDATION.maxLength &&
      TAG_VALIDATION.allowedChars.test(name)
    );
  };

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape" && isOpen) {
      e.preventDefault();
      e.stopPropagation();
      setIsOpen(false);
      return;
    }

    if (!isOpen) {
      return;
    }

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setSelectedIndex((prev) => Math.min(prev + 1, suggestions.length - 1));
        break;
      case "ArrowUp":
        e.preventDefault();
        setSelectedIndex((prev) => Math.max(prev - 1, 0));
        break;
      case "Tab":
      case "Enter":
        e.preventDefault();
        if (selectedIndex >= 0 && selectedIndex < suggestions.length) {
          handleSelectTag(suggestions[selectedIndex]);
        } else if (input.trim() && isValidTag(input)) {
          handleSelectTag(input.trim().toLowerCase());
        }
        break;
    }
  };

  const handleSelectTag = async (tagName: string) => {
    try {
      await updateTagUsage(tagName, "new");
      onTagsChange([...selectedTags, tagName]);
      setInput("");
      setIsOpen(false);
    } catch (error) {
      console.error("Failed to create tag:", error);
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    onTagsChange(selectedTags.filter((tag) => tag !== tagToRemove));
  };

  return (
    <div
      className="relative w-full"
      onKeyDown={(e) => {
        if (e.key === "Escape" && isOpen) {
          e.preventDefault();
          e.stopPropagation();
          setIsOpen(false);
        }
      }}
    >
      <input
        ref={inputRef}
        type="text"
        value={input}
        onChange={(e) => {
          setInput(e.target.value);
          setIsOpen(true);
        }}
        onKeyDown={handleKeyDown}
        onFocus={() => setIsOpen(true)}
        className={cn(
          "w-full bg-zinc-900 text-zinc-100 rounded-md border border-zinc-800 px-3 py-2",
          error && "border-red-500",
          "focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500/20",
        )}
        placeholder="Enter tags separated by commas"
      />
      {isOpen && suggestions.length > 0 && (
        <div className="absolute w-full mt-1 bg-zinc-900 border border-zinc-800 rounded-md shadow-lg z-50 max-h-[200px] overflow-y-auto">
          {suggestions.map((suggestion, index) => (
            <div
              key={suggestion}
              className={cn(
                "px-3 py-2 cursor-pointer text-zinc-100",
                index === selectedIndex ? "bg-zinc-800" : "hover:bg-zinc-800",
              )}
              onClick={() => handleSelectTag(suggestion)}
            >
              {suggestion}
            </div>
          ))}
        </div>
      )}
      {selectedTags.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-2">
          {selectedTags.map((tag) => (
            <span
              key={tag}
              className="bg-zinc-800/50 text-zinc-100 px-2 py-1 rounded-md text-sm flex items-center gap-1.5"
            >
              {tag}
              <button
                type="button"
                onClick={() => handleRemoveTag(tag)}
                className="text-zinc-400 hover:text-red-400 transition-colors"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
        </div>
      )}
      {error && <p className="text-sm text-red-500">{error}</p>}
    </div>
  );
}
