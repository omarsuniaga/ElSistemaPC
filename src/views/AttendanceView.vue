<script setup lang="ts">
import { storeToRefs } from 'pinia'
import '@vuepic/vue-datepicker/dist/main.css'
import { ref, computed, onMounted, watch } from 'vue'
import Modal from '../components/shared/Modal.vue';
import Datepicker from '@vuepic/vue-datepicker'
import type { AttendanceStatus } from '../types'
import { eachDayOfInterval, addMonths, isSameDay, parseISO, format } from 'date-fns'
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
import CalendarModal from '../modulos/Attendance/components/CalendarModal.vue'
import DateClassSelector from '../modulos/Classes/components/DateClassSelector.vue'
import JustifiedAbsenceModal from '../components/JustifiedAbsenceModal.vue'
import { CalendarDaysIcon } from '@heroicons/vue/24/outline'

// Router
import { useRouter, useRoute } from 'vue-router'
const router = useRouter()
const route = useRoute()

// Stores
import { useAttendanceStore } from '../modulos/Attendance/store/attendance'
import { useStudentsStore } from '../modulos/Students/store/students'
import { useClassesStore } from '../modulos/Classes/store/classes'
// import { useInstrumentoStore } from '../modulos/Instruments/store/instrumento'
import { getCurrentDate } from '../utils/dateUtils'
import type { SelectedStudent } from '../modulos/Students/types/student'
import type { TeacherData } from '../modulos/Teachers/types/teachers'
import type { AttendanceFiltersType } from '../modulos/Attendance/types/attendance'
// Props para recibir fecha y clase desde la URL
const props = defineProps({
  date: String,
  classId: String
})

const attendanceStore = useAttendanceStore()
const studentsStore = useStudentsStore()
const classesStore = useClassesStore()
// const instrumentoStore = useInstrumentoStore()

// Estados globales y de vista
const view = ref<'calendar' | 'class-select' | 'attendance-form'>('calendar')
const selectedDate = ref(getCurrentDate())
const selectedClass = ref('')
const isLoading = ref(true)
const error = ref<string | null>(null)
const loadingMessage = ref<string>('')

// Modales y estados UI
const showAnalytics = ref(false)
const showTrends = ref(false)
const showReportModal = ref(false)
const showExportModal = ref(false)
const showObservationsModal = ref(false)
const selectedStudentForObs = ref<SelectedStudent | null>(null)
const showJustifiedAbsenceModal = ref(false)
const selectedStudentForJustification = ref<SelectedStudent | null>(null)
const showCalendarModal = ref(false)

// Lista de estudiantes filtrados
const filteredStudents = ref<any[]>([])
const errorMessage = ref('')
const warningMessage = ref('')
const selectedClassName = ref('')

// Computed property para obtener profesores
const teachers = computed<TeacherData[]>(() => {
  return studentsStore.students
    .filter(student => student.grupo?.includes('teacher')) // Assuming 'teacher' is a group identifier
    .map(teacher => ({
      id: teacher.id,
      name: `${teacher.nombre} ${teacher.apellido}`
    }))
})

// Filtros para informes
const reportFilters = ref<AttendanceFiltersType>({
  instrument: '' as string,
  level: '' as string,
  teacherId: '' as string
})

interface ReportFilters {
  instrument: string;
  level: string;
  teacherId: string;
}

// Funciones principales
const isDateUpdating = ref(false); // Evitar bucles infinitos al seleccionar fecha

// Añadir un estado para controlar si estamos en medio de una actualización
const isUpdating = ref(false);

const selectDate = async (date) => {
  // Si ya estamos actualizando, no hacer nada para evitar recursión
  if (isUpdating.value) return;
  
  try {
    // Bloquear nuevas actualizaciones
    isUpdating.value = true;
    
    // Si la fecha es un string (formato YYYY-MM-DD), usarla directamente
    if (typeof date === 'string') {
      selectedDate.value = date;
    } 
    // Si es un objeto con propiedad date (como los objetos del calendario)
    else if (date && date.date) {
      selectedDate.value = date.date;
    }
    
    // Si hay una clase seleccionada, actualizar la URL y cargar los datos
    if (selectedClass.value) {
      const formattedDate = selectedDate.value.replace(/-/g, '');
      await router.push(`/attendance/${formattedDate}/${selectedClass.value}`);
      await loadAttendanceData(selectedClass.value);
    } else {
      // Si no hay clase seleccionada, ir a la vista de selección de clase
      view.value = 'class-select';
    }
  } catch (error) {
    console.error('Error al seleccionar fecha:', error);
  } finally {
    // Esperar al siguiente ciclo antes de permitir nuevas actualizaciones
    setTimeout(() => {
      isUpdating.value = false;
    }, 0);
  }
};

