<script setup lang="ts">
/*******************************************************
 * AttendanceList Component
 * 
 * Este componente maneja la gestión de asistencia diaria,
 * incluyendo estados de estudiantes (presente, ausente, tardanza, justificado)
 * y la persistencia de estos datos en Firebase.
 *******************************************************/

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
import { useRoute } from 'vue-router'

// Importamos el composable de acciones de asistencia
import { useAttendanceActions } from '../composables/useAttendanceActions'

// Componentes
import Toast from '../../../components/Toast.vue'
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
  students?: Student[]; // Opcional, con default
  attendanceRecords?: Record<string, AttendanceStatus>; // Opcional, con default
  isDisabled?: boolean;
}>()

const emit = defineEmits([
  'navigate-to-class-selector',
  'navigate-to-calendar',
  'open-justification',
  'save-justification',
  'update-status',
  'open-observation',
  'save-observation',
  'open-export'
])

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
      console.log(`[ClassDebug] Clase encontrada en Firestore con ID=${classId}:`, classAfterFetch);
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

const attendanceActions = useAttendanceActions({
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
  
  console.log(`[AttendanceDebug] Fuentes disponibles: local=${localSize}, store=${storeSize}, props=${propsSize}, pendientes=${pendingSize}`);
  
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
  if (!dateParam || !classIdParam) {
    console.warn('No hay fecha o clase para cargar datos', { date: dateParam, classId: classIdParam });
    return;
  }
  
  console.log(`[AttendanceDebug] fetchDataForComponent: Cargando datos para fecha=${dateParam} y classId=${classIdParam}`);
  
  try {
    // Mostrar indicador de carga
    isLoading.value = true;
    
    // PASO 1: INICIAR DESDE EL STORE - Asegurarnos que la fecha y clase estén establecidas
    attendanceStore.selectedDate = dateParam;
    attendanceStore.selectedClass = classIdParam;
    
    // PASO 2: Cargamos información de la clase y estudiantes simultáneamente para optimizar
    console.log(`[AttendanceDebug] Verificando información de la clase y estudiantes`);
    
    // Ejecutar ambas promesas en paralelo
    const [classesResult, studentsResult] = await Promise.all([
      classesStore.fetchClasses(),
      studentsStore.fetchStudents()
    ]);
    
    // Verificar si la clase existe
    const classInfo = classesStore.getClassById(classIdParam);
    if (!classInfo) {
      console.error(`[AttendanceDebug] No se encontró la clase con ID=${classIdParam}`);
      errorMessage.value = `No se encontró la clase con ID ${classIdParam}`;
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
    console.log(`[AttendanceDebug] Cargando datos de asistencia para fecha=${dateParam}, clase=${classIdParam}`);
    
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
    console.log('[AttendanceDebug] 🔄 CARGANDO DOCUMENTO DE ASISTENCIA DE FIRESTORE');
    const attendanceDoc = await attendanceStore.fetchAttendanceDocument(dateParam, classIdParam);
    
    if (attendanceDoc) {
      console.log('[AttendanceDebug] ✓ DOCUMENTO ENCONTRADO EN FIRESTORE:', attendanceDoc);
      
      // Solo usamos datos de Firestore si no hay datos locales o si hay inconsistencias
      const localSize = Object.keys(localAttendanceRecords.value).length;
      const freshStoreRecords = { ...attendanceStore.attendanceRecords };
      const freshStoreSize = Object.keys(freshStoreRecords).length;
      
      if (localSize === 0 || (freshStoreSize > 0 && freshStoreSize >= localSize)) {
        console.log('[AttendanceDebug] ✓ ACTUALIZANDO REGISTROS LOCALES DESDE STORE ACTUALIZADO');
        localAttendanceRecords.value = { ...freshStoreRecords };
      }
    } else if (Object.keys(localAttendanceRecords.value).length === 0) {
      // Inicializar un documento vacío para estudiantes sin registros
      console.log('[AttendanceDebug] ⚠️ NO HAY DOCUMENTO DE ASISTENCIA - INICIALIZANDO ESTADOS PREDETERMINADOS');
      
      // Opción: Inicializar con "Ausente" para todos los estudiantes si se desea un estado predeterminado
      // const defaultAttendance = {};
      // studentsInClass.forEach(student => {
      //   defaultAttendance[student.id] = 'Ausente';
      // });
      // localAttendanceRecords.value = defaultAttendance;
    }
    
    // PASO 5: ASEGURAR SINCRONIZACIÓN BIDIRECCIONAL
    // Asegurarse de que el store tenga los mismos datos que el componente local
    // (Importante para continuidad entre vistas)
    if (Object.keys(localAttendanceRecords.value).length > 0) {
      attendanceStore.attendanceRecords = { ...localAttendanceRecords.value };
    }
    
    // PASO 6: Forzar actualización del renderizado utilizando nextTick
    await nextTick();
    console.log('[AttendanceDebug] Total de registros tras cargar:', Object.keys(localAttendanceRecords.value).length);
    
    // Un doble-check final con timeout para asegurar renderizado
    if (Object.keys(localAttendanceRecords.value).length > 0) {
      setTimeout(() => {
        console.log('[AttendanceDebug] Comprobando estado final de los registros');
        const recordCount = Object.keys(localAttendanceRecords.value).length;
        console.log(`[AttendanceDebug] Registros finales: ${recordCount}`);
        
        if (recordCount === 0) {
          // Último intento si aún no hay registros
          localAttendanceRecords.value = { ...attendanceStore.attendanceRecords };
        }
      }, 100);
    }
  } catch (error) {
    console.error('[AttendanceDebug] Error al cargar datos:', error);
    errorMessage.value = 'Error al cargar datos de asistencia';
  } finally {
    isLoading.value = false;
  }
};

// Inicializar cuando cambian las props
watch(
  () => [props.date, props.initialClassId],
  async ([newDate, newClassId]) => {
    console.log(`AttendanceList Watcher: Date='${newDate}', ClassId='${newClassId}'`); // For debugging
    console.log('Debug Class ID Sources:', debugClassIdSource.value);
    
    // Try to get the class ID from any available source
    const effectiveClassId = newClassId || 
                            route.params.classId || 
                            route.params.id || 
                            attendanceStore.selectedClass || '';
    
    console.log(`Using effective ClassId='${effectiveClassId}'`);
    
    if (newDate && effectiveClassId) {
      try {
        // Verify that the class exists
        const classExists = await verifyClassExists(effectiveClassId);
        
        if (classExists) {
          // Valid date and existing classId, proceed to fetch data
          await fetchDataForComponent(newDate as string, effectiveClassId);
        } else {
          console.error(`No se encontró la clase con ID=${effectiveClassId}`);
          errorMessage.value = `No se encontró la clase con ID=${effectiveClassId}`;
          isLoading.value = false;
        }
      } catch (error) {
        console.error('Error al verificar la clase:', error);
        errorMessage.value = 'Error al verificar información de la clase';
        isLoading.value = false;
      }
    } else {
      // Date or classId is missing or invalid, clear existing data
      // console.log('AttendanceList Watcher: Invalid date or classId. Clearing data.'); // For debugging
      isLoading.value = true; // Indicate a change is happening
      localStudents.value = [];
      localAttendanceRecords.value = {};
      if (pendingChanges.value && typeof pendingChanges.value.clear === 'function') {
        pendingChanges.value.clear();
      }
      if (pendingJustifications.value && typeof pendingJustifications.value.clear === 'function') {
        pendingJustifications.value.clear();
      }
      // Optionally, inform the user that a valid selection is needed
      // displayToast("Por favor, seleccione una fecha y clase válidas.", "info");
      isLoading.value = false;
    }
  },
  { immediate: true }
);

// Hook onMounted optimizado para garantizar carga de datos
onMounted(async () => {
  console.log('[AttendanceDebug] ⚡ COMPONENTE MONTADO - Iniciando carga crítica de datos');
  
  // Obtener la fecha y clase de todas las fuentes posibles
  const dateToUse = props.date || (route.params.date as string) || attendanceStore.selectedDate;
  const classIdToUse = props.initialClassId || (route.params.classId as string) || (route.params.id as string) || attendanceStore.selectedClass;
  
  if (!dateToUse || !classIdToUse) {
    console.error('[AttendanceDebug] ❌ Falta fecha o clase para cargar datos');
    return;
  }
  
  console.log(`[AttendanceDebug] 📅 Fecha=${dateToUse}, Clase=${classIdToUse}`);
  
  try {
    // IMPORTANTE: Establecer selección en el store ANTES DE CUALQUIER OPERACIÓN
    attendanceStore.selectedDate = dateToUse;
    attendanceStore.selectedClass = classIdToUse;
    
    // PASO 1: Intentar cargar datos desde el store inmediatamente
    const initialStoreRecords = { ...attendanceStore.attendanceRecords };
    const initialStoreSize = Object.keys(initialStoreRecords).length;
    
    if (initialStoreSize > 0) {
      console.log(`[AttendanceDebug] ✅ DATOS INICIALES DEL STORE: ${initialStoreSize} registros`);
      localAttendanceRecords.value = { ...initialStoreRecords };
      
      // Forzar actualización reactiva inmediata
      await nextTick();
    }
    
    // PASO 2: Realizar carga completa (incluso si ya hay datos)
    await fetchDataForComponent(dateToUse, classIdToUse);
    
    // PASO 3: Comprobar si hay datos en el componente después de la carga
    const localSize = Object.keys(localAttendanceRecords.value).length;
    const storeSize = Object.keys(attendanceStore.attendanceRecords).length;
    
    console.log(`[AttendanceDebug] 📊 Después de carga inicial: Registros locales=${localSize}, Store=${storeSize}`);
    
    // PASO 4: VERIFICACIÓN CRÍTICA - Si no hay datos locales pero hay en store, sincronizar
    if (localSize === 0 && storeSize > 0) {
      console.log('[AttendanceDebug] ⚠️ ESTADO CRÍTICO: Sincronizando manualmente datos del store al componente');
      localAttendanceRecords.value = { ...attendanceStore.attendanceRecords };
      
      // Forzar actualización inmediata
      await nextTick();
    } else if (localSize > 0) {
      // Si hay datos locales, asegurarse que el store también los tenga
      attendanceStore.attendanceRecords = { ...localAttendanceRecords.value };
    }
    
    // PASO 5: SECUENCIA DE ACTUALIZACIÓN garantizada con intervalos
    // Esto fuerza una actualización reactiva completa en varios momentos para asegurar la visualización
    
    // Primera actualización inmediata
    localAttendanceRecords.value = { ...localAttendanceRecords.value };
    
    // Segunda actualización con breve retraso
    setTimeout(() => {
      console.log('[AttendanceDebug] 🔄 Actualizando UI después del montaje (1/2)');
      
      // Verificar estado actual
      const totalStudents = localStudents.value.length;
      const totalRecords = Object.keys(localAttendanceRecords.value).length;
      console.log(`[AttendanceDebug] 📊 Estudiantes=${totalStudents}, Registros=${totalRecords}`);
      
      // Forzar actualización reactiva
      localAttendanceRecords.value = { ...localAttendanceRecords.value };
      
      // Tercera actualización para casos extremos
      setTimeout(() => {
        console.log('[AttendanceDebug] 🔄 Actualizando UI después del montaje (2/2)');
        
        // Última verificación de sincronización
        const finalStoreSize = Object.keys(attendanceStore.attendanceRecords).length;
        const finalLocalSize = Object.keys(localAttendanceRecords.value).length;
        
        // Si hay inconsistencia, priorizar los datos con más información
        if (finalStoreSize > finalLocalSize) {
          console.log('[AttendanceDebug] 🔄 Sincronización final: store → local');
          localAttendanceRecords.value = { ...attendanceStore.attendanceRecords };
        } else if (finalLocalSize > finalStoreSize) {
          console.log('[AttendanceDebug] 🔄 Sincronización final: local → store');
          attendanceStore.attendanceRecords = { ...localAttendanceRecords.value };
        }
      }, 250);
    }, 50);
  } catch (error) {
    console.error('[AttendanceDebug] ❌ Error en la inicialización del componente:', error);
    errorMessage.value = 'Error al inicializar el componente de asistencia';
  }
});

// Watch mejorado para sincronizar cambios en attendanceRecords
watch(
  [
    () => props.attendanceRecords, 
    () => attendanceStore.attendanceRecords
  ],
  ([propsRecords, storeRecords], [oldPropsRecords, oldStoreRecords]) => {
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
        
        // Forzar actualización
        setTimeout(() => {
          localAttendanceRecords.value = { ...localAttendanceRecords.value };
        }, 0);
      } else if (localSize > storeSize) {
        // Si los datos locales tienen más información, actualizamos el store
        attendanceStore.attendanceRecords = { ...localAttendanceRecords.value };
        console.log('[AttendanceDebug] ↗️ Sincronizando store desde componente local');
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
        timestamp: new Date()
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
    attendanceActions.saveAllPendingChanges(dateToSave, classIdToSave);
    return;
  }
  
  // Delegar al composable para actualizar estado
  attendanceActions.updateStudentStatus(studentId, status);
  
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
    });
  }
};

