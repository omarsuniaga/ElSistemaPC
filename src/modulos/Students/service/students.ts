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
  where,
} from 'firebase/firestore';
import type { Student } from '../../../types';
import { useAuthStore } from '../../../stores/auth';
import { createStudentRegistrationNotification } from '../../Teachers/services/generalNotifications';
import { fetchTeachersFromFirebase } from '../../Teachers/services/teachers';

const COLLECTION_NAME = 'ALUMNOS';

// Add database connection verification
export const verifyDatabaseConnection = async (): Promise<boolean> => {
  try {
    console.log('[verifyDatabaseConnection] Testing Firestore connection...');
    const testCollection = collection(db, COLLECTION_NAME);
    const testQuery = query(testCollection, orderBy('apellido'));
    await getDocs(testQuery);
    console.log('[verifyDatabaseConnection] Firestore connection successful');
    return true;
  } catch (error) {
    console.error('[verifyDatabaseConnection] Firestore connection failed:', error);
    return false;
  }
};

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
    updatedAt: data.updatedAt,
  } as Student;
};

// Función auxiliar para manejar diferentes formatos del campo grupo
const mapGrupoData = (grupo: any): string[] => {
  if (Array.isArray(grupo)) {
    return grupo;
  } else if (grupo) {
    if (typeof grupo === 'string' && grupo.startsWith('[') && grupo.endsWith(']')) {
      try {
        const parsed = JSON.parse(grupo);
        return Array.isArray(parsed) ? parsed : [grupo];
      } catch (e) {
        console.warn('Error parsing grupo value:', e);
        return [grupo];
      }
    } else {
      return [grupo];
    }
  } else {
    return [];
  }
};

// Función auxiliar para obtener clases del maestro
const getTeacherClasses = async (teacherId: string): Promise<any[]> => {
  try {
    const classesCollection = collection(db, 'CLASES');

    // Obtener todas las clases para filtrar por maestro titular Y asistente
    const allClassesQuery = query(classesCollection);
    const querySnapshot = await getDocs(allClassesQuery);

    const teacherClasses = querySnapshot.docs.filter((doc) => {
      const data = doc.data();

      // Verificar si es maestro titular
      if (data.teacherId === teacherId) {
        return true;
      }

      // Verificar si es maestro asistente en clases compartidas
      if (data.teachers && Array.isArray(data.teachers)) {
        return data.teachers.some(
          (teacher: any) =>
            teacher.teacherId === teacherId &&
            (teacher.role === 'assistant' || teacher.role === 'asistente'),
        );
      }

      return false;
    });

    const result = teacherClasses.map((doc) => ({
      id: doc.id,
      ...doc.data(),
      studentIds: doc.data().studentIds || [],
    }));

    console.log(
      `[getTeacherClasses] Maestro ${teacherId} tiene acceso a ${result.length} clases (titular + asistente)`,
    );
    return result;
  } catch (error) {
    console.error('Error obteniendo clases del maestro:', error);
    return [];
  }
};

// Función para notificar a los maestros sobre un nuevo estudiante registrado
const notifyTeachersAboutNewStudent = async (student: Student): Promise<void> => {
  try {
    console.log(
      '[notifyTeachersAboutNewStudent] Sending notifications for student:',
      student.nombre,
      student.apellido,
    );

    // Obtener todos los maestros
    const teachers = await fetchTeachersFromFirebase();
    console.log('[notifyTeachersAboutNewStudent] Found teachers:', teachers.length);

    // Obtener información del usuario actual que registró el estudiante
    const authStore = useAuthStore();
    const currentUser = authStore.user;

    // Enviar notificación a cada maestro
    const notificationPromises = teachers.map((teacher) => {
      if (teacher.id) {
        console.log(
          '[notifyTeachersAboutNewStudent] Sending notification to teacher:',
          teacher.name,
        );
        return createStudentRegistrationNotification({
          teacherId: teacher.id,
          studentId: student.id,
          studentName: `${student.nombre} ${student.apellido}`,
          studentData: {
            firstName: student.nombre,
            lastName: student.apellido,
            email: student.email,
            phone: student.tlf,
            instrument: student.instrumento,
            id: student.id,
          },
          fromUserId: currentUser?.uid || 'system',
          fromUserName: currentUser?.email || 'Sistema',
        });
      }
      return Promise.resolve('');
    });

    await Promise.all(notificationPromises);
    console.log('[notifyTeachersAboutNewStudent] All notifications sent successfully');
  } catch (error) {
    console.error('[notifyTeachersAboutNewStudent] Error sending notifications:', error);
    throw error;
  }
};

