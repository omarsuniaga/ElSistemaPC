<!-- Vista: Reporte de Asistencia Diaria -->
<template>
  <div class="min-h-screen bg-gray-50 dark:bg-gray-900 mb-16">
    <!-- Encabezado de la página -->
    <div class="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex items-center justify-between py-6">
          <div class="flex items-center space-x-4">
      
            <div>
              <h1 class="text-2xl font-bold text-gray-900 dark:text-white">
                📊 Reporte de Asistencia Diaria
              </h1>
              <p class="text-sm text-gray-600 dark:text-gray-400">
                {{ formatDisplayDate(selectedDate) }}
              </p>
            </div>
          </div>

          <!-- Selector de fecha -->
          <div class="flex items-center space-x-4">
            <input
              v-model="selectedDate"
              type="date"
              class="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              @change="loadAttendanceData"
            />
            <button
              :disabled="loading"
              class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
              @click="refreshData"
            >
              <ArrowPathIcon v-if="loading" class="h-4 w-4 animate-spin" />
              <span v-else>🔄 Actualizar</span>
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Contenido principal -->
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <!-- Estado de carga -->
      <div v-if="loading" class="flex items-center justify-center py-12">
        <div class="text-center">
          <ArrowPathIcon class="h-8 w-8 animate-spin text-blue-600 mx-auto mb-4" />
          <p class="text-gray-600 dark:text-gray-400">Cargando datos de asistencia...</p>
        </div>
      </div>

      <!-- No hay datos -->
      <div v-else-if="!hasAttendanceData" class="text-center py-12">
        <div class="text-gray-500 dark:text-gray-400">
          <ExclamationTriangleIcon class="h-12 w-12 mx-auto mb-4" />
          <h3 class="text-lg font-medium mb-2">Sin registros de asistencia</h3>
          <p class="text-sm">No se encontraron registros de asistencia para esta fecha.</p>
        </div>
      </div>

      <!-- Dashboard con datos -->
      <div v-else class="space-y-8">
        <!-- Resumen superior - Tarjetas con contadores -->
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div
            class="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700"
          >
            <div class="flex items-center">
              <div class="flex-shrink-0">
                <div
                  class="w-10 h-10 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center"
                >
                  <span class="text-blue-600 dark:text-blue-400 text-xl">📊</span>
                </div>
              </div>
              <div class="ml-4">
                <p class="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Total Registrados Hoy
                </p>
                <p class="text-2xl font-bold text-gray-900 dark:text-white">
                  {{ attendanceSummary.total }}
                </p>
              </div>
            </div>
          </div>

          <div
            class="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700"
          >
            <div class="flex items-center">
              <div class="flex-shrink-0">
                <div
                  class="w-10 h-10 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center"
                >
                  <span class="text-green-600 dark:text-green-400 text-xl">✅</span>
                </div>
              </div>
              <div class="ml-4">
                <p class="text-sm font-medium text-gray-600 dark:text-gray-400">Presentes</p>
                <p class="text-2xl font-bold text-green-600 dark:text-green-400">
                  {{ attendanceSummary.presentes }}
                </p>
              </div>
            </div>
          </div>

          <div
            class="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700"
          >
            <div class="flex items-center">
              <div class="flex-shrink-0">
                <div
                  class="w-10 h-10 bg-red-100 dark:bg-red-900 rounded-lg flex items-center justify-center"
                >
                  <span class="text-red-600 dark:text-red-400 text-xl">❌</span>
                </div>
              </div>
              <div class="ml-4">
                <p class="text-sm font-medium text-gray-600 dark:text-gray-400">Ausentes (Total)</p>
                <p class="text-2xl font-bold text-red-600 dark:text-red-400">
                  {{ attendanceSummary.ausentes }}
                </p>
              </div>
            </div>
          </div>

          <div
            class="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700"
          >
            <div class="flex items-center">
              <div class="flex-shrink-0">
                <div
                  class="w-10 h-10 bg-yellow-100 dark:bg-yellow-900 rounded-lg flex items-center justify-center"
                >
                  <span class="text-yellow-600 dark:text-yellow-400 text-xl">⏰</span>
                </div>
              </div>
              <div class="ml-4">
                <p class="text-sm font-medium text-gray-600 dark:text-gray-400">Llegadas Tarde</p>
                <p class="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
                  {{ attendanceSummary.tarde }}
                </p>
              </div>
            </div>
          </div>
        </div>

        <!-- Sección 1: Acciones de Notificación Masiva -->
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <!-- Grupo "Ausencias sin Justificar" - PRIORITARIO -->
          <div
            class="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-red-200 dark:border-red-700 ring-2 ring-red-100 dark:ring-red-900/50"
          >
            <div
              class="p-6 border-b border-red-200 dark:border-red-700 bg-red-50 dark:bg-red-900/20"
            >
              <h3 class="text-lg font-medium text-gray-900 dark:text-white flex items-center">
                <span class="text-red-500 mr-2">🚨</span>
                Ausencias sin Justificar
                <span
                  class="ml-2 px-2 py-1 text-xs bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200 rounded-full"
                >
                  {{ unjustifiedAbsences.length }}
                </span>
              </h3>
            </div>
            <div class="p-6">
              <div
                v-if="unjustifiedAbsences.length === 0"
                class="text-center py-8 text-gray-500 dark:text-gray-400"
              >
                <CheckCircleIcon class="h-8 w-8 mx-auto mb-2 text-green-500" />
                <p>No hay ausencias sin justificar hoy</p>
                <p class="text-xs mt-1">¡Excelente asistencia!</p>
              </div>
              <div v-else>
                <!-- Lista de estudiantes ausentes sin justificar -->
                <div class="space-y-2 mb-6 max-h-48 overflow-y-auto">
                  <div
                    v-for="student in unjustifiedAbsences"
                    :key="student.id"
                    class="flex items-center justify-between p-3 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-100 dark:border-red-800"
                  >
                    <div class="flex items-center space-x-3">
                      <div
                        class="w-8 h-8 bg-red-100 dark:bg-red-800 rounded-full flex items-center justify-center"
                      >
                        <span class="text-red-600 dark:text-red-400 text-sm">🚨</span>
                      </div>
                      <div>
                        <p class="font-medium text-gray-900 dark:text-white">
                          {{ student.name }}
                        </p>
                        <p class="text-sm text-gray-600 dark:text-gray-400">
                          {{ student.className }}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <!-- Botón de NOTIFICACIÓN INTELIGENTE CON ESCALACIÓN -->
                <div class="bg-gradient-to-r from-red-500 to-orange-500 p-4 rounded-lg mb-4">
                  <div class="text-center mb-3">
                    <h4 class="text-white font-semibold text-sm">🧠 Notificación Inteligente</h4>
                    <p class="text-red-100 text-xs">
                      Sistema automático de escalación por historial semanal
                    </p>
                  </div>

                  <button
                    :disabled="sendingNotifications"
                    class="w-full bg-white hover:bg-gray-50 disabled:opacity-50 text-red-600 px-4 py-3 rounded-lg font-semibold transition-all duration-200 shadow-lg hover:shadow-xl"
                    @click="openWhatsAppModalForAbsences"
                  >
                    <span v-if="sendingNotifications" class="flex items-center justify-center">
                      <ArrowPathIcon class="h-4 w-4 animate-spin mr-2" />
                      Configurando...
                    </span>
                    <span v-else class="flex items-center justify-center">
                      <span class="text-lg mr-2">📱</span>
                      Configurar Notificaciones WhatsApp
                      <span class="text-xs ml-2 bg-red-100 text-red-700 px-2 py-1 rounded"
                        >NUEVO</span
                      >
                    </span>
                  </button>
                </div>

                <!-- Información del sistema de escalación -->
                <div
                  class="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg border border-blue-200 dark:border-blue-800"
                >
                  <div class="flex items-start space-x-2">
                    <span class="text-blue-500 text-sm">ℹ️</span>
                    <div class="text-xs text-blue-700 dark:text-blue-300">
                      <p class="font-medium mb-1">Sistema de Escalación Automática:</p>
                      <ul class="space-y-1 text-blue-600 dark:text-blue-400">
                        <li>• 1ª ausencia semanal: Recordatorio amable</li>
                        <li>• 2ª ausencia: Tono disciplinario</li>
                        <li>• 3ª ausencia: Solicitud de explicación</li>
                        <li>• 4+ ausencias: Citación obligatoria</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Grupo "Llegadas Tarde" -->
          <div
            class="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700"
          >
            <div class="p-6 border-b border-200 dark:border-gray-700">
              <h3 class="text-lg font-medium text-gray-900 dark:text-white flex items-center">
                <span class="text-yellow-500 mr-2">⏰</span>
                Estudiantes con Tardanza
                <span
                  class="ml-2 px-2 py-1 text-xs bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200 rounded-full"
                >
                  {{ lateStudents.length }}
                </span>
              </h3>
            </div>
            <div class="p-6">
              <div
                v-if="lateStudents.length === 0"
                class="text-center py-8 text-gray-500 dark:text-gray-400"
              >
                <ClockIcon class="h-8 w-8 mx-auto mb-2" />
                <p>No hay tardanzas registradas hoy</p>
              </div>
              <div v-else>
                <!-- Lista de estudiantes tardíos -->
                <div class="space-y-2 mb-4 max-h-48 overflow-y-auto">
                  <div
                    v-for="student in lateStudents"
                    :key="student.id"
                    class="flex items-center justify-between p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg"
                  >
                    <div class="flex items-center space-x-3">
                      <div
                        class="w-8 h-8 bg-yellow-100 dark:bg-yellow-800 rounded-full flex items-center justify-center"
                      >
                        <span class="text-yellow-600 dark:text-yellow-400 text-sm">⏰</span>
                      </div>
                      <div>
                        <p class="font-medium text-gray-900 dark:text-white">
                          {{ student.name }}
                        </p>
                        <p class="text-sm text-gray-600 dark:text-gray-400">
                          {{ student.className }}
                        </p>
                      </div>
                    </div>
                    <span class="text-xs text-yellow-600 dark:text-yellow-400">
                      {{ formatTime(student.time) }}
                    </span>
                  </div>
                </div>

                <!-- Botón de acción -->
                <button
                  :disabled="sendingNotifications"
                  class="w-full bg-yellow-600 hover:bg-yellow-700 disabled:opacity-50 text-white px-4 py-3 rounded-lg font-medium transition-colors"
                  @click="notifyLateStudents"
                >
                  <span v-if="sendingNotifications" class="flex items-center justify-center">
                    <ArrowPathIcon class="h-4 w-4 animate-spin mr-2" />
                    Enviando notificaciones...
                  </span>
                  <span v-else class="flex items-center justify-center">
                    📱 Notificar a Padres por Tardanza
                  </span>
                </button>
              </div>
            </div>
          </div>

          <!-- Grupo "Ausencias Justificadas" -->
          <div
            class="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700"
          >
            <div class="p-6 border-b border-gray-200 dark:border-gray-700">
              <h3 class="text-lg font-medium text-gray-900 dark:text-white flex items-center">
                <span class="text-blue-500 mr-2">📝</span>
                Ausencias Justificadas
                <span
                  class="ml-2 px-2 py-1 text-xs bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-full"
                >
                  {{ justifiedAbsences.length }}
                </span>
              </h3>
            </div>
            <div class="p-6">
              <div
                v-if="justifiedAbsences.length === 0"
                class="text-center py-8 text-gray-500 dark:text-gray-400"
              >
                <DocumentCheckIcon class="h-8 w-8 mx-auto mb-2" />
                <p>No hay ausencias justificadas hoy</p>
              </div>
              <div v-else>
                <!-- Lista de ausencias justificadas -->
                <div class="space-y-2 mb-4 max-h-48 overflow-y-auto">
                  <div
                    v-for="student in justifiedAbsences"
                    :key="student.id"
                    class="flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg"
                  >
                    <div class="flex items-center space-x-3">
                      <div
                        class="w-8 h-8 bg-blue-100 dark:bg-blue-800 rounded-full flex items-center justify-center"
                      >
                        <span class="text-blue-600 dark:text-blue-400 text-sm">📝</span>
                      </div>
                      <div>
                        <p class="font-medium text-gray-900 dark:text-white">
                          {{ student.name }}
                        </p>
                        <p class="text-sm text-gray-600 dark:text-gray-400">
                          {{ student.className }}
                        </p>
                        <p v-if="student.reason" class="text-xs text-blue-600 dark:text-blue-400">
                          Motivo: {{ student.reason }}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <!-- Botón de acción -->
                <button
                  :disabled="sendingNotifications"
                  class="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-4 py-3 rounded-lg font-medium transition-colors"
                  @click="notifyJustifiedAbsences"
                >
                  <span v-if="sendingNotifications" class="flex items-center justify-center">
                    <ArrowPathIcon class="h-4 w-4 animate-spin mr-2" />
                    Enviando notificaciones...
                  </span>
                  <span v-else class="flex items-center justify-center">
                    📞 Notificar Próxima Actividad
                  </span>
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- Sección 2: Listado Detallado de Asistencias del Día -->
        <div
          class="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700"
        >
          <div class="p-6 border-b border-gray-200 dark:border-gray-700">
            <div class="flex items-center justify-between">
              <h3 class="text-lg font-medium text-gray-900 dark:text-white">
                📋 Listado Detallado de Asistencias
              </h3>

              <!-- Filtros y búsqueda -->
              <div class="flex items-center space-x-4">
                <div class="relative">
                  <MagnifyingGlassIcon class="h-4 w-4 absolute left-3 top-3.5 text-gray-400" />
                  <input
                    v-model="searchTerm"
                    type="text"
                    placeholder="Buscar estudiante..."
                    class="pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                  />
                </div>
                <select
                  v-model="statusFilter"
                  class="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                >
                  <option value="">Todos los estados</option>
                  <option value="Presente">Presente</option>
                  <option value="Ausente">Ausente</option>
                  <option value="Tardanza">Tardanza</option>
                  <option value="Justificado">Justificado</option>
                </select>
              </div>
            </div>
          </div>

          <!-- Tabla de asistencias -->
          <div class="overflow-x-auto">
            <table class="w-full">
              <thead class="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th
                    class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
                  >
                    Estudiante
                  </th>
                  <th
                    class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
                  >
                    Clase
                  </th>
                  <th
                    class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
                  >
                    Estado
                  </th>
                  <th
                    class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
                  >
                    Hora
                  </th>
                  <th
                    class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
                  >
                    Observaciones
                  </th>
                </tr>
              </thead>
              <tbody
                class="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700"
              >
                <tr v-for="record in filteredAttendanceRecords" :key="record.id">
                  <td class="px-6 py-4 whitespace-nowrap">
                    <div class="flex items-center">
                      <div
                        class="w-10 h-10 bg-gray-200 dark:bg-gray-600 rounded-full flex items-center justify-center"
                      >
                        <span class="text-gray-600 dark:text-gray-400 text-sm font-medium">
                          {{ getInitials(record.studentName) }}
                        </span>
                      </div>
                      <div class="ml-4">
                        <div class="text-sm font-medium text-gray-900 dark:text-white">
                          {{ record.studentName }}
                        </div>
                        <div class="text-sm text-gray-500 dark:text-gray-400">
                          ID: {{ record.studentId }}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap">
                    <div class="text-sm text-gray-900 dark:text-white">{{ record.className }}</div>
                    <div class="text-sm text-gray-500 dark:text-gray-400">
                      {{ record.teacherName }}
                    </div>
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap">
                    <span
                      :class="getStatusBadgeClasses(record.status)"
                      class="px-2 py-1 text-xs font-medium rounded-full"
                    >
                      {{ getStatusIcon(record.status) }} {{ record.status }}
                    </span>
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    {{ formatTime(record.time) }}
                  </td>
                  <td class="px-6 py-4">
                    <div class="text-sm text-gray-900 dark:text-white">
                      {{ record.observations || "—" }}
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>

    <!-- Modal de notificaciones WhatsApp -->
    <WhatsAppNotificacionesModal
      :is-visible="showWhatsAppModal"
      :report-data="reportDataForModal"
      :initial-tab="modalInitialTab"
      @close="showWhatsAppModal = false"
      @messages-sent="handleWhatsAppMessagesSent"
    />
  </div>
