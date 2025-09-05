import { collection, getDocs, query, where, orderBy } from 'firebase/firestore'
import { db } from '../../../firebase'
import { useClassesStore } from '../../Classes/store/classes'

export interface StudentAttendanceRecord {
  id: string
  fecha: string
  classId: string
  className: string
  status: 'Presente' | 'Ausente' | 'Tardanza' | 'Justificado'
  teacherId?: string
  createdAt: Date
  Asistencia: boolean
  Justificada: boolean
  Tardanza: boolean
  Fecha: Date
}

export interface AttendanceMetrics {
  records: StudentAttendanceRecord[]
  summary: {
    total: number
    present: number
    absent: number
    justified: number
    late: number
    attendanceRate: number
  }
  classification: string
  classPerformance: Array<{
    classId: string
    className: string
    total: number
    present: number
    attendanceRate: number
  }>
  recentRecords: StudentAttendanceRecord[]
}

/**
 * Busca todas las asistencias de un estudiante específico en la colección ASISTENCIAS
 */
export async function getStudentAttendanceFromFirebase(
  studentId: string, 
  dateRange?: { start: string; end: string }
): Promise<StudentAttendanceRecord[]> {
  try {
    console.log('🔍 Buscando asistencias para studentId:', studentId)
    console.log('📅 Rango de fechas:', dateRange)

    // Crear query base
    let attendanceQuery = query(
      collection(db, 'ASISTENCIAS'),
      orderBy('fecha', 'desc')
    )

    // Agregar filtro de fecha si se proporciona
    if (dateRange) {
      attendanceQuery = query(
        collection(db, 'ASISTENCIAS'),
        where('fecha', '>=', dateRange.start),
        where('fecha', '<=', dateRange.end),
        orderBy('fecha', 'desc')
      )
    }

    const querySnapshot = await getDocs(attendanceQuery)
    const classesStore = useClassesStore()
    
    // Asegurar que las clases estén cargadas
    if (classesStore.classes.length === 0) {
      await classesStore.fetchClasses()
    }

    const studentRecords: StudentAttendanceRecord[] = []

    console.log('📄 Procesando', querySnapshot.docs.length, 'documentos de asistencia')

    querySnapshot.docs.forEach((doc) => {
      const data = doc.data()
      const docId = doc.id
      
      // Buscar el studentId en los diferentes arrays
      let status: 'Presente' | 'Ausente' | 'Tardanza' | 'Justificado' | null = null
      
      // Verificar en presentes
      if (data.data?.presentes && Array.isArray(data.data.presentes)) {
        if (data.data.presentes.includes(studentId)) {
          status = 'Presente'
        }
      }
      
      // Verificar en ausentes
      if (!status && data.data?.ausentes && Array.isArray(data.data.ausentes)) {
        if (data.data.ausentes.includes(studentId)) {
          status = 'Ausente'
        }
      }
      
      // Verificar en tarde
      if (!status && data.data?.tarde && Array.isArray(data.data.tarde)) {
        if (data.data.tarde.includes(studentId)) {
          status = 'Tardanza'
        }
      }
      
      // Verificar en justificaciones
      if (!status && data.data?.justificacion && Array.isArray(data.data.justificacion)) {
        const isJustified = data.data.justificacion.some((j: any) => 
          j.studentId === studentId || j.id === studentId
        )
        if (isJustified) {
          status = 'Justificado'
        }
      }

      // Si el estudiante fue encontrado en este documento
      if (status) {
        // Buscar información de la clase
        const classInfo = classesStore.classes.find(c => c.id === data.classId)
        const className = classInfo?.name || data.className || `Clase ${data.classId?.slice(-6) || 'Desconocida'}`
        
        const record: StudentAttendanceRecord = {
          id: docId,
          fecha: data.fecha,
          classId: data.classId,
          className,
          status,
          teacherId: data.teacherId,
          createdAt: data.createdAt?.toDate() || new Date(),
          // Campos de compatibilidad con el formato anterior
          Asistencia: status === 'Presente',
          Justificada: status === 'Justificado',
          Tardanza: status === 'Tardanza',
          Fecha: new Date(data.fecha)
        }

        studentRecords.push(record)
        
        console.log('✅ Registro encontrado:', {
          fecha: data.fecha,
          clase: className,
          status,
          classId: data.classId
        })
      }
    })

    console.log('🎯 Total de registros encontrados:', studentRecords.length)
    
    // Ordenar por fecha descendente
    return studentRecords.sort((a, b) => 
      new Date(b.fecha).getTime() - new Date(a.fecha).getTime()
    )

  } catch (error) {
    console.error('❌ Error obteniendo asistencias del estudiante:', error)
    throw error
  }
}

/**
 * Calcula métricas de asistencia basadas en los registros
 */
export function calculateAttendanceMetrics(records: StudentAttendanceRecord[]): AttendanceMetrics {
  if (!records || records.length === 0) {
    return {
      records: [],
      summary: {
        total: 0,
        present: 0,
        absent: 0,
        justified: 0,
        late: 0,
        attendanceRate: 0,
      },
      classification: 'Sin datos',
      classPerformance: [],
      recentRecords: [],
    }
  }

  const summary = {
    total: records.length,
    present: records.filter(r => r.status === 'Presente').length,
    absent: records.filter(r => r.status === 'Ausente').length,
    justified: records.filter(r => r.status === 'Justificado').length,
    late: records.filter(r => r.status === 'Tardanza').length,
    attendanceRate: 0
  }

  // Calcular tasa de asistencia (Presente + Justificado se consideran "asistencia")
  const effectiveAttendance = summary.present + summary.justified
  summary.attendanceRate = summary.total > 0 
    ? Math.round((effectiveAttendance / summary.total) * 100) 
    : 0

  // Clasificación basada en la tasa de asistencia
  let classification = 'Sin datos'
  if (summary.attendanceRate >= 90) classification = 'Excelente'
  else if (summary.attendanceRate >= 80) classification = 'Bueno'
  else if (summary.attendanceRate >= 70) classification = 'Regular'
  else if (summary.attendanceRate > 0) classification = 'Deficiente'

  // Performance por clase
  const classGroups = records.reduce((acc: any, record) => {
    const classId = record.classId || 'sin-clase'
    if (!acc[classId]) {
      acc[classId] = {
        classId,
        className: record.className || 'Clase sin nombre',
        total: 0,
        present: 0,
      }
    }
    acc[classId].total++
    if (record.status === 'Presente' || record.status === 'Justificado') {
      acc[classId].present++
    }
    return acc
  }, {})

  const classPerformance = Object.values(classGroups).map((classData: any) => ({
    ...classData,
    attendanceRate: Math.round((classData.present / classData.total) * 100),
  })).sort((a: any, b: any) => b.attendanceRate - a.attendanceRate)

  // Registros recientes (últimos 10)
  const recentRecords = records
    .sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime())
    .slice(0, 10)

  return {
    records,
    summary,
    classification,
    classPerformance,
    recentRecords,
  }
}

/**
 * Función principal que combina búsqueda y cálculo de métricas
 */
export async function getStudentAttendanceMetrics(
  studentId: string, 
  dateRange?: { start: string; end: string }
): Promise<AttendanceMetrics> {
  try {
    const records = await getStudentAttendanceFromFirebase(studentId, dateRange)
    return calculateAttendanceMetrics(records)
  } catch (error) {
    console.error('❌ Error obteniendo métricas de asistencia:', error)
    throw error
  }
}