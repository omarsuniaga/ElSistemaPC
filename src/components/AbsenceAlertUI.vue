<template>
  <div
    class="bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden transition-all hover:shadow-lg"
  >
    <!-- Header con animación de entrada -->
    <div
      v-motion="'header'"
      class="bg-gradient-to-r from-red-500 to-red-600 dark:from-red-700 dark:to-red-800 px-6 py-4"
    >
      <div class="flex items-center justify-between">
        <h3 class="text-lg font-semibold text-white flex items-center">
          <ExclamationCircleIcon class="h-5 w-5 mr-2" />
          Alertas de Inasistencia
        </h3>
        <span class="px-2 py-1 bg-white/20 rounded-full text-xs text-white">
          {{ activeFilter === "week" ? "Semanal" : "Mensual" }}
        </span>
      </div>
    </div>

    <!-- Loading state -->
    <div v-if="loading" class="p-8 flex flex-col items-center justify-center space-y-3">
      <div
        class="animate-spin rounded-full h-10 w-10 border-4 border-red-500 border-t-transparent"
      />
      <p class="text-gray-600 dark:text-gray-300">Analizando datos de asistencia...</p>
    </div>

    <!-- Empty state -->
    <div v-else-if="!hasAbsences" class="p-8 text-center">
      <div class="mx-auto h-16 w-16 text-gray-400 mb-3">
        <CheckCircleIcon />
      </div>
      <h4 class="text-lg font-medium text-gray-900 dark:text-white mb-1">¡Todo en orden!</h4>
      <p class="text-gray-500 dark:text-gray-400">No se encontraron inasistencias críticas</p>
    </div>

    <!-- Notificación flotante -->
    <Transition name="notification">
      <div
        v-if="showNotification"
        v-motion="'notification'"
        class="fixed bottom-4 right-4 z-50 px-4 py-3 bg-green-500 text-white rounded-lg shadow-lg flex items-center"
      >
        <CheckCircleIcon class="h-5 w-5 mr-2" />
        {{ notificationMessage }}
      </div>
    </Transition>

    <!-- Versión móvil optimizada -->
    <div class="md:hidden">
      <!-- Lista compacta para móviles -->
      <div
        v-for="student in filteredStudents"
        :key="student.id"
        v-motion="{
          initial: {opacity: 0, y: 20},
          enter: {opacity: 1, y: 0, transition: {delay: 100}},
        }"
        class="p-4 border-b border-gray-200 dark:border-gray-700"
      >
        <!-- Diseño móvil -->
        <div class="flex justify-between">
          <div class="flex items-center">
            <h4 class="text-lg font-medium text-gray-900 dark:text-white">{{ student.name }}</h4>
            <p class="text-gray-500 dark:text-gray-400">{{ student.absences }} inasistencias</p>
          </div>
          <div class="flex items-center">
            <p class="text-gray-500 dark:text-gray-400">{{ student.lastClass }}</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Versión desktop -->
    <div class="hidden md:block">
      <!-- Filtros -->
      <div class="px-6 py-4 flex justify-end space-x-3">
        <button
          v-for="(filter, key) in filters"
          :key="key"
          class="px-4 py-2 text-sm font-medium rounded-full transition-colors"
          :class="{
            'bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-200': activeFilter === key,
            'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600':
              activeFilter !== key,
          }"
          @click="activeFilter = key"
        >
          {{ filter.label }}
        </button>
      </div>

      <!-- Tabla mejorada -->
      <div class="overflow-x-auto">
        <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <!-- Encabezados de tabla mejorados -->
          <thead class="bg-gray-50 dark:bg-gray-700">
            <tr>
              <th
                class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
              >
                Alumno
              </th>
              <th
                class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
              >
                Inasistencias
              </th>
              <th
                class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
              >
                Última clase
              </th>
              <th
                class="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
              >
                Acciones
              </th>
            </tr>
          </thead>
          <!-- Cuerpo de tabla -->
          <tbody class="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
            <tr
              v-for="student in filteredStudents"
              :key="student.id"
              class="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              <!-- Celdas con mejor diseño -->
              <td
                class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white"
              >
                {{ student.name }}
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                {{ student.absences }} inasistencias
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                {{ student.lastClass }}
              </td>
              <td
                class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium text-gray-900 dark:text-white"
              />
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import {ExclamationCircleIcon, CheckCircleIcon} from "@heroicons/vue/24/outline"
import {useMotion} from "@vueuse/motion"
import {ref} from "vue"

// Notificaciones
const showNotification = ref(false)
const notificationMessage = ref("")

const triggerNotification = (message: string) => {
  notificationMessage.value = message
  showNotification.value = true
  setTimeout(() => (showNotification.value = false), 3000)
}

// Animaciones
const {apply: motion} = useMotion({
  header: {
    initial: {opacity: 0, y: -20},
    enter: {opacity: 1, y: 0},
  },
  notification: {
    initial: {opacity: 0, x: 100},
    enter: {opacity: 1, x: 0},
    leave: {opacity: 0, x: 100},
  },
})

defineProps({
  loading: Boolean,
  hasAbsences: Boolean,
  activeFilter: {
    type: String,
    default: "week",
  },
  filters: {
    type: Object,
    default: () => ({
      week: {label: "Semanal"},
      month: {label: "Mensual"},
    }),
  },
  filteredStudents: {
    type: Array,
    default: () => [],
  },
})
</script>

<style scoped>
/* Animación de notificación */
.notification-enter-active,
.notification-leave-active {
  transition: all 0.5s ease;
}

/* Mejoras para móvil */
@media (max-width: 640px) { /* sm */ }
@media (max-width: 768px) { /* md */ }
  .filters {
    @apply flex-col space-y-2 space-x-0;
  }

  table {
    @apply text-sm;
  }
}

/* Transiciones suaves */
button, tr {
  transition: all 0.2s ease;
}
</style>
