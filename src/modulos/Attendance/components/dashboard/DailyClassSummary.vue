<!-- 
📋 DAILY CLASS SUMMARY
Resumen optimizado de las clases del día seleccionado
-->

<template>
  <div class="space-y-4">
    <!-- 📊 ESTADÍSTICAS DEL DÍA -->
    <div
      class="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl p-4 border border-blue-200 dark:border-blue-800"
    >
      <div class="flex items-center justify-between mb-3">
        <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
          {{ formattedDate }}
        </h3>
        <div class="text-sm text-blue-600 dark:text-blue-400 font-medium">
          {{ dayStats.completionRate }}% completado
        </div>
      </div>

      <!-- Progress bar -->
      <div class="w-full bg-blue-200 dark:bg-blue-800 rounded-full h-2 mb-3">
        <div
          class="bg-blue-600 h-2 rounded-full transition-all duration-300"
          :style="{width: `${dayStats.completionRate}%`}"
        />
      </div>

      <!-- Stats grid -->
      <div class="grid grid-cols-2 gap-3 text-sm">
        <div class="text-center">
          <div class="text-2xl font-bold text-blue-600 dark:text-blue-400">
            {{ dayStats.total }}
          </div>
          <div class="text-gray-600 dark:text-gray-400">Total clases</div>
        </div>
        <div class="text-center">
          <div class="text-2xl font-bold text-green-600 dark:text-green-400">
            {{ dayStats.totalStudents }}
          </div>
          <div class="text-gray-600 dark:text-gray-400">Estudiantes</div>
        </div>
      </div>
    </div>

    <!-- 🔄 ESTADO DE CARGA -->
    <div v-if="isLoading" class="space-y-3">
      <div v-for="i in 3" :key="i" class="animate-pulse">
        <div class="bg-gray-200 dark:bg-gray-700 rounded-lg h-20" />
      </div>
    </div>

    <!-- 📝 MENSAJE SIN CLASES -->
    <div v-else-if="classes.length === 0" class="text-center py-8">
      <div
        class="w-16 h-16 mx-auto mb-4 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center"
      >
        <svg class="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
          />
        </svg>
      </div>
      <p class="text-gray-500 dark:text-gray-400 text-lg font-medium mb-2">
        No hay clases programadas
      </p>
      <p class="text-gray-400 dark:text-gray-500 text-sm mb-4">
        Puedes crear una clase emergente para este día
      </p>
      <button
        class="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
        @click="handleCreateEmergency"
      >
        Crear Clase Emergente
      </button>
    </div>

    <!-- 📋 LISTA DE CLASES -->
    <div v-else class="space-y-3">
      <!-- Clases pendientes -->
      <div v-if="groupedClasses.pending.length > 0">
        <div class="flex items-center justify-between mb-2">
          <h4 class="text-sm font-medium text-yellow-600 dark:text-yellow-400 flex items-center">
            <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            Pendientes ({{ groupedClasses.pending.length }})
          </h4>
        </div>

        <div class="space-y-2">
          <div
            v-for="classItem in groupedClasses.pending"
            :key="classItem.id"
            class="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 hover:shadow-md transition-all cursor-pointer group"
            @click="handleClassSelect(classItem)"
          >
            <div class="flex items-center justify-between">
              <div class="flex-1 min-w-0">
                <!-- Nombre y estado -->
                <div class="flex items-center space-x-2 mb-1">
                  <h5 class="text-sm font-medium text-gray-900 dark:text-white truncate">
                    {{ classItem.name }}
                  </h5>

                  <!-- Badge de rol para clases compartidas -->
                  <span
                    v-if="getRoleInfo(classItem)"
                    :class="[
                      'text-xs px-2 py-0.5 rounded-full font-medium',
                      getRoleInfo(classItem)!.color,
                    ]"
                  >
                    {{ getRoleInfo(classItem)!.label }}
                  </span>
                </div>

                <!-- Información de la clase -->
                <div class="flex items-center space-x-4 text-xs text-gray-500 dark:text-gray-400">
                  <!-- Horario -->
                  <div class="flex items-center space-x-1">
                    <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    <span>{{ formatClassTime(classItem) }}</span>
                  </div>

                  <!-- Estudiantes -->
                  <div class="flex items-center space-x-1">
                    <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                      />
                    </svg>
                    <span>{{ classItem.studentIds?.length || classItem.students || 0 }}</span>
                  </div>

                  <!-- Aula -->
                  <div v-if="classItem.classroom" class="flex items-center space-x-1">
                    <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                      />
                    </svg>
                    <span>{{ classItem.classroom }} </span>
                  </div>
                  <!-- Botón de acción -->
                  <div class="flex items-center space-x-1">
                    <button
                      v-if="classItem.canTakeAttendance"
                      :title="'Que arrechera ' + classItem.name"
                      class="p-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors group-hover:bg-blue-700 flex items-center space-x-1"
                      @click.stop="handleClassSelect(classItem)"
                    >
                      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          stroke-linecap="round"
                          stroke-linejoin="round"
                          stroke-width="2"
                          d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                      <span class="hidden sm:inline text-xs font-medium">Asistencia</span>
                    </button>
                  <div
                    v-else
                    class="p-2 bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400 rounded-lg flex items-center space-x-1"
                    title="Sin permisos para tomar asistencia"
                  >
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                      />
                    </svg>
                    <span class="hidden sm:inline text-xs font-medium">Bloqueado</span>
                  </div>
                <!-- Indicador de estado -->
                <div
                  :class="[
                    'w-8 h-8 rounded-full flex items-center justify-center',
                    getStatusIcon(classItem).bgColor,
                  ]"
                >
                  <svg
                    v-if="getStatusIcon(classItem).icon === 'clock'"
                    :class="['w-4 h-4', getStatusIcon(classItem).color]"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
              </div>
            </div>
          </div>
            
            </div>
          </div>
        </div>
      </div>

      <!-- Clases completadas -->
      <div v-if="groupedClasses.completed.length > 0">
        <div class="flex items-center justify-between mb-2">
          <h4 class="text-sm font-medium text-green-600 dark:text-green-400 flex items-center">
            <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            Completadas ({{ groupedClasses.completed.length }})
          </h4>
        </div>

        <div class="space-y-2">
          <div
            v-for="classItem in groupedClasses.completed"
            :key="classItem.id"
            class="bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800 p-4 hover:shadow-md transition-all cursor-pointer group"
            @click="handleClassSelect(classItem)"
          >
            <div class="flex items-center justify-between">
              <div class="flex-1 min-w-0">
                <!-- Nombre y estado -->
                <div class="flex items-center space-x-2 mb-1">
                  <h5 class="text-sm font-medium text-gray-900 dark:text-white truncate">
                    {{ classItem.name }}
                  </h5>

                  <!-- Badge de rol para clases compartidas -->
                  <span
                    v-if="getRoleInfo(classItem)"
                    :class="[
                      'text-xs px-2 py-0.5 rounded-full font-medium',
                      getRoleInfo(classItem)!.color,
                    ]"
                  >
                    {{ getRoleInfo(classItem)!.label }}
                  </span>
                </div>

                <!-- Información de la clase -->
                <div class="flex items-center space-x-4 text-xs text-gray-500 dark:text-gray-400">
                  <!-- Horario -->
                  <div class="flex items-center space-x-1">
                    <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    <span>{{ formatClassTime(classItem) }}</span>
                  </div>

                  <!-- Estudiantes -->
                  <div class="flex items-center space-x-1">
                    <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                      />
                    </svg>
                    <span>{{ classItem.studentIds?.length || classItem.students || 0 }}</span>
                  </div>
                </div>
              </div>

              <!-- Botón de acción -->
              <div class="flex items-center space-x-2">
                <button
                  :title="'Ver/editar asistencia de ' + classItem.name"
                  class="p-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors group-hover:bg-green-700 flex items-center space-x-1"
                  @click.stop="handleClassSelect(classItem)"
                >
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                    />
                  </svg>
                  <span class="hidden sm:inline text-xs font-medium">Editar</span>
                </button>

                <!-- Indicador de estado -->
                <div
                  :class="[
                    'w-8 h-8 rounded-full flex items-center justify-center',
                    getStatusIcon(classItem).bgColor,
                  ]"
                >
                  <svg
                    :class="['w-4 h-4', getStatusIcon(classItem).color]"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Botones de acción -->
      <div class="pt-4 border-t border-gray-200 dark:border-gray-700 space-y-3">
        <!-- Revisar en Lote -->
        <button
          v-if="dayStats.total > 1"
          class="w-full px-4 py-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg text-blue-700 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors text-sm font-medium flex items-center justify-center space-x-2"
          @click="handleBatchReview"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
          <span>Revisar en Lote ({{ dayStats.total }} clases)</span>
        </button>

        <!-- Crear clase emergente -->
        <button
          class="w-full px-4 py-3 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg text-gray-500 dark:text-gray-400 hover:border-blue-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors text-sm font-medium"
          @click="handleCreateEmergency"
        >
          + Crear Clase Emergente
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';

