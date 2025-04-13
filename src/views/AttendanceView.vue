<script setup lang="ts">
// Augment the Window interface for jsPDF and jspdf (if loaded via CDN)
declare global {
  interface Window {
    jsPDF: any; // You might want to install @types/jspdf for better typing
    jspdf: any; // For jspdf-autotable plugin
  }
}

import '@vuepic/vue-datepicker/dist/main.css'
import { ref, computed, onMounted, watch } from 'vue'
import { 
  parseISO, 
  format, 
} from 'date-fns'
import { es } from 'date-fns/locale'

// Componentes importados
import AttendanceHeader from '../modulos/Attendance/components/AttendanceHeader.vue'
import AttendanceList from '../modulos/Attendance/components/AttendanceList.vue'
import AttendanceReportModal from '../modulos/Attendance/components/AttendanceReportModal.vue'
import AttendanceObservation from '../modulos/Attendance/components/AttendanceObservation.vue'
import AttendanceAnalytics from '../modulos/Attendance/components/AttendanceAnalytics.vue'
import AttendanceTrends from '../modulos/Attendance/components/AttendanceTrends.vue'
import AttendanceExportModal from '../modulos/Attendance/components/AttendanceExportModal.vue'
import Calendar from '../components/Calendar.vue'
import DateClassSelector from '../modulos/Classes/components/DateClassSelector.vue'
import JustifiedAbsenceModal from '../components/JustifiedAbsenceModal.vue'
import { CalendarDaysIcon } from '@heroicons/vue/24/outline'
import EmergencyClassModal from '../modulos/Attendance/components/EmergencyClassModal.vue'
import type { Student } from '../modulos/Students/types/student'
import { generateAttendancePDF } from '../utils/pdfExport' 
import { sendWebhook, sendToMake } from '../utils/webhook'
import { useConfigStore } from '../stores/config'

// Router
import { useRouter, useRoute } from 'vue-router'
const router = useRouter()
const route = useRoute()

// Stores
import { useAttendanceStore } from '../modulos/Attendance/store/attendance'
import { useStudentsStore } from '../modulos/Students/store/students'
import { useClassesStore } from '../modulos/Classes/store/classes'
import { useEmergencyClassStore } from '../modulos/Attendance/store/emergencyClass'
import { getCurrentDate } from '../utils/dateUtils'
import type { SelectedStudent } from '../modulos/Students/types/student'
import type { AttendanceFiltersType } from '../modulos/Attendance/types/attendance'
// Agregar importación del store de auth
import { useAuthStore } from '../stores/auth'

// Agregar esto después de las otras declaraciones de stores
const authStore = useAuthStore()
const configStore = useConfigStore()

// Define an interface for the attendance records structure
interface AttendanceRecord {
  [studentId: string]: 'Presente' | 'Ausente' | 'Tardanza' | 'Justificado' | string;
}

  // Modificar la función de verificación para fechas disponibles
const availableClassDates = computed(() => {
  if (!selectedClass.value) return []
  
  // Obtener el ID del maestro actual
  const currentTeacherId = authStore.user?.uid
  
  // Solo obtener días programados para clases
  const scheduledDays = attendanceStore.getClassScheduleDays(selectedClass.value)
  
  // Filtrar días por maestro actual
  return scheduledDays.filter(day => {
    const classesForDay = classesStore.getClassesByDayAndTeacherId(day, currentTeacherId || '')
    return classesForDay && classesForDay.length > 0
  })
})
// Props para recibir fecha y clase desde la URL
const props = defineProps({
  date: String,
  classId: String
})

// Estado global (stores)
const attendanceStore = useAttendanceStore()
const studentsStore = useStudentsStore()
const classesStore = useClassesStore()
const emergencyClassStore = useEmergencyClassStore()

// Estados de vista y UI
const filteredStudents = ref<any[]>([])
const view = ref<'calendar' | 'class-select' | 'attendance-form'>('calendar')
const selectedDate = ref(getCurrentDate())
const currentMonth = ref(new Date())
const selectedClass = ref('')
// Utilizamos computed para derivar el nombre de la clase desde el store
const selectedClassName = computed(() => {
  const cls = classesStore.classes.find(c => c.id === selectedClass.value || c.name === selectedClass.value)
  return cls ? cls.name : selectedClass.value
})
const isLoading = ref(true)
const error = ref<string | null>(null)
const loadingMessage = ref<string>('')

// Referencia para el correo del destinatario
const recipientEmail = ref(authStore.user?.email || '')

// Estados para modales y mensajes
const showAnalytics = ref(false)
const showTrends = ref(false)
const showReportModal = ref(false)
const showExportModal = ref(false)
const showObservationsModal = ref(false)
const selectedStudentForObs = ref<SelectedStudent | null>(null)
const showJustifiedAbsenceModal = ref(false)
const selectedStudentForJustification = ref<SelectedStudent | null>(null)
const showCalendarModal = ref(false)
const showEmergencyClassModal = ref(false)
const warningMessage = ref('')
const errorMessage = ref('')

// Report filters
const reportFilters = ref<AttendanceFiltersType>({
  instrument: '',
  level: '',
  teacherId: '',
  startDate: '', // Add default value
  endDate: ''    // Add default value
})

// Control para evitar bucles reactivos
const isUpdating = ref(false)

// Toast (mensajes emergentes)
const showMessage = ref(false)
const message = ref('')
const messageType = ref<'success' | 'error'>('success')
const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
  message.value = msg
  messageType.value = type
  showMessage.value = true
  setTimeout(() => { showMessage.value = false }, 3000)
}

// Este computed ya está definido arriba con filtrado por maestro

// Computed para contar observaciones (si existen)
const getObservationsCount = computed(() => {
  return attendanceStore.currentAttendanceDoc?.data.observations ? 1 : 0
})

// Computed para mostrar la fecha seleccionada formateada en el título
const formattedSelectedDate = computed(() => {
  return format(parseISO(selectedDate.value), "d 'de' MMMM yyyy", { locale: es })
})

// Helper para navegar a la URL de detalle de asistencia
const navigateToAttendanceDetailUrl = (date: string, classId: string) => {
  const formattedDate = date.replace(/-/g, '')
  router.push(`/attendance/${formattedDate}/${classId}`)
}