</template>

<script setup lang="ts">
import {ref, computed, onMounted} from "vue"
import {useRouter} from "vue-router"
import {
  ArrowPathIcon,
  CheckCircleIcon,
  ClockIcon,
  DocumentCheckIcon,
  ExclamationTriangleIcon,
  MagnifyingGlassIcon,
} from "@heroicons/vue/24/outline"

// Componentes
import WhatsAppNotificacionesModal from "../../../components/WhatsAppNotificacionesModal.vue"

// Servicios
import {getDailyAttendanceReport} from "../../../services/dailyAttendanceService";
import {
  notifyLateStudents as sendLateNotifications,
  notifyJustifiedAbsences as sendJustifiedNotifications,
  notifyUnexcusedAbsences as sendUnexcusedNotifications,
} from "../../../services/attendanceNotifications"

// Interfaces y tipos
interface AttendanceRecord {
  id: string
  studentId: string
  studentName: string
  className: string
  teacherName: string
  status: "Presente" | "Ausente" | "Tardanza" | "Justificado"
  time: string
  observations: string
  reason?: string
}

interface AttendanceSummary {
  total: number
  presentes: number
  ausentes: number
  tarde: number
  justificados: number
}

interface _StudentForNotification {
  id: string
  studentId: string
  name: string
  className: string
  time?: string
}

