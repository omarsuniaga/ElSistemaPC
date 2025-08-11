<template>
  <div
    v-if="isVisible"
    class="fixed inset-0 bg-gray-600 bg-opacity-50 dark:bg-gray-900 dark:bg-opacity-80 overflow-y-auto h-full w-full z-50"
    @click.self="$emit('close')"
  >
    <div class="relative top-20 mx-auto p-5 border w-11/12 max-w-4xl shadow-lg rounded-md bg-white dark:bg-gray-800">
      <!-- Header -->
      <div class="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
        <div class="flex items-center space-x-3">
          <div class="w-10 h-10 bg-yellow-100 dark:bg-yellow-900 rounded-lg flex items-center justify-center">
            <span class="text-yellow-600 dark:text-yellow-400 text-xl">⏰</span>
          </div>
          <div>
            <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
              Notificar Tardanzas a Padres
            </h3>
            <p class="text-sm text-gray-600 dark:text-gray-400">
              {{ selectedStudents.length }} de {{ students.length }} estudiantes seleccionados
            </p>
          </div>
        </div>
        <button
          @click="$emit('close')"
          class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
        >
          <XMarkIcon class="h-6 w-6" />
        </button>
      </div>

      <!-- WhatsApp Service Status -->
      <div class="p-6 border-b border-gray-200 dark:border-gray-700">
        <div class="flex items-center justify-between">
          <div class="flex items-center space-x-3">
            <div
              :class="[
                'w-3 h-3 rounded-full',
                whatsappStatus.isActive ? 'bg-green-500' : 'bg-red-500'
              ]"
            ></div>
            <span class="text-sm font-medium text-gray-900 dark:text-white">
              Estado del Servicio WhatsApp
            </span>
            <span
              :class="[
                'px-2 py-1 text-xs rounded-full',
                whatsappStatus.isActive 
                  ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                  : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
              ]"
            >
              {{ whatsappStatus.isActive ? 'Activo' : 'Inactivo' }}
            </span>
          </div>
          
          <button
            v-if="!whatsappStatus.isActive"
            @click="activateWhatsAppService"
            :disabled="activatingService"
            class="px-4 py-2 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white rounded-lg text-sm font-medium transition-colors"
          >
            <span v-if="activatingService" class="flex items-center">
              <ArrowPathIcon class="h-4 w-4 animate-spin mr-2" />
              Activando...
            </span>
            <span v-else>Activar Servicio</span>
          </button>
        </div>
      </div>

      <!-- Students Selection -->
      <div class="p-6 border-b border-gray-200 dark:border-gray-700">
        <div class="flex items-center justify-between mb-4">
          <h4 class="text-md font-medium text-gray-900 dark:text-white">
            Estudiantes con Tardanza
          </h4>
          <div class="flex items-center space-x-2">
            <button
              @click="selectAll"
              class="text-sm text-blue-600 dark:text-blue-400 hover:underline"
            >
              Seleccionar todos
            </button>
            <span class="text-gray-300">|</span>
            <button
              @click="deselectAll"
              class="text-sm text-gray-600 dark:text-gray-400 hover:underline"
            >
              Deseleccionar todos
            </button>
          </div>
        </div>

        <!-- Loading indicator -->
        <div v-if="loadingHistory" class="flex items-center justify-center py-8">
          <div class="text-center">
            <ArrowPathIcon class="h-6 w-6 animate-spin text-blue-600 mx-auto mb-2" />
            <p class="text-sm text-gray-600 dark:text-gray-400">Cargando historial de tardanzas...</p>
          </div>
        </div>

        <div v-else class="space-y-3 max-h-64 overflow-y-auto">
          <div
            v-for="student in studentsWithRecurrence"
            :key="student.id"
            class="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-600 rounded-lg"
            :class="{
              'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-700': selectedStudents.includes(student.id)
            }"
          >
            <div class="flex items-center space-x-3">
              <input
                type="checkbox"
                :value="student.id"
                v-model="selectedStudents"
                class="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              
              <div class="flex-1">
                <div class="flex items-center space-x-3">
                  <div class="w-10 h-10 bg-yellow-100 dark:bg-yellow-800 rounded-full flex items-center justify-center">
                    <span class="text-yellow-600 dark:text-yellow-400 text-sm font-medium">
                      {{ getInitials(student.name) }}
                    </span>
                  </div>
                  <div>
                    <p class="font-medium text-gray-900 dark:text-white">
                      {{ student.name }}
                    </p>
                    <p class="text-sm text-gray-600 dark:text-gray-400">
                      {{ student.className }} - {{ formatTime(student.time) }}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <!-- Recurrence Information -->
            <div class="flex items-center space-x-4">
              <div class="text-right">
                <p class="text-sm font-medium text-gray-900 dark:text-white">
                  {{ student.recurrence.thisWeek }} tardanzas esta semana
                </p>
                <p class="text-xs text-gray-600 dark:text-gray-400">
                  {{ student.recurrence.thisMonth }} este mes
                </p>
              </div>
              
              <!-- Severity Badge -->
              <div
                :class="[
                  'px-3 py-1 rounded-full text-xs font-medium',
                  getSeverityBadgeClasses(student.recurrence.severity)
                ]"
              >
                {{ getSeverityLabel(student.recurrence.severity) }}
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Message Preview -->
      <div class="p-6 border-b border-gray-200 dark:border-gray-700">
        <h4 class="text-md font-medium text-gray-900 dark:text-white mb-4">
          Vista Previa del Mensaje
        </h4>
        
        <div class="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg mb-4">
          <div class="text-sm text-gray-700 dark:text-gray-300 mb-2">
            <strong>Ejemplo para estudiante con {{ selectedSeverityExample }} tardanza(s):</strong>
          </div>
          <div class="bg-white dark:bg-gray-800 p-3 rounded border border-gray-200 dark:border-gray-600">
            <p class="text-sm text-gray-800 dark:text-gray-200 whitespace-pre-line">{{ messagePreview }}</p>
          </div>
        </div>

        <div class="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
          <ExclamationTriangleIcon class="h-4 w-4" />
          <span>Los mensajes se personalizarán automáticamente según el historial de cada estudiante</span>
        </div>
      </div>

      <!-- Message Customization (Optional) -->
      <div class="p-6 border-b border-gray-200 dark:border-gray-700">
        <div class="flex items-center justify-between mb-4">
          <h4 class="text-md font-medium text-gray-900 dark:text-white">
            Personalizar Mensaje (Opcional)
          </h4>
          <button
            @click="showCustomMessage = !showCustomMessage"
            class="text-sm text-blue-600 dark:text-blue-400 hover:underline"
          >
            {{ showCustomMessage ? 'Usar mensajes predeterminados' : 'Personalizar mensaje' }}
          </button>
        </div>

        <div v-if="showCustomMessage" class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Mensaje personalizado:
            </label>
            <textarea
              v-model="customMessage"
              rows="4"
              class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              placeholder="Escriba su mensaje personalizado..."
            ></textarea>
          </div>
          
          <div class="text-sm text-gray-600 dark:text-gray-400">
            <p class="mb-1"><strong>Variables disponibles:</strong></p>
            <ul class="space-y-1 text-xs">
              <li>• <code>{ESTUDIANTE}</code> - Nombre del estudiante</li>
              <li>• <code>{CLASE}</code> - Nombre de la clase</li>
              <li>• <code>{HORA}</code> - Hora de llegada tarde</li>
              <li>• <code>{FECHA}</code> - Fecha de hoy</li>
              <li>• <code>{TARDANZAS_SEMANA}</code> - Tardanzas esta semana</li>
            </ul>
          </div>
        </div>
      </div>

      <!-- Actions -->
      <div class="p-6 bg-gray-50 dark:bg-gray-700">
        <div class="flex items-center justify-between">
          <div class="text-sm text-gray-600 dark:text-gray-400">
            <p v-if="selectedStudents.length === 0">Seleccione al menos un estudiante para continuar</p>
            <p v-else>
              Se enviarán {{ selectedStudents.length }} notificación(es) a los padres
            </p>
          </div>
          
          <div class="flex items-center space-x-3">
            <button
              @click="$emit('close')"
              class="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
            >
              Cancelar
            </button>
            
            <button
              @click="sendNotifications"
              :disabled="selectedStudents.length === 0 || !whatsappStatus.isActive || sendingMessages"
              class="px-6 py-2 bg-yellow-600 hover:bg-yellow-700 disabled:opacity-50 text-white rounded-lg font-medium transition-colors"
            >
              <span v-if="sendingMessages" class="flex items-center">
                <ArrowPathIcon class="h-4 w-4 animate-spin mr-2" />
                Enviando...
              </span>
              <span v-else class="flex items-center">
                <span class="mr-2">📱</span>
                Enviar Notificaciones
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import {
  XMarkIcon,
  ArrowPathIcon,
  ExclamationTriangleIcon,
} from '@heroicons/vue/24/outline'

