<template>
  <div
    v-if="isVisible"
    class="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4"
  >
    <div
      class="relative bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-7xl w-full max-h-[90vh] flex flex-col"
    >
      <!-- Header -->
      <div class="flex justify-between items-center border-b border-gray-200 dark:border-gray-700 p-6">
        <div>
          <h2 class="text-2xl font-semibold text-gray-900 dark:text-white">
            📱 Gestión de Mensajes WhatsApp - Notificaciones
          </h2>
          <p class="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Envía mensajes personalizados según el tipo de situación: ausencias, tardanzas o justificaciones
          </p>
        </div>
        <button
          class="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          @click="close"
        >
          <svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <!-- Tabs para tipo de notificación -->
      <div class="border-b border-gray-200 dark:border-gray-700">
        <nav class="flex space-x-8 px-6" aria-label="Tabs">
          <button
            v-for="tab in notificationTabs"
            :key="tab.id"
            :class="[
              activeTab === tab.id
                ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200',
              'py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2'
            ]"
            @click="activeTab = tab.id"
          >
            <span class="text-lg">{{ tab.icon }}</span>
            {{ tab.name }}
            <span
              v-if="getStudentsByType(tab.id).length > 0"
              class="ml-2 inline-flex items-center justify-center px-2 py-1 text-xs font-bold text-white bg-red-500 rounded-full"
            >
              {{ getStudentsByType(tab.id).length }}
            </span>
          </button>
        </nav>
      </div>

      <!-- Loading state -->
      <div v-if="loading" class="flex-1 flex items-center justify-center py-12">
        <div class="text-center">
          <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p class="text-gray-600 dark:text-gray-400">Cargando estudiantes con inasistencias...</p>
        </div>
      </div>

      <!-- Content -->
      <div v-else class="flex-1 flex overflow-hidden">
        <!-- Sidebar: Lista de estudiantes -->
        <div class="w-1/3 border-r border-gray-200 dark:border-gray-700 flex flex-col">
          <!-- Filtros -->
          <div class="p-4 border-b border-gray-200 dark:border-gray-700">
            <div class="mb-3">
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Filtro por período
              </label>
              <select
                v-model="selectedPeriod"
                class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white"
                @change="fetchStudentsWithAbsences"
              >
                <option value="week">Esta semana</option>
                <option value="month">Este mes</option>
                <option value="custom">Período personalizado</option>
              </select>
            </div>

            <!-- Búsqueda -->
            <div class="mb-3">
              <input
                v-model="searchQuery"
                type="text"
                placeholder="Buscar estudiante..."
                class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white"
              />
            </div>

            <!-- Acciones masivas -->
            <div class="flex gap-2">
              <button
                class="px-3 py-1 text-xs bg-blue-100 text-blue-800 rounded-md hover:bg-blue-200"
                @click="selectAll"
              >
                Seleccionar todos
              </button>
              <button
                class="px-3 py-1 text-xs bg-gray-100 text-gray-800 rounded-md hover:bg-gray-200"
                @click="deselectAll"
              >
                Limpiar
              </button>
            </div>
          </div>

          <!-- Lista de estudiantes -->
          <div class="flex-1 overflow-y-auto">
            <div v-if="filteredStudents.length === 0" class="p-4 text-center text-gray-500">
              No se encontraron estudiantes con inasistencias
            </div>
            <div
              v-for="student in filteredStudents"
              :key="student.id"
              class="p-4 border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer"
              :class="{ 'bg-blue-50 dark:bg-blue-900/20': selectedStudents.includes(student.id) }"
              @click="toggleStudent(student.id)"
            >
              <div class="flex items-start space-x-3">
                <input
                  type="checkbox"
                  :checked="selectedStudents.includes(student.id)"
                  class="mt-1 h-4 w-4 text-blue-600 rounded"
                  @click.stop
                  @change="toggleStudent(student.id)"
                />
                <div class="flex-1 min-w-0">
                  <div class="flex justify-between items-start">
                    <div>
                      <h4 class="text-sm font-medium text-gray-900 dark:text-white">
                        {{ student.nombre }} {{ student.apellido }}
                      </h4>
                      <p class="text-xs text-gray-500 dark:text-gray-400">
                        {{ student.instrumento || 'Sin instrumento' }}
                      </p>
                    </div>
                    <div class="text-right">
                      <div
                        class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium"
                        :class="getEscalationLevelClass(student.escalationLevel)"
                      >
                        Nivel {{ student.escalationLevel }}
                      </div>
                    </div>
                  </div>
                  <div class="mt-2 flex items-center justify-between text-xs">
                    <span class="text-red-600 dark:text-red-400">
                      {{ student.absences }} inasistencias
                    </span>
                    <span class="text-gray-500 dark:text-gray-400">
                      {{ formatLastAbsence(student.lastAbsence) }}
                    </span>
                  </div>
                  <!-- Números de teléfono -->
                  <div class="mt-2 text-xs text-gray-500 dark:text-gray-400">
                    <div v-if="student.tlf_madre" class="flex items-center">
                      <span class="inline-block w-1 h-1 bg-green-500 rounded-full mr-2"></span>
                      Madre: {{ student.tlf_madre }}
                    </div>
                    <div v-if="student.tlf_padre" class="flex items-center">
                      <span class="inline-block w-1 h-1 bg-green-500 rounded-full mr-2"></span>
                      Padre: {{ student.tlf_padre }}
                    </div>
                    <div v-if="!student.tlf_madre && !student.tlf_padre" class="text-red-500">
                      Sin teléfonos registrados
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Main content: Gestión de mensajes -->
        <div class="flex-1 flex flex-col">
          <!-- Resumen de selección -->
          <div class="p-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700">
            <div class="flex justify-between items-center">
              <div>
                <h3 class="text-lg font-medium text-gray-900 dark:text-white">
                  Estudiantes seleccionados: {{ selectedStudents.length }}
                </h3>
                <p class="text-sm text-gray-600 dark:text-gray-400">
                  {{ getTotalPhoneNumbers() }} números de teléfono para notificar
                </p>
              </div>
              <div class="flex gap-2">
                <!-- Estadísticas por nivel -->
                <div v-for="level in [1, 2, 3, 4]" :key="level" class="text-center">
                  <div
                    class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium"
                    :class="getEscalationLevelClass(level)"
                  >
                    N{{ level }}: {{ getStudentsByLevel(level).length }}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Editor de mensajes -->
          <div class="flex-1 overflow-y-auto p-4">
            <div v-if="selectedStudents.length === 0" class="text-center py-12">
              <div class="text-gray-400 dark:text-gray-500 mb-4">
                <svg class="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 8h10m0 0V6a2 2 0 00-2-2H9a2 2 0 00-2 2v2m0 0v10a2 2 0 002 2h6a2 2 0 002-2V8" />
                </svg>
              </div>
              <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-2">
                Selecciona estudiantes para comenzar
              </h3>
              <p class="text-gray-600 dark:text-gray-400">
                Elige uno o más estudiantes de la lista para ver y editar los mensajes
              </p>
            </div>

            <!-- Pestañas por nivel de escalación -->
            <div v-else>
              <div class="border-b border-gray-200 dark:border-gray-700 mb-4">
                <nav class="-mb-px flex space-x-8">
                  <button
                    v-for="level in getRepresentedLevels()"
                    :key="level"
                    class="py-2 px-1 border-b-2 font-medium text-sm"
                    :class="activeTab === level 
                      ? 'border-blue-500 text-blue-600 dark:text-blue-400' 
                      : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'"
                    @click="activeTab = level"
                  >
                    Nivel {{ level }} ({{ getStudentsByLevel(level).length }})
                  </button>
                </nav>
              </div>

              <!-- Contenido por nivel -->
              <div v-for="level in getRepresentedLevels()" :key="level" v-show="activeTab === level">
                <div class="mb-6">
                  <div class="flex justify-between items-center mb-4">
                    <h4 class="text-lg font-medium text-gray-900 dark:text-white">
                      Nivel {{ level }} - {{ getLevelDescription(level) }}
                    </h4>
                    <button
                      class="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
                      @click="resetToTemplate(level)"
                    >
                      Restaurar plantilla
                    </button>
                  </div>

                  <!-- Lista de estudiantes de este nivel -->
                  <div class="mb-4 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <h5 class="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Estudiantes afectados:
                    </h5>
                    <div class="flex flex-wrap gap-2">
                      <span
                        v-for="student in getStudentsByLevel(level)"
                        :key="student.id"
                        class="inline-flex items-center px-2 py-1 bg-white dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-md text-sm"
                      >
                        {{ student.nombre }} {{ student.apellido }}
                        <span class="ml-1 text-red-500">({{ student.absences }})</span>
                      </span>
                    </div>
                  </div>

                  <!-- Editor de mensaje -->
                  <div class="space-y-4">
                    <div>
                      <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Mensaje personalizado:
                      </label>
                      <textarea
                        v-model="customMessages[level]"
                        rows="8"
                        class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white"
                        placeholder="Escribe tu mensaje personalizado aquí..."
                        @input="markAsModified(level)"
                      />
                    </div>

                    <!-- Variables disponibles -->
                    <div class="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
                      <h6 class="text-sm font-medium text-blue-900 dark:text-blue-300 mb-2">
                        Variables disponibles:
                      </h6>
                      <div class="grid grid-cols-2 gap-2 text-sm text-blue-800 dark:text-blue-300">
                        <div>
                          <button
                            class="text-left hover:underline"
                            @click="insertVariable(level, '{studentName}')"
                          >
                            {studentName} - Nombre del estudiante
                          </button>
                        </div>
                        <div>
                          <button
                            class="text-left hover:underline"
                            @click="insertVariable(level, '{date}')"
                          >
                            {date} - Fecha actual
                          </button>
                        </div>
                        <div>
                          <button
                            class="text-left hover:underline"
                            @click="insertVariable(level, '{absenceCount}')"
                          >
                            {absenceCount} - Número de ausencias
                          </button>
                        </div>
                        <div>
                          <button
                            class="text-left hover:underline"
                            @click="insertVariable(level, '{academyName}')"
                          >
                            {academyName} - Academia El Sistema
                          </button>
                        </div>
                      </div>
                    </div>

                    <!-- Acciones para plantillas -->
                    <div class="flex gap-2">
                      <button
                        class="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                        @click="saveAsTemplate(level)"
                      >
                        💾 Guardar como plantilla
                      </button>
                      <button
                        class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                        @click="previewMessage(level)"
                      >
                        👁️ Vista previa
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Footer -->
      <div class="border-t border-gray-200 dark:border-gray-700 p-6">
        <div class="flex justify-between items-center">
          <div class="text-sm text-gray-600 dark:text-gray-400">
            <span v-if="selectedStudents.length > 0">
              Se enviarán {{ getTotalMessages() }} mensajes a {{ getTotalPhoneNumbers() }} números
            </span>
          </div>
          <div class="flex gap-3">
            <button
              class="px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-600 rounded-md hover:bg-gray-200 dark:hover:bg-gray-500"
              @click="close"
            >
              Cancelar
            </button>
            <button
              :disabled="selectedStudents.length === 0 || sending"
              class="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
              @click="sendMessages"
            >
              <div v-if="sending" class="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              {{ sending ? 'Enviando...' : '📱 Enviar Mensajes' }}
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Modal de vista previa -->
    <div
      v-if="showPreview"
      class="fixed inset-0 z-60 flex items-center justify-center bg-black bg-opacity-50"
    >
      <div class="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full mx-4">
        <div class="p-6">
          <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-4">
            Vista previa del mensaje
          </h3>
          <div class="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg mb-4">
            <p class="text-sm text-gray-900 dark:text-white whitespace-pre-wrap">{{ previewContent }}</p>
          </div>
          <div class="flex justify-end gap-2">
            <button
              class="px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-600 rounded-md hover:bg-gray-200"
              @click="showPreview = false"
            >
              Cerrar
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useStudentsStore } from '@/modulos/Students/store/students'
import { useAttendanceStore } from '@/modulos/Attendance/store/attendance'
import { 
  notifyUnexcusedAbsences, 
  getStudentMessageHistory,
  MESSAGE_TEMPLATES 
} from '@/services/attendanceNotifications'
import { httpsCallable } from 'firebase/functions'
import { functions } from '@/firebase'

