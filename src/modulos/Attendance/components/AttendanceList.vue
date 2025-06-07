<script setup lang="ts">
// Importaciones de Vue y tipos
import { ref, computed, watch, onMounted, nextTick } from 'vue'
import type { JustificationData } from '../types/attendance'
import type { Student } from '../../Students/types/student'

// Definimos el tipo AttendanceStatus explícitamente para evitar problemas de importación
type AttendanceStatus = 'Presente' | 'Ausente' | 'Tardanza' | 'Justificado';

// Stores y router
import { useClassesStore } from '../../Classes/store/classes'
import { useStudentsStore } from '../../Students/store/students'
import { useAttendanceStore } from '../store/attendance'
import { useAuthStore } from '../../../stores/auth'
import { useTeachersStore } from '../../Teachers/store/teachers'
import { useRoute } from 'vue-router'

// Utilidades para exportar PDF
import { generateAttendancePDF } from '../../../utils/pdfExport'

// Importamos el composable de acciones de asistencia
import { useAttendanceActionsSimple } from '../composables/useAttendanceActionsSimple'

// Componentes
import Toast from '../../../components/Toast.vue'
import AttendanceHeader from './AttendanceHeader.vue'
import AttendanceSummary from './AttendanceSummary.vue'
import AttendanceTable from './AttendanceTable.vue'
import LoadingOverlay from './LoadingOverlay.vue'
import ErrorMessage from './ErrorMessage.vue'
import ClassObservationsModal from '../../../components/ClassObservationsModal.vue'
import JustificationModal from '../../../components/JustificationModal.vue'
import { DocumentArrowDownIcon, PlusIcon } from '@heroicons/vue/24/outline'
import AttendanceObservation from "./AttendanceObservation.vue"

// Props y emits
const props = defineProps<{
  selectedClassName?: string;
  initialClassId?: string; // Usado para cargar datos si se accede por URL
  classId?: string;      // Añadido explícitamente para evitar advertencias
  date?: string; // Usado para cargar datos si se accede por URL
  students?: Student[]; // Opcional, con default
  attendanceRecords?: Record<string, AttendanceStatus>; // Opcional, con default
  isDisabled?: boolean;
  }>()

const emit = defineEmits([
  'update:attendanceRecords',
  'open-justification',
  'update-status',
  'open-observation',
  'open-export',
  'open-attendance-report',
  'navigate-to-calendar',
  'navigate-to-class-selector',
  'saved',
  'error'
])

// Stores
const classesStore = useClassesStore();
const studentsStore = useStudentsStore();
const attendanceStore = useAttendanceStore();
const authStore = useAuthStore();
const teachersStore = useTeachersStore();
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
const observationsModalOpen = ref<boolean>(false); // Estado para controlar la visibilidad del modal de observaciones
const currentJustificationReason = ref<string>('');

// Almacén para estudiantes justificados - usamos esto para mantener el estado visual
const justifiedStudentsMap = ref<Record<string, boolean>>({});
const selectedStudentForJustification = ref<{ id: string; nombre: string; apellido: string } | null>(null);

// Estado para el toast
const showToast = ref(false);
const toastMessage = ref('');
const toastType = ref<'success' | 'error' | 'warning' | 'info'>('success');

// Estado para el modal de observaciones de asistencia
const attendanceObservationModalOpen = ref(false);

// Make sure the component is exported as default
defineExpose({});
if (import.meta.env?.PROD === false) {
  // @ts-ignore - This ensures the component has a default export
  // which helps with certain bundlers and IDE tooling
  const _default = {};
}

// Función para mostrar el toast
const displayToast = (message: string, type: 'success' | 'error' | 'warning' | 'info' = 'success') => {
  toastMessage.value = message;
  toastType.value = type;
  showToast.value = true;
};

// Función para verificar la existencia de una clase en Firestore
const verifyClassExists = async (classId: string) => {
  if (!classId) {
    console.error('No se puede verificar la existencia de una clase sin ID');
    return false;
  }
  
  try {
    console.log(`[ClassDebug] Verificando existencia de clase con ID=${classId}`);
    console.log(`[ClassDebug] Store selectedClass=${attendanceStore.selectedClass}, Route classId=${route.params.classId}`);
    
    // Primero intentamos obtener la clase del store (caché)
    const classFromStore = classesStore.getClassById(classId);
    if (classFromStore) {
      console.log(`[ClassDebug] Clase encontrada en el store con ID=${classId}:`, classFromStore);
      return true;
    } else {
      console.log(`[ClassDebug] Clase no encontrada en store con ID=${classId}`);
    }
    
    // Si no está en el store, intentamos cargar todas las clases
    console.log(`[ClassDebug] Refrescando clases desde Firestore...`);
    await classesStore.fetchClasses();
    const classAfterFetch = classesStore.getClassById(classId);
    
    if (classAfterFetch) {
      return true;
    }
    
    // Intenta con el classId alternativo del store
    if (attendanceStore.selectedClass && attendanceStore.selectedClass !== classId) {
      console.log(`[ClassDebug] Intentando con classId alternativo del store=${attendanceStore.selectedClass}`);
      const altClass = classesStore.getClassById(attendanceStore.selectedClass);
      if (altClass) {
        console.log(`[ClassDebug] Clase alternativa encontrada con ID=${attendanceStore.selectedClass}:`, altClass);
        return true;
      }
    }
    
    console.error(`[ClassDebug] Clase con ID=${classId} no encontrada en Firestore ni en el store`);
    return false;
  } catch (error) {
    console.error(`[ClassDebug] Error al verificar la existencia de la clase ${classId}:`, error);
    return false;
  }
};

// Integración con el composable de acciones de asistencia
const currentSelectedDate = computed(() => {
  return props.date || (route.params.date as string) || attendanceStore.selectedDate || '';
});

const currentSelectedClass = computed(() => {
  return props.initialClassId || (route.params.classId as string) || (route.params.id as string) || attendanceStore.selectedClass || '';
});

// Debug computed property to help identify where the class ID comes from
const debugClassIdSource = computed(() => {
  return {
    propsInitialClassId: props.initialClassId,
    routeParamsClassId: route.params.classId,
    routeParamsId: route.params.id,
    storeSelectedClass: attendanceStore.selectedClass,
    resultingValue: currentSelectedClass.value
  };
});

const attendanceActions = useAttendanceActionsSimple({
  localStudents,
  localAttendanceRecords,
  pendingChanges,
  pendingJustifications,
  displayToast,
  isProcessing,
  selectedDate: currentSelectedDate,
  selectedClass: currentSelectedClass
});

