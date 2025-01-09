"use client"

import { RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useToast } from "@/components/ui/use-toast"

export function Sidebar() {
  const { toast } = useToast()

  const updateRefs = async () => {
    try {
      toast({
        title: "Updating refs...",
        description: "Checking for new tasks and updating references.",
      })

      const response = await fetch('/api/update-refs', { method: 'POST' })
      const data = await response.json()
      
      if (data.error) {
        toast({
          title: "Error",
          description: data.error,
          variant: "destructive"
        })
        return
      }

      if (!data.isValid) {
        toast({
          title: "Warning",
          description: "Found gaps or duplicates in task references. Some cleanup may be needed.",
          variant: "destructive"
        })
      }

      if (data.updatedCount > 0) {
        toast({
          title: "Success",
          description: `Updated ${data.updatedCount} task${data.updatedCount === 1 ? '' : 's'} with new references.`
        })
      } else {
        toast({
          title: "No updates needed",
          description: "All tasks already have reference numbers."
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update task references. Please try again.",
        variant: "destructive"
      })
    }
  }

  return (
    <aside className="pb-12 w-64 border-r">
      <div className="space-y-4 py-4">
        {/* Existing sidebar content */}
      </div>
      
      <div className="px-3 py-2 mt-auto">
        <Button 
          variant="outline" 
          className="w-full justify-start"
          onClick={updateRefs}
        >
          <RefreshCw className="mr-2 h-4 w-4" />
          Update Task Refs
        </Button>
      </div>
    </aside>
  )
} 