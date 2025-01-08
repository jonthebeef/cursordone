'use client'

import { useState, useEffect, useCallback, useTransition } from "react"
import { Task } from "@/lib/tasks"
import { TaskList } from "./task-list"
import { TaskFilters } from "./task-filters"
import { useRouter } from "next/navigation"

interface TasksWrapperProps {
  tasks: Task[]
  epics: { id: string; title: string }[]
  tags: string[]
}

export function TasksWrapper({ tasks, epics, tags }: TasksWrapperProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [selectedEpic, setSelectedEpic] = useState<string | null>(null)
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [currentTasks, setCurrentTasks] = useState<Task[]>([])

  // Update tasks when they change from the server
  useEffect(() => {
    setCurrentTasks(tasks)
  }, [tasks])

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
      <div className="mt-6">
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