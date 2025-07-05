<!--
🎯 ATTENDANCE TOOLBAR
Barra de herramientas optimizada para gestión rápida de asistencias
-->

<script setup lang="ts">
import {ref, computed} from "vue"
import {
  MagnifyingGlassIcon,
  FunnelIcon,
  ArrowDownTrayIcon,
  PrinterIcon,
  ClockIcon,
  CheckIcon,
  XMarkIcon,
  ExclamationTriangleIcon,
  UserGroupIcon,
  AdjustmentsHorizontalIcon,
} from "@heroicons/vue/24/outline"

// Props
const props = defineProps<{
  searchQuery?: string
  filter?: "all" | "present" | "absent" | "late" | "justified"
  sortBy?: "name" | "instrument" | "status"
  sortOrder?: "asc" | "desc"
  totalStudents?: number
  presentCount?: number
  absentCount?: number
  lateCount?: number
  justifiedCount?: number
  enableBatchMode?: boolean
  isLoading?: boolean
  canExport?: boolean
  canPrint?: boolean
}>()

// Emits
const emit = defineEmits<{
  "update:search": [query: string]
  "update:filter": [filter: "all" | "present" | "absent" | "late" | "justified"]
  "update:sort": [sortBy: string, sortOrder: "asc" | "desc"]
  "toggle-batch-mode": []
  "mark-all-present": []
  "mark-all-absent": []
  "export-data": []
  "print-list": []
  refresh: []
}>()

// Estado local
const searchInput = ref(props.searchQuery || "")
const showFilters = ref(false)
const showQuickActions = ref(false)

// Computed properties
const pendingCount = computed(() => {
  if (props.totalStudents === undefined) return 0
  return (
    props.totalStudents -
    (props.presentCount || 0) -
    (props.absentCount || 0) -
    (props.lateCount || 0) -
    (props.justifiedCount || 0)
  )
})

const completionPercentage = computed(() => {
  if (!props.totalStudents || props.totalStudents === 0) return 0
  const completed =
    (props.presentCount || 0) +
    (props.absentCount || 0) +
    (props.lateCount || 0) +
    (props.justifiedCount || 0)
  return Math.round((completed / props.totalStudents) * 100)
})

const filterOptions = computed(() => [
  {
    key: "all",
    label: "Todos",
    count: props.totalStudents || 0,
    icon: UserGroupIcon,
    color: "text-gray-600",
  },
  {
    key: "present",
    label: "Presentes",
    count: props.presentCount || 0,
    icon: CheckIcon,
    color: "text-green-600",
  },
  {
    key: "absent",
    label: "Ausentes",
    count: props.absentCount || 0,
    icon: XMarkIcon,
    color: "text-red-600",
  },
  {
    key: "late",
    label: "Tarde",
    count: props.lateCount || 0,
    icon: ClockIcon,
    color: "text-yellow-600",
  },
  {
    key: "justified",
    label: "Justificados",
    count: props.justifiedCount || 0,
    icon: ExclamationTriangleIcon,
    color: "text-blue-600",
  },
])

const sortOptions = [
  {key: "name", label: "Nombre"},
  {key: "instrument", label: "Instrumento"},
  {key: "status", label: "Estado"},
]

// Métodos
const updateSearch = () => {
  emit("update:search", searchInput.value)
}

const clearSearch = () => {
  searchInput.value = ""
  emit("update:search", "")
}

const updateFilter = (filter: "all" | "present" | "absent" | "late" | "justified") => {
  emit("update:filter", filter)
  showFilters.value = false
}

const updateSort = (sortBy: string) => {
  const newOrder = props.sortBy === sortBy && props.sortOrder === "asc" ? "desc" : "asc"
  emit("update:sort", sortBy, newOrder)
}

const toggleFilters = () => {
  showFilters.value = !showFilters.value
  showQuickActions.value = false
}

const toggleQuickActions = () => {
  showQuickActions.value = !showQuickActions.value
  showFilters.value = false
}

const handleQuickAction = (action: string) => {
  switch (action) {
    case "mark-all-present":
      emit("mark-all-present")
      break
    case "mark-all-absent":
      emit("mark-all-absent")
      break
    case "export":
      emit("export-data")
      break
    case "print":
      emit("print-list")
      break
    case "batch-mode":
      emit("toggle-batch-mode")
      break
    case "refresh":
      emit("refresh")
      break
  }
  showQuickActions.value = false
}
</script>

