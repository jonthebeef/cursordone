'use client'

import { cn } from "@/lib/utils"
import { FileText, Hash, Pencil, Trash2 } from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import type { Doc } from "@/lib/docs"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { useState } from "react"
import ReactMarkdown from "react-markdown"
import { TextEditor } from "@/components/ui/text-editor"
import { Button } from "@/components/ui/button"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
import { updateDocAction, deleteDocAction } from "@/lib/doc-actions"
import { useRouter } from "next/navigation"

interface DocListProps {
  docs: Doc[]
  searchQuery: string
}

export function DocList({ docs, searchQuery }: DocListProps) {
  const router = useRouter()
  const [selectedDoc, setSelectedDoc] = useState<Doc | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [editedDoc, setEditedDoc] = useState<Doc | null>(null)
  const [editTagInput, setEditTagInput] = useState("")
  const [docToDelete, setDocToDelete] = useState<Doc | null>(null)

  const handleDelete = async () => {
    if (!docToDelete) return

    try {
      const result = await deleteDocAction(docToDelete.filename)
      if (result.success) {
        setSelectedDoc(null)
        router.refresh()
      } else {
        console.error('Failed to delete document:', result.error)
      }
    } catch (error) {
      console.error('Failed to delete document:', error)
    }
    setDocToDelete(null)
  }

  const handleStartEditing = () => {
    setEditedDoc(selectedDoc)
    setEditTagInput(selectedDoc?.tags?.join(", ") || "")
    setIsEditing(true)
  }

  const handleSave = async () => {
    if (!editedDoc || !selectedDoc) return

    const tags = editTagInput
      .split(",")
      .map(tag => tag.trim())
      .filter(tag => tag.length > 0)

    try {
      await updateDocAction(selectedDoc.filename, {
        ...editedDoc,
        tags
      })
      setSelectedDoc({
        ...editedDoc,
        tags
      })
      setIsEditing(false)
      router.refresh()
    } catch (error) {
      console.error("Failed to update document:", error)
    }
  }

  const filteredDocs = docs.filter(doc => {
    const searchLower = searchQuery.toLowerCase()
    return (
      doc.title.toLowerCase().includes(searchLower) ||
      doc.description?.toLowerCase().includes(searchLower) ||
      doc.type.toLowerCase().includes(searchLower) ||
      doc.tags?.some(tag => tag.toLowerCase().includes(searchLower))
    )
  })

  if (filteredDocs.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-zinc-400">
        <FileText className="w-12 h-12 mb-4" />
        <p className="text-lg font-medium">No documents found</p>
        <p className="text-sm">Try adjusting your search query</p>
      </div>
    )
  }

  return (
    <>
      <div className="space-y-1">
        {filteredDocs.map((doc) => (
          <div
            key={doc.filename}
            onClick={() => setSelectedDoc(doc)}
            className="p-3 bg-zinc-900/50 border border-zinc-800 rounded-lg hover:border-zinc-700 transition-colors cursor-pointer group"
          >
            <div className="flex items-center justify-between gap-4">
              <h3 className="text-lg font-medium text-zinc-100">
                {doc.title}
              </h3>
              <div className={cn(
                "px-2 py-1 text-xs font-medium rounded-md whitespace-nowrap",
                doc.type === 'documentation' && "bg-blue-500/10 text-blue-400",
                doc.type === 'architecture' && "bg-purple-500/10 text-purple-400",
                doc.type === 'guide' && "bg-green-500/10 text-green-400",
                doc.type === 'api' && "bg-yellow-500/10 text-yellow-400",
                doc.type === 'delivery' && "bg-orange-500/10 text-orange-400",
                doc.type === 'product' && "bg-pink-500/10 text-pink-400",
                doc.type === 'business' && "bg-indigo-500/10 text-indigo-400",
                doc.type === 'design' && "bg-cyan-500/10 text-cyan-400",
                doc.type === 'stakeholders' && "bg-rose-500/10 text-rose-400",
                doc.type === 'operations' && "bg-emerald-500/10 text-emerald-400"
              )}>
                {doc.type}
              </div>
            </div>
            {doc.description && (
              <p className="mt-1 text-sm text-zinc-400">
                {doc.description}
              </p>
            )}
            {doc.tags && doc.tags.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {doc.tags.map((tag) => (
                  <div
                    key={tag}
                    className="flex items-center gap-1 px-2 py-0.5 bg-zinc-800/50 rounded text-xs text-zinc-400"
                  >
                    <Hash className="w-3 h-3" />
                    {tag}
                  </div>
                ))}
              </div>
            )}
            <div className="mt-2 text-xs text-zinc-500">
              Created {formatDistanceToNow(new Date(doc.created))} ago
            </div>
          </div>
        ))}
      </div>

      <Dialog open={selectedDoc !== null} onOpenChange={() => {
        setSelectedDoc(null)
        setIsEditing(false)
        setEditedDoc(null)
      }}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <DialogTitle className="text-2xl font-medium tracking-tight text-zinc-100 font-mono">
                {isEditing ? (
                  <input
                    type="text"
                    value={editedDoc?.title || ""}
                    onChange={e => setEditedDoc(prev => prev ? { ...prev, title: e.target.value } : null)}
                    className="w-full bg-transparent"
                  />
                ) : (
                  selectedDoc?.title
                )}
              </DialogTitle>
              <div className="flex gap-2">
                {!isEditing && (
                  <Button onClick={handleStartEditing} size="sm" variant="ghost">
                    <Pencil className="h-4 w-4" />
                  </Button>
                )}
                <Button onClick={() => setDocToDelete(selectedDoc)} size="sm" variant="ghost">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </DialogHeader>

          {isEditing ? (
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Description</label>
                <input
                  type="text"
                  value={editedDoc?.description || ""}
                  onChange={e => setEditedDoc(prev => prev ? { ...prev, description: e.target.value } : null)}
                  className="w-full bg-transparent mt-1"
                />
              </div>

              <div>
                <label className="text-sm font-medium">Content</label>
                <TextEditor
                  value={editedDoc?.content || ""}
                  onChange={content => setEditedDoc(prev => prev ? { ...prev, content } : null)}
                  className="min-h-[400px]"
                />
              </div>

              <div>
                <label className="text-sm font-medium">Type</label>
                <select
                  value={editedDoc?.type || "documentation"}
                  onChange={e => setEditedDoc(prev => prev ? { ...prev, type: e.target.value as Doc["type"] } : null)}
                  className="w-full bg-transparent mt-1"
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
              </div>

              <div>
                <label className="text-sm font-medium">Tags</label>
                <input
                  type="text"
                  value={editTagInput}
                  onChange={e => setEditTagInput(e.target.value)}
                  placeholder="Enter tags separated by commas"
                  className="w-full bg-transparent mt-1"
                />
              </div>

              <div className="flex justify-end gap-2">
                <Button onClick={() => {
                  setIsEditing(false)
                  setEditedDoc(null)
                }} variant="ghost">
                  Cancel
                </Button>
                <Button onClick={handleSave}>
                  Save
                </Button>
              </div>
            </div>
          ) : (
            <>
              <div className="text-sm text-zinc-400">
                {selectedDoc?.description}
              </div>
              <div className="mt-6 prose prose-invert max-w-none">
                <ReactMarkdown>
                  {selectedDoc?.content || ""}
                </ReactMarkdown>
              </div>
              {selectedDoc?.tags && selectedDoc.tags.length > 0 && (
                <div className="mt-4 flex flex-wrap gap-2">
                  {selectedDoc.tags.map(tag => (
                    <span key={tag} className="px-2 py-1 bg-zinc-800 rounded-full text-xs">
                      {tag}
                    </span>
                  ))}
                </div>
              )}
              {selectedDoc && (
                <div className="mt-4 text-xs text-zinc-500">
                  Created {formatDistanceToNow(new Date(selectedDoc.created))} ago
                </div>
              )}
            </>
          )}
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!docToDelete} onOpenChange={(open) => !open && setDocToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure you want to delete this document?</AlertDialogTitle>
            <AlertDialogDescription>
              Deleting this document removes the file from your local system. You may be able to retrieve it if you have committed your project recently to git. If not, it will be gone forever.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Delete document
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
} 