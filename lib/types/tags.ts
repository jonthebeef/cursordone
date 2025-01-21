/**
 * Tag and Category type definitions
 */

/**
 * Fixed set of task categories
 */
export enum TaskCategory {
  CHORE = "chore",
  BUG = "bug",
  ITERATION = "iteration",
  FEATURE = "feature",
}

/**
 * Tag metadata structure
 */
export interface Tag {
  id: string;
  name: string;
  createdAt: Date;
  usageCount: number;
}

/**
 * Task metadata including category and tags
 */
export interface TaskMetadata {
  category: TaskCategory; // Single, required category
  tags: string[]; // Multiple, optional tags
}

/**
 * Tag validation rules
 */
export const TAG_VALIDATION = {
  MAX_LENGTH: 50,
  ALLOWED_CHARS: /^[a-z0-9-]+$/, // Lowercase, numbers, hyphens only
} as const;