// Props
interface Props {
  isVisible: boolean
}

const props = defineProps<Props>()

// Emits
const emit = defineEmits<{
  close: []
  messagesSent: [{ success: number; failed: number; messages: any[] }]
}>()

// Stores
const studentsStore = useStudentsStore()
const attendanceStore = useAttendanceStore()

// State
const loading = ref(false)
const sending = ref(false)
const selectedPeriod = ref('week')
const searchQuery = ref('')
const selectedStudents = ref<string[]>([])
const studentsWithAbsences = ref<any[]>([])
const activeTab = ref(1)
const customMessages = ref<Record<number, string>>({})
const modifiedLevels = ref<Set<number>>(new Set())
const showPreview = ref(false)
const previewContent = ref('')

// Firebase Function
const getStudentAttendanceSummary = httpsCallable(functions, 'getStudentAttendanceSummary')

// Computed
const filteredStudents = computed(() => {
  let filtered = studentsWithAbsences.value

  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    filtered = filtered.filter(student => 
      `${student.nombre} ${student.apellido}`.toLowerCase().includes(query) ||
      (student.instrumento || '').toLowerCase().includes(query)
    )
  }

  return filtered
})

const getRepresentedLevels = () => {
  const levels = new Set(
    studentsWithAbsences.value
      .filter(s => selectedStudents.value.includes(s.id))
      .map(s => s.escalationLevel)
  )
  return Array.from(levels).sort()
}

