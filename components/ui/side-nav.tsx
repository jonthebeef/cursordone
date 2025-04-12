"use client";

import { cn } from "@/lib/utils";
import {
  Menu,
  X,
  LayoutList,
  Layers,
  ChevronDown,
  ChevronRight,
  Hash,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  Info,
  FileText,
  Star,
  LogOut,
  Settings,
  GitCompare,
} from "lucide-react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { useState, useEffect, Suspense } from "react";
import { Button } from "./button";
import { useToast } from "./use-toast";
import { supabase } from "@/lib/supabase/client";
import { useAuth } from "@/components/providers/auth-provider";
import { Separator } from "@/components/ui/separator";
import { ProfileButton } from "@/components/user/profile-button";
import dynamic from "next/dynamic";

// Define a placeholder component for when GitSyncStatus is loading
const GitSyncStatusPlaceholder = () => (
  <div className="h-8 w-24 bg-gray-200 animate-pulse rounded" />
);

// Dynamically import the GitSyncStatus component with SSR disabled
const GitSyncStatusComponent = dynamic(
  () =>
    import("../../components/GitSyncStatus").then(
      (mod) => mod.GitSyncStatusComponent,
    ),
  { ssr: false, loading: () => <GitSyncStatusPlaceholder /> },
);

type AppRoute = "/" | "/docs" | "/epics";

interface NavItem {
  href: AppRoute;
  label: string;
  icon: React.ReactNode;
}

interface SideNavProps {
  epics?: { id: string; title: string }[];
  tags?: string[];
  selectedEpic?: string | null;
  selectedTags?: string[];
  onEpicSelect?: (epicId: string | null) => void;
  onTagSelect?: (tag: string) => void;
}

