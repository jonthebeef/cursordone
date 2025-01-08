'use client'

import { useState } from 'react'
import { Task } from '@/lib/tasks'
import { createTaskAction } from '@/lib/actions'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { cn } from '@/lib/utils'
import { useRouter } from 'next/navigation'
import { Checkbox } from '@/components/ui/checkbox'
import { Search } from 'lucide-react'

interface TaskCreatorProps {
  availableTasks: Task[]
}

export function TaskCreator({ availableTasks }: TaskCreatorProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [title, setTitle] = useState('')
  const [priority, setPriority] = useState<Task['priority']>('medium')
  const [epic, setEpic] = useState('')
  const [tags, setTags] = useState('')
  const [selectedDependencies, setSelectedDependencies] = useState<string[]>([])
  const [content, setContent] = useState('')
  const [isCreating, setIsCreating] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (isCreating) return

    setIsCreating(true)
    try {
      await createTaskAction({
        id: Date.now().toString(),
        title,
        priority,
        epic: epic || undefined,
        tags: tags ? tags.split(',').map(t => t.trim()) : undefined,
        dependencies: selectedDependencies.length > 0 ? selectedDependencies : undefined,
        content,
        created: new Date().toISOString().split('T')[0],
        status: 'todo'
      })
      router.refresh()
      setOpen(false)
      setTitle('')
      setPriority('medium')
      setEpic('')
      setTags('')
      setSelectedDependencies([])
      setContent('')
    } finally {
      setIsCreating(false)
    }
  }

  const toggleDependency = (filename: string) => {
    setSelectedDependencies(prev => 
      prev.includes(filename)
        ? prev.filter(dep => dep !== filename)
        : [...prev, filename]
    )
  }

  const filteredTasks = availableTasks.filter(task => {
    if (!searchQuery) return true
    const searchLower = searchQuery.toLowerCase()
    return (
      task.title.toLowerCase().includes(searchLower) ||
      task.epic?.toLowerCase().includes(searchLower) ||
      task.tags?.some(tag => tag.toLowerCase().includes(searchLower))
    )
  })

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="fixed bottom-8 right-8">
          Create Task
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Task</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2 sm:col-span-2">
              <label htmlFor="title" className="text-sm font-medium">
                Title
              </label>
              <input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-3 py-1.5 border rounded-md"
                required
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">
                Priority
              </label>
              <div className="flex gap-2">
                {(['low', 'medium', 'high'] as const).map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setPriority(p)}
                    className={cn(
                      'px-3 py-1.5 rounded-md capitalize text-sm flex-1',
                      p === priority && 'bg-primary text-primary-foreground',
                      p !== priority && 'bg-muted hover:bg-muted/80'
                    )}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <label htmlFor="epic" className="text-sm font-medium">
                Epic (optional)
              </label>
              <input
                id="epic"
                value={epic}
                onChange={(e) => setEpic(e.target.value)}
                className="w-full px-3 py-1.5 border rounded-md"
              />
            </div>

            <div className="sm:col-span-2 space-y-2">
              <label className="text-sm font-medium">
                Dependencies
              </label>
              <div className="relative">
                <div className="flex items-center px-3 py-1.5 border rounded-md mb-2">
                  <Search className="w-4 h-4 text-muted-foreground mr-2" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search tasks..."
                    className="flex-1 bg-transparent outline-none text-sm"
                  />
                </div>
                <div className="border rounded-md divide-y max-h-32 overflow-y-auto">
                  {filteredTasks.length === 0 ? (
                    <div className="p-3 text-sm text-muted-foreground text-center">
                      No tasks found
                    </div>
                  ) : (
                    filteredTasks.map((task) => (
                      <div
                        key={task.filename}
                        className="flex items-center gap-3 p-2 hover:bg-slate-50"
                      >
                        <Checkbox
                          id={`dep-${task.filename}`}
                          checked={selectedDependencies.includes(task.filename)}
                          onCheckedChange={() => toggleDependency(task.filename)}
                        />
                        <label
                          htmlFor={`dep-${task.filename}`}
                          className="flex-1 text-sm cursor-pointer truncate"
                        >
                          <span className="font-medium">{task.title}</span>
                          {task.epic && (
                            <span className="ml-2 text-muted-foreground">
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
              <label htmlFor="tags" className="text-sm font-medium">
                Tags (optional, comma-separated)
              </label>
              <input
                id="tags"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                className="w-full px-3 py-1.5 border rounded-md"
                placeholder="bug, feature, ui"
              />
            </div>

            <div className="sm:col-span-2 space-y-2">
              <label htmlFor="content" className="text-sm font-medium">
                Content
              </label>
              <textarea
                id="content"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="w-full h-24 px-3 py-2 border rounded-md text-sm"
                required
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button variant="outline" type="button" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isCreating}>
              {isCreating ? 'Creating...' : 'Create Task'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
} 