'use client'

import { Task } from "@/lib/tasks"
import { completeTaskAction, deleteTaskAction, updateTaskAction, createTaskAction, saveTaskOrderAction } from "@/lib/actions"
import { TaskCard } from "./task-card"
import { SortableTaskCard } from "./sortable-task-card"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { useState, useEffect, useRef, useMemo } from "react"
import { cn } from "@/lib/utils"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Pencil, Trash2, ImagePlus, X, Search, ListTodo, CheckCircle2, Hash, Folder, ArrowUpDown } from "lucide-react"
import ReactMarkdown from 'react-markdown'
import { DndContext, DragEndEvent, closestCenter } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { Checkbox } from "@/components/ui/checkbox"
import { useToast } from "@/components/ui/use-toast"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { TagInput } from "@/components/ui/tag-input"
import { SearchInput } from "@/components/ui/search-input"
import { getOrderKey } from '@/lib/task-order'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

const sortOptions = [
  { value: 'manual', label: 'Default Order' },
  { value: 'date-newest', label: 'Date Added (Newest)' },
  { value: 'date-oldest', label: 'Date Added (Oldest)' },
  { value: 'priority-high', label: 'Priority (High to Low)' },
  { value: 'priority-low', label: 'Priority (Low to High)' },
] as const

