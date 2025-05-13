<script setup lang="ts">
import { ref, onMounted, watch, computed } from 'vue'
import type { AttendanceStatus, JustificationData } from '../types/attendance'
import type { Student } from '../../Students/types/student'
import { useClassesStore } from '../../Classes/store/classes'
import { useStudentsStore } from '../../Students/store/students'
import { useAttendanceStore } from '../store/attendance'
import { useRoute } from 'vue-router'
import { useAuthStore } from '../../../stores/auth'
import Toast from '../../../components/Toast.vue'

// Import our new components
import AttendanceHeader from './AttendanceHeader.vue'
import AttendanceSummary from './AttendanceSummary.vue'
import AttendanceTable from './AttendanceTable.vue'
import LoadingOverlay from './LoadingOverlay.vue'
import ErrorMessage from './ErrorMessage.vue'
import { DocumentArrowDownIcon, PlusIcon } from '@heroicons/vue/24/outline'


// Props y emits
const props = defineProps<{
  selectedClassName?: string;
  initialClassId?: string; // Usado para cargar datos si se accede por URL
  date?: string; // Usado para cargar datos si se accede por URL
  students?: Student[]; // Ahora opcional, con default
  attendanceRecords?: Record<string, AttendanceStatus>; // Ahora opcional, con default
  isDisabled?: boolean;
}>()

const emit = defineEmits<{
  (e: 'update-status', studentId: string, status: AttendanceStatus | 'save'): void;
  (e: 'open-observation', student: Student | null): void;
  (e: 'open-justification', student: any): void; // Usar any para resolver error de tipo
  (e: 'open-export'): void;
  (e: 'class-changed', classId: string): void;
  (e: 'navigate-to-calendar'): void;
  (e: 'navigate-to-class-selector'): void;
}>()

// Stores
const classesStore = useClassesStore();
const studentsStore = useStudentsStore();
const attendanceStore = useAttendanceStore();
const route = useRoute();

// Estado local para datos y carga
const localStudents = ref<Student[]>([]);
const localAttendanceRecords = ref<Record<string, AttendanceStatus>>({});
const isLoading = ref(false);
const errorMessage = ref<string | null>(null);

const pendingChanges = ref<Set<string>>(new Set());
const pendingJustifications = ref<Map<string, {id?: string, reason: string, documentURL?: string, timestamp?: Date}>>(new Map());
const justificationsModalOpen = ref<boolean>(false);
const currentStudent = ref<Student | null>(null);
const isProcessing = ref<boolean>(false);
const tableData = ref<Student[]>([]);
const observationsModalOpen = ref<boolean>(false);
const currentJustificationReason = ref<string>('');

// Almacén para estudiantes justificados - usamos esto para mantener el estado visual
const justifiedStudentsMap = ref<Record<string, boolean>>({});
const selectedStudentForJustification = ref<{ id: string; nombre: string; apellido: string } | null>(null);

// Estado para el toast
const showToast = ref(false);
const toastMessage = ref('');
const toastType = ref<'success' | 'error' | 'warning' | 'info'>('success');

// Computed para obtener el tamaño del set pendingChanges de forma segura
// IMPORTANTE: Definimos pendingChangesCount antes de usarlo en cualquier otro lugar
const pendingChangesCount = computed(() => {
  return pendingChanges && pendingChanges.value ? pendingChanges.value.size : 0;
});
const hasPendingChanges = computed(() => pendingChangesCount.value > 0);

// Usar props si están disponibles, de lo contrario, usar datos locales
const effectiveStudents = computed(() => {
  return props.students && props.students.length > 0 ? props.students : localStudents.value;
});

const effectiveAttendanceRecords = computed(() => {
  // Prioriza los cambios locales no guardados, luego los props, luego los datos locales cargados
  if (pendingChangesCount.value > 0) {
    return localAttendanceRecords.value;
  }
  return props.attendanceRecords && Object.keys(props.attendanceRecords).length > 0
    ? props.attendanceRecords
    : localAttendanceRecords.value;
});

// Watch para inicializar el estado local cuando cambian los attendanceRecords de las props
// y no hay cambios pendientes
watch(
  () => props.attendanceRecords,
  (newRecords) => {
    if (pendingChangesCount.value === 0 && newRecords) {
      console.log('Recibiendo nuevos registros de asistencia vía props');
      
      // Hacer una copia profunda para evitar referencias compartidas
      localAttendanceRecords.value = { ...newRecords };
      
      // Limpiar pendingChanges al recibir nuevos registros
      pendingChanges.value.clear();
      
      // Verificar si hay estudiantes sin estado de asistencia asignado
      if (props.students && props.students.length > 0) {
        let missingStudents = 0;
        let studentsWithStatus = 0;
        
        props.students.forEach(student => {
          if (!localAttendanceRecords.value[student.id]) {
            // Si no hay un estado asignado para este estudiante, lo dejamos en blanco
            // en lugar de asignar uno automáticamente
            missingStudents++;
          } else {
            studentsWithStatus++;
          }
        });
        
        // Notificar sobre el estado de los registros
        console.log(`Estado de registros de asistencia: ${studentsWithStatus} con estado, ${missingStudents} sin estado`);
        
        // Notificar si hay estudiantes sin estado de asistencia
        if (missingStudents > 0) {
          console.warn(`Advertencia: ${missingStudents} estudiantes no tienen estado de asistencia asignado`);
        }
      }
    } else if (pendingChangesCount.value > 0) {
      console.log(`No se actualizarán los registros porque hay ${pendingChangesCount.value} cambios pendientes`);
    }
  },
  { immediate: false, deep: true } // Cambiado a immediate: false para evitar la referencia temprana
);

// Watch para inicializar los estudiantes locales cuando cambian las props
// y no hay carga activa (para evitar sobrescribir datos cargados por URL)
watch(
  () => props.students,
  (newStudents) => {
    if (!isLoading.value && newStudents) {
      localStudents.value = [...newStudents];
    }
  },
  { immediate: true, deep: true }
);


