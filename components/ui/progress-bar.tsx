'use client'

import { cn } from '@/lib/utils'

interface ProgressBarProps {
  value: number
  className?: string
}

export function ProgressBar({ value, className }: ProgressBarProps) {
  return (
    <div className={cn('w-full h-2 bg-gray-200 rounded-full overflow-hidden', className)}>
      <div
        className="h-full bg-blue-500 transition-all duration-300"
        style={{ width: `${value}%` }}
      />
    </div>
  )
}
