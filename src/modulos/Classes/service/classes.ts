import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
} from 'firebase/firestore';
import { db } from '../../../firebase';
import {
  TeacherRole,
  type ClassData,
  type ClassTeacher,
  type TeacherClassView,
  type InviteAssistantData,
} from '../types/class';
import { getAuth } from 'firebase/auth';
import type {
  TimeSlot,
  ScheduleConflict,
  ScheduleValidationResult,
} from '../../../utils/scheduleConflicts';
import {
  timeSlotsOverlap,
  formatConflictMessage,
  timeToMinutes,
} from '../../../utils/scheduleConflicts';
import { getStudentByIdFirebase } from '../../Students/service/students';

const auth = getAuth();

const CLASSES_COLLECTION = 'CLASES';
const USERS_COLLECTION = 'USERS';

/**
 * Obtiene el usuario currente de Firestore basado en su email.
 */
const getCurrentUserFromFirestore = async (): Promise<any | null> => {
  try {
    const currentUser = auth.currentUser;
    if (!currentUser || !currentUser.email) return null;
    const usersCollection = collection(db, USERS_COLLECTION);
    const q = query(usersCollection, where('email', '==', currentUser.email));
    const querySnapshot = await getDocs(q);
    if (querySnapshot.empty) return null;
    return {
      id: querySnapshot.docs[0].id,
      ...querySnapshot.docs[0].data(),
    };
  } catch (error) {
    console.error('Error fetching current user from Firestore:', error);
    return null;
  }
};

/**
 * Obtiene todas las clases filtradas según el rol del usuario actual.
 */
export const fetchClassesFirestore = async (): Promise<ClassData[]> => {
  try {
    // Obtener datos del usuario desde el store de autenticación
    const { useAuthStore } = await import('../../../stores/auth');

    const authStore = useAuthStore();
    const currentUser = authStore.user;
    const role = currentUser?.role || '';
    const uid = currentUser?.uid || '';

    // Generar clave para caché específica por usuario/rol
    const cacheKey = `classes_${role}_${uid}`;

    // Intentar obtener del caché primero
    const cachedData = localStorage.getItem(cacheKey);
    if (cachedData) {
      try {
        const cached = JSON.parse(cachedData);
        // Verificar si el caché es reciente (menos de 5 minutos)
        if (cached.timestamp && Date.now() - cached.timestamp < 5 * 60 * 1000) {
          console.log('[Caché] Usando clases en caché');
          return cached.data;
        }
      } catch (e) {
        console.warn('Error al leer caché de clases:', e);
      }
    }

    // Referencia a la colección de clases
    const classesCollection = collection(db, CLASSES_COLLECTION);
    let classesSnapshot;

    // Aplicar filtrado según el rol
    if (['Maestro', 'Teacher', 'teacher'].includes(role) && uid) {
      console.log(`[Filtro] Obteniendo clases para maestro: ${uid}`);
      const q = query(classesCollection, where('teacherId', '==', uid));
      classesSnapshot = await getDocs(q);
    } else if (['Alumno', 'Student', 'student'].includes(role) && uid) {
      console.log(`[Filtro] Obteniendo clases para alumno: ${uid}`);
      const q = query(classesCollection, where('studentIds', 'array-contains', uid));
      classesSnapshot = await getDocs(q);
    } else {
      // Si es director, admin o no hay rol definido, obtener todas las clases
      console.log('[Filtro] Obteniendo todas las clases (rol admin/director)');
      classesSnapshot = await getDocs(classesCollection);
    }
    // Procesar resultados
    const classes = classesSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as ClassData[];

    // Guardar en caché
    try {
      localStorage.setItem(
        cacheKey,
        JSON.stringify({
          timestamp: Date.now(),
          data: classes,
        }),
      );
    } catch (e) {
      console.warn('Error al guardar caché de clases:', e);
    }

    console.log(`[Firebase] Obtenidas ${classes.length} clases`);
    return classes;
  } catch (error) {
    console.error('Error fetching classes:', error);
    throw error;
  }
};

/**
 * Obtiene una clase por su ID, verificando permisos según el rol del usuario actual.
 */
