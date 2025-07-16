<!-- 
📊 ATTENDANCE STATS OVERVIEW
Resumen de estadísticas de asistencia para el dashboard
-->

<template>
  <div class="space-y-4">
    <!-- 📅 HEADER PRINCIPAL CON ESTADO DEL DÍA -->
    <div
      :class="[
        'rounded-xl p-4 border transition-all duration-300',
        dayStatus.bgColor,
        dayStatus.borderColor,
      ]"
    >
      <div class="flex items-center justify-between mb-3">
        <div>
          <h2 class="text-lg font-semibold text-gray-900 dark:text-white">
            Resumen de {{ formattedDate }}
          </h2>
          <p
            :class="[
              'text-sm font-medium',
              dayStatus.color === 'green'
                ? 'text-green-700 dark:text-green-400'
                : dayStatus.color === 'yellow'
                  ? 'text-yellow-700 dark:text-yellow-400'
                  : dayStatus.color === 'blue'
                    ? 'text-blue-700 dark:text-blue-400'
                    : 'text-gray-600 dark:text-gray-400',
            ]"
          >
            {{ dayStatus.message }}
          </p>
        </div>

        <!-- Indicador circular de progreso -->
        <div class="relative w-16 h-16">
          <svg class="w-16 h-16 transform -rotate-90" viewBox="0 0 36 36">
            <!-- Círculo de fondo -->
            <path
              class="stroke-current text-gray-200 dark:text-gray-700"
              stroke-width="3"
              fill="none"
              d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
            />
            <!-- Círculo de progreso -->
            <path
              :class="[
                'stroke-current transition-all duration-500',
                dayStatus.color === 'green'
                  ? 'text-green-600'
                  : dayStatus.color === 'yellow'
                    ? 'text-yellow-600'
                    : dayStatus.color === 'blue'
                      ? 'text-blue-600'
                      : 'text-gray-400',
              ]"
              stroke-width="3"
              fill="none"
              :stroke-dasharray="`${completionRate}, 100`"
              d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
            />
          </svg>
          <!-- Porcentaje en el centro -->
          <div class="absolute inset-0 flex items-center justify-center">
            <span
              :class="[
                'text-sm font-bold',
                dayStatus.color === 'green'
                  ? 'text-green-700 dark:text-green-400'
                  : dayStatus.color === 'yellow'
                    ? 'text-yellow-700 dark:text-yellow-400'
                    : dayStatus.color === 'blue'
                      ? 'text-blue-700 dark:text-blue-400'
                      : 'text-gray-600 dark:text-gray-400',
              ]"
            >
              {{ completionRate }}%
            </span>
          </div>
        </div>
      </div>

      <!-- Barra de progreso lineal -->
      <div v-if="stats.totalClassesToday > 0" class="w-full">
        <div :class="['w-full rounded-full h-2', progressConfig.bg]">
          <div
            :class="['h-2 rounded-full transition-all duration-500 ease-out', progressConfig.fill]"
            :style="{width: `${completionRate}%`}"
          />
        </div>
        <div class="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-1">
          <span>{{ stats.completedToday }} completadas</span>
          <span>{{ stats.pendingToday }} pendientes</span>
        </div>
      </div>
    </div>

    <!-- 📊 TARJETAS DE ESTADÍSTICAS -->
    <div class="grid grid-cols-2 lg:grid-cols-4 gap-3">
      <div
        v-for="(card, index) in statCards"
        :key="index"
        :class="[
          'rounded-lg p-3 border border-gray-200 dark:border-gray-700 transition-all duration-200 hover:shadow-md',
          getCardBackground(card.color),
        ]"
      >
        <div class="flex items-center justify-between mb-2">
          <div
            :class="[
              'w-8 h-8 rounded-lg flex items-center justify-center',
              getCardBackground(card.color),
            ]"
          >
            <svg
              :class="['w-4 h-4', getIconClasses(card.color)]"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                :d="renderIcon(card.icon)"
              />
            </svg>
          </div>
        </div>

        <div>
          <div class="text-2xl font-bold text-gray-900 dark:text-white mb-1">
            {{ isLoading ? "..." : card.value }}
          </div>
          <div class="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
            {{ card.label }}
          </div>
          <div class="text-xs text-gray-500 dark:text-gray-500">
            {{ card.sublabel }}
          </div>
        </div>

        <!-- Loading indicator -->
        <div
          v-if="isLoading"
          class="absolute inset-0 bg-white/50 dark:bg-gray-800/50 rounded-lg flex items-center justify-center"
        >
          <div class="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600" />
        </div>
      </div>
    </div>

    <!-- 🚀 ACCIONES RÁPIDAS -->
    <div
      v-if="stats.totalClassesToday > 0"
      class="flex items-center justify-between p-3 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700"
    >
      <div class="text-sm text-gray-600 dark:text-gray-400">
        Progreso del día: {{ stats.completedToday }}/{{ stats.totalClassesToday }} clases
      </div>

      <div v-if="stats.pendingToday > 0" class="flex items-center space-x-2">
        <span class="text-xs text-yellow-600 dark:text-yellow-400 font-medium">
          {{ stats.pendingToday }} pendiente{{ stats.pendingToday > 1 ? "s" : "" }}
        </span>
        <div class="w-2 h-2 rounded-full bg-yellow-500 animate-pulse" />
      </div>

      <div v-else class="flex items-center space-x-2">
        <span class="text-xs text-green-600 dark:text-green-400 font-medium">
          ¡Todo completado!
        </span>
        <div class="w-2 h-2 rounded-full bg-green-500" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';