const fetchDataForComponent = async (dateParam: string, classIdParam: string) => {
  // Normalizar formato de fecha si es necesario
  let normalizedDate = dateParam;
  if (dateParam && /^\d{8}$/.test(dateParam)) {
    normalizedDate = `${dateParam.substring(0, 4)}-${dateParam.substring(4, 6)}-${dateParam.substring(6, 8)}`;
  }
  try {
    isLoading.value = true;
    errorMessage.value = null;
    // Resetear estados previos
    localStudents.value = [];
    localAttendanceRecords.value = {};    console.log(`Fetching data for date: ${normalizedDate} (original: ${dateParam}), classId: ${classIdParam}`);

    // Cargar estudiantes para la clase
    const classData = await classesStore.getClassById(classIdParam);
    if (classData && classData.studentIds && classData.studentIds.length > 0) {
      if (studentsStore.students.length === 0) {
        await studentsStore.fetchStudents();
      }
      localStudents.value = studentsStore.students.filter(student =>
        classData.studentIds.includes(student.id)
      );
    } else {
      localStudents.value = [];
      console.warn(`No students found for class ${classIdParam}`);
    }    // Cargar registros de asistencia
    const records = await attendanceStore.getAttendanceByDateAndClass(normalizedDate, classIdParam);
    console.log('Registros obtenidos:', records);
    
    // Reconstruir el formato Record<string, AttendanceStatus>
    const formattedRecords: Record<string, AttendanceStatus> = {};
    
    // Limpiar pendingChanges al cargar datos nuevos
    pendingChanges.value.clear();
    
    if (records && records.length > 0) {
        // Determinar el formato de los datos recibidos
        const firstRecord = records[0] as any; // Usar any para inspección inicial
        
        // Si los datos vienen como AttendanceDocument (tienen propiedad data)
        if (firstRecord.data && 
           (Array.isArray(firstRecord.data.presentes) || 
            Array.isArray(firstRecord.data.ausentes) || 
            Array.isArray(firstRecord.data.tarde))) {
            
            console.log('Procesando datos en formato AttendanceDocument');
            
            // Procesar registros por categoría
            if (Array.isArray(firstRecord.data.presentes)) {
                firstRecord.data.presentes.forEach((id: string) => formattedRecords[id] = 'Presente');
            }
            if (Array.isArray(firstRecord.data.ausentes)) {
                firstRecord.data.ausentes.forEach((id: string) => formattedRecords[id] = 'Ausente');
            }
            if (Array.isArray(firstRecord.data.tarde)) {
                firstRecord.data.tarde.forEach((id: string) => formattedRecords[id] = 'Tardanza');
            }
            
            // Procesar justificaciones
            if (Array.isArray(firstRecord.data.justificacion)) {
                firstRecord.data.justificacion.forEach((justification: JustificationData) => {
                    if (!formattedRecords[justification.id]) { 
                        formattedRecords[justification.id] = 'Justificado';
                    } else if (formattedRecords[justification.id] === 'Tardanza' || 
                              formattedRecords[justification.id] === 'Ausente') {
                        formattedRecords[justification.id] = 'Justificado';
                    }
                });
            }        } else {
            // Si los datos vienen como un array de AttendanceRecord individuales
            console.log('Procesando datos en formato AttendanceRecord');
            
            // Recorrer cada registro y añadirlo al mapa formattedRecords
            records.forEach(record => {
                if (record.studentId && record.status) {
                    formattedRecords[record.studentId] = record.status as AttendanceStatus;
                }
            });
        }
        
        console.log('Registros formateados:', formattedRecords);
        localAttendanceRecords.value = formattedRecords;
    } else {
        localAttendanceRecords.value = {};
    }

    console.log('Data fetched:', { students: localStudents.value.length, records: Object.keys(localAttendanceRecords.value).length });

  } catch (error) {
    console.error("Error fetching data for AttendanceList:", error);
    errorMessage.value = "Error al cargar los datos de asistencia.";
  } finally {
    isLoading.value = false;
  }
};

onMounted(async () => {  let dateParam = route.params.date as string || props.date;
  
  // Formato normalizado de fecha (YYYYMMDD -> YYYY-MM-DD)
  if (dateParam && /^\d{8}$/.test(dateParam)) {
    dateParam = `${dateParam.substring(0, 4)}-${dateParam.substring(4, 6)}-${dateParam.substring(6, 8)}`;
  }
  
  const classIdParam = route.params.classId as string || props.initialClassId;

  if (dateParam && classIdParam) {
    // Solo cargar datos si las props no los proveyeron inicialmente
    const studentsProvided = props.students && props.students.length > 0;
    const recordsProvided = props.attendanceRecords && Object.keys(props.attendanceRecords).length > 0;

    if (!studentsProvided || !recordsProvided) {
      await fetchDataForComponent(dateParam, classIdParam);
    } else {
      // Si las props ya tienen datos, los usamos y actualizamos el estado local
      if (props.students) localStudents.value = [...props.students];
      if (props.attendanceRecords) localAttendanceRecords.value = { ...props.attendanceRecords };
    }
  } else {
    // Si no hay parámetros de ruta ni props iniciales, usar props si existen
     if (props.students) localStudents.value = [...props.students];
     if (props.attendanceRecords) localAttendanceRecords.value = { ...props.attendanceRecords };
     if (!props.students && !props.initialClassId) {
        console.warn("AttendanceList: No classId or students provided.");
        errorMessage.value = "No se especificó una clase para mostrar la asistencia.";
     }
  }
});

// Watch para cambios en la ruta si el componente permanece montado
watch(
  () => [route.params.date, route.params.classId],
  async ([newDate, newClassId]) => {
    if (newDate && newClassId) {
      await fetchDataForComponent(newDate.toString(), newClassId.toString());
      // Forzar actualización de datos locales
      localStudents.value = [...localStudents.value];
      localAttendanceRecords.value = {...localAttendanceRecords.value};
    }
  },
  { immediate: false, deep: true } // Cambiado a immediate: false para evitar la referencia temprana
);
watch(
  () => props.attendanceRecords,
  (newRecords) => {
    // Only update from props if no local unsaved changes AND not currently fetching data
    if (pendingChangesCount.value === 0 && !isLoading.value && newRecords) { // Added !isLoading.value
      localAttendanceRecords.value = { ...newRecords };
    }
  },
  { immediate: false, deep: true } // Cambiado a immediate: false para evitar la referencia temprana
);

// Función para mostrar el toast
const displayToast = (message: string, type: 'success' | 'error' | 'warning' | 'info' = 'success') => {
  toastMessage.value = message;
  toastType.value = type;
  showToast.value = true;
};

// Manejar actualización de estado de asistencia
const handleUpdateStatus = (studentId: string, status: string) => {
  if (studentId === 'all' && status === 'save') {
    saveAllPendingChanges();
    return;
  }
  
  if (!studentId || !status) return;
  
  // Validar que el estudiante existe
  const student = effectiveStudents.value.find(s => s.id === studentId);
  if (!student) {
    console.error(`Error: Estudiante no encontrado con ID ${studentId}`);
    displayToast(`Error: No se pudo actualizar el estado del estudiante`, 'error');
    return;
  }
  
  const previousStatus = localAttendanceRecords.value[studentId];
  
  // Solo registrar como cambio pendiente si realmente cambió el estado
  if (previousStatus !== status) {
    console.log(`Actualizando estado de estudiante ${student.nombre} ${student.apellido} (${studentId}):`, 
      previousStatus ? `${previousStatus} -> ${status}` : `ninguno -> ${status}`);
    
    // Actualizar el estado en los registros locales
    localAttendanceRecords.value[studentId] = status as AttendanceStatus;
    pendingChanges.value.add(studentId);
    
    // Actualización visual inmediata
    localAttendanceRecords.value = { ...localAttendanceRecords.value };
  } else {
    console.log(`Estado sin cambios para ${student.nombre} ${student.apellido} (${studentId}): ${status}`);
    // Si ya estaba en pendingChanges pero realmente no hubo cambio, lo eliminamos
    if (pendingChanges.value.has(studentId)) {
      pendingChanges.value.delete(studentId);
      console.log(`Eliminado de pendingChanges: ${studentId} (no hay cambio real)`);
    }
  }
  
  // Si el estudiante estaba justificado y ahora cambia a otro estado, mantener registro
  if (previousStatus === 'Justificado' && status !== 'Justificado') {
    console.log(`Cambiando estudiante ${studentId} de Justificado a ${status}`);
  }
    // Si el estudiante cambia a Justificado, abrir automáticamente el modal para justificación
  if (status === 'Justificado') {
    selectedStudentForJustification.value = { 
      id: student.id, 
      nombre: student.nombre, 
      apellido: student.apellido 
    };
    
    // Agregar el estudiante a pendingChanges para asegurar que se guarde
    pendingChanges.value.add(student.id);
    
    // Actualizar la UI
    localAttendanceRecords.value = { ...localAttendanceRecords.value };
    
    // Notificar al componente padre para abrir modal de justificación
    // Emitimos el evento con el estudiante tal cual es, sin campos adicionales
    // Esto evita errores de tipado en el sistema
    setTimeout(() => {
      // @ts-ignore - Ignoramos el error de tipo aquí ya que necesitamos emitir el evento
      emit('open-justification', student);
      
      // Guardamos información adicional en el estado local si es necesario
      const dateToUse = route.params.date as string || props.date || attendanceStore.selectedDate;
      const classIdToUse = route.params.classId as string || props.initialClassId;
      
      // Opcional: guardamos esta información en el estado si se necesita después
      console.log(`Justificación para clase: ${classIdToUse}, fecha: ${dateToUse}`);
    }, 300);
  }
  
  // Notificar al usuario sobre el cambio
  const studentName = `${student.nombre} ${student.apellido}`;
  let message = `${studentName}: ${status}`;
  
  if (status === 'Justificado') {
    message = `${studentName}: ${status} (Por favor agregue una razón)`;
  }
  
  displayToast(message, status === 'Justificado' ? 'warning' : 'info');
  
  // Notificar al componente padre del cambio de estado (si lo usa)
  emit('update-status', studentId, status as AttendanceStatus);
};

