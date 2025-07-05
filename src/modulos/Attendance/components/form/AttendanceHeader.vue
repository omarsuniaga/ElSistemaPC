<!-- 
📋 ATTENDANCE HEADER
Header optimizado para el formulario de asistencia con información contextual
-->

<script setup lang="ts">
import {computed} from "vue"

// Tipos
interface ClassInfo {
  id: string
  name: string
  teacher: string
  date: string
  time: string
  classroom?: string
  totalStudents: number
}

interface AttendanceStats {
  presente: number
  ausente: number
  tardanza: number
  justificado: number
  total: number
  attendanceRate: number
  changedCount: number
}

// Props
const props = defineProps<{
  classInfo: ClassInfo
  formattedDate: string
  attendanceStats: AttendanceStats
  isLoading?: boolean
}>()

// Emits
const emit = defineEmits<{
  back: []
}>()

/**
 * 🎯 COMPUTED PROPERTIES
 */

// Estado de la asistencia basado en estadísticas
const attendanceStatus = computed(() => {
  const {presente, total, attendanceRate} = props.attendanceStats

  if (total === 0) {
    return {
      type: "empty",
      message: "Sin estudiantes",
      color: "gray",
      bgColor: "bg-gray-50 dark:bg-gray-800/50",
    }
  }

  if (attendanceRate >= 90) {
    return {
      type: "excellent",
      message: "Excelente asistencia",
      color: "green",
      bgColor: "bg-green-50 dark:bg-green-900/20",
    }
  } else if (attendanceRate >= 75) {
    return {
      type: "good",
      message: "Buena asistencia",
      color: "blue",
      bgColor: "bg-blue-50 dark:bg-blue-900/20",
    }
  } else if (attendanceRate >= 50) {
    return {
      type: "regular",
      message: "Asistencia regular",
      color: "yellow",
      bgColor: "bg-yellow-50 dark:bg-yellow-900/20",
    }
  } else {
    return {
      type: "low",
      message: "Baja asistencia",
      color: "red",
      bgColor: "bg-red-50 dark:bg-red-900/20",
    }
  }
})

// Configuración de colores para estadísticas
const getStatColor = (type: string) => {
  const colors = {
    presente: "text-green-600 dark:text-green-400",
    ausente: "text-red-600 dark:text-red-400",
    tardanza: "text-yellow-600 dark:text-yellow-400",
    justificado: "text-blue-600 dark:text-blue-400",
  }
  return colors[type as keyof typeof colors] || "text-gray-600 dark:text-gray-400"
}

// Progreso visual
const progressConfig = computed(() => {
  const {color} = attendanceStatus.value

  const configs = {
    green: {
      bg: "bg-green-200 dark:bg-green-800",
      fill: "bg-green-600 dark:bg-green-500",
    },
    blue: {
      bg: "bg-blue-200 dark:bg-blue-800",
      fill: "bg-blue-600 dark:bg-blue-500",
    },
    yellow: {
      bg: "bg-yellow-200 dark:bg-yellow-800",
      fill: "bg-yellow-600 dark:bg-yellow-500",
    },
    red: {
      bg: "bg-red-200 dark:bg-red-800",
      fill: "bg-red-600 dark:bg-red-500",
    },
    gray: {
      bg: "bg-gray-200 dark:bg-gray-700",
      fill: "bg-gray-400 dark:bg-gray-500",
    },
  }

  return configs[color as keyof typeof configs] || configs.gray
})
</script>

