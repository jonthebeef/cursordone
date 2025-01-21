"use server";

import path from "path";
import fs from "fs/promises";
import { Tag } from "@/lib/tags/types";
import matter from "gray-matter";

const CACHE_FILE = path.join(process.cwd(), "tags.json");
const TASKS_DIR = path.join(process.cwd(), "tasks");

interface TagMetadata {
  name: string;
  usageCount: number;
  lastUsed: string;
  tasks: string[]; // List of task filenames using this tag
}

interface TagCache {
  tags: Record<string, TagMetadata>;
  quickAccess: {
    mostUsed: string[]; // Top 10 most used tags
    recentlyUsed: string[]; // Last 10 used tags
  };
}

// Initialize cache by scanning task files
async function initializeCache(): Promise<void> {
  const cache: TagCache = {
    tags: {},
    quickAccess: {
      mostUsed: [],
      recentlyUsed: [],
    },
  };

  try {
    // Read all task files
    const files = await fs.readdir(TASKS_DIR);
    const taskFiles = files.filter((f) => f.endsWith(".md"));

    for (const file of taskFiles) {
      const content = await fs.readFile(path.join(TASKS_DIR, file), "utf-8");
      const { data } = matter(content);

      if (data.tags && Array.isArray(data.tags)) {
        for (const tag of data.tags) {
          const tagName = tag.toLowerCase();
          if (!cache.tags[tagName]) {
            cache.tags[tagName] = {
              name: tagName,
              usageCount: 0,
              lastUsed: new Date().toISOString(),
              tasks: [],
            };
          }

          cache.tags[tagName].usageCount++;
          if (!cache.tags[tagName].tasks.includes(file)) {
            cache.tags[tagName].tasks.push(file);
          }
        }
      }
    }

    // Update quick access lists
    const sortedTags = Object.entries(cache.tags)
      .sort(([, a], [, b]) => b.usageCount - a.usageCount)
      .map(([name]) => name);

    cache.quickAccess.mostUsed = sortedTags.slice(0, 10);
    cache.quickAccess.recentlyUsed = sortedTags.slice(0, 10);

    await fs.writeFile(CACHE_FILE, JSON.stringify(cache, null, 2));
  } catch (error) {
    console.error("Failed to initialize cache:", error);
  }
}

// Ensure cache file exists and is populated
async function ensureCacheFile(): Promise<void> {
  try {
    await fs.access(CACHE_FILE);
    const data = await fs.readFile(CACHE_FILE, "utf-8");
    const cache = JSON.parse(data);
    if (Object.keys(cache.tags).length === 0) {
      await initializeCache();
    }
  } catch {
    await initializeCache();
  }
}

// Read the current tag cache
async function getTagCache(): Promise<TagCache> {
  await ensureCacheFile();
  try {
    const data = await fs.readFile(CACHE_FILE, "utf-8");
    return JSON.parse(data);
  } catch (error) {
    console.error("Failed to read tag cache:", error);
    return { tags: {}, quickAccess: { mostUsed: [], recentlyUsed: [] } };
  }
}

// Save updated tag cache
async function saveTagCache(cache: TagCache): Promise<void> {
  try {
    await fs.writeFile(CACHE_FILE, JSON.stringify(cache, null, 2));
  } catch (error) {
    console.error("Failed to save tag cache:", error);
  }
}

// Update tag usage
export async function updateTagUsage(
  name: string,
  taskId?: string,
): Promise<void> {
  const cache = await getTagCache();
  const now = new Date().toISOString();

  if (!cache.tags[name]) {
    cache.tags[name] = {
      name,
      usageCount: 0,
      lastUsed: now,
      tasks: [],
    };
  }

  const tag = cache.tags[name];
  tag.usageCount++;
  tag.lastUsed = now;

  if (taskId && !tag.tasks.includes(taskId)) {
    tag.tasks.push(taskId);
  }

  // Update quick access lists
  updateQuickAccessLists(cache, name);
  await saveTagCache(cache);
}

// Get tag suggestions based on input
export async function getTagSuggestions(input: string): Promise<string[]> {
  const cache = await getTagCache();
  const query = input.toLowerCase();

  // Get matching tags
  const matches = Object.values(cache.tags)
    .filter((tag) => tag.name.includes(query))
    .sort((a, b) => b.usageCount - a.usageCount)
    .map((tag) => tag.name);

  // If no direct matches, return quick access lists
  if (matches.length === 0 && !query) {
    return [
      ...cache.quickAccess.recentlyUsed,
      ...cache.quickAccess.mostUsed.filter(
        (tag) => !cache.quickAccess.recentlyUsed.includes(tag),
      ),
    ];
  }

  return matches;
}

// Helper function to generate tag ID
function generateTagId(name: string): string {
  return `tag_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// Helper function to update quick access lists
function updateQuickAccessLists(cache: TagCache, tagName: string): void {
  // Update most used list
  cache.quickAccess.mostUsed = Object.entries(cache.tags)
    .sort(([, a], [, b]) => b.usageCount - a.usageCount)
    .map(([name]) => name)
    .slice(0, 10);

  // Update recently used list
  cache.quickAccess.recentlyUsed = [
    tagName,
    ...cache.quickAccess.recentlyUsed.filter((t) => t !== tagName),
  ].slice(0, 10);
}
