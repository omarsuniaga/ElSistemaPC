<script setup lang="ts">
// Importaciones de Vue y tipos
import { ref, computed, watch, onMounted, nextTick } from 'vue'
import type { JustificationData } from '../types/attendance'
import type { Student } from '../../Students/types/student'

// Definimos el tipo AttendanceStatus explicitamente para evitar problemas de importacion
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
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

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
import ClassObservationsManager from '../../../components/observations/ClassObservationsManager.vue'

// Props y emits
const props = defineProps<{
  selectedClassName?: string;
  initialClassId?: string; // Usado para cargar datos si se accede por URL
  classId?: string;      // Añadido explicitamente para evitar advertencias
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

// Import the observations store for the unified system
import { useObservationsStore } from '../../../stores/observations';
const observationsStore = useObservationsStore();

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

// Estado para el nuevo modal de observaciones unificadas
const showClassObservationsManager = ref<boolean>(false);

// Almacen para estudiantes justificados - usamos esto para mantener el estado visual
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

// Funcion para mostrar el toast
const displayToast = (message: string, type: 'success' | 'error' | 'warning' | 'info' = 'success') => {
  toastMessage.value = message;
  toastType.value = type;
  showToast.value = true;
};

// Funcion para verificar la existencia de una clase en Firestore y permisos de acceso
const verifyClassExists = async (classId: string) => {
  if (!classId) {
    console.error('[ClassDebug] No se puede verificar la existencia de una clase sin ID');
    return false;
  }
  
  try {
    console.log(`[ClassDebug] Verificando existencia de clase con ID=${classId}`);
    
    // Obtener el ID del maestro actual
    const currentTeacherId = authStore.user?.uid;
    if (!currentTeacherId) {
      console.error('[ClassDebug] No hay maestro autenticado');
      return false;
    }
    
    // PASO 1: Intentar obtener la clase específica por ID desde Firestore
    // Esto funciona tanto para clases propias como compartidas
    console.log(`[ClassDebug] Obteniendo clase específica por ID desde Firestore...`);
    let classData = await classesStore.fetchClassById(classId);
    
    // PASO 2: Si no se encuentra, intentar refrescar todas las clases como fallback
    if (!classData) {
      console.log(`[ClassDebug] Clase no encontrada individualmente, refrescando todas las clases...`);
      await classesStore.fetchClasses();
      const allClasses = classesStore.getAllClasses;
      classData = allClasses.find(cls => cls.id === classId);
    }
    
    if (!classData) {
      console.error(`[ClassDebug] Clase con ID=${classId} no encontrada en Firestore`);
      return false;
    }
    
    console.log(`[ClassDebug] Clase encontrada: "${classData.name}", Titular: ${classData.teacherId}`);
    
    // PASO 3: Verificar permisos de acceso
    // El maestro puede acceder si es:
    // 1. El titular de la clase (teacherId coincide)
    // 2. Un asistente autorizado en la clase compartida
    
    if (classData.teacherId === currentTeacherId) {
      console.log(`[ClassDebug] ✅ Maestro ${currentTeacherId} es TITULAR de la clase ${classId}`);
      return true;
    }
    
    // Verificar si es asistente en una clase compartida
    if (classData.assistantTeachers && Array.isArray(classData.assistantTeachers)) {
      const isAssistant = classData.assistantTeachers.includes(currentTeacherId);
      if (isAssistant) {
        console.log(`[ClassDebug] ✅ Maestro ${currentTeacherId} es ASISTENTE autorizado en clase ${classId}`);
        return true;
      }
    }
    
    // Verificar usando el método del store como fallback
    const hasAccess = classesStore.hasTeacherAccessToClass(classId, currentTeacherId);
    if (hasAccess) {
      console.log(`[ClassDebug] ✅ Maestro ${currentTeacherId} tiene acceso verificado por store a clase ${classId}`);
      return true;
    }
    
    console.log(`[ClassDebug] ❌ Maestro ${currentTeacherId} NO tiene acceso a clase ${classId}`);
    console.log(`[ClassDebug] - No es titular (${classData.teacherId})`);
    console.log(`[ClassDebug] - No es asistente (${classData.assistantTeachers || 'sin asistentes'})`);
    return false;
    
  } catch (error) {
    console.error(`[ClassDebug] Error al verificar la existencia de la clase ${classId}:`, error);
    return false;
  }
};

// Integracion con el composable de acciones de asistencia
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
  // Consultar el nuevo sistema unificado de observaciones
  if (!currentSelectedClass.value || !currentSelectedDate.value) {
    return false;
  }
  
  // Filtrar observaciones por clase y fecha del store
  const allObservations = observationsStore.filteredObservations;
  const todayObservations = allObservations.filter(obs => 
    obs.classId === currentSelectedClass.value && 
    obs.date === currentSelectedDate.value
  );
  
  return todayObservations.length > 0;
});