/**
 * Obtiene TODOS los estudiantes de la colección ALUMNOS sin filtros por rol
 * Útil para cuando los maestros necesitan ver todos los estudiantes disponibles
 * para agregarlos a sus clases
 */
export const getAllStudentsFirebase = async (): Promise<Student[]> => {
  try {
    console.log('[getAllStudentsFirebase] Obteniendo todos los estudiantes de la base de datos');

    // Consulta simple para obtener todos los estudiantes ordenados por apellido
    const baseQuery = query(collection(db, COLLECTION_NAME), orderBy('apellido'));
    const querySnapshot = await getDocs(baseQuery);

    const students = querySnapshot.docs.map((doc) => {
      const data = doc.data();
      return mapStudentData(doc.id, data);
    });

    console.log(`[getAllStudentsFirebase] Obtenidos ${students.length} estudiantes en total`);
    return students;
  } catch (error) {
    console.error('❌ Error al obtener todos los estudiantes:', error);
    throw new Error('Error al obtener la lista completa de estudiantes');
  }
};

export const getStudentsFirebase = async (): Promise<Student[]> => {
  try {
    const authStore = useAuthStore();
    const currentUser = authStore.user;
    const uid = currentUser?.uid || '';

    // Obtener permisos del usuario desde su documento
    let canViewAll = false;
    try {
      const userDoc = await getDoc(doc(db, 'USERS', uid));
      if (userDoc.exists()) {
        const userData = userDoc.data();
        const userPermissions = userData.userPermissions || [];
        canViewAll = userPermissions.includes('Ver Todos los Estudiantes');
      }
    } catch (permissionError) {
      console.warn('Error verificando permisos, usando permisos por defecto:', permissionError);
    }

    // Roles que siempre pueden ver todos los estudiantes
    const adminRoles = ['Superusuario', 'Admin', 'Director'];
    if (adminRoles.includes(currentUser?.role || '')) {
      canViewAll = true;
    }

    console.log(`[RBAC] Usuario ${uid} puede ver todos los estudiantes:`, canViewAll);

    // Generar clave para caché específica por usuario/permisos
    const cacheKey = `students_${uid}_${canViewAll ? 'all' : 'own'}`;

    // Intentar obtener del caché primero
    const cachedData = localStorage.getItem(cacheKey);
    if (cachedData) {
      try {
        const cached = JSON.parse(cachedData);
        // Verificar si el caché es reciente (menos de 5 minutos)
        if (cached.timestamp && Date.now() - cached.timestamp < 5 * 60 * 1000) {
          console.log('[Caché] Usando estudiantes en caché');
          return cached.data;
        }
      } catch (e) {
        console.warn('Error al leer caché de estudiantes:', e);
      }
    }

    // Consulta base con ordenamiento
    const baseQuery = query(collection(db, COLLECTION_NAME), orderBy('apellido'));

    if (canViewAll) {
      // Usuario con permiso para ver todos los estudiantes
      // console.log('[RBAC] Obteniendo todos los estudiantes')
      const querySnapshot = await getDocs(baseQuery);
      const students = querySnapshot.docs.map((doc) => {
        const data = doc.data();
        return mapStudentData(doc.id, data);
      });

      // Guardar en caché
      try {
        localStorage.setItem(
          cacheKey,
          JSON.stringify({
            timestamp: Date.now(),
            data: students,
          }),
        );
      } catch (e) {
        console.warn('Error al guardar caché de estudiantes:', e);
      }

      // console.log(`[Firebase] Obtenidos ${students.length} estudiantes en total`)
      return students;
    } else {
      // Usuario con permiso solo para ver estudiantes de sus clases
      // console.log(`[RBAC] Usuario con permisos limitados: solo estudiantes de sus clases`)

      // 1. Obtener clases del maestro (ya filtradas por teacherId)
      const teacherClasses = await getTeacherClasses(uid);

      if (teacherClasses.length === 0) {
        // console.log('[Filtro] El maestro no tiene clases asignadas')
        return [];
      }

      // 2. Extraer IDs de estudiantes de todas las clases del maestro
      const studentIds = new Set<string>();
      teacherClasses.forEach((clase) => {
        if (clase.studentIds && Array.isArray(clase.studentIds)) {
          clase.studentIds.forEach((id: string) => studentIds.add(id));
        }
      });

      if (studentIds.size === 0) {
        // console.log('[Filtro] No hay estudiantes asignados a las clases del maestro')
        return [];
      }

      // console.log(`[Filtro] Encontrados ${studentIds.size} estudiantes en ${teacherClasses.length} clases`)

      // 3. Obtener todos los estudiantes y filtrar por los IDs recopilados
      const querySnapshot = await getDocs(baseQuery);
      const students = querySnapshot.docs
        .filter((doc) => studentIds.has(doc.id))
        .map((doc) => {
          const data = doc.data();
          return mapStudentData(doc.id, data);
        });

      // Guardar en caché
      try {
        localStorage.setItem(
          cacheKey,
          JSON.stringify({
            timestamp: Date.now(),
            data: students,
          }),
        );
      } catch (e) {
        console.warn('Error al guardar caché de estudiantes:', e);
      }

      console.log(`[Firebase] Obtenidos ${students.length} estudiantes para el maestro`);
      return students;
    }
  } catch (error) {
    console.error('❌ Error al obtener estudiantes:', error);
    throw new Error('Error al obtener la lista de estudiantes');
  }
};

