import { Task } from "../tasks";

// Helper type for dependency operations
export type TaskDependency = {
  filename: string;
  exists: boolean;
};

// Utility functions for dependency operations
export function normalizeDependencyFilename(filename: string): string {
  // Remove .md if present, we'll add it when needed
  return filename.replace(/\.md$/, '');
}

export function getDependencyFilename(filename: string): string {
  // Always ensure .md extension
  return `${normalizeDependencyFilename(filename)}.md`;
}

export function resolveDependency(dependency: string, tasks: Task[]): TaskDependency {
  const normalizedFilename = normalizeDependencyFilename(dependency);
  const fullFilename = getDependencyFilename(normalizedFilename);
  
  return {
    filename: normalizedFilename, // Store normalized (without .md)
    exists: tasks.some(t => t.filename === fullFilename)
  };
}

export function resolveDependencies(dependencies: string[] = [], tasks: Task[]): TaskDependency[] {
  return dependencies.map(dep => resolveDependency(dep, tasks));
} 