// Función para gestionar la apertura del modal de justificación
const handleOpenJustification = async (student: any) => {
  try {
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
    const existingJustification = attendanceStore.getJustification(student.id);

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
        documentURL = existingJustification.documentURL || existingJustification.documentUrl || '';
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

  // Guardar la justificación en el mapa de justificaciones pendientes
  pendingJustifications.value.set(data.studentId, {
    reason: data.reason,
    documentURL: data.documentURL,
    timestamp: new Date()
  });

  // Asegurarse de que el estudiante esté marcado como justificado
  if (localAttendanceRecords.value) {
    localAttendanceRecords.value[data.studentId] = 'Justificado';
    pendingChanges.value.add(data.studentId);
  }

  // Notificar al usuario
  displayToast('Justificación guardada correctamente', 'success');

  // Limpiar el estado de justificación actual
  selectedStudentForJustification.value = null;
  currentJustificationReason.value = '';

  console.log('Justificación guardada:', {
    studentId: data.studentId,
    reason: data.reason,
    documentURL: data.documentURL
  });
  
  // Actualizar la UI inmediatamente para mostrar el estado "Justificado"
  localAttendanceRecords.value = { ...localAttendanceRecords.value };
  
  // Notificar al usuario que la justificación fue guardada pero los cambios de asistencia aún deben guardarse
  displayToast('Justificación guardada. Recuerde guardar los cambios generales de asistencia.', 'info');
};

// Función para manejar el clic en el botón de guardar observación
const handleOpenObservation = () => {
  emit('open-observation');
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

// Funciones simplificadas para marcar todos los estudiantes
const markAllAsPresent = () => {
  if (props.isDisabled) return;
  attendanceActions.markAllAsPresent(effectiveStudents.value);
};

const markAllAsAbsent = () => {
  if (props.isDisabled) return;
  attendanceActions.markAllAsAbsent(effectiveStudents.value);
};

const markAllAsLate = () => {
  if (props.isDisabled) return;
  attendanceActions.markAllAsLate(effectiveStudents.value);
};

// Función simplificada para resetear todos los estados
const resetAllStatuses = async () => {
  if (props.isDisabled) return;
  
  if (confirm('¿Estás seguro de que quieres reestablecer el estado de todos los estudiantes a su último estado guardado?')) {
    // Obtener la fecha y clase actual
    const dateToUse = route.params.date as string || props.date || attendanceStore.selectedDate;
    const classIdToUse = route.params.classId as string || route.params.id as string || props.initialClassId;
    
    // Usar el composable para reestablecer estados
    await attendanceActions.resetAllStatuses(dateToUse, classIdToUse);
  }
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
    
    <div>
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
        @open-export="emit('open-export')"
        @open-observation="handleOpenObservation"
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
        
        <!-- Indicador de registros -->
        <div :class="`px-3 py-1 rounded-md flex items-center text-sm ${Object.keys(effectiveAttendanceRecords).length > 0 ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
          {{ Object.keys(effectiveAttendanceRecords).length }} registros
        </div>
      </div>
      
      <!-- Funciones para marcación rápida -->
      <div class="flex flex-wrap gap-2 md:gap-4 mb-4 justify-between items-center">
        <!-- Botones de acción rápida para asistencia -->
        <div class="flex gap-2">
          <button 
            @click="markAllAsPresent" 
            class="px-3 py-1 bg-green-100 text-green-700 hover:bg-green-200 rounded-md flex items-center text-sm"
            :disabled="props.isDisabled"
            title="Marcar todos como presentes"
          >
            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
            </svg>
            Presente
          </button>

          <button 
            @click="markAllAsAbsent" 
            class="px-3 py-1 bg-red-100 text-red-700 hover:bg-red-200 rounded-md flex items-center text-sm"
            :disabled="props.isDisabled"
            title="Marcar todos como ausentes"
          >
            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 13l-4-4-4 4m0 0l4 4 4-4m-8 0V5m0 18v-7" />
            </svg>
            Ausente
          </button>

          <button 
            @click="markAllAsLate" 
            class="px-3 py-1 bg-yellow-100 text-yellow-700 hover:bg-yellow-200 rounded-md flex items-center text-sm"
            :disabled="props.isDisabled"
            title="Marcar todos como tardanza"
          >
            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 9h4v4h-4z" />
            </svg>
            Tardanza
          </button>
        </div>
        
        <!-- Botón para reestablecer todos los estados -->
        <button 
          @click="resetAllStatuses" 
          class="px-3 py-1 bg-gray-100 text-gray-700 hover:bg-gray-200 rounded-md flex items-center text-sm"
          :disabled="props.isDisabled"
          title="Reestablecer estados a los últimos guardados"
        >
          <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 10H9v4h6v-4zm0 8H9v-4h6v4z" />
          </svg>
          Reestablecer
        </button>
        
        <!-- Botones de depuración -->
        <button 
          @click="refreshAttendanceData" 
          class="px-3 py-1 bg-blue-100 text-blue-700 hover:bg-blue-200 rounded-md flex items-center text-sm"
          title="Actualizar datos desde Firebase"
        >
          <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Actualizar datos
        </button>
        
        <button 
          @click="() => { localAttendanceRecords.value = {...attendanceStore.attendanceRecords as Record<string, AttendanceStatus>}; }" 
          class="px-3 py-1 bg-purple-100 text-purple-700 hover:bg-purple-200 rounded-md flex items-center text-sm"
          title="Forzar sincronización con el store"
        >
          <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" />
          </svg>
          Forzar visualización
        </button>
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
        @mark-all-present="() => markAllAsPresent()"
        @mark-all-absent="() => markAllAsAbsent()"
        @mark-all-late="() => markAllAsLate()"
        @reset-all="() => resetAllStatuses()"
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
