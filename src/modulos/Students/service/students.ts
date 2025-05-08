import { db } from '../../../firebase'
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
  orderBy
} from 'firebase/firestore'
import type { Student } from '../../../types'

const COLLECTION_NAME = 'ALUMNOS'

export const getStudentsFirebase = async (): Promise<Student[]> => {
  try {
    const q = query(collection(db, COLLECTION_NAME), orderBy('apellido'))
    const querySnapshot = await getDocs(q)
    const students = querySnapshot.docs.map(doc => {
      const data = doc.data()
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
        horario_colegio_trabajo: data.horario_colegio_trabajo || '',        grupo: (() => {
          // Manejar diferentes formatos del campo grupo
          if (Array.isArray(data.grupo)) {
            return data.grupo;
          } else if (data.grupo) {
            if (typeof data.grupo === 'string' && data.grupo.startsWith('[') && data.grupo.endsWith(']')) {
              try {
                const parsed = JSON.parse(data.grupo);
                return Array.isArray(parsed) ? parsed : [data.grupo];
              } catch (e) {
                console.warn(`Error parsing grupo value for student ${doc.id}:`, e);
                return [data.grupo];
              }
            } else {
              return [data.grupo];
            }
          } else {
            return [];
          }
        })(),
        clase: data.clase || '',
        classIds: Array.isArray(data.classIds) ? data.classIds : [],
        fecInscripcion: data.fecInscripcion || '',
        avatar: data.avatar || '',
        documentos: data.documentos || {},
        attendanceStatus: data.attendanceStatus,
        activo: data.activo ?? true,
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

export const getStudentByIdFirebase = async (id: string): Promise<Student | null> => {
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

export const createStudentFirebase = async (student: Omit<Student, 'id'>): Promise<Student> => {
  try {
    // Normalizar el objeto student para asegurarse de que grupo sea siempre un array
    const normalizedStudent = {
      ...student,
      // Asegurarse de que grupo sea un array
      grupo: Array.isArray(student.grupo) ? student.grupo : 
             (student.grupo ? [student.grupo] : [])
    };
    
    const docRef = await addDoc(collection(db, COLLECTION_NAME), {
      ...normalizedStudent,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    })

    return {
      id: docRef.id,
      ...normalizedStudent
    }
  } catch (error) {
    console.error('❌ Error al crear estudiante:', error)
    throw new Error('Error al crear el estudiante')
  }
}

export const updateStudentFirebase = async (id: string, student: Partial<Student>): Promise<void> => {
  try {
    const docRef = doc(db, COLLECTION_NAME, id)
    // Filtrar propiedades undefined y normalizar el campo grupo
    const cleanStudent = Object.entries(student).reduce((acc, [key, value]) => {
      if (value !== undefined) {
        // Si el campo es grupo, asegurar que sea un array
        if (key === 'grupo') {
          if (Array.isArray(value)) {
            acc[key] = value;
          } else {
            acc[key] = value ? [value] : [];
          }
        } else {
          acc[key] = value;
        }
      }
      return acc
    }, {} as Record<string, any>)

    await updateDoc(docRef, {
      ...cleanStudent,
      updatedAt: serverTimestamp()
    })
  } catch (error) {
    console.error(`❌ Error al actualizar estudiante ${id}:`, error)
    throw new Error('Error al actualizar los datos del estudiante')
  }
}

export const deleteStudentFirebase = async (id: string): Promise<void> => {
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