<script setup lang="ts">
import { ref, watch, computed, onMounted } from 'vue';
import { format, formatISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { XMarkIcon } from '@heroicons/vue/24/outline';
import { useRouter } from 'vue-router';
import { useAttendanceStore } from '../store/attendance';
import { useOptimizedAttendance } from '../composables/useOptimizedAttendance';

// Define props and emits
const props = defineProps<{
  isOpen: boolean;
  date: string;
  classes: {
    id: string;
    name: string;
    teacher?: string;
    time?: string;
    students?: number;
    hasAttendance?: boolean;
    classroom?: string;
    studentIds?: string[];
    isLoadingAttendance?: boolean;
    attendanceStatus?: boolean;
    // Nuevas propiedades para clasificar tipos de clases
    classType?: string;
    isScheduledClass?: boolean;
    hasAttendanceRecord?: boolean;
    attendanceRecord?: any;
    schedule: {
      slots: {
        id: string;
        startTime: string;
        endTime: string;
      }[];
    };
  }[];
}>();

const emit = defineEmits(['close', 'select-class']);

const router = useRouter();
const attendanceStore = useAttendanceStore();
const { checkAttendanceExists } = useOptimizedAttendance();

// Estado para los indicadores de asistencia
const attendanceStatus = ref<Record<string, boolean>>({});
const attendanceStatusLoading = ref<Record<string, boolean>>({});

// Computed property for development mode
const isDevelopment = computed(() => import.meta.env?.DEV || false);

// Function to check if attendance exists for a class on a specific date (async version)
const hasAttendanceRecord = async (classId: string, date: string): Promise<boolean> => {
  try {
    // console.log('[ClassesModal] ===== CHECKING ATTENDANCE RECORD =====');
    // console.log('[ClassesModal] Input:', { classId, date });
    // console.log('[ClassesModal] Available attendance documents:');
    
    
    // First check the attendance store cache
    const record = attendanceStore.attendanceDocuments.find(
      doc => doc.classId === classId && doc.fecha === date
    );
    
    if (record) {
      // console.log('[ClassesModal] ✅ Found record in store cache:', record.id);
      return true;
    }

    // console.log('[ClassesModal] ❌ No record found in store cache');

    // If not in cache, use optimized query to check Firestore
    // console.log('[ClassesModal] Checking Firestore...');
    const exists = await checkAttendanceExists(classId, date);
    // console.log('[ClassesModal] Firestore query result:', exists);

    return exists;
  } catch (error) {
    console.error('[ClassesModal] Error checking attendance record:', error);
    return false;
  }
};

// Function to check attendance status for a specific class
const checkAttendanceStatus = async (classId: string, date: string) => {
  const key = `${classId}|${date}`;
  // console.log('[ClassesModal] Starting attendance check for:', { classId, date, key });
  attendanceStatusLoading.value[key] = true;
  
  try {
    const hasRecord = await hasAttendanceRecord(classId, date);
    // console.log('[ClassesModal] Attendance check result:', { classId, date, hasRecord });
    attendanceStatus.value[key] = hasRecord;
  } catch (error) {
    console.error('[ClassesModal] Error checking attendance status:', error);
    attendanceStatus.value[key] = false;
  } finally {
    attendanceStatusLoading.value[key] = false;
    //   console.log('[ClassesModal] Attendance status set:', { key, status: attendanceStatus.value[key] });
  }
};

// Function for manual debug
const debugAttendance = async () => {
  console.log('=== MANUAL DEBUG ATTENDANCE (ClassesModal) ===');
  console.log('Current date:', props.date);
  console.log('Attendance store documents:', attendanceStore.attendanceDocuments);
  console.log('Classes:', props.classes);
  
  // Manually test each class
  for (const classItem of props.classes) {
    console.log(`Testing class: ${classItem.name} (${classItem.id})`);
    const hasRecord = await hasAttendanceRecord(classItem.id, props.date);
    console.log(`Result for ${classItem.name}: ${hasRecord}`);
  }
};

// Computed property for classes with attendance status
const classesWithAttendanceStatus = computed(() => {
  if (!props.classes || !props.date) return [];
  
  return props.classes.map(classItem => {
    const key = `${classItem.id}|${props.date}`;
    const isLoading = attendanceStatusLoading.value[key];
    const hasAttendance = attendanceStatus.value[key];
    
    return {
      ...classItem,
      // Use the async status check results
      hasAttendance: hasAttendance === true,
      isLoadingAttendance: isLoading === true,
      attendanceStatus: hasAttendance
    };
  });
});

// Computed property for scheduled classes (programadas)
const scheduledClasses = computed(() => {
  return classesWithAttendanceStatus.value.filter(classItem => 
    (classItem.isScheduledClass !== false && classItem.classType !== 'recorded') ||
    classItem.classType === 'shared' // Incluir clases compartidas
  );
});

// Computed property for extra/recovery classes (clases extra/recuperación)
const extraClasses = computed(() => {
  return classesWithAttendanceStatus.value.filter(classItem => 
    classItem.isScheduledClass === false || classItem.classType === 'recorded'
  );
});

// Watch for changes in props and trigger attendance checks
watch([() => props.classes, () => props.date, () => props.isOpen], async ([newClasses, newDate, isOpen]) => {
  if (!isOpen || !newClasses?.length || !newDate) return;
  
  console.log('[ClassesModal] ===== STARTING ATTENDANCE CHECK =====');
  console.log('[ClassesModal] Date:', newDate);
  console.log('[ClassesModal] Classes:');
  newClasses.forEach((c, index) => {
    console.log(`[ClassesModal] Class ${index}:`, {
      id: c.id,
      name: c.name
    });
  });
  
  try {
    // Load attendance documents if not already loaded
    if (!attendanceStore.attendanceDocuments.length) {
      console.log('[ClassesModal] Loading attendance documents...');
      await attendanceStore.fetchAttendanceDocuments();
      console.log('[ClassesModal] Loaded attendance documents:', attendanceStore.attendanceDocuments.length);
    }
    
    // Reset status
    attendanceStatus.value = {};
    attendanceStatusLoading.value = {};
    
    // Check attendance for all classes in parallel
    console.log('[ClassesModal] Starting parallel attendance checks...');
    const statusChecks = newClasses.map(async (classItem) => {
      console.log(`[ClassesModal] Checking attendance for class: ${classItem.name} (${classItem.id})`);
      await checkAttendanceStatus(classItem.id, newDate);
    });
    
    await Promise.all(statusChecks);
    console.log('[ClassesModal] ===== FINAL ATTENDANCE STATUS =====');
    console.log('[ClassesModal] Final attendance status:', attendanceStatus.value);
  } catch (error) {
    console.error('[ClassesModal] Error during attendance check:', error);
  }
}, { immediate: true });

// Format the date to display it nicely
const formattedDate = ref('');

watch(() => props.date, (newDate) => {
  if (newDate) {
    const dateObj = new Date(newDate);
    // Format: "Lunes, 24 de junio de 2024"
    formattedDate.value = format(dateObj, "EEEE, d 'de' MMMM 'de' yyyy", { locale: es });
    // Capitalize first letter
    formattedDate.value = formattedDate.value.charAt(0).toUpperCase() + formattedDate.value.slice(1);
  }
}, { immediate: true });

// Format time to better display format (12h format)
const formatTime = (timeStr: string): string => {
  if (!timeStr || !/^\d{2}:\d{2}$/.test(timeStr)) return timeStr;
  
  const [hours, minutes] = timeStr.split(':');
  const date = new Date();
  date.setHours(parseInt(hours, 10));
  date.setMinutes(parseInt(minutes, 10));
  
  return format(date, 'h:mm a', { locale: es });
};

// Handle class selection
const handleSelectClass = (classId: string) => {
  emit('select-class', classId);
};

// Navigate to create attendance for a specific class
const navigateToAttendance = (classId: string) => {
  emit('select-class', classId);
  emit('close');
};

// Make sure the component is exported as default
defineExpose({});
if (import.meta.env?.PROD === false) {
  // @ts-ignore - This ensures the component has a default export
  // which helps with certain bundlers and IDE tooling
  const _default = {};
}
</script>

<template>
  <div v-if="isOpen" class="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
    <div class="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-lg transform transition-all">
      <!-- Modal header -->
      <div class="border-b border-gray-200 dark:border-gray-700 px-6 py-4 flex justify-between items-center">
        <h3 class="text-lg font-medium text-gray-900 dark:text-white">
          Clases del día {{ formattedDate }}
        </h3>
        <button 
          @click="emit('close')" 
          class="text-gray-400 hover:text-gray-500 focus:outline-none"
        >
          <XMarkIcon class="h-5 w-5" />
        </button>
      </div>

      <!-- Modal body -->
      <div class="px-6 py-4 max-h-[60vh] overflow-y-auto">
        <div v-if="classesWithAttendanceStatus.length === 0" class="text-center py-8">
          <p class="text-gray-500 dark:text-gray-400">No hay clases programadas para este día.</p>
        </div>
        <div v-else class="space-y-4">
          <!-- Sección de clases programadas -->
          <div v-if="scheduledClasses.length > 0">
            <h4 class="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              Clases Programadas y Compartidas ({{ scheduledClasses.length }})
            </h4>
            <div class="space-y-3 mb-6">
              <div 
                v-for="classItem in scheduledClasses" 
                :key="classItem.id" 
                class="relative border border-gray-200 dark:border-gray-700 rounded-lg p-5 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all cursor-pointer"
                @click="navigateToAttendance(classItem.id)"
              >
                <!-- Status Indicator -->
                <div class="absolute top-3 right-3 flex flex-col items-end space-y-1">
                  <!-- Indicador de clase compartida -->
                  <span 
                    v-if="classItem.classType === 'shared'"
                    class="text-xs font-semibold px-2 py-1 rounded-full bg-purple-500 text-white">
                    Compartida
                  </span>
                  
                  <!-- Estado de asistencia -->
                  <span 
                    v-if="classItem.isLoadingAttendance"
                    class="text-xs font-semibold px-2 py-1 rounded-full bg-gray-300 text-gray-600 animate-pulse">
                    ...
                  </span>
                  <span 
                    v-else
                    :class="[
                      'text-xs font-semibold px-2 py-1 rounded-full',
                      classItem.hasAttendance 
                        ? 'bg-green-500 text-white' 
                        : 'bg-blue-400 text-white'
                    ]">
                    {{ classItem.hasAttendance ? 'Registrado' : 'Programada' }}
                  </span>
                </div>

                <!-- Title -->
                <h4 class="text-lg font-semibold text-gray-900 dark:text-white pr-24 mb-2">{{ classItem.name }}</h4>
                
                <!-- Schedule -->
                <div v-if="classItem.schedule?.slots?.length" class="flex items-center text-gray-600 dark:text-gray-300 mb-1">
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span v-for="(slot, idx) in classItem.schedule.slots" :key="slot.id" class="text-sm">
                    {{ formatTime(slot.startTime) }} - {{ formatTime(slot.endTime) }}
                    <span v-if="idx < classItem.schedule.slots.length - 1" class="mx-1">|</span>
                  </span>
                </div>
                
                <!-- Student Count -->
                <div class="flex items-center text-gray-600 dark:text-gray-300">
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                  <span class="text-sm">{{ classItem.studentIds?.length || classItem.students || 0 }} alumnos</span>
                </div>
                
                <!-- Classroom (if available) -->
                <div v-if="classItem.classroom" class="flex items-center text-gray-500 dark:text-gray-400 mt-1">
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                  <span class="text-sm">{{ classItem.classroom }}</span>
                </div>
                
                <!-- Información de clase compartida -->
                <div v-if="classItem.classType === 'shared'" class="mt-2 p-2 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                  <div class="flex items-center text-purple-600 dark:text-purple-400 text-sm">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-1a2 2 0 01-2 2h-1.5m-1.5 0h1.5a2 2 0 002-2M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-1a2 2 0 01-2 2h-1.5m-1.5 0h1.5a2 2 0 002-2" />
                    </svg>
                    <span class="font-medium">Eres asistente en esta clase</span>
                  </div>
                  <div v-if="classItem.teacherPermissions?.canTakeAttendance === false" class="text-xs text-red-600 dark:text-red-400 mt-1">
                    • Sin permisos para tomar asistencia
                  </div>
                  <div v-else class="text-xs text-green-600 dark:text-green-400 mt-1">
                    • Puedes gestionar la asistencia
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Sección de clases extra/recuperación -->
          <div v-if="extraClasses.length > 0">
            <h4 class="text-sm font-semibold text-orange-700 dark:text-orange-300 mb-3 flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
              </svg>
              Clases Extra/Recuperación ({{ extraClasses.length }})
            </h4>
            <div class="space-y-3">
              <div 
                v-for="classItem in extraClasses" 
                :key="classItem.id" 
                class="relative border-2 border-orange-200 dark:border-orange-700 bg-orange-50 dark:bg-orange-900/20 rounded-lg p-5 hover:bg-orange-100 dark:hover:bg-orange-800/30 transition-all cursor-pointer"
                @click="navigateToAttendance(classItem.id)"
              >
                <!-- Status Indicator -->
                <div class="absolute top-3 right-3">
                  <span class="text-xs font-semibold px-2 py-1 rounded-full bg-green-500 text-white">
                    Registrado
                  </span>
                </div>

                <!-- Title -->
                <h4 class="text-lg font-semibold text-gray-900 dark:text-white pr-24 mb-2">
                  {{ classItem.name }}
                </h4>
                
                <!-- Extra class indicator -->
                <div class="flex items-center text-orange-600 dark:text-orange-400 mb-2">
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span class="text-sm font-medium">Clase extra o de recuperación</span>
                </div>
                
                <!-- Student Count -->
                <div class="flex items-center text-gray-600 dark:text-gray-300">
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                  <span class="text-sm">{{ classItem.studentIds?.length || classItem.students || 0 }} alumnos</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Mensaje si no hay clases extra pero sí programadas -->
          <div v-if="scheduledClasses.length > 0 && extraClasses.length === 0" class="text-center py-4 border-t border-gray-200 dark:border-gray-700">
            <p class="text-sm text-gray-500 dark:text-gray-400">
              No hay clases extra o de recuperación registradas para este día.
            </p>
          </div>
        </div>
      </div>

      <!-- Modal footer -->
      <div class="border-t border-gray-200 dark:border-gray-700 px-6 py-3 flex justify-between">
        <!-- Debug button (development only) -->
        <button 
          v-if="isDevelopment"
          @click="debugAttendance"
          class="px-3 py-1 text-xs bg-blue-500 hover:bg-blue-600 text-white rounded transition-colors focus:outline-none"
        >
          Debug
        </button>
        <div v-else></div>
        
        <button 
          @click="emit('close')"
          class="px-4 py-2 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-white rounded-md transition-colors focus:outline-none"
        >
          Cerrar
        </button>
      </div>
    </div>
  </div>
</template>