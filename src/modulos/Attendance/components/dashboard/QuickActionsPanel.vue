<!-- 
⚡ QUICK ACTIONS PANEL
Panel de acciones rápidas para optimizar el flujo de trabajo del maestro
-->

<script setup lang="ts">
import {computed, ref} from "vue"

// Tipos
interface ClassItem {
  id: string
  name: string
  hasAttendance: boolean
  students?: number
  studentIds?: string[]
  canTakeAttendance?: boolean
}

// Props
const props = defineProps<{
  classes: ClassItem[]
  selectedDate: string
}>()

// Emits
const emit = defineEmits<{
  "quick-complete-all": []
  "create-emergency": []
}>()

// Estado del componente
const isProcessing = ref(false)
const showConfirmDialog = ref(false)

/**
 * 🎯 COMPUTED PROPERTIES
 */

// Clases pendientes que se pueden completar automáticamente
const pendingClasses = computed(() => {
  return props.classes.filter((cls) => !cls.hasAttendance && cls.canTakeAttendance)
})

// Estadísticas de acciones rápidas
const quickStats = computed(() => {
  const total = props.classes.length
  const pending = pendingClasses.value.length
  const totalStudents = props.classes.reduce(
    (sum, cls) => sum + (cls.studentIds?.length || cls.students || 0),
    0
  )
  const pendingStudents = pendingClasses.value.reduce(
    (sum, cls) => sum + (cls.studentIds?.length || cls.students || 0),
    0
  )

  return {
    total,
    pending,
    totalStudents,
    pendingStudents,
    canQuickComplete: pending > 0 && pending === total,
  }
})

// Configuración de botones de acción
const actionButtons = computed(() => [
  {
    id: "quick-complete",
    label: "Marcar Todo Presente",
    description: `${quickStats.value.pending} clase${quickStats.value.pending > 1 ? "s" : ""} (${quickStats.value.pendingStudents} estudiantes)`,
    icon: "check-all",
    color: "green",
    enabled: quickStats.value.pending > 0,
    dangerous: false,
    action: () => handleQuickCompleteAll(),
  },
  {
    id: "create-emergency",
    label: "Clase Emergente",
    description: "Crear nueva clase para hoy",
    icon: "plus",
    color: "blue",
    enabled: true,
    dangerous: false,
    action: () => handleCreateEmergency(),
  },
  {
    id: "batch-review",
    label: "Revisar en Lote",
    description: "Verificar todas las clases",
    icon: "eye",
    color: "purple",
    enabled: props.classes.length > 0,
    dangerous: false,
    action: () => handleBatchReview(),
  },
])

/**
 * 🎯 MÉTODOS
 */

// Completar todas las clases pendientes automáticamente
const handleQuickCompleteAll = () => {
  if (quickStats.value.pending === 0) return

  console.log("⚡ [QuickActions] Quick complete all requested")
  showConfirmDialog.value = true
}

// Confirmar completar todas las clases
const confirmQuickComplete = async () => {
  isProcessing.value = true
  showConfirmDialog.value = false

  try {
    console.log("⚡ [QuickActions] Executing quick complete all...")
    emit("quick-complete-all")

    // Simular procesamiento
    await new Promise((resolve) => setTimeout(resolve, 1500))
  } catch (error) {
    console.error("❌ [QuickActions] Error in quick complete:", error)
  } finally {
    isProcessing.value = false
  }
}

// Crear clase emergente
const handleCreateEmergency = () => {
  console.log("🚨 [QuickActions] Create emergency class requested")
  emit("create-emergency")
}

// Revisar en lote (placeholder)
const handleBatchReview = () => {
  console.log("👁️ [QuickActions] Batch review requested")
  // TODO: Implementar revisión en lote
}

// Obtener clases CSS para botones
const getButtonClasses = (button: any) => {
  if (!button.enabled) {
    return "bg-gray-100 text-gray-400 dark:bg-gray-800 dark:text-gray-600 cursor-not-allowed"
  }

  const colorMap = {
    green:
      "bg-green-50 text-green-700 hover:bg-green-100 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:hover:bg-green-800/30 dark:border-green-800",
    blue: "bg-blue-50 text-blue-700 hover:bg-blue-100 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:hover:bg-blue-800/30 dark:border-blue-800",
    purple:
      "bg-purple-50 text-purple-700 hover:bg-purple-100 border-purple-200 dark:bg-purple-900/20 dark:text-purple-400 dark:hover:bg-purple-800/30 dark:border-purple-800",
    red: "bg-red-50 text-red-700 hover:bg-red-100 border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:hover:bg-red-800/30 dark:border-red-800",
  }

  return colorMap[button.color as keyof typeof colorMap] || colorMap.blue
}

// Renderizar iconos SVG
const renderIcon = (iconName: string) => {
  const icons = {
    "check-all": "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z",
    plus: "M12 6v6m0 0v6m0-6h6m-6 0H6",
    eye: "M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z",
    clock: "M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z",
  }

  return icons[iconName as keyof typeof icons] || icons.plus
}
</script>

