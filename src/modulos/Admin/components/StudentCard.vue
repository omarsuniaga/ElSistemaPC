<template>
  <div
    class="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow duration-200"
  >
    <!-- Card Header with Avatar and Status -->
    <div class="p-4 pb-2">
      <div class="flex items-start justify-between">
        <div class="flex items-center space-x-3">
          <!-- Avatar -->
          <div class="relative">
            <img
              v-if="student.avatar"
              :src="student.avatar"
              :alt="student.name"
              class="w-12 h-12 rounded-full object-cover"
            />
            <div
              v-else
              class="w-12 h-12 rounded-full bg-gradient-to-r from-blue-400 to-blue-600 flex items-center justify-center text-white font-semibold text-lg"
            >
              {{ getInitials(student.name) }}
            </div>

            <!-- Status indicator -->
            <div
              :class="[
                'absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white dark:border-gray-800',
                statusColors[student.status],
              ]"
            />
          </div>

          <!-- Basic info -->
          <div class="flex-1 min-w-0">
            <h3 class="text-sm font-semibold text-gray-900 dark:text-white truncate">
              {{ student.name }}
            </h3>
            <p class="text-xs text-gray-500 dark:text-gray-400 truncate">
              {{ student.email }}
            </p>
          </div>
        </div>

        <!-- Actions Menu -->
        <div v-if="hasAnyPermission" class="relative">
          <button
            class="p-1 rounded-full text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
            @click="showMenu = !showMenu"
          >
            <EllipsisVerticalIcon class="w-5 h-5" />
          </button>

          <!-- Dropdown Menu -->
          <div
            v-if="showMenu"
            v-click-outside="() => (showMenu = false)"
            class="absolute right-0 top-8 w-48 bg-white dark:bg-gray-700 rounded-md shadow-lg border border-gray-200 dark:border-gray-600 py-1 z-10"
          >
            <button
              v-if="permissions.canView"
              class="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600 flex items-center space-x-2"
              @click="handleView"
            >
              <EyeIcon class="w-4 h-4" />
              <span>Ver detalles</span>
            </button>

            <button
              v-if="permissions.canEdit"
              class="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600 flex items-center space-x-2"
              @click="handleEdit"
            >
              <PencilIcon class="w-4 h-4" />
              <span>Editar</span>
            </button>

            <button
              v-if="permissions.canEdit"
              class="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600 flex items-center space-x-2"
              @click="handleToggleStatus"
            >
              <component :is="student.status === 'active' ? PauseIcon : PlayIcon" class="w-4 h-4" />
              <span>{{ student.status === "active" ? "Desactivar" : "Activar" }}</span>
            </button>

            <hr v-if="permissions.canDelete" class="my-1 border-gray-200 dark:border-gray-600" />

            <button
              v-if="permissions.canDelete"
              class="w-full px-4 py-2 text-left text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center space-x-2"
              @click="handleDelete"
            >
              <TrashIcon class="w-4 h-4" />
              <span>Eliminar</span>
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Card Body -->
    <div class="px-4 pb-4">
      <!-- Student Details -->
      <div class="space-y-2">
        <!-- Contact Info -->
        <div class="flex items-center space-x-2 text-xs text-gray-600 dark:text-gray-400">
          <PhoneIcon class="w-4 h-4" />
          <span>{{ formatPhone(student.phone) }}</span>
        </div>

        <!-- Parent Info -->
        <div class="flex items-center space-x-2 text-xs text-gray-600 dark:text-gray-400">
          <UserIcon class="w-4 h-4" />
          <span>{{ student.parentName }}</span>
        </div>

        <!-- Instruments -->
        <div class="flex items-center space-x-2">
          <MusicalNoteIcon class="w-4 h-4 text-gray-500 dark:text-gray-400" />
          <div class="flex flex-wrap gap-1">
            <span
              v-for="instrument in student.instruments.slice(0, 2)"
              :key="instrument"
              class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
            >
              {{ getInstrumentName(instrument) }}
            </span>
            <span
              v-if="student.instruments.length > 2"
              class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300"
            >
              +{{ student.instruments.length - 2 }}
            </span>
          </div>
        </div>

        <!-- Grade Level -->
        <div class="flex items-center space-x-2">
          <AcademicCapIcon class="w-4 h-4 text-gray-500 dark:text-gray-400" />
          <span
            :class="gradeColors[student.grade]"
            class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium"
          >
            {{ getGradeName(student.grade) }}
          </span>
        </div>

        <!-- Enrollment Date -->
        <div class="flex items-center space-x-2 text-xs text-gray-500 dark:text-gray-400">
          <CalendarDaysIcon class="w-4 h-4" />
          <span>Inscrito: {{ formatDate(student.enrollmentDate) }}</span>
        </div>

        <!-- Classes Count -->
        <div class="flex items-center space-x-2 text-xs text-gray-500 dark:text-gray-400">
          <BookOpenIcon class="w-4 h-4" />
          <span
            >{{ student.classes?.length || 0 }} clase{{
              (student.classes?.length || 0) !== 1 ? "s" : ""
            }}</span
          >
        </div>
      </div>
    </div>

    <!-- Card Footer -->
    <div
      class="px-4 py-3 bg-gray-50 dark:bg-gray-750 rounded-b-lg border-t border-gray-200 dark:border-gray-600"
    >
      <div class="flex items-center justify-between">
        <!-- Status Badge -->
        <span
          :class="statusBadgeColors[student.status]"
          class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
        >
          <div :class="statusColors[student.status]" class="w-1.5 h-1.5 rounded-full mr-2" />
          {{ getStatusName(student.status) }}
        </span>

        <!-- Quick Actions -->
        <div class="flex items-center space-x-2">
          <button
            v-if="permissions.canView"
            class="p-1.5 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
            title="Ver detalles"
            @click="handleView"
          >
            <EyeIcon class="w-4 h-4" />
          </button>

          <button
            v-if="permissions.canEdit"
            class="p-1.5 text-gray-400 hover:text-green-600 dark:hover:text-green-400 transition-colors"
            title="Editar estudiante"
            @click="handleEdit"
          >
            <PencilIcon class="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
