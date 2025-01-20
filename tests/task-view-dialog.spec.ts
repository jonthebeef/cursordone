import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { TaskViewDialog } from '@/components/ui/task-list/task-view-dialog';
import type { Task } from '@/lib/tasks';

describe('TaskViewDialog', () => {
  const testTask: Task = {
    id: 'TSK-123',
    title: 'Test Task',
    status: 'todo',
    priority: 'medium',
    created: '2025-01-01',
    ref: 'TSK-123',
    filename: 'test-task.md',
    content: 'Test content',
    tags: [],
    dependencies: [],
    complexity: 'M'
  };

  const testEpics = [{ id: 'EPIC-1', title: 'Test Epic' }];
  const testTasks = [testTask];

  const onOpenChange = jest.fn();
  const onEdit = jest.fn();

  const renderDialog = (task: Task | null, disabled = false) => {
    return render(
      React.createElement(TaskViewDialog, {
        task: task,
        open: true,
        onOpenChange: onOpenChange,
        epics: testEpics,
        initialTasks: testTasks,
        onEdit: onEdit,
        disabled: disabled
      })
    );
  };

  it('renders dialog with task details', () => {
    renderDialog(testTask);

    expect(screen.getByText(testTask.title!)).toBeInTheDocument();
    expect(screen.getByText(testTask.ref!)).toBeInTheDocument();
    expect(screen.getByText(/Status:/i)).toBeInTheDocument();
    expect(screen.getByText(/Priority:/i)).toBeInTheDocument();
    expect(screen.getByText(/Created:/i)).toBeInTheDocument();
    expect(screen.getByText(testTask.content!)).toBeInTheDocument();
  });

  it('does not render when task is null', () => {
    const { container } = renderDialog(null);
    expect(container).toBeEmptyDOMElement();
  });

  it('renders edit button when onEdit is provided', () => {
    renderDialog(testTask);
    expect(screen.getByText('Edit Task')).toBeInTheDocument();
  });

  it('disables edit button when disabled prop is true', () => {
    renderDialog(testTask, true);
    const editButton = screen.getByText('Edit Task');
    expect(editButton).toBeDisabled();
  });

  it('renders epic badge when task has epic', () => {
    const taskWithEpic = {
      ...testTask,
      epic: 'EPIC-1'
    };
    renderDialog(taskWithEpic);
    expect(screen.getByText(testEpics[0].title)).toBeInTheDocument();
  });

  it('renders tags when task has tags', () => {
    const taskWithTags = {
      ...testTask,
      tags: ['tag1', 'tag2']
    };
    renderDialog(taskWithTags);
    expect(screen.getByText('tag1')).toBeInTheDocument();
    expect(screen.getByText('tag2')).toBeInTheDocument();
  });
});
