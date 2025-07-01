import {ref} from "vue"
import {
  collection,
  doc,
  getDocs,
  getDoc,
  query,
  QueryConstraint,
  DocumentData,
  CollectionReference,
  DocumentReference,
} from "firebase/firestore"
import {db} from "../firebase"

export interface FirestoreComposable {
  getCollection: (
    collectionName: string,
    constraints?: QueryConstraint[]
  ) => Promise<DocumentData[]>
  getDocument: (collectionName: string, documentId: string) => Promise<DocumentData | null>
  loading: ReturnType<typeof ref<boolean>>
  error: ReturnType<typeof ref<string | null>>
}

/**
 * Composable para operaciones básicas de Firestore
 * Proporciona funciones para obtener colecciones y documentos
 */
export function useFirestore(): FirestoreComposable {
  const loading = ref(false)
  const error = ref<string | null>(null)

  /**
   * Obtiene todos los documentos de una colección
   * @param collectionName Nombre de la colección
   * @param constraints Restricciones de consulta opcionales
   * @returns Array de documentos
   */
  const getCollection = async (
    collectionName: string,
    constraints: QueryConstraint[] = []
  ): Promise<DocumentData[]> => {
    try {
      loading.value = true
      error.value = null

      const collectionRef: CollectionReference = collection(db, collectionName)
      const queryRef = constraints.length > 0 ? query(collectionRef, ...constraints) : collectionRef

      const querySnapshot = await getDocs(queryRef)

      const documents = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }))

      return documents
    } catch (err: any) {
      const errorMessage = `Error getting collection ${collectionName}: ${err.message}`
      console.error(errorMessage, err)
      error.value = errorMessage
      throw err
    } finally {
      loading.value = false
    }
  }

  /**
   * Obtiene un documento específico por ID
   * @param collectionName Nombre de la colección
   * @param documentId ID del documento
   * @returns Datos del documento o null si no existe
   */
  const getDocument = async (
    collectionName: string,
    documentId: string
  ): Promise<DocumentData | null> => {
    try {
      loading.value = true
      error.value = null

      const docRef: DocumentReference = doc(db, collectionName, documentId)
      const docSnap = await getDoc(docRef)

      if (docSnap.exists()) {
        return {
          id: docSnap.id,
          ...docSnap.data(),
        }
      } else {
        console.warn(`Document ${documentId} not found in collection ${collectionName}`)
        return null
      }
    } catch (err: any) {
      const errorMessage = `Error getting document ${documentId} from ${collectionName}: ${err.message}`
      console.error(errorMessage, err)
      error.value = errorMessage
      throw err
    } finally {
      loading.value = false
    }
  }

  return {
    getCollection,
    getDocument,
    loading,
    error,
  }
}
