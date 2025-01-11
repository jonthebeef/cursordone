'use server'

import { revalidatePath } from 'next/cache'
import { Task, completeTask, createTask, deleteTask, updateTask } from './tasks'
import { Epic, createEpic, deleteEpic, updateEpic } from './epics'
import { saveTaskOrder } from './task-order-actions'

export async function completeTaskAction(filename: string) {
  try {
    await completeTask(filename)
    revalidatePath('/', 'layout')
  } catch (error) {
    console.error('Failed to complete task:', error)
    throw error
  }
}

export async function createTaskAction(task: Omit<Task, 'filename' | 'ref'> & { content: string }) {
  try {
    const filename = await createTask(task)
    revalidatePath('/', 'layout')
    return filename
  } catch (error) {
    console.error('Failed to create task:', error)
    throw error
  }
}

export async function updateTaskAction(filename: string, task: Omit<Task, 'filename'>) {
  try {
    await updateTask(filename, task)
    revalidatePath('/', 'layout')
  } catch (error) {
    console.error('Failed to update task:', error)
    throw error
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