// Composables y servicios
const _router = useRouter()

// Estados reactivos
const loading = ref(false)
const sendingNotifications = ref(false)
const selectedDate = ref(new Date().toISOString().split("T")[0])
const searchTerm = ref("")
const statusFilter = ref("")
const showWhatsAppModal = ref(false)

// 📊 Estados para el modal de WhatsApp
const modalInitialTab = ref<"ausentes" | "tarde" | "justificado">("ausentes")
const reportDataForModal = ref<any>(null)

// Datos de asistencia
const attendanceData = ref<AttendanceRecord[]>([])
const attendanceSummary = ref<AttendanceSummary>({
  total: 0,
  presentes: 0,
  ausentes: 0,
  tarde: 0,
  justificados: 0,
})

// Computed properties
const hasAttendanceData = computed(() => attendanceData.value.length > 0)

const lateStudents = computed(() => {
  return attendanceData.value
    .filter((record) => record.status === "Tardanza")
    .map((record) => ({
      id: record.id,
      studentId: record.studentId,
      name: record.studentName,
      className: record.className,
      time: record.time,
    }))
})

const justifiedAbsences = computed(() => {
  return attendanceData.value
    .filter((record) => record.status === "Justificado")
    .map((record) => ({
      id: record.id,
      studentId: record.studentId,
      name: record.studentName,
      className: record.className,
      reason: record.reason,
    }))
})

