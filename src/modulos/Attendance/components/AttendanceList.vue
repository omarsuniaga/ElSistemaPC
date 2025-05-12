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
  (e: 'open-justification', student: Student): void;
  (e: 'open-export'): void;
  (e: 'class-changed', classId: string): void;
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
    
    // Notificar al componente padre para abrir modal de justificación
    setTimeout(() => emit('open-justification', student), 300);
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

// Store justifications separately until explicitly saved
const pendingJustifications = ref<Map<string, {reason: string, documentUrl?: string}>>(new Map());

// Modify the existing handleOpenJustification function (replacing the current one)
const handleOpenJustification = (student: Student) => {
  if (props.isDisabled) return;
  
  // Validar que el estudiante tiene datos completos
  if (!student || !student.id) {
    console.error('Error: Datos del estudiante incompletos', student);
    displayToast('Error: No se puede agregar justificación sin datos del estudiante', 'error');
    return;
  }

  // Actualizar el estado de asistencia a Justificado
  localAttendanceRecords.value[student.id] = 'Justificado';
  pendingChanges.value.add(student.id);
  
  // Guardar el estudiante seleccionado para que esté disponible en el modal
  selectedStudentForJustification.value = { 
    id: student.id, 
    nombre: student.nombre || 'Estudiante',
    apellido: student.apellido || '' 
  };
  
  // Agregar datos de fecha y clase para recuperar la justificación existente
  const dateToUse = route.params.date as string || props.date || attendanceStore.selectedDate;
  const classIdToUse = route.params.classId as string || props.initialClassId;
  
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

// Add a new function to handle saving justifications separately
const handleSaveJustification = (data: { studentId: string, reason: string, documentUrl?: string, file?: File }) => {
  // Save the justification data for later use when the entire form is saved
  pendingJustifications.value.set(data.studentId, {
    reason: data.reason,
    documentUrl: data.documentUrl
  });
  
  // Notify the user that the justification was saved but attendance changes still need to be saved
  displayToast('Justificación guardada. Recuerde guardar los cambios de asistencia.', 'info');
  
  // We don't call saveAllPendingChanges here - we just store the justification for later
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
        justificacion: existingDoc && existingDoc.length > 0 && 'data' in existingDoc[0] && existingDoc[0].data && 
                     (existingDoc[0].data as any).justificacion ? 
                      [...((existingDoc[0].data as any).justificacion as JustificationData[])] : [],
        observations: existingDoc && existingDoc.length > 0 && 'data' in existingDoc[0] && existingDoc[0].data && 
                    (existingDoc[0].data as any).observations ? 
                    ((existingDoc[0].data as any).observations as string) : ''
      }
    };    // 3. Primero preservar TODOS los estados existentes (incluso los no modificados)
    if (existingDoc && existingDoc.length > 0 && 'data' in existingDoc[0]) {
      const existingData = existingDoc[0].data as any;
      
      // Copiar todos los estados existentes como base
      if (Array.isArray(existingData.presentes)) {
        attendanceDoc.data.presentes = [...existingData.presentes];
      }
      if (Array.isArray(existingData.ausentes)) {
        attendanceDoc.data.ausentes = [...existingData.ausentes];
      }
      if (Array.isArray(existingData.tarde)) {
        attendanceDoc.data.tarde = [...existingData.tarde];
      }
      
      // Copiar también las justificaciones completas si existen
      if (Array.isArray(existingData.justificacion)) {
        attendanceDoc.data.justificacion = [...existingData.justificacion];
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

    // 4. Procesar SOLO los registros modificados (pendingChanges)
    // Esta es la clave de la corrección: solo procesar los registros que han sido
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
          attendanceDoc.data.tarde.push(studId);
        } else if (stat === 'Justificado') {
          // Primero aseguramos que esté en una categoría de ausencia para justificar (tarde o ausente)
          // Priorizamos 'ausente' para las justificaciones
          attendanceDoc.data.ausentes.push(studId);
          
          // Luego aseguramos que tenga una justificación
          const existingJustification = attendanceDoc.data.justificacion.findIndex(j => j.id === studId);
          if (existingJustification >= 0) {
            // Si ya existe una justificación, la mantenemos
          } else {            // Si no existe, creamos una nueva
            attendanceDoc.data.justificacion.push({ 
              id: studId, 
              reason: 'Justificación pendiente',
              timestamp: new Date()
            } as JustificationData);
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
            attendanceDoc.data.tarde.push(studId);
          } else if (stat === 'Justificado') {
            attendanceDoc.data.ausentes.push(studId);
            
            // Verificar si ya tiene justificación
            const existingJustification = attendanceDoc.data.justificacion.findIndex(j => j.id === studId);
            if (existingJustification < 0) {
              attendanceDoc.data.justificacion.push({
                id: studId,
                reason: 'Justificación pendiente',
                timestamp: new Date()
              } as JustificationData);
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
      ...attendanceDoc.data.tarde
    ]);
    
    console.log('Verificación final antes de guardar:', {
      totalEstudiantes: effectiveStudents.value.length,
      totalRegistros: updatedAllStudentIds.size,
      presentes: attendanceDoc.data.presentes.length,
      ausentes: attendanceDoc.data.ausentes.length,
      tarde: attendanceDoc.data.tarde.length,
      justificaciones: attendanceDoc.data.justificacion.length
    });    
    
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
        
        console.log('Registros guardados:', {
          presentes: hasData ? (docWithData.data?.presentes?.length || 0) : 0,
          ausentes: hasData ? (docWithData.data?.ausentes?.length || 0) : 0,
          tarde: hasData ? (docWithData.data?.tarde?.length || 0) : 0,
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

// Navigation handler for workspace button
const navigateToWorkspace = () => {
  router.push('/workspace');
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
    
    <div v-else>
      <!-- Header with action buttons -->
      <AttendanceHeader 
        :class-name="props.selectedClassName" 
        :pending-changes-count="pendingChangesCount"
        :is-disabled="props.isDisabled"
        :observations="attendanceStore.getObservations"
        :should-animate-observations-button="shouldAnimateObservationsButton"
        @navigate-to-workspace="navigateToWorkspace"
        @save="handleUpdateStatus('all', 'save')"
        @open-export="emit('open-export')"
        @open-observation="handleOpenObservation"
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