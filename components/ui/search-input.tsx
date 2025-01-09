'use client'

import { Search, X } from "lucide-react"
import { useState } from "react"

interface SearchInputProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  className?: string
}

export function SearchInput({ value, onChange, placeholder = "Search...", className = "" }: SearchInputProps) {
  return (
    <div className="relative w-[320px]">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full pl-9 pr-8 py-1.5 bg-zinc-900/50 border border-zinc-800 rounded-md text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500/20"
      />
      {value && (
        <button
          onClick={() => onChange('')}
          className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 rounded-sm text-zinc-400 hover:text-zinc-300 focus:outline-none"
          type="button"
          aria-label="Clear search"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  )
} 