// Define component name
defineOptions({
  name: "StudentCard",
})

import {ref, computed} from "vue"
import {
  EllipsisVerticalIcon,
  EyeIcon,
  PencilIcon,
  TrashIcon,
  PhoneIcon,
  UserIcon,
  MusicalNoteIcon,
  AcademicCapIcon,
  CalendarDaysIcon,
  BookOpenIcon,
  PlayIcon,
  PauseIcon,
} from "@heroicons/vue/24/outline"
import type {Student} from "../store/adminStudents"

// Props
interface Props {
  student: Student
  permissions: {
    canView: boolean
    canEdit: boolean
    canDelete: boolean
  }
}

const props = defineProps<Props>()

// Emits
interface Emits {
  view: [student: Student]
  edit: [student: Student]
  delete: [student: Student]
  "toggle-status": [student: Student]
}

const emit = defineEmits<Emits>()

// State
const showMenu = ref(false)

// Computed
const hasAnyPermission = computed(
  () => props.permissions.canView || props.permissions.canEdit || props.permissions.canDelete
)

// Colors and styling
const statusColors = {
  active: "bg-green-500",
  inactive: "bg-red-500",
  pending: "bg-yellow-500",
}

const statusBadgeColors = {
  active: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  inactive: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
  pending: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
}

const gradeColors = {
  beginner: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  intermediate: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200",
  advanced: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
}

// Methods
const getInitials = (name: string): string => {
  return name
    .split(" ")
    .map((word) => word.charAt(0))
    .join("")
    .substring(0, 2)
    .toUpperCase()
}

const formatPhone = (phone: string): string => {
  // Basic phone formatting - can be customized based on locale
  return phone.replace(/(\d{3})(\d{3})(\d{4})/, "($1) $2-$3")
}

const formatDate = (date: Date): string => {
  return date.toLocaleDateString("es-ES", {
    year: "numeric",
    month: "short",
    day: "numeric",
  })
}

const getInstrumentName = (instrument: string): string => {
  const instruments: Record<string, string> = {
    piano: "Piano",
    guitar: "Guitarra",
    violin: "Violín",
    drums: "Batería",
    voice: "Canto",
    bass: "Bajo",
    flute: "Flauta",
    saxophone: "Saxofón",
    trumpet: "Trompeta",
    cello: "Violonchelo",
  }
  return instruments[instrument] || instrument
}

const getGradeName = (grade: string): string => {
  const grades: Record<string, string> = {
    beginner: "Principiante",
    intermediate: "Intermedio",
    advanced: "Avanzado",
  }
  return grades[grade] || grade
}

const getStatusName = (status: string): string => {
  const statuses: Record<string, string> = {
    active: "Activo",
    inactive: "Inactivo",
    pending: "Pendiente",
  }
  return statuses[status] || status
}

// Event handlers
const handleView = () => {
  showMenu.value = false
  emit("view", props.student)
}

const handleEdit = () => {
  showMenu.value = false
  emit("edit", props.student)
}

const handleDelete = () => {
  showMenu.value = false
  emit("delete", props.student)
}

const handleToggleStatus = () => {
  showMenu.value = false
  emit("toggle-status", props.student)
}

// Click outside directive
const vClickOutside = {
  mounted(el: HTMLElement, binding: any) {
    el.clickOutsideEvent = (event: Event) => {
      if (!(el === event.target || el.contains(event.target as Node))) {
        binding.value()
      }
    }
    document.addEventListener("click", el.clickOutsideEvent)
  },
  unmounted(el: HTMLElement) {
    document.removeEventListener("click", el.clickOutsideEvent)
  },
}
</script>

<style scoped>
/* Card hover effects */
.card-hover {
  transition: all 0.2s ease;
}

.card-hover:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

/* Dark mode specific adjustments */
@media (prefers-color-scheme: dark) {
  .card-hover:hover {
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  }
}
</style>
