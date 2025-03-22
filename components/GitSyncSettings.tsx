"use client";

import React, { useState, useEffect } from "react";
import { useSettings } from "@/lib/hooks/use-settings";
import { GitSyncSettings } from "@/lib/settings/types";
import { Info, Github, GitBranch } from "lucide-react";

export function GitSyncSettingsForm() {
  const { settings, updateSettings } = useSettings();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form state
  const [enabled, setEnabled] = useState(false);
  const [repoUrl, setRepoUrl] = useState("");
  const [repoPath, setRepoPath] = useState("");
  const [autoPull, setAutoPull] = useState(true);
  const [autoPush, setAutoPush] = useState(true);
  const [pullInterval, setPullInterval] = useState(5);
  const [batchThreshold, setBatchThreshold] = useState(5);
  const [syncDirectories, setSyncDirectories] = useState<string[]>([
    "tasks",
    "epics",
    "docs",
  ]);

  // Initialize form with existing settings
  useEffect(() => {
    if (settings?.gitSync) {
      setEnabled(settings.gitSync.enabled || false);
      setRepoPath(settings.gitSync.repoPath || "");
      setRepoUrl(settings.gitSync.repoUrl || "");
      setAutoPull(settings.gitSync.autoPullEnabled || true);
      setAutoPush(settings.gitSync.autoPushEnabled || true);
      setPullInterval(settings.gitSync.autoPullInterval || 5);
      setBatchThreshold(settings.gitSync.batchCommitsThreshold || 5);
      setSyncDirectories(
        settings.gitSync.gitPaths || ["tasks", "epics", "docs"],
      );
    }
  }, [settings]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsSubmitting(true);

    try {
      // Create the updated Git sync settings
      const updatedGitSync = {
        enabled,
        repoPath,
        repoUrl,
        autoPullEnabled: autoPull,
        autoPushEnabled: autoPush,
        autoPullInterval: pullInterval,
        batchCommitsThreshold: batchThreshold,
        batchCommitsTimeout: 60000, // 1 minute default
        gitPaths: syncDirectories,
      };

      // Update settings via the hook
      await updateSettings({
        gitSync: updatedGitSync,
      });

      // Also save to localStorage for components that need to read it directly
      try {
        if (typeof window !== "undefined") {
          // Get existing settings or create empty object
          const existingSettings = localStorage.getItem("userSettings")
            ? JSON.parse(localStorage.getItem("userSettings") || "{}")
            : {};

          // Update with new git sync settings
          const updatedSettings = {
            ...existingSettings,
            gitSync: updatedGitSync,
          };

          // Save back to localStorage
          localStorage.setItem("userSettings", JSON.stringify(updatedSettings));

          // Dispatch a custom event to notify other components about the update
          window.dispatchEvent(new Event("settingsUpdated"));
        }
      } catch (localStorageError) {
        console.error(
          "Failed to save settings to localStorage:",
          localStorageError,
        );
      }

      alert("Git sync settings updated successfully");
    } catch (error) {
      console.error("Failed to update Git sync settings:", error);
      alert("Failed to update settings");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDirectoryToggle = (dir: string) => {
    setSyncDirectories((prev) =>
      prev.includes(dir) ? prev.filter((d) => d !== dir) : [...prev, dir],
    );
  };

  const handleBrowseRepository = () => {
    // This would ideally open a file picker dialog
    // Since we can't do that directly in the browser, we'll show instructions instead
    alert(
      'To select a repository folder:\n\n1. Open Finder/Explorer\n2. Navigate to your repository\n3. Copy the full path and paste it in the "Local Repository Path" field',
    );
  };

  if (!settings) {
    return <div className="animate-pulse p-6">Loading settings...</div>;
  }

  return (
    <div className="border border-zinc-700 rounded-lg p-6 mb-6 bg-zinc-900/50">
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Enable Git Sync */}
        <div className="mb-4">
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={enabled}
              onChange={(e) => setEnabled(e.target.checked)}
              className="mr-2 rounded bg-zinc-800 border-zinc-700"
            />
            <span className="font-medium">Enable Git Sync</span>
          </label>
          <p className="text-sm text-zinc-400 mt-1 ml-6">
            Automatically synchronize your workspace with Git
          </p>
        </div>

        {/* Repository Info Panel */}
        <div className="bg-blue-900/20 border border-blue-800/50 rounded-lg p-4 mb-6">
          <div className="flex items-start">
            <Info className="h-5 w-5 text-blue-400 mr-3 mt-0.5 flex-shrink-0" />
            <div>
              <h3 className="font-medium text-blue-300 mb-2">
                Repository Setup Guide
              </h3>
              <p className="text-sm text-blue-200 mb-2">
                You can connect to your repository in two ways:
              </p>
              <ul className="list-disc list-inside text-sm text-blue-200 space-y-1 mb-2">
                <li>Enter a GitHub/GitLab repository URL (preferred)</li>
                <li>Specify the path to a local Git repository</li>
              </ul>
              <p className="text-sm text-blue-200">
                If using a remote repository, you&apos;ll need to authenticate
                with your Git provider.
              </p>
            </div>
          </div>
        </div>

        {/* Repository URL */}
        <div className="mb-4">
          <label className="block mb-1 font-medium flex items-center">
            <Github className="h-4 w-4 mr-2" />
            Remote Repository URL
          </label>
          <input
            type="text"
            value={repoUrl}
            onChange={(e) => setRepoUrl(e.target.value)}
            placeholder="https://github.com/username/repository"
            className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded text-white"
          />
          <p className="text-sm text-zinc-400 mt-1">
            URL to your GitHub, GitLab, or other Git hosting service repository
          </p>
        </div>

        {/* Repository Local Path */}
        <div className="mb-4">
          <label className="block mb-1 font-medium flex items-center">
            <GitBranch className="h-4 w-4 mr-2" />
            Local Repository Path{" "}
            <span className="text-zinc-500 text-xs ml-2">(Optional)</span>
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={repoPath}
              onChange={(e) => setRepoPath(e.target.value)}
              placeholder="/path/to/your/repository"
              className="flex-1 px-3 py-2 bg-zinc-800 border border-zinc-700 rounded text-white"
            />
            <button
              type="button"
              onClick={handleBrowseRepository}
              className="px-3 py-2 bg-zinc-800 border border-zinc-700 rounded text-white hover:bg-zinc-700"
            >
              Browse...
            </button>
          </div>
          <p className="text-sm text-zinc-400 mt-1">
            If you already have a local Git repository, specify its path here
          </p>
        </div>

        {/* Sync Options */}
        <fieldset className="border border-zinc-700 rounded-lg p-4">
          <legend className="px-2 font-medium">Sync Options</legend>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={autoPull}
                  onChange={(e) => setAutoPull(e.target.checked)}
                  className="mr-2 rounded bg-zinc-800 border-zinc-700"
                />
                <span>Auto Pull</span>
              </label>
              <p className="text-sm text-zinc-400 mt-1 ml-6">
                Automatically pull changes
              </p>
            </div>

            <div>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={autoPush}
                  onChange={(e) => setAutoPush(e.target.checked)}
                  className="mr-2 rounded bg-zinc-800 border-zinc-700"
                />
                <span>Auto Push</span>
              </label>
              <p className="text-sm text-zinc-400 mt-1 ml-6">
                Automatically push commits
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block mb-1">Pull Interval (minutes)</label>
              <input
                type="number"
                min="1"
                max="60"
                value={pullInterval}
                onChange={(e) => setPullInterval(parseInt(e.target.value))}
                className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded text-white"
              />
            </div>

            <div>
              <label className="block mb-1">Batch Threshold (files)</label>
              <input
                type="number"
                min="1"
                max="50"
                value={batchThreshold}
                onChange={(e) => setBatchThreshold(parseInt(e.target.value))}
                className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded text-white"
              />
            </div>
          </div>
        </fieldset>

        {/* Directories to Sync */}
        <fieldset className="border border-zinc-700 rounded-lg p-4">
          <legend className="px-2 font-medium">Directories to Sync</legend>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {["tasks", "epics", "docs"].map((dir) => (
              <label key={dir} className="flex items-center">
                <input
                  type="checkbox"
                  checked={syncDirectories.includes(dir)}
                  onChange={() => handleDirectoryToggle(dir)}
                  className="mr-2 rounded bg-zinc-800 border-zinc-700"
                />
                <span className="capitalize">{dir}</span>
              </label>
            ))}
          </div>
        </fieldset>

        {/* Submit Button */}
        <div className="mt-6">
          <button
            type="submit"
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 transition-colors"
            disabled={isSubmitting}
          >
            {isSubmitting ? "Saving..." : "Save Settings"}
          </button>
        </div>
      </form>
    </div>
  );
}
