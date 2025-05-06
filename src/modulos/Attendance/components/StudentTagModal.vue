<template>
  <div v-if="show" class="fixed inset-0 flex items-center justify-center z-[60]">
    <div class="absolute inset-0 bg-black/50" @click="close"></div>
    <div class="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md z-10 max-h-[80vh] overflow-y-auto">
      <div class="p-4">
        <div class="flex justify-between items-center mb-4">
          <h2 class="text-lg font-bold">Etiquetar Estudiante</h2>
          <button @click="close" class="text-gray-500 hover:text-gray-700">
            <XMarkIcon class="h-6 w-6" />
          </button>
        </div>
        
        <!-- Búsqueda -->
        <div class="mb-4">
          <input
            v-model="searchTerm"
            type="text"
            placeholder="Buscar estudiante..."
            class="w-full p-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
            @input="filterStudents"
          />
        </div>
        
        <!-- Lista de estudiantes -->
        <div v-if="loading" class="py-8 text-center">
          <div class="animate-spin rounded-full h-8 w-8 border-4 border-blue-500 border-t-transparent mx-auto"></div>
          <p class="mt-2 text-gray-500">Cargando estudiantes...</p>
        </div>
        
        <div v-else-if="filteredStudents.length === 0" class="py-8 text-center">
          <p class="text-gray-500">No se encontraron estudiantes</p>
        </div>
        
        <div v-else class="divide-y divide-gray-200 dark:divide-gray-700">
          <button
            v-for="student in filteredStudents"
            :key="student.id"
            class="w-full text-left px-4 py-3 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200 flex items-center"
            @click="selectStudent(student)"
          >
            <div class="font-medium">{{ student.nombre }} {{ student.apellido }}</div>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { XMarkIcon } from '@heroicons/vue/24/outline'
import { useStudentsStore } from '../../Students/store/students'

const props = defineProps<{
  show: boolean
  classId: string
}>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'select', student: { id: string, nombre: string, apellido: string }): void
}>()

const studentsStore = useStudentsStore()
const students = ref<any[]>([])
const filteredStudents = ref<any[]>([])
const searchTerm = ref('')
const loading = ref(true)

// Cargar estudiantes cuando se muestra el modal
watch(() => props.show, (newValue) => {
  if (newValue) {
    loadStudents()
  }
})

onMounted(() => {
  if (props.show) {
    loadStudents()
  }
})

// Cargar estudiantes para la clase seleccionada
const loadStudents = async () => {
  loading.value = true
  
  try {
    // Asegurarse de que los estudiantes estén cargados
    if (studentsStore.students.length === 0) {
      await studentsStore.fetchStudents()
    }
    
    // Filtrar estudiantes por la clase
    if (props.classId) {
      students.value = studentsStore.getStudentsByClass(props.classId)
    } else {
      students.value = studentsStore.students
    }
    
    filterStudents()
  } catch (error) {
    console.error('Error al cargar estudiantes:', error)
  } finally {
    loading.value = false
  }
}

// Filtrar estudiantes según el término de búsqueda
const filterStudents = () => {
  if (!searchTerm.value.trim()) {
    filteredStudents.value = students.value
  } else {
    const term = searchTerm.value.toLowerCase()
    filteredStudents.value = students.value.filter(student => {
      const nombreCompleto = `${student.nombre} ${student.apellido}`.toLowerCase()
      return nombreCompleto.includes(term)
    })
  }
}

// Cerrar el modal
const close = () => {
  emit('close')
}

// Seleccionar un estudiante
const selectStudent = (student) => {
  emit('select', {
    id: student.id,
    nombre: student.nombre,
    apellido: student.apellido
  })
}
</script>
