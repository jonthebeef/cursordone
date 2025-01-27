"use client";

import { Epic } from "@/lib/epics";
import {
  createEpicAction,
  deleteEpicAction,
  updateEpicAction,
} from "@/lib/actions";
import { useState } from "react";
import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ui/use-toast";
import { Pencil, Trash2 } from "lucide-react";
import { TagInput } from "@/components/ui/tag-input";
import ReactMarkdown from "react-markdown";
import { Card, CardHeader } from "@/components/ui/card";

interface EpicListProps {
  initialEpics: Epic[];
}

const priorityColors = {
  low: "bg-background hover:bg-muted border-border",
  medium: "bg-background hover:bg-muted border-border",
  high: "bg-background hover:bg-muted border-border",
};

const statusColors = {
  planned: "bg-slate-800 text-slate-50",
  active: "bg-green-800 text-green-50",
  completed: "bg-blue-800 text-blue-50",
};

const components = {
  h1: ({ children }: { children: ReactNode }) => (
    <h1 className="text-foreground">{children}</h1>
  ),
  h2: ({ children }: { children: ReactNode }) => (
    <h2 className="text-foreground">{children}</h2>
  ),
  h3: ({ children }: { children: ReactNode }) => (
    <h3 className="text-foreground">{children}</h3>
  ),
  p: ({ children }: { children: ReactNode }) => (
    <p className="text-foreground">{children}</p>
  ),
  ul: ({ children }: { children: ReactNode }) => (
    <ul className="text-foreground">{children}</ul>
  ),
  ol: ({ children }: { children: ReactNode }) => (
    <ol className="text-foreground">{children}</ol>
  ),
  li: ({ children }: { children: ReactNode }) => (
    <li className="text-foreground">{children}</li>
  ),
};

function formatDate(dateStr: string) {
  const date = new Date(dateStr);
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
}

