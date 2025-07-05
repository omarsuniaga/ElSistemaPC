<!--
🎯 ATTENDANCE FORM VIEW - NUEVA ARQUITECTURA
Vista del formulario de asistencia para una clase específica
Recibe date y classId como props desde la ruta
-->

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { format, parseISO } from 'date-fns'
import { es } from 'date-fns/locale'
import { useAttendanceStore } from '../../store/attendance'
import { useClassesStore } from '../../../Classes/store/classes'
import { useStudentsStore } from '../../../Students/store/students'
import { useAuthStore } from '../../../../stores/auth'

// Componentes
import StudentAttendanceGrid from '../../components/StudentAttendanceGrid.vue'
import LoadingSpinner from '../../../../components/ui/LoadingSpinner.vue'

// Props de la ruta
interface Props {
  date: string // YYYYMMDD format from URL
  classId: string
}

const props = defineProps<Props>()
const router = useRouter()
const route = useRoute()

// Stores
const attendanceStore = useAttendanceStore()
const classesStore = useClassesStore()
const studentsStore = useStudentsStore()
const authStore = useAuthStore()

// Estado del componente
const isLoading = ref(true)
const isSaving = ref(false)
const error = ref<string | null>(null)
const attendanceDocument = ref<any>(null)
const classData = ref<any>(null)
const studentsData = ref<any[]>([])

// Computed properties
const formattedDate = computed(() => {
  if (!props.date) return ''
  
  // Convertir YYYYMMDD a YYYY-MM-DD
  const dateStr = `${props.date.slice(0, 4)}-${props.date.slice(4, 6)}-${props.date.slice(6, 8)}`
  const date = parseISO(dateStr)
  return format(date, "EEEE, d 'de' MMMM 'de' yyyy", { locale: es }).replace(/^\w/, (c) =>
    c.toUpperCase()
  )
})

const dateForStore = computed(() => {
  if (!props.date) return ''
  // Convertir YYYYMMDD a YYYY-MM-DD para el store
  return `${props.date.slice(0, 4)}-${props.date.slice(4, 6)}-${props.date.slice(6, 8)}`
})

const currentTeacher = computed(() => ({
  name: authStore.user?.email || 'Maestro',
  id: authStore.user?.uid,
}))

const isValid = computed(() => {
  return attendanceDocument.value && 
         attendanceDocument.value.students && 
         attendanceDocument.value.students.length > 0
})

const hasChanges = computed(() => {
  // TODO: Implementar lógica para detectar cambios no guardados
  return true
})

// Métodos principales
const loadAttendanceData = async () => {
  if (!props.date || !props.classId || !currentTeacher.value.id) {
    error.value = 'Datos de ruta incompletos'
    return
  }

  isLoading.value = true
  error.value = null

  try {
    console.log('📋 [AttendanceForm] Loading attendance data:', {
      date: dateForStore.value,
      classId: props.classId,
      teacherId: currentTeacher.value.id
    })

    // 1. Cargar el documento de asistencia
    await attendanceStore.fetchAttendanceDocument(
      dateForStore.value,
      props.classId,
      currentTeacher.value.id
    )

    // 2. Obtener el documento desde el store
    attendanceDocument.value = attendanceStore.getCurrentAttendanceDocument(
      dateForStore.value,
      props.classId
    )

    if (!attendanceDocument.value) {
      throw new Error('No se pudo cargar el documento de asistencia')
    }

    // 3. Cargar datos de la clase
    await classesStore.fetchClassById(props.classId)
    classData.value = classesStore.getClassById(props.classId)

    // 4. Cargar datos de los estudiantes de la clase
    if (classData.value?.studentIds && classData.value.studentIds.length > 0) {
      await studentsStore.fetchStudentsByIds(classData.value.studentIds)
      studentsData.value = studentsStore.getStudentsByIds(classData.value.studentIds)
    }

    console.log('✅ [AttendanceForm] Data loaded successfully:', {
      attendanceDocument: attendanceDocument.value,
      classData: classData.value,
      studentsCount: studentsData.value.length
    })

  } catch (err) {
    console.error('❌ [AttendanceForm] Error loading attendance data:', err)
    error.value = err instanceof Error ? err.message : 'Error al cargar los datos'
  } finally {
    isLoading.value = false
  }
}