// Computed para determinar si la fecha seleccionada es válida para editar
const isDateEditable = computed(() => {
  return attendanceStore.validateAttendanceDate(selectedDate.value);
});

// Método para navegar a la URL con formato /attendance/YYYYMMDD/class-id
const navigateToAttendanceDetailUrl = (date: string, classId: string) => {
  // Formatear la fecha eliminando guiones para URL
  const formattedDate = date.replace(/-/g, '')
  router.push(`/attendance/${formattedDate}/${classId}`)
}

// Añadir función para depurar el StudentsStore al inicio
const debugStudentsStore = () => {
  console.log('========== DEBUG STUDENTS STORE ==========');
  console.log('Total estudiantes:', studentsStore.students.length);
  
  if (studentsStore.students.length > 0) {
    const sample = studentsStore.students[0];
    console.log('Estructura del primer estudiante:', sample);
    
    // Verificar si hay clases asignadas a estudiantes
    const studentsWithClasses = studentsStore.students.filter(s => s.classes && s.classes.length > 0);
    console.log('Estudiantes con clases asignadas:', studentsWithClasses.length);
    
    if (studentsWithClasses.length > 0) {
      console.log('Ejemplo de estudiante con clases:', studentsWithClasses[0]);
    }
  }
};

// Función para cargar datos iniciales y verificar si hay una fecha y clase en la URL
async function fetchInitialData() {
  try {
    isLoading.value = true
    loadingMessage.value = 'Cargando datos iniciales...'
    
    await Promise.all([
      classesStore.fetchClasses(),
      studentsStore.fetchStudents(),
      // instrumentoStore.fetchInstrumentos()
    ])
    
    debugStudentsStore(); // Añadir esta línea para depuración
    
    // Verificar si tenemos fecha y clase en los props (de la URL)
    if (props.date && props.classId) {
      // Formatear la fecha a formato YYYY-MM-DD (si viene como YYYYMMDD)
      const dateStr = props.date
      const formattedDate = dateStr.length === 8
        ? `${dateStr.substring(0, 4)}-${dateStr.substring(4, 6)}-${dateStr.substring(6, 8)}`
        : dateStr
      
      selectedDate.value = formattedDate
      selectedClass.value = props.classId
      
      // También actualizar en el store
      attendanceStore.selectedDate = formattedDate
      attendanceStore.selectedClass = props.classId
      
      await selectClass(props.classId)
    }
    // Si no tenemos fecha/clase en la URL pero sí en el query
    else if (route.query.class) {
      selectedClass.value = route.query.class as string
      attendanceStore.selectedClass = selectedClass.value
      await loadAttendanceData(selectedClass.value)
      view.value = 'attendance-form'
    }
    isLoading.value = false
    error.value = null
  } catch (err) {
    error.value = 'Error al cargar los datos iniciales'
    console.error('Error loading initial data:', err)
  } finally {
    isLoading.value = false
    loadingMessage.value = ''
  }
}

// Función para cargar datos de asistencia para una clase específica
const loadAttendanceData = async (className: string) => {
  try {
    isLoading.value = true;
    loadingMessage.value = 'Cargando datos de asistencia...';

    // Limpiar registros de asistencia previos
    attendanceStore.attendanceRecords = {};

    // Actualizar contexto en el store
    attendanceStore.selectedClass = className;
    attendanceStore.selectedDate = selectedDate.value;

    // Cargar el documento de asistencia
    await attendanceStore.fetchAttendanceDocument(selectedDate.value, className);

    // Obtener estudiantes de la clase seleccionada
    const students = studentsStore.getStudentsByClass(className);
    filteredStudents.value = students;

    // Inicializar todos los estudiantes que no tienen estado con estado 'Ausente'
    students.forEach(student => {
      if (!attendanceStore.attendanceRecords[student.id]) {
        attendanceStore.attendanceRecords[student.id] = 'Ausente';
      }
    });

    // Actualizar analytics después de cargar los datos
    await attendanceStore.updateAnalytics();
  } catch (err) {
    console.error('Error loading attendance data:', err);
  } finally {
    isLoading.value = false;
    loadingMessage.value = '';
  }
};

