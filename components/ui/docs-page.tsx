'use client'

import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { DocList } from "@/components/ui/doc-list"
import { Plus, Search, X } from "lucide-react"
import { useState, useEffect } from "react"
import { TextEditor } from "@/components/ui/text-editor"
import { createDocAction } from "@/lib/doc-actions"
import type { Doc } from "@/lib/docs"
import { useRouter } from "next/navigation"
import { getAllEpics } from "@/lib/epics"
import { getAllTasks } from "@/lib/tasks"
import type { Epic } from "@/lib/epics"
import type { Task } from "@/lib/tasks"
import { cn } from "@/lib/utils"

interface DocsPageProps {
  initialDocs: Doc[]
}

export function DocsPage({ initialDocs }: DocsPageProps) {
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState("")
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [newDoc, setNewDoc] = useState<Partial<Doc>>({
    title: "",
    description: "",
    content: "",
    type: "documentation",
    tags: [],
    dependencies: []
  })
  const [tagInput, setTagInput] = useState("")
  const [dependencySearchQuery, setDependencySearchQuery] = useState("")
  const [tasks, setTasks] = useState<{ ref: string; title: string; filename: string }[]>([])
  const [epics, setEpics] = useState<{ id: string; title: string }[]>([])

  useEffect(() => {
    async function loadEpicsAndTasks() {
      try {
        const [loadedEpics, loadedTasks] = await Promise.all([
          getAllEpics(),
          getAllTasks()
        ])
        setEpics(loadedEpics)
        setTasks(loadedTasks.map(task => ({
          ref: task.ref,
          title: task.title,
          filename: task.filename
        })))
      } catch (error) {
        console.error('Failed to load epics and tasks:', error)
      }
    }
    loadEpicsAndTasks()
  }, [])

  const filteredItems = [
    ...tasks.filter(task => 
      (task.ref?.toLowerCase().includes(dependencySearchQuery.toLowerCase()) || false) ||
      (task.title?.toLowerCase().includes(dependencySearchQuery.toLowerCase()) || false)
    ),
    ...epics.filter(epic => 
      epic.title?.toLowerCase().includes(dependencySearchQuery.toLowerCase()) || false
    ).map(epic => ({
      ref: 'Epic',
      title: epic.title,
      filename: epic.id
    }))
  ]

  const handleCreate = async () => {
    if (!newDoc.title || !newDoc.content) return

    try {
      const doc: Omit<Doc, 'filename'> & { content: string } = {
        title: newDoc.title || '',
        description: newDoc.description || '',
        content: newDoc.content || '',
        type: newDoc.type || 'documentation',
        tags: tagInput.split(",").map(tag => tag.trim()).filter(tag => tag.length > 0),
        dependencies: newDoc.dependencies || [],
        epic: newDoc.epic,
        created: new Date().toISOString()
      }

      await createDocAction(doc)
      setShowCreateDialog(false)
      setNewDoc({
        title: "",
        description: "",
        content: "",
        type: "documentation",
        tags: [],
        dependencies: []
      })
      setTagInput("")
      setDependencySearchQuery("")
      router.refresh()
    } catch (error) {
      console.error("Failed to create document:", error)
    }
  }

  return (
    <div className="relative -mt-6">
      <div>
        <header className="fixed top-0 right-0 left-0 lg:left-[250px] flex items-center justify-between px-6 py-2 bg-[#18181b] z-10">
          <div className="relative w-[320px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search docs..."
              className="w-full pl-9 pr-8 py-1.5 bg-zinc-900/50 border border-zinc-800 rounded-md text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500/20"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-300 p-1"
                type="button"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
          <Button
            onClick={() => setShowCreateDialog(true)}
            className="bg-blue-500 text-white hover:bg-blue-600 whitespace-nowrap mr-12"
          >
            Create Doc
          </Button>
        </header>

        <main className="pt-[52px]">
          <DocList docs={initialDocs} searchQuery={searchQuery} />
        </main>
      </div>

      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create Document</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Title</label>
              <input
                type="text"
                value={newDoc.title}
                onChange={e => setNewDoc(prev => ({ ...prev, title: e.target.value }))}
                className="w-full px-4 py-3 bg-zinc-900/50 border border-zinc-800 rounded-md text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500/20 mt-1"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Description</label>
              <input
                type="text"
                value={newDoc.description}
                onChange={e => setNewDoc(prev => ({ ...prev, description: e.target.value }))}
                className="w-full px-4 py-3 bg-zinc-900/50 border border-zinc-800 rounded-md text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500/20 mt-1"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Content</label>
              <TextEditor
                value={newDoc.content || ""}
                onChange={content => setNewDoc(prev => ({ ...prev, content }))}
                className="min-h-[400px]"
                onImageUpload={async (file) => {
                  const safeFilename = `${Date.now()}-${file.name.replace(/\s+/g, '-')}`
                  const formData = new FormData()
                  formData.append('file', file)
                  formData.append('filename', safeFilename)

                  try {
                    await fetch('/api/upload', {
                      method: 'POST',
                      body: formData,
                    })
                    return `/task-images/${safeFilename}`
                  } catch (error) {
                    console.error('Failed to upload image:', error)
                    throw error
                  }
                }}
                onFileUpload={async (file) => {
                  const safeFilename = `${Date.now()}-${file.name.replace(/\s+/g, '-')}`
                  const formData = new FormData()
                  formData.append('file', file)
                  formData.append('filename', safeFilename)

                  try {
                    await fetch('/api/upload', {
                      method: 'POST',
                      body: formData,
                    })
                    return `/task-files/${safeFilename}`
                  } catch (error) {
                    console.error('Failed to upload file:', error)
                    throw error
                  }
                }}
              />
            </div>
            <div>
              <label className="text-sm font-medium">Type</label>
              <div className="relative mt-1">
                <select
                  value={newDoc.type}
                  onChange={e => setNewDoc(prev => ({ ...prev, type: e.target.value as Doc["type"] }))}
                  className="w-full appearance-none bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-2 text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500/20 pr-8"
                >
                  <option value="documentation">Documentation</option>
                  <option value="architecture">Architecture</option>
                  <option value="guide">Guide</option>
                  <option value="api">API</option>
                  <option value="delivery">Delivery</option>
                  <option value="product">Product</option>
                  <option value="business">Business</option>
                  <option value="design">Design</option>
                  <option value="stakeholders">Stakeholders</option>
                  <option value="operations">Operations</option>
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-zinc-400">
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
            </div>
            <div className="sm:col-span-2 space-y-2">
              <label className="text-sm font-medium">Dependencies</label>
              <div className="relative">
                <div className="flex items-center px-3 py-1.5 bg-zinc-900/50 border border-zinc-800 rounded-md mb-2">
                  <Search className="w-4 h-4 text-zinc-400 mr-2" />
                  <input
                    type="text"
                    value={dependencySearchQuery}
                    onChange={e => setDependencySearchQuery(e.target.value)}
                    placeholder="Search tasks and epics..."
                    className="flex-1 bg-transparent outline-none text-sm text-zinc-100 placeholder:text-zinc-500"
                  />
                </div>
                <div className="border border-zinc-800 rounded-md divide-y divide-zinc-800 max-h-48 overflow-y-auto bg-zinc-900/50">
                  {filteredItems.length === 0 ? (
                    <div className="p-3 text-sm text-zinc-500 text-center">
                      No items found
                    </div>
                  ) : (
                    filteredItems.map(item => (
                      <label key={item.filename} className="flex items-center gap-2 p-2 hover:bg-zinc-800/50">
                        <input
                          type="checkbox"
                          checked={newDoc.dependencies?.includes(item.filename) || false}
                          onChange={e => {
                            setNewDoc(prev => {
                              const dependencies = prev.dependencies || []
                              if (e.target.checked) {
                                return { ...prev, dependencies: [...dependencies, item.filename] }
                              } else {
                                return { ...prev, dependencies: dependencies.filter(d => d !== item.filename) }
                              }
                            })
                          }}
                          className="h-4 w-4 border-2 border-zinc-500 data-[state=checked]:bg-zinc-500 data-[state=checked]:border-zinc-500 hover:border-zinc-400 transition-colors"
                        />
                        <span className="text-sm">
                          <span className="font-mono text-zinc-400">{item.ref}</span>
                          {" "}
                          {item.title}
                        </span>
                      </label>
                    ))
                  )}
                </div>
              </div>
            </div>
            <div>
              <label className="text-sm font-medium">Tags</label>
              <input
                type="text"
                value={tagInput}
                onChange={e => setTagInput(e.target.value)}
                placeholder="Enter tags separated by commas"
                className="w-full bg-transparent mt-1"
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button onClick={() => setShowCreateDialog(false)} variant="ghost">
                Cancel
              </Button>
              <Button onClick={handleCreate}>
                Create
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
} 