// Tipos
interface ClassItem {
  id: string
  name: string
  time?: string
  students?: number
  studentIds?: string[]
  hasAttendance: boolean
  classroom?: string
  teacher?: string
  schedule?: {
    slots: Array<{
      id: string
      startTime: string
      endTime: string
    }>
  }
  // Propiedades de clases compartidas
  isSharedClass?: boolean
  isPrimaryTeacher?: boolean
  isCollaboratingTeacher?: boolean
  participationType?: string
  userRole?: string
  canTakeAttendance?: boolean
}

// Props
const props = defineProps<{
  classes: ClassItem[]
  selectedDate: string
  isLoading?: boolean
}>();

// Emits
const emit = defineEmits<{
  'select-class': [classId: string]
  'create-emergency': []
  'batch-review': []
}>();

/**
 * 🎯 COMPUTED PROPERTIES
 */

// Fecha formateada
const formattedDate = computed(() => {
  if (!props.selectedDate) return '';

  const date = parseISO(props.selectedDate);
  return format(date, 'd \'de\' MMMM', { locale: es });
});

// Estadísticas del día
const dayStats = computed(() => {
  console.log('📋 [DailyClassSummary] Props received:', {
    classesCount: props.classes.length,
    selectedDate: props.selectedDate,
    classes: props.classes,
  });
  
  const total = props.classes.length;
  const completed = props.classes.filter((c) => c.hasAttendance).length;
  const pending = total - completed;
  const totalStudents = props.classes.reduce(
    (sum, cls) => sum + (cls.studentIds?.length || cls.students || 0),
    0,
  );

  return {
    total,
    completed,
    pending,
    totalStudents,
    completionRate: total > 0 ? Math.round((completed / total) * 100) : 0,
  };
});