// Función para seleccionar una clase y cargar sus estudiantes
const selectClass = async (className: string) => {
  try {
    console.log('Seleccionando clase:', className);
    selectedClass.value = className;
    attendanceStore.selectedClass = className;
    
    // Obtener estudiantes con el método del store
    let students = studentsStore.getStudentsByClass(className);
    console.log('Estudiantes encontrados (getStudentsByClass):', students);
    
    // Fallback: si no se encontraron, buscar en todos los estudiantes comprobando otras propiedades
    if (!students.length) {
      console.warn('No se encontraron estudiantes usando getStudentsByClass, aplicando búsqueda alternativa...');
      students = studentsStore.students.filter(s =>
        // Comprobar si tienen la propiedad "clases" o "grupo" que incluye la clase
        (s.clase && (Array.isArray(s.clase) ? s.clase.includes(className) : s.clase === className)) ||
        (s.grupo && (Array.isArray(s.grupo) ? s.grupo.includes(className) : s.grupo === className))
      );
      console.log('Estudiantes encontrados con búsqueda alternativa:', students);
    }
    
    filteredStudents.value = students;
    
    const classObj = classesStore.classes.find(c => c.id === className || c.name === className)
    selectedClassName.value = classObj?.name || className
    
    // Actualizar la URL con la nueva estructura /attendance/fecha/clase
    const formattedDate = selectedDate.value.replace(/-/g, '')
    await router.push(`/attendance/${formattedDate}/${className}`);
    
    // Cargar datos de asistencia para la clase seleccionada
    await loadAttendanceData(className);
    
    // Cambiar a la vista de formulario de asistencia
    view.value = 'attendance-form';
  } catch (error) {
    console.error('Error al seleccionar clase:', error);
    errorMessage.value = 'Error al cargar los estudiantes de la clase';
  }
}

// Iniciar carga de datos al montar el componente
onMounted(fetchInitialData)

// Observar cambios en los parámetros de URL
watch(
  () => [route.params.date, route.params.classId],
  async ([newDate, newClassId]) => {
    if (newDate && newClassId) {
      // Formatear la fecha de YYYYMMDD a YYYY-MM-DD
      const dateStr = newDate as string
      const formattedDate = dateStr.length === 8
        ? `${dateStr.substring(0, 4)}-${dateStr.substring(4, 6)}-${dateStr.substring(6, 8)}`
        : dateStr
      
      selectedDate.value = formattedDate
      selectedClass.value = newClassId as string
      
      // También actualizar en el store
      attendanceStore.selectedDate = formattedDate
      attendanceStore.selectedClass = newClassId as string
      
      // Si hay un cambio real en la clase o fecha, cargar los datos
      await selectClass(newClassId as string)
    }
  }
)

// Mantener un registro local de cambios de asistencia
const pendingAttendanceChanges = ref<{studentId: string, status: AttendanceStatus}[]>([])

// Event handlers
const handleUpdateStatus = async (studentId: string, status: AttendanceStatus | 'save') => {
  console.log('Actualizando estado de asistencia:', studentId, status)
  
  // No permitir cambios si la fecha es futura
  if (!attendanceStore.validateAttendanceDate(selectedDate.value)) {
    warningMessage.value = "No se puede modificar asistencia para fechas futuras";
    return;
  }
  
  if (status === 'save') {
    const success = await saveAllAttendanceChanges();
    if (success) {
      // Limpiar la lista de cambios pendientes al guardar exitosamente
      pendingAttendanceChanges.value = [];
      showToast('Asistencia guardada correctamente', 'success');
    }
    return;
  }
  
  // Verificar si el estado anterior era "Justificado" y el nuevo no lo es
  const previousStatus = attendanceStore.attendanceRecords[studentId];
  const removingJustification = previousStatus === 'Justificado' && status !== 'Justificado';
  
  // Actualizar el estado de asistencia localmente
  attendanceStore.attendanceRecords[studentId] = status;
  
  // Si estamos quitando una justificación, asegurarnos de limpiar la justificación en el documento
  if (removingJustification && attendanceStore.currentAttendanceDoc) {
    // Filtrar la justificación del estudiante
    if (attendanceStore.currentAttendanceDoc.data.justificacion) {
      attendanceStore.currentAttendanceDoc.data.justificacion = 
        attendanceStore.currentAttendanceDoc.data.justificacion.filter(j => j.id !== studentId);
    }
    
    console.log(`Se ha eliminado la justificación del estudiante ${studentId} al cambiar su estado a ${status}`);
  }
  
  // Añadir a la lista de cambios pendientes
  const existingChange = pendingAttendanceChanges.value.findIndex(c => c.studentId === studentId);
  if (existingChange !== -1) {
    pendingAttendanceChanges.value[existingChange].status = status;
  } else {
    pendingAttendanceChanges.value.push({ studentId, status });
  }
};