// Seleccionar fecha (ya sea desde el calendario o Datepicker)
const selectDate = async (date: string | { date: string }) => {
  if (isUpdating.value) return
  isUpdating.value = true
  try {
    if (typeof date === 'string') {
      selectedDate.value = date
    } else if (date && date.date) {
      selectedDate.value = date.date
    }
    if (selectedClass.value) {
      navigateToAttendanceDetailUrl(selectedDate.value, selectedClass.value)
      await loadAttendanceData(selectedClass.value)
    } else {
      view.value = 'class-select'
    }
  } catch (err) {
    console.error('Error al seleccionar fecha:', err)
  } finally {
    setTimeout(() => { isUpdating.value = false }, 0)
  }
}

// Manejo de la selección desde el modal del calendario
const handleCalendarSelect = (date: string) => {
  if (typeof date === 'string') {
    selectedDate.value = date
  } else if (date && date.date) {
    selectedDate.value = date.date
  }
  // No cerramos el modal automáticamente para permitir al usuario confirmar
}

// Función para confirmar la fecha seleccionada en el modal
const confirmDateSelection = () => {
  selectDate(selectedDate.value)
  showCalendarModal.value = false
}

// Manejar cambio de mes en el calendario
const handleMonthChange = (newMonth: Date) => {
  currentMonth.value = newMonth
  attendanceStore.fetchAttendanceRecords({
    classId: selectedClass.value || 'all',
    startDate: newMonth,
    endDate: new Date()
  })
}

// Actualización de fecha desde DateClassSelector
const handleDateChange = async (newDate: string) => {
  if (isUpdating.value) return
  isUpdating.value = true
  try {
    selectedDate.value = newDate
    if (!attendanceStore.validateAttendanceDate(selectedDate.value)) {
      warningMessage.value = "No se puede registrar asistencia para fechas futuras"
      return
    }
    if (selectedClass.value) {
      navigateToAttendanceDetailUrl(selectedDate.value, selectedClass.value)
      await loadAttendanceData(selectedClass.value)
    }
  } finally {
    setTimeout(() => { isUpdating.value = false }, 0)
  }
}

// Actualizar la fecha sin entrar en ciclo reactivo
const handleSelectedDateUpdate = (date: string) => {
  if (isUpdating.value) return
  isUpdating.value = true
  setTimeout(() => {
    selectedDate.value = date
    isUpdating.value = false
  }, 0)
}

// Corregido para usar los mismos valores que AttendanceHeader.vue
const updateView = (newView: 'calendar' | 'class-select' | 'attendance-form') => {
  view.value = newView;
}

// Cargar datos de asistencia para una clase
const loadAttendanceData = async (className: string) => {
  try {
    isLoading.value = true
    loadingMessage.value = 'Cargando datos de asistencia...'
    attendanceStore.attendanceRecords = {}
    attendanceStore.selectedClass = className
    attendanceStore.selectedDate = selectedDate.value
    await attendanceStore.fetchAttendanceDocument(selectedDate.value, className)
    const students = studentsStore.getStudentsByClass(className)
    filteredStudents.value = students
    students.forEach(student => {
      if (!attendanceStore.attendanceRecords[student.id]) {
        attendanceStore.attendanceRecords[student.id] = 'Ausente'
      }
    })
    await attendanceStore.updateAnalytics()
  } catch (err) {
    console.error('Error al cargar asistencia:', err)
  } finally {
    isLoading.value = false
    loadingMessage.value = ''
  }
}

// Seleccionar una clase y cargar sus estudiantes
const selectClass = async (className: string) => {
  try {
    selectedClass.value = className
    attendanceStore.selectedClass = className
    let students = studentsStore.getStudentsByClass(className)
    if (!students.length) {
      // Búsqueda alternativa si no se encuentran con el método por defecto
      students = studentsStore.students.filter(s =>
        (s.clase && (Array.isArray(s.clase) ? s.clase.includes(className) : s.clase === className)) ||
        (s.grupo && (Array.isArray(s.grupo) ? s.grupo.includes(className) : s.grupo === className))
      )
    }
    filteredStudents.value = students
    navigateToAttendanceDetailUrl(selectedDate.value, className)
    await loadAttendanceData(className)
    view.value = 'attendance-form'
  } catch (error) {
    console.error('Error al seleccionar clase:', error)
    errorMessage.value = 'Error al cargar los estudiantes de la clase'
  }
}

// Verificar si la fecha está en el horario programado de la clase
const isDateInClassSchedule = (date: string, classId: string): boolean => {
  try {
    const scheduledDays = attendanceStore.getClassScheduleDays(classId)
    if (!scheduledDays || scheduledDays.length === 0) return false
    const dayName = format(parseISO(date), 'EEEE', { locale: es }).toLowerCase()
    return scheduledDays.includes(dayName)
  } catch (error) {
    console.error('Error al verificar horario de clase:', error)
    return false
  }
}