export const getStudentByIdFirebase = async (id: string): Promise<Student | null> => {
  try {
    const docRef = doc(db, COLLECTION_NAME, id);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      return {
        id: docSnap.id,
        ...docSnap.data(),
      } as Student;
    }

    return null;
  } catch (error) {
    console.error(`❌ Error al obtener estudiante ${id}:`, error);
    throw new Error('Error al obtener los datos del estudiante');
  }
};

export const createStudentFirebase = async (student: Omit<Student, 'id'>): Promise<Student> => {
  try {
    console.log('[createStudentFirebase] Starting student creation process');
    console.log('[createStudentFirebase] Input student data:', JSON.stringify(student, null, 2));

    // Verify database connection first
    const isConnected = await verifyDatabaseConnection();
    if (!isConnected) {
      throw new Error('No se pudo conectar a la base de datos');
    }

    // Normalizar el objeto student para asegurarse de que grupo sea siempre un array
    const normalizedStudent = {
      ...student,
      // Asegurarse de que grupo sea un array
      grupo: Array.isArray(student.grupo) ? student.grupo : student.grupo ? [student.grupo] : [],
    };

    console.log(
      '[createStudentFirebase] Normalized student data:',
      JSON.stringify(normalizedStudent, null, 2),
    );
    console.log('[createStudentFirebase] Collection name:', COLLECTION_NAME);

    const dataToSave = {
      ...normalizedStudent,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    console.log(
      '[createStudentFirebase] Data to save to Firestore:',
      JSON.stringify(dataToSave, null, 2),
    );

    const docRef = await addDoc(collection(db, COLLECTION_NAME), dataToSave);

    console.log('[createStudentFirebase] Document successfully created with ID:', docRef.id);

    const createdStudent = {
      id: docRef.id,
      ...normalizedStudent,
      createdAt: new Date(), // Convert serverTimestamp to Date for local usage
      updatedAt: new Date(),
    };

    console.log(
      '[createStudentFirebase] Returning created student:',
      JSON.stringify(createdStudent, null, 2),
    );

    // Enviar notificaciones a los maestros sobre el nuevo estudiante registrado
    try {
      await notifyTeachersAboutNewStudent(createdStudent);
    } catch (notificationError) {
      console.warn('No se pudieron enviar las notificaciones a los maestros:', notificationError);
      // No lanzar error aquí para no fallar la creación del estudiante
    }

    return createdStudent;
  } catch (error: any) {
    console.error('❌ [createStudentFirebase] Error al crear estudiante:', error);
    console.error(
      '❌ [createStudentFirebase] Error details:',
      error?.message,
      error?.code,
      error?.stack,
    );
    throw new Error('Error al crear el estudiante: ' + (error?.message || 'Error desconocido'));
  }
};

export const updateStudentFirebase = async (
  id: string,
  student: Partial<Student>,
): Promise<void> => {
  try {
    console.log(`[updateStudentFirebase] Iniciando actualización para ID: ${id}`);
    console.log('[updateStudentFirebase] Datos recibidos:', JSON.stringify(student, null, 2));

    const docRef = doc(db, COLLECTION_NAME, id);
    // Filtrar propiedades undefined y normalizar el campo grupo
    const cleanStudent = Object.entries(student).reduce(
      (acc, [key, value]) => {
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
        return acc;
      },
      {} as Record<string, any>,
    );

    console.log('[updateStudentFirebase] Datos limpiados:', JSON.stringify(cleanStudent, null, 2));
    console.log('[updateStudentFirebase] Guardando en Firestore...');

    await updateDoc(docRef, {
      ...cleanStudent,
      updatedAt: serverTimestamp(),
    });

    console.log('[updateStudentFirebase] ✅ Documento actualizado exitosamente en Firestore');
  } catch (error) {
    console.error('[updateStudentFirebase] ❌ Error al actualizar documento:', error);
    console.error(`❌ Error al actualizar estudiante ${id}:`, error);
    throw new Error('Error al actualizar los datos del estudiante');
  }
};

export const deleteStudentFirebase = async (id: string): Promise<void> => {
  if (!id) {
    throw new Error('ID de estudiante inválido');
  }

  try {
    // Ensure the ID is properly formatted for Firestore
    const sanitizedId = id.toString().trim();
    const docRef = doc(db, COLLECTION_NAME, sanitizedId);

    // Verify document exists before deletion
    const docSnap = await getDoc(docRef);
    if (!docSnap.exists()) {
      throw new Error(`No se encontró el estudiante con ID: ${sanitizedId}`);
    }

    await deleteDoc(docRef);
  } catch (error) {
    console.error(`❌ Error al eliminar estudiante ${id}:`, error);
    throw new Error('Error al eliminar el estudiante');
  }
};

// Función para obtener estudiantes de una clase específica (sin restricciones de permisos)
export const getStudentsByClassFirebase = async (classId: string): Promise<Student[]> => {
  try {
    console.log(`[getStudentsByClassFirebase] Obteniendo estudiantes para clase: ${classId}`);

    // Primero obtener la información de la clase para conseguir los studentIds
    const classDoc = await getDoc(doc(db, 'CLASES', classId));

    if (!classDoc.exists()) {
      console.log(`[getStudentsByClassFirebase] Clase ${classId} no encontrada`);
      return [];
    }

    const classData = classDoc.data();
    const studentIds = classData.studentIds || [];

    if (studentIds.length === 0) {
      console.log(`[getStudentsByClassFirebase] No hay estudiantes asignados a la clase ${classId}`);
      return [];
    }

    console.log(
      `[getStudentsByClassFirebase] Encontrados ${studentIds.length} IDs de estudiantes en la clase`,
    );

    // Obtener todos los estudiantes de la clase
    const studentsCollection = collection(db, COLLECTION_NAME);
    const querySnapshot = await getDocs(studentsCollection);

    const students = querySnapshot.docs
      .filter((doc) => studentIds.includes(doc.id))
      .map((doc) => {
        const data = doc.data();
        return mapStudentData(doc.id, data);
      });

    console.log(
      `[getStudentsByClassFirebase] Obtenidos ${students.length} estudiantes para la clase ${classId}`,
    );
    return students;
  } catch (error) {
    console.error(
      `[getStudentsByClassFirebase] Error obteniendo estudiantes para clase ${classId}:`,
      error,
    );
    return [];
  }
};