// Función para guardar todos los cambios pendientes
const saveAllAttendanceChanges = async () => {
  try {
    isLoading.value = true
    loadingMessage.value = 'Guardando asistencia...'
    
    // Crear el documento de asistencia que se guardará
    const attendanceDoc = {
      fecha: selectedDate.value,
      classId: selectedClass.value,
      data: {
        presentes: [] as string[],
        ausentes: [] as string[],
        tarde: [] as string[],
        justificacion: attendanceStore.currentAttendanceDoc?.data.justificacion?.filter(j => 
          // Mantener solo justificaciones de estudiantes que siguen con estado "Justificado"
          attendanceStore.attendanceRecords[j.id] === 'Justificado'
        ) || [],
        observations: attendanceStore.currentAttendanceDoc?.data.observations || ''
      }
    };
    
    // Clasificar estudiantes según su estado de asistencia
    Object.entries(attendanceStore.attendanceRecords).forEach(([studentId, status]) => {
      if (status === 'Presente') {
        attendanceDoc.data.presentes.push(studentId);
      } else if (status === 'Ausente') {
        attendanceDoc.data.ausentes.push(studentId);
      } else if (status === 'Tardanza') {
        attendanceDoc.data.tarde.push(studentId);
      } else if (status === 'Justificado') {
        // Para justificados, agregamos a la lista de tarde
        attendanceDoc.data.tarde.push(studentId);
        
        // Verificar si ya existe una justificación para este estudiante
        const existingJustification = attendanceDoc.data.justificacion.find(j => j.id === studentId);
        
        if (!existingJustification) {
          // Si no existe justificación previa, añadir una básica
          attendanceDoc.data.justificacion.push({
            id: studentId,
            reason: 'Justificación pendiente de detalles'
          });
        }
      }
    });
    
    console.log('Guardando documento de asistencia:', attendanceDoc);
    
    // Guardar el documento
    await attendanceStore.saveAttendanceDocument(attendanceDoc);
    
    // Actualizar analytics después de guardar todos los cambios
    await attendanceStore.updateAnalytics()
    
    showToast('Asistencia guardada exitosamente');
    return true;
  } catch (err) {
    error.value = 'Error al guardar la asistencia'
    console.error('Error saving attendance:', err)
    showToast(
      'Error al guardar la asistencia: ' + (err instanceof Error ? err.message : 'Error desconocido'),
      'error'
    );
    return false;
  } finally {
    isLoading.value = false
    loadingMessage.value = ''
  }
}

const handleObservationAdded = async (observations: string) => {
  try {
    isLoading.value = true;
    loadingMessage.value = 'Guardando observación...';
    
    // Guardar las observaciones usando el método del store
    await attendanceStore.updateObservations(selectedDate.value, selectedClass.value, observations);
    
    // Mostrar mensaje de éxito
    showToast('Observación guardada correctamente', 'success');
    
    // Cerrar el modal
    showObservationsModal.value = false;
  } catch (err) {
    error.value = 'Error al actualizar las observaciones';
    console.error('Error updating observations:', err);
    showToast('Error al guardar la observación', 'error');
  } finally {
    isLoading.value = false;
    loadingMessage.value = '';
  }
}

// Función para abrir el modal de observaciones de clase
const handleOpenObservation = (student: any) => {
  selectedStudentForObs.value = student;
  showObservationsModal.value = true;
}