// Computed para obtener el tamaño del set pendingChanges
const pendingChangesCount = computed(() => attendanceActions.pendingChangesCount.value);
const hasPendingChanges = computed(() => attendanceActions.hasPendingChanges.value);
console.log(`[AttendanceDebug] Cambios pendientes: ${hasPendingChanges.value}`);
// Computed properties para observaciones
const hasObservations = computed(() => {
  const observations = attendanceStore.getObservations;
  return observations && typeof observations === 'string' && observations.trim().length > 0;
});

const shouldAnimateObservationsButton = computed(() => {
  // Animar botón de observaciones solo si:
  // 1. No hay observaciones para la clase y fecha actual
  // 2. Hay estudiantes cargados (significa que la clase existe y requiere asistencia)
  return effectiveStudents.value.length > 0 && !hasObservations.value;
});

// Usando props si están disponibles, de lo contrario, usando datos locales
const effectiveStudents = computed(() => {
  return props.students && props.students.length > 0 ? props.students : localStudents.value;
});

const effectiveAttendanceRecords = computed(() => {
  // PRIORIDAD CLARA DE DATOS:
  // 1. Cambios locales pendientes
  // 2. Datos cargados localmente del documento de asistencia
  // 3. Datos del store de asistencia
  // 4. Datos de props (como último recurso)

  // Registrar tamaños para depuración
  const localSize = Object.keys(localAttendanceRecords.value).length;
  const storeSize = Object.keys(attendanceStore.attendanceRecords).length;
  const propsSize = props.attendanceRecords ? Object.keys(props.attendanceRecords).length : 0;
  const pendingSize = pendingChangesCount.value;
  
  // CASO 1: Si tenemos cambios pendientes, siempre usar los datos locales
  if (pendingChangesCount.value > 0) {
    console.log(`[AttendanceDebug] PRIORIDAD 1: Usando registros locales (cambios pendientes: ${pendingChangesCount.value})`);
    return {...localAttendanceRecords.value};
  }
  
  // CASO 2: Si hay datos locales cargados (ya sea por fetchAttendanceDocument o por actualización manual)
  if (localSize > 0) {
    console.log('[AttendanceDebug] PRIORIDAD 2: Usando registros locales');
    return {...localAttendanceRecords.value};
  }

  // CASO 3: Si hay datos en el store de asistencia, usarlos y actualizar local para futuras referencias
  if (storeSize > 0) {
    console.log('[AttendanceDebug] PRIORIDAD 3: Usando registros del store');
    // Actualizar también los datos locales
    localAttendanceRecords.value = {...attendanceStore.attendanceRecords};
    
    // Forzar actualización reactiva
    setTimeout(() => {
      localAttendanceRecords.value = {...localAttendanceRecords.value};
    }, 0);
    
    return {...attendanceStore.attendanceRecords};
  }
  
  // CASO 4: Como último recurso, comprobar si las props tienen datos
  if (propsSize > 0) {
    console.log('[AttendanceDebug] PRIORIDAD 4: Usando registros de props');
    // Actualizar también los datos locales
    localAttendanceRecords.value = {...props.attendanceRecords};
    
    // Forzar actualización reactiva
    setTimeout(() => {
      localAttendanceRecords.value = {...localAttendanceRecords.value};
    }, 0);
    
    return {...props.attendanceRecords};
  }
  
  // Si no hay nada, retornar objeto vacío
  console.log('[AttendanceDebug] Sin datos disponibles, retornando objeto vacío');
  return {};
});

// Función para cargar datos para el componente
const fetchDataForComponent = async (dateParam: string, classIdParam: string) => {
  const debugEnabled = window.localStorage.getItem('attendance-debug') === 'true';
  
  if (!dateParam || !classIdParam) {
    console.warn('[AttendanceDebug] fetchDataForComponent: No hay fecha o clase para cargar datos', { date: dateParam, classId: classIdParam });
    isLoading.value = false;
    return {};
  }
  try {
    isLoading.value = true;
    errorMessage.value = null; // Clear previous errors
    
    // Verificar si ya tenemos los datos necesarios en la memoria para evitar solicitudes redundantes
    const hasCachedStudents = localStudents.value.length > 0 && 
                             localStudents.value[0]?.classId === classIdParam;
    const hasCachedAttendance = Object.keys(localAttendanceRecords.value).length > 0 &&
                               attendanceStore.selectedDate === dateParam &&
                               attendanceStore.selectedClass === classIdParam;
    
    // Actualizar los valores seleccionados en el store solo si son diferentes
    if (attendanceStore.selectedDate !== dateParam || attendanceStore.selectedClass !== classIdParam) {
      attendanceStore.selectedDate = dateParam;
      attendanceStore.selectedClass = classIdParam;
    }
    
    // Verificar si tenemos todas las clases cargadas
    if (!classesStore.classes || classesStore.classes.length === 0) {
      try {
        await classesStore.fetchClasses();
      } catch (classLoadError) {
        console.error('[AttendanceDebug] Error al cargar clases:', classLoadError);
      }
    }
    
    // Intentar obtener la información de la clase
    const classInfo = classesStore.getClassById(classIdParam);
    if (!classInfo) {
      console.error(`[AttendanceDebug] No se encontró la clase con ID=${classIdParam}`);
      
      // Intentar normalizar el ID y buscar de nuevo (por si hay problemas de formato)
      const normalizedId = classIdParam.trim();
      const alternativeClass = classesStore.classes.find(c => 
        c.id.includes(normalizedId) || normalizedId.includes(c.id)
      );
      
      if (alternativeClass) {
        console.log(`[AttendanceDebug] Se encontró una clase similar con ID=${alternativeClass.id}`);
        // Si encontramos una clase alternativa, usamos esa en su lugar
        return fetchDataForComponent(dateParam, alternativeClass.id);
      }
      
      // Si no encontramos ninguna clase, mostramos el error y continuamos
      errorMessage.value = `No se encontró la clase. Por favor, verifica el ID o selecciona otra clase.`;
      localStudents.value = [];
      localAttendanceRecords.value = {};
      isLoading.value = false;
      return {};
    }
    
    // Cargar estudiantes solo si es necesario
    let studentsInClass = [];
    
    if (!hasCachedStudents) {
      // Verificar si los estudiantes ya están en el store antes de hacer la solicitud
      if (!studentsStore.students || studentsStore.students.length === 0) {
        await studentsStore.fetchStudents();
      }
      
      // Filtrar estudiantes por clase - usando el array studentIds de la clase seleccionada
      const studentIdsInClass = classInfo.studentIds || [];
      studentsInClass = studentsStore.students?.filter(student => studentIdsInClass.includes(student.id)) || [];
      // Actualizar datos locales
      localStudents.value = [...studentsInClass];
    } else {
      studentsInClass = [...localStudents.value];
    }
    
    // Cargar asistencia solo si es necesario
    if (!hasCachedAttendance) {
      console.log('[AttendanceDebug] fetchDataForComponent: 🔄 CARGANDO DOCUMENTO DE ASISTENCIA DE FIRESTORE');
      const attendanceDoc = await attendanceStore.fetchAttendanceDocument(dateParam, classIdParam);
      
      console.log('[AttendanceListDebug] fetchDataForComponent: attendanceStore.fetchAttendanceDocument returned:', attendanceDoc);
      
      // Actualizar registros locales
      if (attendanceDoc && Object.keys(attendanceStore.attendanceRecords).length > 0) {
        localAttendanceRecords.value = {...attendanceStore.attendanceRecords};
      } else {
        // Si no hay registros, inicializar con valores por defecto
        if (studentsInClass.length > 0) {
          const defaultRecords = {};
          studentsInClass.forEach(student => {
            defaultRecords[student.id] = 'Ausente'; // Valor por defecto
          });
          localAttendanceRecords.value = defaultRecords;
          console.log('[AttendanceDebug] fetchDataForComponent: Estados predeterminados aplicados:', JSON.parse(JSON.stringify(localAttendanceRecords.value)));
        } else {
          localAttendanceRecords.value = {}; // No hay estudiantes, no hay registros
        }
      }
    } else {
      localAttendanceRecords.value = {...effectiveAttendanceRecords.value};
    }
    
    console.log('[AttendanceDebug] fetchDataForComponent: Usando datos de asistencia en caché');
      
    await nextTick(); // Asegurar que el DOM se actualice con los nuevos datos
    
    if (debugEnabled) {
      console.log('[AttendanceDebug] fetchDataForComponent: Total de registros tras cargar:', Object.keys(localAttendanceRecords.value).length);
    }
    
    return { 
      students: studentsInClass, 
      attendanceRecords: localAttendanceRecords.value 
    };

  } catch (error) {
    console.error('[AttendanceDebug] fetchDataForComponent: Error al cargar datos:', error);
    errorMessage.value = `Error al cargar datos de asistencia: ${error.message || 'Error desconocido'}`;
    return {};
  } finally {
    isLoading.value = false;
  }
};

