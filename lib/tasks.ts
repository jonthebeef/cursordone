"use server";

import fs from "fs";
import path from "path";
import matter from "gray-matter";
import { getNextRef, markRefAsUnused } from "./ref-counter";
import { TaskCategory } from "@/lib/types/tags";
import { normalizeDependencyFilename } from "@/lib/utils/dependencies";

export interface Task {
  id?: string;
  ref: string;
  filename: string;
  title: string;
  status: "todo" | "in-progress" | "done";
  priority: "low" | "medium" | "high";
  complexity?: "XS" | "S" | "M" | "L" | "XL";
  category: TaskCategory;
  epic?: string;
  owner: string;
  worker?: string;
  started_date?: string;
  completion_date?: string;
  parent?: string;
  dependencies?: string[];
  tags?: string[];
  created: string;
  content?: string;
}

interface TaskFrontmatter {
  ref: string;
  title: string;
  status: Task["status"];
  priority: Task["priority"];
  complexity?: Task["complexity"];
  category: TaskCategory;
  epic?: string;
  owner: string;
  worker?: string;
  started_date?: string;
  completion_date?: string;
  parent?: string;
  dependencies?: string[];
  tags?: string[];
  created: string;
}

const TASKS_DIR = path.join(process.cwd(), "tasks");

export async function getAllTasks(): Promise<Task[]> {
  console.log("\n=== Loading Tasks ===");

  // Ensure directory exists
  if (!fs.existsSync(TASKS_DIR)) {
    fs.mkdirSync(TASKS_DIR, { recursive: true });
  }

  // Get all markdown files
  const files = fs
    .readdirSync(TASKS_DIR)
    .filter((file) => file.endsWith(".md"));

  console.log("Found files:", files.length);

  // Parse all tasks
  const tasks: Task[] = [];

  for (const file of files) {
    const content = fs.readFileSync(path.join(TASKS_DIR, file), "utf8");
    const { data, content: markdown } = matter(content);

    tasks.push({
      filename: file,
      ...data,
      content: markdown.trim(),
    } as Task);
  }

  console.log("Loaded tasks:", tasks.length);
  console.log(
    "Tasks with dependencies:",
    tasks.filter((t) => t.dependencies && t.dependencies.length > 0).length,
  );
  console.log("=== End Loading Tasks ===\n");

  // Quietly validate dependencies without logging
  for (const task of tasks) {
    if (task.dependencies) {
      task.dependencies = task.dependencies.map((dep) =>
        normalizeDependencyFilename(dep),
      );
    }
  }

  return tasks;
}

export async function completeTask(filename: string): Promise<void> {
  const task = await getTask(filename);
  if (!task) throw new Error(`Task not found: ${filename}`);

  // Handle status change
  task.status = task.status === "done" ? "todo" : "done";

  // If moving to todo, clear started_date and worker
  if (task.status === "todo") {
    task.started_date = undefined;
    task.worker = undefined;
  }

  // Update the file
  const filePath = path.join(TASKS_DIR, filename);
  await fs.promises.writeFile(filePath, await serializeTask(task));
}

export async function updateTaskStatus(
  filename: string,
  newStatus: Task["status"],
  worker?: string,
): Promise<void> {
  const task = await getTask(filename);
  if (!task) throw new Error(`Task not found: ${filename}`);

  // Handle status change
  const oldStatus = task.status;
  task.status = newStatus;

  // If moving to in-progress, set started_date and worker
  if (newStatus === "in-progress" && oldStatus !== "in-progress") {
    task.started_date = new Date().toISOString().split("T")[0];
    task.worker = worker || "user";
  }

  // If moving to done, set completion_date
  if (newStatus === "done" && oldStatus !== "done") {
    task.completion_date = new Date().toISOString().split("T")[0];
  }

  // If moving back to todo, clear all tracking dates and worker
  if (newStatus === "todo") {
    task.started_date = undefined;
    task.completion_date = undefined;
    task.worker = undefined;
  }

  // Update the file
  const filePath = path.join(TASKS_DIR, filename);
  await fs.promises.writeFile(filePath, await serializeTask(task));
}