const handleJustificationSave = async (data: { reason: string, documentUrl?: string, file?: File }) => {
  try {
    if (!selectedStudentForJustification.value) return
    
    isLoading.value = true
    loadingMessage.value = 'Guardando justificación...'
    
    const studentId = selectedStudentForJustification.value.id;
    
    // Asegurar que el estado del estudiante sea "Justificado"
    attendanceStore.attendanceRecords[studentId] = 'Justificado';
    
    // Actualizar lista de cambios pendientes
    const existingChange = pendingAttendanceChanges.value.findIndex(c => c.studentId === studentId);
    if (existingChange !== -1) {
      pendingAttendanceChanges.value[existingChange].status = 'Justificado';
    } else {
      pendingAttendanceChanges.value.push({ studentId, status: 'Justificado' });
    }
    
    // Usar el método del store para guardar la justificación
    await attendanceStore.addJustificationToAttendance(
      studentId,
      selectedDate.value,
      selectedClass.value,
      data.reason,
      data.file || null
    )
    
    showJustifiedAbsenceModal.value = false
    
    // Mostrar mensaje de éxito
    showToast('Justificación guardada correctamente', 'success');
    
    // Recargar los datos para reflejar los cambios inmediatamente
    await loadAttendanceData(selectedClass.value);
  } catch (err) {
    error.value = 'Error al guardar la justificación'
    console.error('Error saving justification:', err)
    showToast('Error al guardar la justificación', 'error');
  } finally {
    isLoading.value = false
    loadingMessage.value = ''
  }
}

const handleGenerateReport = async (filters: typeof reportFilters.value) => {
  try {
    isLoading.value = true
    loadingMessage.value = 'Generando informe...'
    
    // Actualizar filtros locales
    reportFilters.value = { ...filters }
    
    // Cerrar modal de reporte
    showReportModal.value = false
    
    // Mostrar panel de analytics con los nuevos filtros
    showAnalytics.value = true
    
    // Actualizar analytics con los nuevos filtros
    await attendanceStore.updateAnalytics()
  } catch (err) {
    error.value = 'Error al generar el informe'
    console.error('Error generating report:', err)
  } finally {
    isLoading.value = false
    loadingMessage.value = ''
  }
}

const toggleAnalytics = () => {
  showAnalytics.value = !showAnalytics.value
  if (showAnalytics.value) {
    showTrends.value = false
  }
}

const toggleTrends = () => {
  showTrends.value = !showTrends.value
  if (showTrends.value) {
    showAnalytics.value = false
  }
}

const openReportModal = () => {
  showReportModal.value = true
}

const openExportModal = () => {
  showExportModal.value = true
}

const createNewAttendance = () => {
  selectedDate.value = getCurrentDate()
  view.value = 'class-select'
}

// Event handlers para abrir modales
const handleOpenJustification = (student: any) => {
  selectedStudentForJustification.value = student ? { id: student.id, nombre: student.nombre, apellido: student.apellido } : null
  showJustifiedAbsenceModal.value = true
}

const handleOpenExport = () => {
  showExportModal.value = true
}

// Función para manejar la selección de fecha
const handleDateChange = async (newDate: string) => {
  if (isUpdating.value) return;
  
  try {
    isUpdating.value = true;
    
    selectedDate.value = newDate;
    
    // Si la fecha es futura, mostrar advertencia
    if (!attendanceStore.validateAttendanceDate(selectedDate.value)) {
      warningMessage.value = "No se puede registrar asistencia para fechas futuras";
      return;
    }
    
    // Si hay una clase seleccionada, actualizar la URL y cargar los datos
    if (selectedClass.value) {
      const formattedDate = newDate.replace(/-/g, '');
      await router.push(`/attendance/${formattedDate}/${selectedClass.value}`);
      await loadAttendanceData(selectedClass.value);
    }
  } finally {
    setTimeout(() => {
      isUpdating.value = false;
    }, 0);
  }
}

// New reactive refs for messages
const showMessage = ref(false);
const message = ref('');
const messageType = ref<'success' | 'error'>('success');

// Function to show toast message
const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
  message.value = msg;
  messageType.value = type;
  showMessage.value = true;
  setTimeout(() => {
    showMessage.value = false;
  }, 3000);
};