export const getClassByIdFirestore = async (id: string): Promise<ClassData | null> => {
  try {
    const currentUser = await getCurrentUserFromFirestore();
    const classDoc = doc(db, CLASSES_COLLECTION, id);
    const classSnapshot = await getDoc(classDoc);
    if (!classSnapshot.exists()) return null;
    const classData = {
      id: classSnapshot.id,
      ...classSnapshot.data(),
    } as ClassData;
    if (currentUser) {
      const role = currentUser.role;
      if (role === 'teacher') {
        // Verificar si el maestro es titular de la clase
        const isOwner = classData.teacherId === currentUser.id;

        // Verificar si el maestro está en la lista de maestros colaboradores
        const isCollaborator =
          classData.teachers &&
          Array.isArray(classData.teachers) &&
          classData.teachers.some((teacher: any) => teacher.teacherId === currentUser.id);

        // Verificar si está en el campo assistantTeachers (por compatibilidad)
        const hasAssistantField =
          (classData as any).assistantTeachers &&
          Array.isArray((classData as any).assistantTeachers) &&
          (classData as any).assistantTeachers.includes(currentUser.id);

        // Permitir acceso si es titular, colaborador o asistente
        if (!isOwner && !isCollaborator && !hasAssistantField) {
          console.log(`[ClassService] Maestro ${currentUser.id} no tiene acceso a clase ${id}`);
          console.log(`[ClassService] - No es titular (${classData.teacherId})`);
          console.log(
            `[ClassService] - No es colaborador (${classData.teachers || 'sin colaboradores'})`,
          );
          console.log(
            `[ClassService] - No es asistente (${(classData as any).assistantTeachers || 'sin asistentes'})`,
          );
          return null;
        }

        console.log(`[ClassService] ✅ Maestro ${currentUser.id} tiene acceso a clase ${id}`);
        console.log(`[ClassService] - Es titular: ${isOwner}`);
        console.log(`[ClassService] - Es colaborador: ${isCollaborator}`);
        console.log(`[ClassService] - Es asistente: ${hasAssistantField}`);
      } else if (role === 'student' && !classData.studentIds?.includes(currentUser.id)) {
        return null;
      }
    } else {
      return null;
    }
    return classData;
  } catch (error) {
    console.error(`Error fetching class with ID ${id}:`, error);
    throw error;
  }
};

/**
 * Añade una nueva clase en Firestore.
 */
export const addClassFirestore = async (classData: Omit<ClassData, 'id'>): Promise<string> => {
  try {
    const classesCollection = collection(db, CLASSES_COLLECTION);
    const docRef = await addDoc(classesCollection, classData);
    return docRef.id;
  } catch (error) {
    console.error('Error adding class:', error);
    throw error;
  }
};

/**
 * Actualiza una clase existente en Firestore.
 */
export const updateClassFirestore = async (
  id: string,
  classData: Partial<ClassData>,
): Promise<void> => {
  try {
    const classDoc = doc(db, CLASSES_COLLECTION, id);
    await updateDoc(classDoc, classData);
    // Best-effort audit/logging: record the update in a CLASS_AUDIT collection
    try {
      const currentUser = await getCurrentUserFromFirestore();
      const auditCollection = collection(db, 'CLASS_AUDIT');
      const auditEntry = {
        classId: id,
        updatedBy: currentUser ? currentUser.id : null,
        updatedAt: new Date(),
        changes: classData,
      };
      // We don't await addDoc here to keep the update fast; still attempt it
      await addDoc(auditCollection, auditEntry as any);
    } catch (auditErr) {
      // Do not block the main update if audit logging fails
      console.warn('Audit logging failed for class update', id, auditErr);
    }
  } catch (error) {
    console.error(`Error updating class with ID ${id}:`, error);
    throw error;
  }
};

/**
 * Elimina una clase de Firestore.
 */
export const removeClassFirestore = async (id: string): Promise<void> => {
  try {
    const classDoc = doc(db, CLASSES_COLLECTION, id);
    await deleteDoc(classDoc);
  } catch (error) {
    console.error(`Error deleting class with ID ${id}:`, error);
    throw error;
  }
};

/**
 * Obtiene clases filtradas por el ID del profesor, con verificación de permisos.
 */
export const getClassesByTeacher = async (teacherId: string): Promise<ClassData[]> => {
  try {
    const currentUser = await getCurrentUserFromFirestore();
    if (currentUser) {
      const role = currentUser.role;
      if (role === 'teacher' && currentUser.id !== teacherId) return [];
    } else {
      return [];
    }
    const classesCollection = collection(db, CLASSES_COLLECTION);
    const q = query(classesCollection, where('teacherId', '==', teacherId));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as ClassData[];
  } catch (error) {
    console.error(`Error fetching classes for teacher ${teacherId}:`, error);
    throw error;
  }
};

