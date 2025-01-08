import { getAllEpics } from "@/lib/epics"
import { EpicList } from "@/components/epic-list"
import { GeistMono } from 'geist/font/mono'

export default async function EpicsPage() {
  const epics = await getAllEpics()
  
  // Ensure the data is serializable
  const serializedEpics = epics.map(epic => ({
    ...epic,
    created: epic.created.toString(),
  }))
  
  return (
    <div className="container py-8 space-y-8">
      <div className="space-y-1">
        <h1 className={`text-3xl font-bold tracking-tight ${GeistMono.className}`}>Epic Overview</h1>
        <p className="text-muted-foreground">
          Track and manage high-level project initiatives and their associated tasks.
        </p>
      </div>
      <EpicList initialEpics={serializedEpics} />
    </div>
  )
} 