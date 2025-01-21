export interface Tag {
  id: string;
  name: string;
  createdAt: string;
  usageCount: number;
}

export enum TaskCategory {
  CHORE = "chore",
  BUG = "bug",
  ITERATION = "iteration",
  FEATURE = "feature",
}

// Validation rules
export const TAG_VALIDATION = {
  maxLength: 50,
  allowedChars: /^[a-z0-9-]+$/, // Lowercase letters, numbers, and hyphens only
};