// Optimized onMounted - reduce redundant calls and logs
onMounted(async () => {
  const debugEnabled = window.localStorage.getItem('attendance-debug') === 'true';
  
  if (debugEnabled) {
    console.log('[AttendanceDebug] ⚡ COMPONENTE MONTADO - Iniciando carga crítica de datos');
  }
  
  // Obtener la fecha y clase de todas las fuentes posibles
  let rawDate = props.date || (route.params.date as string) || attendanceStore.selectedDate;
  let dateToUse = rawDate;
  if (typeof rawDate === 'string' && rawDate.length === 8 && !rawDate.includes('-')) {
    dateToUse = `${rawDate.substring(0,4)}-${rawDate.substring(4,6)}-${rawDate.substring(6,8)}`;
    if (debugEnabled) {
      console.log(`[AttendanceDebug] onMounted: Date normalized from ${rawDate} to ${dateToUse}`);
    }
  }

  const classIdToUse = props.initialClassId || (route.params.classId as string) || (route.params.id as string) || attendanceStore.selectedClass;
  
  if (!dateToUse || !classIdToUse) {
    console.error('[AttendanceDebug] ❌ Falta fecha o clase para cargar datos en onMounted');
    isLoading.value = false;
    return;
  }
  
  if (debugEnabled) {
    console.log(`[AttendanceDebug] onMounted: 📅 Fecha=${dateToUse}, Clase=${classIdToUse}`);
  }
  
  try {
    isLoading.value = true;
    
    // Only update store if data is different (avoid redundant updates)
    if (attendanceStore.selectedDate !== dateToUse || attendanceStore.selectedClass !== classIdToUse) {
      attendanceStore.selectedDate = dateToUse;
      attendanceStore.selectedClass = classIdToUse;
    }
    
    if (debugEnabled) {
      console.log(`[AttendanceDebug] Verificando información de la clase y estudiantes`);
    }
    
    // Ejecutar ambas promesas en paralelo
    // const [classesResult, studentsResult] = await Promise.all([
    //   classesStore.fetchClasses(),
    //   studentsStore.fetchStudents()
    // ]);
    // console.log(`[AttendanceDebug] Clases y estudiantes cargados: ${classesResult.length} clases, ${studentsResult.length} estudiantes`);
    
    // consultar un metodo de Attendance store para obtener la asistencias de la clase segun classId y fecha
    const attendanceResult = await attendanceStore.fetchAttendanceDocument(dateToUse, classIdToUse);
    console.log(`[AttendanceDebug] Asistencia cargada: ${attendanceResult}`);


    // Verificar si la clase existe
    const classInfo = classesStore.getClassById(classIdToUse);
    if (!classInfo) {
      console.error(`[AttendanceDebug] No se encontró la clase con ID=${classIdToUse}`);
      errorMessage.value = `No se encontró la clase con ID ${classIdToUse}`;
      isLoading.value = false;
      return;
    }
    
    // Filtrar estudiantes de esta clase
    const allStudents = studentsStore.activeStudents;
    const studentIdsInClass = classInfo.studentIds || [];
    console.log(`[AttendanceDebug] Total estudiantes en la clase: ${studentIdsInClass.length}`);
    
    const studentsInClass = allStudents.filter(student => 
      studentIdsInClass.includes(student.id)
    );
    
    localStudents.value = [...studentsInClass];
    console.log(`[AttendanceDebug] ${studentsInClass.length} estudiantes cargados para la clase`);
    
    // PASO 3: PRIORIDAD DE FUENTES DE DATOS
    console.log(`[AttendanceDebug] Cargando datos de asistencia para fecha=${dateToUse}, clase=${classIdToUse}`);
    
    // Limpiar datos antiguos antes de cargar nuevos para evitar mezclas
    // localAttendanceRecords.value = {}; // Comentado para evitar borrar datos válidos
    
    // 1. PRIORIDAD: Props (si existen)
    const propsRecords = props.attendanceRecords || {};
    const propsSize = Object.keys(propsRecords).length;
    console.log(`[AttendanceDebug] ✓ REGISTROS DE PROPS DISPONIBLES: ${propsSize}`);
    
    // 2. PRIORIDAD: Store (si existen)
    const storeRecords = attendanceStore.attendanceRecords || {};
    const storeSize = Object.keys(storeRecords).length;
    console.log(`[AttendanceDebug] ✓ REGISTROS DEL STORE DISPONIBLES: ${storeSize}`);
    
    // Establecer prioridad clara: Props > Store > Firebase
    if (propsSize > 0) {
      console.log('[AttendanceDebug] ✓ USANDO REGISTROS DE PROPS COMO FUENTE PRINCIPAL');
      localAttendanceRecords.value = { ...propsRecords };
    } else if (storeSize > 0) {
      console.log('[AttendanceDebug] ✓ USANDO REGISTROS DEL STORE COMO FUENTE PRINCIPAL');
      localAttendanceRecords.value = { ...storeRecords };
    }
    
    // PASO 4: Cargar documento de asistencia desde Firebase como último recurso
    // Solo cargar de Firebase si no tenemos datos de props o store, o si forzamos recarga
    if (propsSize === 0 && storeSize === 0) {
      console.log('[AttendanceDebug] 🔄 CARGANDO DOCUMENTO DE ASISTENCIA DE FIRESTORE (onMounted)');
      const attendanceDoc = await attendanceStore.fetchAttendanceDocument(dateToUse, classIdToUse, true); // Force reload
      
      if (attendanceDoc) {
        console.log('[AttendanceDebug] ✓ DOCUMENTO ENCONTRADO EN FIRESTORE (onMounted):', attendanceDoc);
        // Actualizar localAttendanceRecords con los datos frescos del store (que fetchAttendanceDocument actualiza)
        localAttendanceRecords.value = { ...attendanceStore.attendanceRecords as Record<string, AttendanceStatus> };
      } else if (Object.keys(localAttendanceRecords.value).length === 0) {
        console.log('[AttendanceDebug] ⚠️ NO HAY DOCUMENTO DE ASISTENCIA (onMounted) - INICIALIZANDO ESTADOS PREDETERMINADOS SI ES NECESARIO');
        // Opcional: Inicializar con "Ausente" para todos los estudiantes si se desea un estado predeterminado
        const defaultAttendance = {};
        studentsInClass.forEach(student => {
          defaultAttendance[student.id] = 'Ausente';
        });
        localAttendanceRecords.value = defaultAttendance;
      }
    } else {
      console.log('[AttendanceDebug] Usando datos de Props o Store, no se carga de Firebase en onMounted a menos que se fuerce.');
    }
    
    // PASO 5: ASEGURAR SINCRONIZACIÓN BIDIRECCIONAL
    // Asegurarse de que el store tenga los mismos datos que el componente local
    // (Importante para continuidad entre vistas)
    if (Object.keys(localAttendanceRecords.value).length > 0 && 
        JSON.stringify(localAttendanceRecords.value) !== JSON.stringify(attendanceStore.attendanceRecords)) {
      console.log('[AttendanceDebug] Sincronizando localAttendanceRecords con attendanceStore.attendanceRecords en onMounted');
      attendanceStore.attendanceRecords = { ...localAttendanceRecords.value };
    }
    
    // PASO 6: Forzar actualización del renderizado utilizando nextTick
    await nextTick();
    console.log('[AttendanceDebug] Total de registros tras cargar (onMounted):', Object.keys(localAttendanceRecords.value).length);
    
    // Un doble-check final con timeout para asegurar renderizado
    if (Object.keys(localAttendanceRecords.value).length > 0) {
      setTimeout(() => {
        console.log('[AttendanceDebug] Comprobando estado final de los registros (onMounted)');
        const recordCount = Object.keys(localAttendanceRecords.value).length;
        console.log(`[AttendanceDebug] Registros finales (onMounted): ${recordCount}`);
        
        if (recordCount === 0 && studentsInClass.length > 0) {
          console.warn('[AttendanceDebug] ALERTA: No se cargaron registros de asistencia pero hay estudiantes en la clase.');
        }
      }, 100);
    }
    // resetAllStatuses(); // Comentado para prueba: Podría estar borrando los estados cargados
  } catch (error) {
    console.error('[AttendanceDebug] Error en la inicialización del componente (onMounted):', error);
    errorMessage.value = 'Error al inicializar el componente de asistencia';
  } finally {
    isLoading.value = false;
    console.log('[AttendanceDebug] ✅ Finalizada carga crítica de datos (onMounted)');
  }
});