const saveAttendance = async () => {
  if (!attendanceDocument.value || !isValid.value) {
    error.value = 'Datos de asistencia inválidos'
    return
  }

  isSaving.value = true
  error.value = null

  try {
    console.log('💾 [AttendanceForm] Saving attendance:', attendanceDocument.value)

    // Guardar en el store
    await attendanceStore.saveAttendanceDocument(attendanceDocument.value)

    console.log('✅ [AttendanceForm] Attendance saved successfully')

    // Navegar a la vista de confirmación y exportación
    router.push({
      name: 'TeacherShareAttendance',
      params: {
        date: props.date,
        classId: props.classId
      },
      query: {
        success: 'true'
      }
    })

  } catch (err) {
    console.error('❌ [AttendanceForm] Error saving attendance:', err)
    error.value = err instanceof Error ? err.message : 'Error al guardar la asistencia'
  } finally {
    isSaving.value = false
  }
}

const handleStudentAttendanceChange = (studentId: string, status: 'presente' | 'ausente' | 'tardanza') => {
  if (!attendanceDocument.value) return

  // Actualizar el estado del estudiante en el documento
  const studentIndex = attendanceDocument.value.students.findIndex((s: any) => s.studentId === studentId)
  
  if (studentIndex !== -1) {
    attendanceDocument.value.students[studentIndex].status = status
    attendanceDocument.value.students[studentIndex].updatedAt = new Date()
    
    console.log('📝 [AttendanceForm] Student attendance updated:', {
      studentId,
      status,
      timestamp: attendanceDocument.value.students[studentIndex].updatedAt
    })
  }
}

const goBack = () => {
  const returnRoute = route.query.return as string

  if (hasChanges.value) {
    // TODO: Mostrar modal de confirmación para cambios no guardados
    if (!confirm('¿Estás seguro de salir sin guardar los cambios?')) {
      return
    }
  }

  if (returnRoute === 'dashboard') {
    router.push({ name: 'TeacherAttendanceDashboard' })
  } else {
    router.back()
  }
}

const handleCancel = () => {
  goBack()
}

// Watchers
watch(() => [props.date, props.classId], () => {
  loadAttendanceData()
}, { immediate: false })

// Lifecycle
onMounted(() => {
  console.log('🚀 [AttendanceForm] Component mounted with props:', props)
  loadAttendanceData()
})
</script>