// Tipos
interface AttendanceStats {
  totalClassesToday: number
  completedToday: number
  pendingToday: number
  weeklyAttendanceRate: number
  totalStudentsToday: number
}

// Props
const props = defineProps<{
  stats: AttendanceStats
  selectedDate: string
  isLoading?: boolean
}>();

/**
 * 🎯 COMPUTED PROPERTIES
 */

// Fecha formateada
const formattedDate = computed(() => {
  if (!props.selectedDate) return 'Hoy';

  const date = parseISO(props.selectedDate);
  const today = new Date();
  const isToday = format(date, 'yyyy-MM-dd') === format(today, 'yyyy-MM-dd');

  if (isToday) return 'Hoy';

  return format(date, 'EEEE d', { locale: es }).replace(/^\w/, (c) => c.toUpperCase());
});

// Tasa de completitud
const completionRate = computed(() => {
  if (props.stats.totalClassesToday === 0) return 0;
  return Math.round((props.stats.completedToday / props.stats.totalClassesToday) * 100);
});

// Estado general del día
const dayStatus = computed(() => {
  const { totalClassesToday, completedToday, pendingToday } = props.stats;

  if (totalClassesToday === 0) {
    return {
      status: 'no-classes',
      message: 'No hay clases programadas',
      color: 'gray',
      bgColor: 'bg-gray-50 dark:bg-gray-800/50',
      borderColor: 'border-gray-200 dark:border-gray-700',
    };
  }

  if (completedToday === totalClassesToday) {
    return {
      status: 'completed',
      message: 'Todas las clases completadas',
      color: 'green',
      bgColor: 'bg-green-50 dark:bg-green-900/20',
      borderColor: 'border-green-200 dark:border-green-800',
    };
  }

  if (completedToday > 0) {
    return {
      status: 'partial',
      message: `${pendingToday} clase${pendingToday > 1 ? 's' : ''} pendiente${pendingToday > 1 ? 's' : ''}`,
      color: 'yellow',
      bgColor: 'bg-yellow-50 dark:bg-yellow-900/20',
      borderColor: 'border-yellow-200 dark:border-yellow-800',
    };
  }

  return {
    status: 'pending',
    message: 'Todas las clases pendientes',
    color: 'blue',
    bgColor: 'bg-blue-50 dark:bg-blue-900/20',
    borderColor: 'border-blue-200 dark:border-blue-800',
  };
});

