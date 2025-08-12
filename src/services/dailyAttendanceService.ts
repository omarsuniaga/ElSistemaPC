// Servicio OPTIMIZADO para el Reporte de Asistencia Diaria
// Conecta con Firebase para obtener datos reales de asistencia con máximo rendimiento

import { db } from '../firebase';
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  doc, 
  getDoc, 
  limit,
  orderBy,
  startAt,
  endAt,
  Timestamp 
} from 'firebase/firestore';

// Cache global para optimizar consultas repetidas
const cache = {
  students: new Map<string, StudentInfo>(),
  classes: new Map<string, ClassInfo>(),
  teachers: new Map<string, string>(),
  lastClearTime: Date.now()
};

// Limpiar cache cada 30 minutos para evitar datos obsoletos
const CACHE_TTL = 30 * 60 * 1000; // 30 minutos

const clearCacheIfNeeded = () => {
  if (Date.now() - cache.lastClearTime > CACHE_TTL) {
    cache.students.clear();
    cache.classes.clear();
    cache.teachers.clear();
    cache.lastClearTime = Date.now();
    console.log('🧹 Cache limpiado por TTL');
  }
};

// Función de diagnóstico para probar la conectividad
export const testFirebaseConnection = async (): Promise<{
  success: boolean
  error?: string
  details: any
}> => {
  try {
    console.log('🔧 [Test] Iniciando prueba de conectividad Firebase...');
    
    // Verificar si db está inicializado
    if (!db) {
      return {
        success: false,
        error: 'Base de datos no inicializada',
        details: { db: null }
      };
    }

    // Hacer una consulta simple para verificar conectividad
    const testCollection = collection(db, 'ASISTENCIAS');
    const testQuery = query(testCollection, limit(1));
    
    console.log('🔧 [Test] Ejecutando consulta de prueba...');
    const snapshot = await getDocs(testQuery);
    
    console.log('🔧 [Test] Consulta exitosa:', {
      size: snapshot.size,
      empty: snapshot.empty
    });

    return {
      success: true,
      details: {
        db: !!db,
        collectionExists: true,
        documentCount: snapshot.size,
        empty: snapshot.empty
      }
    };
  } catch (error) {
    console.error('🔧 [Test] Error en prueba de conectividad:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido',
      details: {
        db: !!db,
        error: error
      }
    };
  }
};

// Interfaces
interface AttendanceRecord {
  id: string
  studentId: string
  studentName: string
  className: string
  teacherName: string
  status: 'Presente' | 'Ausente' | 'Tardanza' | 'Justificado'
  time: string
  observations: string
  reason?: string
}

interface AttendanceSummary {
  total: number
  presentes: number
  ausentes: number
  tarde: number
  justificados: number
}

interface StudentInfo {
  id: string
  nombre: string
  apellido: string
  tlf_madre?: string
  tlf_padre?: string
}

interface ClassInfo {
  id: string
  name: string
  teacherId: string
  teacherName?: string
}

// Colecciones Firebase
const ATTENDANCE_COLLECTION = 'ASISTENCIAS';
const STUDENTS_COLLECTION = 'ALUMNOS';
const CLASSES_COLLECTION = 'CLASES';
const TEACHERS_COLLECTION = 'users';

/**
 * FUNCIONES OPTIMIZADAS CON CACHE Y BATCH PROCESSING
 */

/**
 * Obtiene información de un estudiante con cache optimizado
 */
const getStudentInfo = async (studentId: string): Promise<StudentInfo | null> => {
  try {
    // Limpiar cache si es necesario
    clearCacheIfNeeded();
    
    // Verificar cache primero
    if (cache.students.has(studentId)) {
      return cache.students.get(studentId) || null;
    }

    console.log(`👤 [Cache Miss] Consultando estudiante: ${studentId}`);
    const studentDoc = await getDoc(doc(db, STUDENTS_COLLECTION, studentId));
    
    if (studentDoc.exists()) {
      const data = studentDoc.data();
      const studentInfo: StudentInfo = {
        id: studentId,
        nombre: data.nombre || '',
        apellido: data.apellido || '',
        tlf_madre: data.tlf_madre || '',
        tlf_padre: data.tlf_padre || '',
      };
      
      // Guardar en cache
      cache.students.set(studentId, studentInfo);
      return studentInfo;
    }
    
    // Guardar resultado nulo en cache para evitar consultas repetidas
    cache.students.set(studentId, null as any);
    return null;
  } catch (error) {
    console.error(`❌ Error obteniendo estudiante ${studentId}:`, error);
    return null;
  }
};