const unjustifiedAbsences = computed(() => {
  return attendanceData.value
    .filter((record) => record.status === "Ausente")
    .map((record) => ({
      id: record.id,
      studentId: record.studentId,
      name: record.studentName,
      className: record.className,
    }))
})

const filteredAttendanceRecords = computed(() => {
  let filtered = attendanceData.value

  if (searchTerm.value) {
    const term = searchTerm.value.toLowerCase()
    filtered = filtered.filter(
      (record) =>
        record.studentName.toLowerCase().includes(term) ||
        record.className.toLowerCase().includes(term)
    )
  }

  if (statusFilter.value) {
    filtered = filtered.filter((record) => record.status === statusFilter.value)
  }

  return filtered
})

// Métodos
const formatDisplayDate = (dateString: string): string => {
  const date = new Date(dateString)
  return date.toLocaleDateString("es-ES", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  })
}

const formatTime = (time: string): string => {
  if (!time) return "—"
  return new Date(time).toLocaleTimeString("es-ES", {
    hour: "2-digit",
    minute: "2-digit",
  })
}

const getInitials = (name: string): string => {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2)
}

const getStatusIcon = (status: string): string => {
  switch (status) {
    case "Presente":
      return "✅"
    case "Ausente":
      return "❌"
    case "Tardanza":
      return "⏰"
    case "Justificado":
      return "📝"
    default:
      return "❓"
  }
}

