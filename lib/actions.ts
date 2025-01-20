'use server'

import { revalidatePath } from 'next/cache'
import { Task, completeTask, createTask, deleteTask, updateTask, updateTaskStatus } from './tasks'
import { Epic, createEpic, deleteEpic, updateEpic } from './epics'
import { saveTaskOrder } from './task-order-actions'
import { getServerSession } from 'next-auth'
import { getDependencyFilename, normalizeDependencyFilename } from './utils/dependencies'

export async function updateTaskStatusAction(filename: string, newStatus: Task['status']) {
  try {
    const session = await getServerSession()
    const worker = session?.user?.email || 'user'
    await updateTaskStatus(filename, newStatus, worker)
    revalidatePath('/', 'layout')
  } catch (error) {
    console.error('Failed to update task status:', error)
    throw error
  }
}

export async function completeTaskAction(filename: string) {
  try {
    await completeTask(filename)
    revalidatePath('/', 'layout')
  } catch (error) {
    console.error('Failed to complete task:', error)
    throw error
  }
}

export async function createTaskAction(task: Omit<Task, 'filename' | 'content' | 'ref'> & { content: string }): Promise<string> {
  try {
    // Normalize dependencies before creating task
    const normalizedTask = {
      ...task,
      dependencies: (task.dependencies || []).map(d => normalizeDependencyFilename(d))
    };
    const filename = await createTask(normalizedTask);
    revalidatePath('/', 'layout');
    return filename;
  } catch (error) {
    console.error('Failed to create task:', error);
    throw error;
  }
}

export async function updateTaskAction(filename: string, task: Omit<Task, 'filename'>) {
  try {
    // Normalize dependencies before updating task
    const normalizedTask = {
      ...task,
      dependencies: (task.dependencies || []).map(d => normalizeDependencyFilename(d))
    };
    await updateTask(filename, normalizedTask);
    revalidatePath('/', 'layout');
  } catch (error) {
    console.error('Failed to update task:', error);
    throw error;
  }
}

export async function deleteTaskAction(filename: string) {
  try {
    await deleteTask(filename)
    revalidatePath('/', 'layout')
  } catch (error) {
    console.error('Failed to delete task:', error)
    throw error
  }
}

export async function createEpicAction(epic: Omit<Epic, 'id'> & { content: string }) {
  try {
    const id = await createEpic(epic)
    revalidatePath('/', 'layout')
    return id
  } catch (error) {
    console.error('Failed to create epic:', error)
    throw error
  }
}

export async function updateEpicAction(id: string, epic: Omit<Epic, 'id'>) {
  try {
    await updateEpic(id, epic)
    revalidatePath('/', 'layout')
  } catch (error) {
    console.error('Failed to update epic:', error)
    throw error
  }
}

export async function deleteEpicAction(id: string) {
  try {
    await deleteEpic(id)
    revalidatePath('/', 'layout')
  } catch (error) {
    console.error('Failed to delete epic:', error)
    throw error
  }
}

export async function saveTaskOrderAction(key: string, order: string[]) {
  try {
    console.log('\n=== Server Action: Save Task Order ===')
    console.log('Key:', key)
    console.log('Order:', order)
    await saveTaskOrder(key, order)
    console.log('Server action completed')
    revalidatePath('/', 'layout')
  } catch (error) {
    console.error('Failed to save task order:', error)
    throw error
  }
} 