<template>
  <div class="min-h-screen bg-gray-50 dark:bg-gray-900">
    <!-- 🎯 HEADER -->
    <header class="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
      <div class="px-6 py-4">
        <div class="flex items-center justify-between">
          <!-- Navegación y título -->
          <div class="flex items-center space-x-4">
            <!-- Botón de regreso -->
            <button
              @click="goBack"
              class="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              title="Volver al calendario"
            >
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
              </svg>
            </button>

            <!-- Información de la clase -->
            <div>
              <h1 class="text-xl font-bold text-gray-900 dark:text-white">
                Registro de Asistencia
              </h1>
              <div class="flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400">
                <span>{{ formattedDate }}</span>
                <span>•</span>
                <span v-if="classData">{{ classData.name || classData.instrument }}</span>
                <span v-else>Cargando clase...</span>
              </div>
            </div>
          </div>

          <!-- Acciones del header -->
          <div class="flex items-center space-x-3">
            <!-- Indicador de estado -->
            <div v-if="hasChanges" class="flex items-center space-x-2 text-sm text-amber-600 dark:text-amber-400">
              <div class="w-2 h-2 bg-amber-500 rounded-full animate-pulse"></div>
              <span>Cambios sin guardar</span>
            </div>

            <!-- Botones de acción -->
            <button
              @click="handleCancel"
              class="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              Cancelar
            </button>
            
            <button
              @click="saveAttendance"
              :disabled="!isValid || isSaving"
              class="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed rounded-lg transition-colors flex items-center space-x-2"
            >
              <svg v-if="isSaving" class="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              <span>{{ isSaving ? 'Guardando...' : 'Guardar y Continuar' }}</span>
            </button>
          </div>
        </div>
      </div>
    </header>

    <!-- 🏗️ CONTENIDO PRINCIPAL -->
    <main class="flex-1 p-6">
      <!-- Estado de carga -->
      <div v-if="isLoading" class="flex items-center justify-center py-12">
        <LoadingSpinner size="large" message="Cargando datos de asistencia..." />
      </div>

      <!-- Estado de error -->
      <div v-else-if="error" class="max-w-2xl mx-auto">
        <div class="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6">
          <div class="flex items-center space-x-3">
            <svg class="w-6 h-6 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <h3 class="text-lg font-medium text-red-800 dark:text-red-200">
                Error al cargar los datos
              </h3>
              <p class="text-red-700 dark:text-red-300 mt-1">
                {{ error }}
              </p>
            </div>
          </div>
          <div class="mt-4">
            <button
              @click="loadAttendanceData"
              class="px-4 py-2 text-sm font-medium text-red-800 dark:text-red-200 bg-red-100 dark:bg-red-800/30 hover:bg-red-200 dark:hover:bg-red-800/50 rounded-lg transition-colors"
            >
              Intentar de nuevo
            </button>
          </div>
        </div>
      </div>

      <!-- Formulario de asistencia -->
      <div v-else-if="attendanceDocument && classData" class="max-w-4xl mx-auto">
        <!-- Información de la clase -->
        <div class="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 mb-6 p-6">
          <div class="flex items-center justify-between">
            <div>
              <h2 class="text-lg font-semibold text-gray-900 dark:text-white">
                {{ classData.name || classData.instrument }}
              </h2>
              <div class="flex items-center space-x-4 mt-2 text-sm text-gray-500 dark:text-gray-400">
                <span>📅 {{ formattedDate }}</span>
                <span>⏰ {{ classData.time || 'Horario no especificado' }}</span>
                <span>👥 {{ studentsData.length }} estudiante{{ studentsData.length !== 1 ? 's' : '' }}</span>
              </div>
            </div>
            
            <!-- Estado del documento -->
            <div class="text-right">
              <div class="text-sm text-gray-500 dark:text-gray-400">
                Estado del registro
              </div>
              <div class="text-lg font-semibold text-blue-600 dark:text-blue-400">
                {{ attendanceDocument.status === 'completed' ? 'Completado' : 'En Progreso' }}
              </div>
            </div>
          </div>
        </div>

        <!-- Cuadrícula de estudiantes -->
        <div class="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
          <div class="p-6 border-b border-gray-200 dark:border-gray-700">
            <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
              Lista de Asistencia
            </h3>
            <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Marca la asistencia de cada estudiante para esta clase
            </p>
          </div>

          <div class="p-6">
            <StudentAttendanceGrid
              v-if="attendanceDocument && studentsData.length > 0"
              :attendance-document="attendanceDocument"
              :students="studentsData"
              @student-attendance-change="handleStudentAttendanceChange"
            />
            
            <!-- Estado sin estudiantes -->
            <div v-else class="text-center py-8">
              <svg class="w-12 h-12 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-2">
                No hay estudiantes registrados
              </h3>
              <p class="text-gray-500 dark:text-gray-400">
                Esta clase no tiene estudiantes asignados
              </p>
            </div>
          </div>
        </div>

        <!-- Pie de página con acciones -->
        <div class="mt-6 flex items-center justify-between">
          <div class="text-sm text-gray-500 dark:text-gray-400">
            Los cambios se guardan automáticamente cada pocos segundos
          </div>
          
          <div class="flex items-center space-x-3">
            <button
              @click="handleCancel"
              class="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              Cancelar
            </button>
            
            <button
              @click="saveAttendance"
              :disabled="!isValid || isSaving"
              class="px-6 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed rounded-lg transition-colors flex items-center space-x-2"
            >
              <svg v-if="isSaving" class="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              <span>{{ isSaving ? 'Guardando...' : 'Completar y Compartir' }}</span>
            </button>
          </div>
        </div>
      </div>
    </main>
  </div>
</template>

<style scoped>
/* Animaciones para feedback visual */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

/* Estilo para botones deshabilitados */
button:disabled {
  cursor: not-allowed;
  opacity: 0.6;
}

/* Animación de guardado */
@keyframes pulse-save {
  0%, 100% {
    box-shadow: 0 0 0 0 rgba(59, 130, 246, 0.4);
  }
  50% {
    box-shadow: 0 0 0 4px rgba(59, 130, 246, 0);
  }
}

.saving {
  animation: pulse-save 2s ease-in-out infinite;
}
</style>
