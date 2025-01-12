'use server'

import { revalidatePath } from 'next/cache'
import { createDoc, updateDoc, deleteDoc } from './docs'
import type { Doc } from './docs'
import { promises as fs } from 'fs'
import path from 'path'

export async function createDocAction(doc: Omit<Doc, 'filename'> & { content: string }): Promise<string> {
  try {
    const filename = await createDoc(doc)
    revalidatePath('/docs')
    return filename
  } catch (error) {
    console.error('Error creating doc:', error)
    throw error
  }
}

export async function updateDocAction(filename: string, doc: Omit<Doc, 'filename'>) {
  try {
    await updateDoc(filename, doc)
    revalidatePath('/docs')
  } catch (error) {
    console.error('Error updating doc:', error)
    throw error
  }
}

export async function deleteDocAction(filename: string) {
  try {
    const docPath = path.join(process.cwd(), 'docs', filename)
    await fs.unlink(docPath)
    revalidatePath('/docs')
    return { success: true }
  } catch (error) {
    console.error('Failed to delete document:', error)
    return { success: false, error }
  }
} 