/**
 * Obtiene información de una clase con cache optimizado
 */
const getClassInfo = async (classId: string): Promise<ClassInfo | null> => {
  try {
    // Limpiar cache si es necesario
    clearCacheIfNeeded();
    
    // Verificar cache primero
    if (cache.classes.has(classId)) {
      return cache.classes.get(classId) || null;
    }

    console.log(`📚 [Cache Miss] Consultando clase: ${classId}`);
    const classDoc = await getDoc(doc(db, CLASSES_COLLECTION, classId));
    
    if (classDoc.exists()) {
      const data = classDoc.data();

      // Obtener nombre del maestro con cache
      let teacherName = 'Maestro no encontrado';
      if (data.teacherId) {
        teacherName = await getTeacherName(data.teacherId);
      }

      const classInfo: ClassInfo = {
        id: classId,
        name: data.name || data.className || `Clase ${classId}`,
        teacherId: data.teacherId || '',
        teacherName,
      };
      
      // Guardar en cache
      cache.classes.set(classId, classInfo);
      return classInfo;
    }
    
    // Guardar resultado nulo en cache
    cache.classes.set(classId, null as any);
    return null;
  } catch (error) {
    console.error(`❌ Error obteniendo clase ${classId}:`, error);
    return null;
  }
};

/**
 * Obtiene nombre del maestro con cache optimizado
 */
const getTeacherName = async (teacherId: string): Promise<string> => {
  try {
    // Verificar cache primero
    if (cache.teachers.has(teacherId)) {
      return cache.teachers.get(teacherId) || 'Maestro no encontrado';
    }

    console.log(`👨‍🏫 [Cache Miss] Consultando maestro: ${teacherId}`);
    const teacherDoc = await getDoc(doc(db, TEACHERS_COLLECTION, teacherId));
    
    if (teacherDoc.exists()) {
      const teacherData = teacherDoc.data();
      const teacherName = `${teacherData.firstName || ''} ${teacherData.lastName || ''}`.trim();
      
      // Guardar en cache
      cache.teachers.set(teacherId, teacherName);
      return teacherName;
    }
    
    // Guardar resultado por defecto en cache
    const defaultName = 'Maestro no encontrado';
    cache.teachers.set(teacherId, defaultName);
    return defaultName;
  } catch (error) {
    console.warn(`⚠️ Error obteniendo maestro ${teacherId}:`, error);
    const defaultName = 'Maestro no encontrado';
    cache.teachers.set(teacherId, defaultName);
    return defaultName;
  }
};

/**
 * FUNCIÓN OPTIMIZADA: Obtiene múltiples estudiantes en una sola consulta
 */