<template>
  <header
    :class="[
      'sticky top-0 z-20 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 transition-all duration-200',
      attendanceStatus.bgColor,
    ]"
  >
    <div class="px-4 py-4">
      <!-- 🔙 NAVEGACIÓN Y TÍTULO -->
      <div class="flex items-center justify-between mb-4">
        <div class="flex items-center space-x-3">
          <!-- Botón de regreso -->
          <button
            class="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            @click="emit('back')"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M15 19l-7-7 7-7"
              />
            </svg>
          </button>

          <!-- Información de la clase -->
          <div class="min-w-0 flex-1">
            <h1 class="text-xl font-bold text-gray-900 dark:text-white truncate">
              {{ classInfo.name }}
            </h1>
            <div class="flex items-center space-x-3 text-sm text-gray-500 dark:text-gray-400 mt-1">
              <!-- Fecha -->
              <div class="flex items-center space-x-1">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
                <span>{{ formattedDate }}</span>
              </div>

              <!-- Horario -->
              <div class="flex items-center space-x-1">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <span>{{ classInfo.time }}</span>
              </div>

              <!-- Aula -->
              <div v-if="classInfo.classroom" class="flex items-center space-x-1">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                  />
                </svg>
                <span>{{ classInfo.classroom }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Indicador de cambios pendientes -->
        <div v-if="attendanceStats.changedCount > 0" class="flex items-center space-x-2">
          <div class="w-2 h-2 bg-yellow-500 rounded-full animate-pulse" />
          <span class="text-sm text-yellow-600 dark:text-yellow-400 font-medium">
            {{ attendanceStats.changedCount }} cambio{{
              attendanceStats.changedCount > 1 ? "s" : ""
            }}
          </span>
        </div>
      </div>

      <!-- 📊 ESTADÍSTICAS EN TIEMPO REAL -->
      <div class="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-4">
        <!-- Total de estudiantes -->
        <div
          class="bg-white dark:bg-gray-800 rounded-lg p-3 border border-gray-200 dark:border-gray-700"
        >
          <div class="flex items-center justify-between">
            <div>
              <p
                class="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide"
              >
                Total
              </p>
              <p class="text-2xl font-bold text-gray-900 dark:text-white">
                {{ attendanceStats.total }}
              </p>
            </div>
            <div
              class="w-8 h-8 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center"
            >
              <svg
                class="w-4 h-4 text-gray-600 dark:text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                />
              </svg>
            </div>
          </div>
        </div>

        <!-- Presentes -->
        <div
          class="bg-white dark:bg-gray-800 rounded-lg p-3 border border-gray-200 dark:border-gray-700"
        >
          <div class="flex items-center justify-between">
            <div>
              <p
                class="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide"
              >
                Presente
              </p>
              <p :class="['text-2xl font-bold', getStatColor('presente')]">
                {{ attendanceStats.presente }}
              </p>
            </div>
            <div
              class="w-8 h-8 bg-green-100 dark:bg-green-900/20 rounded-lg flex items-center justify-center"
            >
              <svg
                class="w-4 h-4 text-green-600 dark:text-green-400"
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

        <!-- Ausentes -->
        <div
          class="bg-white dark:bg-gray-800 rounded-lg p-3 border border-gray-200 dark:border-gray-700"
        >
          <div class="flex items-center justify-between">
            <div>
              <p
                class="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide"
              >
                Ausente
              </p>
              <p :class="['text-2xl font-bold', getStatColor('ausente')]">
                {{ attendanceStats.ausente }}
              </p>
            </div>
            <div
              class="w-8 h-8 bg-red-100 dark:bg-red-900/20 rounded-lg flex items-center justify-center"
            >
              <svg
                class="w-4 h-4 text-red-600 dark:text-red-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </div>
          </div>
        </div>

        <!-- Tardanza -->
        <div
          class="bg-white dark:bg-gray-800 rounded-lg p-3 border border-gray-200 dark:border-gray-700"
        >
          <div class="flex items-center justify-between">
            <div>
              <p
                class="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide"
              >
                Tardanza
              </p>
              <p :class="['text-2xl font-bold', getStatColor('tardanza')]">
                {{ attendanceStats.tardanza }}
              </p>
            </div>
            <div
              class="w-8 h-8 bg-yellow-100 dark:bg-yellow-900/20 rounded-lg flex items-center justify-center"
            >
              <svg
                class="w-4 h-4 text-yellow-600 dark:text-yellow-400"
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

        <!-- Justificados -->
        <div
          class="bg-white dark:bg-gray-800 rounded-lg p-3 border border-gray-200 dark:border-gray-700"
        >
          <div class="flex items-center justify-between">
            <div>
              <p
                class="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide"
              >
                Justificado
              </p>
              <p :class="['text-2xl font-bold', getStatColor('justificado')]">
                {{ attendanceStats.justificado }}
              </p>
            </div>
            <div
              class="w-8 h-8 bg-blue-100 dark:bg-blue-900/20 rounded-lg flex items-center justify-center"
            >
              <svg
                class="w-4 h-4 text-blue-600 dark:text-blue-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
            </div>
          </div>
        </div>
      </div>

      <!-- 📈 BARRA DE PROGRESO Y ESTADO -->
      <div
        class="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700"
      >
        <div class="flex items-center justify-between mb-3">
          <div>
            <h3 class="text-sm font-semibold text-gray-900 dark:text-white">
              Progreso de Asistencia
            </h3>
            <p
              :class="[
                'text-xs font-medium',
                attendanceStatus.color === 'green'
                  ? 'text-green-600 dark:text-green-400'
                  : attendanceStatus.color === 'blue'
                    ? 'text-blue-600 dark:text-blue-400'
                    : attendanceStatus.color === 'yellow'
                      ? 'text-yellow-600 dark:text-yellow-400'
                      : attendanceStatus.color === 'red'
                        ? 'text-red-600 dark:text-red-400'
                        : 'text-gray-600 dark:text-gray-400',
              ]"
            >
              {{ attendanceStatus.message }}
            </p>
          </div>

          <!-- Porcentaje grande -->
          <div class="text-right">
            <div
              :class="[
                'text-3xl font-bold',
                attendanceStatus.color === 'green'
                  ? 'text-green-600 dark:text-green-400'
                  : attendanceStatus.color === 'blue'
                    ? 'text-blue-600 dark:text-blue-400'
                    : attendanceStatus.color === 'yellow'
                      ? 'text-yellow-600 dark:text-yellow-400'
                      : attendanceStatus.color === 'red'
                        ? 'text-red-600 dark:text-red-400'
                        : 'text-gray-600 dark:text-gray-400',
              ]"
            >
              {{ attendanceStats.attendanceRate }}%
            </div>
            <div class="text-xs text-gray-500 dark:text-gray-400">de asistencia</div>
          </div>
        </div>

        <!-- Barra de progreso -->
        <div :class="['w-full rounded-full h-3', progressConfig.bg]">
          <div
            :class="['h-3 rounded-full transition-all duration-500 ease-out', progressConfig.fill]"
            :style="{width: `${attendanceStats.attendanceRate}%`}"
          />
        </div>

        <!-- Detalles del progreso -->
        <div class="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-2">
          <span>{{ attendanceStats.presente }} de {{ attendanceStats.total }} presentes</span>
          <span v-if="isLoading" class="flex items-center space-x-1">
            <div class="animate-spin rounded-full h-3 w-3 border-b-2 border-current" />
            <span>Actualizando...</span>
          </span>
        </div>
      </div>
    </div>
  </header>
</template>

<style scoped>
/* Animaciones personalizadas */
.animate-slide-down {
  animation: slideDown 0.3s ease-out;
}

@keyframes slideDown {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Efectos de hover mejorados */
button:hover {
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

button:active {
  transform: translateY(0);
}

/* Transiciones suaves */
.transition-all {
  transition-property: all;
  transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
  transition-duration: 200ms;
}
</style>