<template>
  <div
    class="attendance-toolbar bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700"
  >
    <!-- Barra principal -->
    <div class="px-4 py-3">
      <div class="flex items-center justify-between">
        <!-- Lado izquierdo: Búsqueda y estadísticas -->
        <div class="flex items-center space-x-4 flex-1">
          <!-- Búsqueda -->
          <div class="relative flex-1 max-w-md">
            <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <MagnifyingGlassIcon class="h-5 w-5 text-gray-400" />
            </div>
            <input
              v-model="searchInput"
              type="text"
              placeholder="Buscar estudiantes..."
              class="block w-full pl-10 pr-10 py-2 border border-gray-300 dark:border-gray-600 rounded-md leading-5 bg-white dark:bg-gray-700 placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-sm"
              @input="updateSearch"
              @keyup.enter="updateSearch"
            />
            <div
              v-if="searchInput"
              class="absolute inset-y-0 right-0 pr-3 flex items-center cursor-pointer"
              @click="clearSearch"
            >
              <XMarkIcon class="h-5 w-5 text-gray-400 hover:text-gray-600" />
            </div>
          </div>

          <!-- Estadísticas rápidas -->
          <div class="hidden sm:flex items-center space-x-3 text-xs">
            <div class="flex items-center space-x-1">
              <div class="w-2 h-2 bg-green-500 rounded-full" />
              <span class="text-gray-600 dark:text-gray-300">{{ presentCount || 0 }}</span>
            </div>
            <div class="flex items-center space-x-1">
              <div class="w-2 h-2 bg-red-500 rounded-full" />
              <span class="text-gray-600 dark:text-gray-300">{{ absentCount || 0 }}</span>
            </div>
            <div class="flex items-center space-x-1">
              <div class="w-2 h-2 bg-yellow-500 rounded-full" />
              <span class="text-gray-600 dark:text-gray-300">{{ lateCount || 0 }}</span>
            </div>
            <div class="flex items-center space-x-1">
              <div class="w-2 h-2 bg-gray-400 rounded-full" />
              <span class="text-gray-600 dark:text-gray-300">{{ pendingCount }}</span>
            </div>
          </div>

          <!-- Progreso -->
          <div class="hidden md:flex items-center space-x-2">
            <div class="w-20 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <div
                class="bg-blue-600 h-2 rounded-full transition-all duration-300"
                :style="{width: `${completionPercentage}%`}"
              />
            </div>
            <span class="text-xs text-gray-500 dark:text-gray-400"
              >{{ completionPercentage }}%</span
            >
          </div>
        </div>

        <!-- Lado derecho: Acciones -->
        <div class="flex items-center space-x-2">
          <!-- Filtros -->
          <div class="relative">
            <button
              type="button"
              class="inline-flex items-center px-3 py-2 border border-gray-300 dark:border-gray-600 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              :class="{'ring-2 ring-blue-500': filter !== 'all'}"
              @click="toggleFilters"
            >
              <FunnelIcon class="h-4 w-4 mr-1" />
              Filtros
              <span
                v-if="filter !== 'all'"
                class="ml-1 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800"
              >
                1
              </span>
            </button>

            <!-- Dropdown de filtros -->
            <transition
              enter-active-class="transition ease-out duration-100"
              enter-from-class="transform opacity-0 scale-95"
              enter-to-class="transform opacity-100 scale-100"
              leave-active-class="transition ease-in duration-75"
              leave-from-class="transform opacity-100 scale-100"
              leave-to-class="transform opacity-0 scale-95"
            >
              <div
                v-if="showFilters"
                class="absolute right-0 z-10 mt-2 w-64 rounded-md shadow-lg bg-white dark:bg-gray-800 ring-1 ring-black ring-opacity-5"
              >
                <div class="py-1">
                  <div
                    class="px-4 py-2 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
                  >
                    Estado de Asistencia
                  </div>
                  <button
                    v-for="option in filterOptions"
                    :key="option.key"
                    type="button"
                    class="group flex items-center w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                    :class="{'bg-gray-100 dark:bg-gray-700': filter === option.key}"
                    @click="updateFilter(option.key as any)"
                  >
                    <component :is="option.icon" class="mr-3 h-4 w-4" :class="option.color" />
                    <span class="flex-1">{{ option.label }}</span>
                    <span
                      class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium"
                      :class="
                        filter === option.key
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
                      "
                    >
                      {{ option.count }}
                    </span>
                  </button>
                </div>
              </div>
            </transition>
          </div>

          <!-- Ordenamiento -->
          <div class="hidden sm:block">
            <select
              :value="sortBy"
              class="text-sm border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
              @change="updateSort(($event.target as HTMLSelectElement).value)"
            >
              <option v-for="option in sortOptions" :key="option.key" :value="option.key">
                {{ option.label }}
              </option>
            </select>
          </div>

          <!-- Acciones rápidas -->
          <div class="relative">
            <button
              type="button"
              class="inline-flex items-center px-3 py-2 border border-gray-300 dark:border-gray-600 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              @click="toggleQuickActions"
            >
              <AdjustmentsHorizontalIcon class="h-4 w-4 mr-1" />
              Acciones
            </button>

            <!-- Dropdown de acciones -->
            <transition
              enter-active-class="transition ease-out duration-100"
              enter-from-class="transform opacity-0 scale-95"
              enter-to-class="transform opacity-100 scale-100"
              leave-active-class="transition ease-in duration-75"
              leave-from-class="transform opacity-100 scale-100"
              leave-to-class="transform opacity-0 scale-95"
            >
              <div
                v-if="showQuickActions"
                class="absolute right-0 z-10 mt-2 w-56 rounded-md shadow-lg bg-white dark:bg-gray-800 ring-1 ring-black ring-opacity-5"
              >
                <div class="py-1">
                  <div
                    class="px-4 py-2 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
                  >
                    Acciones Rápidas
                  </div>
                  <button
                    type="button"
                    class="group flex items-center w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                    @click="handleQuickAction('mark-all-present')"
                  >
                    <CheckIcon class="mr-3 h-4 w-4 text-green-500" />
                    Marcar todos presentes
                  </button>
                  <button
                    type="button"
                    class="group flex items-center w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                    @click="handleQuickAction('mark-all-absent')"
                  >
                    <XMarkIcon class="mr-3 h-4 w-4 text-red-500" />
                    Marcar todos ausentes
                  </button>
                  <div
                    v-if="enableBatchMode"
                    class="border-t border-gray-100 dark:border-gray-700 my-1"
                  />
                  <button
                    v-if="enableBatchMode"
                    type="button"
                    class="group flex items-center w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                    @click="handleQuickAction('batch-mode')"
                  >
                    <UserGroupIcon class="mr-3 h-4 w-4 text-blue-500" />
                    Modo selección múltiple
                  </button>
                  <div class="border-t border-gray-100 dark:border-gray-700 my-1" />
                  <button
                    v-if="canExport"
                    type="button"
                    class="group flex items-center w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                    @click="handleQuickAction('export')"
                  >
                    <ArrowDownTrayIcon class="mr-3 h-4 w-4 text-gray-500" />
                    Exportar datos
                  </button>
                  <button
                    v-if="canPrint"
                    type="button"
                    class="group flex items-center w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                    @click="handleQuickAction('print')"
                  >
                    <PrinterIcon class="mr-3 h-4 w-4 text-gray-500" />
                    Imprimir lista
                  </button>
                </div>
              </div>
            </transition>
          </div>
        </div>
      </div>

      <!-- Barra de progreso móvil -->
      <div class="sm:hidden mt-3">
        <div
          class="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 mb-1"
        >
          <span>Progreso de asistencia</span>
          <span>{{ completionPercentage }}%</span>
        </div>
        <div class="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
          <div
            class="bg-blue-600 h-2 rounded-full transition-all duration-300"
            :style="{width: `${completionPercentage}%`}"
          />
        </div>
      </div>
    </div>

    <!-- Estado de carga -->
    <div
      v-if="isLoading"
      class="absolute inset-0 bg-white/50 dark:bg-gray-800/50 flex items-center justify-center"
    >
      <div class="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600" />
    </div>
  </div>
</template>

<style scoped>
.attendance-toolbar {
  position: relative;
}
</style>