type SortOption = typeof sortOptions[number]['value']

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
  const [selectedTask, setSelectedTask] = useState<Task | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [editedTask, setEditedTask] = useState<Task | null>(null)
  const [editTagInput, setEditTagInput] = useState('')
  const [isDeleting, setIsDeleting] = useState(false)
  const [showDeleteAlert, setShowDeleteAlert] = useState(false)
  const [taskOrder, setTaskOrder] = useState<string[]>(initialTasks.map(t => t.filename))
  const [openSections, setOpenSections] = useState<string[]>(["backlog", "done"])
  const [isInitialized, setIsInitialized] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [isCreating, setIsCreating] = useState(false)
  const [sortOption, setSortOption] = useState<SortOption>('manual')
  const [newTask, setNewTask] = useState<Omit<Task, 'ref' | 'filename'> & { content: string }>({
    id: '0',
    title: '',
    priority: 'medium',
    status: 'todo',
    content: '',
    created: '',
    dependencies: []
  })
  const [tagInput, setTagInput] = useState('')

  // Filter tasks for dependencies
  const filteredDependencyTasks = useMemo(() => {
    const query = searchQuery.toLowerCase()
    return initialTasks.filter(task => 
      (task.title.toLowerCase().includes(query) || 
       (task.ref && task.ref.toLowerCase().includes(query))) && 
      task.id !== newTask.id
    )
  }, [searchQuery, initialTasks, newTask.id])

  // Load task order when component mounts or filters change
  useEffect(() => {
    const loadTaskOrder = async () => {
      try {
        const response = await fetch(`/api/task-order?epic=${selectedEpic || ''}&tags=${selectedTags.join(',')}`)
        if (!response.ok) throw new Error('Failed to load task order')
        const data = await response.json()
        
        // Only update if we have a valid order and it's different from current
        if (Array.isArray(data.order) && data.order.length > 0) {
          setTaskOrder(data.order)
        } else {
          // If no saved order, use the order from initialTasks
          setTaskOrder(initialTasks.map(t => t.filename))
        }
      } catch (error) {
        console.error('Failed to load task order:', error)
        // Fallback to initialTasks order
        setTaskOrder(initialTasks.map(t => t.filename))
      }
    }

    loadTaskOrder()
  }, [selectedEpic, selectedTags, initialTasks])

  // Filter tasks based on search query
  const filteredTasks = useMemo(() => {
    if (!searchQuery) return initialTasks
    const searchLower = searchQuery.toLowerCase()
    return initialTasks.filter(task => 
      task.title.toLowerCase().includes(searchLower) ||
      task.content?.toLowerCase().includes(searchLower) ||
      task.ref?.toLowerCase().includes(searchLower) ||
      task.epic?.toLowerCase().includes(searchLower) ||
      task.tags?.some(tag => tag.toLowerCase().includes(searchLower))
    )
  }, [initialTasks, searchQuery])

  // Sort filtered tasks based on current sort option
  const sortedFilteredTasks = useMemo(() => {
    const tasks = [...filteredTasks]
    
    switch (sortOption) {
      case 'date-newest':
        return tasks.sort((a, b) => new Date(b.created).getTime() - new Date(a.created).getTime())
      case 'date-oldest':
        return tasks.sort((a, b) => new Date(a.created).getTime() - new Date(b.created).getTime())
      case 'priority-high':
        return tasks.sort((a, b) => {
          const priorityOrder = { high: 0, medium: 1, low: 2 }
          return priorityOrder[a.priority] - priorityOrder[b.priority]
        })
      case 'priority-low':
        return tasks.sort((a, b) => {
          const priorityOrder = { high: 0, medium: 1, low: 2 }
          return priorityOrder[b.priority] - priorityOrder[a.priority]
        })
      default:
        // Manual order using taskOrder array
        return tasks.sort((a, b) => {
          const aIndex = taskOrder.indexOf(a.filename)
          const bIndex = taskOrder.indexOf(b.filename)
          if (aIndex === -1 && bIndex === -1) return 0
          if (aIndex === -1) return 1
          if (bIndex === -1) return -1
          return aIndex - bIndex
        })
    }
  }, [filteredTasks, taskOrder, sortOption])

  // Split into backlog and done
  const sortedBacklogTasks = useMemo(() => 
    sortedFilteredTasks.filter(task => task.status !== 'done'),
    [sortedFilteredTasks]
  )

  const sortedDoneTasks = useMemo(() => 
    sortedFilteredTasks.filter(task => task.status === 'done'),
    [sortedFilteredTasks]
  )

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id) return

    const oldIndex = taskOrder.indexOf(active.id as string)
    const newIndex = taskOrder.indexOf(over.id as string)

    if (oldIndex === -1 || newIndex === -1) return

    const newOrder = [...taskOrder]
    newOrder.splice(oldIndex, 1)
    newOrder.splice(newIndex, 0, active.id as string)
    
    // Update local state immediately for responsiveness
    setTaskOrder(newOrder)
    setIsSaving(true)
    
    try {
      // Save the global order first
      await saveTaskOrderAction('global', newOrder)
      
      // If we're in a filtered view, save that order too
      if (selectedEpic || selectedTags.length > 0) {
        const key = getOrderKey(selectedEpic, selectedTags)
        const filteredOrder = newOrder.filter(filename => 
          filteredTasks.some(task => task.filename === filename)
        )
        await saveTaskOrderAction(key, filteredOrder)
      }

      // Trigger a refresh to ensure server state is updated
      router.refresh()
    } catch (error) {
      console.error('Failed to save task order:', error)
      toast({
        title: "Error",
        description: "Failed to save task order",
        variant: "destructive"
      })
      
      // Revert local state on error
      setTaskOrder(taskOrder)
    } finally {
      setIsSaving(false)
    }
  }

  const handleComplete = async (filename: string) => {
    if (disabled) return
    try {
      await completeTaskAction(filename)
      onStateChange?.()
    } catch (error) {
      console.error('Failed to complete task:', error)
    }
  }

  const handleEdit = () => {
    setIsEditing(true)
    setEditedTask(selectedTask)
  }

  const handleSave = () => {
    if (editedTask) {
      // Implement save logic here
    }
    setIsEditing(false)
    setEditedTask(null)
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (isCreating || disabled) return
    setIsCreating(true)
    try {
      const taskToCreate: Omit<Task, 'ref' | 'filename'> & { content: string } = {
        ...newTask,
        tags: tagInput ? tagInput.split(',').map(t => t.trim()).filter(Boolean) : [],
        dependencies: newTask.dependencies || [],
        id: Date.now().toString(),
        created: new Date().toISOString().split('T')[0],
        content: newTask.content || ''
      }
      const filename = await createTaskAction(taskToCreate)
      if (filename) {
        setTaskOrder(prev => [...prev, filename])
      }
      onStateChange?.()
      setShowCreateDialog(false)
      setNewTask({
        id: '0',
        title: '',
        priority: 'medium',
        status: 'todo',
        content: '',
        created: '',
        dependencies: []
      })
      setTagInput('')
      setSearchQuery('')
    } catch (error) {
      console.error('Failed to create task:', error)
    } finally {
      setIsCreating(false)
    }
  }

  const handleTaskClick = (task: Task) => {
    setSelectedTask(task)
    setIsEditing(false)
    setEditedTask(null)
  }

  const handleDelete = async () => {
    if (!selectedTask || isDeleting || disabled) return
    setIsDeleting(true)
    try {
      await deleteTaskAction(selectedTask.filename)
      onStateChange?.()
      setSelectedTask(null)
      setShowDeleteAlert(false)
      toast({
        title: `🗑️ Task "${selectedTask.title}" deleted`,
        description: "The task has been permanently removed",
        variant: "default",
      })
    } catch (error) {
      console.error('Failed to delete task:', error)
      toast({
        title: "❌ Error",
        description: `Failed to delete task "${selectedTask?.title}"`,
        variant: "destructive",
      })
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <div className="relative -mt-6">
      <div>
        <header className="fixed top-0 right-0 left-0 lg:left-[250px] flex flex-col sm:flex-row items-start sm:items-center gap-2 p-2 lg:p-3 bg-[#18181b] z-10">
          <div className="w-full sm:max-w-[40%] lg:max-w-[50%] max-w-[calc(100%-48px)] ml-2.5">
            <div className="relative w-full">
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
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-300 p-1"
                  type="button"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2 justify-between w-full sm:w-auto sm:flex-1 sm:justify-end">
            <div className="flex items-center gap-2 sm:-ml-4">
              <ArrowUpDown className="w-4 h-4 text-zinc-400" />
              <Select value={sortOption} onValueChange={(value: SortOption) => setSortOption(value)}>
                <SelectTrigger className="w-[180px] bg-zinc-900 border-zinc-800 text-zinc-100 hover:bg-zinc-800/50 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500/20">
                  <SelectValue placeholder="Sort by..." />
                </SelectTrigger>
                <SelectContent className="bg-zinc-900 border border-zinc-800">
                  {sortOptions.map(option => (
                    <SelectItem 
                      key={option.value} 
                      value={option.value}
                      className="text-zinc-100 hover:bg-zinc-800 focus:bg-zinc-800 cursor-pointer text-left"
                    >
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button
              onClick={() => setShowCreateDialog(true)}
              className="bg-blue-500 text-white hover:bg-blue-600 whitespace-nowrap sm:ml-4 lg:ml-6"
            >
              Create Task
            </Button>
          </div>
        </header>

        <main className="pt-[104px] sm:pt-[52px] px-4">
          <Accordion 
            type="multiple" 
            value={openSections}
            onValueChange={setOpenSections}
            className="space-y-4"
          >
            <AccordionItem value="backlog" className="border-none">
              <div className="flex flex-col gap-2">
                <AccordionTrigger className="hover:no-underline">
                  <div className="flex items-center gap-2">
                    <ListTodo className="w-5 h-5" />
                    <span className="text-xl font-medium tracking-tight text-zinc-100 font-mono">
                      Backlog ({sortedBacklogTasks.length})
                    </span>
                  </div>
                </AccordionTrigger>

                {/* Filter indicators */}
                {(selectedEpic || selectedTags.length > 0) && (
                  <div className="flex items-center gap-2 text-sm py-2 pl-10 relative z-50 bg-[#18181b]">
                    {selectedEpic && (
                      <div className="flex items-center gap-1.5 bg-zinc-800/50 px-2 py-1 rounded-md">
                        <Folder className="w-3.5 h-3.5 text-zinc-400" />
                        <span className="text-zinc-300">
                          {selectedEpic === 'none' ? 'No Epic' : 
                            epics.find(e => e.id === selectedEpic)?.title || selectedEpic}
                        </span>
                      </div>
                    )}
                    {selectedTags.map((tag, i) => (
                      <div key={i} className="flex items-center gap-1.5 bg-zinc-800/50 px-2 py-1 rounded-md">
                        <Hash className="w-3.5 h-3.5 text-zinc-400" />
                        <span className="text-zinc-300">{tag}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <AccordionContent>
                <div className="pt-4">
                  <DndContext 
                    collisionDetection={closestCenter} 
                    onDragEnd={handleDragEnd}
                  >
                    <SortableContext 
                      items={sortedBacklogTasks.map(t => t.filename)} 
                      strategy={verticalListSortingStrategy}
                    >
                      <div className="space-y-4">
                        {sortedBacklogTasks.map((task, index) => (
                          <SortableTaskCard
                            key={task.filename}
                            task={task}
                            number={index + 1}
                            onComplete={handleComplete}
                            onClick={handleTaskClick}
                          />
                        ))}
                      </div>
                    </SortableContext>
                  </DndContext>
                </div>
              </AccordionContent>
            </AccordionItem>

            {sortedDoneTasks.length > 0 && (
              <AccordionItem value="done" className="border-none">
                <AccordionTrigger className="hover:no-underline">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5" />
                    <span className="text-xl font-medium tracking-tight text-zinc-100 font-mono">
                      Done ({sortedDoneTasks.length})
                    </span>
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <div className="pt-4">
                    <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                      <SortableContext items={sortedDoneTasks.map(t => t.filename)} strategy={verticalListSortingStrategy}>
                        <div className="space-y-4">
                          {sortedDoneTasks.map((task, index) => (
                            <SortableTaskCard
                              key={task.filename}
                              task={task}
                              number={sortedBacklogTasks.length + index + 1}
                              onComplete={handleComplete}
                              onClick={handleTaskClick}
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

      <Dialog open={!!selectedTask} onOpenChange={(open) => {
        if (!open) {
          setSelectedTask(null)
          setIsEditing(false)
          setEditedTask(null)
        }
      }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          {selectedTask && (
            <>
              {isEditing ? (
                <form onSubmit={(e) => { e.preventDefault(); handleSave(); }} className="space-y-4">
                  <DialogHeader>
                    <DialogTitle className="sr-only">Edit Task</DialogTitle>
                  </DialogHeader>
                  <div className="grid gap-6">
                    <div className="space-y-2">
                      <label htmlFor="title" className="text-sm font-medium text-zinc-400">
                        Title
                      </label>
                      <input
                        id="title"
                        type="text"
                        value={editedTask?.title || ''}
                        onChange={(e) => setEditedTask(prev => prev ? { ...prev, title: e.target.value } : null)}
                        className="w-full px-3 py-1.5 bg-zinc-900/50 border-zinc-800 rounded-md text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500/20"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium text-zinc-400">Priority</label>
                      <div className="flex gap-2">
                        {(['low', 'medium', 'high'] as const).map((p) => (
                          <button
                            key={p}
                            type="button"
                            onClick={() => setEditedTask(prev => prev ? { ...prev, priority: p } : null)}
                            className={cn(
                              'px-3 py-1.5 rounded-md capitalize text-sm flex-1 transition-colors',
                              editedTask?.priority === p 
                                ? 'bg-zinc-800 text-zinc-100' 
                                : 'bg-zinc-900/50 text-zinc-400 hover:text-zinc-300 border border-zinc-800'
                            )}
                          >
                            {p}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium text-zinc-400">Status</label>
                      <select
                        value={editedTask?.status || 'todo'}
                        onChange={(e) => setEditedTask(prev => prev ? { ...prev, status: e.target.value as Task['status'] } : null)}
                        className="w-full px-3 py-1.5 bg-zinc-900/50 border-zinc-800 rounded-md text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500/20"
                      >
                        <option value="todo">Todo</option>
                        <option value="done">Done</option>
                      </select>
                    </div>

                    <div className="space-y-2">
                      <label htmlFor="epic" className="text-sm font-medium text-zinc-400">
                        Epic (optional)
                      </label>
                      <input
                        id="epic"
                        type="text"
                        value={editedTask?.epic || ''}
                        onChange={(e) => setEditedTask(prev => prev ? { ...prev, epic: e.target.value || undefined } : null)}
                        className="w-full px-3 py-1.5 bg-zinc-900/50 border-zinc-800 rounded-md text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500/20"
                        placeholder="Epic name"
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <TagInput
                        value={editTagInput}
                        onChange={setEditTagInput}
                      />
                    </div>

                    <div className="sm:col-span-2 space-y-2">
                      <label htmlFor="content" className="text-sm font-medium text-zinc-400">
                        Content
                      </label>
                      <div className="space-y-2">
                        <textarea
                          id="content"
                          value={editedTask?.content || ''}
                          onChange={(e) => setEditedTask(prev => prev ? { ...prev, content: e.target.value } : null)}
                          className="w-full h-24 px-3 py-2 bg-zinc-900/50 border-zinc-800 rounded-md text-sm text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500/20"
                        />
                        <div className="flex items-center gap-2">
                          <label htmlFor="image-upload" className="cursor-pointer">
                            <div className="flex items-center gap-2 text-sm text-zinc-400 hover:text-zinc-300">
                              <ImagePlus className="h-4 w-4" />
                              Add Image
                            </div>
                            <input
                              id="image-upload"
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={async (e) => {
                                const file = e.target.files?.[0]
                                if (!file) return

                                const safeFilename = `${Date.now()}-${file.name.replace(/\s+/g, '-')}`
                                const formData = new FormData()
                                formData.append('file', file)
                                formData.append('filename', safeFilename)

                                try {
                                  await fetch('/api/upload', {
                                    method: 'POST',
                                    body: formData,
                                  })

                                  const imageMarkdown = `\n![${file.name}](/task-images/${safeFilename})\n`
                                  setEditedTask(prev => prev ? {
                                    ...prev,
                                    content: prev.content + imageMarkdown
                                  } : null)
                                } catch (error) {
                                  console.error('Failed to upload image:', error)
                                }
                              }}
                            />
                          </label>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end gap-3 pt-4">
                    <Button
                      variant="outline"
                      type="button"
                      onClick={() => {
                        setIsEditing(false)
                        setEditedTask(null)
                      }}
                      className="bg-zinc-900/50 border-zinc-800 text-zinc-100 hover:bg-zinc-800/50"
                    >
                      Cancel
                    </Button>
                    <Button 
                      type="submit"
                      className="bg-blue-500 text-white hover:bg-blue-600"
                    >
                      Save Changes
                    </Button>
                  </div>
                </form>
              ) : (
                <div className="space-y-6">
                  <DialogHeader>
                    <DialogTitle className="sr-only">View Task: {selectedTask.title}</DialogTitle>
                  </DialogHeader>
                  <div className="flex items-start justify-between gap-8 pb-4 border-b border-zinc-800">
                    <div className="flex-1">
                      <h2 className={cn(
                        "text-2xl font-medium tracking-tight text-zinc-100 font-mono",
                        selectedTask.status === "done" && "line-through text-zinc-400"
                      )}>
                        {selectedTask.title}
                      </h2>
                    </div>
                    <div className="flex items-center gap-4">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleEdit}
                        className="hover:bg-zinc-800"
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowDeleteAlert(true)}
                        disabled={isDeleting}
                        className="hover:bg-red-900/20 hover:text-red-400"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  <div className="grid gap-6">
                    <div className="grid gap-6 sm:grid-cols-2 bg-zinc-800/50 p-4 rounded-lg border border-zinc-800">
                      <div className="space-y-1.5">
                        <label className="text-sm font-medium text-zinc-400">Status</label>
                        <div className="flex items-center gap-1.5 bg-zinc-900/50 px-3 py-1.5 rounded-md border border-zinc-800">
                          <span className={cn(
                            "w-2 h-2 rounded-full",
                            selectedTask.status === "done" ? "bg-green-400" : "bg-blue-400"
                          )} />
                          <span className="text-zinc-100 capitalize">{selectedTask.status}</span>
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-sm font-medium text-zinc-400">Priority</label>
                        <div className="flex items-center gap-1.5 bg-zinc-900/50 px-3 py-1.5 rounded-md border border-zinc-800">
                          <span className={cn(
                            "w-2 h-2 rounded-full",
                            selectedTask.priority === "high" ? "bg-yellow-400" :
                            selectedTask.priority === "medium" ? "bg-blue-400" :
                            "bg-slate-400"
                          )} />
                          <span className="text-zinc-100 capitalize">{selectedTask.priority}</span>
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-sm font-medium text-zinc-400">Epic</label>
                        {selectedTask.epic ? (
                          <div className="flex items-center gap-1.5 bg-zinc-900/50 px-3 py-1.5 rounded-md border border-zinc-800">
                            <span className="w-2 h-2 rounded-full bg-blue-400" />
                            <span className="text-zinc-100">{selectedTask.epic}</span>
                          </div>
                        ) : (
                          <div className="text-sm text-zinc-500 bg-zinc-900/50 px-3 py-1.5 rounded-md border border-zinc-800">No epic assigned</div>
                        )}
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-sm font-medium text-zinc-400">Parent</label>
                        {selectedTask.parent ? (
                          <div className="flex items-center gap-1.5 bg-zinc-900/50 px-3 py-1.5 rounded-md border border-zinc-800">
                            <span className="w-2 h-2 rounded-full bg-purple-400" />
                            <span className="text-zinc-100">{selectedTask.parent}</span>
                          </div>
                        ) : (
                          <div className="text-sm text-zinc-500 bg-zinc-900/50 px-3 py-1.5 rounded-md border border-zinc-800">No parent task</div>
                        )}
                      </div>
                    </div>

                    <div className="space-y-1.5 bg-zinc-800/50 p-4 rounded-lg border border-zinc-800">
                      <label className="text-sm font-medium text-zinc-400">Tags</label>
                      {selectedTask.tags?.length ? (
                        <div className="flex flex-wrap gap-2 bg-zinc-900/50 p-3 rounded-md border border-zinc-800">
                          {selectedTask.tags.map((tag, i) => (
                            <span key={i} className="flex items-center gap-1 bg-zinc-700/50 px-2 py-0.5 rounded-full text-xs text-zinc-200 font-inter">
                              #{tag}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <div className="text-sm text-zinc-500 bg-zinc-900/50 px-3 py-1.5 rounded-md border border-zinc-800">No tags</div>
                      )}
                    </div>

                    {(selectedTask.dependencies && selectedTask.dependencies.length > 0) && (
                      <div className="space-y-1.5 bg-zinc-800/50 p-4 rounded-lg border border-zinc-800">
                        <label className="text-sm font-medium text-zinc-400">Dependencies</label>
                        <div className="bg-zinc-900/50 p-3 rounded-md border border-zinc-800">
                          <ul className="space-y-1">
                            {selectedTask.dependencies.map((dep, i) => (
                              <li key={i}>
                                <a href={dep} className="text-blue-400 hover:text-blue-300 inline-flex items-center gap-1.5">
                                  <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                                  {dep}
                                </a>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    )}

                    <div className="space-y-1.5">
                      <label className="text-sm font-medium text-zinc-400">Content</label>
                      <div className="prose prose-invert prose-zinc prose-headings:mt-4 prose-headings:mb-2 prose-p:my-2 prose-ul:my-2 max-w-none border border-zinc-800 rounded-md p-4 bg-zinc-900/50">
                        <ReactMarkdown 
                          className="break-words"
                          components={{
                            img: ({ src, alt, ...props }) => (
                              <img 
                                src={src || ''} 
                                alt={alt || ''} 
                                className="max-w-full h-auto rounded-md my-4"
                                {...props}
                              />
                            ),
                          }}
                        >
                          {selectedTask.content}
                        </ReactMarkdown>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Create Task Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create New Task</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2 space-y-2">
                <label htmlFor="title" className="text-sm font-medium text-zinc-400">
                  Title
                </label>
                <input
                  id="title"
                  type="text"
                  value={newTask.title}
                  onChange={(e) => setNewTask(prev => ({ ...prev, title: e.target.value }))}
                  className="w-full px-3 py-1.5 bg-zinc-900/50 border border-zinc-800 rounded-md text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500/20"
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-zinc-400">Priority</label>
                <div className="flex gap-2">
                  {(['low', 'medium', 'high'] as const).map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setNewTask(prev => ({ ...prev, priority: p }))}
                      className={cn(
                        'px-3 py-1.5 rounded-md capitalize text-sm flex-1 border',
                        newTask.priority === p ? 'bg-zinc-800 text-zinc-100 border-zinc-700' : 'bg-zinc-900/50 text-zinc-400 hover:text-zinc-300 border-zinc-800'
                      )}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-zinc-400">Epic (optional)</label>
                <Select
                  value={newTask.epic || ''}
                  onValueChange={(value) => setNewTask(prev => ({ ...prev, epic: value }))}
                >
                  <SelectTrigger className="w-full bg-zinc-900/50 border-zinc-800 text-zinc-100 hover:bg-zinc-800/50">
                    <SelectValue placeholder="Select an epic" />
                  </SelectTrigger>
                  <SelectContent className="bg-zinc-900 border border-zinc-800">
                    {epics.map(epic => (
                      <SelectItem
                        key={epic.id}
                        value={epic.id}
                        className="text-zinc-100 hover:bg-zinc-800 focus:bg-zinc-800 cursor-pointer"
                      >
                        {epic.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="sm:col-span-2">
                <TagInput
                  value={tagInput}
                  onChange={setTagInput}
                />
              </div>

              <div className="sm:col-span-2 space-y-2">
                <label className="text-sm font-medium text-zinc-400">Dependencies</label>
                <div className="relative">
                  <div className="flex items-center px-3 py-1.5 bg-zinc-900/50 border border-zinc-800 rounded-md mb-2">
                    <Search className="w-4 h-4 text-zinc-400 mr-2" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search tasks..."
                      className="flex-1 bg-transparent outline-none text-sm text-zinc-100 placeholder:text-zinc-500"
                    />
                  </div>
                  <div className="border border-zinc-800 rounded-md divide-y divide-zinc-800 max-h-32 overflow-y-auto bg-zinc-900/50">
                    {filteredDependencyTasks.length === 0 ? (
                      <div className="p-3 text-sm text-zinc-500 text-center">
                        No tasks found
                      </div>
                    ) : (
                      filteredDependencyTasks.map((task) => (
                        <div
                          key={task.filename}
                          className="flex items-center gap-3 p-2 hover:bg-zinc-800/50"
                        >
                          <Checkbox
                            id={`dep-${task.filename}`}
                            checked={newTask.dependencies?.includes(task.filename)}
                            onCheckedChange={(checked) => {
                              setNewTask(prev => ({
                                ...prev,
                                dependencies: checked
                                  ? [...(prev.dependencies || []), task.filename]
                                  : (prev.dependencies || []).filter(d => d !== task.filename)
                              }))
                            }}
                            className="border-zinc-700 data-[state=checked]:bg-blue-500 data-[state=checked]:border-blue-500"
                          />
                          <label
                            htmlFor={`dep-${task.filename}`}
                            className="flex-1 text-sm cursor-pointer truncate text-zinc-100"
                          >
                            {task.ref && (
                              <span className="font-mono text-zinc-400 mr-2">{task.ref}</span>
                            )}
                            <span className="font-medium">{task.title}</span>
                            {task.epic && (
                              <span className="ml-2 text-zinc-400">
                                in {task.epic}
                              </span>
                            )}
                          </label>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>

              <div className="sm:col-span-2 space-y-2">
                <label className="text-sm font-medium text-zinc-400">Content</label>
                <div className="space-y-2">
                  <textarea
                    id="content"
                    value={newTask.content}
                    onChange={(e) => setNewTask(prev => ({ ...prev, content: e.target.value }))}
                    className="w-full h-24 px-3 py-2 bg-zinc-900/50 border border-zinc-800 rounded-md text-sm text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500/20"
                    required
                  />
                  <div className="flex items-center gap-2">
                    <label htmlFor="create-image-upload" className="cursor-pointer">
                      <div className="flex items-center gap-2 text-sm text-zinc-400 hover:text-zinc-300">
                        <ImagePlus className="h-4 w-4" />
                        Add Image
                      </div>
                      <input
                        id="create-image-upload"
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={async (e) => {
                          const file = e.target.files?.[0]
                          if (!file) return

                          const safeFilename = `${Date.now()}-${file.name.replace(/\s+/g, '-')}`
                          const formData = new FormData()
                          formData.append('file', file)
                          formData.append('filename', safeFilename)

                          try {
                            await fetch('/api/upload', {
                              method: 'POST',
                              body: formData,
                            })

                            const imageMarkdown = `\n![${file.name}](/task-images/${safeFilename})\n`
                            setNewTask(prev => ({
                              ...prev,
                              content: prev.content + imageMarkdown
                            }))
                          } catch (error) {
                            console.error('Failed to upload image:', error)
                          }
                        }}
                      />
                    </label>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <Button
                variant="outline"
                type="button"
                onClick={() => setShowCreateDialog(false)}
                className="bg-zinc-900/50 border-zinc-800 text-zinc-100 hover:bg-zinc-800/50"
              >
                Cancel
              </Button>
              <Button 
                type="submit"
                disabled={isCreating}
                className="bg-blue-500 text-white hover:bg-blue-600"
              >
                {isCreating ? 'Creating...' : 'Create Task'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={showDeleteAlert} onOpenChange={setShowDeleteAlert}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure you want to delete this task?</AlertDialogTitle>
            <AlertDialogDescription>
              Deleting this task removes the file from your local system. You may be able to retrieve it if you have committed your project recently to git. If not, it will be gone forever.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-red-600 text-white hover:bg-red-700"
            >
              Delete task
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
} 