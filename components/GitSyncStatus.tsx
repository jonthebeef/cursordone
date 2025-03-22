"use client";

import React, { useState, useEffect } from "react";
import { GitCompare, AlertCircle, Info } from "lucide-react";

export function GitSyncStatusComponent() {
  const [status, setStatus] = useState({
    isConfigured: false,
    isError: false,
    repoInfo: {
      url: "",
      path: "",
    },
  });

  // Tooltip state
  const [showTooltip, setShowTooltip] = useState(false);

  // Function to check git configuration status
  const checkGitConfig = () => {
    try {
      // Only run in client-side environments
      if (typeof window !== "undefined") {
        // Check localStorage for git settings
        const storedSettings = localStorage.getItem("userSettings");

        if (storedSettings) {
          const settings = JSON.parse(storedSettings);
          const gitConfig = settings?.gitSync || {};

          setStatus({
            isConfigured:
              gitConfig.enabled && (gitConfig.repoPath || gitConfig.repoUrl),
            isError: !gitConfig.repoPath && !gitConfig.repoUrl,
            repoInfo: {
              url: gitConfig.repoUrl || "",
              path: gitConfig.repoPath || "",
            },
          });
        }
      }
    } catch (error) {
      console.error("Error checking Git settings:", error);
      setStatus({
        isConfigured: false,
        isError: true,
        repoInfo: { url: "", path: "" },
      });
    }
  };

  // Check local storage for settings when on client side
  useEffect(() => {
    // Initial check
    checkGitConfig();

    // Setup storage change listener
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "userSettings") {
        checkGitConfig();
      }
    };

    // Add event listener for localStorage changes
    window.addEventListener("storage", handleStorageChange);

    // Also create a custom event listener for when settings are saved within same window
    window.addEventListener("settingsUpdated", checkGitConfig);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener("settingsUpdated", checkGitConfig);
    };
  }, []);

  // Get status text
  const getStatusText = () => {
    if (status.isError) return "Git: Not Configured";
    if (status.isConfigured) return "Git: Ready";
    return "Git: Not Configured";
  };

  // Get icon
  const getIcon = () => {
    if (status.isError) {
      return <AlertCircle className="h-3.5 w-3.5 mr-2 text-red-500" />;
    }
    return <GitCompare className="h-3.5 w-3.5 mr-2" />;
  };

  // Get repo display info
  const getRepoDisplayInfo = () => {
    if (status.repoInfo.url) {
      // Extract repo name from URL
      try {
        const urlObj = new URL(status.repoInfo.url);
        const pathParts = urlObj.pathname.split("/").filter(Boolean);
        if (pathParts.length >= 2) {
          return `${pathParts[0]}/${pathParts[1]}`;
        }
        return status.repoInfo.url;
      } catch {
        return status.repoInfo.url;
      }
    }

    if (status.repoInfo.path) {
      // Get the last part of the path
      const pathParts = status.repoInfo.path.split("/").filter(Boolean);
      return pathParts[pathParts.length - 1] || status.repoInfo.path;
    }

    return "No repository";
  };

  return (
    <div className="mb-2">
      <div
        className="flex items-center px-2 py-1 text-zinc-400 text-xs hover:bg-zinc-800 rounded cursor-pointer relative"
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
      >
        {getIcon()}
        <span>{getStatusText()}</span>

        {status.isConfigured && <Info className="h-3 w-3 ml-1 text-zinc-500" />}

        {/* Tooltip for repository info */}
        {showTooltip && status.isConfigured && (
          <div className="absolute left-0 bottom-full mb-1 p-2 bg-zinc-800 border border-zinc-700 rounded shadow-lg z-10 w-48">
            <p className="text-xs font-medium text-zinc-300 mb-1">Repository</p>
            <p className="text-xs text-zinc-400 truncate">
              {getRepoDisplayInfo()}
            </p>
            {status.repoInfo.url && (
              <p className="text-xs text-zinc-500 mt-1 truncate">
                Remote: {status.repoInfo.url}
              </p>
            )}
            {status.repoInfo.path && (
              <p className="text-xs text-zinc-500 mt-1 truncate">
                Local: {status.repoInfo.path}
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
