'use client'

import { Task } from "@/lib/tasks"
import { completeTaskAction, deleteTaskAction, updateTaskAction, createTaskAction } from "@/lib/actions"
import { TaskCard } from "@/components/ui/task-card"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { useState, useEffect } from "react"
import { cn } from "@/lib/utils"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Pencil, Trash2, ImagePlus, X, Search, ListTodo, CheckCircle2 } from "lucide-react"
import ReactMarkdown from 'react-markdown'
import { DndContext, DragEndEvent, closestCenter } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Checkbox } from "@/components/ui/checkbox"
import { useToast } from "@/components/ui/use-toast"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { TagInput } from "@/components/ui/tag-input"
import { SearchInput } from "@/components/ui/search-input"

interface TaskListProps {
  initialTasks: Task[]
  epics: { id: string; title: string }[]
  selectedEpic: string | null
  selectedTags: string[]
  onStateChange?: () => void
  disabled?: boolean
}

export function TaskList({ initialTasks, epics, selectedEpic, selectedTags, onStateChange, disabled }: TaskListProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [searchQuery, setSearchQuery] = useState('')
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [tasks] = useState(initialTasks)
  const [openSections, setOpenSections] = useState<string[]>(["backlog", "done"])

  // Log search state changes
  useEffect(() => {
    console.log('Search query:', searchQuery)
  }, [searchQuery])

  // Filter tasks based on search query
  const filteredTasks = searchQuery
    ? tasks.filter(task => 
        task.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        task.content?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : tasks

  const backlogTasks = filteredTasks.filter(task => task.status !== 'done')
  const doneTasks = filteredTasks.filter(task => task.status === 'done')

  const handleComplete = async (filename: string) => {
    if (disabled) return
    try {
      await completeTaskAction(filename)
      onStateChange?.()
    } catch (error) {
      console.error('Failed to complete task:', error)
    }
  }

  return (
    <div className="relative">
      <div>
        <header className="fixed top-0 right-0 left-0 lg:left-[250px] flex items-center justify-between px-6 py-2 bg-[#18181b] z-10">
          <div className="relative w-[320px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search tasks..."
              className="w-full pl-9 pr-8 py-1.5 bg-zinc-900/50 border border-zinc-800 rounded-md text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500/20"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 bg-transparent border-0 p-1 text-zinc-400"
                type="button"
              >
                ✕
              </button>
            )}
          </div>
          <Button
            onClick={() => setShowCreateDialog(true)}
            className="bg-blue-500 text-white hover:bg-blue-600 whitespace-nowrap mr-12"
          >
            Create Task
          </Button>
        </header>

        <main className="pt-[52px] px-4">
          <Accordion 
            type="multiple" 
            value={openSections}
            onValueChange={setOpenSections}
            className="space-y-4"
          >
            <AccordionItem value="backlog" className="border-none">
              <AccordionTrigger className="hover:no-underline">
                <h2 className="text-xl font-medium tracking-tight text-zinc-100 font-mono flex items-center gap-2">
                  <ListTodo className="w-5 h-5" />
                  Backlog ({backlogTasks.length})
                </h2>
              </AccordionTrigger>
              <AccordionContent>
                <div className="pt-4">
                  <DndContext collisionDetection={closestCenter}>
                    <SortableContext items={backlogTasks.map(t => t.filename)} strategy={verticalListSortingStrategy}>
                      <div className="space-y-4">
                        {backlogTasks.map((task, index) => (
                          <TaskCard
                            key={task.filename}
                            task={task}
                            onComplete={handleComplete}
                            onClick={() => {}}
                          />
                        ))}
                      </div>
                    </SortableContext>
                  </DndContext>
                </div>
              </AccordionContent>
            </AccordionItem>

            {doneTasks.length > 0 && (
              <AccordionItem value="done" className="border-none">
                <AccordionTrigger className="hover:no-underline">
                  <h2 className="text-xl font-medium tracking-tight text-zinc-100 font-mono flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5" />
                    Done ({doneTasks.length})
                  </h2>
                </AccordionTrigger>
                <AccordionContent>
                  <div className="pt-4">
                    <DndContext collisionDetection={closestCenter}>
                      <SortableContext items={doneTasks.map(t => t.filename)} strategy={verticalListSortingStrategy}>
                        <div className="space-y-4">
                          {doneTasks.map((task, index) => (
                            <TaskCard
                              key={task.filename}
                              task={task}
                              onComplete={handleComplete}
                              onClick={() => {}}
                            />
                          ))}
                        </div>
                      </SortableContext>
                    </DndContext>
                  </div>
                </AccordionContent>
              </AccordionItem>
            )}
          </Accordion>
        </main>
      </div>
    </div>
  )
} 