const shouldAnimateObservationsButton = computed(() => {
  // Animar boton de observaciones solo si:
  // 1. No hay observaciones para la clase y fecha actual
  // 2. Hay estudiantes cargados (significa que la clase existe y requiere asistencia)
  return effectiveStudents.value.length > 0 && !hasObservations.value;
});

// Usando props si estan disponibles, de lo contrario, usando datos locales
const effectiveStudents = computed(() => {
  return props.students && props.students.length > 0 ? props.students : localStudents.value;
});

const effectiveAttendanceRecords = computed(() => {
  // PRIORIDAD CLARA DE DATOS:
  // 1. Cambios locales pendientes
  // 2. Datos cargados localmente del documento de asistencia
  // 3. Datos del store de asistencia
  // 4. Datos de props (como ultimo recurso)

  // Registrar tamaños para depuracion
  const localSize = Object.keys(localAttendanceRecords.value).length;
  const storeSize = Object.keys(attendanceStore.attendanceRecords).length;
  const propsSize = props.attendanceRecords ? Object.keys(props.attendanceRecords).length : 0;
  const pendingSize = pendingChangesCount.value;
  
  // CASO 1: Si tenemos cambios pendientes, siempre usar los datos locales
  if (pendingChangesCount.value > 0) {
    console.log(`[AttendanceDebug] PRIORIDAD 1: Usando registros locales (cambios pendientes: ${pendingChangesCount.value})`);
    return {...localAttendanceRecords.value};
  }
  
  // CASO 2: Si hay datos locales cargados (ya sea por fetchAttendanceDocument o por actualizacion manual)
  if (localSize > 0) {
    console.log('[AttendanceDebug] PRIORIDAD 2: Usando registros locales');
    return {...localAttendanceRecords.value};
  }

  // CASO 3: Si hay datos en el store de asistencia, usarlos y actualizar local para futuras referencias
  if (storeSize > 0) {
    console.log('[AttendanceDebug] PRIORIDAD 3: Usando registros del store');
    // Actualizar tambien los datos locales
    localAttendanceRecords.value = {...attendanceStore.attendanceRecords};
    
    // Forzar actualizacion reactiva
    setTimeout(() => {
      localAttendanceRecords.value = {...localAttendanceRecords.value};
    }, 0);
    
    return {...attendanceStore.attendanceRecords};
  }
  
  // CASO 4: Como ultimo recurso, comprobar si las props tienen datos
  if (propsSize > 0) {
    console.log('[AttendanceDebug] PRIORIDAD 4: Usando registros de props');
    // Actualizar tambien los datos locales
    localAttendanceRecords.value = {...props.attendanceRecords};
    
    // Forzar actualizacion reactiva
    setTimeout(() => {
      localAttendanceRecords.value = {...localAttendanceRecords.value};
    }, 0);
    
    return {...props.attendanceRecords};
  }
  
  // Si no hay nada, retornar objeto vacio
  console.log('[AttendanceDebug] Sin datos disponibles, retornando objeto vacio');
  return {};
});