/**
 * Verifica si el usuario actual tiene permisos para modificar una clase.
 */
export const canModifyClass = async (classId: string): Promise<boolean> => {
  try {
    const currentUser = await getCurrentUserFromFirestore();
    if (!currentUser) return false;
    if (currentUser.role === 'admin' || currentUser.role === 'superadmin') return true;
    if (currentUser.role === 'teacher') {
      const classData = await getClassByIdFirestore(classId);
      return classData?.teacherId === currentUser.id;
    }
    return false;
  } catch (error) {
    console.error('Error checking modify permissions:', error);
    return false;
  }
};

/**
 * Obtiene todas las clases que tienen a un estudiante específico en su lista de estudiantes.
 * @param studentId ID del estudiante a buscar
 * @returns Lista de clases que incluyen al estudiante especificado
 */
export const fetchClassesByStudentIdFirestore = async (studentId: string): Promise<any[]> => {
  try {
    if (!studentId) return [];

    const classesCollection = collection(db, CLASSES_COLLECTION);
    // Creamos una consulta para buscar clases donde el array studentIds contenga el ID del estudiante
    const q = query(classesCollection, where('studentIds', 'array-contains', studentId));
    const querySnapshot = await getDocs(q);
    // Convertimos los documentos a objetos con sus IDs incluidos
    const classes = querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    return classes;
  } catch (error) {
    console.error('Error fetching classes by student ID:', error);
    return [];
  }
};

/**
 * Verifica conflictos de horarios para una nueva clase o actualización
 */
export const validateScheduleConflicts = async (classData: {
  id?: string
  teacherId?: string
  studentIds?: string[]
  classroom?: string
  schedule?: {
    slots: TimeSlot[]
  }
}): Promise<ScheduleValidationResult> => {
  const conflicts: ScheduleConflict[] = [];
  const warnings: ScheduleConflict[] = [];

  if (!classData.schedule?.slots || classData.schedule.slots.length === 0) {
    return { hasConflicts: false, conflicts: [], warnings: [] };
  }

  try {
    // Obtener todas las clases existentes
    const allClasses = await fetchClassesFirestore();

    // Filtrar clases excluyendo la clase actual si es una actualización
    const otherClasses = allClasses.filter((cls) => cls.id !== classData.id);

    for (const newSlot of classData.schedule.slots) {
      // Verificar conflictos con profesores
      if (classData.teacherId) {
        const teacherConflicts = await checkTeacherConflicts(
          newSlot,
          classData.teacherId,
          otherClasses,
        );
        conflicts.push(...teacherConflicts);
      }

      // Verificar conflictos con estudiantes
      if (classData.studentIds && classData.studentIds.length > 0) {
        for (const studentId of classData.studentIds) {
          const studentConflicts = await checkStudentConflicts(newSlot, studentId, otherClasses);
          conflicts.push(...studentConflicts);
        }
      }

      // Verificar conflictos de aulas
      if (classData.classroom) {
        const classroomConflicts = await checkClassroomConflicts(
          newSlot,
          classData.classroom,
          otherClasses,
        );
        conflicts.push(...classroomConflicts);
      }
    }

    return {
      hasConflicts: conflicts.length > 0,
      conflicts,
      warnings,
    };
  } catch (error) {
    console.error('Error validating schedule conflicts:', error);
    return { hasConflicts: false, conflicts: [], warnings: [] };
  }
};

/**
 * Verifica conflictos de horarios para un profesor específico
 */
export const checkTeacherConflicts = async (
  newSlot: TimeSlot,
  teacherId: string,
  existingClasses?: ClassData[],
): Promise<ScheduleConflict[]> => {
  const conflicts: ScheduleConflict[] = [];

  try {
    const classes = existingClasses || (await fetchClassesFirestore());
    const teacherClasses = classes.filter((cls) => cls.teacherId === teacherId);

    for (const existingClass of teacherClasses) {
      if (existingClass.schedule?.slots) {
        for (const existingSlot of existingClass.schedule.slots) {
          if (timeSlotsOverlap(newSlot, existingSlot)) {
            conflicts.push({
              type: 'teacher',
              conflictingEntity: {
                id: existingClass.id,
                name: 'Profesor',
                className: existingClass.name,
              },
              conflictingSlot: existingSlot,
              severity: 'error',
              message: formatConflictMessage({
                type: 'teacher',
                conflictingEntity: {
                  id: existingClass.id,
                  name: 'Profesor',
                  className: existingClass.name,
                },
                conflictingSlot: existingSlot,
                severity: 'error',
                message: '',
              }),
            });
          }
        }
      }
    }
  } catch (error) {
    console.error('Error checking teacher conflicts:', error);
  }

  return conflicts;
};

