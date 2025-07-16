<template>
  <div class="student-attendance-grid *:first-letter:first-letter:uppercase">
    <!-- Barra de herramientas con controles -->    
    <div class="flex flex-wrap items-center justify-between gap-2 mb-3">
      <!-- Resumen de asistencia en formato de píldora -->      
      <div class="flex items-center gap-1.5 bg-gray-100 dark:bg-gray-800 rounded-full px-3 py-1 text-xs shadow-sm">
        <div class="flex items-center gap-1">
          <span class="h-2 w-2 rounded-full bg-green-500"></span>
          <span>{{ attendanceStats.present }}</span>
        </div>
        <div class="flex items-center gap-1">
          <span class="h-2 w-2 rounded-full bg-red-500"></span>
          <span>{{ attendanceStats.absent }}</span>
        </div>
        <div class="flex items-center gap-1">
          <span class="h-2 w-2 rounded-full bg-purple-500"></span>
          <span>{{ attendanceStats.late }}</span>
        </div>
        <div class="flex items-center gap-1">
          <span class="h-2 w-2 rounded-full bg-blue-500"></span>
          <span>{{ attendanceStats.justified }}</span>
        </div>
      </div>
      
      <!-- Controles de ordenamiento (más pequeños y discretos) -->
      <div class="flex items-center gap-2">
        <span class="text-xs text-gray-500 dark:text-gray-400 hidden sm:inline">Ordenar:</span>
        <div class="flex gap-1">
          <button
            class="px-2 py-0.5 rounded text-xs font-medium border transition-colors"
            :class="[
              'bg-gray-100 dark:bg-gray-700 border-gray-200 dark:border-gray-600 hover:bg-gray-200 dark:hover:bg-gray-600',
              sortBy === 'nombre'
            ? 'bg-blue-500 text-white border-blue-600 shadow font-bold'
            : 'text-gray-800 dark:text-gray-200'
            ]"
            @click="sortBy = 'nombre'"
          >
            <span class="hidden sm:inline">Nombre</span>
            <span class="sm:hidden">N</span>
          </button>
          <button
            class="px-2 py-0.5 rounded text-xs font-medium border transition-colors"
            :class="[
              'bg-gray-100 dark:bg-gray-700 border-gray-200 dark:border-gray-600 hover:bg-gray-200 dark:hover:bg-gray-600',
              sortBy === 'instrument'
            ? 'bg-blue-500 text-white border-blue-600 shadow font-bold'
            : 'text-gray-800 dark:text-gray-200'
            ]"
            @click="sortBy = 'instrument'"
          >
            <span class="hidden sm:inline">Instrumento</span>
            <span class="sm:hidden">I</span>
          </button>
        </div>
      </div>
    </div>


  
    <!-- Progreso de completado de asistencia -->    
    <div class="mb-3">
      <div class="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 mb-1">
        <span>Progreso</span>
        <span>{{ completedCount }}/{{ attendanceStats.total }} ({{ completionPercent }}%)</span>
      </div>
      <div class="h-1.5 w-full bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
        <div 
          class="h-full rounded-full transition-all duration-500 ease-out"
          :class="{
            'bg-red-500': completionPercent < 30,
            'bg-yellow-500': completionPercent >= 30 && completionPercent < 70,
            'bg-green-500': completionPercent >= 70
          }"
          :style="{width: `${completionPercent}%`}"
        ></div>
      </div>
    </div>
    
    <!-- Grid de estudiantes con diseño responsivo mejorado -->
    <div
      class="grid grid-cols-3 xs:grid-cols-4 sm:grid-cols-4 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-8 gap-3"
    >
      <div
        v-for="student in sortedStudents"
        :key="student.id"
        class="student-card relative cursor-pointer flex flex-col items-center justify-center"
        :class="getCardStatusColor(getStudentAttendance(student.id)?.status)"
        @click="cycleAttendanceStatus(student.id)"  
        @contextmenu.prevent="toggleStudentSelection(student.id)"
        @long-touch="toggleStudentSelection(student.id)" 
      >
        <!-- Selección visual para selección múltiple -->
        <div 
          v-if="selectedStudents.has(student.id)" 
          class="absolute inset-0 bg-blue-500/20 dark:bg-blue-600/30 border-2 border-blue-500 dark:border-blue-400 rounded-lg z-0 animate-pulse"
        ></div>
        
        <!-- Icono de adjuntar en la esquina superior derecha -->
        <button
          v-if="getStudentAttendance(student.id)?.status === 'justified'"
          class="absolute top-1 right-1 z-10 p-1 rounded-full bg-white/90 dark:bg-gray-800/90 hover:bg-blue-100 dark:hover:bg-blue-900/50 border border-blue-200 dark:border-blue-800 shadow transition-colors"
          @click.stop="emit('open-justification-modal', student)"
          :title="getStudentAttendance(student.id)?.notes || student.justification ? 'Editar justificación' : 'Agregar justificación'"
        >
          <svg v-if="getStudentAttendance(student.id)?.notes || student.justification" class="w-4 h-4 text-green-500" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" /></svg>
          <svg v-else class="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l7.07-7.07a4 4 0 00-5.656-5.657l-7.07 7.07a6 6 0 108.485 8.485l6.364-6.364" /></svg>
        </button>
        <!-- Avatar con iniciales y color de estado -->        
        <div 
          class="w-12 h-12 xs:w-12 xs:h-12 mb-2 rounded-full flex items-center justify-center text-xl font-bold transition-all duration-200 border-2 overflow-hidden shadow-sm"
          :class="getStatusColor(getStudentAttendance(student.id)?.status)"
        >
          <span class="transform transition-transform duration-200 hover:scale-110">{{ getStudentInitials(student) }}</span>
        </div>
        
        <!-- Datos del estudiante -->
        <div class="w-full text-center px-1">
          <div class="text-sm xs:text-base font-semibold text-gray-900 dark:text-white truncate">{{ student.nombre }} {{ student.apellido }}</div>
          <div class="text-xs xs:text-sm text-blue-600 dark:text-blue-400 truncate">{{ student.instrument || 'Sin instrumento' }}</div>
          <!-- Estado de asistencia visual mejorado -->
          <div class="mt-1.5 xs:mt-2 flex flex-col items-center gap-1">
            <span
              class="inline-flex items-center px-1.5 xs:px-2 py-0.5 rounded-full text-xxs xs:text-xs font-semibold shadow-sm transition-all duration-300 transform hover:scale-105"
              :class="{
                'bg-green-100 text-green-800 dark:bg-green-700 dark:text-green-100': getStudentAttendance(student.id)?.status === 'present',
                'bg-red-100 text-red-800 dark:bg-red-700 dark:text-red-100': getStudentAttendance(student.id)?.status === 'absent',
                'bg-purple-100 text-purple-800 dark:bg-purple-700 dark:text-purple-100': getStudentAttendance(student.id)?.status === 'late',
                'bg-blue-100 text-blue-800 dark:bg-blue-700 dark:text-blue-100': getStudentAttendance(student.id)?.status === 'justified',
                'bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-300': !getStudentAttendance(student.id)?.status || getStudentAttendance(student.id)?.status === 'pending',
              }"
            >
              <template v-if="getStudentAttendance(student.id)?.status === 'present'">
                <svg class="w-3 h-3 mr-1 text-green-500" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M16.707 5.293a1 1 0 00-1.414 0L8 12.586 4.707 9.293a1 1 0 00-1.414 1.414l4 4a1 1 0 001.414 0l8-8a1 1 0 000-1.414z" clip-rule="evenodd" /></svg>
                Presente
              </template>
              <template v-else-if="getStudentAttendance(student.id)?.status === 'absent'">
                <svg class="w-3 h-3 mr-1 text-red-500" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.707a1 1 0 00-1.414-1.414L10 8.586 7.707 6.293a1 1 0 00-1.414 1.414L8.586 10l-2.293 2.293a1 1 0 001.414 1.414L10 11.414l2.293 2.293a1 1 0 001.414-1.414L11.414 10l2.293-2.293z" clip-rule="evenodd" /></svg>
                Ausente
              </template>
              <template v-else-if="getStudentAttendance(student.id)?.status === 'late'">
                <svg class="w-3 h-3 mr-1 text-purple-500" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm-1-9V6a1 1 0 112 0v3a1 1 0 01-1 1H7a1 1 0 110-2h2z" clip-rule="evenodd" /></svg>
                Tarde
              </template>
              <template v-else-if="getStudentAttendance(student.id)?.status === 'justified'">
                <svg class="w-3 h-3 mr-1 text-blue-500" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm-1-9V6a1 1 0 112 0v3a1 1 0 01-1 1H7a1 1 0 110-2h2z" clip-rule="evenodd" /></svg>
                Justificado
              </template>
              <template v-else>
                <svg class="w-3 h-3 mr-1 text-gray-400" fill="currentColor" viewBox="0 0 20 20"><circle cx="10" cy="10" r="8" /></svg>
                Pendiente
              </template>
            </span>
            <!-- Indicador de justificación agregada -->
            <div v-if="getStudentAttendance(student.id)?.status === 'justified' && (getStudentAttendance(student.id)?.notes || student.justification)" class="mt-1 px-2 py-1 bg-green-50 dark:bg-green-900/30 rounded text-xs text-green-800 border border-green-200 dark:border-green-700 w-full text-left flex items-center gap-1">
              <svg class="w-3 h-3 inline mr-1 text-green-400" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M15 12H9m12 0A9 9 0 11 3 12a9 9 0 0118 0z" /></svg>
              <span>Justificación agregada</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Estado vacío mejorado -->
    <div
      v-if="filteredStudents.length === 0 && !loading"
      class="text-center py-8 px-4 border border-dashed border-gray-300 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800/50 text-gray-500 dark:text-gray-400"
    >
      <svg
        class="mx-auto h-10 w-10 text-gray-400 mb-3"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        aria-hidden="true"
      >
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      </svg>
      <h3 class="text-lg font-medium text-gray-900 dark:text-gray-200 mb-2">
        No hay estudiantes para mostrar
      </h3>
      <p class="mb-3 text-sm">
        No se encontraron estudiantes con los filtros actuales.
      </p>
      
      <!-- Atajos de teclado en un diseño más compacto y agradable -->
      <div class="mt-4 max-w-xs mx-auto bg-white dark:bg-gray-900 rounded-md shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div class="px-3 py-1.5 bg-gray-100 dark:bg-gray-800 text-xs font-medium text-gray-700 dark:text-gray-300">Atajos disponibles</div>
        <div class="grid grid-cols-2 divide-x divide-y divide-gray-200 dark:divide-gray-700 text-xs">
          <div class="px-3 py-1.5 flex items-center justify-between">
            <span class="font-mono bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded">Ctrl+A</span>
            <span>Seleccionar todos</span>
          </div>
          <div class="px-3 py-1.5 flex items-center justify-between">
            <span class="font-mono bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded">Ctrl+P</span>
            <span>Marcar presentes</span>
          </div>
          <div class="px-3 py-1.5 flex items-center justify-between">
            <span class="font-mono bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded">Click Der.</span>
            <span>Seleccionar</span>
          </div>
          <div class="px-3 py-1.5 flex items-center justify-between">
            <span class="font-mono bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded">Esc</span>
            <span>Cancelar</span>
          </div>
        </div>
      </div>
    </div>
    
    <!-- Indicador de carga mejorado -->
    <div v-if="loading" class="fixed inset-0 bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm z-50 flex items-center justify-center">
      <div class="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-5 flex flex-col items-center max-w-md mx-auto">
        <div class="loader mb-3"></div>
        <p class="text-gray-600 dark:text-gray-300">Cargando estudiantes...</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
