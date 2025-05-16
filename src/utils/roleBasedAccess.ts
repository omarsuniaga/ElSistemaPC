// src/utils/roleBasedAccess.ts
import { query, where, CollectionReference, Query, DocumentData } from 'firebase/firestore';
import { useAuthStore } from '../stores/auth';

/**
 * Aplica filtros basados en el rol del usuario a consultas de Firestore
 * 
 * @param collectionRef Referencia a la colección en Firestore
 * @param fieldName Campo por el cual filtrar (por defecto: teacherId)
 * @returns Query con filtro aplicado si es maestro, o colección sin filtro si es admin
 */
export const applyTeacherFilter = (
  collectionRef: CollectionReference<DocumentData>,
  fieldName: string = 'teacherId'
): Query<DocumentData> | CollectionReference<DocumentData> => {
  const authStore = useAuthStore();
  const isTeacher = ['Teacher', 'Maestro'].includes(authStore.user?.role || '');
  const userId = authStore.user?.uid;
  
  if (isTeacher && userId) {
    console.log(`[Filtro] Aplicando filtro de maestro: ${fieldName} == ${userId}`);
    return query(collectionRef, where(fieldName, '==', userId));
  }
  
  console.log('[Filtro] Usuario con rol Admin/Director - sin filtro aplicado');
  return collectionRef;
};

/**
 * Verifica si un usuario tiene acceso a un documento específico
 * 
 * @param documentData Datos del documento a verificar
 * @param teacherIdField Campo que contiene el ID del maestro
 * @returns true si tiene acceso, false si no
 */
export const hasAccessToDocument = (
  documentData: any,
  teacherIdField: string = 'teacherId'
): boolean => {
  if (!documentData) return false;
  
  const authStore = useAuthStore();
  const isTeacher = ['Teacher', 'Maestro'].includes(authStore.user?.role || '');
  const userId = authStore.user?.uid;
  
  // Si es admin o director, siempre tiene acceso
  if (!isTeacher) return true;
  
  // Si es maestro, verificar que el documento le pertenezca
  return documentData[teacherIdField] === userId;
};

/**
 * Genera una clave única para almacenamiento en caché
 */
export const generateCacheKey = (prefix: string, params: Record<string, any> = {}): string => {
  const authStore = useAuthStore();
  const userId = authStore.user?.uid || 'anonymous';
  const role = authStore.user?.role || 'unknown';
  
  // Convertir parámetros a una cadena ordenada para consistencia
  const paramsString = Object.entries(params)
    .sort(([keyA], [keyB]) => keyA.localeCompare(keyB))
    .map(([key, value]) => `${key}=${value}`)
    .join('&');
  
  return `${prefix}_${role}_${userId}${paramsString ? `_${paramsString}` : ''}`;
};
