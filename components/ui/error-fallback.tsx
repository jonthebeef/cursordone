"use client";

import { FallbackProps } from "react-error-boundary";

export function ErrorFallback({ error, resetErrorBoundary }: FallbackProps) {
  return (
    <div className="flex items-center justify-center min-h-screen p-4">
      <div className="bg-red-50 text-red-800 p-4 rounded-md">
        <h2 className="text-lg font-semibold mb-2">Something went wrong</h2>
        <p className="mb-4">
          There was an error loading the content. Please try refreshing the
          page.
        </p>
        {error && (
          <p className="text-sm mb-4">
            <span className="font-semibold">Error:</span> {error.message}
          </p>
        )}
        <button
          onClick={resetErrorBoundary}
          className="px-4 py-2 bg-red-800 text-white rounded hover:bg-red-700"
        >
          Try again
        </button>
      </div>
    </div>
  );
}