/**
 * Verifica conflictos de horarios para un estudiante específico
 * Enfocado en la perspectiva del estudiante: ningún alumno debe estar en más de una clase al mismo tiempo
 */
export const checkStudentConflicts = async (
  newSlot: TimeSlot,
  studentId: string,
  existingClasses?: ClassData[],
): Promise<ScheduleConflict[]> => {
  const conflicts: ScheduleConflict[] = [];

  try {
    const classes = existingClasses || (await fetchClassesFirestore());
    const studentClasses = classes.filter(
      (cls) => cls.studentIds && cls.studentIds.includes(studentId),
    );

    // Obtener información del estudiante para mensajes más claros
    let studentName = 'Estudiante';
    try {
      const studentData = await getStudentByIdFirebase(studentId);
      if (studentData) {
        studentName = `${studentData.nombre} ${studentData.apellido}`.trim();
      }
    } catch (error) {
      console.warn(`No se pudo obtener información del estudiante ${studentId}:`, error);
    }

    for (const existingClass of studentClasses) {
      if (existingClass.schedule?.slots) {
        for (const existingSlot of existingClass.schedule.slots) {
          if (timeSlotsOverlap(newSlot, existingSlot)) {
            const conflictMessage = `El estudiante ${studentName} ya tiene clase "${existingClass.name}" los ${existingSlot.day} de ${existingSlot.startTime} a ${existingSlot.endTime}. Ningún alumno puede estar en más de una clase al mismo tiempo.`;

            conflicts.push({
              type: 'student',
              conflictingEntity: {
                id: existingClass.id,
                name: studentName,
                className: existingClass.name,
              },
              conflictingSlot: existingSlot,
              severity: 'error',
              message: conflictMessage,
            });
          }
        }
      }
    }
  } catch (error) {
    console.error('Error checking student conflicts:', error);
  }

  return conflicts;
};

/**
 * Verifica conflictos de aulas
 */
export const checkClassroomConflicts = async (
  newSlot: TimeSlot,
  classroom: string,
  existingClasses?: ClassData[],
): Promise<ScheduleConflict[]> => {
  const conflicts: ScheduleConflict[] = [];

  try {
    const classes = existingClasses || (await fetchClassesFirestore());
    const classroomClasses = classes.filter((cls) => cls.classroom === classroom);

    for (const existingClass of classroomClasses) {
      if (existingClass.schedule?.slots) {
        for (const existingSlot of existingClass.schedule.slots) {
          if (timeSlotsOverlap(newSlot, existingSlot)) {
            conflicts.push({
              type: 'classroom',
              conflictingEntity: {
                id: existingClass.id,
                name: classroom,
                className: existingClass.name,
              },
              conflictingSlot: existingSlot,
              severity: 'error',
              message: formatConflictMessage({
                type: 'classroom',
                conflictingEntity: {
                  id: existingClass.id,
                  name: classroom,
                  className: existingClass.name,
                },
                conflictingSlot: existingSlot,
                severity: 'error',
                message: '',
              }),
            });
          }
        }
      }
    }
  } catch (error) {
    console.error('Error checking classroom conflicts:', error);
  }

  return conflicts;
};

/**
 * Valida específicamente que ningún estudiante esté inscrito en más de una clase al mismo tiempo
 * Enfoque desde la perspectiva del alumno
 */