// Servicios
import { 
  getBulkStudentLateHistory, 
  generateLateMessage,
  type IStudentLateHistory 
} from '../services/lateAttendanceService'

// Interfaces
interface LateStudent {
  id: string
  studentId: string
  name: string
  className: string
  time: string
  phone?: string
}

interface StudentWithRecurrence extends LateStudent {
  recurrence: IStudentLateHistory
}

interface WhatsAppStatus {
  isActive: boolean
  lastCheck: string
}

// Props
interface Props {
  isVisible: boolean
  students: LateStudent[]
}

// Emits
interface Emits {
  (e: 'close'): void
  (e: 'notifications-sent', result: { success: number; failed: number; messages: any[] }): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

// State
const selectedStudents = ref<string[]>([])
const whatsappStatus = ref<WhatsAppStatus>({
  isActive: false,
  lastCheck: ''
})
const activatingService = ref(false)
const sendingMessages = ref(false)
const showCustomMessage = ref(false)
const customMessage = ref('')
const loadingHistory = ref(false)
const studentHistories = ref<Record<string, IStudentLateHistory>>({});

// Computed
const studentsWithRecurrence = computed<StudentWithRecurrence[]>(() => {
  return props.students.map(student => ({
    ...student,
    recurrence: studentHistories.value[student.studentId] || {
      studentId: student.studentId,
      thisWeek: 1,
      thisMonth: 1,
      total: 1,
      recentDates: [],
      severity: 'low' as const
    }
  }))
})

const selectedSeverityExample = computed(() => {
  const severities = studentsWithRecurrence.value
    .filter(s => selectedStudents.value.includes(s.id))
    .map(s => s.recurrence.thisWeek)
  
  return severities.length > 0 ? Math.max(...severities) : 1
})

const messagePreview = computed(() => {
  if (studentsWithRecurrence.value.length === 0) return ''
  
  const exampleStudent = studentsWithRecurrence.value[0]
  const mockHistory = {
    ...exampleStudent.recurrence,
    thisWeek: selectedSeverityExample.value
  }
  
  return generateLateMessage(
    'Ejemplo Estudiante',
    exampleStudent.time,
    mockHistory,
    showCustomMessage.value ? customMessage.value : undefined,
  );
})

// Methods
const getInitials = (name: string): string => {
  return name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

const formatTime = (time: string): string => {
  if (!time) return '—'
  return new Date(time).toLocaleTimeString('es-ES', {
    hour: '2-digit',
    minute: '2-digit',
  })
}

const getSeverityBadgeClasses = (severity: string): string => {
  switch (severity) {
    case 'low':
      return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
    case 'medium':
      return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
    case 'high':
      return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200'
    case 'critical':
      return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
    default:
      return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
  }
}

const getSeverityLabel = (severity: string): string => {
  switch (severity) {
    case 'low': return 'Primera vez'
    case 'medium': return 'Recurrente'
    case 'high': return 'Frecuente'
    case 'critical': return 'Crítico'
    default: return 'Desconocido'
  }
}

const selectAll = (): void => {
  selectedStudents.value = props.students.map(s => s.id)
}

const deselectAll = (): void => {
  selectedStudents.value = []
}

const loadStudentHistories = async (): Promise<void> => {
  if (props.students.length === 0) return
  
  loadingHistory.value = true
  try {
    const studentIds = props.students.map(s => s.studentId)
    studentHistories.value = await getBulkStudentLateHistory(studentIds)
    console.log('📊 Historiales de tardanza cargados:', studentHistories.value)
  } catch (error) {
    console.error('Error loading student histories:', error)
  } finally {
    loadingHistory.value = false
  }
}

const checkWhatsAppStatus = async (): Promise<void> => {
  try {
    // TODO: Implement actual WhatsApp service status check
    // For now, simulating API call
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    whatsappStatus.value = {
      isActive: Math.random() > 0.3, // 70% chance of being active
      lastCheck: new Date().toISOString()
    }
  } catch (error) {
    console.error('Error checking WhatsApp status:', error)
    whatsappStatus.value.isActive = false
  }
}

const activateWhatsAppService = async (): Promise<void> => {
  activatingService.value = true
  
  try {
    // TODO: Implement actual WhatsApp service activation
    await new Promise(resolve => setTimeout(resolve, 2000))
    
    whatsappStatus.value.isActive = true
    alert('✅ Servicio WhatsApp activado correctamente')
  } catch (error) {
    console.error('Error activating WhatsApp service:', error)
    alert('❌ Error al activar el servicio WhatsApp')
  } finally {
    activatingService.value = false
  }
}

const sendNotifications = async (): Promise<void> => {
  if (selectedStudents.value.length === 0) return
  
  const confirmMessage = `¿Enviar notificaciones de tardanza a ${selectedStudents.value.length} estudiante(s)?`
  
  if (!confirm(confirmMessage)) return
  
  sendingMessages.value = true
  
  try {
    const selectedStudentData = studentsWithRecurrence.value.filter(
      s => selectedStudents.value.includes(s.id)
    )
    
    const results = []
    
    for (const student of selectedStudentData) {
      try {
        const message = generateLateMessage(
          student.name,
          student.time,
          student.recurrence,
          showCustomMessage.value ? customMessage.value : undefined,
        );
        
        // TODO: Implement actual WhatsApp API call
        console.log(`📱 Enviando mensaje a ${student.name}:`, message)
        await new Promise(resolve => setTimeout(resolve, 500))
        
        results.push({
          studentId: student.studentId,
          success: true,
          message
        })
      } catch (error) {
        results.push({
          studentId: student.studentId,
          success: false,
          error: error instanceof Error ? error.message : 'Error desconocido'
        })
      }
    }
    
    const successCount = results.filter(r => r.success).length
    const failedCount = results.filter(r => !r.success).length
    
    emit('notifications-sent', {
      success: successCount,
      failed: failedCount,
      messages: results
    })
    
    // Reset selections
    selectedStudents.value = []
    showCustomMessage.value = false
    customMessage.value = ''
    
  } catch (error) {
    console.error('Error sending notifications:', error)
    alert('❌ Error al enviar las notificaciones')
  } finally {
    sendingMessages.value = false
  }
}

// Watchers
watch(() => props.isVisible, (isVisible) => {
  if (isVisible) {
    checkWhatsAppStatus()
    loadStudentHistories()
    // Auto-select all students by default
    selectedStudents.value = props.students.map(s => s.id)
  } else {
    // Reset state when modal closes
    selectedStudents.value = []
    showCustomMessage.value = false
    customMessage.value = ''
  }
})

// Lifecycle
onMounted(() => {
  if (props.isVisible) {
    loadStudentHistories()
  }
})
</script>

<style scoped>
/* Add any additional styles if needed */
</style>
