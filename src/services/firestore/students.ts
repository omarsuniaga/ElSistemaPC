import { db } from '../../firebase'
import { 
  collection, 
  getDocs, 
  doc, 
  getDoc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  serverTimestamp
} from 'firebase/firestore'
import type { Student } from '../../types'

const COLLECTION_NAME = 'ALUMNOS'

export const getStudents = async (): Promise<Student[]> => {
  try {
    console.log('🔄 Consultando estudiantes en Firestore...')
    const querySnapshot = await getDocs(collection(db, COLLECTION_NAME))
    console.log(`✅ Estudiantes recuperados: ${querySnapshot.size}`)
    
    const students = querySnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        nombre: data.nombre || '',
        apellido: data.apellido || '',
        edad: data.edad || '',
        nac: data.nac || '',
        sexo: data.sexo || '',
        instrumento: data.instrumento || '',
        tlf: data.tlf || '',
        email: data.email || '',
        madre: data.madre || '',
        padre: data.padre || '',
        tlf_madre: data.tlf_madre || '',
        tlf_padre: data.tlf_padre || '',
        colegio_trabajo: data.colegio_trabajo || '',
        horario_colegio_trabajo: data.horario_colegio_trabajo || '',
        grupo: Array.isArray(data.grupo) ? data.grupo : [],
        clase: data.clase || '',
        classIds: Array.isArray(data.classIds) ? data.classIds : [],
        fecInscripcion: data.fecInscripcion || '',
        avatar: data.avatar || '',
        documentos: data.documentos || {},
        attendanceStatus: data.attendanceStatus,
        createdAt: data.createdAt,
        updatedAt: data.updatedAt
      } as Student;
    });
    return students
  } catch (error) {
    console.error('❌ Error al obtener estudiantes:', error)
    throw new Error('Error al obtener la lista de estudiantes')
  }
}

export const getStudentById = async (id: string): Promise<Student | null> => {
  try {
    const docRef = doc(db, COLLECTION_NAME, id)
    const docSnap = await getDoc(docRef)
    
    if (docSnap.exists()) {
      return {
        id: docSnap.id,
        ...docSnap.data()
      } as Student
    }
    
    return null
  } catch (error) {
    console.error(`❌ Error al obtener estudiante ${id}:`, error)
    throw new Error('Error al obtener los datos del estudiante')
  }
}

export const createStudent = async (student: Omit<Student, 'id'>): Promise<Student> => {
  try {
    const docRef = await addDoc(collection(db, COLLECTION_NAME), {
      ...student,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    })

    return {
      id: docRef.id,
      ...student
    }
  } catch (error) {
    console.error('❌ Error al crear estudiante:', error)
    throw new Error('Error al crear el estudiante')
  }
}

export const updateStudent = async (id: string, student: Partial<Student>): Promise<void> => {
  try {
    const docRef = doc(db, COLLECTION_NAME, id)
    await updateDoc(docRef, {
      ...student,
      updatedAt: serverTimestamp()
    })
  } catch (error) {
    console.error(`❌ Error al actualizar estudiante ${id}:`, error)
    throw new Error('Error al actualizar los datos del estudiante')
  }
}

export const deleteStudent = async (id: string): Promise<void> => {
  if (!id) {
    throw new Error('ID de estudiante inválido')
  }

  try {
    // Ensure the ID is properly formatted for Firestore
    const sanitizedId = id.toString().trim()
    const docRef = doc(db, COLLECTION_NAME, sanitizedId)
    
    // Verify document exists before deletion
    const docSnap = await getDoc(docRef)
    if (!docSnap.exists()) {
      throw new Error(`No se encontró el estudiante con ID: ${sanitizedId}`)
    }

    await deleteDoc(docRef)
  } catch (error) {
    console.error(`❌ Error al eliminar estudiante ${id}:`, error)
    throw new Error('Error al eliminar el estudiante')
  }
}