export const validateStudentScheduleConflicts = async (classData: {
  id?: string
  studentIds?: string[]
  schedule?: {
    slots: TimeSlot[]
  }
}): Promise<{
  hasConflicts: boolean
  conflictsByStudent: Map<string, ScheduleConflict[]>
  summary: string[]
}> => {
  const conflictsByStudent = new Map<string, ScheduleConflict[]>();
  const summary: string[] = [];

  if (!classData.schedule?.slots || !classData.studentIds || classData.studentIds.length === 0) {
    return { hasConflicts: false, conflictsByStudent, summary };
  }

  try {
    // Obtener todas las clases existentes
    const allClasses = await fetchClassesFirestore();
    const otherClasses = allClasses.filter((cls) => cls.id !== classData.id);

    // Validar cada estudiante individualmente
    for (const studentId of classData.studentIds) {
      const studentConflicts: ScheduleConflict[] = [];

      // Obtener información del estudiante
      let studentName = 'Estudiante';
      try {
        const studentData = await getStudentByIdFirebase(studentId);
        if (studentData) {
          studentName = `${studentData.nombre} ${studentData.apellido}`.trim();
        }
      } catch (error) {
        console.warn(`No se pudo obtener información del estudiante ${studentId}:`, error);
      }

      // Verificar cada slot de la nueva clase contra las clases existentes del estudiante
      for (const newSlot of classData.schedule.slots) {
        const conflicts = await checkStudentConflicts(newSlot, studentId, otherClasses);
        studentConflicts.push(...conflicts);
      }

      if (studentConflicts.length > 0) {
        conflictsByStudent.set(studentId, studentConflicts);
        summary.push(`${studentName}: ${studentConflicts.length} conflicto(s) de horario`);
      }
    }

    return {
      hasConflicts: conflictsByStudent.size > 0,
      conflictsByStudent,
      summary,
    };
  } catch (error) {
    console.error('Error validating student schedule conflicts:', error);
    return { hasConflicts: false, conflictsByStudent, summary };
  }
};

/**
 * Obtiene un resumen de todas las clases de un estudiante para análisis de horarios
 */
export const getStudentScheduleSummary = async (
  studentId: string,
): Promise<{
  studentName: string
  classes: Array<{
    classId: string
    className: string
    schedule: TimeSlot[]
  }>
  totalHours: number
}> => {
  try {
    // Obtener información del estudiante
    let studentName = 'Estudiante';
    const studentData = await getStudentByIdFirebase(studentId);
    if (studentData) {
      studentName = `${studentData.nombre} ${studentData.apellido}`.trim();
    }

    // Obtener todas las clases del estudiante
    const allClasses = await fetchClassesFirestore();
    const studentClasses = allClasses.filter(
      (cls) => cls.studentIds && cls.studentIds.includes(studentId),
    );

    const classes = studentClasses.map((cls) => ({
      classId: cls.id,
      className: cls.name,
      schedule: cls.schedule?.slots || [],
    }));

    // Calcular horas totales
    let totalMinutes = 0;
    classes.forEach((cls) => {
      cls.schedule.forEach((slot) => {
        const startMinutes = timeToMinutes(slot.startTime);
        const endMinutes = timeToMinutes(slot.endTime);
        totalMinutes += endMinutes - startMinutes;
      });
    });

    return {
      studentName,
      classes,
      totalHours: totalMinutes / 60,
    };
  } catch (error) {
    console.error('Error getting student schedule summary:', error);
    return {
      studentName: 'Estudiante',
      classes: [],
      totalHours: 0,
    };
  }
};

/**
 * ===== GESTIÓN DE MAESTROS ENCARGADOS Y ASISTENTES =====
 */

/**
 * Obtiene todas las clases donde un maestro es encargado o asistente
 */
export const getTeacherClasses = async (teacherId: string): Promise<TeacherClassView[]> => {
  try {
    const classesCollection = collection(db, CLASSES_COLLECTION);

    // Buscar clases donde el maestro es el encargado principal (teacherId)
    const leadQuery = query(classesCollection, where('teacherId', '==', teacherId));
    const leadSnapshot = await getDocs(leadQuery);

    // Buscar clases donde el maestro es asistente
    const allClassesSnapshot = await getDocs(classesCollection);
    const allClasses = allClassesSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as ClassData[];

    const assistantClasses = allClasses.filter((classData) =>
      classData.teachers?.some(
        (teacher) => teacher.teacherId === teacherId && teacher.role === TeacherRole.ASSISTANT,
      ),
    );

    // Combinar clases donde es encargado y asistente
    const leadClasses = leadSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as ClassData[];

    // Procesar clases para incluir información específica del maestro
    const processedClasses: TeacherClassView[] = [];

    // Procesar clases donde es encargado
    for (const classData of leadClasses) {
      const leadTeacher = await getTeacherInfo(classData.teacherId!);
      const assistantTeachers = await getAssistantTeachersInfo(classData.teachers || []);

      processedClasses.push({
        ...classData,
        myRole: TeacherRole.LEAD,
        myPermissions: {
          canTakeAttendance: true,
          canAddObservations: true,
          canViewAttendanceHistory: true,
          canEditClass: true,
          canManageTeachers: true,
        },
        leadTeacher,
        assistantTeachers,
      });
    }

    // Procesar clases donde es asistente
    for (const classData of assistantClasses) {
      const myTeacherData = classData.teachers?.find((t) => t.teacherId === teacherId);
      const leadTeacher = await getTeacherInfo(classData.teacherId!);
      const assistantTeachers = await getAssistantTeachersInfo(classData.teachers || []);

      processedClasses.push({
        ...classData,
        myRole: TeacherRole.ASSISTANT,
        myPermissions: myTeacherData?.permissions,
        leadTeacher,
        assistantTeachers,
      });
    }

    return processedClasses;
  } catch (error) {
    console.error('Error fetching teacher classes:', error);
    throw error;
  }
};