// Ya tenemos pendingJustifications declarado arriba - esta era una redeclaración duplicada

// Actualización de la función handleOpenJustification
const handleOpenJustification = (student: any) => { // usando 'any' para solucionar problemas de tipo
  if (!student || !student.id) {
    console.error('Error: Datos del estudiante incompletos para justificación', student);
    displayToast('Error: No se puede agregar justificación sin datos del estudiante', 'error');
    return;
  }

  // Marcar al estudiante como Justificado en los registros locales
  localAttendanceRecords.value[student.id] = 'Justificado';
  pendingChanges.value.add(student.id);
  
  // Actualizar también el mapa de estudiantes justificados
  justifiedStudentsMap.value[student.id] = true;
  
  // Guardar el estudiante seleccionado para que esté disponible en el modal
  selectedStudentForJustification.value = { 
    id: student.id, 
    nombre: student.nombre || 'Estudiante',
    apellido: student.apellido || '' 
  };
  
  // Agregar datos de fecha y clase para recuperar la justificación existente
  const dateToUse = route.params.date as string || props.date || attendanceStore.selectedDate;
  const classIdToUse = route.params.classId as string || props.initialClassId;
  
  // Buscar si ya existe una justificación para este estudiante
  const existingJustification = attendanceStore.getJustification(student.id);
  
  // Verificar si hay una razón guardada en pendingJustifications
  const pendingJustification = pendingJustifications.value.get(student.id);
  
  // Si ya existe una justificación pendiente para este estudiante, usarla
  if (pendingJustification) {
    console.log(`Justificación pendiente encontrada para ${student.nombre}:`, pendingJustification);
  } else if (existingJustification) {
    // Si hay una justificación existente en el store, guardarla como pendiente
    pendingJustifications.value.set(student.id, {
      reason: existingJustification.reason || '',
      documentURL: existingJustification.documentURL
    });
    console.log(`Justificación existente encontrada para ${student.nombre}:`, existingJustification);
  }
  
  // Emitir evento para abrir justificación en el componente padre con datos adicionales
  setTimeout(() => emit('open-justification', {
    ...student,
    classId: classIdToUse,
    date: dateToUse
  }), 300);
  
  // Notificar al usuario
  const studentName = student.nombre || 'Estudiante';
  displayToast(`Añadiendo justificación para ${studentName}`, 'info');
};

// Handle saving a justification separately
const handleSaveJustification = (data: { studentId: string, reason: string, documentURL?: string, file?: File }) => {
  console.log('Guardando justificación:', data);
  
  // Verificar que tenemos datos válidos
  if (!data.studentId || !data.reason) {
    displayToast('Error: Datos de justificación incompletos', 'error');
    return;
  }
  
  // Asegurarse de que el estudiante tenga estado Justificado
  if (!localAttendanceRecords.value[data.studentId] || localAttendanceRecords.value[data.studentId] !== 'Justificado') {
    localAttendanceRecords.value[data.studentId] = 'Justificado';
    pendingChanges.value.add(data.studentId);
  }
  
  // Guardar los datos de justificación para usar cuando se guarde el formulario completo
  pendingJustifications.value.set(data.studentId, {
    reason: data.reason || 'Justificación proporcionada',
    documentURL: data.documentURL
  });
  
  console.log(`Justificación registrada para estudiante ${data.studentId}:`, {
    justificacion: pendingJustifications.value.get(data.studentId),
    estado: localAttendanceRecords.value[data.studentId],
    pendiente: pendingChanges.value.has(data.studentId)
  });
  
  // Actualizar la UI inmediatamente para mostrar el estado "Justificado"
  localAttendanceRecords.value = { ...localAttendanceRecords.value };
  
  // Notificar al usuario que la justificación fue guardada pero los cambios de asistencia aún deben guardarse
  displayToast('Justificación guardada. Recuerde guardar los cambios generales de asistencia.', 'info');
};