// Configuración de los indicadores de progreso
const progressConfig = computed(() => {
  const { color } = dayStatus.value;

  const colors = {
    green: {
      bg: 'bg-green-200 dark:bg-green-800',
      fill: 'bg-green-600 dark:bg-green-500',
    },
    yellow: {
      bg: 'bg-yellow-200 dark:bg-yellow-800',
      fill: 'bg-yellow-600 dark:bg-yellow-500',
    },
    blue: {
      bg: 'bg-blue-200 dark:bg-blue-800',
      fill: 'bg-blue-600 dark:bg-blue-500',
    },
    gray: {
      bg: 'bg-gray-200 dark:bg-gray-700',
      fill: 'bg-gray-400 dark:bg-gray-500',
    },
  };

  return colors[color as keyof typeof colors] || colors.gray;
});

// Tarjetas de estadísticas
const statCards = computed(() => {
  const {
    totalClassesToday,
    completedToday,
    pendingToday,
    totalStudentsToday,
    weeklyAttendanceRate,
  } = props.stats;

  return [
    {
      label: 'Clases del día',
      value: totalClassesToday,
      sublabel: completedToday > 0 ? `${completedToday} completadas` : 'Ninguna completada',
      icon: 'calendar',
      color: totalClassesToday > 0 ? 'blue' : 'gray',
    },
    {
      label: 'Estudiantes',
      value: totalStudentsToday,
      sublabel:
        totalClassesToday > 0
          ? `En ${totalClassesToday} clase${totalClassesToday > 1 ? 's' : ''}`
          : 'Ninguno',
      icon: 'users',
      color: totalStudentsToday > 0 ? 'indigo' : 'gray',
    },
    {
      label: 'Pendientes',
      value: pendingToday,
      sublabel: pendingToday > 0 ? 'Por completar' : 'Todo al día',
      icon: 'clock',
      color: pendingToday > 0 ? 'yellow' : 'green',
    },
    {
      label: 'Promedio semanal',
      value: `${weeklyAttendanceRate}%`,
      sublabel:
        weeklyAttendanceRate >= 90
          ? 'Excelente'
          : weeklyAttendanceRate >= 75
            ? 'Bueno'
            : 'Mejorable',
      icon: 'chart',
      color: weeklyAttendanceRate >= 90 ? 'green' : weeklyAttendanceRate >= 75 ? 'yellow' : 'red',
    },
  ];
});

/**
 * 🎯 MÉTODOS
 */

// Obtener clases CSS para iconos
const getIconClasses = (color: string) => {
  const colorMap = {
    blue: 'text-blue-600 dark:text-blue-400',
    indigo: 'text-indigo-600 dark:text-indigo-400',
    green: 'text-green-600 dark:text-green-400',
    yellow: 'text-yellow-600 dark:text-yellow-400',
    red: 'text-red-600 dark:text-red-400',
    gray: 'text-gray-600 dark:text-gray-400',
  };

  return colorMap[color as keyof typeof colorMap] || colorMap.gray;
};

// Obtener fondo para tarjetas de estadísticas
const getCardBackground = (color: string) => {
  const bgMap = {
    blue: 'bg-blue-50 dark:bg-blue-900/20',
    indigo: 'bg-indigo-50 dark:bg-indigo-900/20',
    green: 'bg-green-50 dark:bg-green-900/20',
    yellow: 'bg-yellow-50 dark:bg-yellow-900/20',
    red: 'bg-red-50 dark:bg-red-900/20',
    gray: 'bg-gray-50 dark:bg-gray-800/50',
  };

  return bgMap[color as keyof typeof bgMap] || bgMap.gray;
};

// Renderizar icono SVG
const renderIcon = (iconName: string) => {
  const icons = {
    calendar:
      'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z',
    users:
      'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z',
    clock: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z',
    chart:
      'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z',
  };

  return icons[iconName as keyof typeof icons] || icons.calendar;
};
</script>

<style scoped>
/* Animaciones personalizadas */
@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.animate-slide-in {
  animation: slideIn 0.3s ease-out;
}

/* Hover effects mejorados */
.hover\:shadow-md:hover {
  box-shadow:
    0 4px 6px -1px rgba(0, 0, 0, 0.1),
    0 2px 4px -1px rgba(0, 0, 0, 0.06);
}

/* Transiciones suaves para los colores */
.transition-all {
  transition-property: all;
  transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
  transition-duration: 300ms;
}
</style>