export async function createTask(
  task: Omit<Task, "filename" | "content" | "ref"> & { content: string },
): Promise<string> {
  // Validate required fields
  const requiredFields = [
    "title",
    "status",
    "priority",
    "owner",
    "created",
  ] as const;
  for (const field of requiredFields) {
    if (!task[field]) {
      throw new Error(`Missing required field: ${field}`);
    }
  }

  const filename = `${task.title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-${Date.now()}.md`;
  const filePath = path.join(TASKS_DIR, filename);

  const frontmatter: TaskFrontmatter = {
    ref: getNextRef(),
    title: task.title,
    status: task.status,
    priority: task.priority,
    complexity: task.complexity,
    category: task.category,
    epic: task.epic?.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
    owner: task.owner,
    parent: task.parent,
    dependencies: task.dependencies || [],
    tags: task.tags || [],
    created: task.created,
  };

  // Remove undefined values to prevent YAML errors
  Object.keys(frontmatter).forEach((key) => {
    const k = key as keyof TaskFrontmatter;
    if (frontmatter[k] === undefined) {
      delete frontmatter[k];
    }
  });

  const fileContent = matter.stringify(task.content, frontmatter);
  fs.writeFileSync(filePath, fileContent);
  return filename;
}

export async function updateTask(
  filename: string,
  task: Omit<Task, "filename">,
) {
  const filePath = path.join(TASKS_DIR, filename);

  const frontmatter: TaskFrontmatter = {
    ref: task.ref,
    title: task.title,
    status: task.status,
    priority: task.priority,
    complexity: task.complexity,
    category: task.category,
    epic: task.epic,
    owner: task.owner,
    worker: task.worker,
    started_date: task.started_date,
    completion_date: task.completion_date,
    parent: task.parent,
    dependencies: task.dependencies || [],
    tags: task.tags || [],
    created: task.created,
  };

  // Remove undefined values to prevent YAML errors
  Object.keys(frontmatter).forEach((key) => {
    const k = key as keyof TaskFrontmatter;
    if (frontmatter[k] === undefined) {
      delete frontmatter[k];
    }
  });

  const fileContent = matter.stringify(task.content || "", frontmatter);
  await fs.promises.writeFile(filePath, fileContent);
}

export async function deleteTask(filename: string) {
  const filePath = path.join(TASKS_DIR, filename);
  if (fs.existsSync(filePath)) {
    // Get the task's content before deleting
    const content = fs.readFileSync(filePath, "utf8");
    const { data, content: markdown } = matter(content);

    // Handle ref cleanup
    if (data.ref) {
      markRefAsUnused(data.ref);
    }

    // Find and delete associated images
    const imageRegex = /!\[.*?\]\(\/task-images\/(.*?)\)/g;
    const matches = [...markdown.matchAll(imageRegex)];

    if (matches.length > 0) {
      const imagesDir = path.join(process.cwd(), "public", "task-images");
      for (const match of matches) {
        const imagePath = path.join(imagesDir, match[1]);
        try {
          if (fs.existsSync(imagePath)) {
            fs.unlinkSync(imagePath);
            console.log(`Deleted image: ${match[1]}`);
          }
        } catch (error) {
          console.error(`Failed to delete image ${match[1]}:`, error);
        }
      }
    }

    // Delete the task file
    fs.unlinkSync(filePath);
  }
}

async function getTask(filename: string): Promise<Task | null> {
  try {
    const filepath = path.join(TASKS_DIR, path.basename(filename));
    if (!fs.existsSync(filepath)) return null;

    const content = await fs.promises.readFile(filepath, "utf-8");
    const { data, content: markdown } = matter(content);
    return {
      filename: path.basename(filename),
      ...data,
      content: markdown.trim(),
    } as Task;
  } catch (error) {
    console.error("Error reading task:", error);
    return null;
  }
}

async function serializeTask(task: Task): Promise<string> {
  // Destructure and prefix unused variables with underscore
  const { content, filename: _filename, ...frontMatter } = task;

  // Remove undefined values to prevent YAML errors
  Object.keys(frontMatter).forEach((key) => {
    const k = key as keyof typeof frontMatter;
    if (frontMatter[k] === undefined) {
      delete frontMatter[k];
    }
  });

  return matter.stringify(content || "", frontMatter);
}