// Función para guardar todos los cambios pendientes
const saveAllPendingChanges = async () => {
  if (pendingChangesCount.value === 0 && pendingJustifications.value.size === 0) {
    displayToast('No hay cambios pendientes para guardar', 'info');
    return;
  }

  console.log(`Guardando ${pendingChangesCount.value} cambios pendientes...`);
  displayToast(`Guardando ${pendingChangesCount.value} cambios...`, 'info');

  // 1. Validar datos esenciales antes de comenzar
  const dateToSave = route.params.date as string || props.date || attendanceStore.selectedDate || new Date().toISOString().split('T')[0];
  const classIdToSave = route.params.classId as string || props.initialClassId || attendanceStore.currentAttendanceDoc?.classId;

  if (!dateToSave || !classIdToSave) {
    displayToast('Error: Fecha o ID de clase no definidos para guardar.', 'error');
    console.error('Error: Fecha o ID de clase no definidos para guardar.', { dateToSave, classIdToSave });
    return;
  }
  // Validar que la fecha tenga formato correcto YYYY-MM-DD o YYYYMMDD
  let formattedDate = dateToSave;
  const dateRegexHyphen = /^\d{4}-\d{2}-\d{2}$/;
  const dateRegexCompact = /^\d{8}$/;
  
  // Si es formato YYYYMMDD, convertir a YYYY-MM-DD
  if (dateRegexCompact.test(dateToSave)) {
    formattedDate = `${dateToSave.substring(0, 4)}-${dateToSave.substring(4, 6)}-${dateToSave.substring(6, 8)}`;
  } else if (!dateRegexHyphen.test(dateToSave)) {
    displayToast('Error: Formato de fecha inválido', 'error');
    console.error('Error: Formato de fecha inválido', dateToSave);
    return;
  }
  
  // Reemplazar dateToSave con la versión formateada
  const dateToUse = formattedDate;

  // Validar que la clase existe
  const classData = classesStore.getClassById(classIdToSave);
  if (!classData) {
    displayToast('Error: La clase seleccionada no existe', 'error');
    console.error('Error: La clase seleccionada no existe', classIdToSave);
    return;
  }
  // 2. Preparar el documento con comprobaciones adicionales
  try {    console.log('Preparando datos para guardar asistencia:', {
      fecha: dateToUse,
      classId: classIdToSave,
      estudiantes: effectiveStudents.value.length,
      registros: Object.keys(localAttendanceRecords.value).length,
      cambiosPendientes: pendingChangesCount.value
    });

    // Recuperar el documento actual para preservar datos existentes
    const existingDoc = await attendanceStore.getAttendanceByDateAndClass(dateToUse, classIdToSave);
      const attendanceDoc = {
      fecha: dateToUse,
      classId: classIdToSave,
      teacherId: attendanceStore.currentAttendanceDoc?.teacherId || 
                classData.teacherId || 
                useAuthStore().user?.uid || '',
      timestamp: new Date(),      data: {
        presentes: [] as string[],
        ausentes: [] as string[],
        tarde: [] as string[],
        justificacion: [],
        observations: ''
      }
    };    // Registrar el contenido de las observaciones para depuración
    if (existingDoc && existingDoc.length > 0 && 'data' in existingDoc[0] && existingDoc[0].data) {
      console.log('Observaciones originales:', {
        tipo: typeof (existingDoc[0].data as any).observations,
        valor: (existingDoc[0].data as any).observations
      });
    }

    // 3. Primero preservar TODOS los estados existentes (incluso los no modificados)
    if (existingDoc && existingDoc.length > 0 && 'data' in existingDoc[0]) {
      const existingData = existingDoc[0].data as any;
      console.log('Datos existentes que se van a preservar:', existingData);
      
      // Copiar todos los estados existentes como base
      if (Array.isArray(existingData.presentes)) {
        attendanceDoc.data.presentes = [...existingData.presentes];
        console.log(`Preservando ${attendanceDoc.data.presentes.length} estudiantes presentes`);
      }
      if (Array.isArray(existingData.ausentes)) {
        attendanceDoc.data.ausentes = [...existingData.ausentes];
        console.log(`Preservando ${attendanceDoc.data.ausentes.length} estudiantes ausentes`);
      }
      if (Array.isArray(existingData.tarde)) {
        attendanceDoc.data.tarde = [...existingData.tarde];
        console.log(`Preservando ${attendanceDoc.data.tarde.length} estudiantes con tardanza`);
      }
      
      // Copiar también las justificaciones completas si existen
      if (existingData.justificacion && Array.isArray(existingData.justificacion)) {
        // Asegurarnos de que cada justificación tenga los campos necesarios
        const justificacionesValidas = existingData.justificacion.filter((j: any) => j && j.id).map((j: any) => ({
          id: j.id,
          reason: j.reason || 'Justificación registrada',
          documentURL: j.documentURL || null,
          timestamp: j.timestamp || new Date()
        }));
        
        attendanceDoc.data.justificacion = justificacionesValidas;
        console.log(`Preservando ${attendanceDoc.data.justificacion.length} justificaciones existentes`);
      } else {
        console.log('No se encontraron justificaciones previas para preservar');
      }
      
      // Asegurarnos de preservar correctamente las observaciones
      if (existingData.observations !== undefined) {
        attendanceDoc.data.observations = existingData.observations;
        console.log('Observaciones preservadas:', {
          tipo: typeof attendanceDoc.data.observations,
          valor: attendanceDoc.data.observations
        });
      }
    }

    console.log('Base de documento después de copiar existentes:', {
      presentes: attendanceDoc.data.presentes.length,
      ausentes: attendanceDoc.data.ausentes.length,
      tarde: attendanceDoc.data.tarde.length,
      justificacion: attendanceDoc.data.justificacion.length
    });

    // Guardar una copia de los IDs antes de aplicar cambios para verificar después
    const originalPresentes = new Set(attendanceDoc.data.presentes);
    const originalAusentes = new Set(attendanceDoc.data.ausentes);
    const originalTarde = new Set(attendanceDoc.data.tarde);


    // 4. Procesar las justificaciones pendientes que no están en pendingChanges
    // Es posible que el usuario sólo haya modificado la razón de justificación sin cambiar el estado
    if (pendingJustifications.value.size > 0) {
      console.log(`Procesando ${pendingJustifications.value.size} justificaciones pendientes...`);
      pendingJustifications.value.forEach((justData, studentId) => {
        // Si no está en pendingChanges pero tiene justificación pendiente,
        // necesitamos asegurarnos de que se guarde
        if (!pendingChanges.value.has(studentId)) {
          // Verificar si el estudiante ya está marcado como justificado
          if (localAttendanceRecords.value[studentId] === 'Justificado') {
            console.log(`Procesando justificación pendiente para ${studentId} que no está en pendingChanges`);
            
            // Verificar si ya existe una justificación
            const existingIndex = attendanceDoc.data.justificacion.findIndex(j => j.id === studentId);
            
            if (existingIndex >= 0) {
              // Actualizar la justificación existente
              console.log(`Actualizando justificación existente para ${studentId} con razón: ${justData.reason}`);
              attendanceDoc.data.justificacion[existingIndex].reason = justData.reason;
              if (justData.documentURL) {
                attendanceDoc.data.justificacion[existingIndex].documentURL = justData.documentURL;
              }
              // Actualizar timestamp
              attendanceDoc.data.justificacion[existingIndex].timestamp = new Date();
            } else {
              // Crear nueva justificación
              console.log(`Creando nueva justificación para ${studentId} con razón: ${justData.reason}`);
              attendanceDoc.data.justificacion.push({
                id: studentId,
                reason: justData.reason,
                documentURL: justData.documentURL,
                timestamp: new Date()
              } as JustificationData);
            }
            
            // Asegurarnos de que el estudiante esté en la lista de ausentes (requerido para justificados)
            if (!attendanceDoc.data.ausentes.includes(studentId)) {
              // Eliminar de otras listas si está presente
              attendanceDoc.data.presentes = attendanceDoc.data.presentes.filter(id => id !== studentId);
              attendanceDoc.data.tarde = attendanceDoc.data.tarde.filter(id => id !== studentId);
              // Añadir a ausentes
              attendanceDoc.data.ausentes.push(studentId);
            }
          }
        }
      });
    }

    // 5. Procesar los registros modificados (pendingChanges)
    // Ahora procesamos los registros que han sido
    // modificados por el usuario (que están en pendingChanges), manteniendo el resto intactos
    Object.entries(localAttendanceRecords.value).forEach(([studId, stat]) => {
      // Validar que el ID del estudiante existe
      if (!studId || typeof studId !== 'string') {
        console.warn('ID de estudiante inválido, omitiendo:', studId);
        return;
      }

      // Aplicar SOLO los cambios que están en pendingChanges
      if (pendingChanges.value.has(studId)) {
        console.log(`Aplicando cambio para estudiante ${studId}: ${stat}`);
        
        // Asegurarse de que el estudiante no esté en más de una lista
        // (limpieza previa para evitar inconsistencias)
        attendanceDoc.data.presentes = attendanceDoc.data.presentes.filter(id => id !== studId);
        attendanceDoc.data.ausentes = attendanceDoc.data.ausentes.filter(id => id !== studId);
        attendanceDoc.data.tarde = attendanceDoc.data.tarde.filter(id => id !== studId);
        
        // Añadir a la lista correspondiente según el estado modificado
        if (stat === 'Presente') {
          attendanceDoc.data.presentes.push(studId);
        } else if (stat === 'Ausente') {
          attendanceDoc.data.ausentes.push(studId);
        } else if (stat === 'Tardanza') {
          attendanceDoc.data.tarde.push(studId);          } else if (stat === 'Justificado') {
            // IMPORTANTE: Para estado Justificado, necesitamos ponerlo en la lista de 'ausentes'
            // De acuerdo con la implementación en attendance.ts, pero lo marcamos para restaurarlo después
            attendanceDoc.data.ausentes.push(studId);
            
            // Asegurarnos de que el estudiante no esté en presentes o tarde (para evitar inconsistencias)
            attendanceDoc.data.presentes = attendanceDoc.data.presentes.filter(id => id !== studId);
            attendanceDoc.data.tarde = attendanceDoc.data.tarde.filter(id => id !== studId);
            
            // Conservar estado para fines de UI
            // Esto es crucial para restaurar correctamente el estado visual después de guardar
            justifiedStudentsMap.value[studId] = true;
            
            // Registrar para seguimiento
            console.log(`Marcando ${studId} como justificado para restaurar después de guardar en memoria local`);
            
            // Procesar la justificación
            const existingJustification = attendanceDoc.data.justificacion.findIndex(j => j.id === studId);
            const pendingJustification = pendingJustifications.value.get(studId);
            
            if (existingJustification >= 0) {
              // Si ya existe una justificación, actualizamos su razón si hay una pendiente
              if (pendingJustification) {
                console.log(`Actualizando justificación existente para ${studId} con razón: ${pendingJustification.reason}`);
                attendanceDoc.data.justificacion[existingJustification].reason = pendingJustification.reason;
                if (pendingJustification.documentURL) {
                  attendanceDoc.data.justificacion[existingJustification].documentURL = pendingJustification.documentURL;
                }
                // Asegurarnos de que el timestamp se actualice
                attendanceDoc.data.justificacion[existingJustification].timestamp = new Date();
              }
            } else {
              // Si no existe, creamos una nueva con la razón proporcionada o una por defecto
              const justReason = pendingJustification ? pendingJustification.reason : 'Justificación pendiente';
              console.log(`Creando nueva justificación para ${studId} con razón: ${justReason}`);
              
              attendanceDoc.data.justificacion.push({ 
                id: studId, 
                reason: justReason,
                documentURL: pendingJustification?.documentURL,
                timestamp: new Date()
              } as JustificationData);
            }
            
            // Añadimos un log para verificar que la justificación quedó correctamente registrada
            const justIndex = attendanceDoc.data.justificacion.findIndex(j => j.id === studId);
            if (justIndex >= 0) {
              console.log(`Verificado: Justificación para ${studId} registrada con razón: ${attendanceDoc.data.justificacion[justIndex].reason}`);
            } else {
              console.error(`Error: No se pudo encontrar la justificación para ${studId} después de intentar crearla/actualizarla`);
            }
          }
      }
    });
      // Ya no necesitamos preservar registros existentes no modificados,
    // porque copiamos todos los estados originales al inicio y solo modificamos el que está en pendingChanges
    
    // Verificación adicional: confirmar que solo los estudiantes en pendingChanges
    // han sido modificados, el resto debe mantener su estado original
    const finalPresentes = new Set(attendanceDoc.data.presentes);
    const finalAusentes = new Set(attendanceDoc.data.ausentes);
    const finalTarde = new Set(attendanceDoc.data.tarde);
    
    // Revisar estudiantes que cambiaron de lista (deberían ser solo los de pendingChanges)
    const removedFromPresentes = [...originalPresentes].filter(id => !finalPresentes.has(id));
    const removedFromAusentes = [...originalAusentes].filter(id => !finalAusentes.has(id));
    const removedFromTarde = [...originalTarde].filter(id => !finalTarde.has(id));
    
    // Verificar que solo los IDs en pendingChanges fueron modificados
    const modifiedIds = new Set([
      ...removedFromPresentes,
      ...removedFromAusentes,
      ...removedFromTarde,
      ...[...finalPresentes].filter(id => !originalPresentes.has(id)),
      ...[...finalAusentes].filter(id => !originalAusentes.has(id)),
      ...[...finalTarde].filter(id => !originalTarde.has(id))
    ]);
    
    // Comparación para verificar
    if (modifiedIds.size !== pendingChanges.value.size) {
      console.warn(`Advertencia: El número de IDs modificados (${modifiedIds.size}) no coincide con pendingChanges (${pendingChanges.value.size})`);
    }
    
    // Actualizar los estudiantes que están en localAttendanceRecords pero no en pendingChanges
    // para asegurar que todos estén incluidos en el documento final
    Object.entries(localAttendanceRecords.value).forEach(([studId, stat]) => {
      // Solo procesar estudiantes que NO están en pendingChanges
      if (!pendingChanges.value.has(studId)) {
        // Verificar que el estudiante esté en al menos una lista
        const isInAnyList = 
          attendanceDoc.data.presentes.includes(studId) ||
          attendanceDoc.data.ausentes.includes(studId) ||
          attendanceDoc.data.tarde.includes(studId);
          
        if (!isInAnyList) {
          console.log(`Añadiendo estudiante no modificado ${studId} con estado ${stat}`);
          
          // Añadir a la lista correspondiente según su estado actual
          if (stat === 'Presente') {
            attendanceDoc.data.presentes.push(studId);
          } else if (stat === 'Ausente') {
            attendanceDoc.data.ausentes.push(studId);
          } else if (stat === 'Tardanza') {
            attendanceDoc.data.tarde.push(studId);          } else if (stat === 'Justificado') {
            attendanceDoc.data.ausentes.push(studId);
            
            // Verificar si ya tiene justificación
            const existingJustification = attendanceDoc.data.justificacion.findIndex(j => j.id === studId);
            const pendingJustification = pendingJustifications.value.get(studId);
            
            if (existingJustification < 0) {
              // Si no tiene justificación pero tenemos una pendiente, usar los datos pendientes
              if (pendingJustification) {
                attendanceDoc.data.justificacion.push({
                  id: studId,
                  reason: pendingJustification.reason,
                  documentURL: pendingJustification.documentURL,
                  timestamp: new Date()
                } as JustificationData);
              } else {
                // Si no hay justificación pendiente, crear una genérica
                attendanceDoc.data.justificacion.push({
                  id: studId,
                  reason: 'Justificación pendiente',
                  timestamp: new Date()
                } as JustificationData);
              }
            }
          }
        }
      }
    });

    // 5. Verificación final antes de guardar: solo para estudiantes verdaderamente nuevos
    // Obtener todos los estudiantes que tienen un estado asignado en el documento que estamos por guardar
    const allStudentIds = new Set([
      ...attendanceDoc.data.presentes,
      ...attendanceDoc.data.ausentes,
      ...attendanceDoc.data.tarde
    ]);
    
    // Actualizar conjunto de IDs después de las asignaciones por defecto
    const updatedAllStudentIds = new Set([
      ...attendanceDoc.data.presentes,
      ...attendanceDoc.data.ausentes,
      ...attendanceDoc.data.tarde,
      ...attendanceDoc.data.justificacion.map((j: JustificationData) => j.id)
    ]);
      console.log('Verificación final antes de guardar:', {
      totalEstudiantes: effectiveStudents.value.length,
      totalRegistros: updatedAllStudentIds.size,
      presentes: attendanceDoc.data.presentes.length,
      ausentes: attendanceDoc.data.ausentes.length,
      tarde: attendanceDoc.data.tarde.length,
      justificaciones: attendanceDoc.data.justificacion.length,
      observaciones: {
        tipo: typeof attendanceDoc.data.observations,
        valor: attendanceDoc.data.observations,
        longitud: typeof attendanceDoc.data.observations === 'string' ? attendanceDoc.data.observations.length : 'N/A'
      }
    });    
    
    // Antes de guardar, asegurémonos de registrar TODOS los estudiantes justificados
    console.log('Registrando estudiantes justificados antes de guardar:');
    const justifiedBeforeSave = new Set<string>();
    
    // 1. Estudiantes actualmente marcados como justificados en la UI
    Object.entries(localAttendanceRecords.value).forEach(([id, status]) => {
      if (status === 'Justificado') {
        justifiedBeforeSave.add(id);
        justifiedStudentsMap.value[id] = true;
        console.log(`- Desde UI: Estudiante ${id} está justificado`);
      }
    });
    
    // 2. Estudiantes con justificaciones guardadas (incluso si no están en la UI)
    attendanceDoc.data.justificacion.forEach((j: JustificationData) => {
      if (j && j.id) {
        justifiedBeforeSave.add(j.id);
        justifiedStudentsMap.value[j.id] = true;
        console.log(`- Desde justificaciones: Estudiante ${j.id} tiene justificación`);
      }
    });
    
    console.log(`Total de ${justifiedBeforeSave.size} estudiantes justificados identificados`);
    
    // 6. Guardar y verificar el resultado
    console.log('Guardando documento de asistencia:', attendanceDoc);
    try {
      await attendanceStore.saveAttendanceDocument(attendanceDoc);      
      // 7. Recargar datos para verificar que se guardaron correctamente
      console.log('Verificando resultados guardados...');
      const savedDoc = await attendanceStore.getAttendanceByDateAndClass(dateToUse, classIdToSave);
      
      if (savedDoc && savedDoc.length > 0) {
        // Verificar que los datos se guardaron correctamente
        const docWithData = savedDoc[0] as any;
        const hasData = docWithData && 'data' in docWithData;
        
        const totalSaved = hasData ? (
          (docWithData.data?.presentes?.length || 0) + 
          (docWithData.data?.ausentes?.length || 0) + 
          (docWithData.data?.tarde?.length || 0)
        ) : 0;
        
        // Verificar específicamente que las justificaciones se guardaron
        const savedJustifications = hasData ? docWithData.data?.justificacion?.length || 0 : 0;
        const expectedJustifications = pendingJustifications.value.size;
        
        if (savedJustifications < expectedJustifications) {
          console.warn(`Advertencia: Solo se guardaron ${savedJustifications} de ${expectedJustifications} justificaciones`);
        } else {
          console.log(`Justificaciones guardadas correctamente: ${savedJustifications}`);
          // Limpiar la colección de justificaciones pendientes ya que se guardaron correctamente
          pendingJustifications.value.clear();
        }
        
        // IMPORTANTE: Restaurar correctamente el estado de los alumnos justificados en la UI
        try {
          console.log('Estructura de datos recibida:', docWithData);
          
          // IMPORTANTE: Ya no reseteamos todos los estados, solo actualizamos los que cambiaron
          // 1. Recopilar todos los IDs de estudiantes justificados de diferentes fuentes
          // Este conjunto tendrá todos los estudiantes que deben aparecer como "Justificado" en la UI
          const allJustifiedStudentIds = new Set<string>();
          
          // A. Añadir estudiantes marcados como justificados durante este ciclo de edición
          Object.keys(justifiedStudentsMap.value).forEach(id => {
            if (id) allJustifiedStudentIds.add(id);
          });
          console.log(`Encontrados ${allJustifiedStudentIds.size} estudiantes justificados en la memoria persistente`);
          
          // B. Añadir estudiantes con justificaciones desde Firestore
          const justificaciones = docWithData?.data?.justificacion || [];
          justificaciones.forEach((justification: any) => {
            if (justification && justification.id) {
              allJustifiedStudentIds.add(justification.id);
            }
          });
          console.log(`Total ${allJustifiedStudentIds.size} estudiantes justificados después de consultar Firestore`);
          
          // C. Añadir estudiantes desde la variable justifiedBeforeSave (capturada antes de guardar)
          if (justifiedBeforeSave && justifiedBeforeSave.size > 0) {
            justifiedBeforeSave.forEach(id => {
              if (id) allJustifiedStudentIds.add(id);
            });
            console.log(`Añadidos ${justifiedBeforeSave.size} estudiantes justificados desde el registro previo al guardado`);
          }
          console.log(`Total final: ${allJustifiedStudentIds.size} estudiantes justificados`);
          
          // Obtener datos de Firestore para validar
          const presentes = docWithData?.data?.presentes || [];
          const tarde = docWithData?.data?.tarde || [];
          const ausentes = docWithData?.data?.ausentes || [];
          
          // SOLO ACTUALIZAR LOS ESTADOS DE LOS ESTUDIANTES QUE CAMBIARON
          // Usamos pendingChanges (que contiene los IDs de los estudiantes cuyo estado cambió)
          if (pendingChanges.value && pendingChanges.value.size > 0) {
            console.log(`Actualizando solo ${pendingChanges.value.size} estados que cambiaron:`);
            
            pendingChanges.value.forEach(studentId => {
              // Para cada estudiante que cambió, actualizar su estado según los datos de Firestore
              if (allJustifiedStudentIds.has(studentId)) {
                // Si está justificado, actualizarlo así
                localAttendanceRecords.value[studentId] = 'Justificado';
                justifiedStudentsMap.value[studentId] = true;
                console.log(`- Actualizando: ${studentId} como Justificado`);
              } else if (presentes.includes(studentId)) {
                localAttendanceRecords.value[studentId] = 'Presente';
                console.log(`- Actualizando: ${studentId} como Presente`);
              } else if (tarde.includes(studentId)) {
                localAttendanceRecords.value[studentId] = 'Tardanza';
                console.log(`- Actualizando: ${studentId} como Tardanza`);
              } else if (ausentes.includes(studentId)) {
                localAttendanceRecords.value[studentId] = 'Ausente';
                console.log(`- Actualizando: ${studentId} como Ausente`);
              }
            });
          }
          
          // Actualizar el mapa de justificados con los valores actuales
          // Solo procesamos los justificados que no están en pendingChanges
          // porque los de pendingChanges ya se actualizaron arriba
          justifiedStudentsMap.value = {}; // Reiniciamos y reconstruimos
          
          allJustifiedStudentIds.forEach(studentId => {
            if (!pendingChanges.value.has(studentId)) {
              // Solo para los que no cambiaron, actualizamos el estado
              localAttendanceRecords.value[studentId] = 'Justificado';
            }
            // Para todos los justificados, actualizamos el mapa
            justifiedStudentsMap.value[studentId] = true;
          });

          console.log('Estados actualizados selectivamente en la UI');
          console.log('Mapa final de estudiantes justificados:', Object.keys(justifiedStudentsMap.value).length);
          
          // 4. Forzar actualización de la UI
          localAttendanceRecords.value = { ...localAttendanceRecords.value };
          console.log('Estados restaurados en la UI:', localAttendanceRecords.value);
          console.log('Mapa final de estudiantes justificados:', justifiedStudentsMap.value);
        } catch (error) {
          console.error('Error al restaurar estados de la UI:', error);
          
          // En caso de error, restaurar al menos los estudiantes que sabíamos que estaban justificados
          if (justifiedBeforeSave && justifiedBeforeSave.size > 0) {
            console.log(`Recuperando ${justifiedBeforeSave.size} estudiantes justificados en caso de error`);
            
            justifiedBeforeSave.forEach(studentId => {
              if (localAttendanceRecords.value[studentId] !== 'Justificado') {
                localAttendanceRecords.value[studentId] = 'Justificado';
                justifiedStudentsMap.value[studentId] = true;
                console.log(`Restaurando en caso de error: ${studentId} como Justificado`);
              }
            });
            // Forzar actualización de UI
            localAttendanceRecords.value = { ...localAttendanceRecords.value };
          }
        }
        
        console.log('Registros guardados:', {
          presentes: hasData ? (docWithData.data?.presentes?.length || 0) : 0,
          ausentes: hasData ? (docWithData.data?.ausentes?.length || 0) : 0,
          tarde: hasData ? (docWithData.data?.tarde?.length || 0) : 0,
          justificaciones: hasData ? (docWithData.data?.justificacion?.length || 0) : 0,
          total: totalSaved,
          esperados: updatedAllStudentIds.size  // Changed from allStudentIds to updatedAllStudentIds
        });
        
        if (totalSaved < updatedAllStudentIds.size) {  // Changed from allStudentIds to updatedAllStudentIds
          console.warn('Advertencia: No todos los registros fueron guardados correctamente', {
            guardados: totalSaved,
            esperados: updatedAllStudentIds.size  // Changed from allStudentIds to updatedAllStudentIds
          });
          displayToast(`Atención: Solo se guardaron ${totalSaved} de ${updatedAllStudentIds.size} registros esperados.`, 'warning');  // Changed from allStudentIds to updatedAllStudentIds
        }
      } else {
        console.error('No se encontró el documento después de guardar');
        displayToast('Error: No se pudo verificar que los datos se guardaron correctamente', 'warning');
      }
      
      // Recargar datos y actualizar interfaz
      await attendanceStore.fetchAttendanceDocuments(); // Refrescar datos globales
      
      window.dispatchEvent(new Event('attendance-updated'));
      
      displayToast(`¡Asistencia guardada! ${pendingChangesCount.value} registro(s) actualizados.`, 'success');
      pendingChanges.value.clear();
    } catch (error) {
      console.error('Error al guardar asistencia:', error);
      displayToast(`Error al guardar. Por favor intente nuevamente.`, 'error');
    }
    
  } catch (error) {
    displayToast('Error al guardar los cambios de asistencia', 'error');
    console.error("Error al guardar los cambios de asistencia:", error);
  }
};

