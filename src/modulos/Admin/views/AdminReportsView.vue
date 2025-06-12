<template>
  <div class="min-h-screen bg-gray-50 dark:bg-gray-900">
    <!-- Header con navegación de fechas -->
    <header class="bg-white dark:bg-gray-800 shadow-lg border-b border-gray-200 dark:border-gray-700">
      <div class="px-6 py-4">
        <div class="flex items-center justify-between">
          <div>
            <h1 class="text-2xl font-bold text-gray-900 dark:text-white">
              Panel Director - Monitoreo de Clases
            </h1>
            <p class="text-gray-600 dark:text-gray-400 mt-1">
              {{ formatDate(selectedDate) }} - {{ getDayName(selectedDate) }}
            </p>
          </div>
          
          <!-- Controles de fecha -->
          <div class="flex items-center space-x-4">
            <div class="flex items-center space-x-2">
              <button 
                @click="goToPreviousDay"
                class="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                <ChevronLeftIcon class="w-5 h-5" />
              </button>
              
              <div class="text-center min-w-[120px]">
                <input 
                  type="date" 
                  v-model="selectedDateString"
                  @change="onDateChange"
                  class="bg-transparent text-sm font-medium text-gray-900 dark:text-white border-0 focus:ring-0 cursor-pointer"
                />
              </div>
              
              <button 
                @click="goToNextDay"
                class="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                <ChevronRightIcon class="w-5 h-5" />
              </button>
            </div>
            
            <button 
              @click="goToToday"
              class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
            >
              Hoy
            </button>
              <!-- Acceso directo a reporte semanal -->
            <button 
              @click="handleGenerateWeeklyReport"
              class="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
            >
              <DocumentArrowDownIcon class="w-4 h-4" />
              <span>Reporte Semanal</span>
            </button>
          </div>
        </div>
      </div>
    </header>

    <!-- Main Content -->
    <main class="p-6">
      <!-- KPIs del día -->
      <section class="mb-8">
        <div class="grid grid-cols-1 md:grid-cols-4 gap-6">
          <!-- Clases programadas -->
          <div class="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg">
            <div class="flex items-center">
              <div class="p-3 rounded-full bg-blue-100 dark:bg-blue-900/20">
                <AcademicCapIcon class="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div class="ml-4">
                <p class="text-sm font-medium text-gray-600 dark:text-gray-400">Clases Programadas</p>
                <p class="text-2xl font-bold text-gray-900 dark:text-white">{{ dayMetrics.scheduledClasses }}</p>
              </div>
            </div>
          </div>

          <!-- Maestros esperados -->
          <div class="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg">
            <div class="flex items-center">
              <div class="p-3 rounded-full bg-green-100 dark:bg-green-900/20">
                <UserIcon class="w-6 h-6 text-green-600 dark:text-green-400" />
              </div>
              <div class="ml-4">
                <p class="text-sm font-medium text-gray-600 dark:text-gray-400">Maestros Esperados</p>
                <p class="text-2xl font-bold text-gray-900 dark:text-white">{{ dayMetrics.expectedTeachers }}</p>
              </div>
            </div>
          </div>

          <!-- Estudiantes esperados -->
          <div class="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg">
            <div class="flex items-center">
              <div class="p-3 rounded-full bg-purple-100 dark:bg-purple-900/20">
                <UsersIcon class="w-6 h-6 text-purple-600 dark:text-purple-400" />
              </div>
              <div class="ml-4">
                <p class="text-sm font-medium text-gray-600 dark:text-gray-400">Estudiantes Esperados</p>
                <p class="text-2xl font-bold text-gray-900 dark:text-white">{{ dayMetrics.expectedStudents }}</p>
              </div>
            </div>
          </div>

          <!-- Tasa de asistencia -->
          <div class="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg">
            <div class="flex items-center">
              <div class="p-3 rounded-full bg-orange-100 dark:bg-orange-900/20">
                <ChartBarIcon class="w-6 h-6 text-orange-600 dark:text-orange-400" />
              </div>
              <div class="ml-4">
                <p class="text-sm font-medium text-gray-600 dark:text-gray-400">Tasa de Asistencia</p>
                <p class="text-2xl font-bold text-gray-900 dark:text-white">{{ dayMetrics.attendanceRate }}%</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- Monitoreo de clases en tiempo real -->
      <section class="mb-8">
        <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg">
          <div class="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <h2 class="text-lg font-semibold text-gray-900 dark:text-white">
              Monitoreo de Clases - Tiempo Real
            </h2>
          </div>
          
          <div class="p-6">
            <div class="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
              <div 
                v-for="classItem in currentClasses" 
                :key="classItem.id"
                class="border rounded-lg p-4 hover:shadow-md transition-shadow"
                :class="getClassStatusColor(classItem.status)"
              >
                <div class="flex items-center justify-between mb-2">
                  <h3 class="font-medium text-gray-900 dark:text-white">{{ classItem.name }}</h3>
                  <span 
                    class="px-2 py-1 text-xs font-medium rounded-full"
                    :class="getStatusBadgeColor(classItem.status)"
                  >
                    {{ getStatusText(classItem.status) }}
                  </span>
                </div>
                
                <div class="space-y-1 text-sm text-gray-600 dark:text-gray-400">
                  <p><strong>Maestro:</strong> {{ classItem.teacher }}</p>
                  <p><strong>Horario:</strong> {{ classItem.schedule }}</p>
                  <p><strong>Asistencia:</strong> 
                    <span class="font-medium text-gray-900 dark:text-white">
                      {{ classItem.presentStudents }}/{{ classItem.totalStudents }}
                    </span>
                  </p>
                </div>
                
                <!-- Barra de progreso de asistencia -->
                <div class="mt-3">
                  <div class="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div 
                      class="h-2 rounded-full transition-all duration-300"
                      :class="getAttendanceBarColor(classItem.attendancePercentage)"
                      :style="{ width: `${classItem.attendancePercentage}%` }"
                    ></div>
                  </div>
                </div>
              </div>
            </div>
            
            <div v-if="currentClasses.length === 0" class="text-center py-8">
              <AcademicCapIcon class="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p class="text-gray-500 dark:text-gray-400">No hay clases programadas para esta fecha</p>
            </div>
          </div>
        </div>
      </section>

      <!-- Tabla de estudiantes críticos -->
      <section>
        <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg">
          <div class="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <div class="flex items-center justify-between">
              <h2 class="text-lg font-semibold text-gray-900 dark:text-white">
                Estudiantes Críticos - Registro de Asistencias
              </h2>
              
              <!-- Filtros -->
              <div class="flex items-center space-x-4">
                <select 
                  v-model="selectedFilter"
                  @change="applyFilter"
                  class="border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  <option value="most_absent">Más Ausentes</option>
                  <option value="most_present">Más Presentes</option>
                  <option value="by_instrument">Por Instrumento</option>
                  <option value="by_age">Por Edad</option>
                  <option value="alphabetical">Alfabético</option>
                  <option value="by_classes">Por Clases</option>
                </select>
                
                <div class="relative">
                  <input 
                    type="text" 
                    v-model="searchQuery"
                    @input="filterStudents"
                    placeholder="Buscar estudiante..."
                    class="border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 pl-10 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                  <MagnifyingGlassIcon class="w-4 h-4 text-gray-400 absolute left-3 top-3" />
                </div>
              </div>
            </div>
          </div>
          
          <div class="overflow-x-auto">
            <table class="w-full">
              <thead class="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Estudiante
                  </th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Instrumento
                  </th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Clases Asignadas
                  </th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Ausencias
                  </th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Tasa Asistencia
                  </th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody class="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                <tr 
                  v-for="student in filteredStudents" 
                  :key="student.id"
                  class="hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  <td class="px-6 py-4 whitespace-nowrap">
                    <div class="flex items-center">
                      <div class="flex-shrink-0 h-10 w-10">
                        <div class="h-10 w-10 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center">
                          <span class="text-white font-medium text-sm">
                            {{ getInitials(student.fullName) }}
                          </span>
                        </div>
                      </div>
                      <div class="ml-4">
                        <div class="text-sm font-medium text-gray-900 dark:text-white">
                          {{ student.fullName }}
                        </div>
                        <div class="text-sm text-gray-500 dark:text-gray-400">
                          {{ student.age }} años
                        </div>
                      </div>
                    </div>
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                    {{ student.instrument }}
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                    {{ student.assignedClasses }}
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap">
                    <button 
                      @click="openCommunicationModal(student)"
                      class="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium cursor-pointer transition-colors"
                      :class="getAbsencesBadgeColor(student.absences, student.assignedClasses)"
                    >
                      {{ student.absences }}
                    </button>
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap">
                    <div class="flex items-center">
                      <div class="flex-1">
                        <div class="text-sm font-medium text-gray-900 dark:text-white">
                          {{ student.attendanceRate }}%
                        </div>
                        <div class="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mt-1">
                          <div 
                            class="h-2 rounded-full transition-all duration-300"
                            :class="getAttendanceBarColor(student.attendanceRate)"
                            :style="{ width: `${student.attendanceRate}%` }"
                          ></div>
                        </div>
                      </div>
                    </div>
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button
                      @click="openCommunicationModal(student)"
                      class="text-blue-600 dark:text-blue-400 hover:text-blue-900 dark:hover:text-blue-300 mr-3"
                    >
                      Contactar
                    </button>
                    <button
                      @click="viewStudentDetails(student)"
                      class="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-300"
                    >
                      Ver detalles
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          
          <div v-if="filteredStudents.length === 0" class="text-center py-8">
            <UsersIcon class="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p class="text-gray-500 dark:text-gray-400">No se encontraron estudiantes</p>
          </div>
        </div>
      </section>
    </main>

    <!-- Modal de comunicación -->
    <div 
      v-if="showCommunicationModal" 
      class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      @click="closeCommunicationModal"
    >
      <div 
        class="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-2xl w-full m-4 max-h-[90vh] overflow-y-auto"
        @click.stop
      >
        <div class="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <div class="flex items-center justify-between">
            <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
              Comunicación con Representante
            </h3>
            <button 
              @click="closeCommunicationModal"
              class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              <XMarkIcon class="w-6 h-6" />
            </button>
          </div>
          
          <div v-if="selectedStudent" class="mt-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <div class="flex items-center space-x-4">
              <div class="h-12 w-12 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center">
                <span class="text-white font-medium">
                  {{ getInitials(selectedStudent.fullName) }}
                </span>
              </div>
              <div>
                <h4 class="font-medium text-gray-900 dark:text-white">{{ selectedStudent.fullName }}</h4>
                <p class="text-sm text-gray-600 dark:text-gray-400">
                  {{ selectedStudent.instrument }} • {{ selectedStudent.absences }} ausencias
                </p>
              </div>
            </div>
          </div>
        </div>
        
        <div class="p-6">
          <div class="mb-6">
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Seleccionar Plantilla de Comunicación
            </label>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button 
                v-for="template in communicationTemplates" 
                :key="template.id"
                @click="selectedTemplate = template"
                class="p-4 border-2 rounded-lg text-left transition-colors"
                :class="selectedTemplate?.id === template.id 
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' 
                  : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'"
              >
                <div class="flex items-center space-x-3">
                  <component :is="template.icon" class="w-5 h-5 text-gray-600 dark:text-gray-400" />
                  <div>
                    <h5 class="font-medium text-gray-900 dark:text-white">{{ template.title }}</h5>
                    <p class="text-sm text-gray-600 dark:text-gray-400">{{ template.description }}</p>
                  </div>
                </div>
              </button>
            </div>
          </div>
          
          <div v-if="selectedTemplate" class="mb-6">
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Vista previa del mensaje
            </label>
            <div class="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <p class="text-sm text-gray-900 dark:text-white whitespace-pre-wrap">{{ generateMessage() }}</p>
            </div>
          </div>
          
          <div class="flex items-center justify-end space-x-3">
            <button 
              @click="closeCommunicationModal"
              class="px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
            >
              Cancelar
            </button>            <button 
              @click="handleSendWhatsAppMessage"
              :disabled="!selectedTemplate"
              class="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <span>📱</span>
              <span>Enviar por WhatsApp</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useClassMonitoring } from '../composables/useClassMonitoring'
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  AcademicCapIcon,
  UserIcon,
  UsersIcon,
  ChartBarIcon,
  DocumentArrowDownIcon,
  MagnifyingGlassIcon,
  XMarkIcon
} from '@heroicons/vue/24/outline'

