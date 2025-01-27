import { Suspense } from 'react'
import { getAllTasks } from '@/lib/tasks'
import { getAllEpics } from '@/lib/epics'
import { TasksWrapper } from '@/components/tasks-wrapper'

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
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-zinc-50"></div>
      </div>
    }>
      <TasksWrapper tasks={tasks} epics={epics} tags={tags} />
    </Suspense>
  )
}