export function EpicList({ initialEpics }: EpicListProps) {
  const router = useRouter();
  const [selectedEpic, setSelectedEpic] = useState<Epic | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [newTagInput, setNewTagInput] = useState("");
  const [editTagInput, setEditTagInput] = useState("");
  const [newEpic, setNewEpic] = useState<
    Omit<Epic, "id"> & { content: string }
  >({
    title: "",
    description: "",
    status: "planned",
    priority: "medium",
    created: new Date().toISOString().split("T")[0],
    content: `# New Epic

## Objectives

- 

## Key Features

1. 

## Success Criteria

- [ ] 

## Related Tasks

- `,
  });

  const [isEditing, setIsEditing] = useState(false);
  const [editedEpic, setEditedEpic] = useState<Epic | null>(null);

  const handleDelete = async () => {
    if (!selectedEpic || isDeleting) return;
    setIsDeleting(true);
    try {
      await deleteEpicAction(selectedEpic.id);
      router.refresh();
      setSelectedEpic(null);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleCreate = async () => {
    if (isCreating) return;
    setIsCreating(true);
    try {
      const epicToCreate = {
        ...newEpic,
        tags: newTagInput
          ? newTagInput
              .split(",")
              .map((t) => t.trim())
              .filter(Boolean)
          : [],
      };
      await createEpicAction(epicToCreate);
      router.refresh();
      setShowCreateDialog(false);
      setNewTagInput("");
      setNewEpic({
        title: "",
        description: "",
        status: "planned",
        priority: "medium",
        created: new Date().toISOString().split("T")[0],
        content: `# New Epic\n\n## Objectives\n\n- \n\n## Key Features\n\n1. \n\n## Success Criteria\n\n- [ ] \n\n## Related Tasks\n\n- `,
      });
    } finally {
      setIsCreating(false);
    }
  };

  const handleEdit = () => {
    if (!selectedEpic) return;
    setEditedEpic(selectedEpic);
    setEditTagInput(selectedEpic.tags?.join(", ") || "");
    setIsEditing(true);
  };

  const handleSave = async () => {
    if (!editedEpic) return;
    try {
      const epicToSave = {
        ...editedEpic,
        tags: editTagInput
          ? editTagInput
              .split(",")
              .map((t) => t.trim())
              .filter(Boolean)
          : [],
      };
      await updateEpicAction(editedEpic.id, epicToSave);
      router.refresh();
      setIsEditing(false);
      setSelectedEpic(null);
      setEditTagInput("");
    } catch (error) {
      console.error("Failed to update epic:", error);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <Button
          onClick={() => setShowCreateDialog(true)}
          className="bg-blue-500 text-white hover:bg-blue-600"
        >
          Create Epic
        </Button>
      </div>

      <div className="space-y-4">
        {initialEpics.map((epic) => (
          <div
            key={epic.id}
            onClick={() => setSelectedEpic(epic)}
            className="p-4 bg-zinc-900/50 border border-zinc-800 rounded-lg hover:border-zinc-700 transition-colors cursor-pointer"
          >
            <div className="flex items-center justify-between gap-4">
              <h3 className="text-lg font-medium text-zinc-100">
                {epic.title}
              </h3>
              <span
                className={cn(
                  "px-2.5 py-0.5 text-xs font-semibold rounded-full capitalize shrink-0",
                  statusColors[epic.status],
                )}
              >
                {epic.status}
              </span>
            </div>
            <p className="mt-2 text-sm text-zinc-400 line-clamp-2">
              {epic.description}
            </p>
            {epic.tags && epic.tags.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-3">
                {epic.tags.map((tag) => (
                  <span
                    key={tag}
                    className="px-2 py-0.5 bg-zinc-800/50 rounded text-xs text-zinc-400"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}
            <div className="mt-2 text-xs text-zinc-500">
              Created: {formatDate(epic.created)}
            </div>
          </div>
        ))}
      </div>

      <Dialog
        open={selectedEpic !== null}
        onOpenChange={(open) => !open && setSelectedEpic(null)}
      >
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto bg-background border-border">
          <DialogHeader>
            <div className="flex justify-between items-center">
              <DialogTitle>{selectedEpic?.title}</DialogTitle>
              <div className="flex gap-2">
                <Button variant="ghost" size="sm" onClick={handleEdit}>
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleDelete}
                  disabled={isDeleting}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex gap-2">
              <span
                className={cn(
                  "px-2.5 py-0.5 text-xs font-semibold rounded-full capitalize",
                  statusColors[selectedEpic?.status || "planned"],
                )}
              >
                {selectedEpic?.status}
              </span>
              <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full capitalize bg-muted/80 text-foreground">
                Priority: {selectedEpic?.priority}
              </span>
            </div>
            <p className="text-foreground/80">{selectedEpic?.description}</p>
            <div className="max-w-none">
              <ReactMarkdown
                components={{
                  h1: ({ children }) => (
                    <h1 className="text-2xl font-bold mb-4 text-white">
                      {children}
                    </h1>
                  ),
                  h2: ({ children }) => (
                    <h2 className="text-xl font-semibold mb-3 text-white">
                      {children}
                    </h2>
                  ),
                  h3: ({ children }) => (
                    <h3 className="text-lg font-medium mb-2 text-white">
                      {children}
                    </h3>
                  ),
                  p: ({ children }) => (
                    <p className="mb-4 text-white">{children}</p>
                  ),
                  ul: ({ children }) => (
                    <ul className="list-disc pl-5 mb-4 text-white">
                      {children}
                    </ul>
                  ),
                  ol: ({ children }) => (
                    <ol className="list-decimal pl-5 mb-4 text-white">
                      {children}
                    </ol>
                  ),
                  li: ({ children }) => (
                    <li className="mb-1 text-white">{children}</li>
                  ),
                }}
              >
                {selectedEpic?.content || ""}
              </ReactMarkdown>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Create Epic Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto bg-background border-border">
          <DialogHeader>
            <DialogTitle>Create Epic</DialogTitle>
          </DialogHeader>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleCreate();
            }}
            className="space-y-4 mt-4"
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2 space-y-2">
                <label className="text-sm font-medium">Title</label>
                <input
                  type="text"
                  value={newEpic.title}
                  onChange={(e) =>
                    setNewEpic((prev) => ({ ...prev, title: e.target.value }))
                  }
                  className="w-full px-3 py-1.5 bg-background border-input rounded-md"
                  required
                />
              </div>

              <div className="sm:col-span-2 space-y-2">
                <label className="text-sm font-medium">Description</label>
                <input
                  type="text"
                  value={newEpic.description}
                  onChange={(e) =>
                    setNewEpic((prev) => ({
                      ...prev,
                      description: e.target.value,
                    }))
                  }
                  className="w-full px-3 py-1.5 bg-background border-input rounded-md"
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Status</label>
                <select
                  value={newEpic.status}
                  onChange={(e) =>
                    setNewEpic((prev) => ({
                      ...prev,
                      status: e.target.value as Epic["status"],
                    }))
                  }
                  className="w-full px-3 py-1.5 bg-background border-input rounded-md"
                >
                  <option value="planned">Planned</option>
                  <option value="active">Active</option>
                  <option value="completed">Completed</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Priority</label>
                <div className="flex gap-2">
                  {(["low", "medium", "high"] as const).map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() =>
                        setNewEpic((prev) => ({ ...prev, priority: p }))
                      }
                      className={cn(
                        "px-3 py-1.5 rounded-md capitalize text-sm flex-1",
                        newEpic.priority === p
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted hover:bg-muted/80",
                      )}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>

              <div className="sm:col-span-2">
                <TagInput
                  selectedTags={
                    newTagInput
                      ? newTagInput
                          .split(",")
                          .map((t) => t.trim())
                          .filter(Boolean)
                      : []
                  }
                  onTagsChange={(tags) => setNewTagInput(tags.join(", "))}
                />
              </div>

              <div className="sm:col-span-2 space-y-2">
                <label className="text-sm font-medium">
                  Content (Markdown)
                </label>
                <textarea
                  value={newEpic.content}
                  onChange={(e) =>
                    setNewEpic((prev) => ({ ...prev, content: e.target.value }))
                  }
                  className="w-full h-96 px-3 py-2 bg-background border-input rounded-md font-mono text-sm"
                  required
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <Button
                variant="outline"
                type="button"
                onClick={() => setShowCreateDialog(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isCreating}>
                {isCreating ? "Creating..." : "Create Epic"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* View/Edit Epic Dialog */}
      <Dialog open={!!selectedEpic} onOpenChange={() => setSelectedEpic(null)}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto bg-background border-border">
          {selectedEpic && (
            <>
              <DialogHeader>
                <div className="flex items-center justify-between">
                  <DialogTitle>{selectedEpic.title}</DialogTitle>
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="sm" onClick={handleEdit}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleDelete}
                      disabled={isDeleting}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </DialogHeader>

              {isEditing ? (
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleSave();
                  }}
                  className="space-y-4 mt-4"
                >
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="sm:col-span-2 space-y-2">
                      <label className="text-sm font-medium">Title</label>
                      <input
                        type="text"
                        value={editedEpic?.title || ""}
                        onChange={(e) =>
                          setEditedEpic((prev) =>
                            prev ? { ...prev, title: e.target.value } : null,
                          )
                        }
                        className="w-full px-3 py-1.5 bg-background border-input rounded-md"
                        required
                      />
                    </div>

                    <div className="sm:col-span-2 space-y-2">
                      <label className="text-sm font-medium">Description</label>
                      <input
                        type="text"
                        value={editedEpic?.description || ""}
                        onChange={(e) =>
                          setEditedEpic((prev) =>
                            prev
                              ? { ...prev, description: e.target.value }
                              : null,
                          )
                        }
                        className="w-full px-3 py-1.5 bg-background border-input rounded-md"
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium">Status</label>
                      <select
                        value={editedEpic?.status || "planned"}
                        onChange={(e) =>
                          setEditedEpic((prev) =>
                            prev
                              ? {
                                  ...prev,
                                  status: e.target.value as Epic["status"],
                                }
                              : null,
                          )
                        }
                        className="w-full px-3 py-1.5 bg-background border-input rounded-md"
                      >
                        <option value="planned">Planned</option>
                        <option value="active">Active</option>
                        <option value="completed">Completed</option>
                      </select>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium">Priority</label>
                      <div className="flex gap-2">
                        {(["low", "medium", "high"] as const).map((p) => (
                          <button
                            key={p}
                            type="button"
                            onClick={() =>
                              setEditedEpic((prev) =>
                                prev ? { ...prev, priority: p } : null,
                              )
                            }
                            className={cn(
                              "px-3 py-1.5 rounded-md capitalize text-sm flex-1",
                              editedEpic?.priority === p
                                ? "bg-primary text-primary-foreground"
                                : "bg-muted hover:bg-muted/80",
                            )}
                          >
                            {p}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="sm:col-span-2">
                      <TagInput
                        selectedTags={
                          editTagInput
                            ? editTagInput
                                .split(",")
                                .map((t) => t.trim())
                                .filter(Boolean)
                            : []
                        }
                        onTagsChange={(tags) =>
                          setEditTagInput(tags.join(", "))
                        }
                      />
                    </div>

                    <div className="sm:col-span-2 space-y-2">
                      <label className="text-sm font-medium">
                        Content (Markdown)
                      </label>
                      <textarea
                        value={editedEpic?.content || ""}
                        onChange={(e) =>
                          setEditedEpic((prev) =>
                            prev ? { ...prev, content: e.target.value } : null,
                          )
                        }
                        className="w-full h-96 px-3 py-2 bg-background border-input rounded-md font-mono text-sm"
                        required
                      />
                    </div>
                  </div>

                  <div className="flex justify-end gap-3 pt-4">
                    <Button
                      variant="outline"
                      type="button"
                      onClick={() => {
                        setIsEditing(false);
                        setEditedEpic(null);
                      }}
                    >
                      Cancel
                    </Button>
                    <Button type="submit">Save Changes</Button>
                  </div>
                </form>
              ) : (
                <div className="space-y-6 mt-4">
                  <div className="flex items-center gap-4">
                    <span
                      className={cn(
                        "px-2.5 py-1 rounded-full text-sm font-medium capitalize",
                        statusColors[selectedEpic.status],
                      )}
                    >
                      {selectedEpic.status}
                    </span>
                    <span
                      className={cn(
                        "px-2.5 py-1 rounded-full text-sm font-medium capitalize",
                        selectedEpic.priority === "high" &&
                          "bg-amber-100 text-amber-700",
                        selectedEpic.priority === "medium" &&
                          "bg-blue-100 text-blue-700",
                        selectedEpic.priority === "low" &&
                          "bg-slate-100 text-slate-700",
                      )}
                    >
                      {selectedEpic.priority} priority
                    </span>
                  </div>

                  <div className="max-w-none">
                    <ReactMarkdown
                      components={{
                        h1: ({ children }) => (
                          <h1 className="text-2xl font-bold mb-4 text-white">
                            {children}
                          </h1>
                        ),
                        h2: ({ children }) => (
                          <h2 className="text-xl font-semibold mb-3 text-white">
                            {children}
                          </h2>
                        ),
                        h3: ({ children }) => (
                          <h3 className="text-lg font-medium mb-2 text-white">
                            {children}
                          </h3>
                        ),
                        p: ({ children }) => (
                          <p className="mb-4 text-white">{children}</p>
                        ),
                        ul: ({ children }) => (
                          <ul className="list-disc pl-5 mb-4 text-white">
                            {children}
                          </ul>
                        ),
                        ol: ({ children }) => (
                          <ol className="list-decimal pl-5 mb-4 text-white">
                            {children}
                          </ol>
                        ),
                        li: ({ children }) => (
                          <li className="mb-1 text-white">{children}</li>
                        ),
                      }}
                    >
                      {selectedEpic.content || ""}
                    </ReactMarkdown>
                  </div>
                </div>
              )}
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