const handleOpenObservation = () => {
  // El prop student es Student | null, así que pasamos null
  emit('open-observation', null);
};

const getInitials = (firstName: string, lastName: string) => {
  return `${firstName?.charAt(0) ?? ''}${lastName?.charAt(0) ?? ''}`.toUpperCase();
}

const getAvatarColor = (name: string) => {
  if (!name) return 'bg-gray-500';
  const colors = [
    'bg-red-500', 'bg-blue-500', 'bg-green-500', 'bg-yellow-500',
    'bg-purple-500', 'bg-pink-500', 'bg-indigo-500'
  ];
  const hash = name.split('').reduce((acc, char) => char.charCodeAt(0) + acc, 0);
  return colors[hash % colors.length];
}

const sortedStudents = computed(() => {
  return [...effectiveStudents.value].sort((a, b) => {
    const nameA = `${a.nombre} ${a.apellido}`.toLowerCase();
    const nameB = `${b.nombre} ${b.apellido}`.toLowerCase();
    return nameA.localeCompare(nameB);
  });
});

// Funciones para marcar a todos los estudiantes con un estado específico
const markAllAsPresent = () => {
  if (!props.isDisabled) {
    effectiveStudents.value.forEach(student => {
      handleUpdateStatus(student.id, 'Presente');
    });
    
    displayToast('Todos los estudiantes marcados como presentes', 'info');
  }
};