// Clases agrupadas por estado
const groupedClasses = computed(() => {
  const completed = props.classes.filter((c) => c.hasAttendance);
  const pending = props.classes.filter((c) => !c.hasAttendance);

  return { completed, pending };
});

/**
 * 🎯 MÉTODOS
 */

// Formatear horario de clase
const formatClassTime = (classItem: ClassItem): string => {
  if (classItem.schedule?.slots?.length) {
    const slots = classItem.schedule.slots;
    if (slots.length === 1) {
      return `${formatTime(slots[0].startTime)} - ${formatTime(slots[0].endTime)}`;
    } else {
      return `${slots.length} horarios`;
    }
  }
  return classItem.time || 'Horario no definido';
};

// Formatear hora individual
const formatTime = (timeStr: string): string => {
  if (!timeStr || !/^\d{2}:\d{2}$/.test(timeStr)) return timeStr;

  const [hours, minutes] = timeStr.split(':');
  const date = new Date();
  date.setHours(parseInt(hours, 10));
  date.setMinutes(parseInt(minutes, 10));

  return format(date, 'h:mm a', { locale: es });
};

// Obtener icono de estado para una clase
const getStatusIcon = (classItem: ClassItem) => {
  if (classItem.hasAttendance) {
    return {
      icon: 'check-circle',
      color: 'text-green-500',
      bgColor: 'bg-green-100 dark:bg-green-900/20',
    };
  } else {
    return {
      icon: 'clock',
      color: 'text-yellow-500',
      bgColor: 'bg-yellow-100 dark:bg-yellow-900/20',
    };
  }
};

// Obtener información de rol para clases compartidas
const getRoleInfo = (classItem: ClassItem) => {
  if (!classItem.isSharedClass) return null;

  if (classItem.isPrimaryTeacher) {
    return {
      label: 'Principal',
      color: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/20 dark:text-indigo-400',
    };
  } else if (classItem.isCollaboratingTeacher) {
    return {
      label: classItem.userRole === 'assistant' ? 'Asistente' : 'Colaborador',
      color: 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400',
    };
  }

  return null;
};

// Manejar selección de clase
const handleClassSelect = (classItem: ClassItem) => {
  if (!classItem.canTakeAttendance) {
    console.warn('⚠️ [DailyClassSummary] Sin permisos para tomar asistencia:', classItem.name);
    return;
  }

  console.log('📋 [DailyClassSummary] Class selected:', classItem.id);
  emit('select-class', classItem.id);
};

// Crear clase emergente
const handleCreateEmergency = () => {
  console.log('🚨 [DailyClassSummary] Creating emergency class');
  emit('create-emergency');
};

// Revisar clases en lote
const handleBatchReview = () => {
  console.log('📋 [DailyClassSummary] Initiating batch review');
  emit('batch-review');
};
</script>

<style scoped>
/* Efectos de hover mejorados */
.hover\:shadow-md:hover {
  box-shadow:
    0 4px 6px -1px rgba(0, 0, 0, 0.1),
    0 2px 4px -1px rgba(0, 0, 0, 0.06);
}

/* Animaciones suaves para botones en grupo */
.group:hover .group-hover\:bg-blue-700 {
  background-color: rgb(29 78 216);
}

.group:hover .group-hover\:bg-green-700 {
  background-color: rgb(21 128 61);
}
</style>