// Tipos
interface CommunicationTemplate {
  id: string
  title: string
  description: string
  icon: any
  template: string
}

// Composables
const router = useRouter()
const {
  // Estado
  isLoading,
  selectedDate,
  realTimeUpdates,
  
  // Datos
  dayMetrics,
  currentClasses,
  criticalStudents,
  
  // Computed
  todayClasses,
  activeClasses,
  completedClasses,
  upcomingClasses,
  highRiskStudents,
  averageAttendanceRate,
  
  // Permisos
  canViewClassMonitoring,
  canViewStudentReports,
  canContactParents,
  canGenerateReports,
  
  // Métodos principales
  loadDayData,
  
  // Filtrado y búsqueda
  sortStudents,
  searchStudents,
  
  // Comunicación
  generateCommunicationMessage,
  sendWhatsAppMessage,
  
  // Reportes
  generateWeeklyReport,
  
  // Tiempo real
  startRealTimeUpdates,
  stopRealTimeUpdates,
  
  // Utilidades
  getStudentInitials
} = useClassMonitoring()

// Estado local adicional
const selectedDateString = ref(formatDateForInput(new Date()))
const selectedFilter = ref('most_absent')
const searchQuery = ref('')
const showCommunicationModal = ref(false)
const selectedStudent = ref<any | null>(null)
const selectedTemplate = ref<CommunicationTemplate | null>(null)