// Computed for available class dates
const availableClassDates = computed(() => {
  if (!selectedClass.value) return [];
  
  try {
    // Get scheduled days for the class
    const scheduledDays = attendanceStore.getClassScheduleDays(selectedClass.value);
    
    // Debug to see what the actual value is
    console.log('Scheduled days for class:', scheduledDays);
    
    // Ensure scheduledDays is a proper array and handle edge cases
    if (!scheduledDays || !Array.isArray(scheduledDays) || scheduledDays.length === 0) {
      console.warn('No valid scheduled days found for the class:', selectedClass.value);
      return [];
    }
    
    // Get date range (current month + next month)
    const startDate = parseISO(format(new Date(), 'yyyy-MM-dd'));
    const endDate = addMonths(startDate, 1);
    
    // Get all days in range
    const allDates = eachDayOfInterval({ start: startDate, end: endDate });
    
    // Filter only the days that match class schedule - with additional error checking
    return allDates
      .filter(date => {
        const dayName = format(date, 'EEEE', { locale: es }).toLowerCase();
        return scheduledDays.includes(dayName);
      })
      .map(date => format(date, 'yyyy-MM-dd'));
  } catch (error) {
    console.error('Error in availableClassDates computed property:', error);
    return [];
  }
});

// Computed to get observations count
const getObservationsCount = computed(() => {
  if (!attendanceStore.currentAttendanceDoc) return 0;
  return attendanceStore.currentAttendanceDoc.data.observations ? 1 : 0;
});

const handleCalendarSelect = (date: string) => {
  if (isUpdating.value) return;
  
  try {
    isUpdating.value = true;
    
    selectedDate.value = date;
    
    // Si hay una clase seleccionada, actualizar datos
    if (selectedClass.value) {
      const formattedDate = date.replace(/-/g, '');
      router.push(`/attendance/${formattedDate}/${selectedClass.value}`);
      loadAttendanceData(selectedClass.value);
    } else {
      view.value = 'class-select';
    }
    
    showCalendarModal.value = false;
  } finally {
    // Usar setTimeout para romper el ciclo de actualizaciones
    setTimeout(() => {
      isUpdating.value = false;
    }, 0);
  }
}

// Computed para mostrar la fecha formateada en el título
const formattedSelectedDate = computed(() => {
  return format(parseISO(selectedDate.value), "d 'de' MMMM yyyy", { locale: es });
});

// Modificar el manejo de la fecha seleccionada para evitar bucles infinitos
const handleSelectedDateUpdate = (date) => {
  // Evitar actualizar si ya estamos en un ciclo de actualización
  if (isUpdating.value) return;
  
  isUpdating.value = true;
  // Usar setTimeout para romper el ciclo de eventos reactivos
  setTimeout(() => {
    selectedDate.value = date;
    isUpdating.value = false;
  }, 0);
};

// Método para actualizar la vista
const updateView = (newView: 'calendar' | 'class-select' | 'attendance-form') => {
  view.value = newView;
};
</script>