const getMultipleStudentsInfo = async (studentIds: string[]): Promise<Map<string, StudentInfo>> => {
  const result = new Map<string, StudentInfo>();
  const missingIds: string[] = [];
  
  // Verificar cuáles no están en cache
  for (const id of studentIds) {
    if (cache.students.has(id)) {
      const student = cache.students.get(id);
      if (student) {
        result.set(id, student);
      }
    } else {
      missingIds.push(id);
    }
  }
  
  // Si todos están en cache, retornar inmediatamente
  if (missingIds.length === 0) {
    console.log(`👥 [Cache Hit] Todos los estudiantes encontrados en cache: ${studentIds.length}`);
    return result;
  }
  
  console.log(`👥 [Batch Query] Consultando ${missingIds.length} estudiantes faltantes`);
  
  // Consultar los faltantes en lotes para optimizar
  const batchSize = 10; // Firestore permite hasta 10 documentos por consulta 'in'
  
  for (let i = 0; i < missingIds.length; i += batchSize) {
    const batch = missingIds.slice(i, i + batchSize);
    
    try {
      const studentsQuery = query(
        collection(db, STUDENTS_COLLECTION),
        where('__name__', 'in', batch.map(id => doc(db, STUDENTS_COLLECTION, id)))
      );
      
      const snapshot = await getDocs(studentsQuery);
      
      snapshot.forEach(doc => {
        const data = doc.data();
        const studentInfo: StudentInfo = {
          id: doc.id,
          nombre: data.nombre || '',
          apellido: data.apellido || '',
          tlf_madre: data.tlf_madre || '',
          tlf_padre: data.tlf_padre || '',
        };
        
        result.set(doc.id, studentInfo);
        cache.students.set(doc.id, studentInfo);
      });
      
    } catch (error) {
      console.error('❌ Error en consulta batch de estudiantes:', error);
      // Continuar con el siguiente lote
    }
  }
  
  return result;
};

/**
 * FUNCIÓN OPTIMIZADA: Convierte documento de asistencia a registros individuales
 */
const processAttendanceDocument = async (attendanceDoc: any): Promise<AttendanceRecord[]> => {
  const records: AttendanceRecord[] = [];
  const data = attendanceDoc.data();

  if (!data.data) {
    console.warn('📄 Documento de asistencia sin datos:', attendanceDoc.id);
    return records;
  }

  // Obtener información de la clase una sola vez
  const classInfo = await getClassInfo(data.classId);
  const className = classInfo?.name || 'Clase desconocida';
  const teacherName = classInfo?.teacherName || 'Maestro desconocido';

  // Recopilar todos los IDs de estudiantes únicos del documento
  const allStudentIds = new Set<string>();
  
  if (data.data.presentes && Array.isArray(data.data.presentes)) {
    data.data.presentes.forEach((id: string) => allStudentIds.add(id));
  }
  
  if (data.data.ausentes && Array.isArray(data.data.ausentes)) {
    data.data.ausentes.forEach((id: string) => allStudentIds.add(id));
  }
  
  if (data.data.tarde && Array.isArray(data.data.tarde)) {
    data.data.tarde.forEach((id: string) => allStudentIds.add(id));
  }

  // Obtener información de todos los estudiantes en una sola consulta optimizada
  const studentsInfo = await getMultipleStudentsInfo(Array.from(allStudentIds));
  
  const getStudentName = (studentId: string): string => {
    const student = studentsInfo.get(studentId);
    return student ? `${student.nombre} ${student.apellido}`.trim() : `Estudiante ${studentId}`;
  };

  const baseTime = data.createdAt?.toDate?.()?.toISOString() || new Date().toISOString();

  // Procesar estudiantes presentes
  if (data.data.presentes && Array.isArray(data.data.presentes)) {
    for (const studentId of data.data.presentes) {
      records.push({
        id: `${attendanceDoc.id}_${studentId}_presente`,
        studentId,
        studentName: getStudentName(studentId),
        className,
        teacherName,
        status: 'Presente',
        time: baseTime,
        observations: '',
      });
    }
  }

  // Procesar estudiantes ausentes
  if (data.data.ausentes && Array.isArray(data.data.ausentes)) {
    for (const studentId of data.data.ausentes) {
      // Verificar si está justificado
      const justification = data.data.justificacion?.find(
        (j: any) => j.id === studentId || j.studentId === studentId,
      );

      records.push({
        id: `${attendanceDoc.id}_${studentId}_ausente`,
        studentId,
        studentName: getStudentName(studentId),
        className,
        teacherName,
        status: justification ? 'Justificado' : 'Ausente',
        time: baseTime,
        observations: justification?.reason || '',
        reason: justification?.reason,
      });
    }
  }

  // Procesar estudiantes con tardanza
  if (data.data.tarde && Array.isArray(data.data.tarde)) {
    for (const studentId of data.data.tarde) {
      // Verificar si está justificado
      const justification = data.data.justificacion?.find(
        (j: any) => j.id === studentId || j.studentId === studentId,
      );

      records.push({
        id: `${attendanceDoc.id}_${studentId}_tarde`,
        studentId,
        studentName: getStudentName(studentId),
        className,
        teacherName,
        status: justification ? 'Justificado' : 'Tardanza',
        time: baseTime,
        observations: justification?.reason || 'Llegada tarde',
        reason: justification?.reason,
      });
    }
  }

  console.log(`📄 Documento ${attendanceDoc.id} procesado: ${records.length} registros`);
  return records;
};

