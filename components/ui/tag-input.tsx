import React from 'react'

interface TagInputProps {
  value: string
  onChange: (value: string) => void
  className?: string
  placeholder?: string
}

export function TagInput({ value, onChange, className = '', placeholder = 'tag1, tag2, tag3' }: TagInputProps) {
  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-zinc-400">
        Tags (optional, comma-separated)
      </label>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`w-full px-3 py-1.5 bg-zinc-900/50 border border-zinc-800 rounded-md text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500/20 ${className}`}
        placeholder={placeholder}
      />
    </div>
  )
} 