const getStudentsByLevel = (level: number) => {
  return studentsWithAbsences.value.filter(
    s => selectedStudents.value.includes(s.id) && s.escalationLevel === level
  )
}

// Methods
const close = () => {
  emit('close')
}

const fetchStudentsWithAbsences = async () => {
  loading.value = true
  try {
    const startDate = getStartDate()
    const endDate = new Date().toISOString().split('T')[0]
    
    // Obtener estudiantes con ausencias usando el store
    const absentStudents = await attendanceStore.fetchTopAbsentStudentsByRange(
      startDate,
      endDate,
      100 // Obtener hasta 100 estudiantes
    )

    // Enriquecer con datos del estudiante y calcular escalación
    const enrichedStudents = await Promise.all(
      absentStudents.map(async (student) => {
        const studentData = studentsStore.getStudentById(student.studentId)
        if (!studentData) return null

        // Calcular nivel de escalación basado en ausencias
        const escalationLevel = getEscalationLevel(student.absences)
        
        // Obtener última ausencia (puedes mejorar esto con una consulta específica)
        const lastAbsence = new Date().toISOString().split('T')[0] // Placeholder

        return {
          id: student.studentId,
          nombre: studentData.nombre,
          apellido: studentData.apellido,
          instrumento: studentData.instrumento,
          tlf_madre: studentData.tlf_madre,
          tlf_padre: studentData.tlf_padre,
          absences: student.absences,
          escalationLevel,
          lastAbsence,
          attendanceRate: student.percentage
        }
      })
    )

    studentsWithAbsences.value = enrichedStudents.filter(Boolean)
    
    // Inicializar mensajes con plantillas por defecto
    initializeMessages()
    
  } catch (error) {
    console.error('Error fetching students with absences:', error)
  } finally {
    loading.value = false
  }
}

