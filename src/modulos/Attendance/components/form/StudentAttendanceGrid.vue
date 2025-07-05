<!--
🎯 STUDENT ATTENDANCE GRID
Cuadrícula optimizada de avatares para registro ultra-rápido de asistencia
-->

<script setup lang="ts">
import {ref, computed, watch, onMounted, onUnmounted} from "vue"
import {CheckIcon, XMarkIcon, ExclamationTriangleIcon} from "@heroicons/vue/24/outline"
import {debounce} from "lodash-es"

// Types
interface Student {
  id: string
  nombre: string
  apellido: string
  photoURL?: string
  instrument?: string
  nivel?: string
}

interface AttendanceRecord {
  studentId: string
  status: "present" | "absent" | "late" | "justified"
  notes?: string
  timestamp?: Date
}

// Props
const props = defineProps<{
  students: Student[]
  attendanceRecords: AttendanceRecord[]
  loading?: boolean
  searchQuery?: string
  filter?: "all" | "present" | "absent" | "late" | "justified"
  enableBatchSelect?: boolean
}>()

// Emits
const emit = defineEmits<{
  "update:attendance": [studentId: string, status: AttendanceRecord["status"]]
  "batch-update": [studentIds: string[], status: AttendanceRecord["status"]]
  "student-notes": [studentId: string, notes: string]
  "quick-present-all": []
}>()

// Estado local
const selectedStudents = ref<Set<string>>(new Set())
const isSelectionMode = ref(false)

// Computed properties
const filteredStudents = computed(() => {
  let filtered = props.students || []

  // Filtro por búsqueda
  if (props.searchQuery?.trim()) {
    const query = props.searchQuery.toLowerCase()
    filtered = filtered.filter(
      (student) =>
        student.nombre?.toLowerCase().includes(query) ||
        student.apellido?.toLowerCase().includes(query) ||
        student.instrument?.toLowerCase().includes(query)
    )
  }

  // Filtro por estado
  if (props.filter && props.filter !== "all") {
    filtered = filtered.filter((student) => {
      const record = getStudentAttendance(student.id)
      return record?.status === props.filter
    })
  }

  return filtered
})

const attendanceStats = computed(() => {
  const total = props.students?.length || 0
  const attendanceRecords = props.attendanceRecords || []
  const present = attendanceRecords.filter((r) => r.status === "present").length
  const absent = attendanceRecords.filter((r) => r.status === "absent").length
  const late = attendanceRecords.filter((r) => r.status === "late").length
  const justified = attendanceRecords.filter((r) => r.status === "justified").length

  return {
    total,
    present,
    absent,
    late,
    justified,
    pending: total - present - absent - late - justified,
    completionRate:
      total > 0 ? Math.round(((present + absent + late + justified) / total) * 100) : 0,
  }
})

const hasSelectedStudents = computed(() => selectedStudents.value.size > 0)

const batchActionsVisible = computed(
  () => props.enableBatchSelect && isSelectionMode.value && hasSelectedStudents.value
)

// Métodos principales
const getStudentAttendance = (studentId: string): AttendanceRecord | undefined => {
  return (props.attendanceRecords || []).find((record) => record.studentId === studentId)
}

const getStudentInitials = (student: Student): string => {
  return `${student.nombre.charAt(0)}${student.apellido.charAt(0)}`.toUpperCase()
}

const getStatusColor = (status: AttendanceRecord["status"]): string => {
  const colors = {
    present: "bg-green-500 text-white",
    absent: "bg-red-500 text-white",
    late: "bg-yellow-500 text-white",
    justified: "bg-blue-500 text-white",
  }
  return colors[status] || "bg-gray-300 text-gray-700"
}

const getStatusIcon = (status: AttendanceRecord["status"]) => {
  const icons = {
    present: CheckIcon,
    absent: XMarkIcon,
    late: ExclamationTriangleIcon,
    justified: CheckIcon,
  }
  return icons[status]
}

// Manejo de asistencia
const updateAttendance = debounce((studentId: string, status: AttendanceRecord["status"]) => {
  emit("update:attendance", studentId, status)
}, 300)

const quickToggleAttendance = (studentId: string) => {
  const current = getStudentAttendance(studentId)
  const newStatus = current?.status === "present" ? "absent" : "present"
  updateAttendance(studentId, newStatus)
}

// Selección múltiple
const toggleStudentSelection = (studentId: string) => {
  if (!props.enableBatchSelect) return

  if (selectedStudents.value.has(studentId)) {
    selectedStudents.value.delete(studentId)
  } else {
    selectedStudents.value.add(studentId)
  }
  selectedStudents.value = new Set(selectedStudents.value) // Trigger reactivity
}