const getStatusBadgeClasses = (status: string): string => {
  switch (status) {
    case "Presente":
      return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
    case "Ausente":
      return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
    case "Tardanza":
      return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
    case "Justificado":
      return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
    default:
      return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200"
  }
}

const loadAttendanceData = async (): Promise<void> => {
  loading.value = true
  try {
    console.log(`📊 Cargando datos de asistencia para ${selectedDate.value}`)

    const report = await getDailyAttendanceReport(selectedDate.value)

    if (report.success) {
      attendanceData.value = report.records
      attendanceSummary.value = report.summary

      console.log(`✅ Datos cargados: ${report.records.length} registros`)
    } else {
      console.error("❌ Error obteniendo reporte:", report.error)
      attendanceData.value = []
      attendanceSummary.value = {
        total: 0,
        presentes: 0,
        ausentes: 0,
        tarde: 0,
        justificados: 0,
      }
    }
  } catch (error) {
    console.error("Error cargando datos de asistencia:", error)
    attendanceData.value = []
    attendanceSummary.value = {
      total: 0,
      presentes: 0,
      ausentes: 0,
      tarde: 0,
      justificados: 0,
    }
  } finally {
    loading.value = false
  }
}

const refreshData = (): void => {
  loadAttendanceData()
}

const openWhatsAppModal = (): void => {
  showWhatsAppModal.value = true
}