/**
 * FUNCIÓN PRINCIPAL OPTIMIZADA: Obtiene todos los datos de asistencia para una fecha específica
 */
export const getDailyAttendanceReport = async (
  date: string,
): Promise<{
  records: AttendanceRecord[]
  summary: AttendanceSummary
  success: boolean
  error?: string
}> => {
  try {
    console.log(`📊 [Service] INICIO - Obteniendo reporte de asistencia para ${date}`);
    const startTime = performance.now();
    
    // Limpiar cache si es necesario antes de empezar
    clearCacheIfNeeded();
    
    // Verificar si db está definido
    if (!db) {
      throw new Error('Base de datos no está inicializada');
    }

    console.log(`📊 [Service] Creando consulta optimizada para fecha: ${date}`);
    
    // CONSULTA OPTIMIZADA: Usar índices compuestos si están disponibles
    // Primero intentar con la consulta directa por fecha
    const attendanceQuery = query(
      collection(db, ATTENDANCE_COLLECTION), 
      where('fecha', '==', date)
    );
    
    console.log(`📊 [Service] Ejecutando consulta Firebase...`);
    const attendanceSnapshot = await getDocs(attendanceQuery);
    
    const queryTime = performance.now() - startTime;
    console.log(`📊 [Service] Consulta completada en ${queryTime.toFixed(2)}ms`);
    console.log(`📄 [Service] Encontrados ${attendanceSnapshot.size} documentos de asistencia`);

    if (attendanceSnapshot.empty) {
      console.log(`📄 [Service] No hay datos para la fecha ${date}, retornando datos vacíos`);
      return {
        records: [],
        summary: { total: 0, presentes: 0, ausentes: 0, tarde: 0, justificados: 0 },
        success: true,
      };
    }

    // PROCESAMIENTO OPTIMIZADO: Procesar documentos en paralelo cuando sea posible
    console.log(`📊 [Service] Iniciando procesamiento de ${attendanceSnapshot.size} documentos...`);
    const processingStartTime = performance.now();
    
    const allRecords: AttendanceRecord[] = [];
    const processPromises: Promise<AttendanceRecord[]>[] = [];

    // Procesar documentos de forma concurrente (máximo 5 a la vez para no sobrecargar)
    const concurrencyLimit = 5;
    const docs = attendanceSnapshot.docs;
    
    for (let i = 0; i < docs.length; i += concurrencyLimit) {
      const batch = docs.slice(i, i + concurrencyLimit);
      const batchPromises = batch.map(doc => 
        processAttendanceDocument(doc).catch(error => {
          console.error(`❌ [Service] Error procesando documento ${doc.id}:`, error);
          return []; // Retornar array vacío en caso de error
        })
      );
      
      const batchResults = await Promise.all(batchPromises);
      batchResults.forEach(records => allRecords.push(...records));
    }

    const processingTime = performance.now() - processingStartTime;
    console.log(`📊 [Service] Procesamiento completado en ${processingTime.toFixed(2)}ms`);

    // CÁLCULO OPTIMIZADO del resumen
    console.log(`📊 [Service] Calculando resumen de ${allRecords.length} registros...`);
    const summary: AttendanceSummary = allRecords.reduce(
      (acc, record) => {
        acc.total++;
        switch (record.status) {
          case 'Presente':
            acc.presentes++;
            break;
          case 'Ausente':
            acc.ausentes++;
            break;
          case 'Tardanza':
            acc.tarde++;
            break;
          case 'Justificado':
            acc.justificados++;
            break;
        }
        return acc;
      },
      { total: 0, presentes: 0, ausentes: 0, tarde: 0, justificados: 0 }
    );

    // ORDENAMIENTO OPTIMIZADO: Usar Intl.Collator para mejor rendimiento
    const collator = new Intl.Collator('es', { numeric: true });
    allRecords.sort((a, b) => collator.compare(a.studentName, b.studentName));

    const totalTime = performance.now() - startTime;
    console.log(`✅ [Service] COMPLETADO en ${totalTime.toFixed(2)}ms`);
    console.log('📈 [Service] Resumen final:', summary);

    return {
      records: allRecords,
      summary,
      success: true,
    };
  } catch (error) {
    console.error('❌ [Service] Error obteniendo reporte de asistencia:', error);
    return {
      records: [],
      summary: { total: 0, presentes: 0, ausentes: 0, tarde: 0, justificados: 0 },
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido',
    };
  }
};