// Guardar cambios pendientes en la asistencia
const saveAllAttendanceChanges = async () => {
  try {
    const isRegularSchedule = isDateInClassSchedule(selectedDate.value, selectedClass.value)
    if (!isRegularSchedule) {
      const hasExistingAttendance = await attendanceStore.fetchAttendanceDocument(selectedDate.value, selectedClass.value)
      if (!hasExistingAttendance) {
        const sessionKey = `emergency_shown_${selectedDate.value}_${selectedClass.value}`
        if (!sessionStorage.getItem(sessionKey)) {
          showEmergencyClassModal.value = true
          sessionStorage.setItem(sessionKey, 'true')
          return false
        }
      }
    }
    
    isLoading.value = true
    loadingMessage.value = 'Guardando asistencia...'
    
    // Crear documento de asistencia con la estructura correcta
    const attendanceDoc = {
      fecha: selectedDate.value,
      classId: selectedClass.value,
      teacherId: authStore.user?.uid, // Agregar ID del maestro para facilitar consultas
      timestamp: new Date().toISOString(), // Añadir timestamp para ordenación
      data: {
        presentes: [] as string[],
        ausentes: [] as string[],
        tarde: [] as string[],
        justificacion: attendanceStore.currentAttendanceDoc?.data.justificacion?.filter(j => 
          attendanceStore.attendanceRecords[j.id] === 'Justificado'
        ) || [],
        observations: attendanceStore.currentAttendanceDoc?.data.observations || ''
      }
    }
    
    // Procesar cada estudiante según su estado
    Object.entries(attendanceStore.attendanceRecords).forEach(([studentId, status]) => {
      if (status === 'Presente') {
        attendanceDoc.data.presentes.push(studentId)
      } else if (status === 'Ausente') {
        attendanceDoc.data.ausentes.push(studentId)
      } else if (status === 'Tardanza') {
        attendanceDoc.data.tarde.push(studentId)
      } else if (status === 'Justificado') {
        // Los justificados deben estar tanto en tarde como en justificación
        if (!attendanceDoc.data.tarde.includes(studentId)) {
          attendanceDoc.data.tarde.push(studentId)
        }
        
        const existingJust = attendanceDoc.data.justificacion.find(j => j.id === studentId)
        if (!existingJust) {
          attendanceDoc.data.justificacion.push({ id: studentId, reason: 'Justificación pendiente de detalles' })
        }
      }
    })
    
    // Guardar el documento y asegurarnos de que se actualiza la caché local
    await attendanceStore.saveAttendanceDocument(attendanceDoc)
    
    // Actualizar la lista de fechas con registros para que el calendario se actualice
    await attendanceStore.fetchAllAttendanceDates()
    
    // Actualizar analíticas
    await attendanceStore.updateAnalytics()
    
    showToast('Asistencia guardada correctamente', 'success')
    return true
  } catch (err) {
    error.value = 'Error al guardar la asistencia'
    console.error('Error guardando asistencia:', err)
    showToast('Error al guardar la asistencia', 'error')
    return false
  } finally {
    isLoading.value = false
    loadingMessage.value = ''
  }
}

// Manejar observación añadida
const handleObservationAdded = async (observations: string) => {
  try {
    isLoading.value = true
    loadingMessage.value = 'Guardando observación...'
    await attendanceStore.updateObservations(selectedDate.value, selectedClass.value, observations)
    showToast('Observación guardada correctamente', 'success')
    showObservationsModal.value = false
  } catch (err) {
    error.value = 'Error al actualizar observaciones'
    console.error('Error actualizando observaciones:', err)
    showToast('Error al guardar la observación', 'error')
  } finally {
    isLoading.value = false
    loadingMessage.value = ''
  }
}

// Abrir modal de observaciones
const handleOpenObservation = (student: any) => {
  selectedStudentForObs.value = student
  showObservationsModal.value = true
}

// Guardar justificación
const handleJustificationSave = async (data: { reason: string, documentUrl?: string, file?: File }) => {
  try {
    if (!selectedStudentForJustification.value) return
    isLoading.value = true
    loadingMessage.value = 'Guardando justificación...'
    const studentId = selectedStudentForJustification.value.id
    attendanceStore.attendanceRecords[studentId] = 'Justificado'
    await attendanceStore.addJustificationToAttendance(
      studentId,
      selectedDate.value,
      selectedClass.value,
      data.reason,
      data.file || null
    )
    showJustifiedAbsenceModal.value = false
    showToast('Justificación guardada correctamente', 'success')
    await loadAttendanceData(selectedClass.value)
  } catch (err) {
    error.value = 'Error al guardar la justificación'
    console.error('Error guardando justificación:', err)
    showToast('Error al guardar la justificación', 'error')
  } finally {
    isLoading.value = false
    loadingMessage.value = ''
  }
}

