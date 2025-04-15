import { db } from '../../../firebase';
import { 
  collection, 
  getDocs,
  doc, 
  getDoc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  serverTimestamp,
  query,
  orderBy,
  where
} from 'firebase/firestore';
import type { Instrument } from '../types/instrumentsTypes';
// Usa el modelo extendido InstrumentFirestore para crear y actualizar
import type { InstrumentFirestore } from '../../../types/instrumento';

const COLLECTION_NAME = 'INSTRUMENTOS';

/**
 * Recupera todos los instrumentos de la base de datos
 */
export const getInstruments = async (): Promise<Instrument[]> => {
  try {
    console.log('🔄 Consultando instrumentos en Firestore...')
    const q = query(collection(db, COLLECTION_NAME), orderBy('nombre'))
    const querySnapshot = await getDocs(q)
    console.log(`✅ Instrumentos recuperados: ${querySnapshot.size}`)
    
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Instrument[]
  } catch (error) {
    console.error('❌ Error al obtener instrumentos:', error)
    throw new Error('Error al obtener la lista de instrumentos')
  }
}

/**
 * Obtiene un instrumento por su ID
 */
export const getInstrumentById = async (id: string): Promise<Instrument | null> => {
  try {
    const docRef = doc(db, COLLECTION_NAME, id)
    const docSnap = await getDoc(docRef)
    
    if (docSnap.exists()) {
      return {
        id: docSnap.id,
        ...docSnap.data()
      } as Instrument
    }
    
    return null
  } catch (error) {
    console.error(`❌ Error al obtener instrumento ${id}:`, error)
    throw new Error('Error al obtener los datos del instrumento')
  }
}

/**
 * Crea un nuevo instrumento (modelo extendido)
 */
export const createInstrument = async (instrument: Omit<InstrumentFirestore, 'id'>): Promise<InstrumentFirestore> => {
  try {
    const docRef = await addDoc(collection(db, COLLECTION_NAME), {
      ...instrument,
      activo: instrument.activo ?? true,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    return {
      id: docRef.id,
      ...instrument
    };
  } catch (error) {
    console.error('❌ Error al crear instrumento:', error);
    throw new Error('Error al crear el instrumento');
  }
};

/**
 * Actualiza un instrumento existente (modelo extendido)
 */
export const updateInstrument = async (id: string, instrument: Partial<InstrumentFirestore>): Promise<void> => {
  try {
    const docRef = doc(db, COLLECTION_NAME, id);
    // Filtrar propiedades undefined
    const cleanInstrument = Object.entries(instrument).reduce((acc, [key, value]) => {
      if (value !== undefined) acc[key] = value;
      return acc;
    }, {} as Record<string, any>);
    await updateDoc(docRef, {
      ...cleanInstrument,
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    console.error(`❌ Error al actualizar instrumento ${id}:`, error);
    throw new Error('Error al actualizar los datos del instrumento');
  }
}

/**
 * Elimina un instrumento
 */
export const deleteInstrument = async (id: string): Promise<void> => {
  if (!id) {
    throw new Error('ID de instrumento inválido')
  }

  try {
    const sanitizedId = id.toString().trim()
    const docRef = doc(db, COLLECTION_NAME, sanitizedId)
    
    // Verificar si existe antes de eliminar
    const docSnap = await getDoc(docRef)
    if (!docSnap.exists()) {
      throw new Error(`No se encontró el instrumento con ID: ${sanitizedId}`)
    }

    await deleteDoc(docRef)
  } catch (error) {
    console.error(`❌ Error al eliminar instrumento ${id}:`, error)
    throw new Error('Error al eliminar el instrumento')
  }
}

/**
 * Busca instrumentos por familia
 */
export const getInstrumentsByFamily = async (family: string): Promise<Instrument[]> => {
  try {
    const q = query(collection(db, COLLECTION_NAME), where('familia', '==', family))
    const querySnapshot = await getDocs(q)
    
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Instrument[]
  } catch (error) {
    console.error(`❌ Error al buscar instrumentos por familia ${family}:`, error)
    throw new Error('Error al buscar instrumentos por familia')
  }
}

/**
 * Obtiene todas las familias de instrumentos disponibles
 */
export const getInstrumentFamilies = async (): Promise<string[]> => {
  try {
    const querySnapshot = await getDocs(collection(db, COLLECTION_NAME))
    const families = querySnapshot.docs
      .map(doc => doc.data().familia as string)
      .filter(family => !!family)
    
    // Eliminar duplicados
    return [...new Set(families)]
  } catch (error) {
    console.error('❌ Error al obtener familias de instrumentos:', error)
    throw new Error('Error al obtener las familias de instrumentos')
  }
}