/**
 * FUNCIONES OPTIMIZADAS PARA NOTIFICACIONES
 */

/**
 * Obtiene lista de estudiantes con tardanza para notificaciones (OPTIMIZADA)
 */
export const getLateStudentsForNotification = async (
  date: string,
): Promise<
  {
    studentId: string
    studentName: string
    className: string
    phoneNumbers: string[]
  }[]
> => {
  try {
    console.log(`📱 [Notifications] Obteniendo estudiantes tardíos para ${date}`);
    const startTime = performance.now();
    
    const report = await getDailyAttendanceReport(date);

    if (!report.success) {
      throw new Error(report.error || 'Error obteniendo datos');
    }

    const lateStudents = report.records.filter((r) => r.status === 'Tardanza');
    console.log(`📱 [Notifications] Encontrados ${lateStudents.length} estudiantes tardíos`);
    
    if (lateStudents.length === 0) {
      return [];
    }

    // Obtener información de teléfonos usando el cache optimizado
    const studentIds = lateStudents.map(r => r.studentId);
    const studentsInfo = await getMultipleStudentsInfo(studentIds);
    
    const result = lateStudents
      .map(record => {
        const studentInfo = studentsInfo.get(record.studentId);
        const phoneNumbers = [];

        if (studentInfo?.tlf_madre) phoneNumbers.push(studentInfo.tlf_madre);
        if (studentInfo?.tlf_padre) phoneNumbers.push(studentInfo.tlf_padre);

        return phoneNumbers.length > 0 ? {
          studentId: record.studentId,
          studentName: record.studentName,
          className: record.className,
          phoneNumbers,
        } : null;
      })
      .filter(Boolean) as any[];

    const totalTime = performance.now() - startTime;
    console.log(`📱 [Notifications] Tardíos procesados en ${totalTime.toFixed(2)}ms: ${result.length} con teléfonos`);
    
    return result;
  } catch (error) {
    console.error('❌ Error obteniendo estudiantes tardíos:', error);
    return [];
  }
};

/**
 * Obtiene lista de estudiantes con ausencias justificadas para notificaciones (OPTIMIZADA)
 */
export const getJustifiedAbsencesForNotification = async (
  date: string,
): Promise<
  {
    studentId: string
    studentName: string
    className: string
    reason: string
    phoneNumbers: string[]
  }[]
