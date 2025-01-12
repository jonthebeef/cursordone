import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { TaskCard } from './task-card'
import { Task } from '@/lib/tasks'
import { CSSProperties } from 'react'
import { GripVertical } from 'lucide-react'

interface SortableTaskCardProps {
  task: Task
  number: number
  onComplete: (filename: string) => Promise<void>
  onClick: (task: Task) => void
}

export function SortableTaskCard({ task, number, ...props }: SortableTaskCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ 
    id: task.filename,
    data: task
  })

  const style: CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    position: 'relative',
    touchAction: 'none'
  }

  return (
    <div 
      ref={setNodeRef} 
      style={style} 
      className="group relative"
    >
      <div className="flex items-center gap-3">
        <div 
          className="flex items-center gap-2 select-none"
          {...attributes}
          {...listeners}
        >
          <div className="flex items-center justify-center w-6 h-6 rounded-full bg-zinc-800/50 text-zinc-600 text-sm font-medium cursor-grab active:cursor-grabbing hover:bg-zinc-800 hover:text-zinc-500 transition-colors">
            {number}
          </div>
          <GripVertical className="w-4 h-4 text-zinc-600 opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing" />
        </div>
        <div className="flex-1" onClick={(e) => e.stopPropagation()}>
          <TaskCard task={task} {...props} />
        </div>
      </div>
    </div>
  )
} 