const markAllAsAbsent = () => {
  if (props.isDisabled) return;
  
  effectiveStudents.value.forEach(student => {
    handleUpdateStatus(student.id, 'Ausente');
  });
  
  displayToast('Todos los estudiantes marcados como ausentes', 'info');
};

const markAllAsLate = () => {
  if (props.isDisabled) return;
  
  effectiveStudents.value.forEach(student => {
    handleUpdateStatus(student.id, 'Tardanza');
  });
  
  displayToast('Todos los estudiantes marcados con tardanza', 'info');
};

// Modificar la función resetAllStatuses para recuperar estados almacenados
const resetAllStatuses = async () => {
  if (props.isDisabled) return;
  
  if (confirm('¿Estás seguro de que quieres reestablecer el estado de todos los estudiantes a su último estado guardado?')) {
    try {
      isLoading.value = true;
      
      // Obtener la fecha y clase actual
      const dateToUse = route.params.date as string || props.date || attendanceStore.selectedDate;
      const classIdToUse = route.params.classId as string || props.initialClassId;
      
      if (!dateToUse || !classIdToUse) {
        displayToast('No se pudo reestablecer: información de fecha o clase no disponible', 'error');
        return;
      }
      
      // Cargar registros guardados
      const records = await attendanceStore.getAttendanceByDateAndClass(dateToUse, classIdToUse);
      
      // Crear un map con los estados guardados
      const savedStates: Record<string, AttendanceStatus> = {};
      records.forEach(record => {
        if (record.studentId && record.status) {
          savedStates[record.studentId] = record.status as AttendanceStatus;
        }
      });
      
      // Reestablecer cada estudiante a su estado guardado o eliminar si no existe
      effectiveStudents.value.forEach(student => {
        if (savedStates[student.id]) {
          // Si existe un estado guardado, usarlo
          localAttendanceRecords.value[student.id] = savedStates[student.id];
        } else {
          // Si no existe estado guardado, eliminar cualquier estado actual
          delete localAttendanceRecords.value[student.id];
        }
        // Marcar como cambio pendiente para que se pueda guardar
        pendingChanges.value.add(student.id);
      });
      
      // Actualización visual inmediata
      localAttendanceRecords.value = { ...localAttendanceRecords.value };
      displayToast('Estados de asistencia reestablecidos a la última versión guardada', 'info');
    } catch (error) {
      console.error('Error al reestablecer estados guardados:', error);
      displayToast('Error al recuperar los estados guardados', 'error');
    } finally {
      isLoading.value = false;
    }
  }
};