// Declarar todos los eventos emitidos por el componente (solo una vez)
const emit = defineEmits([
  'update-status',
  'batch-update',
  'student-notes',
  'quick-present-all',
  'toggle-selection-mode',
  'clear-selection',
  'open-justification-modal',
]);

// Asegúrate de que no haya otra declaración de defineEmits en este archivo.
import { CheckIcon, XMarkIcon, ExclamationTriangleIcon } from '@heroicons/vue/24/outline';
import { debounce } from 'lodash-es';
import { ref, computed, watch, onMounted, onUnmounted } from 'vue';

// Types
interface IStudent {
  id: string
  nombre: string
  apellido: string
  photoURL?: string
  instrument?: string
  nivel?: string
  justification?: string
}

interface IAttendanceRecord {
  studentId: string
  status: 'pending' | 'absent' | 'present' | 'late' | 'justified'
  notes?: string
  timestamp?: Date
}

// Props
const props = defineProps<{
  students: IStudent[]
  attendanceRecords: IAttendanceRecord[]
  loading?: boolean
  searchQuery?: string
  filter?: 'all' | 'present' | 'absent' | 'late' | 'justified'
  enableBatchSelect?: boolean
}>();

// Estado local reactivo para los estados de asistencia
const localAttendance = ref<IAttendanceRecord[]>([]);