/**
 * Añade un maestro como asistente a una clase (usado internamente cuando se acepta invitación)
 */
export const addAssistantTeacherToClass = async (
  inviteData: InviteAssistantData,
): Promise<void> => {
  try {
    console.log('🔍 [addAssistantTeacherToClass] inviteData:', inviteData);

    const classRef = doc(db, CLASSES_COLLECTION, inviteData.classId);
    console.log('🔍 [addAssistantTeacherToClass] Buscando clase con ID:', inviteData.classId);

    const classDoc = await getDoc(classRef);
    if (!classDoc.exists()) {
      console.error('❌ [addAssistantTeacherToClass] Clase no encontrada:', inviteData.classId);
      // Listar todas las clases disponibles para debug
      const classesSnapshot = await getDocs(collection(db, CLASSES_COLLECTION));
      console.log('📋 [addAssistantTeacherToClass] Clases disponibles:');
      classesSnapshot.docs.forEach((doc) => {
        console.log(`  - ID: ${doc.id}, Name: ${doc.data().name}`);
      });
      throw new Error('Clase no encontrada');
    }

    console.log('✅ [addAssistantTeacherToClass] Clase encontrada:', classDoc.data().name);

    const classData = classDoc.data() as ClassData;

    // Verificar que el maestro no esté ya asignado
    const existingTeacher = classData.teachers?.find((t) => t.teacherId === inviteData.teacherId);
    if (existingTeacher) {
      throw new Error('El maestro ya está asignado a esta clase');
    }
    // Crear nuevo registro de maestro asistente
    const newAssistant: ClassTeacher = {
      teacherId: inviteData.teacherId,
      role: TeacherRole.ASSISTANT,
      assignedAt: new Date(),
      assignedBy: inviteData.invitedBy,
      permissions: {
        ...inviteData.permissions,
        canEditClass: false, // Los asistentes no pueden editar clases
        canManageTeachers: false, // Los asistentes no pueden gestionar maestros
      },
    };

    // Actualizar la clase con el nuevo asistente
    const updatedTeachers = [...(classData.teachers || []), newAssistant];

    await updateDoc(classRef, {
      teachers: updatedTeachers,
      updatedAt: new Date(),
    });

    console.log(`Maestro asistente ${inviteData.teacherId} añadido a clase ${inviteData.classId}`);
  } catch (error) {
    console.error('Error adding assistant teacher to class:', error);
    throw error;
  }
};

/**
 * Invita un maestro como asistente a una clase (crea una notificación de invitación)
 */
export const inviteAssistantTeacher = async (inviteData: InviteAssistantData): Promise<void> => {
  try {
    const classRef = doc(db, CLASSES_COLLECTION, inviteData.classId);
    const classDoc = await getDoc(classRef);

    if (!classDoc.exists()) {
      throw new Error('Clase no encontrada');
    }

    const classData = classDoc.data() as ClassData;
    // Verificar que el usuario que invita es el maestro encargado
    if (classData.teacherId !== inviteData.invitedBy) {
      throw new Error('Solo el maestro encargado puede invitar asistentes');
    }

    // Verificar que el maestro no esté ya asignado
    // Verificar en el teacherId principal (maestro encargado)
    if (classData.teacherId === inviteData.teacherId) {
      throw new Error('El maestro ya está asignado como maestro encargado de esta clase');
    }

    // Verificar en la lista de maestros asistentes
    const existingTeacher = classData.teachers?.find((t) => t.teacherId === inviteData.teacherId);
    if (existingTeacher) {
      throw new Error('El maestro ya está asignado como asistente en esta clase');
    }

    // Obtener información del maestro que invita y del maestro invitado
    const [inviterInfo, invitedInfo] = await Promise.all([
      getTeacherInfo(inviteData.invitedBy),
      getTeacherInfo(inviteData.teacherId),
    ]);

    // Crear notificación de invitación usando el servicio de notificaciones
    const { createClassInvitationNotification } = await import(
      '../../Teachers/services/teacherNotifications'
    );

    await createClassInvitationNotification({
      teacherId: inviteData.teacherId,
      teacherName: invitedInfo.name,
      classId: inviteData.classId,
      className: classData.name,
      fromUserId: inviteData.invitedBy,
      fromUserName: inviterInfo.name,
      permissions: inviteData.permissions,
    });

    console.log(
      `Invitación enviada a maestro ${inviteData.teacherId} para clase ${inviteData.classId}`,
    );
  } catch (error) {
    console.error('Error sending invitation to assistant teacher:', error);
    throw error;
  }
};