// 📱 Función para abrir el modal con datos de ausencias sin justificar
const openWhatsAppModalForAbsences = (): void => {
  console.log("📱 [Reporte Diario] Abriendo modal para ausencias sin justificar:", unjustifiedAbsences.value)
  
  reportDataForModal.value = {
    unjustifiedAbsences: unjustifiedAbsences.value,
    selectedDate: selectedDate.value,
  }
  modalInitialTab.value = "ausentes"
  showWhatsAppModal.value = true
}

const handleWhatsAppMessagesSent = (result: {
  success: number
  failed: number
  messages: any[]
}): void => {
  console.log("📱 Mensajes enviados desde reporte diario:", result)
  
  // Mostrar notificación de éxito
  alert(`✅ Mensajes enviados!\n\nExitosos: ${result.success}\nFallidos: ${result.failed}`)
  
  // Cerrar modal
  showWhatsAppModal.value = false
  
  // Opcionalmente recargar datos
  if (result.success > 0) {
    loadAttendanceData()
  }
}

const notifyLateStudents = async (): Promise<void> => {
  if (lateStudents.value.length === 0) {
    alert("⚠️ No hay estudiantes con tardanza para notificar.")
    return
  }

  if (!confirm(`¿Enviar notificaciones de tardanza a ${lateStudents.value.length} estudiantes?`)) {
    return
  }

  sendingNotifications.value = true
  try {
    const studentIds = lateStudents.value.map((s) => s.studentId)
    const result = await sendLateNotifications(studentIds)

    alert(
      `✅ Notificaciones enviadas!\n\n` +
        `📱 Exitosas: ${result.success}\n` +
        `❌ Fallidas: ${result.failed}\n\n` +
        `Se han enviado mensajes a los representantes sobre las tardanzas.`
    )
  } catch (error) {
    console.error("Error enviando notificaciones:", error)
    alert(
      `❌ Error enviando notificaciones: ${error instanceof Error ? error.message : "Error desconocido"}`
    )
  } finally {
    sendingNotifications.value = false
  }
}