// Funcion para cargar datos para el componente
const fetchDataForComponent = async (dateParam: string, classIdParam: string) => {
  const debugEnabled = window.localStorage.getItem('attendance-debug') === 'true';
  
  // Validar y normalizar parametros
  if (!dateParam || !classIdParam || typeof dateParam !== 'string' || typeof classIdParam !== 'string') {
    console.warn('[AttendanceDebug] fetchDataForComponent: Parametros invalidos', { 
      date: dateParam, 
      classId: classIdParam,
      dateType: typeof dateParam,
      classType: typeof classIdParam
    });
    isLoading.value = false;
    return {};
  }
  
  // Normalizar fecha si es necesario
  let normalizedDate = dateParam.trim();
  if (normalizedDate.length === 8 && !normalizedDate.includes('-')) {
    normalizedDate = `${normalizedDate.substring(0,4)}-${normalizedDate.substring(4,6)}-${normalizedDate.substring(6,8)}`;
    if (debugEnabled) {
      console.log(`[AttendanceDebug] fetchDataForComponent: Date normalized from ${dateParam} to ${normalizedDate}`);
    }
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
    
    // Intentar obtener la informacion de la clase
    const classInfo = classesStore.getClassById(classIdParam);
    if (!classInfo) {
      console.error(`[AttendanceDebug] No se encontro la clase con ID=${classIdParam}`);
      
      // Intentar normalizar el ID y buscar de nuevo (por si hay problemas de formato)
      const normalizedId = classIdParam.trim();
      const alternativeClass = classesStore.classes.find(c => 
        c.id.includes(normalizedId) || normalizedId.includes(c.id)
      );
      
      if (alternativeClass) {
        console.log(`[AttendanceDebug] Se encontro una clase similar con ID=${alternativeClass.id}`);
        // Si encontramos una clase alternativa, usamos esa en su lugar
        return fetchDataForComponent(dateParam, alternativeClass.id);
      }
      
      // Si no encontramos ninguna clase, mostramos el error y continuamos
      errorMessage.value = `No se encontro la clase. Por favor, verifica el ID o selecciona otra clase.`;
      localStudents.value = [];
      localAttendanceRecords.value = {};
      isLoading.value = false;
      return {};
    }
    
    // Cargar estudiantes solo si es necesario
    let studentsInClass = [];
    
    if (!hasCachedStudents) {
      // Verificar si los estudiantes ya estan en el store antes de hacer la solicitud
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
      const attendanceDoc = await attendanceStore.fetchAttendanceDocument(normalizedDate, classIdParam);
      
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
    
    console.log('[AttendanceDebug] fetchDataForComponent: Usando datos de asistencia en cache');
      
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
    console.log('[AttendanceDebug] ⚡ COMPONENTE MONTADO - Iniciando carga critica de datos');
  }
  
  // Obtener la fecha y clase de todas las fuentes posibles
  let rawDate = props.date || (route.params.date as string) || attendanceStore.selectedDate;
  let dateToUse = rawDate;
  
  // Validar y normalizar la fecha
  if (rawDate) {
    if (typeof rawDate === 'string' && rawDate.length === 8 && !rawDate.includes('-')) {
      dateToUse = `${rawDate.substring(0,4)}-${rawDate.substring(4,6)}-${rawDate.substring(6,8)}`;
      if (debugEnabled) {
        console.log(`[AttendanceDebug] onMounted: Date normalized from ${rawDate} to ${dateToUse}`);
      }
    } else if (typeof rawDate !== 'string' || rawDate.trim() === '') {
      // Si la fecha no es valida, usar fecha actual
      const today = new Date();
      dateToUse = today.toISOString().split('T')[0];
      if (debugEnabled) {
        console.log(`[AttendanceDebug] onMounted: Invalid date "${rawDate}", using today: ${dateToUse}`);
      }
    }
  } else {
    // Si no hay fecha, usar fecha actual
    const today = new Date();
    dateToUse = today.toISOString().split('T')[0];
    if (debugEnabled) {
      console.log(`[AttendanceDebug] onMounted: No date provided, using today: ${dateToUse}`);
    }
  }

  const classIdToUse = props.initialClassId || (route.params.classId as string) || (route.params.id as string) || attendanceStore.selectedClass;
  
  if (!dateToUse || !classIdToUse) {
    console.error('[AttendanceDebug] ❌ Falta fecha o clase para cargar datos en onMounted');
    console.error('[AttendanceDebug] dateToUse:', dateToUse, 'classIdToUse:', classIdToUse);
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
      console.log(`[AttendanceDebug] Verificando informacion de la clase y estudiantes`);
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
      console.error(`[AttendanceDebug] No se encontro la clase con ID=${classIdToUse}`);
      errorMessage.value = `No se encontro la clase con ID ${classIdToUse}`;
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
    // localAttendanceRecords.value = {}; // Comentado para evitar borrar datos validos
    
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
    
    // PASO 4: Cargar documento de asistencia desde Firebase como ultimo recurso
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
    
    // PASO 5: ASEGURAR SINCRONIZACIoN BIDIRECCIONAL
    // Asegurarse de que el store tenga los mismos datos que el componente local
    // (Importante para continuidad entre vistas)
    if (Object.keys(localAttendanceRecords.value).length > 0 && 
        JSON.stringify(localAttendanceRecords.value) !== JSON.stringify(attendanceStore.attendanceRecords)) {
      console.log('[AttendanceDebug] Sincronizando localAttendanceRecords con attendanceStore.attendanceRecords en onMounted');
      attendanceStore.attendanceRecords = { ...localAttendanceRecords.value };
    }
    
    // PASO 6: Cargar observaciones del sistema unificado
    try {
      console.log('[AttendanceDebug] 📝 Cargando observaciones de la clase y fecha actual');
      await observationsStore.fetchObservations({ 
        classId: classIdToUse,
        date: dateToUse 
      });
      console.log('[AttendanceDebug] ✓ Observaciones cargadas correctamente');
    } catch (error) {
      console.warn('[AttendanceDebug] ⚠️ Error al cargar observaciones:', error.message);
      // No bloquear la carga de asistencia por errores en observaciones
    }
    
    // PASO 7: Forzar actualizacion del renderizado utilizando nextTick
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
    // resetAllStatuses(); // Comentado para prueba: Podria estar borrando los estados cargados
  } catch (error) {
    console.error('[AttendanceDebug] Error en la inicializacion del componente (onMounted):', error);
    errorMessage.value = 'Error al inicializar el componente de asistencia';
  } finally {
    isLoading.value = false;
    console.log('[AttendanceDebug] ✅ Finalizada carga critica de datos (onMounted)');
  }
});

