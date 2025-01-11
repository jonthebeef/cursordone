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
import { Pencil, Trash2, ImagePlus, X, Search, ListTodo, CheckCircle2, Hash, Folder, ArrowUpDown, Shirt } from "lucide-react"
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
import { TextEditor } from "@/components/ui/text-editor"

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
  const [dependencySearchQuery, setDependencySearchQuery] = useState('')
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
    dependencies: [],
    complexity: 'M'
  })
  const [tagInput, setTagInput] = useState('')

  const filteredDependencyTasks = useMemo(() => {
    if (!dependencySearchQuery) return initialTasks
    const query = dependencySearchQuery.toLowerCase()
    return initialTasks.filter(task => 
      task.title.toLowerCase().includes(query) || 
      task.ref?.toLowerCase().includes(query)
    )
  }, [initialTasks, dependencySearchQuery])

  const handleStartEditing = () => {
    if (!selectedTask) return
    setIsEditing(true)
    setEditedTask(selectedTask)
    setEditTagInput(selectedTask.tags?.join(', ') || '')
  }

  const handleSave = async (e?: React.FormEvent) => {
    e?.preventDefault()
    if (!editedTask || !selectedTask || disabled) return
    
    try {
      const tags = editTagInput.split(',').map(tag => tag.trim()).filter(Boolean)
      const taskToSave = { ...editedTask, tags }
      await updateTaskAction(selectedTask.filename, taskToSave)
      
      // Update the selected task with the latest content
      const updatedTask = initialTasks.find(t => t.filename === selectedTask.filename)
      if (updatedTask) {
        setSelectedTask(updatedTask)
      }
      
      setIsEditing(false)
      setEditedTask(null)
      onStateChange?.()
      router.refresh()
    } catch (error) {
      console.error('Failed to update task:', error)
    }
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
    if (!selectedTask || disabled) return
    
    // Get the latest task data from initialTasks
    const latestTask = initialTasks.find(t => t.filename === selectedTask.filename)
    if (!latestTask) return
    
    setEditedTask(latestTask)
    setEditTagInput(latestTask.tags?.join(', ') || '')
    setIsEditing(true)
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
        dependencies: [],
        complexity: 'M'
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
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          {selectedTask && (
            <>
              {isEditing ? (
                <form onSubmit={(e) => { e.preventDefault(); handleSave(); }} className="space-y-6">
                  <DialogHeader>
                    <DialogTitle className="sr-only">Edit Task</DialogTitle>
                  </DialogHeader>
                  <div className="grid grid-cols-3 gap-4">
                    {/* Left Column - Main Content */}
                    <div className="col-span-2 space-y-4">
                      <div className="space-y-2">
                        <label htmlFor="title" className="text-sm font-medium text-zinc-400">
                          Title
                        </label>
                        <input
                          id="title"
                          type="text"
                          value={editedTask?.title || ''}
                          onChange={(e) => setEditedTask(prev => prev ? { ...prev, title: e.target.value } : null)}
                          className="w-full px-3 py-2 bg-zinc-900/50 border border-zinc-800 rounded-md text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500/20 text-lg"
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm font-medium text-zinc-400">Content</label>
                        <TextEditor
                          value={editedTask?.content || ''}
                          onChange={(value) => setEditedTask(prev => prev ? { ...prev, content: value } : null)}
                          onImageUpload={async (file) => {
                            const formData = new FormData()
                            formData.append('file', file)
                            const response = await fetch('/api/upload', {
                              method: 'POST',
                              body: formData,
                            })
                            if (!response.ok) {
                              throw new Error('Failed to upload image')
                            }
                            const data = await response.json()
                            return data.url
                          }}
                          className="h-[280px] border border-zinc-800 rounded-md bg-zinc-900/50"
                        />
                      </div>
                    </div>

                    {/* Right Column - Metadata */}
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-zinc-400">Priority</label>
                        <div className="flex gap-2">
                          {(['low', 'medium', 'high'] as const).map((p) => (
                            <button
                              key={p}
                              type="button"
                              onClick={() => setEditedTask(prev => prev ? { ...prev, priority: p } : null)}
                              className={cn(
                                'px-3 py-1.5 rounded-md capitalize text-sm flex-1 border',
                                editedTask?.priority === p ? 'bg-zinc-800 text-zinc-100 border-zinc-700' : 'bg-zinc-900/50 text-zinc-400 hover:text-zinc-300 border-zinc-800'
                              )}
                            >
                              {p}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm font-medium text-zinc-400">Complexity</label>
                        <div className="flex gap-2">
                          {(['XS', 'S', 'M', 'L', 'XL'] as const).map((c) => (
                            <button
                              key={c}
                              type="button"
                              onClick={() => setEditedTask(prev => prev ? { ...prev, complexity: c } : null)}
                              className={cn(
                                'px-3 py-1.5 rounded-md text-sm flex-1 border',
                                editedTask?.complexity === c ? 'bg-zinc-800 text-zinc-100 border-zinc-700' : 'bg-zinc-900/50 text-zinc-400 hover:text-zinc-300 border-zinc-800'
                              )}
                            >
                              {c}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm font-medium text-zinc-400">Epic</label>
                        <Select
                          value={editedTask?.epic || ''}
                          onValueChange={(value) => setEditedTask(prev => prev ? { ...prev, epic: value } : null)}
                        >
                          <SelectTrigger className="w-full bg-zinc-900/50 border-zinc-800">
                            <SelectValue placeholder="Select an epic" />
                          </SelectTrigger>
                          <SelectContent>
                            {epics.map((epic) => (
                              <SelectItem key={epic.id} value={epic.id}>
                                {epic.title}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm font-medium text-zinc-400">Tags</label>
                        <TagInput
                          value={editTagInput}
                          onChange={setEditTagInput}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Dependencies Section */}
                  <div className="space-y-2 pt-4 col-span-2">
                    <label className="text-sm font-medium text-zinc-400">Dependencies</label>
                    <div className="space-y-2">
                      <SearchInput
                        value={dependencySearchQuery}
                        onChange={setDependencySearchQuery}
                        placeholder="Search tasks..."
                        className="w-full"
                      />
                      <div className="max-h-48 overflow-y-auto border border-zinc-800 rounded-md divide-y divide-zinc-800">
                        {filteredDependencyTasks.map((task) => (
                          <div key={task.filename} className="flex items-center gap-3 p-2 hover:bg-zinc-800/50">
                            <Checkbox
                              checked={editedTask?.dependencies?.includes(task.ref) || false}
                              onCheckedChange={(checked) => {
                                setEditedTask(prev => {
                                  if (!prev) return null
                                  const deps = new Set(prev.dependencies || [])
                                  if (checked) {
                                    deps.add(task.ref)
                                  } else {
                                    deps.delete(task.ref)
                                  }
                                  return { ...prev, dependencies: Array.from(deps) }
                                })
                              }}
                            />
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-mono text-zinc-400">{task.ref}</span>
                                <span className="text-sm text-zinc-100 truncate">{task.title}</span>
                              </div>
                              {task.epic && (
                                <div className="text-xs text-zinc-500 truncate">
                                  {epics.find(e => e.id === task.epic)?.title || task.epic}
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end gap-3 pt-4 mt-2 border-t border-zinc-800">
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
                  <div className="grid grid-cols-3 gap-4">
                    {/* Left Column - Main Content */}
                    <div className="col-span-2 space-y-4">
                      {selectedTask.ref && (
                        <div className="font-mono text-zinc-400">{selectedTask.ref}</div>
                      )}
                      <h1 className="text-2xl font-semibold text-zinc-100">{selectedTask.title}</h1>
                      <div className="prose prose-invert prose-zinc prose-headings:font-mono prose-headings:mt-4 prose-headings:mb-2 prose-p:my-2 prose-ul:my-2 max-w-none border border-zinc-800 rounded-md p-4 bg-zinc-900/50">
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

                    {/* Right Column - Metadata */}
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-zinc-400">Priority</label>
                        <div className="text-sm text-zinc-100 capitalize">{selectedTask.priority}</div>
                      </div>

                      {selectedTask.complexity && (
                        <div className="space-y-2">
                          <label className="text-sm font-medium text-zinc-400">Complexity</label>
                          <div className="flex items-center gap-1.5">
                            <Shirt className="w-4 h-4 text-purple-400" />
                            <span className="text-sm text-zinc-100">
                              {selectedTask.complexity === 'XS' && 'Extra Small'}
                              {selectedTask.complexity === 'S' && 'Small'}
                              {selectedTask.complexity === 'M' && 'Medium'}
                              {selectedTask.complexity === 'L' && 'Large'}
                              {selectedTask.complexity === 'XL' && 'Extra Large'}
                            </span>
                          </div>
                        </div>
                      )}

                      {selectedTask.epic && (
                        <div className="space-y-2">
                          <label className="text-sm font-medium text-zinc-400">Epic</label>
                          <div className="text-sm text-zinc-100">
                            {epics.find(e => e.id === selectedTask.epic)?.title || selectedTask.epic}
                          </div>
                        </div>
                      )}

                      {selectedTask.tags && selectedTask.tags.length > 0 && (
                        <div className="space-y-2">
                          <label className="text-sm font-medium text-zinc-400">Tags</label>
                          <div className="flex flex-wrap gap-1.5">
                            {selectedTask.tags.map(tag => (
                              <div
                                key={tag}
                                className="px-2 py-0.5 text-xs rounded-full bg-zinc-800 text-zinc-300"
                              >
                                {tag}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Dependencies Section */}
                  {selectedTask.dependencies && selectedTask.dependencies.length > 0 && (
                    <div className="space-y-2 pt-4">
                      <label className="text-sm font-medium text-zinc-400">Dependencies</label>
                      <div className="space-y-2">
                        {selectedTask.dependencies.map(ref => {
                          const task = initialTasks.find(t => t.ref === ref)
                          if (!task) return null
                          return (
                            <div
                              key={ref}
                              className="flex items-center gap-3 p-2 border border-zinc-800 rounded-md hover:bg-zinc-800/50 cursor-pointer"
                              onClick={() => setSelectedTask(task)}
                            >
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-2">
                                  <span className="text-sm font-mono text-zinc-400">{task.ref}</span>
                                  <span className="text-sm text-zinc-100 truncate">{task.title}</span>
                                </div>
                                {task.epic && (
                                  <div className="text-xs text-zinc-500 truncate">
                                    {epics.find(e => e.id === task.epic)?.title || task.epic}
                                  </div>
                                )}
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )}

                  <div className="flex justify-end gap-3 pt-4 mt-2 border-t border-zinc-800">
                    <Button
                      variant="outline"
                      onClick={() => setShowDeleteAlert(true)}
                      className="bg-zinc-900/50 border-zinc-800 text-red-400 hover:text-red-300 hover:bg-zinc-800/50"
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setIsEditing(true)
                        setEditedTask(selectedTask)
                        setEditTagInput(selectedTask.tags?.join(', ') || '')
                      }}
                      className="bg-zinc-900/50 border-zinc-800 text-zinc-100 hover:bg-zinc-800/50"
                    >
                      <Pencil className="w-4 h-4 mr-2" />
                      Edit
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Create Task Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-4xl">
          <DialogHeader className="pb-4">
            <DialogTitle>Create New Task</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              {/* Left Column - Main Content */}
              <div className="col-span-2 space-y-4">
                <div className="space-y-2">
                  <label htmlFor="title" className="text-sm font-medium text-zinc-400">
                    Title
                  </label>
                  <input
                    id="title"
                    type="text"
                    value={newTask.title}
                    onChange={(e) => setNewTask(prev => ({ ...prev, title: e.target.value }))}
                    className="w-full px-3 py-2 bg-zinc-900/50 border border-zinc-800 rounded-md text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500/20 text-lg"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-zinc-400">Content</label>
                  <TextEditor
                    value={newTask.content}
                    onChange={(value) => setNewTask(prev => ({ ...prev, content: value }))}
                    onImageUpload={async (file) => {
                      const safeFilename = `${Date.now()}-${file.name.replace(/\s+/g, '-')}`
                      const formData = new FormData()
                      formData.append('file', file)
                      formData.append('filename', safeFilename)

                      const response = await fetch('/api/upload', {
                        method: 'POST',
                        body: formData,
                      })
                      
                      if (!response.ok) {
                        throw new Error('Failed to upload image')
                      }

                      return `/task-images/${safeFilename}`
                    }}
                    onFileUpload={async (file) => {
                      const safeFilename = `${Date.now()}-${file.name.replace(/\s+/g, '-')}`
                      const formData = new FormData()
                      formData.append('file', file)
                      formData.append('filename', safeFilename)

                      const response = await fetch('/api/upload', {
                        method: 'POST',
                        body: formData,
                      })
                      
                      if (!response.ok) {
                        throw new Error('Failed to upload file')
                      }

                      return `/task-files/${safeFilename}`
                    }}
                    className="h-[280px]"
                  />
                </div>
              </div>

              {/* Right Column - Metadata */}
              <div className="space-y-4">
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
                  <label className="text-sm font-medium text-zinc-400">Complexity</label>
                  <div className="flex gap-2">
                    {[
                      { value: 'XS', label: 'XS' },
                      { value: 'S', label: 'S' },
                      { value: 'M', label: 'M' },
                      { value: 'L', label: 'L' },
                      { value: 'XL', label: 'XL' }
                    ].map(({ value }) => (
                      <button
                        key={value}
                        type="button"
                        onClick={() => setNewTask(prev => ({ ...prev, complexity: value as Task['complexity'] }))}
                        className={cn(
                          'px-3 py-1.5 rounded-md text-sm flex-1 border',
                          newTask.complexity === value ? 'bg-zinc-800 text-zinc-100 border-zinc-700' : 'bg-zinc-900/50 text-zinc-400 hover:text-zinc-300 border-zinc-800'
                        )}
                      >
                        {value}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <label htmlFor="epic" className="text-sm font-medium text-zinc-400">
                    Epic (optional)
                  </label>
                  <Select
                    value={newTask.epic || ''}
                    onValueChange={(value) => setNewTask(prev => ({ ...prev, epic: value || undefined }))}
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

                <div className="space-y-2">
                  <TagInput
                    value={tagInput}
                    onChange={setTagInput}
                  />
                </div>
              </div>
            </div>

            {/* Dependencies Section - Full Width */}
            <div className="space-y-2 pt-4 col-span-2">
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
                <div className="border border-zinc-800 rounded-md divide-y divide-zinc-800 max-h-48 overflow-y-auto bg-zinc-900/50">
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

            <div className="flex justify-end gap-3 pt-4 mt-2 border-t border-zinc-800">
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