/**
 * Remueve un maestro asistente de una clase
 */
export const removeAssistantTeacher = async (
  classId: string,
  assistantTeacherId: string,
  removedBy: string,
): Promise<void> => {
  try {
    const classRef = doc(db, CLASSES_COLLECTION, classId);
    const classDoc = await getDoc(classRef);

    if (!classDoc.exists()) {
      throw new Error('Clase no encontrada');
    }

    const classData = classDoc.data() as ClassData;

    // Verificar que el usuario que remueve es el maestro encargado
    if (classData.teacherId !== removedBy) {
      throw new Error('Solo el maestro encargado puede remover asistentes');
    }

    // Filtrar el maestro asistente
    const updatedTeachers = (classData.teachers || []).filter(
      (teacher) =>
        !(teacher.teacherId === assistantTeacherId && teacher.role === TeacherRole.ASSISTANT),
    );

    await updateDoc(classRef, {
      teachers: updatedTeachers,
      updatedAt: new Date(),
    });

    console.log(`Maestro asistente ${assistantTeacherId} removido de clase ${classId}`);
  } catch (error) {
    console.error('Error removing assistant teacher:', error);
    throw error;
  }
};

/**
 * Actualiza los permisos de un maestro asistente
 */
export const updateAssistantPermissions = async (
  classId: string,
  assistantTeacherId: string,
  newPermissions: ClassTeacher['permissions'],
  updatedBy: string,
): Promise<void> => {
  try {
    const classRef = doc(db, CLASSES_COLLECTION, classId);
    const classDoc = await getDoc(classRef);

    if (!classDoc.exists()) {
      throw new Error('Clase no encontrada');
    }

    const classData = classDoc.data() as ClassData;

    // Verificar que el usuario que actualiza es el maestro encargado
    if (classData.teacherId !== updatedBy) {
      throw new Error('Solo el maestro encargado puede actualizar permisos');
    }

    // Actualizar permisos del maestro asistente
    const updatedTeachers = (classData.teachers || []).map((teacher) => {
      if (teacher.teacherId === assistantTeacherId && teacher.role === TeacherRole.ASSISTANT) {
        return {
          ...teacher,
          permissions: newPermissions,
        };
      }
      return teacher;
    });

    await updateDoc(classRef, {
      teachers: updatedTeachers,
      updatedAt: new Date(),
    });

    console.log(
      `Permisos actualizados para maestro asistente ${assistantTeacherId} en clase ${classId}`,
    );
  } catch (error) {
    console.error('Error updating assistant permissions:', error);
    throw error;
  }
};

/**
 * Verifica si un maestro tiene permisos específicos en una clase
 */
export const checkTeacherPermission = async (
  classId: string,
  teacherId: string,
  permission: keyof ClassTeacher['permissions'],
): Promise<boolean> => {
  try {
    const classRef = doc(db, CLASSES_COLLECTION, classId);
    const classDoc = await getDoc(classRef);

    if (!classDoc.exists()) {
      return false;
    }

    const classData = classDoc.data() as ClassData;

    // Si es el maestro encargado, tiene todos los permisos
    if (classData.teacherId === teacherId) {
      return true;
    }

    // Buscar en maestros asistentes
    const assistantTeacher = classData.teachers?.find(
      (teacher) => teacher.teacherId === teacherId && teacher.role === TeacherRole.ASSISTANT,
    );

    return assistantTeacher?.permissions[permission] || false;
  } catch (error) {
    console.error('Error checking teacher permission:', error);
    return false;
  }
};

/**
 * Verifica si un maestro puede registrar asistencia para una clase específica
 */
export const canTeacherRecordAttendance = async (
  classId: string,
  teacherId: string,
): Promise<boolean> => {
  try {
    // Verificar permisos para registro de asistencia
    return await checkTeacherPermission(classId, teacherId, 'canTakeAttendance');
  } catch (error) {
    console.error('Error checking attendance permission:', error);
    return false;
  }
};

