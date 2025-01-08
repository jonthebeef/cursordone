import { getAllTasks } from "@/lib/tasks"
import { getAllEpics } from "@/lib/epics"
import { TasksWrapper } from "@/components/tasks-wrapper"

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function Home() {
  const tasks = await getAllTasks()
  const epics = await getAllEpics()
  
  // Get unique tags from all tasks
  const tags = Array.from(new Set(
    tasks.flatMap(task => task.tags || [])
      .filter(tag => tag && tag.trim() !== '')
  ))

  return (
    <div className="py-8">
      <TasksWrapper 
        tasks={tasks} 
        epics={epics.map(epic => ({ id: epic.id, title: epic.title }))}
        tags={tags}
      />
    </div>
  )
}
