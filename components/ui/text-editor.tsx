'use client'

import { useState, useCallback } from 'react'
import { cn } from '@/lib/utils'
import { Bold, Italic, List, ListOrdered, ImagePlus, FileUp, Eye, Edit2 } from 'lucide-react'
import { MarkdownPreview } from '@/components/ui/markdown-preview'

interface TextEditorProps {
  value: string
  onChange: (value: string) => void
  onImageUpload?: (file: File) => Promise<string>
  onFileUpload?: (file: File) => Promise<string>
  className?: string
  placeholder?: string
}

export function TextEditor({
  value,
  onChange,
  onImageUpload,
  onFileUpload,
  className,
  placeholder = 'Type your content here...'
}: TextEditorProps) {
  const [selectionStart, setSelectionStart] = useState(0)
  const [selectionEnd, setSelectionEnd] = useState(0)
  const [isPreviewMode, setIsPreviewMode] = useState(false)

  const handleFormat = useCallback((format: string) => {
    const textarea = document.querySelector('textarea') as HTMLTextAreaElement
    if (!textarea) return

    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const selectedText = value.substring(start, end)

    let newText = value
    let newCursorPos = end

    switch (format) {
      case 'bold':
        newText = value.substring(0, start) + `**${selectedText}**` + value.substring(end)
        newCursorPos = end + 4
        break
      case 'italic':
        newText = value.substring(0, start) + `_${selectedText}_` + value.substring(end)
        newCursorPos = end + 2
        break
      case 'bullet':
        newText = value.substring(0, start) + `\n- ${selectedText}` + value.substring(end)
        newCursorPos = end + 3
        break
      case 'number':
        newText = value.substring(0, start) + `\n1. ${selectedText}` + value.substring(end)
        newCursorPos = end + 4
        break
    }

    onChange(newText)
    setTimeout(() => {
      textarea.focus()
      textarea.setSelectionRange(newCursorPos, newCursorPos)
    }, 0)
  }, [value, onChange])

  const handleSelect = (e: React.SyntheticEvent<HTMLTextAreaElement>) => {
    const textarea = e.target as HTMLTextAreaElement
    setSelectionStart(textarea.selectionStart)
    setSelectionEnd(textarea.selectionEnd)
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-1 pb-2">
        {!isPreviewMode && (
          <>
            <button
              type="button"
              onClick={() => handleFormat('bold')}
              className="p-1.5 rounded hover:bg-zinc-800 text-zinc-400 hover:text-zinc-300"
              title="Bold"
            >
              <Bold className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => handleFormat('italic')}
              className="p-1.5 rounded hover:bg-zinc-800 text-zinc-400 hover:text-zinc-300"
              title="Italic"
            >
              <Italic className="w-4 h-4" />
            </button>
            <div className="w-px h-4 bg-zinc-800 mx-1" />
            <button
              type="button"
              onClick={() => handleFormat('bullet')}
              className="p-1.5 rounded hover:bg-zinc-800 text-zinc-400 hover:text-zinc-300"
              title="Bullet List"
            >
              <List className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => handleFormat('number')}
              className="p-1.5 rounded hover:bg-zinc-800 text-zinc-400 hover:text-zinc-300"
              title="Numbered List"
            >
              <ListOrdered className="w-4 h-4" />
            </button>
            {(onImageUpload || onFileUpload) && (
              <>
                <div className="w-px h-4 bg-zinc-800 mx-1" />
                {onImageUpload && (
                  <label className="p-1.5 rounded hover:bg-zinc-800 text-zinc-400 hover:text-zinc-300 cursor-pointer" title="Add Image">
                    <ImagePlus className="w-4 h-4" />
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={async (e) => {
                        const file = e.target.files?.[0]
                        if (!file || !onImageUpload) return

                        try {
                          const imageUrl = await onImageUpload(file)
                          const imageMarkdown = `\n![${file.name}](${imageUrl})\n`
                          onChange(value + imageMarkdown)
                        } catch (error) {
                          console.error('Failed to upload image:', error)
                        }
                      }}
                    />
                  </label>
                )}
                {onFileUpload && (
                  <label className="p-1.5 rounded hover:bg-zinc-800 text-zinc-400 hover:text-zinc-300 cursor-pointer" title="Add File">
                    <FileUp className="w-4 h-4" />
                    <input
                      type="file"
                      className="hidden"
                      onChange={async (e) => {
                        const file = e.target.files?.[0]
                        if (!file || !onFileUpload) return

                        try {
                          const fileUrl = await onFileUpload(file)
                          const fileMarkdown = `\n[📎 ${file.name}](${fileUrl})\n`
                          onChange(value + fileMarkdown)
                        } catch (error) {
                          console.error('Failed to upload file:', error)
                        }
                      }}
                    />
                  </label>
                )}
              </>
            )}
          </>
        )}
        <div className="flex-1" />
        <button
          type="button"
          onClick={() => setIsPreviewMode(!isPreviewMode)}
          className="p-1.5 rounded hover:bg-zinc-800 text-zinc-400 hover:text-zinc-300"
          title={isPreviewMode ? "Edit" : "Preview"}
        >
          {isPreviewMode ? <Edit2 className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
        </button>
      </div>
      {isPreviewMode ? (
        <div className={cn(
          "w-full px-4 py-3 bg-zinc-900/50 border border-zinc-800 rounded-md text-zinc-100",
          className
        )}>
          <MarkdownPreview content={value} />
        </div>
      ) : (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onSelect={handleSelect}
          className={cn(
            "w-full px-4 py-3 bg-zinc-900/50 border border-zinc-800 rounded-md text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500/20",
            className
          )}
          placeholder={placeholder}
        />
      )}
    </div>
  )
} 