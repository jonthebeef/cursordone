import { Suspense } from "react";
import { getAllTasks } from "@/lib/tasks";
import { getAllEpics } from "@/lib/epics";
import { TasksWrapper } from "@/components/tasks-wrapper";
import { AuthCheck } from "@/components/auth/auth-check";
import { SideNav } from "@/components/ui/side-nav";
import { ErrorBoundary } from "react-error-boundary";
import { ErrorFallback } from "@/components/ui/error-fallback";
import type { Task } from "@/lib/tasks";
import type { Epic } from "@/lib/epics";

export const dynamic = "force-dynamic";
export const revalidate = 0;

// Simplified page to minimize potential errors
export default async function HomePage() {
  return (
    <AuthCheck>
      <div className="relative h-full">
        <SideNav />
        <main className="lg:pl-64">
          <div className="max-w-[840px] mx-auto p-4">
            <ErrorBoundary FallbackComponent={ErrorFallback}>
              <TaskContent />
            </ErrorBoundary>
          </div>
        </main>
      </div>
    </AuthCheck>
  );
}

// Separate component to handle data loading
async function TaskContent() {
  let tasks: Task[] = [];
  let epics: Epic[] = [];

  try {
    tasks = await getAllTasks();
    epics = await getAllEpics();
  } catch (error) {
    console.error("Error loading tasks or epics:", error);
    return (
      <div className="py-8">
        <div className="bg-red-50 text-red-800 p-4 rounded-md">
          <h2 className="text-lg font-semibold mb-2">Data loading error</h2>
          <p>
            There was an error loading the tasks and epics. Please try
            refreshing the page.
          </p>
        </div>
      </div>
    );
  }

  // Get unique tags from all tasks
  const tags = Array.from(
    new Set(
      tasks
        .flatMap((task) => task.tags || [])
        .filter((tag) => tag && tag.trim() !== ""),
    ),
  );

  return (
    <div className="py-8">
      <Suspense
        fallback={
          <div className="flex items-center justify-center min-h-screen">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-zinc-50"></div>
          </div>
        }
      >
        <TasksWrapper
          tasks={tasks}
          epics={epics.map((epic) => ({
            id: epic.id,
            title: epic.title,
          }))}
          tags={tags}
        />
      </Suspense>
    </div>
  );
}