// Control de debounce para el watcher principal
const isWatcherProcessing = ref(false);
const lastProcessedValues = ref({ date: '', classId: '' });

// Función para normalizar fechas si están en formato YYYYMMDD
const normalizeDate = (dateStr: string) => {
  if (typeof dateStr === 'string' && dateStr.length === 8 && !dateStr.includes('-')) {
    return `${dateStr.substring(0,4)}-${dateStr.substring(4,6)}-${dateStr.substring(6,8)}`;
  }
  return dateStr;
};

// Inicializar cuando cambian las props - con mejor control de redundancia
watch(
  () => [props.date, props.initialClassId, route.params.date, route.params.classId, attendanceStore.selectedDate, attendanceStore.selectedClass],
  async (newValues) => {
    const debugEnabled = window.localStorage.getItem('attendance-debug') === 'true';
    const [propDate, propClassId, routeParamDate, routeParamClassId, storeDate, storeClassId] = newValues;

    // Determinar los valores finales con prioridad clara y asegurar que sean string
    const rawDateValue = propDate || routeParamDate || storeDate || '';
    const finalDate = normalizeDate(rawDateValue as string);
    const finalClassId = (propClassId || routeParamClassId || storeClassId || '') as string;

    if (debugEnabled) {
      console.log(`[AttendanceList Watcher] Valores efectivos: fecha='${finalDate}', claseId='${finalClassId}'`);
    }
    
    // Prevenir llamadas redundantes - comprobar si los datos realmente cambiaron
    if (finalDate === lastProcessedValues.value.date && 
        finalClassId === lastProcessedValues.value.classId) {
      if (debugEnabled) {
        console.log('[AttendanceDebug] Watcher: Valores idénticos a los últimos procesados, omitiendo actualización.');
      }
      return; // Omitir si no hay cambio real
    }
    
    // Prevenir múltiples ejecuciones simultáneas
    if (isWatcherProcessing.value) {
      if (debugEnabled) {
        console.log('[AttendanceDebug] Watcher: Ya hay una actualización en proceso, omitiendo llamada paralela.');
      }
      return;
    }
    
    // Verificar que tengamos valores válidos
    if (!finalDate || !finalClassId) {
      if (debugEnabled) {
        console.log('[AttendanceDebug] Watcher: Fecha o ID de clase inválidos. Esperando parámetros válidos.');
      }
      return;
    }
    
    try {
      isWatcherProcessing.value = true;
      isLoading.value = true;
      
      // Actualizar cache de valores procesados
      lastProcessedValues.value = { date: finalDate, classId: finalClassId };
      
      // Verificar que la clase existe asegurando que finalClassId es string
      const classExists = await verifyClassExists(finalClassId as string);
      
      if (classExists) {
        // Fecha válida y clase existente, procedemos a cargar datos
        const result = await fetchDataForComponent(finalDate as string, finalClassId as string);
        
        if (debugEnabled && result) {
          console.log(`[AttendanceDebug] Watcher: Datos cargados correctamente. Estudiantes: ${result.students?.length || 0}, Registros: ${Object.keys(result.attendanceRecords || {}).length}`);
        }
      } else {
        console.error(`[AttendanceDebug] Watcher: No se encontró la clase con ID=${finalClassId}`);
        errorMessage.value = `No se encontró la clase con ID=${finalClassId}`;
        localStudents.value = [];
        localAttendanceRecords.value = {};
      }
    } catch (error) {
      console.error('[AttendanceDebug] Watcher: Error al verificar la clase:', error);
      errorMessage.value = 'Error al verificar información de la clase';
    } finally {
      isLoading.value = false;
      
      // Permitir que el watcher procese nuevos cambios después de un pequeño delay
      // Esto evita múltiples actualizaciones consecutivas
      setTimeout(() => {
        isWatcherProcessing.value = false;
      }, 300); // Debounce de 300ms
    }
  },
  { immediate: true } // Ejecutar inmediatamente, pero sin deep:true para evitar recursiones innecesarias
);