const notifyJustifiedAbsences = async (): Promise<void> => {
  if (justifiedAbsences.value.length === 0) {
    alert("⚠️ No hay ausencias justificadas para notificar.")
    return
  }

  if (
    !confirm(
      `¿Enviar notificaciones sobre próximas actividades a ${justifiedAbsences.value.length} estudiantes?`
    )
  ) {
    return
  }

  sendingNotifications.value = true
  try {
    const studentIds = justifiedAbsences.value.map((s) => s.studentId)
    const result = await sendJustifiedNotifications(studentIds)

    alert(
      `✅ Notificaciones enviadas!\n\n` +
        `📱 Exitosas: ${result.success}\n` +
        `❌ Fallidas: ${result.failed}\n\n` +
        `Se han enviado recordatorios de próximas actividades.`
    )
  } catch (error) {
    console.error("Error enviando notificaciones:", error)
    alert(
      `❌ Error enviando notificaciones: ${error instanceof Error ? error.message : "Error desconocido"}`
    )
  } finally {
    sendingNotifications.value = false
  }
}

// 🎯 MÉTODO PRINCIPAL: Notificación Inteligente con Escalación Automática
const notifyAbsentStudentsWithEscalation = async (): Promise<void> => {
  if (unjustifiedAbsences.value.length === 0) {
    alert("✅ ¡Excelente! No hay estudiantes ausentes sin justificar hoy.")
    return
  }

  const confirmMessage =
    `🧠 Notificación Inteligente con Escalación Automática\n\n` +
    `📊 Estudiantes ausentes sin justificar: ${unjustifiedAbsences.value.length}\n\n` +
    `El sistema analizará automáticamente el historial semanal de cada estudiante y aplicará el nivel de escalación apropiado:\n\n` +
    `🟢 1ª ausencia: Recordatorio amable\n` +
    `🟡 2ª ausencia: Tono disciplinario\n` +
    `🟠 3ª ausencia: Solicitud de explicación\n` +
    `🔴 4+ ausencias: Citación obligatoria\n\n` +
    `¿Proceder con el análisis y envío automático?`

  if (!confirm(confirmMessage)) {
    return
  }

  sendingNotifications.value = true
  try {
    // Obtener IDs de estudiantes ausentes sin justificar
    const absentStudentIds = unjustifiedAbsences.value.map((student) => student.studentId)

    // Llamar al sistema inteligente de escalación
    const result = await sendUnexcusedNotifications(absentStudentIds)

    // Mostrar resultado detallado
    alert(
      `🎯 ¡Notificación Inteligente Completada!\n\n` +
        `📱 Total procesados: ${absentStudentIds.length}\n` +
        `✅ Enviados exitosamente: ${result.success}\n` +
        `❌ Fallos en envío: ${result.failed}\n\n` +
        `🧠 El sistema aplicó automáticamente la escalación apropiada según el historial semanal de cada estudiante.\n\n` +
        `Los padres recibieron mensajes personalizados con el tono correspondiente a la frecuencia de ausencias.`
    )
  } catch (error) {
    console.error("Error en notificación inteligente:", error)
    alert(
      `❌ Error en el sistema de notificación inteligente:\n\n${error instanceof Error ? error.message : "Error desconocido"}\n\nPor favor, intente nuevamente o contacte al soporte técnico.`
    )
  } finally {
    sendingNotifications.value = false
  }
}

// Lifecycle
onMounted(() => {
  loadAttendanceData()
})
</script>

<style scoped>
/* Estilos adicionales si se necesitan */
</style>
