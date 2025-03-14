import { db } from '../firebase'
import { openDB, type IDBPDatabase } from 'idb'
import type { Student, Teacher, Class, Content } from '../types'

interface OfflineDB extends IDBPDatabase {
  students: Student[]
  teachers: Teacher[]
  classes: Class[]
  contents: Content[]
  attendance: any[]
}

// Initialize IndexedDB
const dbPromise = openDB<OfflineDB>('academy-db', 1, {
  upgrade(db) {
    // Create stores for each data type
    db.createObjectStore('students', { keyPath: 'id' })
    db.createObjectStore('teachers', { keyPath: 'id' })
    db.createObjectStore('classes', { keyPath: 'id' })
    db.createObjectStore('contents', { keyPath: 'id' })
    db.createObjectStore('attendance', { keyPath: 'id' })
  }
})

// Generic function to sync data
async function syncData<T>(
  storeName: keyof OfflineDB,
  onlineData: T[],
  timestamp: string
) {
  const db = await dbPromise
  const tx = db.transaction(storeName, 'readwrite')
  const store = tx.objectStore(storeName)

  // Store the data
  await Promise.all([
    ...onlineData.map(item => store.put(item)),
    tx.done
  ])

  // Update last sync timestamp
  localStorage.setItem(`lastSync_${storeName}`, timestamp)
}

// Function to get data (first tries online, falls back to offline)
export async function getData<T>(
  storeName: keyof OfflineDB,
  onlineFetch: () => Promise<T[]>
): Promise<T[]> {
  try {
    if (navigator.onLine) {
      // Fetch fresh data
      const data = await onlineFetch()
      // Store for offline use
      await syncData(storeName, data, new Date().toISOString())
      return data
    } else {
      // Get from IndexedDB
      const db = await dbPromise
      return await db.getAll(storeName)
    }
  } catch (error) {
    console.error(`Error fetching ${storeName}:`, error)
    // Try to get cached data as fallback
    const db = await dbPromise
    return await db.getAll(storeName)
  }
}

// Function to save data (stores offline if necessary)
export async function saveData<T>(
  storeName: keyof OfflineDB,
  data: T,
  onlineSave: (data: T) => Promise<void>
): Promise<void> {
  try {
    if (navigator.onLine) {
      await onlineSave(data)
    } else {
      // Store locally and mark for sync
      const db = await dbPromise
      await db.put(storeName, data)
      
      const pendingChanges = JSON.parse(localStorage.getItem('pendingChanges') || '[]')
      pendingChanges.push({
        type: storeName,
        data,
        action: 'save',
        timestamp: new Date().toISOString()
      })
      localStorage.setItem('pendingChanges', JSON.stringify(pendingChanges))
    }
  } catch (error) {
    console.error(`Error saving ${storeName}:`, error)
    throw error
  }
}

// Function to delete data
export async function deleteData<T>(
  storeName: keyof OfflineDB,
  id: string | number,
  onlineDelete: (id: string | number) => Promise<void>
): Promise<void> {
  try {
    if (navigator.onLine) {
      await onlineDelete(id)
    } else {
      // Mark for deletion when back online
      const pendingChanges = JSON.parse(localStorage.getItem('pendingChanges') || '[]')
      pendingChanges.push({
        type: storeName,
        id,
        action: 'delete',
        timestamp: new Date().toISOString()
      })
      localStorage.setItem('pendingChanges', JSON.stringify(pendingChanges))
    }
  } catch (error) {
    console.error(`Error deleting ${storeName}:`, error)
    throw error
  }
}

// Sync pending changes when coming back online
window.addEventListener('online', async () => {
  const pendingChanges = JSON.parse(localStorage.getItem('pendingChanges') || '[]')
  if (pendingChanges.length === 0) return

  for (const change of pendingChanges) {
    try {
      switch (change.action) {
        case 'save':
          await db.collection(change.type).doc(change.data.id).set(change.data)
          break
        case 'delete':
          await db.collection(change.type).doc(change.id).delete()
          break
      }
    } catch (error) {
      console.error('Error syncing change:', error)
    }
  }

  localStorage.removeItem('pendingChanges')
})

// Register service worker for offline support
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').then(registration => {
      console.log('ServiceWorker registered:', registration)
    }).catch(error => {
      console.error('ServiceWorker registration failed:', error)
    })
  })
}