// Datos de plantillas de comunicación
const communicationTemplates = ref<CommunicationTemplate[]>([
  {
    id: 'warning',
    title: 'Amonestación',
    description: 'Llamado de atención por ausencias',
    icon: 'ExclamationTriangleIcon',
    template: `Estimado/a {representante},

Por medio de la presente nos dirigimos a usted para informarle sobre las ausencias de {estudiante} en las clases de {instrumento}.

Registro de ausencias: {ausencias} de {total_clases} clases asignadas.
Tasa de asistencia actual: {tasa_asistencia}%

Le recordamos la importancia de la asistencia regular para el progreso académico.

Atentamente,
Dirección - El Sistema PC`
  },
  {
    id: 'minor_fault',
    title: 'Falta Leve',
    description: 'Reflexión sobre comportamiento',
    icon: 'ChatBubbleLeftIcon',
    template: `Estimado/a {representante},

Nos comunicamos para conversar sobre la situación académica de {estudiante} en las clases de {instrumento}.

Hemos notado un patrón de ausencias que puede afectar su desarrollo musical. Nos gustaría coordinar una reunión para encontrar soluciones conjuntas.

¿Podría contactarnos para agendar una cita?

Cordialmente,
Dirección Académica - El Sistema PC`
  },
  {
    id: 'expulsion',
    title: 'Carta de Expulsión',
    description: 'Notificación de expulsión por ausencias',
    icon: 'NoSymbolIcon',
    template: `Estimado/a {representante},

Lamentablemente, después de múltiples intentos de comunicación, debemos informarle que {estudiante} será dado de baja del programa de {instrumento}.

Ausencias registradas: {ausencias} de {total_clases} clases.
Tasa de asistencia: {tasa_asistencia}%

Esta decisión es definitiva según el reglamento interno.

Dirección - El Sistema PC`
  },
  {
    id: 'instrument_return',
    title: 'Entrega de Instrumento',
    description: 'Solicitud de devolución de instrumento',
    icon: 'MusicalNoteIcon',
    template: `Estimado/a {representante},

Por favor, proceda a la devolución del instrumento asignado a {estudiante} debido a su baja del programa.

Instrumento: {instrumento}
Fecha límite de entrega: Próximos 7 días

Puede acercarse en horario de oficina (9:00 AM - 5:00 PM).

Administración - El Sistema PC`
  },
  {
    id: 'citation',
    title: 'Citación al Representante',
    description: 'Cita obligatoria con dirección',
    icon: 'CalendarDaysIcon',
    template: `Estimado/a {representante},

Por la presente lo/la citamos a una reunión OBLIGATORIA para tratar la situación académica de {estudiante}.

Fecha y hora: Por confirmar
Asunto: Ausencias reiteradas en clases de {instrumento}

Su asistencia es indispensable. Favor confirmar recepción.

Dirección - El Sistema PC`
  }
])