// Watch mejorado para sincronizar cambios en attendanceRecords
watch(
  [
    () => props.attendanceRecords, 
    () => attendanceStore.attendanceRecords
  ],
  (newValues, oldValues) => {
    const propsRecords = newValues[0];
    const storeRecords = newValues[1];

    const oldPropsRecords = oldValues ? oldValues[0] : undefined;
    const oldStoreRecords = oldValues ? oldValues[1] : undefined;

    console.log('[AttendanceDebug] 🔍 WATCH DETECTÓ CAMBIOS EN REGISTROS');
    
    // No hacer nada si tenemos cambios locales pendientes para evitar sobreescribirlos
    if (pendingChangesCount.value > 0) {
      console.log(`[AttendanceDebug] ⚠️ PROTECCIÓN DE CAMBIOS: Ignorando cambios externos porque hay ${pendingChangesCount.value} cambios pendientes`);
      return;
    }
    
    // Función para verificar cambios reales comparando objetos
    const hasRealChanges = (newObj: any, oldObj: any) => {
      // Si alguno es undefined o null, considerar cambio si son diferentes
      if (!newObj || !oldObj) return newObj !== oldObj;
      
      // Comparar tamaños
      const newKeys = Object.keys(newObj);
      const oldKeys = Object.keys(oldObj || {});
      if (newKeys.length !== oldKeys.length) return true;
      
      // Verificar si algún valor cambió
      return newKeys.some(key => newObj[key] !== oldObj?.[key]);
    };
    
    // Obtener dimensiones para toma de decisiones
    const localSize = Object.keys(localAttendanceRecords.value).length;
    const storeSize = storeRecords ? Object.keys(storeRecords).length : 0;
    const propsSize = propsRecords ? Object.keys(propsRecords).length : 0;
    
    // CASO 1: Cambios en props con contenido significativo
    const hasPropsChanges = propsRecords && hasRealChanges(propsRecords, oldPropsRecords);
    
    if (hasPropsChanges && propsSize > 0) {
      console.log(`[AttendanceDebug] 📥 ACTUALIZACIÓN DESDE PROPS: ${propsSize} registros`);
      
      // IMPORTANTE: Solo actualizar si props tiene más datos o si no tenemos datos locales
      if (propsSize > localSize || localSize === 0) {
        localAttendanceRecords.value = { ...propsRecords };
        
        // Sincronizar con store si es necesario
        if (propsSize > storeSize) {
          attendanceStore.attendanceRecords = { ...propsRecords };
          console.log('[AttendanceDebug] ↗️ Sincronizando store desde props');
        }
        
        // Forzar actualización
        setTimeout(() => {
          localAttendanceRecords.value = { ...localAttendanceRecords.value };
        }, 0);
      }
      return;
    }
    
    // CASO 2: Cambios en store con contenido significativo
    const hasStoreChanges = storeRecords && hasRealChanges(storeRecords, oldStoreRecords);
    
    if (hasStoreChanges && storeSize > 0) {
      console.log(`[AttendanceDebug] 🗄️ ACTUALIZACIÓN DESDE STORE: ${storeSize} registros`);
      
      // IMPORTANTE: Solo actualizar si store tiene más datos o no tenemos datos locales
      if (storeSize > localSize || localSize === 0) {
        localAttendanceRecords.value = { ...storeRecords };
        // Forzar actualización reactiva si es necesario, aunque la asignación a ref debería ser suficiente
        // setTimeout(() => { localAttendanceRecords.value = { ...localAttendanceRecords.value }; }, 0);
      } else if (localSize > storeSize) {
        // Opcional: si local tiene más datos, podría ser una desincronización
        // console.warn('[AttendanceDebug] Conflicto potencial: Store tiene menos datos que local. Se mantienen datos locales.');
      }
    }
  },
  { immediate: true, deep: true }
);

// Función para refrescar datos de asistencia desde Firebase
const refreshAttendanceData = async () => {
  try {
    displayToast('Actualizando datos de asistencia...', 'info');
    
    // Obtener la fecha y clase actual
    const dateToUse = route.params.date as string || props.date || attendanceStore.selectedDate;
    const classIdToUse = route.params.classId as string || route.params.id as string || props.initialClassId || attendanceStore.selectedClass;
    
    if (!dateToUse || !classIdToUse) {
      displayToast('Error: No hay fecha o clase seleccionada', 'error');
      return;
    }
    
    console.log(`[AttendanceDebug] Refrescando datos para fecha=${dateToUse}, clase=${classIdToUse}`);
    
    // Forzar recarga desde Firebase
    await attendanceStore.fetchAttendanceDocument(dateToUse, classIdToUse);
    
    // Actualizar datos locales con los nuevos datos del store
    localAttendanceRecords.value = { ...attendanceStore.attendanceRecords as Record<string, AttendanceStatus> };
    
    displayToast('Datos actualizados correctamente', 'success');
  } catch (error) {
    console.error('[AttendanceDebug] Error al refrescar datos:', error);
    displayToast('Error al actualizar datos', 'error');
  }
};

