import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { TaskCard } from './task-card'
import { Task } from '@/lib/tasks'

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
  } = useSortable({ id: task.filename })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1
  }

  return (
    <div ref={setNodeRef} style={style} className="flex items-center gap-3">
      <div 
        {...attributes} 
        {...listeners} 
        className="flex items-center justify-center w-6 h-6 rounded-full bg-zinc-800/50 text-zinc-600 text-sm font-medium cursor-grab hover:bg-zinc-800 hover:text-zinc-500 transition-colors"
        onClick={(e) => e.stopPropagation()}
      >
        {number}
      </div>
      <div className="flex-1" onClick={(e) => e.stopPropagation()}>
        <TaskCard task={task} {...props} />
      </div>
    </div>
  )
} 