<template>
  <div class="p-2 sm:p-4 md:p-6 min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100">
    <!-- Toast Messages -->
    <div 
      v-if="showMessage"
      class="fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg text-white transition-all duration-300"
      :class="messageType === 'success' ? 'bg-green-500' : 'bg-red-500'"
    >
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
      class="mb-4"
    />

    <!-- Botones adicionales -->
    <div class="flex flex-wrap gap-2 mb-4">
      <button 
        @click="toggleAnalytics" 
        class="btn" 
        :class="showAnalytics ? 'btn-primary' : 'btn-secondary'"
      >
        <i class="fas fa-chart-pie mr-2"></i>
        Análisis
      </button>
      <button 
        @click="toggleTrends" 
        class="btn" 
        :class="showTrends ? 'btn-primary' : 'btn-secondary'"
      >
        <i class="fas fa-chart-line mr-2"></i>
        Tendencias
      </button>
      <button @click="openReportModal" class="btn btn-secondary">
        <i class="fas fa-file-alt mr-2"></i>
        Informe
      </button>
      <button @click="openExportModal" class="btn btn-secondary">
        <i class="fas fa-file-export mr-2"></i>
        Exportar
      </button>
    </div>

    <!-- Loading State -->
    <div v-if="isLoading" class="flex justify-center items-center py-8 sm:py-12">
      <div class="animate-spin rounded-full h-6 w-6 sm:h-8 sm:w-8 border-b-2 border-primary-600"></div>
      <span v-if="loadingMessage" class="ml-3 text-sm sm:text-base">{{ loadingMessage }}</span>
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 p-3 sm:p-4 rounded-lg mb-4 text-sm sm:text-base">
      {{ error }}
    </div>

    <!-- Main Content -->
    <div v-else class="space-y-4 sm:space-y-6">
      <!-- Panel de Analytics -->
      <AttendanceAnalytics v-if="showAnalytics" class="mb-4" />
      
      <!-- Panel de Tendencias -->
      <AttendanceTrends v-if="showTrends" class="mb-4" />

      <!-- Vista principal según el estado -->
      <div class="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-3 sm:p-4 md:p-6">
        <!-- Vista de Calendario -->
        <div v-if="view === 'calendar'" class="max-w-3xl mx-auto">
          <h2 class="text-base sm:text-lg font-semibold mb-2 sm:mb-4">Seleccionar Fecha</h2>
          <Calendar 
            :selected-date="selectedDate" 
            :marked-dates="attendanceStore.getDatesWithRecords" 
            @select="selectDate"
          />
        </div>

        <!-- Vista de Selección de Clase -->
        <div v-else-if="view === 'class-select'" class="max-w-3xl mx-auto">
          <h2 class="text-base sm:text-lg font-semibold mb-2 sm:mb-4">Seleccionar Clase</h2>
          <DateClassSelector 
            v-model="selectedClass" 
            v-model:selectedDate="selectedDate" 
            :dayFilter="true"
            @continue="() => selectClass(selectedClass)"
            :isLoading="isLoading"
            @date-change="handleDateChange"
            @update:selectedDate="handleSelectedDateUpdate"
          />
        </div>

        <!-- Vista de Lista de Asistencia -->
        <div v-else-if="view === 'attendance-form'" class="space-y-4 sm:space-y-6">
          <h2 class="text-base sm:text-lg font-semibold mb-2 sm:mb-4">
            Lista de Asistencia {{ formattedSelectedDate }}
          </h2>
          
          <!-- Sección de información y acciones -->
          <div class="flex flex-wrap justify-between items-center gap-2 mb-4">
            <!-- Botón para cambiar fecha -->
            <button 
              @click="showCalendarModal = true" 
              class="btn btn-secondary inline-flex items-center"
            >
              <CalendarDaysIcon class="w-5 h-5 mr-2" />
              Cambiar Fecha
            </button>
            
            <!-- Indicador de observaciones en la clase actual si hay -->
            <div v-if="attendanceStore.getObservations" class="flex items-center">
              <span class="text-sm text-gray-600 dark:text-gray-400 italic mr-2">
                Esta clase tiene observaciones
              </span>
              <button 
                @click="handleOpenObservation(null)" 
                class="btn btn-sm btn-info"
              >
                Ver/Editar
              </button>
            </div>
          </div>
          
          <!-- Mensaje de advertencia para fechas futuras -->
          <div v-if="!isDateEditable" class="bg-yellow-100 dark:bg-yellow-800 p-4 rounded-lg mb-4">
            <div class="flex items-center">
              <svg class="w-5 h-5 text-yellow-600 dark:text-yellow-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>
              </svg>
              <span class="text-yellow-800 dark:text-yellow-300">
                {{ warningMessage || "No se puede registrar asistencia para fechas futuras" }}
              </span>
            </div>
          </div>
          <!-- Lista de asistencia con botones deshabilitados para fechas futuras -->
          <AttendanceList 
            :students="filteredStudents" 
            :attendanceRecords="attendanceStore.attendanceRecords"
            :selectedClassName="selectedClassName"
            :isDisabled="!isDateEditable"
            :currentDate="selectedDate"
            :availableDates="availableClassDates"
            :observationsCount="getObservationsCount"
            @update-status="handleUpdateStatus"
            @open-justification="handleOpenJustification"
            @open-observation="handleOpenObservation"
            @open-export="handleOpenExport"
            @class-changed="selectClass"
            @date-changed="handleDateChange"
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

    <!-- Modal de Calendario -->
    <CalendarModal
      v-model="showCalendarModal"
      :initial-date="selectedDate"
      :marked-dates="attendanceStore.getDatesWithRecords"
      @select="handleCalendarSelect"
    />
  </div>
</template>