// Sincronizar localAttendance con attendanceRecords cuando cambian
watch(
  () => props.attendanceRecords,
  (newRecords) => {
    localAttendance.value = newRecords.map(r => ({ ...r }));
  },
  { immediate: true, deep: true },
);

// Estado local
const selectedStudents = ref<Set<string>>(new Set());
const isSelectionMode = ref(false);
const sortBy = ref<'nombre' | 'instrument'>('nombre');

// Computed properties
const filteredStudents = computed(() => {
  let filtered = props.students || [];

  // Filtro por búsqueda
  if (props.searchQuery?.trim()) {
    const query = props.searchQuery.toLowerCase();
    filtered = filtered.filter(
      (student) =>
        student.nombre?.toLowerCase().includes(query) ||
        student.apellido?.toLowerCase().includes(query) ||
        student.instrument?.toLowerCase().includes(query),
    );
  }

  // Filtro por estado
  if (props.filter && props.filter !== 'all') {
    filtered = filtered.filter((student) => {
      const record = getStudentAttendance(student.id);
      return record?.status === props.filter;
    });
  }

  return filtered;
});

const attendanceStats = computed(() => {
  const total = props.students?.length || 0;
  const attendanceRecords = localAttendance.value || [];
  const present = attendanceRecords.filter((r) => r.status === 'present').length;
  const absent = attendanceRecords.filter((r) => r.status === 'absent').length;
  const late = attendanceRecords.filter((r) => r.status === 'late').length;
  const justified = attendanceRecords.filter((r) => r.status === 'justified').length;

  return {
    total,
    present,
    absent,
    late,
    justified,
    pending: total - present - absent - late - justified,
    completionRate:
      total > 0 ? Math.round(((present + absent + late + justified) / total) * 100) : 0,
  };
});

