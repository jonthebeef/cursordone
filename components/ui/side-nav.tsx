'use client'

import { cn } from "@/lib/utils"
import { Menu, X, LayoutList, Layers, ChevronDown, ChevronRight, Hash, RefreshCw, AlertCircle, CheckCircle2, Info } from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useState } from "react"
import { Button } from "./button"
import { useToast } from "./use-toast"

interface SideNavProps {
  epics?: { id: string; title: string }[]
  tags?: string[]
  selectedEpic?: string | null
  selectedTags?: string[]
  onEpicSelect?: (epicId: string | null) => void
  onTagSelect?: (tag: string) => void
}

export function SideNav({ 
  epics = [], 
  tags = [], 
  selectedEpic = null,
  selectedTags = [],
  onEpicSelect,
  onTagSelect
}: SideNavProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isEpicsOpen, setIsEpicsOpen] = useState(true)
  const [isTagsOpen, setIsTagsOpen] = useState(true)
  const [isUpdating, setIsUpdating] = useState(false)
  const pathname = usePathname()
  const { toast } = useToast()

  // Debug logs
  console.log('SideNav props:', { selectedEpic, selectedTags, epics })

  const handleEpicClick = (epicId: string | null) => {
    console.log('Epic clicked:', epicId)
    onEpicSelect?.(epicId)
  }

  const handleTagClick = (tag: string) => {
    console.log('Tag clicked:', tag)
    onTagSelect?.(tag)
  }

  const updateRefs = async () => {
    if (isUpdating) return
    
    try {
      setIsUpdating(true)
      console.log('Starting update refs...')
      toast({
        title: "Updating refs...",
        description: "Checking for new tasks and updating references.",
        variant: "default",
      })
      console.log('Initial toast fired')

      const response = await fetch('/api/update-refs', { method: 'POST' })
      console.log('API response:', response)
      const data = await response.json()
      console.log('API data:', data)
      
      if (data.error) {
        console.log('Error from API:', data.error)
        toast({
          title: "Error",
          description: data.error,
          variant: "destructive",
          icon: <AlertCircle className="h-5 w-5" />
        })
        return
      }

      if (!data.isValid) {
        console.log('Invalid refs found')
        toast({
          title: "Warning",
          description: "Found gaps or duplicates in task references. Some cleanup may be needed.",
          variant: "warning",
          icon: <AlertCircle className="h-5 w-5" />
        })
      }

      if (data.updatedCount > 0) {
        console.log('Updated tasks:', data.updatedCount)
        toast({
          title: "Success",
          description: `Updated ${data.updatedCount} task${data.updatedCount === 1 ? '' : 's'} with new references.`,
          variant: "success",
          icon: <CheckCircle2 className="h-5 w-5" />
        })
      } else {
        console.log('No updates needed')
        toast({
          title: "No updates needed",
          description: "All tasks already have reference numbers.",
          variant: "default",
          icon: <Info className="h-5 w-5" />
        })
      }
    } catch (error) {
      console.error('Error in updateRefs:', error)
      toast({
        title: "Error",
        description: "Failed to update task references. Please try again.",
        variant: "destructive",
        icon: <AlertCircle className="h-5 w-5" />
      })
    } finally {
      setIsUpdating(false)
    }
  }

  const navItems = [
    {
      href: "/",
      label: "Tasks",
      icon: LayoutList
    },
    {
      href: "/epics",
      label: "Epics",
      icon: Layers
    }
  ]

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/20 z-20 lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Mobile burger menu */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed top-2 right-4 w-10 h-10 flex items-center justify-center bg-zinc-900 rounded-md shadow-lg hover:bg-zinc-800 lg:hidden z-30"
      >
        {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </button>

      {/* Side navigation */}
      <aside className={cn(
        "fixed inset-y-0 left-0 w-64 bg-zinc-900 border-r border-zinc-800 shadow-xl transform transition-transform duration-200 ease-in-out z-30 lg:translate-x-0",
        isOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center h-14 px-4 border-b border-zinc-800">
            <h1 className="text-xl font-semibold tracking-tight text-zinc-100 font-mono">Todo List</h1>
          </div>

          {/* Main navigation */}
          <nav className="px-2 pt-4 font-inter">
            {navItems.map((item) => {
              const Icon = item.icon
              const isActive = pathname === item.href
              
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setIsOpen(false)}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                    isActive 
                      ? "bg-zinc-800 text-zinc-100" 
                      : "text-zinc-300 hover:bg-zinc-800/50 hover:text-zinc-100"
                  )}
                >
                  <Icon className="h-5 w-5" />
                  {item.label}
                </Link>
              )
            })}
          </nav>

          {/* Filters - Only show on tasks page */}
          {pathname === "/" && (
            <div className="flex-1 px-2 py-4 space-y-2 overflow-y-auto">
              {/* Epics filter */}
              <div className="space-y-1">
                <button
                  onClick={() => setIsEpicsOpen(!isEpicsOpen)}
                  className="flex items-center gap-2 w-full px-3 py-2 text-sm font-medium text-zinc-300 hover:text-zinc-100"
                >
                  {isEpicsOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                  Epics
                </button>
                {isEpicsOpen && onEpicSelect && (
                  <div className="pl-4 space-y-1">
                    <Button
                      variant={selectedEpic === null ? "default" : "ghost"}
                      size="sm"
                      className={cn(
                        "w-full justify-start transition-colors",
                        selectedEpic === null 
                          ? "bg-zinc-800 text-zinc-100 hover:bg-zinc-800/90" 
                          : "text-zinc-300 hover:bg-zinc-800/50 hover:text-zinc-100"
                      )}
                      onClick={() => handleEpicClick(null)}
                    >
                      All Tasks
                    </Button>
                    <Button
                      variant={selectedEpic === 'none' ? "default" : "ghost"}
                      size="sm"
                      className={cn(
                        "w-full justify-start transition-colors",
                        selectedEpic === 'none'
                          ? "bg-zinc-800 text-zinc-100 hover:bg-zinc-800/90"
                          : "text-zinc-300 hover:bg-zinc-800/50 hover:text-zinc-100"
                      )}
                      onClick={() => handleEpicClick(selectedEpic === 'none' ? null : 'none')}
                    >
                      No Epic
                    </Button>
                    {epics.map(epic => (
                      <Button
                        key={epic.id}
                        variant={selectedEpic === epic.id ? "default" : "ghost"}
                        size="sm"
                        className={cn(
                          "w-full justify-start text-left whitespace-normal",
                          selectedEpic === epic.id
                            ? "bg-zinc-800 text-zinc-100 hover:bg-zinc-800/90"
                            : "text-zinc-300 hover:bg-zinc-800/50 hover:text-zinc-100"
                        )}
                        onClick={() => handleEpicClick(epic.id)}
                      >
                        {epic.title}
                      </Button>
                    ))}
                  </div>
                )}
              </div>

              {/* Tags filter */}
              <div className="space-y-1">
                <button
                  onClick={() => setIsTagsOpen(!isTagsOpen)}
                  className="flex items-center gap-2 w-full px-3 py-2 text-sm font-medium text-zinc-300 hover:text-zinc-100"
                >
                  {isTagsOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                  Tags
                </button>
                {isTagsOpen && onTagSelect && (
                  <div className="pl-4 space-y-1">
                    {tags.map(tag => (
                      <Button
                        key={tag}
                        variant={selectedTags.includes(tag) ? "default" : "ghost"}
                        size="sm"
                        className={cn(
                          "w-full justify-start gap-2 transition-colors",
                          selectedTags.includes(tag)
                            ? "bg-zinc-800 text-zinc-100 hover:bg-zinc-800/90 active:bg-zinc-800/80"
                            : "text-zinc-300 hover:bg-zinc-800/50 hover:text-zinc-100"
                        )}
                        onClick={() => handleTagClick(tag)}
                      >
                        <Hash className="h-3.5 w-3.5" />
                        {tag}
                      </Button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Add the update refs button at the bottom */}
          <div className="mt-auto p-4 border-t border-zinc-800">
            <Button 
              variant="outline" 
              className={cn(
                "w-full justify-start transition-colors",
                isUpdating && "opacity-70 cursor-not-allowed"
              )}
              onClick={updateRefs}
              disabled={isUpdating}
            >
              <RefreshCw className={cn(
                "mr-2 h-4 w-4",
                isUpdating && "animate-spin"
              )} />
              {isUpdating ? "Updating..." : "Update Task Refs"}
            </Button>
          </div>
        </div>
      </aside>
    </>
  )
} 