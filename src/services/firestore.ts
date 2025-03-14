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

export class FirestoreError extends Error {
  constructor(message: string, public code?: string) {
    super(message)
    this.name = 'FirestoreError'
  }
}

// Suponiendo que AttendanceDocument sea un tipo definido para la asistencia.
// Si ya se encuentra definido en otro lugar, se puede omitir o importar.
export interface AttendanceDocument extends DocumentData {
  date: string;
  class_id: string;
  teacher_id: string;
  attendance: AttendanceEntry[];
}

export interface AttendanceEntry {
  student_id: string;
  status: string;
  timestamp: string;
}

const { queueChange, isOffline } = useOffline()

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

/**
 * Envía datos de asistencia a un webhook.
 * @param date - Fecha de la asistencia.
 * @param classId - ID de la clase.
 * @param teacherId - ID del profesor.
 * @param studentAttendance - Mapeo de IDs de estudiantes a su estado de asistencia.
 */
export async function sendAttendanceToWebhook(
  date: string,
  classId: string,
  teacherId: string,
  studentAttendance: Record<string, string>
): Promise<void> {
  try {
    const now = new Date().toISOString()
    const webhookData = {
      date,
      class_id: classId,
      teacher_id: teacherId,
      attendance: Object.entries(studentAttendance).map(([studentId, status]) => ({
        student_id: studentId,
        status,
        timestamp: now
      }))
    }
    
    await fetch('https://hook.us2.make.com/t2ockuc1vne58yqc68rjqp94njv1i3uo', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(webhookData),
    })
  } catch (error) {
    console.error('Error enviando asistencia al webhook:', error)
  }
}

/**
 * Obtiene los datos de asistencia para una fecha específica.
 * @param date - Fecha de la asistencia.
 * @returns Un documento de asistencia o null si no se encuentra.
 */
export const getAttendanceByDate = async (date: string): Promise<AttendanceDocument | null> => {
  return withFirestoreError(async () => {
    const docRef = doc(db, 'ASISTENCIAS', date)
    const docSnap = await getDoc(docRef)
    return docSnap.exists() ? (docSnap.data() as AttendanceDocument) : null
  }, `Error al obtener la asistencia para la fecha ${date}`)
}

/**
 * Obtiene los datos de asistencia para un rango de fechas.
 * @param startDate - Fecha inicial del rango.
 * @param endDate - Fecha final del rango.
 * @returns Un array de documentos de asistencia.
 */
export const getAttendanceByDateRange = async (startDate: string, endDate: string): Promise<AttendanceDocument[]> => {
  return withFirestoreError(async () => {
    const q = query(
      collection(db, 'ASISTENCIAS'),
      where('date', '>=', startDate),
      where('date', '<=', endDate)
    )
    const querySnapshot = await getDocs(q)
    return querySnapshot.docs.map(doc => doc.data() as AttendanceDocument)
  }, `Error al obtener la asistencia entre ${startDate} y ${endDate}`)
}

/**
 * Agrega una nueva clase a Firestore.
 * @param newClass - Datos de la nueva clase.
 */
export const addClassToFirebase = async (newClass: any) => {
  const operation = async () => {
    const docRef = doc(collection(db, 'CLASES'));
    await setDoc(docRef, newClass);
  };
  if (isOffline.value) {
    await queueChange('create', 'CLASES', newClass);
  } else {
    await withFirestoreError(operation, 'Error al agregar la clase');
  }
};

/**
 * Obtiene las clases de Firestore.
 * @returns Un array de clases.
 */
export const fetchClassesFromFirebase = async (): Promise<any[]> => {
  return await getCollection<any>('CLASES');
};

/**
 * Actualiza una clase en Firestore.
 * @param classId - ID de la clase a actualizar.
 * @param updatedClass - Datos actualizados de la clase.
 */
export const updateClassInFirebase = async (classId: string, updatedClass: any) => {
  const operation = async () => {
    const docRef = doc(db, 'CLASES', classId);
    await updateDoc(docRef, updatedClass);
  };
  if (isOffline.value) {
    await queueChange('update', 'CLASES', updatedClass);
  } else {
    await withFirestoreError(operation, 'Error al actualizar la clase');
  }
};

/**
 * Elimina una clase de Firestore.
 * @param classId - ID de la clase a eliminar.
 */
export const deleteClassFromFirebase = async (classId: string) => {
  const operation = async () => {
    const docRef = doc(db, 'CLASES', classId);
    await deleteDoc(docRef);
  };
  if (isOffline.value) {
    await queueChange('delete', 'CLASES', { id: classId });
  } else {
    await withFirestoreError(operation, 'Error al eliminar la clase');
  }
};
