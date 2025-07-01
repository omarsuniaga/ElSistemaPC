import {openDB, DBSchema, IDBPDatabase} from "idb"

interface AppDBSchema extends DBSchema {
  students: {
    key: string
    value: any
  }
  teachers: {
    key: string
    value: any
  }
  classes: {
    key: string
    value: any
  }
  attendance: {
    key: string
    value: any
  }
  contents: {
    key: string
    value: any
  }
}

class CacheService {
  private db: IDBPDatabase<AppDBSchema> | null = null
  private readonly DB_NAME = "music-academy-cache"
  private readonly DB_VERSION = 1

  async initDB() {
    if (this.db) return this.db

    this.db = await openDB<AppDBSchema>(this.DB_NAME, this.DB_VERSION, {
      upgrade(db) {
        // Crear stores para cada tipo de dato
        if (!db.objectStoreNames.contains("students")) {
          db.createObjectStore("students")
        }
        if (!db.objectStoreNames.contains("teachers")) {
          db.createObjectStore("teachers")
        }
        if (!db.objectStoreNames.contains("classes")) {
          db.createObjectStore("classes")
        }
        if (!db.objectStoreNames.contains("attendance")) {
          db.createObjectStore("attendance")
        }
        if (!db.objectStoreNames.contains("contents")) {
          db.createObjectStore("contents")
        }
      },
    })

    return this.db
  }

  async setItem(
    storeName: "students" | "teachers" | "classes" | "attendance" | "contents",
    key: string,
    value: any
  ) {
    const db = await this.initDB()
    await db.put(storeName, value, key)
  }

  async getItem(
    storeName: "students" | "teachers" | "classes" | "attendance" | "contents",
    key: string
  ) {
    const db = await this.initDB()
    return await db.get(storeName, key)
  }

  async getAllItems(storeName: "students" | "teachers" | "classes" | "attendance" | "contents") {
    const db = await this.initDB()
    return await db.getAll(storeName)
  }

  async removeItem(
    storeName: "students" | "teachers" | "classes" | "attendance" | "contents",
    key: string
  ) {
    const db = await this.initDB()
    await db.delete(storeName, key)
  }

  async clearStore(storeName: "students" | "teachers" | "classes" | "attendance" | "contents") {
    const db = await this.initDB()
    await db.clear(storeName)
  }

  // Método para sincronizar datos con Firebase
  async syncWithFirebase(
    storeName: "students" | "teachers" | "classes" | "attendance" | "contents",
    data: any[]
  ) {
    const db = await this.initDB()
    await db.clear(storeName) // Limpiar datos antiguos

    // Guardar nuevos datos
    const tx = db.transaction(storeName, "readwrite")
    const store = tx.objectStore(storeName)

    for (const item of data) {
      await store.put(item, item.id)
    }

    await tx.done
  }

  // Método para verificar si los datos están en caché
  async hasData(
    storeName: "students" | "teachers" | "classes" | "attendance" | "contents"
  ): Promise<boolean> {
    const db = await this.initDB()
    const count = await db.count(storeName)
    return count > 0
  }
}

export const cacheService = new CacheService()