// Computed
const filteredStudents = computed(() => {
  let students = [...criticalStudents.value]
  
  // Aplicar búsqueda
  if (searchQuery.value) {
    students = searchStudents(searchQuery.value)
  }
  
  // Aplicar filtro de ordenamiento
  return sortStudents(selectedFilter.value, students)
})

// Métodos utilitarios
function formatDate(date: Date): string {
  return date.toLocaleDateString('es-ES', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  })
}

function formatDateForInput(date: Date): string {
  return date.toISOString().split('T')[0]
}

function getDayName(date: Date): string {
  return date.toLocaleDateString('es-ES', { weekday: 'long' })
}

function getInitials(name: string): string {
  return getStudentInitials(name)
}

function getClassStatusColor(status: string): string {
  const colors = {
    scheduled: 'border-gray-200 dark:border-gray-600',
    in_progress: 'border-blue-300 bg-blue-50 dark:border-blue-600 dark:bg-blue-900/20',
    completed: 'border-green-300 bg-green-50 dark:border-green-600 dark:bg-green-900/20',
    cancelled: 'border-red-300 bg-red-50 dark:border-red-600 dark:bg-red-900/20'
  }
  return colors[status as keyof typeof colors] || colors.scheduled
}

function getStatusBadgeColor(status: string): string {
  const colors = {
    scheduled: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300',
    in_progress: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
    completed: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
    cancelled: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'
  }
  return colors[status as keyof typeof colors] || colors.scheduled
}

