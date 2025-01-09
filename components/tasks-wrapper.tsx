'use client'

import { useState, useEffect, useCallback, useTransition } from "react"
import { Task } from "@/lib/tasks"
import { TaskList } from "./task-list"
import { TaskFilters } from "./task-filters"
import { useRouter } from "next/navigation"
import { useToast } from "@/components/ui/use-toast"

interface TasksWrapperProps {
  tasks: Task[]
  epics: { id: string; title: string }[]
  tags: string[]
}

export function TasksWrapper({ tasks, epics, tags }: TasksWrapperProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [isPending, startTransition] = useTransition()
  const [selectedEpic, setSelectedEpic] = useState<string | null>(null)
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [currentTasks, setCurrentTasks] = useState<Task[]>([])

  // Update tasks when they change from the server
  useEffect(() => {
    const hasNewTasks = tasks.some(task => !currentTasks.find(ct => ct.filename === task.filename))
    const hasRemovedTasks = currentTasks.some(task => !tasks.find(t => t.filename === task.filename))
    const hasChangedTasks = tasks.some(task => {
      const currentTask = currentTasks.find(ct => ct.filename === task.filename)
      return currentTask && (
        currentTask.status !== task.status ||
        currentTask.title !== task.title ||
        currentTask.priority !== task.priority ||
        currentTask.epic !== task.epic ||
        JSON.stringify(currentTask.tags) !== JSON.stringify(task.tags)
      )
    })
    
    if (hasNewTasks || hasRemovedTasks || hasChangedTasks) {
      setCurrentTasks(tasks)
      if (hasNewTasks) {
        toast({
          title: "🔄 Task list updated",
          description: "New tasks have been added to your list",
          variant: "default",
        })
      } else if (hasChangedTasks) {
        toast({
          title: "🔄 Task list updated",
          description: "Tasks have been modified",
          variant: "default",
        })
      }
    }
  }, [tasks, currentTasks, toast])

  const handleTagSelect = useCallback((tag: string) => {
    setSelectedTags(prev => 
      prev.includes(tag)
        ? prev.filter(t => t !== tag)
        : [...prev, tag]
    )
  }, [])

  const handleEpicSelect = useCallback((epic: string | null) => {
    setSelectedEpic(epic)
  }, [])

  const refresh = useCallback(() => {
    startTransition(() => {
      router.refresh()
    })
  }, [router])

  // Set up automatic refresh interval
  useEffect(() => {
    const interval = setInterval(() => {
      refresh()
    }, 5000) // Check for updates every 5 seconds

    return () => clearInterval(interval)
  }, [refresh])

  return (
    <div className="relative">
      <TaskFilters 
        epics={epics}
        tags={tags}
        selectedEpic={selectedEpic}
        selectedTags={selectedTags}
        onEpicSelect={handleEpicSelect}
        onTagSelect={handleTagSelect}
      />
      <div className="mt-1">
        <TaskList 
          initialTasks={currentTasks} 
          epics={epics}
          selectedEpic={selectedEpic}
          selectedTags={selectedTags}
          onStateChange={refresh}
          disabled={isPending}
        />
      </div>
    </div>
  )
} 