const hasSelectedStudents = computed(() => selectedStudents.value.size > 0);

const batchActionsVisible = computed(
  () => props.enableBatchSelect && isSelectionMode.value && hasSelectedStudents.value,
);

const sortedStudents = computed(() => {
  let arr = [...filteredStudents.value];
  if (sortBy.value === 'nombre') {
    arr.sort((a, b) => `${a.nombre} ${a.apellido}`.localeCompare(`${b.nombre} ${b.apellido}`));
  } else if (sortBy.value === 'instrument') {
    arr.sort((a, b) => (a.instrument || '').localeCompare(b.instrument || ''));
  }
  return arr;
});

// Métodos principales
const getStudentAttendance = (studentId: string): IAttendanceRecord | undefined => {
  return (localAttendance.value || []).find((record) => record.studentId === studentId);
};

const getStudentInitials = (student: IStudent): string => {
  if (!student) return '';
  const nombre = student.nombre && typeof student.nombre === 'string' ? student.nombre.trim() : '';
  const apellido = student.apellido && typeof student.apellido === 'string' ? student.apellido.trim() : '';
  const inicialNombre = nombre ? nombre.charAt(0).toUpperCase() : '';
  const inicialApellido = apellido ? apellido.charAt(0).toUpperCase() : '';
  return `${inicialNombre}${inicialApellido}`;
};

