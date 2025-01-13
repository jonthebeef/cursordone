import { Suspense } from 'react'
import { getAllTasks } from '@/lib/tasks'
import { getAllEpics } from '@/lib/epics'
import { TasksWrapper } from '@/components/tasks-wrapper'
import { AuthCheck } from '@/components/auth/auth-check'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function HomePage() {
  const tasks = await getAllTasks()
  const epics = await getAllEpics()

  // Get unique tags from all tasks
  const tags = Array.from(new Set(
    tasks.flatMap(task => task.tags || [])
      .filter(tag => tag && tag.trim() !== '')
  ))

  return (
    <AuthCheck>
      <Suspense fallback={
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-zinc-400">Loading...</div>
        </div>
      }>
        <div className="py-8">
          <TasksWrapper 
            tasks={tasks} 
            epics={epics.map(epic => ({ id: epic.id, title: epic.title }))}
            tags={tags}
          />
        </div>
      </Suspense>
    </AuthCheck>
  )
}