> => {
  try {
    console.log(`📱 [Notifications] Obteniendo ausencias justificadas para ${date}`);
    const startTime = performance.now();
    
    const report = await getDailyAttendanceReport(date);

    if (!report.success) {
      throw new Error(report.error || 'Error obteniendo datos');
    }

    const justifiedStudents = report.records.filter((r) => r.status === 'Justificado');
    console.log(`📱 [Notifications] Encontradas ${justifiedStudents.length} ausencias justificadas`);
    
    if (justifiedStudents.length === 0) {
      return [];
    }

    // Obtener información de teléfonos usando el cache optimizado
    const studentIds = justifiedStudents.map(r => r.studentId);
    const studentsInfo = await getMultipleStudentsInfo(studentIds);
    
    const result = justifiedStudents
      .map(record => {
        const studentInfo = studentsInfo.get(record.studentId);
        const phoneNumbers = [];

        if (studentInfo?.tlf_madre) phoneNumbers.push(studentInfo.tlf_madre);
        if (studentInfo?.tlf_padre) phoneNumbers.push(studentInfo.tlf_padre);

        return phoneNumbers.length > 0 ? {
          studentId: record.studentId,
          studentName: record.studentName,
          className: record.className,
          reason: record.reason || 'Sin motivo especificado',
          phoneNumbers,
        } : null;
      })
      .filter(Boolean) as any[];

    const totalTime = performance.now() - startTime;
    console.log(`📱 [Notifications] Justificadas procesadas en ${totalTime.toFixed(2)}ms: ${result.length} con teléfonos`);
    
    return result;
  } catch (error) {
    console.error('❌ Error obteniendo ausencias justificadas:', error);
    return [];
  }
};

/**
 * Obtiene lista de estudiantes con ausencias injustificadas para notificaciones (OPTIMIZADA)
 */
export const getUnexcusedAbsencesForNotification = async (
  date: string,
): Promise<
  {
    studentId: string
    studentName: string
    className: string
    phoneNumbers: string[]
  }[]
> => {
  try {
    console.log(`📱 [Notifications] Obteniendo ausencias injustificadas para ${date}`);
    const startTime = performance.now();
    
    const report = await getDailyAttendanceReport(date);

    if (!report.success) {
      throw new Error(report.error || 'Error obteniendo datos');
    }

    const absentStudents = report.records.filter((r) => r.status === 'Ausente');
    console.log(`📱 [Notifications] Encontradas ${absentStudents.length} ausencias injustificadas`);
    
    if (absentStudents.length === 0) {
      return [];
    }

    // Obtener información de teléfonos usando el cache optimizado
    const studentIds = absentStudents.map(r => r.studentId);
    const studentsInfo = await getMultipleStudentsInfo(studentIds);
    
    const result = absentStudents
      .map(record => {
        const studentInfo = studentsInfo.get(record.studentId);
        const phoneNumbers = [];

        if (studentInfo?.tlf_madre) phoneNumbers.push(studentInfo.tlf_madre);
        if (studentInfo?.tlf_padre) phoneNumbers.push(studentInfo.tlf_padre);

        return phoneNumbers.length > 0 ? {
          studentId: record.studentId,
          studentName: record.studentName,
          className: record.className,
          phoneNumbers,
        } : null;
      })
      .filter(Boolean) as any[];

    const totalTime = performance.now() - startTime;
    console.log(`📱 [Notifications] Injustificadas procesadas en ${totalTime.toFixed(2)}ms: ${result.length} con teléfonos`);
    
    return result;
  } catch (error) {
    console.error('❌ Error obteniendo ausencias injustificadas:', error);
    return [];
  }
};

/**
 * FUNCIÓN ADICIONAL: Limpia manualmente el cache (útil para debugging)
 */
export const clearCache = (): void => {
  cache.students.clear();
  cache.classes.clear();
  cache.teachers.clear();
  cache.lastClearTime = Date.now();
  console.log('🧹 Cache limpiado manualmente');
};

/**
 * FUNCIÓN ADICIONAL: Obtiene estadísticas del cache
 */
export const getCacheStats = () => {
  return {
    students: cache.students.size,
    classes: cache.classes.size,
    teachers: cache.teachers.size,
    lastClearTime: new Date(cache.lastClearTime).toISOString(),
    cacheAge: Date.now() - cache.lastClearTime,
  };
};

export default {
  getDailyAttendanceReport,
  getLateStudentsForNotification,
  getJustifiedAbsencesForNotification,
  getUnexcusedAbsencesForNotification,
  testFirebaseConnection,
  clearCache,
  getCacheStats,
};