export function SideNav({
  epics = [],
  tags = [],
  selectedEpic = null,
  selectedTags = [],
  onEpicSelect,
  onTagSelect,
}: SideNavProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isEpicsOpen, setIsEpicsOpen] = useState(true);
  const [isTagsOpen, setIsTagsOpen] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [starredTags, setStarredTags] = useState<string[]>([]);
  const [isLoadingStars, setIsLoadingStars] = useState(true);
  const [showSettings, setShowSettings] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const { toast } = useToast();
  const { clearSession, user, loading } = useAuth();

  // Load starred tags
  useEffect(() => {
    const loadStarredTags = async () => {
      try {
        const response = await fetch("/api/starred-tags");
        if (response.ok) {
          const data = await response.json();
          setStarredTags(data);
        }
      } catch (error) {
        console.error("Failed to load starred tags:", error);
      } finally {
        setIsLoadingStars(false);
      }
    };
    loadStarredTags();
  }, []);

  const handleStarClick = async (tag: string, isStarred: boolean) => {
    try {
      setIsUpdating(true);
      const response = await fetch("/api/starred-tags", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          tag,
          action: isStarred ? "unstar" : "star",
        }),
      });

      if (response.ok) {
        setStarredTags((prev) =>
          isStarred ? prev.filter((t) => t !== tag) : [...prev, tag],
        );
      }
    } catch (error) {
      console.error("Failed to update starred tag:", error);
      toast({
        title: "Error",
        description: "Failed to update starred tag",
        variant: "destructive",
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleEpicClick = (epicId: string | null) => {
    onEpicSelect?.(epicId);
  };

  const handleTagClick = (tag: string) => {
    onTagSelect?.(tag);
  };

  const updateRefs = async () => {
    try {
      setIsUpdating(true);
      const response = await fetch("/api/update-refs", {
        method: "POST",
      });

      if (response.ok) {
        toast({
          title: "Success",
          description: "Task references updated successfully",
        });
      } else {
        throw new Error("Failed to update refs");
      }
    } catch (error) {
      console.error("Failed to update refs:", error);
      toast({
        title: "Error",
        description: "Failed to update task references",
        variant: "destructive",
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleLogout = async () => {
    await clearSession();
  };

  // Git sync settings handler
  const handleOpenGitSettings = () => setShowSettings(true);

  const navItems: NavItem[] = [
    {
      href: "/",
      label: "Tasks",
      icon: <LayoutList className="h-4 w-4" />,
    },
    {
      href: "/epics",
      label: "Epics",
      icon: <Layers className="h-4 w-4" />,
    },
    {
      href: "/docs",
      label: "Docs",
      icon: <FileText className="h-4 w-4" />,
    },
  ];

  return (
    <>
      {/* Mobile menu button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed top-2 right-4 w-10 h-10 flex items-center justify-center bg-zinc-900 rounded-md shadow-lg hover:bg-zinc-800 lg:hidden z-30"
      >
        {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </button>

      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/20 z-20 lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Side navigation */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 w-64 bg-zinc-900 border-r border-zinc-800 shadow-xl transform transition-transform duration-200 ease-in-out z-30 lg:translate-x-0",
          isOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center h-14 px-4 border-b border-zinc-800">
            <h1 className="text-xl font-semibold tracking-tight text-zinc-100 font-mono">
              CursorDone
            </h1>
          </div>

          {/* Profile Button */}
          <div className="px-2 py-2 border-b border-zinc-800">
            {!loading && <ProfileButton />}
          </div>

          {/* Main navigation */}
          <nav className="px-2 pt-4 font-inter">
            {navItems.map((item) => {
              const isActive = pathname === item.href;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setIsOpen(false)}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                    isActive
                      ? "bg-zinc-800 text-zinc-100"
                      : "text-zinc-300 hover:bg-zinc-800/50 hover:text-zinc-100",
                  )}
                >
                  {item.icon}
                  {item.label}
                </Link>
              );
            })}
          </nav>

          {/* Filters - Only show on tasks page */}
          {pathname === "/" && (
            <div className="flex-1 px-2 py-4 space-y-2 overflow-y-auto">
              {/* Epics filter */}
              <div className="space-y-1">
                <button
                  onClick={() => setIsEpicsOpen(!isEpicsOpen)}
                  className="flex items-center gap-2 w-full px-3 py-2 text-sm font-medium text-zinc-300 hover:text-zinc-100"
                >
                  {isEpicsOpen ? (
                    <ChevronDown className="h-4 w-4" />
                  ) : (
                    <ChevronRight className="h-4 w-4" />
                  )}
                  Epics
                </button>
                {isEpicsOpen && onEpicSelect && (
                  <div className="pl-4 space-y-1">
                    <Button
                      variant={selectedEpic === null ? "default" : "ghost"}
                      size="sm"
                      className={cn(
                        "w-full justify-start transition-colors",
                        selectedEpic === null
                          ? "bg-zinc-800 text-zinc-100 hover:bg-zinc-800/90"
                          : "text-zinc-300 hover:bg-zinc-800/50 hover:text-zinc-100",
                      )}
                      onClick={() => handleEpicClick(null)}
                    >
                      All Tasks
                    </Button>
                    <Button
                      variant={selectedEpic === "none" ? "default" : "ghost"}
                      size="sm"
                      className={cn(
                        "w-full justify-start transition-colors",
                        selectedEpic === "none"
                          ? "bg-zinc-800 text-zinc-100 hover:bg-zinc-800/90"
                          : "text-zinc-300 hover:bg-zinc-800/50 hover:text-zinc-100",
                      )}
                      onClick={() =>
                        handleEpicClick(selectedEpic === "none" ? null : "none")
                      }
                    >
                      No Epic
                    </Button>
                    {epics.map((epic) => (
                      <Button
                        key={epic.id}
                        variant={selectedEpic === epic.id ? "default" : "ghost"}
                        size="sm"
                        className={cn(
                          "w-full justify-start text-left whitespace-normal",
                          selectedEpic === epic.id
                            ? "bg-zinc-800 text-zinc-100 hover:bg-zinc-800/90"
                            : "text-zinc-300 hover:bg-zinc-800/50 hover:text-zinc-100",
                        )}
                        onClick={() => handleEpicClick(epic.id)}
                      >
                        {epic.title}
                      </Button>
                    ))}
                  </div>
                )}
              </div>

              {/* Tags filter */}
              <div className="space-y-1">
                <button
                  onClick={() => setIsTagsOpen(!isTagsOpen)}
                  className="flex items-center gap-2 w-full px-3 py-2 text-sm font-medium text-zinc-300 hover:text-zinc-100"
                >
                  {isTagsOpen ? (
                    <ChevronDown className="h-4 w-4" />
                  ) : (
                    <ChevronRight className="h-4 w-4" />
                  )}
                  Tags
                </button>
                {isTagsOpen && onTagSelect && (
                  <div className="pl-4 space-y-1">
                    {[...tags]
                      .sort((a, b) => {
                        const aStarred = starredTags.includes(a);
                        const bStarred = starredTags.includes(b);
                        if (aStarred && !bStarred) return -1;
                        if (!aStarred && bStarred) return 1;
                        return a.localeCompare(b);
                      })
                      .map((tag) => {
                        const isStarred = starredTags.includes(tag);
                        return (
                          <div key={tag} className="flex items-center gap-1">
                            <Button
                              variant={
                                selectedTags.includes(tag) ? "default" : "ghost"
                              }
                              size="sm"
                              className={cn(
                                "flex-1 justify-start gap-2 transition-colors text-left whitespace-normal",
                                selectedTags.includes(tag)
                                  ? "bg-zinc-800 text-zinc-100 hover:bg-zinc-800/90 active:bg-zinc-800/80"
                                  : "text-zinc-300 hover:bg-zinc-800/50 hover:text-zinc-100",
                              )}
                              onClick={() => handleTagClick(tag)}
                            >
                              <Hash className="h-3.5 w-3.5 shrink-0" />
                              {tag}
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className={cn(
                                "px-2 hover:bg-zinc-800/50",
                                isStarred && "text-yellow-400",
                              )}
                              onClick={() => handleStarClick(tag, isStarred)}
                            >
                              <Star className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        );
                      })}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Footer with Update and Logout */}
          <div className="mt-auto p-2 space-y-2">
            {/* Git Sync Status */}
            <div className="px-2 py-1 border-t border-zinc-800 pt-2">
              <Suspense fallback={<GitSyncStatusPlaceholder />}>
                <GitSyncStatusComponent />
              </Suspense>
            </div>

            {/* Settings Button */}
            <Button
              variant="outline"
              className="w-full border-zinc-700 hover:bg-zinc-800 hover:border-zinc-600"
              asChild
            >
              <Link href="/settings">
                <Settings className="h-4 w-4 mr-2" />
                Settings
              </Link>
            </Button>

            {/* Update Refs Button */}
            <Button
              onClick={updateRefs}
              disabled={isUpdating}
              variant="outline"
              className="w-full border-zinc-700 hover:bg-zinc-800 hover:border-zinc-600"
            >
              {isUpdating ? (
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4 mr-2" />
              )}
              Update Refs
            </Button>

            {/* Logout Button */}
            <Button
              onClick={handleLogout}
              variant="outline"
              className="w-full border-zinc-700 hover:bg-zinc-800 hover:border-zinc-600"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </aside>
    </>
  );
}