// Watch para inicializar estudiantes locales cuando cambian props
watch(
  () => props.students,
  (newStudents) => {
    console.log('[AttendanceDebug] Watch detectó cambio en props.students:', 
      newStudents ? `Estudiantes: ${newStudents.length}` : 'No hay estudiantes');
    
    if (newStudents) {
      // Siempre actualizar estudiantes locales cuando cambian props, incluso si está cargando
      localStudents.value = [...newStudents];
      
      // Si hay registros de asistencia cargados, verificar que todos los estudiantes tengan un estado
      if (Object.keys(localAttendanceRecords.value).length > 0) {
        console.log('[AttendanceDebug] Verificando estados de asistencia para nuevos estudiantes');
        
        // Identificar estudiantes sin estado de asistencia
        const studentsWithoutStatus = newStudents.filter(student => 
          !localAttendanceRecords.value[student.id]
        );
        
        if (studentsWithoutStatus.length > 0) {
          console.log(`[AttendanceDebug] ${studentsWithoutStatus.length} estudiantes sin estado de asistencia`);
          
          // Forzar actualización de la UI después de un retraso mínimo
          setTimeout(() => {
            console.log('[AttendanceDebug] Actualizando UI tras cambio en estudiantes');
            localAttendanceRecords.value = { ...localAttendanceRecords.value };
          }, 0);
        }
      }
    }
  },
  { immediate: true, deep: true }
);

// Función para obtener el estado actual de un estudiante
const getStudentStatus = (studentId: string): AttendanceStatus | undefined => {
  return localAttendanceRecords.value?.[studentId];
};

// Validar estados de asistencia antes de guardar
const validateAttendanceStates = () => {
  let valid = true;
  const invalidStudents: string[] = [];
  const missingStatusStudents: string[] = [];
  
  // Verificar que todos los estudiantes en la lista tengan un estado y que sea válido
  localStudents.value.forEach(student => {
    const status = getStudentStatus(student.id);
    
    // Verificar si el estudiante tiene un estado definido
    if (status === undefined) {
      missingStatusStudents.push(student.id);
      console.warn(`[AttendanceDebug] Estudiante ${student.id} sin estado definido`);
    } else if (!['Presente', 'Ausente', 'Tardanza', 'Justificado'].includes(status)) {
      // Si tiene estado pero no es válido
      valid = false;
      invalidStudents.push(student.id);
      console.error(`[AttendanceDebug] Estado inválido para estudiante ${student.id}: ${status}`);
    }
    
    // Si está justificado, verificar que tenga una justificación
    if (status === 'Justificado' && !pendingJustifications.value.has(student.id)) {
      console.warn(`[AttendanceDebug] Estudiante ${student.id} marcado como justificado pero sin justificación`);
      // Crear justificación vacía para evitar problemas
      pendingJustifications.value.set(student.id, {
        reason: 'Justificación pendiente',
        timestamp: new Date(),
      });
    }
  });
  
  // Si hay estudiantes sin estado, notificar al usuario
  if (missingStatusStudents.length > 0) {
    displayToast(
      `Hay ${missingStatusStudents.length} estudiante(s) sin un estado registrado. 
      Por favor, marque la asistencia para todos los estudiantes antes de guardar.`, 
      'warning'
    );
    valid = false;
  }
  
  return { valid, invalidStudents, missingStatusStudents };
};

const handleUpdateStatus = (studentId: string, status: string) => {
  if (studentId === 'all' && status === 'save') {
    // Validar estados antes de guardar
    const { valid, invalidStudents, missingStatusStudents } = validateAttendanceStates();
    
    if (!valid && invalidStudents.length > 0) {
      console.error(`[AttendanceDebug] Se encontraron ${invalidStudents.length} estudiantes con estados inválidos`);
      displayToast(`Error: Hay ${invalidStudents.length} estudiantes con estados inválidos`, 'error');
      return;
    }
    
    // Si solo hay estudiantes sin estado asignado, mostrar advertencia pero permitir guardar
    if (!valid && missingStatusStudents.length > 0 && invalidStudents.length === 0) {
      const message = `ADVERTENCIA: Hay ${missingStatusStudents.length} estudiante(s) sin estado asignado. ¿Desea continuar?`;
      if (!confirm(message)) {
        return;
      }
      console.warn(`[AttendanceDebug] Guardando a pesar de ${missingStatusStudents.length} estudiantes sin estado`);
    }
    
    // Guardar todos los cambios pendientes
    const dateToSave = route.params.date as string || props.date || attendanceStore.selectedDate || '';
    const classIdToSave = route.params.classId as string || route.params.id as string || props.initialClassId as string || '';
    
    console.log(`[AttendanceDebug] Guardando cambios para fecha=${dateToSave}, clase=${classIdToSave}`);
    console.log(`[AttendanceDebug] Total cambios pendientes: ${pendingChanges.value.size}`);
    
    // Asegurar que guardamos todos los cambios pendientes en Firestore
    displayToast('Guardando cambios en la base de datos...', 'info');
    attendanceActions.saveAllPendingChanges();
    return;
  }
  
  // Delegar al composable para actualizar estado
  // Cast the status string to AttendanceStatus type to match the expected parameter type
  attendanceActions.updateStudentStatus(studentId, status as AttendanceStatus);
  
  // Si el estudiante estaba justificado y ahora cambia a otro estado, mantener registro
  const previousStatus = localAttendanceRecords.value[studentId];
  if (previousStatus === 'Justificado' && status !== 'Justificado') {
    console.log(`Cambiando estudiante ${studentId} de Justificado a ${status}`);
  }
  
  // Si el estudiante cambia a Justificado, manejar la justificación
  if (status === 'Justificado') {
    handleOpenJustification({
      id: studentId,
      ...localStudents.value.find(s => s.id === studentId)
    }
  );
  } 
  
  if (pendingChangesCount.value > 0) {
    console.log(`[AttendanceList] Cambios pendientes: ${pendingChangesCount.value}. Esperando acción de guardar.`);
    // Ya no guardamos automáticamente, esperamos a que se presione el botón de guardar
    // Esto permite acumular múltiples cambios antes de enviar a Firestore
  }
};

