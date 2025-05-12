<script setup lang="ts">
import { ref, onMounted, watch, computed } from 'vue'
import type { AttendanceStatus, JustificationData } from '../types/attendance'
import type { Student } from '../../Students/types/student'
import {
  CheckCircleIcon,
  XCircleIcon,
  ViewColumnsIcon,
  ClockIcon,
  DocumentCheckIcon,
  ChatBubbleLeftRightIcon,
  ArrowDownOnSquareIcon,  ArrowDownTrayIcon
} from '@heroicons/vue/24/outline'
import './AttendanceList.css'
import { useClassesStore } from '../../Classes/store/classes'
import { useStudentsStore } from '../../Students/store/students'
import { useAttendanceStore } from '../store/attendance'
import { useRoute } from 'vue-router'
import { useAuthStore } from '../../../stores/auth'
// import { useAttendanceState } from '../composables/useAttendanceState'
import ClassObservationBadge from './ClassObservationBadge.vue'
import Toast from '../../../components/Toast.vue'

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

// Función para guardar todos los cambios pendientes
const saveAllPendingChanges = async () => {  if (pendingChangesCount.value === 0) {
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
  
  // Emitir evento para abrir justificación en el componente padre
  emit('open-justification', student);
  
  // Notificar al usuario
  const studentName = student.nombre || 'Estudiante';
  displayToast(`Añadiendo justificación para ${studentName}`, 'info');
  
  // También emitir actualización de estado para sincronización
  emit('update-status', student.id, 'Justificado');
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
    
    <div v-if="isLoading" class="loading-overlay">
      <div class="loader"></div>
      <p>Cargando datos de asistencia...</p>
    </div>
    <div v-else-if="errorMessage" class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
      <strong class="font-bold">Error:</strong>
      <span class="block sm:inline">{{ errorMessage }}</span>
    </div>
    <div v-else>
      <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-4">
        <div class="flex items-center space-x-2">
          <h2 class="text-lg font-semibold text-gray-800 dark:text-gray-200">
            {{ props.selectedClassName || 'Lista de asistencia' }}
          </h2>
          <ClassObservationBadge 
            :observations="attendanceStore.getObservations"
            @click="handleOpenObservation"
            class="sm:text-base text-sm"
          />
        </div>
        
        <div class="flex flex-wrap justify-end gap-1 sm:gap-2 w-full sm:w-auto">
          <button 
            @click="$router.push('/workspace')"
            class="btn btn-primary btn-xs sm:btn-sm flex items-center gap-1 sm:gap-2 text-xs sm:text-sm flex-1 sm:flex-none"
          >
            <ViewColumnsIcon class="w-4 h-4 sm:w-5 sm:h-5" />
            <span class="hidden xs:inline">Area de Trabajo</span>
            <span class="xs:hidden">Área</span>
          </button>
          <button 
            class="btn btn-primary btn-xs sm:btn-sm flex items-center gap-1 sm:gap-2 text-xs sm:text-sm flex-1 sm:flex-none" 
            @click="handleUpdateStatus('all', 'save')"
            :disabled="props.isDisabled || !hasPendingChanges"
            :class="{'opacity-50 cursor-not-allowed': props.isDisabled || !hasPendingChanges}"
          >
            <ArrowDownOnSquareIcon class="w-3 h-3 sm:w-4 sm:h-4" />            <span class="hidden xs:inline">Guardar{{hasPendingChanges ? ` (${pendingChangesCount})` : ''}}</span>
            <span class="xs:hidden">Guardar{{hasPendingChanges ? ` (${pendingChangesCount})` : ''}}</span>
          </button>
          <button class="btn btn-secondary btn-xs sm:btn-sm flex items-center gap-1 sm:gap-2 text-xs sm:text-sm flex-1 sm:flex-none" @click="emit('open-export')">
            <ArrowDownTrayIcon class="w-3 h-3 sm:w-4 sm:h-4" />
            <span class="hidden xs:inline">Exportar</span>
            <span class="xs:hidden">Export</span>
          </button>
          <button 
            class="btn btn-info btn-xs sm:btn-sm flex items-center gap-1 sm:gap-2 text-xs sm:text-sm flex-1 sm:flex-none" 
            @click="handleOpenObservation"
            :disabled="props.isDisabled"
          >
            <ChatBubbleLeftRightIcon class="w-3 h-3 sm:w-4 sm:h-4" />
            <span class="hidden xs:inline">Observaciones</span>
            <span class="xs:hidden">Observaciones</span>
          </button>
        </div>
      </div>      <div v-if="hasPendingChanges" class="my-2 p-2 bg-yellow-50 border border-yellow-200 rounded-md text-sm">
        <p class="font-medium text-yellow-800 flex items-center justify-between">          <span>
            <span class="w-2 h-2 bg-amber-500 rounded-full animate-pulse inline-block mr-1"></span>
            Cambios pendientes: {{ pendingChangesCount }}
          </span>
          <button 
            @click="handleUpdateStatus('all', 'save')" 
            class="ml-2 px-2 py-1 bg-yellow-200 hover:bg-yellow-300 text-yellow-800 rounded-md">
            Guardar ahora
          </button>
        </p>
      </div>

      <!-- Resumen de asistencia -->
      <div v-if="Object.keys(localAttendanceRecords).length > 0" class="mb-4 flex flex-wrap gap-2 text-sm">
        <div class="bg-green-100 text-green-800 px-3 py-1 rounded-full">
          Presentes: {{ Object.values(localAttendanceRecords).filter(s => s === 'Presente').length }}
        </div>
        <div class="bg-red-100 text-red-800 px-3 py-1 rounded-full">
          Ausentes: {{ Object.values(localAttendanceRecords).filter(s => s === 'Ausente').length }}
        </div>
        <div class="bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full">
          Tardanzas: {{ Object.values(localAttendanceRecords).filter(s => s === 'Tardanza').length }}
        </div>
        <div class="bg-blue-100 text-blue-800 px-3 py-1 rounded-full">
          Justificados: {{ Object.values(localAttendanceRecords).filter(s => s === 'Justificado').length }}
        </div>        <div v-if="hasPendingChanges" class="bg-amber-100 text-amber-800 px-3 py-1 rounded-full flex items-center">
          <span class="w-2 h-2 bg-amber-500 rounded-full animate-pulse mr-1"></span>
          Cambios pendientes: {{ pendingChangesCount }}
        </div>
      </div>
      
      <div v-if="effectiveStudents.length === 0 && !isLoading" class="text-center py-8 bg-gray-50 dark:bg-gray-800 rounded-lg">
        <p class="text-gray-500 dark:text-gray-400">
          {{ props.selectedClassName ? `No hay estudiantes en la clase ${props.selectedClassName}` : 'No hay estudiantes para mostrar o la clase no está seleccionada.' }}
        </p>
      </div>

      <div v-else class="w-full overflow-x-auto rounded-lg">
        <table class="w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead class="bg-gray-50 dark:bg-gray-800">
            <tr>
              <th class="px-1 sm:px-4 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider w-1/2 sm:w-auto">
                Estudiante
              </th>
              <th class="px-1 sm:px-4 py-2 sm:py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider w-1/4 sm:w-auto">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody class="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
            <tr v-for="student in sortedStudents" :key="student.id" class="hover:bg-gray-50 dark:hover:bg-gray-800">
              <td class="px-1 sm:px-2 py-2 sm:py-3">
                <div class="flex items-center">
                  <div class="flex-shrink-0 h-7 w-7 sm:h-10 sm:w-10">
                    <div :class="[
                      'w-7 h-7 sm:w-10 sm:h-10 rounded-full flex items-center justify-center text-white text-xs sm:text-sm', 
                      getAvatarColor(student.nombre)
                    ]">
                      {{ getInitials(student.nombre, student.apellido) }}
                    </div>
                  </div>
                  <div class="ml-2 sm:ml-4">
                    <div class="text-xs sm:text-sm font-medium text-gray-900 dark:text-gray-100 line-clamp-2">
                      {{ student.nombre }} {{ student.apellido }}
                    </div>
                  </div>
                </div>
              </td>
              <td class="px-1 sm:px-4 py-2 sm:py-3">                <div class="flex gap-1 sm:mx-2 sm:gap-2 justify-end items-center">
                  <div v-if="pendingChanges && pendingChanges.has(student.id)" class="flex items-center" title="Cambio pendiente">
                    <span class="w-2 h-2 bg-amber-500 rounded-full animate-pulse"></span>
                  </div>
                  <button 
                    @click="handleUpdateStatus(student.id, 'Presente')"
                    :class="[
                      'btn btn-icon btn-xs sm:btn-sm p-1 sm:p-1.5',
                      localAttendanceRecords[student.id] === 'Presente' ? 'btn-success-active' : 'btn-success'
                    ]"
                    :disabled="props.isDisabled"
                    title="Presente"
                  >
                    <CheckCircleIcon class="w-3 h-3 sm:w-4 sm:h-4" />
                  </button>
                  <button 
                    @click="handleUpdateStatus(student.id, 'Ausente')"
                    :class="[

                      'btn btn-icon btn-xs sm:btn-sm p-1 sm:p-1.5',
                      localAttendanceRecords[student.id] === 'Ausente' ? 'btn-danger-active' : 'btn-danger'
                    ]"
                    :disabled="props.isDisabled"
                    title="Ausente"
                  >
                    <XCircleIcon class="w-3 h-3 sm:w-4 sm:h-4" />
                  </button>
                  <button 
                    @click="handleUpdateStatus(student.id, 'Tardanza')"
                    :class="[

                      'btn btn-icon btn-xs sm:btn-sm p-1 sm:p-1.5',
                      localAttendanceRecords[student.id] === 'Tardanza' ? 'btn-warning-active' : 'btn-warning'
                    ]"
                    :disabled="props.isDisabled"
                    title="Tardanza"
                  >
                    <ClockIcon class="w-3 h-3 sm:w-4 sm:h-4" />
                  </button>
                  <button
                    @click="handleOpenJustification(student)"
                    :class="[

                      'btn btn-icon btn-xs sm:btn-sm p-1 sm:p-1.5',
                      localAttendanceRecords[student.id] === 'Justificado' ? 'btn-info-active' : 'btn-info'
                    ]"
                    :disabled="props.isDisabled"
                    title="Justificacion"
                  >
                    <DocumentCheckIcon class="w-3 h-3 sm:w-4 sm:h-4" />
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<style>
/* stylelint-disable */
/* postcss-css-variables: true */
/* Add a custom breakpoint for extra small screens */
@media (min-width: 480px) {
  .xs\:inline {
    display: inline;
  }
  .xs\:hidden {
    display: none;
  }
}

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