// Add the reset function to discard pending changes
const resetToSavedState = async () => {
  if (props.isDisabled || pendingChangesCount.value === 0) return;
  
  if (confirm('¿Estás seguro de que quieres descartar todos los cambios pendientes?')) {
    // Get the current date and class ID
    const dateToUse = route.params.date as string || props.date || attendanceStore.selectedDate;
    const classIdToUse = route.params.classId as string || props.initialClassId;
    
    if (!dateToUse || !classIdToUse) {
      displayToast('No se pudo reestablecer: información de fecha o clase no disponible', 'error');
      return;
    }
    
    try {
      isLoading.value = true;
      
      // Fetch the original data from database
      const records = await attendanceStore.getAttendanceByDateAndClass(dateToUse, classIdToUse);
      
      // Reset to the original records
      const formattedRecords: Record<string, AttendanceStatus> = {};
      records.forEach(record => {
        if (record.studentId && record.status) {
          formattedRecords[record.studentId] = record.status as AttendanceStatus;
        }
      });
      
      // Update local state
      localAttendanceRecords.value = formattedRecords;
      
      // Clear pending changes
      pendingChanges.value.clear();
      
      displayToast('Cambios descartados, estado reestablecido', 'info');
    } catch (error) {
      console.error('Error al reestablecer estado original:', error);
      displayToast('Error al reestablecer el estado original', 'error');
    } finally {
      isLoading.value = false;
    }
  }
};

