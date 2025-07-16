import { ref, Ref } from 'vue';
import {
  collection,
  query,
  getDocs,
  QueryConstraint,
  DocumentData,
  limit,
  startAfter,
  DocumentSnapshot,
  QueryDocumentSnapshot,
} from 'firebase/firestore';
import { db } from '../firebase';

interface PaginationOptions {
  pageSize?: number
  orderByField?: string
  orderDirection?: 'asc' | 'desc'
  filters?: QueryConstraint[]
}

interface PaginatedFirestoreResult<T> {
  items: Ref<T[]>
  loading: Ref<boolean>
  error: Ref<string | null>
  hasMore: Ref<boolean>
  loadFirstPage: () => Promise<void>
  loadNextPage: () => Promise<void>
  updateFilters: (newFilters: QueryConstraint[]) => void
}

/**
 * Composable para consultas paginadas a Firestore
 * Ideal para datos históricos o listados que no requieren actualización en tiempo real
 *
 * @param collectionName Nombre de la colección en Firestore
 * @param options Opciones de paginación y filtrado
 * @returns Objeto con datos y métodos para manejar la paginación
 */
export function usePaginatedFirestore<T = DocumentData>(
  collectionName: string,
  options: PaginationOptions = {},
): PaginatedFirestoreResult<T> {
  // Opciones con valores por defecto
  const { pageSize = 10, orderByField = 'createdAt', orderDirection = 'desc' } = options;

  // Estado
  const items = ref<T[]>([]) as Ref<T[]>;
  const loading = ref(false);
  const error = ref<string | null>(null);
  const lastDoc = ref<QueryDocumentSnapshot | null>(null);
  const hasMore = ref(true);

  // Estado interno
  let filters = options.filters || [];

  // Construir query base
  const buildQuery = (afterDoc: QueryDocumentSnapshot | null = null) => {
    const constraints: QueryConstraint[] = [...filters];

    // Si se proporciona un campo para ordenar, lo añadimos
    if (orderByField) {
      const orderByFn = require('firebase/firestore').orderBy;
      constraints.push(orderByFn(orderByField, orderDirection));
    }

    // Añadir límite
    constraints.push(limit(pageSize));

    // Si hay un documento para continuar la paginación
    if (afterDoc) {
      constraints.push(startAfter(afterDoc));
    }

    return query(collection(db, collectionName), ...constraints);
  };

  // Cargar primera página
  const loadFirstPage = async () => {
    loading.value = true;
    error.value = null;

    try {
      const q = buildQuery();
      const snapshot = await getDocs(q);

      // Actualizar datos
      const docs = snapshot.docs;
      items.value = docs.map((doc) => ({ id: doc.id, ...doc.data() })) as T[];

      // Actualizar estado de paginación
      lastDoc.value = docs.length > 0 ? docs[docs.length - 1] : null;
      hasMore.value = docs.length === pageSize;
    } catch (err: any) {
      console.error(`Error al cargar ${collectionName}:`, err);
      error.value = err.message;
    } finally {
      loading.value = false;
    }
  };

  // Cargar siguiente página
  const loadNextPage = async () => {
    if (!hasMore.value || !lastDoc.value) return;

    loading.value = true;
    error.value = null;

    try {
      const q = buildQuery(lastDoc.value);
      const snapshot = await getDocs(q);

      // Actualizar datos
      const docs = snapshot.docs;
      if (docs.length > 0) {
        items.value = [...items.value, ...(docs.map((doc) => ({ id: doc.id, ...doc.data() })) as T[])];
        lastDoc.value = docs[docs.length - 1];
      }

      // Verificar si hay más resultados
      hasMore.value = docs.length === pageSize;
    } catch (err: any) {
      console.error(`Error al cargar más ${collectionName}:`, err);
      error.value = err.message;
    } finally {
      loading.value = false;
    }
  };

  // Actualizar filtros
  const updateFilters = (newFilters: QueryConstraint[]) => {
    filters = newFilters;
    loadFirstPage(); // Recargar con los nuevos filtros
  };

  // Cargar primera página automáticamente al inicio
  loadFirstPage();

  return {
    items,
    loading,
    error,
    hasMore,
    loadFirstPage,
    loadNextPage,
    updateFilters,
  };
}
