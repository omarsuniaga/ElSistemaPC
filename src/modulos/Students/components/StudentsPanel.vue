<template>
  <aside
    class="h-full lg:w-80 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 transition-all duration-300"
    :class="{
      'fixed inset-y-0 left-0 z-40 w-80': isMobile,
      'transform -translate-x-full': isMobile && !expanded,
      'transform translate-x-0': !isMobile || expanded,
    }"
  >
    <div
      class="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center"
    >
      <h2 class="text-lg font-medium">Estudiantes</h2>
      <button
        v-if="isMobile"
        class="lg:hidden p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700"
        @click="$emit('toggle-panel')"
      >
        <XMarkIcon class="h-5 w-5" />
      </button>
    </div>

    <div class="p-4">
      <input
        v-model="searchQuery"
        type="search"
        placeholder="Buscar estudiantes..."
        class="input w-full"
        @input="$emit('update:search', searchQuery)"
      />
    </div>

    <!-- Loading State -->
    <div v-if="isLoading" class="p-4 flex justify-center">
      <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="p-4 text-center text-red-500">
      {{ error }}
      <button class="underline hover:no-underline ml-2" @click="loadStudents">Reintentar</button>
    </div>

    <!-- Students List -->
    <ul
      v-else-if="filteredStudents.length > 0"
      class="p-4 space-y-2 overflow-y-auto"
      style="max-height: calc(100vh - 180px)"
    >
      <li
        v-for="student in filteredStudents"
        :key="student.id"
        class="cursor-pointer p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg flex items-center gap-3 transition-colors"
        @click="$emit('select-student', student)"
      >
        <div class="relative">
          <StudentAvatar
            :first-name="student.nombre || ''"
            :last-name="student.apellido || ''"
            size="md"
          />
          <div
            v-if="isSelected(student)"
            class="absolute -top-1 -right-1 w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center"
          >
            <CheckIcon class="h-3 w-3 text-white" />
          </div>
        </div>
        <div>
          <div class="font-medium">{{ student.nombre }} {{ student.apellido }}</div>
          <div class="text-sm text-gray-500 dark:text-gray-400">
            {{ student.instrumento || "Sin instrumento" }}
          </div>
        </div>
      </li>
    </ul>

    <div v-else class="p-4 text-center text-gray-500 dark:text-gray-400">
      No hay estudiantes disponibles
    </div>
  </aside>
</template>

<script setup lang="ts">
import {ref, computed, onMounted, watch} from "vue"
import {XMarkIcon, CheckIcon} from "@heroicons/vue/24/outline"
import {useStudentsStore} from "../store/students"
import StudentAvatar from "./StudentAvatar.vue"

const props = defineProps({
  expanded: {
    type: Boolean,
    default: false,
  },
  isMobile: {
    type: Boolean,
    default: false,
  },
  selectedStudents: {
    type: Array as () => Student[],
    default: () => [],
  },
})

defineEmits(["toggle-panel", "select-student", "update:search"])

const studentsStore = useStudentsStore()
const searchQuery = ref("")
const isLoading = ref(true)
const error = ref("")

interface Student {
  id: number | string
  nombre?: string | null
  apellido?: string | null
  instrumento?: string | null
  avatar?: string
}

const filteredStudents = computed(() => {
  const searchTerm = searchQuery.value.toLowerCase().trim()
  const students = studentsStore.students

  if (!searchTerm) return students

  return students.filter(
    (student: Student): boolean =>
      (student.nombre?.toLowerCase() ?? "").includes(searchTerm) ||
      (student.apellido?.toLowerCase() ?? "").includes(searchTerm) ||
      (student.instrumento?.toLowerCase() ?? "").includes(searchTerm)
  )
})

const isSelected = (student: Student) => {
  return props.selectedStudents.some((s: Student) => s.id === student.id)
}

const loadStudents = async () => {
  isLoading.value = true
  error.value = ""

  try {
    // La función fetchItems del store base ya maneja el caché
    await studentsStore.fetchItems()
  } catch (err) {
    error.value = "Error al cargar los estudiantes"
    console.error("Error loading students:", err)
  } finally {
    isLoading.value = false
  }
}

// Cargar estudiantes cuando el componente se monta
onMounted(loadStudents)

// Ver cambios en el store y recargar si es necesario
watch(
  () => studentsStore.items.length,
  (newLength) => {
    if (newLength === 0) {
      loadStudents()
    }
  }
)
</script>

<style scoped>
.input {
  @apply px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:text-white;
}
</style>
