import { Tag, TAG_VALIDATION } from "../types/tags";

/**
 * In-memory tag storage for development
 * TODO: Replace with proper database storage
 */
let tags: Map<string, Tag> = new Map();

// Initialize with some default tags
const defaultTags = [
  "bug",
  "feature",
  "enhancement",
  "documentation",
  "testing",
  "ui",
  "backend",
  "frontend",
  "api",
  "database",
];

// Initialize default tags if storage is empty
async function initializeDefaultTags() {
  if (tags.size === 0) {
    for (const tagName of defaultTags) {
      try {
        await createTag(tagName);
      } catch (error) {
        console.error(`Failed to create default tag ${tagName}:`, error);
      }
    }
  }
}

// Initialize tags
initializeDefaultTags();

/**
 * Create a new tag
 */
export async function createTag(name: string): Promise<Tag> {
  // Validate tag name
  if (!isValidTagName(name)) {
    throw new Error("Invalid tag name");
  }

  // Check for duplicates (case insensitive)
  const normalizedName = name.toLowerCase();
  if (await getTagByName(normalizedName)) {
    throw new Error("Tag already exists");
  }

  const tag: Tag = {
    id: generateId(),
    name: normalizedName,
    createdAt: new Date(),
    usageCount: 0,
  };

  tags.set(tag.id, tag);
  return tag;
}

/**
 * Get a tag by its ID
 */
export async function getTag(id: string): Promise<Tag | undefined> {
  return tags.get(id);
}

/**
 * Get a tag by its name (case insensitive)
 */
export async function getTagByName(name: string): Promise<Tag | undefined> {
  const normalizedName = name.toLowerCase();
  return Array.from(tags.values()).find(
    (tag) => tag.name.toLowerCase() === normalizedName,
  );
}

/**
 * Search for tags matching a query
 */
export async function searchTags(query: string): Promise<Tag[]> {
  const normalizedQuery = query.toLowerCase();
  return Array.from(tags.values())
    .filter((tag) => tag.name.includes(normalizedQuery))
    .sort((a, b) => {
      // Exact matches first
      if (a.name === normalizedQuery) return -1;
      if (b.name === normalizedQuery) return 1;
      // Then by usage count
      return b.usageCount - a.usageCount;
    });
}

/**
 * Increment a tag's usage count
 */
export async function incrementTagUsage(id: string): Promise<void> {
  const tag = tags.get(id);
  if (tag) {
    tag.usageCount++;
    tags.set(id, tag);
  }
}

/**
 * Delete a tag
 */
export async function deleteTag(id: string): Promise<void> {
  tags.delete(id);
}

/**
 * Validate a tag name against our rules
 */
function isValidTagName(name: string): boolean {
  return (
    name.length > 0 &&
    name.length <= TAG_VALIDATION.MAX_LENGTH &&
    TAG_VALIDATION.ALLOWED_CHARS.test(name)
  );
}

/**
 * Generate a unique ID for a tag
 */
function generateId(): string {
  return Math.random().toString(36).substr(2, 9);
}

/**
 * Get all tags
 */
export async function getAllTags(): Promise<Tag[]> {
  return Array.from(tags.values());
}

/**
 * Clear all tags (for testing)
 */
export function __clearTagsForTesting(): void {
  tags = new Map();
}
