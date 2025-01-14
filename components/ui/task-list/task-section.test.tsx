import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { TaskSection } from "./task-section";
import { Task } from "@/lib/tasks";
import { DndContext } from "@dnd-kit/core";

// Mock the virtualizer
vi.mock("@tanstack/react-virtual", () => ({
  useVirtualizer: () => ({
    getVirtualItems: () => [
      { index: 0, key: "0", size: 64, start: 0 },
      { index: 1, key: "1", size: 64, start: 64 },
    ],
    getTotalSize: () => 128,
    measure: vi.fn(),
  }),
}));

const mockTasks: Task[] = [
  {
    id: "task-1",
    filename: "task-1.md",
    title: "Task 1",
    status: "todo",
    priority: "high",
    complexity: "M",
    created: "2024-01-15",
    ref: "TSK-001",
  },
  {
    id: "task-2",
    filename: "task-2.md",
    title: "Task 2",
    status: "todo",
    priority: "medium",
    complexity: "S",
    created: "2024-01-15",
    ref: "TSK-002",
  },
];

interface TaskSectionProps {
  id: string;
  title: string;
  tasks: Task[];
  isOpen: boolean;
  onToggle: () => void;
  onTaskClick: (task: Task) => void;
  onTaskComplete: (task: Task) => void;
  disabled?: boolean;
}

describe("TaskSection", () => {
  const defaultProps: TaskSectionProps = {
    id: "todo",
    title: "Todo",
    tasks: mockTasks,
    isOpen: true,
    onToggle: vi.fn(),
    onTaskClick: vi.fn(),
    onTaskComplete: vi.fn(),
  };

  const renderWithDnd = (props = defaultProps) => {
    return render(
      <DndContext>
        <TaskSection {...props} />
      </DndContext>,
    );
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders the section title and task count", () => {
    renderWithDnd();
    expect(screen.getByText("Todo")).toBeInTheDocument();
    expect(screen.getByText("(2)")).toBeInTheDocument();
  });

  it("toggles section visibility when clicked", () => {
    renderWithDnd();
    const button = screen.getByRole("button");
    fireEvent.click(button);
    expect(defaultProps.onToggle).toHaveBeenCalled();
  });

  it("renders tasks when section is open", () => {
    renderWithDnd();
    expect(screen.getByText("Task 1")).toBeInTheDocument();
    expect(screen.getByText("Task 2")).toBeInTheDocument();
  });

  it("does not render tasks when section is closed", () => {
    renderWithDnd({ ...defaultProps, isOpen: false });
    expect(screen.queryByText("Task 1")).not.toBeInTheDocument();
    expect(screen.queryByText("Task 2")).not.toBeInTheDocument();
  });

  it("calls onTaskClick when a task is clicked", () => {
    renderWithDnd();
    const task1 = screen.getByText("Task 1");
    fireEvent.click(task1);
    expect(defaultProps.onTaskClick).toHaveBeenCalledWith(mockTasks[0]);
  });

  it("calls onTaskComplete when a task is completed", () => {
    renderWithDnd();
    const checkboxes = screen.getAllByRole("checkbox");
    fireEvent.click(checkboxes[0]);
    expect(defaultProps.onTaskComplete).toHaveBeenCalledWith(mockTasks[0]);
  });

  it("disables task interactions when disabled prop is true", () => {
    renderWithDnd({ ...defaultProps, disabled: true });
    const checkboxes = screen.getAllByRole("checkbox");
    expect(checkboxes[0]).toBeDisabled();
    expect(checkboxes[1]).toBeDisabled();
  });

  it("applies drag styles when dragging", () => {
    renderWithDnd();
    const section = screen.getByRole("button").parentElement;
    expect(section).toHaveStyle({ transform: "", transition: undefined });
  });
});