const getStartDate = () => {
  const now = new Date()
  if (selectedPeriod.value === 'week') {
    const startOfWeek = new Date(now)
    startOfWeek.setDate(now.getDate() - now.getDay() + 1) // Lunes
    return startOfWeek.toISOString().split('T')[0]
  } else if (selectedPeriod.value === 'month') {
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    return startOfMonth.toISOString().split('T')[0]
  }
  return now.toISOString().split('T')[0]
}

const getEscalationLevel = (absences: number): number => {
  if (absences === 1) return 1
  if (absences === 2) return 2
  if (absences === 3) return 3
  if (absences >= 4) return 4
  return 1
}

const getEscalationLevelClass = (level: number) => {
  const classes = {
    1: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300',
    2: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300',
    3: 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-300',
    4: 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300'
  }
  return classes[level as keyof typeof classes] || classes[1]
}

const getLevelDescription = (level: number) => {
  const descriptions = {
    1: 'Recordatorio amable',
    2: 'Tono disciplinario',
    3: 'Solicitud de explicación',
    4: 'Citación obligatoria'
  }
  return descriptions[level as keyof typeof descriptions] || 'Nivel desconocido'
}

const initializeMessages = () => {
  // Inicializar mensajes con plantillas por defecto
  MESSAGE_TEMPLATES.forEach(template => {
    if (template.level) {
      customMessages.value[template.level] = template.content
    }
  })
}

const toggleStudent = (studentId: string) => {
  const index = selectedStudents.value.indexOf(studentId)
  if (index > -1) {
    selectedStudents.value.splice(index, 1)
  } else {
    selectedStudents.value.push(studentId)
  }
}

