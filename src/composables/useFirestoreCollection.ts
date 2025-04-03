import { ref, onUnmounted, Ref, watch } from 'vue'
import { 
  collection, 
  query, 
  onSnapshot, 
  QueryConstraint, 
  DocumentData, 
  QuerySnapshot,
  FirestoreError
} from 'firebase/firestore'
import { db } from '../firebase'

interface FirestoreCollectionResult<T> {
  items: Ref<T[]>;
  loading: Ref<boolean>;
  error: Ref<string | null>;
  unsubscribe: () => void;
}

/**
 * Composable para obtener datos reactivos de Firestore
 * 
 * @param collectionName Nombre de la colección en Firestore
 * @param queryConstraints Array de restricciones para la consulta (puede ser reactivo)
 * @returns Objeto con datos reactivos, estado de carga y función para cancelar suscripción
 */
export function useFirestoreCollection<T = DocumentData>(
  collectionName: string, 
  queryConstraints: Ref<QueryConstraint[]> | QueryConstraint[] = []
): FirestoreCollectionResult<T> {
  const items = ref<T[]>([]) as Ref<T[]>
  const loading = ref(true)
  const error = ref<string | null>(null)
  
  // Función para procesar los documentos de una snapshot
  const processSnapshot = (snapshot: QuerySnapshot<DocumentData>) => {
    items.value = snapshot.docs.map(doc => ({ 
      id: doc.id, 
      ...doc.data() 
    })) as T[]
    
    loading.value = false
  }

  // Función para manejar errores
  const handleError = (err: FirestoreError) => {
    console.error(`Error en colección ${collectionName}:`, err)
    error.value = err.message
    loading.value = false
  }
  
  // Crear referencia a la colección
  const collectionRef = collection(db, collectionName)
  
  // Variable para almacenar la función de cancelación
  let unsubscribe: (() => void) | null = null
  
  // Función para iniciar la suscripción
  const startSubscription = (constraints: QueryConstraint[]) => {
    // Cancelar suscripción anterior si existe
    if (unsubscribe) {
      unsubscribe()
    }
    
    // Crear consulta con las restricciones
    const queryRef = query(collectionRef, ...constraints)
    
    // Iniciar carga
    loading.value = true
    error.value = null
    
    // Suscribirse a cambios en tiempo real
    unsubscribe = onSnapshot(
      queryRef,
      processSnapshot,
      handleError
    )
  }
  
  // Si queryConstraints es reactivo, actualizamos la suscripción cuando cambia
  if ('value' in queryConstraints) {
    watch(queryConstraints, (newConstraints) => {
      startSubscription(newConstraints)
    }, { immediate: true })
  } else {
    // Si no es reactivo, iniciamos la suscripción directamente
    startSubscription(queryConstraints)
  }
  
  // Cancelar suscripción al desmontar el componente
  onUnmounted(() => {
    if (unsubscribe) {
      unsubscribe()
    }
  })
  
  return { 
    items, 
    loading, 
    error,
    unsubscribe: () => {
      if (unsubscribe) {
        unsubscribe()
        unsubscribe = null
      }
    }
  }
}