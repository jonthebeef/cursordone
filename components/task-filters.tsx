'use client'

import { SideNav } from "@/components/ui/side-nav"

interface TaskFiltersProps {
  epics: { id: string; title: string }[]
  tags: string[]
  selectedEpic: string | null
  selectedTags: string[]
  onEpicSelect: (epicId: string | null) => void
  onTagSelect: (tag: string) => void
}

export function TaskFilters({ 
  epics, 
  tags,
  selectedEpic,
  selectedTags,
  onEpicSelect,
  onTagSelect
}: TaskFiltersProps) {
  return (
    <SideNav
      epics={epics}
      tags={tags}
      selectedEpic={selectedEpic}
      selectedTags={selectedTags}
      onEpicSelect={onEpicSelect}
      onTagSelect={onTagSelect}
    />
  )
} 