import { 
  collection, 
  doc, 
  getDocs, 
  getDoc, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where,
  DocumentData,
  QueryConstraint
} from 'firebase/firestore'
import { Firestore } from 'firebase/firestore'
import { db as firestoreDb } from '../firebase'
import { useOffline } from '../composables/useOffline'

const db: Firestore = firestoreDb
const { queueChange, isOffline } = useOffline()

/**
 * Clase para manejar errores de Firestore con un formato consistente.
 */
export class FirestoreError extends Error {
  constructor(message: string, public code?: string) {
    super(message)
    this.name = 'FirestoreError'
  }
}

/**
 * Función auxiliar para manejar errores en operaciones de Firestore.
 * @param operation - Función asíncrona que ejecuta la operación.
 * @param errorMsg - Mensaje de error personalizado.
 * @returns El resultado de la operación.
 */
async function withFirestoreError<T>(operation: () => Promise<T>, errorMsg: string): Promise<T> {
  try {
    return await operation()
  } catch (error: any) {
    console.error(errorMsg, error)
    throw new FirestoreError(errorMsg, error.code)
  }
}

/**
 * Obtiene una colección de Firestore con restricciones opcionales.
 * @param collectionName - Nombre de la colección.
 * @param constraints - Restricciones opcionales para la consulta.
 * @returns Un array de documentos.
 */
export async function getCollection<T = DocumentData>(
  collectionName: string,
  constraints: QueryConstraint[] = []
): Promise<T[]> {
  return withFirestoreError(async () => {
    const q = query(collection(db, collectionName), ...constraints)
    const querySnapshot = await getDocs(q)
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as T[]
  }, `Error al obtener la colección ${collectionName}`)
}

/**
 * Obtiene un documento único de Firestore.
 * @param collectionName - Nombre de la colección.
 * @param docId - ID del documento.
 * @returns Los datos del documento o null si no existe.
 */
export async function getDocument<T = DocumentData>(
  collectionName: string,
  docId: string
): Promise<T | null> {
  return withFirestoreError(async () => {
    const docRef = doc(db, collectionName, docId)
    const docSnap = await getDoc(docRef)
    if (!docSnap.exists()) return null
    return { id: docSnap.id, ...docSnap.data() } as T
  }, `Error al obtener el documento ${docId}`)
}

/**
 * Crea un nuevo documento en Firestore.
 * Si la aplicación está offline, encola la operación para sincronizarla luego.
 * @param collectionName - Nombre de la colección.
 * @param data - Datos del documento.
 */
export async function createDocument<T = DocumentData>(
  collectionName: string,
  data: T
): Promise<void> {
  const operation = async () => {
    const docRef = doc(collection(db, collectionName))
    await setDoc(docRef, data as DocumentData)
  }
  
  if (isOffline.value) {
    // Encolar operación para cuando se recupere la conexión
    queueChange(() => operation())
    console.log(`⏳ Operación de creación en ${collectionName} encolada por modo offline`)
  } else {
    await withFirestoreError(operation, `Error al crear el documento en ${collectionName}`)
  }
}

/**
 * Actualiza un documento existente en Firestore.
 * Si está offline, encola la actualización.
 * @param collectionName - Nombre de la colección.
 * @param docId - ID del documento.
 * @param data - Datos parciales a actualizar.
 */
export async function updateDocument<T = DocumentData>(
  collectionName: string,
  docId: string,
  data: Partial<T>
): Promise<void> {
  const operation = async () => {
    const docRef = doc(db, collectionName, docId)
    await updateDoc(docRef, data)
  }
  
  if (isOffline.value) {
    queueChange(() => operation())
    console.log(`⏳ Operación de actualización en ${collectionName}/${docId} encolada por modo offline`)
  } else {
    await withFirestoreError(operation, `Error al actualizar el documento ${docId}`)
  }
}

/**
 * Elimina un documento de Firestore.
 * Si está offline, encola la eliminación.
 * @param collectionName - Nombre de la colección.
 * @param docId - ID del documento.
 */
export async function deleteDocument(
  collectionName: string,
  docId: string
): Promise<void> {
  const operation = async () => {
    const docRef = doc(db, collectionName, docId)
    await deleteDoc(docRef)
  }
  
  if (isOffline.value) {
    queueChange(() => operation())
    console.log(`⏳ Operación de eliminación en ${collectionName}/${docId} encolada por modo offline`)
  } else {
    await withFirestoreError(operation, `Error al eliminar el documento ${docId}`)
  }
}
