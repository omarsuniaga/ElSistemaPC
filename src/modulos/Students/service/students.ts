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
  orderBy,
  where
} from 'firebase/firestore'
import type { Student } from '../../../types'
import { useAuthStore } from '../../../stores/auth'

const COLLECTION_NAME = 'ALUMNOS'

// Función auxiliar para mapear datos del estudiante
const mapStudentData = (id: string, data: any): Student => {
  return {
    id,
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
    grupo: mapGrupoData(data.grupo),
    clase: data.clase || '',
    classIds: Array.isArray(data.classIds) ? data.classIds : [],
    fecInscripcion: data.fecInscripcion || '',
    avatar: data.avatar || '',
    documentos: data.documentos || {},
    attendanceStatus: data.attendanceStatus,
    activo: data.activo ?? true,
    createdAt: data.createdAt,
    updatedAt: data.updatedAt
  } as Student
}

// Función auxiliar para manejar diferentes formatos del campo grupo
const mapGrupoData = (grupo: any): string[] => {
  if (Array.isArray(grupo)) {
    return grupo
  } else if (grupo) {
    if (typeof grupo === 'string' && grupo.startsWith('[') && grupo.endsWith(']')) {
      try {
        const parsed = JSON.parse(grupo)
        return Array.isArray(parsed) ? parsed : [grupo]
      } catch (e) {
        console.warn(`Error parsing grupo value:`, e)
        return [grupo]
      }
    } else {
      return [grupo]
    }
  } else {
    return []
  }
}

// Función auxiliar para obtener clases del maestro
const getTeacherClasses = async (teacherId: string): Promise<any[]> => {
  try {
    const classesCollection = collection(db, 'CLASES');
    const teacherQuery = query(classesCollection, where('teacherId', '==', teacherId));
    const querySnapshot = await getDocs(teacherQuery);
    
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      studentIds: doc.data().studentIds || []
    }));
  } catch (error) {
    console.error('Error obteniendo clases del maestro:', error);
    return [];
  }
}

export const getStudentsFirebase = async (): Promise<Student[]> => {
  try {
    const authStore = useAuthStore()
    const currentUser = authStore.user
    const role = currentUser?.role || ''
    const uid = currentUser?.uid || ''
    
    // Generar clave para caché específica por usuario/rol
    const cacheKey = `students_${role}_${uid}`
    
    // Intentar obtener del caché primero
    const cachedData = localStorage.getItem(cacheKey)
    if (cachedData) {
      try {
        const cached = JSON.parse(cachedData)
        // Verificar si el caché es reciente (menos de 5 minutos)
        if (cached.timestamp && (Date.now() - cached.timestamp < 5 * 60 * 1000)) {
          console.log('[Caché] Usando estudiantes en caché')
          return cached.data
        }
      } catch (e) {
        console.warn('Error al leer caché de estudiantes:', e)
      }
    }
    
    // Consulta base con ordenamiento
    const baseQuery = query(collection(db, COLLECTION_NAME), orderBy('apellido'))
    
    // Aplicar filtrado según el rol
    if (['Maestro', 'Teacher', 'teacher'].includes(role) && uid) {
      // Para maestros, filtrar estudiantes por sus clases
      console.log(`[Filtro] Obteniendo estudiantes para maestro: ${uid}`)
      
      // 1. Obtener clases del maestro (ya filtradas por teacherId)
      const teacherClasses = await getTeacherClasses(uid)
      
      if (teacherClasses.length === 0) {
        console.log('[Filtro] El maestro no tiene clases asignadas')
        return []
      }
      
      // 2. Extraer IDs de estudiantes de todas las clases del maestro
      const studentIds = new Set<string>()
      teacherClasses.forEach(clase => {
        if (clase.studentIds && Array.isArray(clase.studentIds)) {
          clase.studentIds.forEach(id => studentIds.add(id))
        }
      })
      
      if (studentIds.size === 0) {
        console.log('[Filtro] No hay estudiantes asignados a las clases del maestro')
        return []
      }
      
      console.log(`[Filtro] Encontrados ${studentIds.size} estudiantes en ${teacherClasses.length} clases`)
      
      // 3. Obtener todos los estudiantes y filtrar por los IDs recopilados
      const querySnapshot = await getDocs(baseQuery)
      const students = querySnapshot.docs
        .filter(doc => studentIds.has(doc.id))
        .map(doc => {
          const data = doc.data()
          return mapStudentData(doc.id, data)
        })
      
      // Guardar en caché
      try {
        localStorage.setItem(cacheKey, JSON.stringify({
          timestamp: Date.now(),
          data: students
        }))
      } catch (e) {
        console.warn('Error al guardar caché de estudiantes:', e)
      }
      
      console.log(`[Firebase] Obtenidos ${students.length} estudiantes para el maestro`)
      return students
    } else {
      // Para directores, admin u otros roles: obtener todos los estudiantes
      console.log('[Filtro] Obteniendo todos los estudiantes (rol admin/director)')
      const querySnapshot = await getDocs(baseQuery)
      const students = querySnapshot.docs.map(doc => {
        const data = doc.data()
        return mapStudentData(doc.id, data)
      })
      
      // Guardar en caché
      try {
        localStorage.setItem(cacheKey, JSON.stringify({
          timestamp: Date.now(),
          data: students
        }))
      } catch (e) {
        console.warn('Error al guardar caché de estudiantes:', e)
      }
      
      console.log(`[Firebase] Obtenidos ${students.length} estudiantes en total`)
      return students
    }
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