<template>
  <div class="space-y-4">
    <!-- 📊 HEADER CON ESTADÍSTICAS -->
    <div
      class="bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 rounded-lg p-4 border border-indigo-200 dark:border-indigo-800"
    >
      <h3 class="text-sm font-semibold text-gray-900 dark:text-white mb-2 flex items-center">
        <svg
          class="w-4 h-4 mr-2 text-indigo-600 dark:text-indigo-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M13 10V3L4 14h7v7l9-11h-7z"
          />
        </svg>
        Acciones Rápidas
      </h3>

      <div class="grid grid-cols-2 gap-3 text-xs">
        <div class="text-center">
          <div class="text-lg font-bold text-indigo-600 dark:text-indigo-400">
            {{ quickStats.pending }}
          </div>
          <div class="text-gray-600 dark:text-gray-400">Pendientes</div>
        </div>
        <div class="text-center">
          <div class="text-lg font-bold text-purple-600 dark:text-purple-400">
            {{ quickStats.pendingStudents }}
          </div>
          <div class="text-gray-600 dark:text-gray-400">Estudiantes</div>
        </div>
      </div>
    </div>

    <!-- ⚡ BOTONES DE ACCIÓN -->
    <div class="space-y-3">
      <button
        v-for="button in actionButtons"
        :key="button.id"
        :disabled="!button.enabled || isProcessing"
        :class="[
          'w-full p-3 rounded-lg border transition-all duration-200 text-left',
          getButtonClasses(button),
          isProcessing ? 'opacity-50 cursor-not-allowed' : '',
        ]"
        @click="button.action"
      >
        <div class="flex items-center justify-between">
          <div class="flex items-center space-x-3">
            <!-- Icono -->
            <div
              :class="[
                'w-8 h-8 rounded-lg flex items-center justify-center',
                button.enabled ? 'bg-white/50 dark:bg-gray-800/50' : 'bg-gray-200 dark:bg-gray-700',
              ]"
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  :d="renderIcon(button.icon)"
                />
              </svg>
            </div>

            <!-- Contenido -->
            <div>
              <div class="font-medium">{{ button.label }}</div>
              <div class="text-xs opacity-75 mt-0.5">{{ button.description }}</div>
            </div>
          </div>

          <!-- Indicador de estado -->
          <div
            v-if="isProcessing && button.id === 'quick-complete'"
            class="flex items-center space-x-1"
          >
            <div class="animate-spin rounded-full h-4 w-4 border-b-2 border-current" />
            <span class="text-xs">Procesando...</span>
          </div>
          <div v-else-if="button.enabled" class="opacity-50">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M9 5l7 7-7 7"
              />
            </svg>
          </div>
        </div>
      </button>
    </div>

    <!-- 💡 CONSEJOS Y SUGERENCIAS -->
    <div
      v-if="quickStats.pending > 0"
      class="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3"
    >
      <div class="flex items-start space-x-2">
        <svg
          class="w-4 h-4 text-yellow-600 dark:text-yellow-400 mt-0.5 flex-shrink-0"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
          />
        </svg>
        <div class="text-xs">
          <div class="font-medium text-yellow-800 dark:text-yellow-300 mb-1">Consejo</div>
          <div class="text-yellow-700 dark:text-yellow-400">
            Para clases regulares donde todos asisten normalmente, usa "Marcar Todo Presente" para
            ahorrar tiempo.
          </div>
        </div>
      </div>
    </div>

    <!-- 🎯 PROGRESO DEL DÍA -->
    <div
      v-if="props.classes.length > 0"
      class="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-3 border border-gray-200 dark:border-gray-700"
    >
      <div class="flex items-center justify-between mb-2">
        <span class="text-xs font-medium text-gray-600 dark:text-gray-400">Progreso del día</span>
        <span class="text-xs text-gray-500 dark:text-gray-500">
          {{ quickStats.total - quickStats.pending }}/{{ quickStats.total }}
        </span>
      </div>

      <div class="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
        <div
          class="bg-green-600 h-2 rounded-full transition-all duration-500"
          :style="{
            width: `${quickStats.total > 0 ? ((quickStats.total - quickStats.pending) / quickStats.total) * 100 : 0}%`,
          }"
        />
      </div>
    </div>
  </div>

  <!-- 🔔 MODAL DE CONFIRMACIÓN -->
  <div
    v-if="showConfirmDialog"
    class="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50"
  >
    <div class="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-md w-full mx-4">
      <div class="p-6">
        <div class="flex items-center space-x-3 mb-4">
          <div
            class="w-10 h-10 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center"
          >
            <svg
              class="w-5 h-5 text-green-600 dark:text-green-400"
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
          <div>
            <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
              Marcar Todo Presente
            </h3>
            <p class="text-sm text-gray-500 dark:text-gray-400">Completar automáticamente</p>
          </div>
        </div>

        <div class="mb-6">
          <p class="text-gray-700 dark:text-gray-300 mb-4">
            Se marcará como "Presente" a todos los estudiantes en las
            {{ quickStats.pending }} clases pendientes.
          </p>

          <div
            class="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-3"
          >
            <div class="flex items-center space-x-2 text-sm text-green-800 dark:text-green-400">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                />
              </svg>
              <span
                >{{ quickStats.pendingStudents }} estudiantes serán marcados como presentes</span
              >
            </div>
          </div>
        </div>

        <div class="flex items-center justify-end space-x-3">
          <button
            class="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
            @click="showConfirmDialog = false"
          >
            Cancelar
          </button>
          <button
            class="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors"
            @click="confirmQuickComplete"
          >
            Confirmar
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Animaciones personalizadas */
.animate-slide-up {
  animation: slideUp 0.3s ease-out;
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Efectos de hover mejorados */
button:not(:disabled):hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

button:not(:disabled):active {
  transform: translateY(0);
}

/* Transiciones suaves */
.transition-all {
  transition-property: all;
  transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
  transition-duration: 200ms;
}
</style>