// Control de debounce para el watcher principal
const isWatcherProcessing = ref(false);
const lastProcessedValues = ref({ date: '', classId: '' });

// Funcion para normalizar fechas si estan en formato YYYYMMDD
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
        console.log('[AttendanceDebug] Watcher: Valores identicos a los ultimos procesados, omitiendo actualizacion.');
      }
      return; // Omitir si no hay cambio real
    }
    
    // Prevenir multiples ejecuciones simultaneas
    if (isWatcherProcessing.value) {
      if (debugEnabled) {
        console.log('[AttendanceDebug] Watcher: Ya hay una actualizacion en proceso, omitiendo llamada paralela.');
      }
      return;
    }
    
    // Verificar que tengamos valores validos
    if (!finalDate || !finalClassId) {
      if (debugEnabled) {
        console.log('[AttendanceDebug] Watcher: Fecha o ID de clase invalidos. Esperando parametros validos.');
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
        // Fecha valida y clase existente, procedemos a cargar datos
        const result = await fetchDataForComponent(finalDate as string, finalClassId as string);
        
        if (debugEnabled && result) {
          console.log(`[AttendanceDebug] Watcher: Datos cargados correctamente. Estudiantes: ${result.students?.length || 0}, Registros: ${Object.keys(result.attendanceRecords || {}).length}`);
        }
      } else {
        console.error(`[AttendanceDebug] Watcher: No se encontro la clase con ID=${finalClassId}`);
        errorMessage.value = `No se encontro la clase con ID=${finalClassId}`;
        localStudents.value = [];
        localAttendanceRecords.value = {};
      }
    } catch (error) {
      console.error('[AttendanceDebug] Watcher: Error al verificar la clase:', error);
      errorMessage.value = 'Error al verificar informacion de la clase';
    } finally {
      isLoading.value = false;
      
      // Permitir que el watcher procese nuevos cambios despues de un pequeño delay
      // Esto evita multiples actualizaciones consecutivas
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

    console.log('[AttendanceDebug] 🔍 WATCH DETECTo CAMBIOS EN REGISTROS');
    
    // No hacer nada si tenemos cambios locales pendientes para evitar sobreescribirlos
    if (pendingChangesCount.value > 0) {
      console.log(`[AttendanceDebug] ⚠️ PROTECCION DE CAMBIOS: Ignorando cambios externos porque hay ${pendingChangesCount.value} cambios pendientes`);
      return;
    }
    
    // Funcion para verificar cambios reales comparando objetos
    const hasRealChanges = (newObj: any, oldObj: any) => {
      // Si alguno es undefined o null, considerar cambio si son diferentes
      if (!newObj || !oldObj) return newObj !== oldObj;
      
      // Comparar tamaños
      const newKeys = Object.keys(newObj);
      const oldKeys = Object.keys(oldObj || {});
      if (newKeys.length !== oldKeys.length) return true;
      
      // Verificar si algun valor cambio
      return newKeys.some(key => newObj[key] !== oldObj?.[key]);
    };
    
    // Obtener dimensiones para toma de decisiones
    const localSize = Object.keys(localAttendanceRecords.value).length;
    const storeSize = storeRecords ? Object.keys(storeRecords).length : 0;
    const propsSize = propsRecords ? Object.keys(propsRecords).length : 0;
    
    // CASO 1: Cambios en props con contenido significativo
    const hasPropsChanges = propsRecords && hasRealChanges(propsRecords, oldPropsRecords);
    
    if (hasPropsChanges && propsSize > 0) {
      console.log(`[AttendanceDebug] 📥 ACTUALIZACIoN DESDE PROPS: ${propsSize} registros`);
      
      // IMPORTANTE: Solo actualizar si props tiene mas datos o si no tenemos datos locales
      if (propsSize > localSize || localSize === 0) {
        localAttendanceRecords.value = { ...propsRecords };
        
        // Sincronizar con store si es necesario
        if (propsSize > storeSize) {
          attendanceStore.attendanceRecords = { ...propsRecords };
          console.log('[AttendanceDebug] ↗️ Sincronizando store desde props');
        }
        
        // Forzar actualizacion
        setTimeout(() => {
          localAttendanceRecords.value = { ...localAttendanceRecords.value };
        }, 0);
      }
      return;
    }
    
    // CASO 2: Cambios en store con contenido significativo
    const hasStoreChanges = storeRecords && hasRealChanges(storeRecords, oldStoreRecords);
    
    if (hasStoreChanges && storeSize > 0) {
      console.log(`[AttendanceDebug] 🗄️ ACTUALIZACIoN DESDE STORE: ${storeSize} registros`);
      
      // IMPORTANTE: Solo actualizar si store tiene mas datos o no tenemos datos locales
      if (storeSize > localSize || localSize === 0) {
        localAttendanceRecords.value = { ...storeRecords };
        // Forzar actualizacion reactiva si es necesario, aunque la asignacion a ref deberia ser suficiente
        // setTimeout(() => { localAttendanceRecords.value = { ...localAttendanceRecords.value }; }, 0);
      } else if (localSize > storeSize) {
        // Opcional: si local tiene mas datos, podria ser una desincronizacion
        // console.warn('[AttendanceDebug] Conflicto potencial: Store tiene menos datos que local. Se mantienen datos locales.');
      }
    }
  },
  { immediate: true, deep: true }
);

