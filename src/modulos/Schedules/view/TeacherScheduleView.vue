<template>
  <div class="p-4 max-w-5xl mx-auto">
    <!-- Encabezado con título y botones -->
    <div class="mb-6 flex flex-col md:flex-row md:justify-between md:items-center gap-4">
      <div>
        <h1 class="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <CalendarIcon class="h-7 w-7 text-primary-600" />
          Horario de Clases
        </h1>
        <p v-if="teacher" class="text-gray-600 dark:text-gray-400 mt-1 text-lg">
          {{ teacher.name }}
        </p>
      </div>
      <div class="flex gap-2">
        <button 
          @click="downloadPDF"
          class="btn btn-primary flex items-center gap-2 transition-all hover:scale-105"
        >
          <DocumentArrowDownIcon class="w-5 h-5" />
          Descargar PDF
        </button>
      </div>
    </div>
    
    <!-- Componente de horario semanal -->
    <div class="mb-4 bg-white dark:bg-gray-800 rounded-lg shadow-md p-4">
      <TeacherWeeklySchedule :teacherId="teacherId" />
    </div>
    
    <!-- Sección de próximas clases -->
    <div v-if="isLoading" class="flex justify-center my-8">
      <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
    </div>
    
    <div v-else-if="error" class="bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800 p-4 rounded-lg">
      <p class="text-red-600 dark:text-red-400">{{ error }}</p>
    </div>
    
    <div v-else-if="teacherClasses.length === 0" class="bg-yellow-50 dark:bg-yellow-900/10 border border-yellow-200 dark:border-yellow-800 p-6 rounded-lg text-center">
      <p class="text-yellow-600 dark:text-yellow-400 text-lg">No tienes clases asignadas actualmente.</p>
    </div>
    
    <div v-else class="mt-8">
      <h2 class="text-xl font-bold mb-4">Próximas Clases</h2>
      
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <div
          v-for="classItem in teacherClasses"
          :key="classItem.id"
          class="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 border-l-4"
          :class="getClassStatusColor(classItem)"
        >
          <div class="flex justify-between items-start mb-2">
            <h3 class="font-bold text-lg">{{ classItem.name }}</h3>
          </div>
          
          <div class="space-y-2 text-sm">
            <p class="flex items-center">
              <ClockIcon class="h-4 w-4 mr-2 text-gray-500 dark:text-gray-400" />
              <span v-if="classItem.schedule">
                {{ formatSchedule(classItem.schedule) }}
              </span>
              <span v-else class="text-gray-500 dark:text-gray-400">
                Horario no asignado
              </span>
            </p>
            
            <p class="flex items-center">
              <BuildingOfficeIcon class="h-4 w-4 mr-2 text-gray-500 dark:text-gray-400" />
              <span>{{ classItem.classroom || 'Aula no asignada' }}</span>
            </p>
            
            <p class="flex items-center">
              <UserGroupIcon class="h-4 w-4 mr-2 text-gray-500 dark:text-gray-400" />
              <span>{{ classItem.studentIds?.length || 0 }} estudiantes</span>
            </p>
          </div>
          
          <div class="mt-4 flex justify-end">
            <router-link
              :to="`/teacher/attendance/${getCurrentDate()}/${classItem.id}`"
              class="text-sm text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300 flex items-center"
            >
              <ClipboardDocumentCheckIcon class="h-4 w-4 mr-1" />
              Tomar asistencia
            </router-link>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { useTeachersStore } from '../../Teachers/store/teachers'
import { useClassesStore } from '../../Classes/store/classes'
import { useAuthStore } from '../../../stores/auth'
import { format, parseISO } from 'date-fns'
import { es } from 'date-fns/locale'
import TeacherWeeklySchedule from '../../components/teachers/TeacherSchedule.vue'
import html2pdf from 'html2pdf.js'

import { 
  CalendarIcon,
  DocumentArrowDownIcon,
  ClockIcon,
  BuildingOfficeIcon,
  UserGroupIcon,
  ClipboardDocumentCheckIcon
} from '@heroicons/vue/24/outline'

// Stores
const teachersStore = useTeachersStore()
const classesStore = useClassesStore()
const authStore = useAuthStore()

// Estado
const isLoading = ref(true)
const error = ref<string | null>(null)
const teacher = ref<any>(null)
const teacherId = computed(() => authStore.user?.id || '')

// Clases del profesor
const teacherClasses = computed(() => {
  if (!teacherId.value) return []
  
  return classesStore.classes.filter(cls => cls.teacherId === teacherId.value)
})

// Función para cargar datos
const loadData = async () => {
  isLoading.value = true
  error.value = null
  
  try {
    // Cargar datos del profesor
    if (teacherId.value) {
      await teachersStore.fetchTeachers()
      teacher.value = teachersStore.getTeacherById(teacherId.value)
    }
    
    // Cargar clases
    if (classesStore.classes.length === 0) {
      await classesStore.fetchClasses()
    }
  } catch (err: any) {
    console.error('Error cargando datos:', err)
    error.value = err.message || 'Error al cargar datos del horario'
  } finally {
    isLoading.value = false
  }
}

// Funciones de utilidad
const formatSchedule = (schedule: any): string => {
  if (!schedule) return 'Sin horario'
  
  // Si el horario es un objeto con días, startTime y endTime
  if (typeof schedule === 'object' && schedule.days) {
    const days = Array.isArray(schedule.days) ? schedule.days.join(', ') : schedule.days
    return `${days} ${schedule.startTime} - ${schedule.endTime}`
  }
  
  // Si el horario es un string (formato antiguo)
  return schedule.toString()
}

const getCurrentDate = (): string => {
  const today = new Date()
  return format(today, 'yyyyMMdd')
}

const getClassStatusColor = (classItem: any): string => {
  if (!classItem.schedule) {
    return 'border-yellow-500'  // Sin horario
  }
  
  if (!classItem.studentIds || classItem.studentIds.length === 0) {
    return 'border-orange-500'  // Sin estudiantes
  }
  
  return 'border-green-500'  // Todo correcto
}

// Exportar PDF
const downloadPDF = () => {
  const element = document.getElementById('schedule-container')
  const options = {
    margin: 10,
    filename: `horario_${teacher.value?.name || 'maestro'}.pdf`,
    image: { type: 'jpeg', quality: 0.98 },
    html2canvas: { scale: 2 },
    jsPDF: { unit: 'mm', format: 'a4', orientation: 'landscape' }
  }
  
  // Crear un contenedor temporal con los datos a exportar
  const tempContainer = document.createElement('div')
  tempContainer.innerHTML = `
    <div style="padding: 20px;">
      <h1 style="text-align: center; margin-bottom: 20px;">
        Horario de Clases - ${teacher.value?.name || 'Maestro'}
      </h1>
      <div>${document.querySelector('.schedule-grid')?.outerHTML || ''}</div>
    </div>
  `
  
  // Convertir a PDF
  html2pdf().from(tempContainer).set(options).save()
}

onMounted(async () => {
  await loadData()
})
</script>

<style scoped>
.btn {
  @apply px-3 py-2 rounded-md font-medium text-sm transition-colors;
}

.btn-primary {
  @apply bg-primary-600 text-white hover:bg-primary-700;
}
</style>