/**
 * Verifica si un maestro puede agregar observaciones a una clase específica
 */
export const canTeacherAddObservations = async (
  classId: string,
  teacherId: string,
): Promise<boolean> => {
  try {
    // Verificar permisos para agregar observaciones
    return await checkTeacherPermission(classId, teacherId, 'canAddObservations');
  } catch (error) {
    console.error('Error checking observation permission:', error);
    return false;
  }
};

/**
 * Verifica si un maestro puede ver el historial de asistencia de una clase específica
 */
export const canTeacherViewAttendanceHistory = async (
  classId: string,
  teacherId: string,
): Promise<boolean> => {
  try {
    // Verificar permisos para ver historial
    return await checkTeacherPermission(classId, teacherId, 'canViewAttendanceHistory');
  } catch (error) {
    console.error('Error checking history viewing permission:', error);
    return false;
  }
};

/**
 * Añade un estudiante a una clase
 */
export const addStudentToClass = async (classId: string, studentId: string): Promise<void> => {
  try {
    console.log('[addStudentToClass] Adding student', studentId, 'to class', classId);

    // Obtener la clase actual
    const classRef = doc(db, CLASSES_COLLECTION, classId);
    const classDoc = await getDoc(classRef);

    if (!classDoc.exists()) {
      throw new Error('La clase no existe');
    }

    const classData = classDoc.data() as ClassData;
    const currentStudents = classData.studentIds || [];

    // Verificar si el estudiante ya está en la clase
    if (currentStudents.includes(studentId)) {
      throw new Error('El estudiante ya está inscrito en esta clase');
    }

    // Añadir el estudiante a la lista
    const updatedStudents = [...currentStudents, studentId];

    // Actualizar la clase en Firestore
    await updateDoc(classRef, {
      studentIds: updatedStudents,
      updatedAt: new Date(),
    });

    console.log('[addStudentToClass] Student successfully added to class');
  } catch (error) {
    console.error('[addStudentToClass] Error adding student to class:', error);
    throw error;
  }
};

/**
 * Remueve un estudiante de una clase
 */
export const removeStudentFromClass = async (classId: string, studentId: string): Promise<void> => {
  try {
    console.log('[removeStudentFromClass] Removing student', studentId, 'from class', classId);

    // Obtener la clase actual
    const classRef = doc(db, CLASSES_COLLECTION, classId);
    const classDoc = await getDoc(classRef);

    if (!classDoc.exists()) {
      throw new Error('La clase no existe');
    }

    const classData = classDoc.data() as ClassData;
    const currentStudents = classData.studentIds || [];

    // Verificar si el estudiante está en la clase
    if (!currentStudents.includes(studentId)) {
      throw new Error('El estudiante no está inscrito en esta clase');
    }

    // Remover el estudiante de la lista
    const updatedStudents = currentStudents.filter((id) => id !== studentId);

    // Actualizar la clase en Firestore
    await updateDoc(classRef, {
      studentIds: updatedStudents,
      updatedAt: new Date(),
    });

    console.log('[removeStudentFromClass] Student successfully removed from class');
  } catch (error) {
    console.error('[removeStudentFromClass] Error removing student from class:', error);
    throw error;
  }
};

/**
 * Funciones auxiliares
 */

/**
 * Obtiene información básica de un maestro
 */
const getTeacherInfo = async (teacherId: string) => {
  try {
    const teacherRef = doc(db, USERS_COLLECTION, teacherId);
    const teacherDoc = await getDoc(teacherRef);

    if (teacherDoc.exists()) {
      const data = teacherDoc.data();
      return {
        id: teacherId,
        name: data.name || data.displayName || 'Maestro',
        email: data.email || '',
      };
    }

    return {
      id: teacherId,
      name: 'Maestro',
      email: '',
    };
  } catch (error) {
    console.error('Error fetching teacher info:', error);
    return {
      id: teacherId,
      name: 'Maestro',
      email: '',
    };
  }
};

/**
 * Obtiene información de todos los maestros asistentes
 */
const getAssistantTeachersInfo = async (teachers: ClassTeacher[]) => {
  const assistants = teachers.filter((t) => t.role === TeacherRole.ASSISTANT);
  const assistantInfo = [];

  for (const assistant of assistants) {
    const info = await getTeacherInfo(assistant.teacherId);
    assistantInfo.push({
      ...info,
      assignedAt: assistant.assignedAt,
    });
  }

  return assistantInfo;
};