const getStatusColor = (status: IAttendanceRecord['status'] | undefined): string => {
  const colors = {
    pending: 'bg-gray-300 text-gray-800',
    absent: 'bg-red-500 text-white',
    present: 'bg-green-500 text-white',
    late: 'bg-purple-500 text-white',
    justified: 'bg-blue-500 text-white',
  };
  return colors[status || 'pending'] || 'bg-gray-300 text-gray-800';
};

const getCardStatusColor = (status: IAttendanceRecord['status'] | undefined) => {
  switch (status) {
  case 'pending':
    return 'bg-gray-100 border-gray-300';
  case 'absent':
    return 'bg-red-100 border-red-300';
  case 'present':
    return 'bg-green-100 border-green-300';
  case 'late':
    return 'bg-purple-100 border-purple-300';
  case 'justified':
    return 'bg-blue-100 border-blue-300';
  default:
    return 'bg-gray-100 border-gray-300';
  }
};

const getStatusIcon = (status: IAttendanceRecord['status']) => {
  const icons = {
    present: CheckIcon,
    absent: XMarkIcon,
    late: ExclamationTriangleIcon,
    justified: CheckIcon,
    pending: CheckIcon,
  };
  return icons[status];
};

// Manejo de asistencia
const updateAttendance = debounce((studentId: string, status: IAttendanceRecord['status']) => {
  emit('update-status', studentId, status);
}, 300);

const quickToggleAttendance = (studentId: string) => {
  const current = getStudentAttendance(studentId);
  const newStatus = current?.status === 'present' ? 'absent' : 'present';
  updateAttendance(studentId, newStatus);
};

// Selección múltiple
const toggleStudentSelection = (studentId: string) => {
  if (!props.enableBatchSelect) return;

  if (selectedStudents.value.has(studentId)) {
    selectedStudents.value.delete(studentId);
  } else {
    selectedStudents.value.add(studentId);
  }
  selectedStudents.value = new Set(selectedStudents.value); // Trigger reactivity
};

const selectAllVisible = () => {
  if (!props.enableBatchSelect) return;
  filteredStudents.value.forEach((student) => {
    selectedStudents.value.add(student.id);
  });
  selectedStudents.value = new Set(selectedStudents.value);
};

const clearSelection = () => {
  selectedStudents.value.clear();
  selectedStudents.value = new Set();
  isSelectionMode.value = false;
};

const batchMarkAs = (status: IAttendanceRecord['status']) => {
  if (selectedStudents.value.size === 0) return;
  emit('batch-update', Array.from(selectedStudents.value), status);
  clearSelection();
};

// Acciones rápidas
const markAllPresent = () => {
  emit('quick-present-all');
};

// Modo de selección
const _toggleSelectionMode = () => {
  isSelectionMode.value = !isSelectionMode.value;
  if (!isSelectionMode.value) {
    clearSelection();
  }
};

// Keyboard shortcuts
const handleKeydown = (event: KeyboardEvent) => {
  if (event.ctrlKey || event.metaKey) {
    switch (event.key) {
    case 'a':
      event.preventDefault();
      if (props.enableBatchSelect) {
        selectAllVisible();
      }
      break;
    case 'p':
      event.preventDefault();
      markAllPresent();
      break;
    case 'Escape':
      clearSelection();
      break;
    }
  }
};