// Función para gestionar la apertura del modal de justificación
const handleOpenJustification = async (student: any) => {
  try {
    // abrir modal de justificación
    console.log('[Justificación] Abriendo modal de justificación');
    console.log('[Justificación] Iniciando proceso de justificación para estudiante:', student);
        
    // Verificar si tenemos toda la información necesaria
    if (!student || !student.id) {
      console.error('[Justificación] Error: Datos de estudiante inválidos', student);
      displayToast('Error: Datos de estudiante inválidos', 'error');
      return;
    }

    // Obtener la fecha y clase actual
    const dateToUse = route.params.date as string || props.date || attendanceStore.selectedDate;
    const classIdToUse = route.params.classId as string || route.params.id as string || props.initialClassId || attendanceStore.selectedClass;

    if (!dateToUse || !classIdToUse) {
      console.error('[Justificación] Error: Fecha o clase no disponible', {
        date: dateToUse,
        classId: classIdToUse
      });
      displayToast('Error: Información de fecha o clase no disponible', 'error');
      return;
    }

    // Actualizar el estado local
    selectedStudentForJustification.value = {
      id: student.id,
      nombre: student.nombre || 'Estudiante',
      apellido: student.apellido || ''
    };

    console.log('[Justificación] Estado local actualizado:', selectedStudentForJustification.value);

    // Marcar al estudiante como justificado en el mapa local
    justifiedStudentsMap.value[student.id] = true;

    // Actualizar el estado de asistencia local a 'Justificado'
    if (localAttendanceRecords.value) {
      const previousStatus = localAttendanceRecords.value[student.id];
      localAttendanceRecords.value[student.id] = 'Justificado';
      console.log(`[Justificación] Estado de asistencia actualizado localmente de ${previousStatus} a Justificado`);

      // Si el estudiante no tenía un estado previo o era diferente de 'Justificado',
      // agregarlo a los cambios pendientes
      if (!previousStatus || previousStatus !== 'Justificado') {
        pendingChanges.value.add(student.id);
        console.log('[Justificación] Cambio pendiente registrado');
        
        // Crear una justificación pendiente si no existe
        if (!pendingJustifications.value.has(student.id)) {
          pendingJustifications.value.set(student.id, {
            reason: '',
            timestamp: new Date()
          });
          console.log('[Justificación] Justificación pendiente creada automáticamente');
        }
      }
    } else {
      // Si no hay registros locales, crear uno nuevo
      localAttendanceRecords.value = { [student.id]: 'Justificado' };
      pendingChanges.value.add(student.id);
      console.log('[Justificación] Nuevo registro local creado');
      
      // Asegurar que exista una justificación pendiente
      if (!pendingJustifications.value.has(student.id)) {
        pendingJustifications.value.set(student.id, {
          reason: '',
          timestamp: new Date()
        });
        console.log('[Justificación] Justificación pendiente creada para nuevo registro');
      }
    }

    // Buscar si ya existe una justificación para este estudiante
    //  const existingJustification = attendanceStore.getJustification(student.id);
    const studentJustifications = attendanceStore.getJustificationsByStudent(student.id);
    const existingJustification = studentJustifications && studentJustifications.length > 0 ? studentJustifications[0] : null;

    // Si ya existe una justificación, usarla como pendiente
    if (existingJustification) {
      console.log(`[Justificación] Justificación existente encontrada para ${student.nombre}:`, existingJustification);
      
      // Manejo correcto de los diferentes formatos de justificación
      let justificationReason = '';
      let documentURL = '';
      
      if (typeof existingJustification === 'string') {
        justificationReason = existingJustification;
      } else if (typeof existingJustification === 'object') {
        justificationReason = existingJustification.reason || '';
        documentURL = existingJustification.documentUrl || '';
      }
      
      pendingJustifications.value.set(student.id, {
        reason: justificationReason,
        documentURL: documentURL,
        timestamp: new Date()
      });
      
      console.log(`[Justificación] Justificación procesada: ${justificationReason}`);
    } else if (!pendingJustifications.value.has(student.id)) {
      // Si no hay justificación existente ni pendiente, crear una nueva
      pendingJustifications.value.set(student.id, {
        reason: '',
        timestamp: new Date()
      });
      console.log('[Justificación] Nueva justificación pendiente creada');
    }

    // Emitir el evento al componente padre
    console.log('[Modal] Emitiendo evento open-justification al componente padre');
    emit('open-justification', {
      ...student,
      id: classIdToUse, // This can remain as classId for the emitted event if expected by parent
      date: dateToUse
    });

    // Notificar al usuario
    displayToast(`Añadiendo justificación para ${student.nombre || 'Estudiante'}`, 'info');

  } catch (error) {
    console.error('[Justificación] Error en el proceso de justificación:', error);
    displayToast('Error al procesar la justificación', 'error');
  }
};

const handleSaveJustification = (data: { studentId: string, reason: string, documentURL?: string, file?: File }) => {
  console.log('Guardando justificación:', data);
  
  // Verificar que tenemos los datos necesarios
  if (!data.studentId || !data.reason) {
    console.error('Datos incompletos para guardar justificación:', data);
    displayToast('Error: Datos incompletos para la justificación', 'error');
    return;
  }

  // Crear el objeto de justificación sin incluir documentURL si es undefined
  const justificationData: { reason: string; documentURL?: string; timestamp: Date } = {
    reason: data.reason,
    timestamp: new Date()
  };

  // Solo incluir documentURL si tiene un valor
  if (data.documentURL) {
    justificationData.documentURL = data.documentURL;
  }

  // Guardar la justificación en el mapa de justificaciones pendientes
  pendingJustifications.value.set(data.studentId, justificationData);

  // Asegurarse de que el estudiante esté marcado como justificado
  if (localAttendanceRecords.value) {
    localAttendanceRecords.value[data.studentId] = 'Justificado';
    pendingChanges.value.add(data.studentId);
  }

  // Limpiar el estado de justificación actual
  selectedStudentForJustification.value = null;
  currentJustificationReason.value = '';

  console.log('Justificación guardada:', justificationData);
  
  // Actualizar la UI inmediatamente para mostrar el estado "Justificado"
  localAttendanceRecords.value = { ...localAttendanceRecords.value };
  
  // Notificar al usuario
  displayToast('Justificación guardada correctamente', 'success');
};


// Funciones para navegación
const navigateToWorkspace = () => {
  console.log('Emitiendo navigate-to-class-selector desde AttendanceList');
  emit('navigate-to-class-selector');
};

const handleNavigateToCalendar = () => {
  console.log('Emitiendo navigate-to-calendar desde AttendanceList');
  emit('navigate-to-calendar');
};

const handleNavigateToClassSelector = () => {
  console.log('Emitiendo navigate-to-class-selector desde AttendanceList');
  emit('navigate-to-class-selector');
};