const selectAll = () => {
  selectedStudents.value = filteredStudents.value.map(s => s.id)
}

const deselectAll = () => {
  selectedStudents.value = []
}

const getTotalPhoneNumbers = () => {
  return studentsWithAbsences.value
    .filter(s => selectedStudents.value.includes(s.id))
    .reduce((total, student) => {
      let phones = 0
      if (student.tlf_madre) phones++
      if (student.tlf_padre) phones++
      return total + phones
    }, 0)
}

const getTotalMessages = () => {
  return getTotalPhoneNumbers()
}

const insertVariable = (level: number, variable: string) => {
  const textarea = document.querySelector(`textarea`) as HTMLTextAreaElement
  if (textarea) {
    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const text = customMessages.value[level] || ''
    customMessages.value[level] = text.substring(0, start) + variable + text.substring(end)
    markAsModified(level)
  }
}

const markAsModified = (level: number) => {
  modifiedLevels.value.add(level)
}

const resetToTemplate = (level: number) => {
  const template = MESSAGE_TEMPLATES.find(t => t.level === level)
  if (template) {
    customMessages.value[level] = template.content
    modifiedLevels.value.delete(level)
  }
}

const saveAsTemplate = (level: number) => {
  // Aquí puedes implementar la lógica para guardar la plantilla personalizada
  // Por ejemplo, en localStorage o enviando al backend
  localStorage.setItem(`whatsapp_template_level_${level}`, customMessages.value[level])
  alert(`Plantilla guardada para nivel ${level}`)
}

const previewMessage = (level: number) => {
  const students = getStudentsByLevel(level)
  if (students.length > 0) {
    const sampleStudent = students[0]
    let preview = customMessages.value[level] || ''
    
    // Reemplazar variables
    preview = preview
      .replace(/{studentName}/g, `${sampleStudent.nombre} ${sampleStudent.apellido}`)
      .replace(/{date}/g, new Date().toLocaleDateString('es-ES'))
      .replace(/{absenceCount}/g, sampleStudent.absences.toString())
      .replace(/{academyName}/g, 'Academia Musical El Sistema')
    
    previewContent.value = preview
    showPreview.value = true
  }
}

const formatLastAbsence = (dateStr: string) => {
  const date = new Date(dateStr)
  return date.toLocaleDateString('es-ES', { 
    day: '2-digit', 
    month: '2-digit' 
  })
}

const sendMessages = async () => {
  if (selectedStudents.value.length === 0) return

  const confirmMessage = `¿Enviar mensajes de WhatsApp a ${selectedStudents.value.length} estudiantes (${getTotalPhoneNumbers()} números)?`
  
  if (!confirm(confirmMessage)) return

  sending.value = true
  try {
    // Agrupar estudiantes por nivel de escalación
    const studentsByLevel = {}
    
    selectedStudents.value.forEach(studentId => {
      const student = studentsWithAbsences.value.find(s => s.id === studentId)
      if (student) {
        const level = student.escalationLevel
        if (!studentsByLevel[level]) {
          studentsByLevel[level] = []
        }
        studentsByLevel[level].push(studentId)
      }
    })

    // Enviar mensajes por cada nivel
    let totalSuccess = 0
    let totalFailed = 0
    const allMessages = []

    for (const [level, studentIds] of Object.entries(studentsByLevel)) {
      // Aquí podrías modificar la función notifyUnexcusedAbsences para aceptar mensajes personalizados
      // Por ahora usamos la función existente
      const result = await notifyUnexcusedAbsences(studentIds as string[])
      totalSuccess += result.success
      totalFailed += result.failed
      allMessages.push(...result.messages)
    }

    const finalResult = {
      success: totalSuccess,
      failed: totalFailed,
      messages: allMessages
    }

    emit('messagesSent', finalResult)
    
    alert(`✅ Mensajes enviados!\n\nExitosos: ${totalSuccess}\nFallidos: ${totalFailed}`)
    
    if (totalSuccess > 0) {
      close()
    }

  } catch (error) {
    console.error('Error sending messages:', error)
    alert('❌ Error enviando mensajes')
  } finally {
    sending.value = false
  }
}

// Lifecycle
onMounted(async () => {
  await studentsStore.fetchStudents()
  await fetchStudentsWithAbsences()
})
</script>

<style scoped>
/* Estilos adicionales si es necesario */
.animate-spin {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}
</style>