// Add a computed property to check if there are any observations
const hasObservations = computed(() => {
  // Check if there are any observations in the current attendance document
  const observations = attendanceStore.getObservations;
  return observations && typeof observations === 'string' && observations.trim().length > 0;
});

// Add a computed property to decide if we should show the animation
const shouldAnimateObservationsButton = computed(() => {
  // Only animate if:
  // 1. There are no observations for the current class and date
  // 2. We have students loaded (meaning the class exists and requires attendance)
  return effectiveStudents.value.length > 0 && !hasObservations.value;
});

// Función para manejar la navegación al espacio de trabajo
const navigateToWorkspace = () => {
  // Emitir evento para navegar a la selección de clases
  emit('navigate-to-class-selector');
};
</script>

<template>
  <div class="attendance-container">
    <!-- Toast para notificaciones -->
    <Toast 
      :show="showToast" 
      :message="toastMessage" 
      :type="toastType" 
      position="top-right"
      @close="showToast = false"
    />
    
    <LoadingOverlay v-if="isLoading" message="Cargando datos de asistencia..." />
    
    <div v-else-if="errorMessage" class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
      <strong class="font-bold">Error:</strong>
      <span class="block sm:inline">{{ errorMessage }}</span>
    </div>
    
    <div>
      <!-- Header with action buttons -->
      <AttendanceHeader 
        :class-name="props.selectedClassName" 
        :pending-changes-count="pendingChangesCount"
        :is-disabled="props.isDisabled"
        :observations="attendanceStore.getObservations"
        :should-animate-observations-button="shouldAnimateObservationsButton"
        :has-observations="hasObservations"
        @navigate-to-workspace="navigateToWorkspace"
        @save="handleUpdateStatus('all', 'save')"
        @open-export="emit('open-export')"
        @open-observation="handleOpenObservation"
        @navigate-to-calendar="emit('navigate-to-calendar')"
        @navigate-to-class-selector="emit('navigate-to-class-selector')"
      />
      
      <!-- Pending changes notification and stats -->
      <AttendanceSummary 
        :attendance-records="effectiveAttendanceRecords"
        :pending-changes-count="pendingChangesCount"
        :has-pending-changes="hasPendingChanges"
        :on-save="() => handleUpdateStatus('all', 'save')"
      />
      
      <!-- Students attendance table -->
      <AttendanceTable 
        :students="effectiveStudents"
        :attendance-records="effectiveAttendanceRecords"
        :is-disabled="props.isDisabled"
        :pending-changes="pendingChanges"
        @update-status="handleUpdateStatus"
        @open-justification="handleOpenJustification"
        @mark-all-present="markAllAsPresent"
        @mark-all-absent="markAllAsAbsent"
        @mark-all-late="markAllAsLate"
        @reset-all="resetAllStatuses"
      />
    </div>
  </div>
</template>

<style>
/* Make buttons smaller on mobile */
.btn-xs {
  padding: 0.15rem 0.3rem;
  font-size: 0.7rem;
  line-height: 1.2;
}

.btn-sm {
  padding: 0.25rem 0.5rem;
  font-size: 0.75rem;
  line-height: 1.3;
}

/* Add a custom breakpoint for extra small screens */
@media (min-width: 480px) {
  .xs\:inline {
    display: inline;
  }
  .xs\:hidden {
    display: none;
  }
}

/* Enhanced responsive styles for buttons */
@media (max-width: 480px) {
  .flex-1 {
    min-width: 0;
  }
}

@media (max-width: 350px) {
  .justify-center {
    justify-content: center;
  }
  .flex-1 {
    flex-basis: 40%;
  }
}

/* Button hover animation */
button:not(:disabled) {
  transition: transform 0.15s ease-in-out, background-color 0.15s ease-in-out;
}
button:not(:disabled):hover {
  transform: translateY(-1px);
}
button:not(:disabled):active {
  transform: translateY(0);
}

/* Define button status classes that will be used by child components */
.btn-success-active {
  background-color: theme('colors.green.700');
  color: white;
  box-shadow: 0 0 0 2px theme('colors.green.300');
}

.btn-success {
  background-color: theme('colors.green.200');
  color: theme('colors.green.700');
}

.btn-success:hover {
  background-color: theme('colors.green.300');
}

.btn-danger-active {
  background-color: theme('colors.red.700');
  color: white;
  box-shadow: 0 0 0 2px theme('colors.red.300');
}

.btn-danger {
  background-color: theme('colors.red.200');
  color: theme('colors.red.700');
}

.btn-danger:hover {
  background-color: theme('colors.red.300');
}

.btn-warning-active {
  background-color: theme('colors.yellow.700');
  color: white;
  box-shadow: 0 0 0 2px theme('colors.yellow.300');
}

.btn-warning {
  background-color: theme('colors.yellow.200');
  color: theme('colors.yellow.700');
}

.btn-warning:hover {
  background-color: theme('colors.yellow.300');
}

.btn-info-active {
  background-color: theme('colors.blue.700');
  color: white;
  box-shadow: 0 0 0 2px theme('colors.blue.300');
}

.btn-info {
  background-color: theme('colors.blue.200');
  color: theme('colors.blue.700');
}

.btn-info:hover {
  background-color: theme('colors.blue.300');
}

/* Button disabled state */
button:disabled {
  cursor: not-allowed;
  opacity: 0.7;
}
</style>