// Función para exportar la asistencia a PDF
const handleExportToPDF = async () => {
  try {
    const currentDate = props.date || attendanceStore.selectedDate;
    const currentClass = props.initialClassId || props.classId || attendanceStore.selectedClass;
    const currentClassName = props.selectedClassName || classesStore.getClassById(currentClass)?.name || 'Clase sin nombre';
    
    if (!currentDate || !currentClass || !currentClassName) {
      displayToast('Faltan datos necesarios para generar el PDF. Seleccione una fecha y clase.', 'error');
      return;
    }

    // Obtener estudiantes actuales
    const students = effectiveStudents.value;
    if (!students || students.length === 0) {
      displayToast('No hay estudiantes para incluir en el PDF', 'error');
      return;
    }

    // Obtener registros de asistencia actuales
    const attendanceRecords = effectiveAttendanceRecords.value || attendanceStore.attendanceRecords || {};

    // Obtener nombre del maestro
    let teacherName = authStore.user?.email || 'Profesor';
    try {
      if (authStore.user?.uid) {
        const teacher = await teachersStore.fetchTeacherByAuthUid(authStore.user.uid);
        if (teacher && teacher.name) {
          teacherName = teacher.name;
        }
      }
    } catch (error) {
      console.warn('Error obteniendo nombre del maestro:', error);
    }

    // Obtener información adicional de la clase
    const classInfo = classesStore.getClassById(currentClass);
    let classSchedule = 'Horario no especificado';
    
    if (classInfo?.schedule?.slots && classInfo.schedule.slots.length > 0) {
      classSchedule = classInfo.schedule.slots
        .map(slot => `${slot.day}: ${slot.startTime} - ${slot.endTime}`)
        .join(', ');
    }
    
    // Crear observaciones detalladas que incluyan el horario
    let detailedObservations = `Horario de la clase: ${classSchedule}\n\n`;
    const basicObservations = attendanceStore.getObservations || 'Sin observaciones adicionales registradas.';
    detailedObservations += `Observaciones del maestro: ${basicObservations}`;

    // Obtener justificaciones
    const justifications = attendanceStore.getJustificationsByStudent || {};

    await generateAttendancePDF(
      students,
      attendanceRecords,
      detailedObservations,
      currentClassName,
      teacherName,
      currentDate,
      justifications
    );

    displayToast('PDF generado exitosamente con toda la información de la clase', 'success');
    
  } catch (error) {
    console.error('Error al generar PDF:', error);
    displayToast('Error al generar el PDF', 'error');
  }
};

// Funciones simplificadas para marcar todos los estudiantes
const markAllAsPresent = () => {
  if (props.isDisabled) return;
  attendanceActions.markAllAsPresent();
};

const markAllAsAbsent = () => {
  if (props.isDisabled) return;
  attendanceActions.markAllAsAbsent();
};

const markAllAsLate = () => {
  if (props.isDisabled) return;
  attendanceActions.markAllAsLate();
};

// Función simplificada para resetear todos los estados
const resetAllStatuses = async () => {
  if (props.isDisabled) return;
    await attendanceActions.resetAllStatuses();
};

// Función para abrir el modal de observaciones de asistencia
const openAttendanceObservationModal = () => {
  attendanceObservationModalOpen.value = true;
};

// Estudiantes ordenados por nombre
const sortedStudents = computed(() => {
  return [...effectiveStudents.value].sort((a, b) => {
    const nameA = `${a.nombre} ${a.apellido}`.toLowerCase();
    const nameB = `${b.nombre} ${b.apellido}`.toLowerCase();
    return nameA.localeCompare(nameB);
  });
});
</script>

<template>
  <!-- Contenedor único para compatibilidad con Transition -->
  <div class="attendance-list-container">
    <div class="attendance-list">
      <Toast 
        :show="showToast" 
        :message="toastMessage" 
        :type="toastType" 
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
          :pending-changes-count="attendanceActions.pendingChangesCount.value"
          :is-disabled="props.isDisabled"
          :observations="attendanceStore.getObservations"
          :should-animate-observations-button="shouldAnimateObservationsButton"
          :has-observations="hasObservations"
          @navigate-to-workspace="navigateToWorkspace"
          @save="handleUpdateStatus('all', 'save')"
          @open-export="handleExportToPDF"
          @open-observation="openAttendanceObservationModal"
          @navigate-to-calendar="handleNavigateToCalendar"
          @navigate-to-class-selector="handleNavigateToClassSelector"
        />
        
        <div class="flex flex-wrap gap-2 md:gap-4 mb-4 items-center">
          <!-- Contador de estudiantes -->
          <div class="px-3 py-1 bg-gray-100 text-gray-700 rounded-md flex items-center text-sm">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
            {{ effectiveStudents.length }} estudiantes
          </div>
        </div>

        <AttendanceSummary 
          :attendance-records="effectiveAttendanceRecords"
          :pending-changes-count="attendanceActions.pendingChangesCount.value"
          :has-pending-changes="attendanceActions.hasPendingChanges.value"
          :on-save="() => handleUpdateStatus('all', 'save')"
        />
        
        <AttendanceTable 
          :students="effectiveStudents"
          :attendance-records="effectiveAttendanceRecords"
          :is-disabled="props.isDisabled"
          :pending-changes="pendingChanges"
          @update-status="handleUpdateStatus"
          @open-justification="handleOpenJustification"
          @save-justification="handleSaveJustification"
          @open-observations="openAttendanceObservationModal"
          @mark-all-present="() => markAllAsPresent()"
          @mark-all-absent="() => markAllAsAbsent()"
          @mark-all-late="() => markAllAsLate()"
          @reset-all="() => resetAllStatuses()"
        />
      </div>
    </div>
    
    <!-- Modales fuera del contenido principal pero dentro del contenedor raíz -->
    <ClassObservationsModal 
      :is-visible="observationsModalOpen" 
      :class-id="currentSelectedClass"
      :date="currentSelectedDate"
      :title="'Observaciones para ' + (props.selectedClassName || 'la clase')"
      @close="observationsModalOpen = false"
    />

    <AttendanceObservation
      v-if="attendanceObservationModalOpen"
      :isVisible="attendanceObservationModalOpen"
      :class-id="currentSelectedClass"
      :attendance-date="currentSelectedDate"
      @close="attendanceObservationModalOpen = false"
    />
    
    <JustificationModal
      :show="justificationsModalOpen"
      :student="selectedStudentForJustification"
      :classId="currentSelectedClass || ''"
      :date="currentSelectedDate"
      :attendanceStatus="'Justificado'"
      @close="justificationsModalOpen = false"
      @submit="handleSaveJustification"
    />
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
