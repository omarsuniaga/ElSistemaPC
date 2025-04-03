<template>
  <div v-if="isVisible" class="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
    <div class="relative bg-white rounded-lg shadow-xl max-w-lg w-full max-h-[80vh] flex flex-col">
      <!-- Header con título y botón de cierre -->
      <div class="flex justify-between items-center border-b p-4">
        <h2 class="text-xl font-semibold">{{ title }}</h2>
        <button @click="close" class="text-gray-500 hover:text-gray-700">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
      
      <!-- Contenido del modal -->
      <div class="p-4 overflow-y-auto flex-grow">
        <!-- Estado de carga -->
        <div v-if="isLoading" class="flex flex-col items-center justify-center py-8">
          <svg class="animate-spin h-10 w-10 mb-4 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <p class="text-gray-500">Cargando observaciones...</p>
        </div>
        
        <!-- Estado de error -->
        <div v-else-if="error" class="bg-red-100 border-l-4 border-red-500 text-red-700 p-4">
          <p>{{ error }}</p>
          <button @click="loadObservations" class="mt-2 px-3 py-1 bg-red-200 hover:bg-red-300 rounded">
            Reintentar
          </button>
        </div>
        
        <!-- Contenido de las observaciones -->
        <div v-else>
          <div v-if="!observations" class="text-center py-8 text-gray-500">
            No hay observaciones registradas para esta clase
          </div>
          
          <div v-else class="space-y-4">
            <div class="bg-gray-50 p-4 rounded-lg">
              <h3 class="font-medium text-gray-700 mb-2">Observaciones de clase:</h3>
              <div class="bg-white border rounded-lg p-4 whitespace-pre-wrap">{{ observations }}</div>
            </div>
            
            <div v-if="justifications.length > 0">
              <h3 class="font-medium text-gray-700 mb-2">Justificaciones registradas:</h3>
              <ul class="divide-y divide-gray-200 border rounded-lg">
                <li v-for="(justification, index) in justifications" :key="index" class="p-3 bg-white">
                  <div class="flex items-start">
                    <div class="flex-shrink-0 mt-1">
                      <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-blue-500" viewBox="0 0 20 20" fill="currentColor">
                        <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd" />
                      </svg>
                    </div>
                    <div class="ml-3">
                      <p class="text-sm font-medium">{{ getStudentName(justification.id) }}</p>
                      <p class="text-sm text-gray-500">{{ justification.reason }}</p>
                      <div v-if="justification.documentURL" class="mt-1">
                        <a :href="justification.documentURL" target="_blank" class="text-xs text-blue-500 flex items-center">
                          <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                          </svg>
                          Ver documento
                        </a>
                      </div>
                    </div>
                  </div>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
      
      <!-- Footer con botones de acción -->
      <div class="border-t p-4 flex justify-end">
        <button @click="close" class="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-lg">
          Cerrar
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { useAttendanceStore } from '../modulos/Attendance/store/attendance'
import { useStudentsStore } from '../modulos/Students/store/students'
import { useClassesStore } from '../modulos/Classes/store/classes'

// Props
const props = defineProps<{
  isVisible: boolean,
  classId: string,
  date: string,
  title?: string
}>()

// Emits
const emit = defineEmits(['close'])

// Estado reactivo
const isLoading = ref(false)
const error = ref<string | null>(null)
const observations = ref<string | null>(null)
const justifications = ref<any[]>([])
const attendanceStore = useAttendanceStore()
const studentsStore = useStudentsStore()
const classesStore = useClassesStore()

// Métodos
const close = () => {
  emit('close')
}

const getStudentName = (studentId: string): string => {
  const student = studentsStore.students.find(s => s.id === studentId)
  return student ? `${student.nombre} ${student.apellido || ''}`.trim() : 'Estudiante sin nombre'
}

const loadObservations = async () => {
  if (!props.classId || !props.date) return
  
  isLoading.value = true
  error.value = null
  
  try {
    // Cargar estudiantes si no están en el store
    if (studentsStore.students.length === 0) {
      await studentsStore.fetchStudents()
    }
    
    // Cargar el documento de asistencia
    const attendanceDoc = await attendanceStore.fetchAttendanceDocument(props.date, props.classId)
    
    if (!attendanceDoc) {
      observations.value = null
      justifications.value = []
      return
    }
    
    // Extraer observaciones y justificaciones
    observations.value = attendanceDoc.data?.observations || null
    justifications.value = attendanceDoc.data?.justificacion || []
    
    // Cargar clase para mostrar información adicional
    const classInfo = classesStore.getClassById(props.classId)
    if (!classInfo) {
      await classesStore.fetchClasses()
    }
  } catch (err) {
    console.error('Error al cargar observaciones:', err)
    error.value = `Error al cargar observaciones: ${err instanceof Error ? err.message : 'Error desconocido'}`
  } finally {
    isLoading.value = false
  }
}

// Observadores
watch(() => props.isVisible, (newValue) => {
  if (newValue) {
    loadObservations()
  }
})

// Ciclo de vida
onMounted(() => {
  if (props.isVisible) {
    loadObservations()
  }
})
</script>