function getStatusText(status: string): string {
  const texts = {
    scheduled: 'Programada',
    in_progress: 'En Curso',
    completed: 'Completada',
    cancelled: 'Cancelada'
  }
  return texts[status as keyof typeof texts] || 'Desconocido'
}

function getAttendanceBarColor(percentage: number): string {
  if (percentage >= 80) return 'bg-green-500'
  if (percentage >= 60) return 'bg-yellow-500'
  return 'bg-red-500'
}

function getAbsencesBadgeColor(absences: number, total: number): string {
  const percentage = ((total - absences) / total) * 100
  if (percentage >= 80) return 'bg-green-100 text-green-800 hover:bg-green-200 dark:bg-green-900 dark:text-green-300'
  if (percentage >= 60) return 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200 dark:bg-yellow-900 dark:text-yellow-300'
  return 'bg-red-100 text-red-800 hover:bg-red-200 dark:bg-red-900 dark:text-red-300'
}

// Métodos de navegación de fechas
function goToPreviousDay() {
  const newDate = new Date(selectedDate.value)
  newDate.setDate(newDate.getDate() - 1)
  selectedDate.value = newDate
  selectedDateString.value = formatDateForInput(newDate)
  loadDayData(newDate)
}

function goToNextDay() {
  const newDate = new Date(selectedDate.value)
  newDate.setDate(newDate.getDate() + 1)
  selectedDate.value = newDate
  selectedDateString.value = formatDateForInput(newDate)
  loadDayData(newDate)
}

function goToToday() {
  const today = new Date()
  selectedDate.value = today
  selectedDateString.value = formatDateForInput(today)
  loadDayData(today)
}

function onDateChange() {
  selectedDate.value = new Date(selectedDateString.value)
  loadDayData(selectedDate.value)
}

// Métodos de filtrado
function applyFilter() {
  // El filtrado se hace automáticamente por el computed
}

function filterStudents() {
  // La búsqueda se hace automáticamente por el computed
}

// Métodos de comunicación
function openCommunicationModal(student: any) {
  selectedStudent.value = student
  selectedTemplate.value = null
  showCommunicationModal.value = true
}

function closeCommunicationModal() {
  showCommunicationModal.value = false
  selectedStudent.value = null
  selectedTemplate.value = null
}

function generateMessage(): string {
  if (!selectedTemplate.value || !selectedStudent.value) return ''
  
  return generateCommunicationMessage(selectedStudent.value, selectedTemplate.value.template)
}

function handleSendWhatsAppMessage() {
  if (!selectedStudent.value || !selectedTemplate.value) return
  
  const message = generateMessage()
  sendWhatsAppMessage(selectedStudent.value, message)
  closeCommunicationModal()
}

function viewStudentDetails(student: any) {
  router.push(`/admin/students/${student.id}`)
}

// Métodos de reportes
function handleGenerateWeeklyReport() {
  const startOfWeek = new Date(selectedDate.value)
  startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay())
  generateWeeklyReport(startOfWeek)
}

// Lifecycle
// Lifecycle
onMounted(async () => {
  // Inicializar fecha seleccionada
  selectedDate.value = new Date()
  selectedDateString.value = formatDateForInput(new Date())
  
  // Cargar datos iniciales
  await loadDayData()
  
  // Iniciar actualizaciones en tiempo real
  startRealTimeUpdates()
})

onUnmounted(() => {
  // Detener actualizaciones en tiempo real
  stopRealTimeUpdates()
})
</script>

<style scoped>
/* Estilos específicos para el dashboard */
.min-h-screen {
  min-height: 100vh;
}

/* Animaciones para las cards */
@keyframes pulse-gentle {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.8;
  }
}

.animate-pulse-gentle {
  animation: pulse-gentle 2s infinite;
}

/* Transiciones suaves */
.transition-all {
  transition: all 0.3s ease;
}

/* Scrollbar personalizado */
.overflow-x-auto::-webkit-scrollbar {
  height: 6px;
}

.overflow-x-auto::-webkit-scrollbar-track {
  background: #f1f5f9;
}

.overflow-x-auto::-webkit-scrollbar-thumb {
  background: #cbd5e1;
  border-radius: 3px;
}

.dark .overflow-x-auto::-webkit-scrollbar-track {
  background: #374151;
}

.dark .overflow-x-auto::-webkit-scrollbar-thumb {
  background: #6b7280;
}

/* Modal backdrop */
.modal-backdrop {
  backdrop-filter: blur(4px);
}
</style>