const selectAllVisible = () => {
  if (!props.enableBatchSelect) return
  filteredStudents.value.forEach((student) => {
    selectedStudents.value.add(student.id)
  })
  selectedStudents.value = new Set(selectedStudents.value)
}

const clearSelection = () => {
  selectedStudents.value.clear()
  selectedStudents.value = new Set()
  isSelectionMode.value = false
}

const batchMarkAs = (status: AttendanceRecord["status"]) => {
  if (selectedStudents.value.size === 0) return
  emit("batch-update", Array.from(selectedStudents.value), status)
  clearSelection()
}

// Acciones rápidas
const markAllPresent = () => {
  emit("quick-present-all")
}

// Modo de selección
const _toggleSelectionMode = () => {
  isSelectionMode.value = !isSelectionMode.value
  if (!isSelectionMode.value) {
    clearSelection()
  }
}

// Keyboard shortcuts
const handleKeydown = (event: KeyboardEvent) => {
  if (event.ctrlKey || event.metaKey) {
    switch (event.key) {
      case "a":
        event.preventDefault()
        if (props.enableBatchSelect) {
          selectAllVisible()
        }
        break
      case "p":
        event.preventDefault()
        markAllPresent()
        break
      case "Escape":
        clearSelection()
        break
    }
  }
}

// Lifecycle
onMounted(() => {
  document.addEventListener("keydown", handleKeydown)
})

onUnmounted(() => {
  document.removeEventListener("keydown", handleKeydown)
})

// Watchers
watch(
  () => props.filter,
  () => {
    // Limpiar selección cuando cambie el filtro
    clearSelection()
  }
)

watch(
  () => props.searchQuery,
  () => {
    // Limpiar selección cuando cambie la búsqueda
    clearSelection()
  }
)
</script>

