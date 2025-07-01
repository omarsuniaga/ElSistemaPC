<template>
  <div
    v-if="open"
    class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
    @click="$emit('close')"
  >
    <div
      class="bg-white dark:bg-gray-800 rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
      @click.stop
    >
      <!-- Header -->
      <div class="p-6 border-b border-gray-200 dark:border-gray-700">
        <div class="flex items-start justify-between">
          <div>
            <h3 class="text-xl font-semibold text-gray-900 dark:text-white">Compartir Clase</h3>
            <p class="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Selecciona una clase y los maestros con los que deseas compartirla
            </p>
          </div>
          <button
            class="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300"
            @click="$emit('close')"
          >
            ✕
          </button>
        </div>
      </div>

      <!-- Content -->
      <div class="p-6 space-y-6">
        <!-- Class Selection -->
        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Seleccionar Clase
          </label>
          <select
            v-model="selectedClassId"
            class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          >
            <option value="">Selecciona una clase...</option>
            <option v-for="classItem in availableClasses" :key="classItem.id" :value="classItem.id">
              {{ classItem.name }} - {{ classItem.instrument }}
            </option>
          </select>
        </div>

        <!-- Teacher Selection -->
        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Maestros Disponibles
          </label>
          <div
            class="space-y-2 max-h-48 overflow-y-auto border border-gray-200 dark:border-gray-600 rounded-lg p-3"
          >
            <div
              v-for="teacher in teachers"
              :key="teacher.id"
              class="flex items-center space-x-3 p-2 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              <input
                :id="`teacher-${teacher.id}`"
                v-model="selectedTeachers"
                type="checkbox"
                :value="teacher.id"
                class="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
              />
              <label
                :for="`teacher-${teacher.id}`"
                class="flex-1 text-sm text-gray-900 dark:text-white cursor-pointer"
              >
                {{ teacher.name }}
              </label>

              <!-- Permission Selection -->
              <select
                v-if="selectedTeachers.includes(teacher.id)"
                v-model="teacherPermissions[teacher.id]"
                class="text-xs px-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="read">Solo lectura</option>
                <option value="write">Editor</option>
                <option value="manage">Administrador</option>
              </select>
            </div>

            <div
              v-if="teachers.length === 0"
              class="text-center py-4 text-gray-500 dark:text-gray-400"
            >
              No hay maestros disponibles
            </div>
          </div>
        </div>

        <!-- Summary -->
        <div
          v-if="selectedClassId && selectedTeachers.length > 0"
          class="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4"
        >
          <h4 class="text-sm font-medium text-blue-900 dark:text-blue-200 mb-2">
            Resumen de la configuración
          </h4>
          <p class="text-sm text-blue-800 dark:text-blue-300">
            Compartirás "{{ getSelectedClassName() }}" con {{ selectedTeachers.length }} maestro(s):
          </p>
          <ul class="mt-2 space-y-1">
            <li
              v-for="teacherId in selectedTeachers"
              :key="teacherId"
              class="text-sm text-blue-700 dark:text-blue-400 ml-4"
            >
              • {{ getTeacherName(teacherId) }} -
              {{ getPermissionText(teacherPermissions[teacherId]) }}
            </li>
          </ul>
        </div>
      </div>

      <!-- Footer -->
      <div class="p-6 border-t border-gray-200 dark:border-gray-700 flex justify-end space-x-3">
        <button
          class="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
          @click="$emit('close')"
        >
          Cancelar
        </button>
        <button
          :disabled="!canShare"
          class="px-4 py-2 border border-transparent rounded-lg text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 disabled:bg-gray-400 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 transition-colors"
          @click="handleShare"
        >
          Compartir Clase
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import {ref, computed, watch} from "vue"
import {useTeachersStore} from "../../Teachers/store/teachers"
import type {ClassData} from "../types/class"

interface Props {
  open: boolean
  availableClasses: ClassData[]
}

const props = defineProps<Props>()

const emit = defineEmits<{
  close: []
  share: [
    data: {
      classId: string
      teachers: Array<{
        teacherId: string
        permissions: string[]
      }>
    },
  ]
}>()

const teachersStore = useTeachersStore()

// Reactive data
const selectedClassId = ref("")
const selectedTeachers = ref<string[]>([])
const teacherPermissions = ref<Record<string, string>>({})

// Computed
const teachers = computed(() => teachersStore.teachers)

const canShare = computed(() => {
  return selectedClassId.value && selectedTeachers.value.length > 0
})

// Methods
const getSelectedClassName = () => {
  const classItem = props.availableClasses.find((c) => c.id === selectedClassId.value)
  return classItem?.name || ""
}

const getTeacherName = (teacherId: string) => {
  const teacher = teachers.value.find((t) => t.id === teacherId)
  return teacher?.name || "Maestro no encontrado"
}

const getPermissionText = (permission: string) => {
  const texts: Record<string, string> = {
    read: "Solo lectura",
    write: "Editor",
    manage: "Administrador",
  }
  return texts[permission] || permission
}

const handleShare = () => {
  if (!canShare.value) return

  const shareData = {
    classId: selectedClassId.value,
    teachers: selectedTeachers.value.map((teacherId) => ({
      teacherId,
      permissions: [teacherPermissions.value[teacherId] || "read"],
    })),
  }

  emit("share", shareData)

  // Reset form
  selectedClassId.value = ""
  selectedTeachers.value = []
  teacherPermissions.value = {}
}

// Watch for teacher selection changes to set default permissions
watch(
  selectedTeachers,
  (newTeachers, oldTeachers) => {
    // Add default permissions for newly selected teachers
    newTeachers.forEach((teacherId) => {
      if (!teacherPermissions.value[teacherId]) {
        teacherPermissions.value[teacherId] = "read"
      }
    })

    // Remove permissions for unselected teachers
    Object.keys(teacherPermissions.value).forEach((teacherId) => {
      if (!newTeachers.includes(teacherId)) {
        delete teacherPermissions.value[teacherId]
      }
    })
  },
  {deep: true}
)

// Reset form when dialog opens/closes
watch(
  () => props.open,
  (isOpen) => {
    if (!isOpen) {
      selectedClassId.value = ""
      selectedTeachers.value = []
      teacherPermissions.value = {}
    }
  }
)
</script>

<style scoped>
/* Scrollbar styles */
.overflow-y-auto::-webkit-scrollbar {
  width: 6px;
}

.overflow-y-auto::-webkit-scrollbar-track {
  background: transparent;
}

.overflow-y-auto::-webkit-scrollbar-thumb {
  background: #d1d5db;
  border-radius: 3px;
}

.dark .overflow-y-auto::-webkit-scrollbar-thumb {
  background: #4b5563;
}

.overflow-y-auto::-webkit-scrollbar-thumb:hover {
  background: #9ca3af;
}

.dark .overflow-y-auto::-webkit-scrollbar-thumb:hover {
  background: #6b7280;
}
</style>