// Funcion para refrescar datos de asistencia desde Firebase
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
    console.log('[AttendanceDebug] Watch detecto cambio en props.students:', 
      newStudents ? `Estudiantes: ${newStudents.length}` : 'No hay estudiantes');
    
    if (newStudents) {
      // Siempre actualizar estudiantes locales cuando cambian props, incluso si esta cargando
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
          
          // Forzar actualizacion de la UI despues de un retraso minimo
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

// Funcion para obtener el estado actual de un estudiante
const getStudentStatus = (studentId: string): AttendanceStatus | undefined => {
  return localAttendanceRecords.value?.[studentId];
};

// Validar estados de asistencia antes de guardar
const validateAttendanceStates = () => {
  let valid = true;
  const invalidStudents: string[] = [];
  const missingStatusStudents: string[] = [];
  
  // Verificar que todos los estudiantes en la lista tengan un estado y que sea valido
  localStudents.value.forEach(student => {
    const status = getStudentStatus(student.id);
    
    // Verificar si el estudiante tiene un estado definido
    if (status === undefined) {
      missingStatusStudents.push(student.id);
      console.warn(`[AttendanceDebug] Estudiante ${student.id} sin estado definido`);
    } else if (!['Presente', 'Ausente', 'Tardanza', 'Justificado'].includes(status)) {
      // Si tiene estado pero no es valido
      valid = false;
      invalidStudents.push(student.id);
      console.error(`[AttendanceDebug] Estado invalido para estudiante ${student.id}: ${status}`);
    }
    
    // Si esta justificado, verificar que tenga una justificacion
    if (status === 'Justificado' && !pendingJustifications.value.has(student.id)) {
      console.warn(`[AttendanceDebug] Estudiante ${student.id} marcado como justificado pero sin justificacion`);
      // Crear justificacion vacia para evitar problemas
      pendingJustifications.value.set(student.id, {
        reason: 'Justificacion pendiente',
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

const handleUpdateStatus = async (studentId: string, status: string) => {
  if (studentId === 'all' && status === 'save') {
    // Validar estados antes de guardar
    const { valid, invalidStudents, missingStatusStudents } = validateAttendanceStates();
    
    if (!valid && invalidStudents.length > 0) {
      console.error(`[AttendanceDebug] Se encontraron ${invalidStudents.length} estudiantes con estados invalidos`);
      displayToast(`Error: Hay ${invalidStudents.length} estudiantes con estados invalidos`, 'error');
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
    console.log(`[AttendanceDebug] Total cambios pendientes: ${pendingChanges.value.size}`);
    
    // Asegurar que guardamos todos los cambios pendientes en Firestore
    displayToast('Guardando cambios en la base de datos...', 'info');
    await attendanceActions.saveAllPendingChanges();
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
  
  // Si el estudiante cambia a Justificado, manejar la justificacion
  if (status === 'Justificado') {
    handleOpenJustification({
      id: studentId,
      ...localStudents.value.find(s => s.id === studentId)
    }
  );
  } 
  
  if (pendingChangesCount.value > 0) {
    console.log(`[AttendanceList] Cambios pendientes: ${pendingChangesCount.value}. Esperando accion de guardar.`);
    // Ya no guardamos automaticamente, esperamos a que se presione el boton de guardar
    // Esto permite acumular multiples cambios antes de enviar a Firestore
  }
};

// Funcion para gestionar la apertura del modal de justificacion
const handleOpenJustification = async (student: any) => {
  try {
    // abrir modal de justificacion
    console.log('[Justificacion] Abriendo modal de justificacion');
    console.log('[Justificacion] Iniciando proceso de justificacion para estudiante:', student);
        
    // Verificar si tenemos toda la informacion necesaria
    if (!student || !student.id) {
      console.error('[Justificacion] Error: Datos de estudiante invalidos', student);
      displayToast('Error: Datos de estudiante invalidos', 'error');
      return;
    }

    // Obtener la fecha y clase actual
    const dateToUse = route.params.date as string || props.date || attendanceStore.selectedDate;
    const classIdToUse = route.params.classId as string || route.params.id as string || props.initialClassId || attendanceStore.selectedClass;

    if (!dateToUse || !classIdToUse) {
      console.error('[Justificacion] Error: Fecha o clase no disponible', {
        date: dateToUse,
        classId: classIdToUse
      });
      displayToast('Error: Informacion de fecha o clase no disponible', 'error');
      return;
    }

    // Actualizar el estado local
    selectedStudentForJustification.value = {
      id: student.id,
      nombre: student.nombre || 'Estudiante',
      apellido: student.apellido || ''
    };

    console.log('[Justificacion] Estado local actualizado:', selectedStudentForJustification.value);

    // Marcar al estudiante como justificado en el mapa local
    justifiedStudentsMap.value[student.id] = true;

    // Actualizar el estado de asistencia local a 'Justificado'
    if (localAttendanceRecords.value) {
      const previousStatus = localAttendanceRecords.value[student.id];
      localAttendanceRecords.value[student.id] = 'Justificado';
      console.log(`[Justificacion] Estado de asistencia actualizado localmente de ${previousStatus} a Justificado`);

      // Si el estudiante no tenia un estado previo o era diferente de 'Justificado',
      // agregarlo a los cambios pendientes
      if (!previousStatus || previousStatus !== 'Justificado') {
        pendingChanges.value.add(student.id);
        console.log('[Justificacion] Cambio pendiente registrado');
        
        // Crear una justificacion pendiente si no existe
        if (!pendingJustifications.value.has(student.id)) {
          pendingJustifications.value.set(student.id, {
            reason: '',
            timestamp: new Date()
          });
          console.log('[Justificacion] Justificacion pendiente creada automaticamente');
        }
      }
    } else {
      // Si no hay registros locales, crear uno nuevo
      localAttendanceRecords.value = { [student.id]: 'Justificado' };
      pendingChanges.value.add(student.id);
      console.log('[Justificacion] Nuevo registro local creado');
      
      // Asegurar que exista una justificacion pendiente
      if (!pendingJustifications.value.has(student.id)) {
        pendingJustifications.value.set(student.id, {
          reason: '',
          timestamp: new Date()
        });
        console.log('[Justificacion] Justificacion pendiente creada para nuevo registro');
      }
    }

    // Buscar si ya existe una justificacion para este estudiante
    //  const existingJustification = attendanceStore.getJustification(student.id);
    const studentJustifications = attendanceStore.getJustificationsByStudent(student.id);
    const existingJustification = studentJustifications && studentJustifications.length > 0 ? studentJustifications[0] : null;

    // Si ya existe una justificacion, usarla como pendiente
    if (existingJustification) {
      console.log(`[Justificacion] Justificacion existente encontrada para ${student.nombre}:`, existingJustification);
      
      // Manejo correcto de los diferentes formatos de justificacion
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
      
      console.log(`[Justificacion] Justificacion procesada: ${justificationReason}`);
    } else if (!pendingJustifications.value.has(student.id)) {
      // Si no hay justificacion existente ni pendiente, crear una nueva
      pendingJustifications.value.set(student.id, {
        reason: '',
        timestamp: new Date()
      });
      console.log('[Justificacion] Nueva justificacion pendiente creada');
    }

    // Abrir el modal de justificación
    console.log('[Modal] Abriendo modal de justificación');
    justificationsModalOpen.value = true;
    
    // Emitir el evento al componente padre
    console.log('[Modal] Emitiendo evento open-justification al componente padre');
    emit('open-justification', {
      ...student,
      id: classIdToUse, // This can remain as classId for the emitted event if expected by parent
      date: dateToUse
    });

    // Notificar al usuario
    displayToast(`Abriendo modal de justificación para ${student.nombre || 'Estudiante'}`, 'info');

  } catch (error) {
    console.error('[Justificacion] Error en el proceso de justificacion:', error);
    displayToast('Error al procesar la justificacion', 'error');
  }
};

const handleSaveJustification = async (data: { studentId: string, reason: string, file?: File }) => {
  console.log('Guardando justificacion:', data);
  
  // Verificar que tenemos los datos necesarios
  if (!data.studentId || !data.reason) {
    console.error('Datos incompletos para guardar justificacion:', data);
    displayToast('Error: Datos incompletos para la justificacion', 'error');
    return;
  }

  let documentURL: string | undefined = undefined;

  // Si hay un archivo, subirlo primero
  if (data.file) {
    try {
      // Aquí deberías implementar la lógica para subir el archivo a Firebase Storage
      // Por ahora, simulamos la URL del documento
      console.log('Subiendo archivo:', data.file.name);
      displayToast('Subiendo archivo...', 'info');
      
      // Simular la subida (reemplazar con lógica real de Firebase Storage)
      await new Promise(resolve => setTimeout(resolve, 1000));
      documentURL = `https://firebasestorage.googleapis.com/uploads/${data.file.name}`;
      
      console.log('Archivo subido exitosamente:', documentURL);
    } catch (error) {
      console.error('Error al subir archivo:', error);
      displayToast('Error al subir el archivo', 'error');
      return;
    }
  }

  // Crear el objeto de justificacion
  const justificationData: { reason: string; documentURL?: string; timestamp: Date } = {
    reason: data.reason,
    timestamp: new Date()
  };

  // Solo incluir documentURL si tiene un valor
  if (documentURL) {
    justificationData.documentURL = documentURL;
  }

  // Guardar la justificacion en el mapa de justificaciones pendientes
  pendingJustifications.value.set(data.studentId, justificationData);

  // Asegurarse de que el estudiante este marcado como justificado
  if (localAttendanceRecords.value) {
    localAttendanceRecords.value[data.studentId] = 'Justificado';
    pendingChanges.value.add(data.studentId);
  }

  // Limpiar el estado de justificacion actual
  selectedStudentForJustification.value = null;
  currentJustificationReason.value = '';
  
  // Cerrar el modal de justificación
  justificationsModalOpen.value = false;

  console.log('Justificacion guardada:', justificationData);
  
  // Actualizar la UI inmediatamente para mostrar el estado "Justificado"
  localAttendanceRecords.value = { ...localAttendanceRecords.value };
  
  // Notificar al usuario
  displayToast('Justificacion guardada correctamente', 'success');
};


// Funciones para navegacion
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

// Funcion para exportar la asistencia a PDF
const handleExportToPDF = async () => {
  try {
    isLoading.value = true; // Mostrar indicador de carga
    
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

    // Obtener informacion detallada de la clase
    const classInfo = classesStore.getClassById(currentClass);
    let classSchedule = 'Horario no especificado';
    let classDescription = '';
    
    if (classInfo?.schedule?.slots && classInfo.schedule.slots.length > 0) {
      classSchedule = classInfo.schedule.slots
        .map(slot => `${slot.day}: ${slot.startTime} - ${slot.endTime}`)
        .join(', ');
    }
    
    if (classInfo?.description) {
      classDescription = classInfo.description;
    }
    
    // Obtener observaciones de la clase especifica
    let classObservations = 'Sin observaciones adicionales registradas.';
    try {
      // Intentar obtener observaciones especificas de la clase
      const observationsForClass = await attendanceStore.fetchObservationsForClass(currentClass);
      if (observationsForClass && observationsForClass.length > 0) {
        // Filtrar por fecha si es necesario, ya que fetchObservationsForClass devuelve todas las observaciones
        const observationsForDate = observationsForClass.filter(obs => {
          const obsDate = obs.date || obs.fecha;
          return obsDate === currentDate;
        });
        
        if (observationsForDate.length > 0) {
          classObservations = observationsForDate
            .map(obs => {
              // Verificar si obs.content es string u objeto
              const content = typeof obs.content === 'string' ? obs.content : obs.content?.text || 'Observacion sin contenido';
              const author = obs.author || 'Maestro';
              return `${content} (${author})`;
            })
            .join('\n');
        }
      }
    } catch (error) {
      console.warn('Error obteniendo observaciones especificas:', error);
      // Fallback a observaciones generales
      const basicObservations = attendanceStore.getObservations;
      if (basicObservations && basicObservations.trim()) {
        classObservations = basicObservations;
      }
    }
    
    // Crear observaciones detalladas que incluyan toda la informacion de contexto
    let detailedObservations = '';
    
    // Informacion de la clase
    detailedObservations += `INFORMACIoN DE LA CLASE:\n`;
    detailedObservations += `Clase: ${currentClassName}\n`;
    detailedObservations += `Maestro: ${teacherName}\n`;
    detailedObservations += `Fecha: ${format(new Date(currentDate), "d 'de' MMMM yyyy", { locale: es })}\n`;
    detailedObservations += `Horario: ${classSchedule}\n`;
    
    if (classDescription) {
      detailedObservations += `Descripcion: ${classDescription}\n`;
    }
    
    detailedObservations += `\nOBSERVACIONES DEL MAESTRO:\n${classObservations}\n`;

    // Obtener justificaciones
    const justifications = attendanceStore.getJustificationsByStudent || {};
    
    // Generar mensaje de estado para el usuario
    displayToast('Generando PDF con informacion completa de la clase...', 'info');

    await generateAttendancePDF(
      students,
      attendanceRecords,
      detailedObservations,
      currentClassName,
      teacherName,
      currentDate,
      justifications
    );

    displayToast('PDF generado exitosamente con toda la informacion de la clase', 'success');
    
  } catch (error) {
    console.error('Error al generar PDF:', error);
    displayToast('Error al generar el PDF. Por favor, intentelo de nuevo.', 'error');
  } finally {
    isLoading.value = false; // Ocultar indicador de carga
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

// Funcion simplificada para resetear todos los estados
const resetAllStatuses = async () => {
  if (props.isDisabled) return;
    await attendanceActions.resetAllStatuses();
};

// Funcion para abrir el modal de observaciones de asistencia
const openAttendanceObservationModal = () => {
  attendanceObservationModalOpen.value = true;
};

// Función para abrir el modal profesional de observaciones unificadas
const openClassObservationsModal = () => {
  showClassObservationsManager.value = true;
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
  <!-- Contenedor unico para compatibilidad con Transition -->
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
          :class-name="props.selectedClassName || currentSelectedClass || 'Clase'" 
          :pending-changes-count="attendanceActions.pendingChangesCount.value"
          :is-disabled="props.isDisabled"
          :observations="attendanceStore.getObservations"
          :should-animate-observations-button="shouldAnimateObservationsButton"
          :has-observations="hasObservations"
          :class-id="currentSelectedClass"
          :selected-date="currentSelectedDate"
          @navigate-to-workspace="navigateToWorkspace"
          @save="handleUpdateStatus('all', 'save')"
          @open-export="handleExportToPDF"
          @open-observation="openClassObservationsModal"
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
          @open-observations="openClassObservationsModal"
          @mark-all-present="() => markAllAsPresent()"
          @mark-all-absent="() => markAllAsAbsent()"
          @mark-all-late="() => markAllAsLate()"
          @reset-all="() => resetAllStatuses()"
        />
      </div>
    </div>
    
    <!-- Modales fuera del contenido principal pero dentro del contenedor raiz -->
    <ClassObservationsModal 
      :is-visible="observationsModalOpen" 
      :class-id="currentSelectedClass"
      :date="currentSelectedDate"
      :title="'Observaciones para ' + (props.selectedClassName || 'la clase')"
      @close="observationsModalOpen = false"
    />

    <!-- Modal profesional de observaciones unificadas -->
    <!-- ClassObservationsManager Modal -->
    <ClassObservationsManager
      :is-open="showClassObservationsManager"
      :class-id="currentSelectedClass || props.classId"
      :class-name="props.selectedClassName || currentSelectedClass || 'Clase sin nombre'"
      :selected-date="currentSelectedDate"
      @close="showClassObservationsManager = false"
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