/* Add overflow handling for tables */
.overflow-x-auto {
  -webkit-overflow-scrolling: touch;
  scrollbar-width: thin;
}

/* Ensure table doesn't overflow on small screens */
@media (max-width: 640px) {
  .min-w-full {
    min-width: 100%;
  }
  
  /* Make table more compact on mobile */
  table {
    table-layout: fixed;
  }
  
  /* Adjust button spacing in tight layouts */
  .btn-icon {
    min-width: 1.5rem;
    min-height: 1.5rem;
  }
    /* Improve text overflow handling */
  .line-clamp-2 {
    display: -webkit-box;
    -webkit-line-clamp: 2;
    line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }
}

/* Estilos especiales para el estado Justificado */
.btn-info-active {
  background-color: theme('colors.blue.700');
  color: white;
  box-shadow: 0 0 0 2px theme('colors.blue.300');
}

.dark .btn-info-active {
  box-shadow: 0 0 0 2px theme('colors.blue.700');
}

.btn-info {
  background-color: theme('colors.blue.200');
  color: theme('colors.blue.700');
}

.btn-info:hover {
  background-color: theme('colors.blue.300');
}

/* Estilos para estados activos */
.btn-success-active {
  background-color: theme('colors.green.700');
  color: white;
  box-shadow: 0 0 0 2px theme('colors.green.300');
}

.dark .btn-success-active {
  box-shadow: 0 0 0 2px theme('colors.green.700');
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

.dark .btn-danger-active {
  box-shadow: 0 0 0 2px theme('colors.red.700');
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

.dark .btn-warning-active {
  box-shadow: 0 0 0 2px theme('colors.yellow.700');
}

.btn-warning {
  background-color: theme('colors.yellow.200');
  color: theme('colors.yellow.700');
}

.btn-warning:hover {
  background-color: theme('colors.yellow.300');
}
</style>