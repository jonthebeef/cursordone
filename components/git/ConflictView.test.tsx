import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { vi } from "vitest";
import { ConflictView } from "./ConflictView";
import { useGitSync } from "@/lib/hooks/use-git-sync";

// Mock the useGitSync hook
vi.mock("@/lib/hooks/use-git-sync", () => ({
  useGitSync: vi.fn(),
}));

describe("ConflictView", () => {
  const mockOnResolve = vi.fn();
  const mockOnRefresh = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("shows no conflicts message when there are no conflicts", () => {
    (useGitSync as any).mockReturnValue({
      status: {
        gitStatus: {
          conflicted: [],
        },
      },
    });

    render(
      <ConflictView onResolve={mockOnResolve} onRefresh={mockOnRefresh} />,
    );

    expect(screen.getByText("No conflicts detected")).toBeInTheDocument();
    expect(screen.getByText("Check for conflicts")).toBeInTheDocument();
  });

  it("displays list of conflicted files", () => {
    const mockConflictedFiles = ["src/file1.ts", "src/file2.ts"];
    (useGitSync as any).mockReturnValue({
      status: {
        gitStatus: {
          conflicted: mockConflictedFiles,
        },
      },
    });

    render(
      <ConflictView onResolve={mockOnResolve} onRefresh={mockOnRefresh} />,
    );

    expect(screen.getByText("Merge Conflicts")).toBeInTheDocument();
    mockConflictedFiles.forEach((file) => {
      expect(screen.getByText(file)).toBeInTheDocument();
    });
  });

  it("handles file selection", async () => {
    const mockConflictedFiles = ["src/file1.ts"];
    (useGitSync as any).mockReturnValue({
      status: {
        gitStatus: {
          conflicted: mockConflictedFiles,
        },
      },
    });

    render(
      <ConflictView onResolve={mockOnResolve} onRefresh={mockOnRefresh} />,
    );

    const fileButton = screen.getByText("src/file1.ts");
    fireEvent.click(fileButton);

    // Wait for DiffViewer to be rendered
    await waitFor(() => {
      expect(screen.getByText("Local Changes")).toBeInTheDocument();
      expect(screen.getByText("Remote Changes")).toBeInTheDocument();
    });
  });

  it("handles refresh action", async () => {
    (useGitSync as any).mockReturnValue({
      status: {
        gitStatus: {
          conflicted: [],
        },
      },
    });

    render(
      <ConflictView onResolve={mockOnResolve} onRefresh={mockOnRefresh} />,
    );

    const refreshButton = screen.getByText("Check for conflicts");
    fireEvent.click(refreshButton);

    expect(mockOnRefresh).toHaveBeenCalledTimes(1);
  });

  it("handles conflict resolution", async () => {
    const mockConflictedFiles = ["src/file1.ts"];
    (useGitSync as any).mockReturnValue({
      status: {
        gitStatus: {
          conflicted: mockConflictedFiles,
        },
      },
    });

    render(
      <ConflictView onResolve={mockOnResolve} onRefresh={mockOnRefresh} />,
    );

    // Select a file
    const fileButton = screen.getByText("src/file1.ts");
    fireEvent.click(fileButton);

    // Wait for resolution options to be rendered
    await waitFor(() => {
      expect(screen.getByText("Keep Local")).toBeInTheDocument();
    });

    // Click resolve button
    const resolveButton = screen.getByText("Keep Local");
    fireEvent.click(resolveButton);

    expect(mockOnResolve).toHaveBeenCalledTimes(1);
    expect(mockOnResolve).toHaveBeenCalledWith(
      expect.objectContaining({
        path: "src/file1.ts",
        status: "conflict",
      }),
      "local",
    );
  });
});