// Función para generar el template HTML de asistencia
const generateAttendanceHTML = (
  students: Student[],
  records: Record<string, string>,
  observations: string = 'Sin observaciones.',
  className: string,
  date: string
): string => {
  const formattedDate = format(new Date(date), "d 'de' MMMM yyyy", { locale: es });
  
  // Prepara el nombre del maestro
  const teacherName = authStore.user?.displayName || authStore.user?.email || 'Profesor Desconocido';
  
  // Calcular el sumario de asistencia
  const presentCount = Object.values(records).filter(status => status === 'Presente').length;
  const lateCount = Object.values(records).filter(status => status === 'Tardanza').length;
  const justifiedCount = Object.values(records).filter(status => status === 'Justificado').length;
  const absentCount = Object.values(records).filter(status => status === 'Ausente').length;
  const totalCount = students.length;
  
  // Ordenar estudiantes: primero alfabéticamente
  const sortedStudents = [...students].sort((a, b) => {
    const nameA = `${a.nombre} ${a.apellido}`.toLowerCase();
    const nameB = `${b.nombre} ${b.apellido}`.toLowerCase();
    return nameA.localeCompare(nameB);
  });
  
  // Luego agrupar por estado de asistencia (presentes, tardes, justificados, ausentes)
  const presentStudents = sortedStudents.filter(student => records[student.id] === 'Presente');
  const lateStudents = sortedStudents.filter(student => records[student.id] === 'Tardanza');
  const justifiedStudents = sortedStudents.filter(student => records[student.id] === 'Justificado');
  const absentStudents = sortedStudents.filter(student => records[student.id] === 'Ausente');
  const otherStudents = sortedStudents.filter(student => 
    !['Presente', 'Tardanza', 'Justificado', 'Ausente'].includes(records[student.id] || '')
  );
  
  // Combinar en el orden deseado
  const orderedStudents = [
    ...presentStudents,
    ...lateStudents,
    ...justifiedStudents,
    ...absentStudents,
    ...otherStudents
  ];
  
  // Generar filas de estudiantes
  let studentRows = '';
  orderedStudents.forEach((student, index) => {
    // Aplicar color según estado de asistencia
    let statusClass = '';
    const status = records[student.id] || 'No registrado';
    
    // Obtener la justificación si el estado es "Justificado"
    let studentObservation = '';
    if (status === 'Justificado' && attendanceStore.currentAttendanceDoc?.data?.justificacion) {
      // Buscar la justificación correspondiente al estudiante
      const justification = attendanceStore.currentAttendanceDoc.data.justificacion.find(j => j.id === student.id);
      if (justification && justification.reason) {
        studentObservation = justification.reason;
      }
    }
    
    switch(status) {
      case 'Presente':
        statusClass = 'color: #10b981;'; // Verde
        break;
      case 'Ausente':
        statusClass = 'color: #ef4444;'; // Rojo
        break;
      case 'Tardanza':
        statusClass = 'color: #f59e0b;'; // Amarillo
        break;
      case 'Justificado':
        statusClass = 'color: #3b82f6;'; // Azul
        break;
      default:
        statusClass = 'color: #6b7280;'; // Gris
    }
    
    studentRows += `
      <tr>
        <td style="border: 1px solid #ddd; padding: 8px;">${index + 1}</td>
        <td style="border: 1px solid #ddd; padding: 8px;">${student.nombre} ${student.apellido}</td>
        <td style="border: 1px solid #ddd; padding: 8px; font-weight: bold; ${statusClass}">${status}</td>
        <td style="border: 1px solid #ddd; padding: 8px;">${status === 'Justificado' ? `${studentObservation || 'No especificada'}` : ''}</td>
      </tr>
    `;
  });
  // Generar el HTML completo
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>Reporte de Asistencia - ${className}</title>
      <style>
        body { 
          font-family: 'Segoe UI', Arial, sans-serif; 
          line-height: 1.6;
          color: #333;
          max-width: 800px;
          margin: 0 auto;
          padding: 20px;
          background-color: #f9fafb;
        }
        .header {
          text-align: center;
          margin-bottom: 30px;
          background-color: #ffffff;
          border-radius: 8px;
          padding: 20px;
          box-shadow: 0 4px 6px rgba(0,0,0,0.05);
        }
        .header h1 {
          color: #16a34a;
          margin-bottom: 5px;
          font-size: 28px;
        }
        .header h2 {
          color: #4b5563;
          font-size: 18px;
          font-weight: normal;
          margin: 5px 0;
        }
        .summary-container {
          display: flex;
          justify-content: space-between;
          margin: 20px 0;
          flex-wrap: wrap;
        }
        .summary-box {
          background-color: white;
          border-radius: 8px;
          padding: 15px;
          margin: 10px 0;
          flex-basis: calc(25% - 15px);
          box-shadow: 0 2px 4px rgba(0,0,0,0.05);
          text-align: center;
        }
        .summary-box h3 {
          margin: 0;
          font-size: 14px;
          color: #6b7280;
        }
        .summary-box p {
          margin: 10px 0 0;
          font-size: 24px;
          font-weight: bold;
        }
        .presente { color: #10b981; }
        .tarde { color: #f59e0b; }
        .justificado { color: #3b82f6; }
        .ausente { color: #ef4444; }
        
        table { 
          width: 100%; 
          border-collapse: collapse; 
          margin: 25px 0;
          box-shadow: 0 4px 6px rgba(0,0,0,0.05);
          background-color: white;
          border-radius: 8px;
          overflow: hidden;
        }
        th { 
          background-color: #16a34a; 
          color: white;
          text-align: left; 
          padding: 12px; 
          font-weight: 600;
        }
        td {
          border-bottom: 1px solid #f2f2f2; 
          padding: 12px 8px;
        }
        tr:last-child td {
          border-bottom: none;
        }
        tr:hover {
          background-color: #f9fafb;
        }
        
        .observations {
          background-color: white;
          border-radius: 8px;
          padding: 20px;
          margin: 20px 0;
          box-shadow: 0 4px 6px rgba(0,0,0,0.05);
        }
        .observations h3 {
          color: #16a34a;
          margin-top: 0;
          border-bottom: 2px solid #e5e7eb;
          padding-bottom: 10px;
        }
        
        .footer {
          text-align: center;
          font-size: 14px;
          color: #6b7280;
          margin-top: 40px;
          padding-top: 20px;
          border-top: 1px solid #e5e7eb;
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>Reporte de Asistencia</h1>
        <h2>Clase: ${className}</h2>
        <h2>Fecha: ${formattedDate}</h2>
        <h2>Maestro: ${teacherName}</h2>
      </div>
      
      <div class="summary-container">
        <div class="summary-box">
          <h3>Presentes</h3>
          <p class="presente">${presentCount}</p>
        </div>
        <div class="summary-box">
          <h3>Tardes</h3>
          <p class="tarde">${lateCount}</p>
        </div>
        <div class="summary-box">
          <h3>Justificados</h3>
          <p class="justificado">${justifiedCount}</p>
        </div>
        <div class="summary-box">
          <h3>Ausentes</h3>
          <p class="ausente">${absentCount}</p>
        </div>
      </div>

      <table>
        <thead>
          <tr>
            <th>#</th>
            <th>Alumno</th>
            <th>Estado</th>
            <th>Justificación</th>
          </tr>
        </thead>
        <tbody>
          ${studentRows}
        </tbody>
      </table>

      <div class="observations">
        <h3>Observaciones del Maestro:</h3>
        <p>${observations}</p>
      </div>
      
      <div class="footer">
        Este reporte fue generado automáticamente desde El Sistema PC - ${new Date().toLocaleDateString()}
      </div>
    </body>
    </html>
  `;
};

// Función para enviar el reporte de asistencia por correo electrónico
const sendAttendanceEmail = async () => {
  if (!selectedClass.value || !selectedDate.value) {
    showToast('Seleccione una clase y fecha para enviar el correo.', 'error');
    return;
  }
  
  if (!authStore.user || !authStore.user.email) {
    showToast('No se pudo obtener el correo del usuario para enviar el reporte.', 'error');
    return;
  }

  isLoading.value = true;
  loadingMessage.value = 'Enviando correo...';

  try {
    const students = studentsStore.getStudentsByClass(selectedClass.value);
    const records = attendanceStore.attendanceRecords;
    const observations = attendanceStore.currentAttendanceDoc?.data.observations || 'Sin observaciones.';
    const className = selectedClassName.value;
    const date = selectedDate.value;

    // Generar contenido HTML para el correo
    const htmlContent = generateAttendanceHTML(students, records, observations, className, date);

    // Preparar payload para el webhook
    // Importante: Para la estructura del webhook, incluimos los datos directamente en el objeto data
    // const payload = {
    //   date: date,
    //   class: className,
    //   data: {
    //     recipient: authStore.user.email,
    //     classId: selectedClass.value,
    //     date: date,
    //     className: className,
    //     observations: observations,
    //     teacherId: authStore.user.uid || '',
    //     teacherName: authStore.user.displayName || '',
    //     teacherEmail: authStore.user.email || '',
    //     studentsCount: students.length,
    //     // Incluimos un resumen de estadísticas para el correo
    //     summary: {
    //       total: students.length,
    //       presentes: Object.values(records).filter(status => status === 'Presente').length,
    //       ausentes: Object.values(records).filter(status => status === 'Ausente').length,
    //       tardanzas: Object.values(records).filter(status => status === 'Tardanza').length,
    //       justificados: Object.values(records).filter(status => status === 'Justificado').length
    //     }
    //   }
    // };    // Validar que se haya ingresado un correo destinatario
    if (!recipientEmail.value) {
      showToast('Por favor ingrese un correo electrónico de destinatario', 'error');
      return;
    }
      // Usar la URL del webhook desde la configuración en Firestore
    const makeWebhookUrl = configStore.attendanceWebhookUrl || 'https://hook.us2.make.com/t2ockuc1vne58yqc68rjqp94njv1i3uo'      // Preparar un array formateado de estudiantes para Google Sheets, agrupados por estado
    // Primero dividimos los estudiantes en categorías según su estado de asistencia
    const presentStudents = [];
    const lateStudents = [];
    const justifiedStudents = [];
    const absentStudents = [];
    const otherStudents = [];
    
    students.forEach(student => {      const attendanceStatus = records[student.id] || 'No registrado';
      // Obtener justificación si está disponible
      let justificationReason = '';
      
      // Si el estado es Justificado, buscar la razón en el array de justificaciones
      if (attendanceStatus === 'Justificado' && attendanceStore.currentAttendanceDoc?.data?.justificacion) {
        // Buscar la justificación correspondiente al estudiante
        const justification = attendanceStore.currentAttendanceDoc.data.justificacion.find(j => j.id === student.id);
        if (justification && justification.reason) {
          justificationReason = `Justificación: ${justification.reason}`;
        }
      }
      
      const studentData = {
        Num: 0, // Se asignará después
        Nombre: student.nombre || '',
        Apellido: student.apellido || '',
        Estado: attendanceStatus,
        Observaciones: attendanceStatus === 'Justificado' ? justificationReason : observations,
        Maestro: authStore.user?.displayName || authStore.user?.email || 'Profesor Desconocido',
        Fecha: format(new Date(date), 'yyyy-MM-dd'),
        Clase: className
      };
      
      // Agrupar por estado
      switch (attendanceStatus) {
        case 'Presente':
          presentStudents.push(studentData);
          break;
        case 'Tardanza':
          lateStudents.push(studentData);
          break;
        case 'Justificado':
          justifiedStudents.push(studentData);
          break;
        case 'Ausente':
          absentStudents.push(studentData);
          break;
        default:
          otherStudents.push(studentData);
      }
    });
    
    // Combinar los arrays en el orden deseado: Presentes, Tardanzas, Justificados, Ausentes, Otros
    const formattedStudents = [
      ...presentStudents,
      ...lateStudents,
      ...justifiedStudents,
      ...absentStudents,
      ...otherStudents
    ].map((student, index) => {
      // Asignar el número secuencial después de ordenar
      student.Num = index + 1;
      return student;
    });

    // Preparar payload para Make.com
    const makePayload = {
      subject: `Reporte de Asistencia - ${className} - ${format(new Date(date), 'yyyy-MM-dd')}`,
      format: 'email',
      type: 'attendance_report',
      action: 'send_attendance_email',
      htmlBody: htmlContent,
      date: selectedDate.value,
      class: selectedClass.value,
      className: selectedClassName.value,
      students: studentsStore.getStudentsByClass(selectedClass.value),
      // Añadir el array formateado para Google Sheets
      formattedStudents: formattedStudents,
      attendanceRecords: attendanceStore.attendanceRecords,
      observations: attendanceStore.currentAttendanceDoc?.data.observations,
      teacherId: authStore.user?.uid,
      teacherName: authStore.user?.email || 'Profesor Desconocido',
      teacherEmail: authStore.user?.email,
      recipient: recipientEmail.value,
      // Incluimos un resumen de estadísticas para el correo
      summary: {
        total: students.length,
        presentes: Object.values(records).filter(status => status === 'Presente').length,
        ausentes: Object.values(records).filter(status => status === 'Ausente').length,
        tardanza: Object.values(records).filter(status => status === 'Tardanza').length,
        justificados: Object.values(records).filter(status => status === 'Justificado').length
      }
    };
      // Enviar los datos a Make.com
    await sendToMake(makeWebhookUrl, makePayload);

    showToast('Datos enviados a Make.com correctamente. Se procesará el envío del correo.', 'success');
  } catch (err: any) {
    console.error("Error enviando datos a Make.com:", err);
    showToast(`Error al enviar datos a Make.com: ${err.message || 'Error desconocido'}`, 'error');
    error.value = 'No se pudieron enviar los datos a Make.com.';
  } finally {
    isLoading.value = false;
    loadingMessage.value = '';
  }
};

// Función para exportar la asistencia actual a PDF
const exportCurrentClassAttendanceToPDF = async (): Promise<void> => {
  if (!selectedClass.value || !selectedDate.value) {
    showToast('Seleccione una clase y fecha para exportar.', 'error');
    return;
  }

  isLoading.value = true
  loadingMessage.value = 'Generando PDF...'

  try {
    // Obtener datos necesarios
    const students = studentsStore.getStudentsByClass(selectedClass.value)
    const records = attendanceStore.attendanceRecords
    const observations = attendanceStore.currentAttendanceDoc?.data.observations || 'Sin observaciones.'
    const className = selectedClassName.value
    const date = selectedDate.value // Fecha para nombre de archivo

    // Llamar a la función de utilidad para generar el PDF
    await generateAttendancePDF(
      students,
      records,
      observations,
      className,
      date
    );

    showToast('PDF generado correctamente.', 'success')
  } catch (err: any) {
    console.error("Error generando PDF:", err)
    showToast('Error al generar el PDF. Intente de nuevo más tarde.', 'error')
    error.value = 'No se pudo generar el PDF.'
  } finally {
    isLoading.value = false
    loadingMessage.value = ''
  }
}

// Funciones para modales
const toggleAnalytics = () => {
  showAnalytics.value = !showAnalytics.value;
  if (showAnalytics.value && showTrends.value) {
    showTrends.value = false;
  }
};

const toggleTrends = () => {
  showTrends.value = !showTrends.value;
  if (showTrends.value && showAnalytics.value) {
    showAnalytics.value = false;
  }
};

const openReportModal = () => { 
  showReportModal.value = true;
};

const handleGenerateReport = async (filters: AttendanceFiltersType) => {
  try {
    isLoading.value = true;
    loadingMessage.value = 'Generando informe...';
    reportFilters.value = filters;
    await attendanceStore.generateReport(filters);
    showToast('Informe generado correctamente', 'success');
    showReportModal.value = false;
  } catch (err) {
    error.value = 'Error al generar el informe';
    console.error('Error generando informe:', err);
    showToast('Error al generar el informe', 'error');
  } finally {
    isLoading.value = false;
    loadingMessage.value = '';
  }
};

const openExportModal = () => { showExportModal.value = true}
const createNewAttendance = () => { selectedDate.value = getCurrentDate(); view.value = 'class-select' }
const handleOpenJustification = (student: any) => {
  selectedStudentForJustification.value = student ? { id: student.id, nombre: student.nombre, apellido: student.apellido } : null
  showJustifiedAbsenceModal.value = true
}
// Función modificada para manejar diferentes opciones de exportación
const handleOpenExport = (fromAttendanceList = false) => {
  console.log("Exportar asistencia a PDF")
  // Si la exportación es desde la lista de asistencia, generamos el PDF directamente
  if (fromAttendanceList) {
    exportCurrentClassAttendanceToPDF()
  } else {
    // Si es desde el botón general, abrimos el modal de configuración
    showExportModal.value = true 
  }
}

const handleEmergencyClassSubmitted = async (success: boolean) => {
  if (success) {
    showToast('Clase emergente registrada correctamente. Pendiente de aprobación.', 'success')
    await saveAllAttendanceChanges()
  } else {
    showToast('Error al registrar la clase emergente', 'error')
  }
}
const handleEmergencyClassCancelled = () => { showToast('Registro de clase emergente cancelado', 'success') }

// Manejar actualización de estado de asistencia
const handleUpdateStatus = (studentId: string, status: string) => {
  // Asegúrate de que el ID del estudiante y el estado sean válidos
  if (!studentId || !status) return;
  attendanceStore.attendanceRecords[studentId] = status as any; // Asegúrate de que el tipo sea correcto
  console.log("Estado actualizado:", studentId, status)
}

const checkExistingAttendance = async (date: string, classId: string): Promise<boolean> => {
 // Este metodo chequea la existencia de la asistencia
  try {
    const existingInMemory = attendanceStore.attendanceDocuments.some(
      doc => doc.fecha === date && doc.classId === classId
    )
    if (existingInMemory) return true
    const docResult = await attendanceStore.fetchAttendanceDocument(date, classId)
    const hasExistingData = docResult && (
      docResult.data.presentes.length > 0 ||
      docResult.data.ausentes.length > 0 ||
      docResult.data.tarde.length > 0
    )
    return !!hasExistingData
  } catch (error) {
    console.error('Error verificando asistencia existente:', error)
    return false
  }
}

// Función para cerrar todos los modales
const closeAllModals = () => {
  showAnalytics.value = false
  showTrends.value = false
  showReportModal.value = false
  showExportModal.value = false
  showObservationsModal.value = false
  showJustifiedAbsenceModal.value = false
  showCalendarModal.value = false
  showEmergencyClassModal.value = false
}

// Carga inicial de datos
const fetchInitialData = async () => {
  try {
    isLoading.value = true
    loadingMessage.value = 'Cargando datos iniciales...'
    
    // Cerrar todos los modales para asegurar una experiencia limpia
    closeAllModals()
    
    await Promise.all([
      classesStore.fetchClasses(),
      studentsStore.fetchStudents(),
      attendanceStore.fetchAllAttendanceDates()
    ])
    
    // Verificar si estamos navegando desde el menú principal de asistencia
    // Las rutas /attendance/calendar o /teacher/attendance/calendar indican navegación desde el menú
    if (route.path.endsWith('/attendance/calendar')) {
      // Si viene desde el menú principal, siempre mostrar el calendario
      view.value = 'calendar'
      selectedDate.value = getCurrentDate()
      selectedClass.value = ''
    }
    // Si hay parámetros específicos en la URL, cargar el detalle de asistencia
    else if (props.date && props.classId) {
      const dateStr = props.date
      const formattedDate = dateStr.length === 8
        ? `${dateStr.substring(0,4)}-${dateStr.substring(4,6)}-${dateStr.substring(6,8)}`
        : dateStr
      selectedDate.value = formattedDate
      selectedClass.value = props.classId
      attendanceStore.selectedDate = formattedDate
      attendanceStore.selectedClass = props.classId
      await selectClass(props.classId)
    } else if (route.query.class) {
      selectedClass.value = route.query.class as string
      attendanceStore.selectedClass = selectedClass.value
      await loadAttendanceData(selectedClass.value)
      view.value = 'attendance-form'
    }
    error.value = null
  } catch (err) {
    error.value = 'Error al cargar los datos iniciales'
    console.error('Error al cargar datos iniciales:', err)
  } finally {
    isLoading.value = false
    loadingMessage.value = ''
  }
}

onMounted(async () => {
  // Cargar configuraciones de la aplicación
  await configStore.fetchConfigs()
  
  await fetchInitialData()
})

// Actualizar datos si cambian los parámetros de la URL o la ruta completa
watch(() => [route.params.date, route.params.classId, route.path], async ([newDate, newClassId, path]) => {
  // Si la ruta termina con /calendar, siempre mostrar la vista de calendario
  // Asegurarse de que path es un string antes de usar endsWith
  if (typeof path === 'string' && (path.endsWith('/attendance/calendar') || path.endsWith('/teacher/attendance/calendar'))) {
    view.value = 'calendar'
    selectedDate.value = getCurrentDate()
    selectedClass.value = ''
    closeAllModals()
    return
  }
  
  // Si hay parámetros de URL específicos, cargar el detalle de asistencia
  if (newDate && newClassId) {
    const dateStr = newDate as string
    const formattedDate = dateStr.length === 8
      ? `${dateStr.substring(0,4)}-${dateStr.substring(4,6)}-${dateStr.substring(6,8)}`
      : dateStr
    selectedDate.value = formattedDate
    selectedClass.value = newClassId as string
    attendanceStore.selectedDate = formattedDate
    attendanceStore.selectedClass = newClassId as string
    await selectClass(newClassId as string)
  }
})
</script>

<template>  <div class="p-2 sm:p-4 md:p-6 min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 max-w-full overflow-x-hidden">
    <!-- Toast Messages -->
    <div v-if="showMessage" class="fixed top-4 right-20 z-50 p-3 sm:p-4 rounded-lg shadow-lg text-white transition-all duration-300 text-sm sm:text-base max-w-[90vw] sm:max-w-md" :class="messageType === 'success' ? 'bg-green-500' : 'bg-red-500'">
      {{ message }}
    </div>

    <!-- Header -->
    <AttendanceHeader 
      :selectedDate="selectedDate" 
      :selectedClass="selectedClassName" 
      :view="view" 
      :showAnalytics="showAnalytics"
      @update:view="updateView"  
      @toggle-analytics="toggleAnalytics" 
      @open-report-modal="openReportModal" 
      @open-export-modal="openExportModal"
      @create-new-attendance="createNewAttendance"
      @open-calendar-modal="showCalendarModal = true"
      @open-emergency-class-modal="showEmergencyClassModal = true"
      @open-justified-absence-modal="showJustifiedAbsenceModal = true"
      @open-observation-modal="showObservationsModal = true"
      @open-justification-modal="handleOpenJustification"
      class="mb-3 sm:mb-4"
    />

    <!-- Botones adicionales -->
    <div class="flex flex-wrap gap-2 mb-4 justify-center sm:justify-start">
      <button @click="toggleAnalytics" class="btn text-xs sm:text-sm" :class="showAnalytics ? 'btn-primary' : 'btn-secondary'">
        <i class="fas fa-chart-pie mr-1 sm:mr-2"></i>
        <span class="hidden xs:inline">Análisis</span>
        <span class="xs:hidden">A</span>
      </button>
      <button @click="toggleTrends" class="btn text-xs sm:text-sm" :class="showTrends ? 'btn-primary' : 'btn-secondary'">
        <i class="fas fa-chart-line mr-1 sm:mr-2"></i>
        <span class="hidden xs:inline">Tendencias</span>
        <span class="xs:hidden">T</span>
      </button>
      <button @click="openReportModal" class="btn btn-secondary text-xs sm:text-sm">
        <i class="fas fa-file-alt mr-1 sm:mr-2"></i>
        <span class="hidden xs:inline">Informe</span>
        <span class="xs:hidden">I</span>
      </button>      <button @click="openExportModal" class="btn btn-secondary text-xs sm:text-sm">
        <i class="fas fa-file-export mr-1 sm:mr-2"></i>
        <span class="hidden xs:inline">Exportar</span>
        <span class="xs:hidden">E</span>
      </button>
      <button @click="exportCurrentClassAttendanceToPDF" class="btn btn-secondary text-xs sm:text-sm">
        <i class="fas fa-file-pdf mr-1 sm:mr-2"></i>
        <span class="hidden xs:inline">Exportar PDF</span>
        <span class="xs:hidden">PDF</span>
      </button>
    </div>
    
    <!-- Campo para ingresar el correo del destinatario -->
    <div class="mb-4 p-4 bg-white dark:bg-gray-800 rounded-lg shadow-md">
      <h3 class="font-semibold text-sm sm:text-base mb-2">Enviar reporte por correo electrónico</h3>
      <div class="flex flex-col sm:flex-row gap-3 items-center">
        <div class="w-full sm:w-2/3">
          <label for="recipientEmail" class="block text-sm font-medium mb-1">Correo del destinatario:</label>
          <input 
            id="recipientEmail" 
            v-model="recipientEmail" 
            type="email" 
            class="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 bg-white dark:bg-gray-900"
            placeholder="Ingrese el correo electrónico"
          />
        </div>
        <button @click="sendAttendanceEmail" class="btn btn-primary text-xs sm:text-sm mt-2 sm:mt-5 w-full sm:w-auto">
          <i class="fas fa-envelope mr-1 sm:mr-2"></i>
          <span>Enviar Reporte</span>
        </button>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="isLoading" class="flex flex-col justify-center items-center py-6 sm:py-10 bg-white dark:bg-gray-800 rounded-lg shadow-md">
      <div class="animate-spin rounded-full h-8 w-8 sm:h-10 sm:w-10 border-b-2 border-primary-600"></div>
      <span v-if="loadingMessage" class="mt-3 text-sm sm:text-base text-center">{{ loadingMessage }}</span>
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 p-3 sm:p-4 rounded-lg mb-4 text-sm sm:text-base">
      <div class="flex items-center justify-between flex-wrap gap-2">
        <div class="flex items-center">
          <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
          </svg>
          {{ error }}
        </div>
        <button @click="fetchInitialData" class="btn btn-sm btn-error">Reintentar</button>
      </div>
    </div>

    <!-- Main Content -->
    <div v-else class="space-y-3 sm:space-y-5">
      <!-- Panel de Analytics -->
      <AttendanceAnalytics v-if="showAnalytics" class="mb-3 sm:mb-4" />

      <!-- Panel de Tendencias -->
      <AttendanceTrends v-if="showTrends" class="mb-3 sm:mb-4" />

      <!-- Vista principal según estado -->
      <div class="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-3 sm:p-4 md:p-6 overflow-hidden">
        <!-- Vista de Calendario -->
        <div v-if="view === 'calendar'" class="max-w-3xl mx-auto">
          <h2 class="text-lg font-semibold mb-3 text-center sm:text-left">Seleccionar Fecha</h2>
          <Calendar 
            :selected-date="selectedDate" 
            :current-month="currentMonth"
            :markedDates="attendanceStore.datesWithRecords" 
            @select="selectDate"
            @month-change="handleMonthChange"
            class="max-w-full overflow-x-auto"
          />
        </div>

        <!-- Vista de Selección de Clase -->
        <div v-else-if="view === 'class-select'" class="max-w-3xl mx-auto">
          <h2 class="text-lg font-semibold mb-3 text-center sm:text-left">Seleccionar Clase</h2>
          <DateClassSelector 
            v-model="selectedClass" 
            v-model:selectedDate="selectedDate" 
            :dayFilter="true"
            :isLoading="isLoading"
            :classesWithRecords="attendanceStore.classesWithRecords"
            @continue="() => selectClass(selectedClass)"
            @date-change="handleDateChange"
            @update:selectedDate="handleSelectedDateUpdate"
            class="max-w-full"
          />
        </div>

        <!-- Vista de Lista de Asistencia -->
        <div v-else-if="view === 'attendance-form'" class="space-y-3 sm:space-y-4">
          <h2 class="text-base sm:text-lg font-semibold mb-2 sm:mb-3 text-center sm:text-left">
            Lista de Asistencia <span class="block sm:inline">{{ formattedSelectedDate }}</span>
          </h2>          <div class="flex flex-col sm:flex-row flex-wrap justify-between items-center gap-2 mb-3 sm:mb-4">
            <button @click="view = 'calendar'" class="btn btn-secondary inline-flex items-center w-full sm:w-auto">
              <CalendarDaysIcon class="w-4 h-4 sm:w-5 sm:h-5 mr-1 sm:mr-2" />
              Volver al Calendario
            </button>
            <div v-if="attendanceStore.getObservations" class="flex items-center justify-center sm:justify-start w-full sm:w-auto mt-2 sm:mt-0">
              <span class="text-xs sm:text-sm text-gray-600 dark:text-gray-400 italic mr-2">
                Esta clase tiene observaciones
              </span>
              <button @click="handleOpenObservation(null)" class="btn btn-xs sm:btn-sm btn-info">
                Ver/Editar
              </button>
            </div>
          </div>

          
          <AttendanceList 
            :students="studentsStore.getStudentsByClass(selectedClass)" 
            :attendanceRecords="attendanceStore.attendanceRecords"
            :selectedClassName="selectedClassName"
            :isDisabled="!attendanceStore.validateAttendanceDate(selectedDate)"
            :currentDate="selectedDate"
            :availableDates="availableClassDates"
            :observationsCount="getObservationsCount"
            @update-status="handleUpdateStatus"            @open-justification="handleOpenJustification"
            @open-observation="handleOpenObservation"
            @open-export="() => handleOpenExport(true)"
            @class-changed="selectClass"
            @date-changed="handleDateChange"
            class="overflow-x-auto"
          />
        </div>
      </div>
    </div>

    <!-- Modales -->
    <AttendanceReportModal 
      v-if="showReportModal" 
      v-model="showReportModal"
      :classes="classesStore.classes"
      @close="showReportModal = false"
      @generate-report="handleGenerateReport"
    />
    <AttendanceExportModal 
      v-if="showExportModal" 
      :modelValue="showExportModal"
      :date="selectedDate"
      :className="selectedClass"
      :students="studentsStore.getStudentsByClass(selectedClass)"
      :attendanceRecords="attendanceStore.attendanceRecords"
      @update:modelValue="showExportModal = $event"
      @close="showExportModal = false"
    />
    <AttendanceObservation 
      v-if="showObservationsModal" 
      :modelValue="showObservationsModal"
      :studentId="selectedStudentForObs?.id"
      :studentName="selectedStudentForObs ? `${selectedStudentForObs.nombre} ${selectedStudentForObs.apellido}` : ''"
      :classId="selectedClass"
      :className="selectedClassName || selectedClass"
      :attendanceId="selectedDate"
      :attendanceDate="selectedDate"
      @update:modelValue="showObservationsModal = $event"
      @observation="handleObservationAdded"
    />
    <JustifiedAbsenceModal 
      v-if="showJustifiedAbsenceModal" 
      :student="selectedStudentForJustification"
      @close="showJustifiedAbsenceModal = false"
      @save="handleJustificationSave"
    />    <!-- Modal de calendario personalizado que usa directamente Calendar.vue -->
    <div v-if="showCalendarModal" class="fixed inset-0 flex items-center justify-center z-50">
      <div class="absolute inset-0 bg-black/50" @click="showCalendarModal = false"></div>
      <div class="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md z-10">
        <div class="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
          <h3 class="text-lg font-semibold text-gray-900 dark:text-gray-100">Seleccionar Fecha</h3>
          <button @click="showCalendarModal = false" class="text-gray-500 hover:text-gray-700">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div class="p-4">
          <Calendar 
            :selected-date="selectedDate" 
            :current-month="currentMonth"
            :markedDates="attendanceStore.datesWithRecords" 
            @select="handleCalendarSelect"
            @month-change="handleMonthChange"
          />
        </div>
        <div class="p-4 border-t border-gray-200 dark:border-gray-700 flex justify-end">
          <button @click="showCalendarModal = false" class="btn btn-secondary mr-2">
            Cancelar
          </button>
          <button @click="confirmDateSelection" class="btn btn-primary">
            Confirmar
          </button>
        </div>
      </div>
    </div>
    <EmergencyClassModal
      v-if="showEmergencyClassModal"
      v-model="showEmergencyClassModal"
      :classId="selectedClass"
      :className="selectedClassName || selectedClass"
      :date="selectedDate"
      @submitted="handleEmergencyClassSubmitted"
      @cancel="handleEmergencyClassCancelled"
    />
  </div>
</template>