<template>
  <div class="student-attendance-grid">
    <!-- Estadísticas rápidas -->
    <div class="mb-6 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
      <div class="flex items-center justify-between mb-3">
        <h3 class="text-sm font-medium text-gray-700 dark:text-gray-300">Progreso de Asistencia</h3>
        <span class="text-sm text-gray-500 dark:text-gray-400">
          {{ attendanceStats.completionRate }}% completado
        </span>
      </div>

      <!-- Barra de progreso -->
      <div class="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mb-3">
        <div
          class="bg-blue-600 h-2 rounded-full transition-all duration-500"
          :style="{width: `${attendanceStats.completionRate}%`}"
        />
      </div>

      <!-- Contador de estados -->
      <div class="grid grid-cols-2 md:grid-cols-5 gap-3 text-xs">
        <div class="text-center">
          <div class="text-green-600 dark:text-green-400 font-semibold">
            {{ attendanceStats.present }}
          </div>
          <div class="text-gray-500">Presentes</div>
        </div>
        <div class="text-center">
          <div class="text-red-600 dark:text-red-400 font-semibold">
            {{ attendanceStats.absent }}
          </div>
          <div class="text-gray-500">Ausentes</div>
        </div>
        <div class="text-center">
          <div class="text-yellow-600 dark:text-yellow-400 font-semibold">
            {{ attendanceStats.late }}
          </div>
          <div class="text-gray-500">Tarde</div>
        </div>
        <div class="text-center">
          <div class="text-blue-600 dark:text-blue-400 font-semibold">
            {{ attendanceStats.justified }}
          </div>
          <div class="text-gray-500">Justificado</div>
        </div>
        <div class="text-center">
          <div class="text-gray-600 dark:text-gray-400 font-semibold">
            {{ attendanceStats.pending }}
          </div>
          <div class="text-gray-500">Pendientes</div>
        </div>
      </div>
    </div>

    <!-- Acciones batch (si hay selección) -->
    <transition
      name="slide-down"
      enter-active-class="transition duration-300 ease-out"
      enter-from-class="transform -translate-y-full opacity-0"
      enter-to-class="transform translate-y-0 opacity-100"
      leave-active-class="transition duration-200 ease-in"
      leave-from-class="transform translate-y-0 opacity-100"
      leave-to-class="transform -translate-y-full opacity-0"
    >
      <div
        v-if="batchActionsVisible"
        class="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-700"
      >
        <div class="flex items-center justify-between">
          <span class="text-sm font-medium text-blue-700 dark:text-blue-300">
            {{ selectedStudents.size }} estudiante(s) seleccionado(s)
          </span>
          <div class="flex space-x-2">
            <button
              class="px-3 py-1 bg-green-500 text-white text-xs rounded-md hover:bg-green-600 transition-colors"
              @click="batchMarkAs('present')"
            >
              Marcar Presente
            </button>
            <button
              class="px-3 py-1 bg-red-500 text-white text-xs rounded-md hover:bg-red-600 transition-colors"
              @click="batchMarkAs('absent')"
            >
              Marcar Ausente
            </button>
            <button
              class="px-3 py-1 bg-gray-500 text-white text-xs rounded-md hover:bg-gray-600 transition-colors"
              @click="clearSelection"
            >
              Cancelar
            </button>
          </div>
        </div>
      </div>
    </transition>

    <!-- Grid de estudiantes -->
    <div
      class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-8 gap-4"
    >
      <div
        v-for="student in filteredStudents"
        :key="student.id"
        class="student-card relative"
        :class="{
          'ring-2 ring-blue-500 ring-offset-2': selectedStudents.has(student.id),
          'cursor-pointer': !loading,
        }"
        @click="
          isSelectionMode ? toggleStudentSelection(student.id) : quickToggleAttendance(student.id)
        "
        @contextmenu.prevent="toggleStudentSelection(student.id)"
      >
        <!-- Avatar con estado -->
        <div class="relative">
          <!-- Imagen o iniciales -->
          <div
            class="w-16 h-16 mx-auto mb-2 rounded-full flex items-center justify-center text-white font-bold transition-all duration-200 hover:scale-105"
            :class="[
              getStudentAttendance(student.id)?.status
                ? getStatusColor(getStudentAttendance(student.id)!.status)
                : 'bg-gray-300 text-gray-700',
              loading ? 'opacity-50' : '',
            ]"
          >
            <img
              v-if="student.photoURL"
              :src="student.photoURL"
              :alt="`${student.nombre} ${student.apellido}`"
              class="w-full h-full rounded-full object-cover"
              loading="lazy"
            />
            <span v-else class="text-lg">
              {{ getStudentInitials(student) }}
            </span>

            <!-- Icono de estado -->
            <div
              v-if="getStudentAttendance(student.id)"
              class="absolute -top-1 -right-1 w-6 h-6 bg-white rounded-full flex items-center justify-center shadow-md"
            >
              <component
                :is="getStatusIcon(getStudentAttendance(student.id)!.status)"
                class="w-4 h-4"
                :class="[
                  getStudentAttendance(student.id)!.status === 'present' && 'text-green-500',
                  getStudentAttendance(student.id)!.status === 'absent' && 'text-red-500',
                  getStudentAttendance(student.id)!.status === 'late' && 'text-yellow-500',
                  getStudentAttendance(student.id)!.status === 'justified' && 'text-blue-500',
                ]"
              />
            </div>

            <!-- Indicador de selección -->
            <div
              v-if="selectedStudents.has(student.id)"
              class="absolute -top-1 -left-1 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center shadow-md"
            >
              <CheckIcon class="w-4 h-4 text-white" />
            </div>
          </div>

          <!-- Información del estudiante -->
          <div class="text-center">
            <p class="text-sm font-medium text-gray-900 dark:text-white truncate">
              {{ student.nombre }}
            </p>
            <p class="text-xs text-gray-500 dark:text-gray-400 truncate">
              {{ student.apellido }}
            </p>
            <p v-if="student.instrument" class="text-xs text-blue-600 dark:text-blue-400 truncate">
              {{ student.instrument }}
            </p>
          </div>

          <!-- Indicador de carga -->
          <div
            v-if="loading"
            class="absolute inset-0 bg-white/50 dark:bg-gray-900/50 rounded-lg flex items-center justify-center"
          >
            <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
          </div>
        </div>
      </div>
    </div>

    <!-- Estado vacío -->
    <div
      v-if="filteredStudents.length === 0 && !loading"
      class="text-center py-12 text-gray-500 dark:text-gray-400"
    >
      <svg
        class="mx-auto h-12 w-12 text-gray-400 mb-4"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
        />
      </svg>
      <p class="text-lg font-medium">No se encontraron estudiantes</p>
      <p class="text-sm">Intenta ajustar los filtros o la búsqueda</p>
    </div>

    <!-- Indicadores de atajos de teclado -->
    <div class="mt-6 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
      <p class="text-xs text-gray-500 dark:text-gray-400 text-center">
        💡 <strong>Atajos:</strong> Ctrl+A (seleccionar todos) • Ctrl+P (marcar todos presentes) •
        Click derecho (seleccionar) • Escape (cancelar)
      </p>
    </div>
  </div>
</template>

<style scoped>
.student-card {
  padding: 0.75rem;
  background-color: white;
  border-radius: 0.5rem;
  box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
  border: 1px solid #e5e7eb;
  transition: all 0.2s;
}

.student-card:hover {
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  border-color: #d1d5db;
}

.dark .student-card {
  background-color: #1f2937;
  border-color: #374151;
}

.dark .student-card:hover {
  border-color: #4b5563;
}

.slide-down-enter-active,
.slide-down-leave-active {
  transition: all 0.3s ease;
}

.slide-down-enter-from,
.slide-down-leave-to {
  transform: translateY(-100%);
  opacity: 0;
}
</style>