// Ciclo de estados: pendiente -> ausente -> presente -> tarde -> justificado -> pendiente
const cycleAttendanceStatus = (studentId: string) => {
  const current = getStudentAttendance(studentId);
  let newStatus: IAttendanceRecord['status'] = 'pending';
  if (!current || current.status === 'pending') newStatus = 'absent';
  else if (current.status === 'absent') newStatus = 'present';
  else if (current.status === 'present') newStatus = 'late';
  else if (current.status === 'late') newStatus = 'justified';
  else if (current.status === 'justified') newStatus = 'pending';
  // Actualizar localmente para feedback inmediato
  const idx = localAttendance.value.findIndex(r => r.studentId === studentId);
  if (idx !== -1) {
    localAttendance.value[idx].status = newStatus;
  } else {
    localAttendance.value.push({ studentId, status: newStatus });
  }
  updateAttendance(studentId, newStatus);
};

// Lifecycle
onMounted(() => {
  document.addEventListener('keydown', handleKeydown);
});

onUnmounted(() => {
  document.removeEventListener('keydown', handleKeydown);
});

// Watchers
watch(
  () => props.filter,
  () => {
    // Limpiar selección cuando cambie el filtro
    clearSelection();
  },
);

watch(
  () => props.searchQuery,
  () => {
    // Limpiar selección cuando cambie la búsqueda
    clearSelection();
  },
);

// Progreso de lista completada: alumnos con estado distinto de 'pending'
const completedCount = computed(() => {
  return localAttendance.value.filter(r => r.status !== 'pending').length;
});
const completionPercent = computed(() => {
  return attendanceStats.value.total > 0
    ? Math.round((completedCount.value / attendanceStats.value.total) * 100)
    : 0;
});

</script>

<style scoped>
/* Estilos básicos de tarjetas */
.student-card {
  padding: 0.5rem;
  background-color: white;
  border-radius: 0.75rem;
  box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px -1px rgba(0, 0, 0, 0.05);
  border: 1px solid #e5e7eb;
  transition: all 0.2s;
}

.student-card:hover {
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -4px rgba(0, 0, 0, 0.05);
  transform: translateY(-2px);
}

.student-card:active {
  transform: translateY(0);
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
}

.dark .student-card {
  background-color: #1f2937;
  border-color: #374151;
}

.dark .student-card:hover {
  border-color: #4b5563;
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.3), 0 4px 6px -4px rgba(0, 0, 0, 0.2);
}

/* Animaciones */
.slide-down-enter-active,
.slide-down-leave-active {
  transition: all 0.3s ease;
}

.slide-down-enter-from,
.slide-down-leave-to {
  transform: translateY(-100%);
  opacity: 0;
}

/* Animación de pulso */
@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.7;
  }
}

.animate-pulse {
  animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}

/* Loader de carga */
.loader {
  width: 48px;
  height: 48px;
  border: 5px solid #e5e7eb;
  border-bottom-color: #3b82f6;
  border-radius: 50%;
  display: inline-block;
  box-sizing: border-box;
  animation: rotation 1s linear infinite;
}

@keyframes rotation {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}

/* Tamaño de texto extra pequeño para móviles */
.text-xxs {
  font-size: 0.65rem;
  line-height: 1rem;
}

/* Breakpoint extra pequeño */
@media (min-width: 400px) {
  .xs\:text-base {
    font-size: 1rem;
    line-height: 1.5rem;
  }
  .xs\:text-sm {
    font-size: 0.875rem;
    line-height: 1.25rem;
  }
  .xs\:text-xs {
    font-size: 0.75rem;
    line-height: 1rem;
  }
  .xs\:mt-2 {
    margin-top: 0.5rem;
  }
  .xs\:px-2 {
    padding-left: 0.5rem;
    padding-right: 0.5rem;
  }
  .xs\:w-16 {
    width: 4rem;
  }
  .xs\:h-16 {
    height: 4rem;
  }
  .xs\:grid-cols-2 {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
</style>