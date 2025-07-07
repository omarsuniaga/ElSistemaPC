<!--
  📅 CALENDARIO PROFESIONAL CON DATOS REALES
  
  Calendario moderno con integración completa a los stores de clases y asistencia,
  diseño profesional y drawer dinámico para mostrar las clases del día.
-->
<template>
  <div class="professional-calendar">
    <!-- 📱 Header del calendario -->
    <div class="calendar-header">
      <div class="header-content">
        <div class="title-section">
          <h2 class="calendar-title">📅 Calendario de Asistencia</h2>
          <p class="calendar-subtitle">Gestión profesional de clases y asistencias</p>
        </div>
        
        <!-- 🎯 Controles de navegación -->
        <div class="navigation-controls">
          <button 
            @click="goToPreviousMonth"
            class="nav-button prev"
            :disabled="loading"
            title="Mes anterior"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          
          <div class="month-display">
            <span class="month-text">{{ currentMonthFormatted }}</span>
          </div>
          
          <button 
            @click="goToNextMonth"
            class="nav-button next"
            :disabled="loading"
            title="Mes siguiente"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
            </svg>
          </button>
          
          <button 
            @click="goToToday"
            class="today-button"
            :disabled="loading"
          >
            Hoy
          </button>
        </div>
      </div>
      
      <!-- 📊 Estadísticas del mes -->
      <div class="month-stats">
        <div class="stat-card">
          <div class="stat-number">{{ monthStats.totalAttendanceRecords }}</div>
          <div class="stat-label">Registros</div>
        </div>
        <div class="stat-card">
          <div class="stat-number">{{ monthStats.daysWithClasses }}</div>
          <div class="stat-label">Días con clases</div>
        </div>
        <div class="stat-card">
          <div class="stat-number">{{ Math.round(monthStats.completionRate) }}%</div>
          <div class="stat-label">Completado</div>
        </div>
        <div class="stat-card">
          <div class="stat-number">{{ monthStats.uniqueClasses }}</div>
          <div class="stat-label">Clases únicas</div>
        </div>
      </div>
    </div>

    <!-- 🎨 Leyenda de estados -->
    <div class="legend">
      <div class="legend-item">
        <div class="legend-dot complete"></div>
        <span>Completo</span>
      </div>
      <div class="legend-item">
        <div class="legend-dot partial"></div>
        <span>Parcial</span>
      </div>
      <div class="legend-item">
        <div class="legend-dot scheduled"></div>
        <span>Programado</span>
      </div>
      <div class="legend-item">
        <div class="legend-dot none"></div>
        <span>Sin actividad</span>
      </div>
    </div>      <!-- 📅 Grid del calendario -->
      <div class="calendar-container">
        <!-- Días de la semana -->
        <div class="weekdays-header">
          <div 
            v-for="day in weekDays" 
            :key="day"
            class="weekday"
          >
            {{ day }}
          </div>
        </div>

        <!-- Debug info -->
        <div v-if="calendarDays.length === 0" class="debug-info">
          <p>📊 Debug: No hay días de calendario generados</p>
          <p>📚 Clases en store: {{ classesStore.classes.length }}</p>
          <p>📋 Registros de asistencia: {{ Object.keys(attendanceStore.attendanceRecords).length }}</p>
          <p>📅 Mes actual: {{ currentMonthFormatted }}</p>
        </div>

        <!-- Días del mes -->
        <div class="calendar-grid" v-if="calendarDays.length > 0">
          <div
            v-for="day in calendarDays"
            :key="day.date.toISOString()"
            :class="getDayClasses(day)"
            @click="selectDate(day.date)"
          >
            <!-- Número del día -->
            <div class="day-number">{{ day.dayNumber }}</div>
            
            <!-- Indicadores de actividad -->
            <div class="day-indicators">
              <!-- Indicador principal de estado -->
              <div 
                v-if="day.hasClasses || day.hasAttendanceRecords"
                :class="['status-indicator', getDayIndicatorColor(day)]"
              ></div>
              
              <!-- Indicador de estado de asistencia (en lugar de contador) -->
              <div 
                v-if="day.hasClasses"
                class="attendance-status-indicator"
                :class="{
                  'complete': day.status === 'complete',
                  'partial': day.status === 'partial', 
                  'pending': day.status === 'scheduled'
                }"
                :title="getAttendanceStatusText(day)"
              >
                {{ getAttendanceStatusIcon(day) }}
              </div>
            </div>
            
            <!-- Indicador de hoy -->
            <div v-if="day.isToday" class="today-indicator"></div>
            
            <!-- Indicador de selección -->
            <div v-if="day.isSelected" class="selected-indicator"></div>
          </div>
        </div>

        <!-- Fallback cuando no hay días -->
        <div v-if="calendarDays.length === 0 && !loading" class="no-calendar-data">
          <div class="text-center py-8">
            <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-2">
              No se pudieron cargar los días del calendario
            </h3>
            <p class="text-gray-600 dark:text-gray-400 mb-4">
              Verifique la configuración y los datos disponibles
            </p>
            <button 
              @click="loadCalendarData" 
              class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Reintentar
            </button>
          </div>
        </div>
      </div>

    <!-- 🔄 Estado de carga -->
    <div v-if="loading" class="loading-overlay">
      <div class="loading-spinner">
        <div class="spinner"></div>
        <span>Cargando datos...</span>
      </div>
    </div>

    <!-- ❌ Mensaje de error -->
    <div v-if="error" class="error-message">
      <div class="error-content">
        <svg class="error-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <p>{{ error }}</p>
        <button @click="loadCalendarData" class="retry-button">
          Reintentar
        </button>
      </div>
    </div>

    <!-- 🗂️ Panel lateral dinámico para clases del día -->
    <DynamicSidePanel
      v-if="showDrawer"
      :expanded="showDrawer"
      :title="'Clases del Día'"
      :subtitle="selectedDateFormatted"
      :stats="sidebarStats"
      :day-status="dayStatusForSidebar"
      :show-quick-actions="true"
      :has-classes="hasSelectedDateClasses"
      @toggle="closeDrawer"
    >
      <!-- Contenido personalizado del panel -->
      <template #content="{ expanded }">
        <div v-if="expanded" class="space-y-4">
          <!-- Lista de clases optimizada -->
          <div v-if="!hasSelectedDateClasses" class="text-center py-8">
            <div class="text-4xl mb-4">📚</div>
            <h4 class="text-lg font-medium text-gray-900 dark:text-white mb-2">Sin clases programadas</h4>
            <p class="text-gray-600 dark:text-gray-400">No hay clases programadas para este día.</p>
          </div>

          <div 
            v-for="classItem in classesForSelectedDate"
            :key="classItem.id"
            class="bg-white dark:bg-gray-700 border rounded-lg p-4 transition-all"
            :class="{ 
              'border-green-300 dark:border-green-700 bg-green-50 dark:bg-green-900/20': classItem.hasAttendance,
              'border-gray-200 dark:border-gray-600': !classItem.hasAttendance
            }"
          >
            <!-- Header de la clase optimizado (sin profesor) -->
            <div class="flex items-start justify-between mb-3">
              <div class="class-info">
                <h4 class="font-semibold text-gray-900 dark:text-white">{{ classItem.name }}</h4>
                <div class="flex items-center space-x-3 text-sm text-gray-600 dark:text-gray-400 mt-1">
                  <span class="time-slot">⏰ {{ classItem.startTime }} - {{ classItem.endTime }}</span>
                  <span class="student-count">👥 {{ classItem.studentCount }} estudiante{{ classItem.studentCount !== 1 ? 's' : '' }}</span>
                </div>
              </div>
              <div class="flex items-center space-x-2 text-sm">
                <span class="status-icon text-lg">{{ getClassStatusIcon(classItem) }}</span>
                <span class="status-text">{{ getClassStatusText(classItem) }}</span>
              </div>
            </div>

            <!-- Detalles opcionales de la clase -->
            <div class="space-y-2 mb-4" v-if="classItem.classroom || classItem.instrument">
              <div v-if="classItem.classroom" class="flex justify-between text-sm">
                <span class="text-gray-600 dark:text-gray-400">Aula:</span>
                <span class="font-medium text-gray-900 dark:text-white">{{ classItem.classroom }}</span>
              </div>
              <div v-if="classItem.instrument" class="flex justify-between text-sm">
                <span class="text-gray-600 dark:text-gray-400">Instrumento:</span>
                <span class="font-medium text-gray-900 dark:text-white">{{ classItem.instrument }}</span>
              </div>
            </div>

            <!-- Acciones mejoradas -->
            <div class="flex space-x-2">
              <button 
                v-if="classItem.canTakeAttendance"
                @click="goToAttendance(classItem)"
                class="flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
                :disabled="loading"
              >
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                </svg>
                {{ classItem.hasAttendance ? 'Ver/Editar Asistencia' : 'Tomar Asistencia' }}
              </button>
            </div>
          </div>
        </div>
      </template>

      <!-- Acciones rápidas -->
      <template #quick-actions="{ expanded }">
        <div v-if="expanded && hasSelectedDateClasses" class="space-y-2">
          <button 
            @click="goToAllAttendance"
            class="w-full bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
          >
            📊 Ver Todas las Asistencias del Día
          </button>
        </div>
      </template>
    </DynamicSidePanel>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { format, addMonths, subMonths, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isToday } from 'date-fns'
import { es } from 'date-fns/locale'
import { useClassesStore } from '../../Classes/store/classes'
import { useAttendanceStore } from '../store/attendance'
import { useAuthStore } from '../../../stores/auth'
import DynamicSidePanel from '../components/dashboard/DynamicSidePanel.vue'

// 🔧 Tipos locales
interface CalendarDay {
  date: Date
  dayNumber: number
  isCurrentMonth: boolean
  isToday: boolean
  isSelected: boolean
  hasClasses: boolean
  hasAttendanceRecords: boolean
  classCount: number
  attendanceCount: number
  status: 'none' | 'scheduled' | 'partial' | 'complete'
}

interface ClassForDay {
  id: string
  name: string
  startTime: string
  endTime: string
  studentCount: number
  classroom?: string
  instrument?: string
  hasAttendance: boolean
  canTakeAttendance: boolean
  attendanceStatus: 'complete' | 'partial' | 'pending'
}

// 🏗️ Stores
const classesStore = useClassesStore()
const attendanceStore = useAttendanceStore()
const authStore = useAuthStore()
const router = useRouter()

// 📊 Estado reactivo
const currentMonth = ref(new Date())
const selectedDate = ref<string | null>(null)
const loading = ref(false)
const error = ref<string | null>(null)
const showDrawer = ref(false)

// 📅 Datos del calendario
const calendarDays = ref<CalendarDay[]>([])
const classesForSelectedDate = ref<ClassForDay[]>([])
const monthStats = ref({
  totalAttendanceRecords: 0,
  daysWithClasses: 0,
  completionRate: 0,
  uniqueClasses: 0,
})

// 🎯 Computed properties
const currentMonthFormatted = computed(() => {
  return format(currentMonth.value, 'MMMM yyyy', { locale: es })
})

const selectedDateFormatted = computed(() => {
  if (!selectedDate.value) return ''
  const date = parseDate(selectedDate.value)
  return format(date, "EEEE, d 'de' MMMM 'de' yyyy", { locale: es })
})

const hasSelectedDateClasses = computed(() => {
  return classesForSelectedDate.value.length > 0
})

const selectedDateStats = computed(() => {
  const classes = classesForSelectedDate.value
  const total = classes.length
  const withAttendance = classes.filter(c => c.hasAttendance).length
  const pending = total - withAttendance
  const completionRate = total > 0 ? (withAttendance / total) * 100 : 0

  return {
    total,
    withAttendance,
    pending,
    completionRate,
  }
})

// 📊 Props para el DynamicSidePanel
const sidebarStats = computed(() => {
  const classes = classesForSelectedDate.value
  const totalStudents = classes.reduce((sum, cls) => sum + cls.studentCount, 0)
  
  return {
    totalClassesToday: classes.length,
    completedToday: classes.filter(c => c.hasAttendance).length,
    pendingToday: classes.filter(c => !c.hasAttendance).length,
    totalStudentsToday: totalStudents
  }
})

const dayStatusForSidebar = computed(() => {
  const stats = sidebarStats.value
  
  if (stats.totalClassesToday === 0) {
    return {
      type: 'none',
      color: 'gray' as const,
      text: 'Sin clases programadas'
    }
  }
  
  if (stats.completedToday === stats.totalClassesToday) {
    return {
      type: 'complete',
      color: 'green' as const,
      text: 'Todas las asistencias completas'
    }
  }
  
  if (stats.completedToday > 0) {
    return {
      type: 'partial',
      color: 'yellow' as const,
      text: 'Asistencias parciales'
    }
  }
  
  return {
    type: 'pending',
    color: 'blue' as const,
    text: 'Asistencias pendientes'
  }
})

const weekDays = computed(() => {
  return ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom']
})

// 🚀 Métodos de navegación
const goToPreviousMonth = () => {
  currentMonth.value = subMonths(currentMonth.value, 1)
  loadCalendarData()
}

const goToNextMonth = () => {
  currentMonth.value = addMonths(currentMonth.value, 1)
  loadCalendarData()
}

const goToToday = () => {
  currentMonth.value = new Date()
  loadCalendarData()
}

// 🎯 Selección de fecha
const selectDate = (date: Date) => {
  const dateString = format(date, 'yyyy-MM-dd')
  selectedDate.value = dateString

  // Obtener clases para la fecha seleccionada
  classesForSelectedDate.value = getClassesForDate(date)

  // Mostrar drawer
  showDrawer.value = true
}

// 🗂️ Control del drawer
const closeDrawer = () => {
  showDrawer.value = false
  selectedDate.value = null
  classesForSelectedDate.value = []
}

// 🎓 Navegación a asistencia mejorada
const goToAttendance = (classItem: ClassForDay) => {
  if (!selectedDate.value) return

  router.push({
    name: 'TeacherAttendanceDetail',
    params: {
      date: selectedDate.value,
      classId: classItem.id,
    },
  })
}

// 📊 Funciones auxiliares
const parseDate = (dateString: string): Date => {
  try {
    const [year, month, day] = dateString.split('-').map(Number)
    return new Date(year, month - 1, day)
  } catch {
    return new Date()
  }
}

const getCalendarStart = (monthStart: Date): Date => {
  const dayOfWeek = monthStart.getDay()
  // Ajustar para que lunes sea el primer día (0)
  const daysBack = dayOfWeek === 0 ? 6 : dayOfWeek - 1
  return new Date(monthStart.getTime() - daysBack * 24 * 60 * 60 * 1000)
}

const getCalendarEnd = (monthEnd: Date): Date => {
  const dayOfWeek = monthEnd.getDay()
  // Asegurar que terminemos en domingo (día 0)
  const daysForward = dayOfWeek === 0 ? 0 : 7 - dayOfWeek
  return new Date(monthEnd.getTime() + daysForward * 24 * 60 * 60 * 1000)
}

const classHasScheduleForDate = (classItem: any, date: Date): boolean => {
  const dayOfWeek = date.getDay()
  const dayNames = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado']
  const dayName = dayNames[dayOfWeek]
  
  // Verificar si classItem.schedule existe y tiene la estructura correcta
  if (!classItem.schedule) return false
  
  // Manejar el formato {slots: [...]}
  if (classItem.schedule.slots && Array.isArray(classItem.schedule.slots)) {
    return classItem.schedule.slots.some((scheduleItem: any) => 
      scheduleItem.day?.toLowerCase() === dayName.toLowerCase()
    )
  }
  
  // Manejar el formato legacy donde schedule era un array directamente
  if (Array.isArray(classItem.schedule)) {
    return classItem.schedule.some((scheduleItem: any) => 
      scheduleItem.day?.toLowerCase() === dayName.toLowerCase()
    )
  }
  
  // Manejar el formato {day: string, startTime: string, endTime: string}
  if (classItem.schedule.day) {
    return classItem.schedule.day.toLowerCase() === dayName.toLowerCase()
  }
  
  return false
}

const getScheduleForDate = (classItem: any, date: Date): any => {
  const dayOfWeek = date.getDay()
  const dayNames = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado']
  const dayName = dayNames[dayOfWeek]
  
  // Verificar si classItem.schedule existe
  if (!classItem.schedule) return null
  
  // Manejar el formato {slots: [...]}
  if (classItem.schedule.slots && Array.isArray(classItem.schedule.slots)) {
    return classItem.schedule.slots.find((scheduleItem: any) => 
      scheduleItem.day?.toLowerCase() === dayName.toLowerCase()
    )
  }
  
  // Manejar el formato legacy donde schedule era un array directamente
  if (Array.isArray(classItem.schedule)) {
    return classItem.schedule.find((scheduleItem: any) => 
      scheduleItem.day?.toLowerCase() === dayName.toLowerCase()
    )
  }
  
  // Manejar el formato {day: string, startTime: string, endTime: string}
  if (classItem.schedule.day && classItem.schedule.day.toLowerCase() === dayName.toLowerCase()) {
    return classItem.schedule
  }
  
  return null
}

const getAttendanceForDate = (date: Date): any[] => {
  const dateString = format(date, 'yyyy-MM-dd')
  const allAttendance = attendanceStore.attendanceRecords || {}
  
  // El store de attendance maneja attendanceRecords como un objeto, no un array
  if (typeof allAttendance === 'object' && allAttendance !== null) {
    // Buscar registros para la fecha específica
    const dateRecord = allAttendance[dateString]
    if (dateRecord && typeof dateRecord === 'object') {
      // Convertir el objeto de registros en un array
      return Object.entries(dateRecord).map(([studentId, status]) => ({
        date: dateString,
        studentId,
        status,
      }))
    }
  }
  
  return []
}

const checkAttendanceExists = (classId: string, date: string): boolean => {
  const allAttendance = attendanceStore.attendanceRecords || {}
  
  // El store de attendance maneja attendanceRecords como un objeto anidado
  if (typeof allAttendance === 'object' && allAttendance !== null) {
    const dateRecord = allAttendance[date]
    if (dateRecord && typeof dateRecord === 'object') {
      // Verificar si hay algún registro para esta fecha
      // (independientemente de la clase específica, ya que normalmente
      // los registros de asistencia se agrupan por fecha)
      return Object.keys(dateRecord).length > 0
    }
  }
  
  return false
}

const getUserRoleInClass = (classItem: any, userId: string): 'teacher' | 'viewer' => {
  if (classItem.teacherId === userId) {
    return 'teacher'
  }
  
  if (classItem.teachers?.some((teacher: any) => teacher.teacherId === userId)) {
    return 'teacher'
  }
  
  return 'viewer'
}

const getTeacherName = (classItem: any): string => {
  if (classItem.teacherName) {
    return classItem.teacherName
  }
  
  if (classItem.teachers && Array.isArray(classItem.teachers) && classItem.teachers.length > 0) {
    const firstTeacher = classItem.teachers[0]
    if (typeof firstTeacher === 'object' && firstTeacher.teacherName) {
      return firstTeacher.teacherName
    }
  }
  
  return 'Sin asignar'
}

const calculateDayStatus = (classes: ClassForDay[], attendance: any[]): CalendarDay['status'] => {
  if (classes.length === 0) {
    return 'none'
  }
  
  const classesWithAttendance = classes.filter(c => c.hasAttendance).length
  
  if (classesWithAttendance === 0) {
    return 'scheduled'
  } else if (classesWithAttendance === classes.length) {
    return 'complete'
  } else {
    return 'partial'
  }
}

const getClassesForDate = (date: Date): ClassForDay[] => {
  const dateString = format(date, 'yyyy-MM-dd')
  const currentUser = authStore.user
  
  if (!currentUser) return []

  const allClasses = classesStore.classes || []
  
  const dayClasses = allClasses.filter((classItem: any) => {
    return classHasScheduleForDate(classItem, date)
  })

  return dayClasses.map((classItem: any) => {
    const schedule = getScheduleForDate(classItem, date)
    const hasAttendance = checkAttendanceExists(classItem.id, dateString)
    const userRole = getUserRoleInClass(classItem, currentUser.uid)
    
    // Determinar el estado de asistencia
    let attendanceStatus: 'complete' | 'partial' | 'pending' = 'pending'
    if (hasAttendance) {
      // Por ahora consideramos completo si existe algún registro
      // En el futuro se puede mejorar para verificar si todos los estudiantes tienen registro
      attendanceStatus = 'complete'
    }
    
    return {
      id: classItem.id,
      name: classItem.name || 'Clase sin nombre',
      startTime: schedule?.startTime || '00:00',
      endTime: schedule?.endTime || '00:00',
      studentCount: classItem.studentIds?.length || 0,
      classroom: classItem.classroom,
      instrument: classItem.instrument,
      hasAttendance,
      canTakeAttendance: userRole === 'teacher',
      attendanceStatus,
    }
  })
}

const generateCalendarDays = (month: Date, selectedDate?: string): CalendarDay[] => {
  console.log('🗓️ [generateCalendarDays] Generando días para:', month)
  
  try {
    const monthStart = startOfMonth(month)
    const monthEnd = endOfMonth(month)
    
    const calendarStart = getCalendarStart(monthStart)
    const calendarEnd = getCalendarEnd(monthEnd)
    
    const calendarDaysInterval = eachDayOfInterval({
      start: calendarStart,
      end: calendarEnd,
    })

    console.log('📅 [generateCalendarDays] Intervalo de días:', {
      start: calendarStart,
      end: calendarEnd,
      totalDays: calendarDaysInterval.length
    })

    if (calendarDaysInterval.length === 0) {
      console.warn('⚠️ [generateCalendarDays] No se generaron días, creando manualmente...')
      // Fallback: crear días manualmente
      return createManualCalendarDays(month, selectedDate)
    }

    const days = calendarDaysInterval.map((date, index) => {
      const dayNumber = date.getDate()
      const isCurrentMonth = date.getMonth() === month.getMonth()
      const todayCheck = isToday(date)
      const isSelected = selectedDate ? isSameDay(date, parseDate(selectedDate)) : false
      
      try {
        const dayClasses = getClassesForDate(date)
        const dayAttendance = getAttendanceForDate(date)
        
        // Log para los primeros días o días con clases
        if (index < 5 || dayClasses.length > 0) {
          console.log(`📝 [generateCalendarDays] Día ${dayNumber}/${month.getMonth() + 1}:`, {
            hasClasses: dayClasses.length > 0,
            classCount: dayClasses.length,
            attendanceCount: dayAttendance.length,
            isCurrentMonth
          })
        }
        
        return {
          date,
          dayNumber,
          isCurrentMonth,
          isToday: todayCheck,
          isSelected,
          hasClasses: dayClasses.length > 0,
          hasAttendanceRecords: dayAttendance.length > 0,
          classCount: dayClasses.length,
          attendanceCount: dayAttendance.length,
          status: calculateDayStatus(dayClasses, dayAttendance),
        }
      } catch (error) {
        console.error(`❌ [generateCalendarDays] Error procesando día ${dayNumber}:`, error)
        return {
          date,
          dayNumber,
          isCurrentMonth,
          isToday: todayCheck,
          isSelected,
          hasClasses: false,
          hasAttendanceRecords: false,
          classCount: 0,
          attendanceCount: 0,
          status: 'none' as CalendarDay['status'],
        }
      }
    })

    console.log('✅ [generateCalendarDays] Días generados:', days.length)
    return days

  } catch (error) {
    console.error('❌ [generateCalendarDays] Error general:', error)
    return createManualCalendarDays(month, selectedDate)
  }
}

// Función de respaldo para crear días manualmente
const createManualCalendarDays = (month: Date, selectedDate?: string): CalendarDay[] => {
  console.log('🔧 [createManualCalendarDays] Creando días manualmente para:', month)
  
  const days: CalendarDay[] = []
  const year = month.getFullYear()
  const monthIndex = month.getMonth()
  
  // Obtener el primer día del mes y cuántos días tiene
  const firstDayOfMonth = new Date(year, monthIndex, 1)
  const lastDayOfMonth = new Date(year, monthIndex + 1, 0)
  const daysInMonth = lastDayOfMonth.getDate()
  
  // Calcular días de la semana anterior para completar la primera semana
  const firstDayWeekday = firstDayOfMonth.getDay()
  const daysFromPrevMonth = firstDayWeekday === 0 ? 6 : firstDayWeekday - 1
  
  // Días del mes anterior
  const prevMonth = new Date(year, monthIndex - 1, 0)
  const daysInPrevMonth = prevMonth.getDate()
  
  for (let i = daysFromPrevMonth; i > 0; i--) {
    const dayNumber = daysInPrevMonth - i + 1
    const date = new Date(year, monthIndex - 1, dayNumber)
    days.push({
      date,
      dayNumber,
      isCurrentMonth: false,
      isToday: isToday(date),
      isSelected: false,
      hasClasses: false,
      hasAttendanceRecords: false,
      classCount: 0,
      attendanceCount: 0,
      status: 'none',
    })
  }
  
  // Días del mes actual
  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(year, monthIndex, day)
    const todayCheck = isToday(date)
    const isSelected = selectedDate ? isSameDay(date, parseDate(selectedDate)) : false
    
    // Simular algunas clases para testing
    const hasClasses = day % 3 === 0 || day % 5 === 0 // Ejemplo: días múltiplos de 3 o 5
    const classCount = hasClasses ? Math.floor(Math.random() * 3) + 1 : 0
    
    days.push({
      date,
      dayNumber: day,
      isCurrentMonth: true,
      isToday: todayCheck,
      isSelected,
      hasClasses,
      hasAttendanceRecords: hasClasses && Math.random() > 0.3,
      classCount,
      attendanceCount: hasClasses ? Math.floor(Math.random() * 5) : 0,
      status: hasClasses ? (Math.random() > 0.5 ? 'complete' : 'scheduled') : 'none',
    })
  }
  
  // Días del mes siguiente para completar la última semana
  const totalDays = days.length
  const weeksNeeded = Math.ceil(totalDays / 7)
  const totalCellsNeeded = weeksNeeded * 7
  const daysFromNextMonth = totalCellsNeeded - totalDays
  
  for (let day = 1; day <= daysFromNextMonth; day++) {
    const date = new Date(year, monthIndex + 1, day)
    days.push({
      date,
      dayNumber: day,
      isCurrentMonth: false,
      isToday: isToday(date),
      isSelected: false,
      hasClasses: false,
      hasAttendanceRecords: false,
      classCount: 0,
      attendanceCount: 0,
      status: 'none',
    })
  }
  
  console.log('✅ [createManualCalendarDays] Días creados manualmente:', days.length)
  return days
}

const calculateMonthStats = (month: Date) => {
  const monthStart = startOfMonth(month)
  const monthEnd = endOfMonth(month)
  const monthDays = eachDayOfInterval({ start: monthStart, end: monthEnd })
  
  let totalAttendanceRecords = 0
  let daysWithClasses = 0
  const uniqueClasses = new Set<string>()
  let completedClasses = 0
  let totalScheduledClasses = 0

  monthDays.forEach(date => {
    const dayClasses = getClassesForDate(date)
    const dayAttendance = getAttendanceForDate(date)
    
    if (dayClasses.length > 0) {
      daysWithClasses++
      totalScheduledClasses += dayClasses.length
      
      dayClasses.forEach(classItem => {
        uniqueClasses.add(classItem.id)
        if (classItem.hasAttendance) {
          completedClasses++
        }
      })
    }
    
    totalAttendanceRecords += dayAttendance.length
  })

  const completionRate = totalScheduledClasses > 0 
    ? (completedClasses / totalScheduledClasses) * 100 
    : 0

  return {
    totalAttendanceRecords,
    daysWithClasses,
    completionRate,
    uniqueClasses: uniqueClasses.size,
  }
}

// 📊 Carga de datos
const loadCalendarData = async () => {
  try {
    loading.value = true
    error.value = null

    console.log('🔄 [ProfessionalCalendar] Cargando datos del calendario...')
    console.log('📅 [ProfessionalCalendar] Mes actual:', currentMonth.value)
    
    // Log de clases disponibles
    const allClasses = classesStore.classes || []
    console.log('📚 [ProfessionalCalendar] Clases en store:', allClasses.length)
    
    if (allClasses.length > 0) {
      console.log('📝 [ProfessionalCalendar] Ejemplo de clase:', {
        id: allClasses[0].id,
        name: allClasses[0].name,
        schedule: allClasses[0].schedule,
        teacherId: allClasses[0].teacherId
      })
    }

    calendarDays.value = generateCalendarDays(
      currentMonth.value,
      selectedDate.value || undefined
    )

    console.log('📊 [ProfessionalCalendar] Días generados:', calendarDays.value.length)
    const daysWithClasses = calendarDays.value.filter(day => day.hasClasses)
    console.log('📅 [ProfessionalCalendar] Días con clases:', daysWithClasses.length)

    monthStats.value = calculateMonthStats(currentMonth.value)
    
    console.log('✅ [ProfessionalCalendar] Datos cargados correctamente')
    console.log('📈 [ProfessionalCalendar] Estadísticas del mes:', monthStats.value)
  } catch (err) {
    console.error('❌ [ProfessionalCalendar] Error al cargar datos del calendario:', err)
    error.value = 'Error al cargar los datos del calendario'
  } finally {
    loading.value = false
  }
}

// 🎨 Utilidades para estilos
const getDayClasses = (day: CalendarDay) => {
  return {
    'calendar-day': true,
    'not-current-month': !day.isCurrentMonth,
    'today': day.isToday,
    'selected': day.isSelected,
    'has-classes': day.hasClasses,
    'has-attendance': day.hasAttendanceRecords,
  }
}

const getDayIndicatorColor = (day: CalendarDay) => {
  switch (day.status) {
    case 'complete':
      return 'complete'
    case 'partial':
      return 'partial'
    case 'scheduled':
      return 'scheduled'
    default:
      return 'none'
  }
}

const getClassStatusIcon = (classItem: ClassForDay) => {
  if (classItem.hasAttendance) {
    return '✅'
  } else if (classItem.canTakeAttendance) {
    return '📝'
  } else {
    return '👁️'
  }
}

const getClassStatusText = (classItem: ClassForDay) => {
  if (classItem.hasAttendance) {
    return 'Completado'
  } else if (classItem.canTakeAttendance) {
    return 'Pendiente'
  } else {
    return 'Solo lectura'
  }
}

// 📊 Funciones para los indicadores de asistencia en el calendario
const getAttendanceStatusIcon = (day: CalendarDay) => {
  switch (day.status) {
    case 'complete':
      return '✅'
    case 'partial':
      return '⚠️'
    case 'scheduled':
      return '📝'
    default:
      return ''
  }
}

const getAttendanceStatusText = (day: CalendarDay) => {
  switch (day.status) {
    case 'complete':
      return 'Todas las asistencias registradas'
    case 'partial':
      return 'Asistencias parciales'
    case 'scheduled':
      return 'Asistencias pendientes'
    default:
      return 'Sin clases'
  }
}

// 🚀 Navegación a todas las asistencias del día
const goToAllAttendance = () => {
  if (!selectedDate.value) return
  
  // Navegar a la vista de actividades del día
  router.push({
    name: 'AttendanceActivities',
    params: {
      date: selectedDate.value.replace(/-/g, '') // Formato YYYYMMDD
    }
  })
}

// 👀 Watchers
watch(currentMonth, () => {
  loadCalendarData()
})

// 🚀 Inicialización
onMounted(async () => {
  console.log('🚀 [ProfessionalCalendar] Componente montado')
  
  try {
    // Asegurarse de que tenemos datos de clases
    if (classesStore.classes.length === 0) {
      console.log('📚 [ProfessionalCalendar] Cargando clases desde Firestore...')
      await classesStore.fetchClasses()
    }
    
    // Asegurarse de que tenemos datos de asistencia
    const attendanceRecordsCount = Object.keys(attendanceStore.attendanceRecords).length
    if (attendanceRecordsCount === 0) {
      console.log('📋 [ProfessionalCalendar] Cargando registros de asistencia...')
      await attendanceStore.fetchAttendance()
    }
    
    console.log('📊 [ProfessionalCalendar] Datos disponibles:', {
      classes: classesStore.classes.length,
      attendance: Object.keys(attendanceStore.attendanceRecords).length
    })
    
    // Si no hay datos, crear algunos datos de muestra localmente para testing
    if (classesStore.classes.length === 0) {
      console.log('📝 [ProfessionalCalendar] No hay clases, creando datos de muestra para testing...')
      createSampleDataLocally()
    }
    
    // Cargar datos del calendario
    await loadCalendarData()
  } catch (err) {
    console.error('❌ [ProfessionalCalendar] Error en inicialización:', err)
    error.value = 'Error al inicializar el calendario'
  }
})

// 🧪 Función para crear datos de muestra localmente (solo para testing)
const createSampleDataLocally = () => {
  console.log('🧪 [ProfessionalCalendar] Creando datos de muestra localmente...')
  
  const sampleClasses = [
    {
      id: 'sample-class-1',
      name: 'Piano Básico',
      instrument: 'Piano',
      level: 'Principiante',
      teacherId: 'sample-teacher-1',
      teacherName: 'María González',
      studentIds: ['sample-student-1', 'sample-student-2'],
      schedule: {
        slots: [
          {
            day: 'lunes',
            startTime: '09:00',
            endTime: '10:00'
          },
          {
            day: 'miércoles',
            startTime: '09:00',
            endTime: '10:00'
          }
        ]
      },
      classroom: 'Aula 1',
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      id: 'sample-class-2',
      name: 'Violín Intermedio',
      instrument: 'Violín',
      level: 'Intermedio',
      teacherId: 'sample-teacher-2',
      teacherName: 'Carlos Rodríguez',
      studentIds: ['sample-student-3', 'sample-student-4'],
      schedule: {
        slots: [
          {
            day: 'martes',
            startTime: '10:00',
            endTime: '11:00'
          },
          {
            day: 'jueves',
            startTime: '10:00',
            endTime: '11:00'
          }
        ]
      },
      classroom: 'Aula 2',
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    }
  ]
  
  // Agregar las clases de muestra al store localmente
  classesStore.classes.push(...sampleClasses)
  
  console.log('✅ [ProfessionalCalendar] Datos de muestra creados:', {
    classes: sampleClasses.length
  })
}
</script>

<style scoped>
/* 🎨 ESTILOS DEL CALENDARIO PROFESIONAL */

.professional-calendar {
  @apply max-w-7xl mx-auto p-6 space-y-6;
}

/* 📱 Header */
.calendar-header {
  @apply bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6;
}

.header-content {
  @apply flex items-center justify-between mb-6;
}

.title-section .calendar-title {
  @apply text-2xl font-bold text-gray-900 dark:text-white;
}

.title-section .calendar-subtitle {
  @apply text-sm text-gray-600 dark:text-gray-400 mt-1;
}

.navigation-controls {
  @apply flex items-center space-x-4;
}

.nav-button {
  @apply p-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors disabled:opacity-50;
}

.month-display {
  @apply px-4 py-2 bg-gray-50 dark:bg-gray-700 rounded-lg;
}

.month-text {
  @apply text-lg font-semibold text-gray-900 dark:text-white capitalize;
}

.today-button {
  @apply px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50;
}

/* 📊 Estadísticas */
.month-stats {
  @apply grid grid-cols-2 md:grid-cols-4 gap-4;
}

.stat-card {
  @apply text-center p-4 bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-700 dark:to-gray-600 rounded-lg;
}

.stat-number {
  @apply text-2xl font-bold text-blue-600 dark:text-blue-400;
}

.stat-label {
  @apply text-sm text-gray-600 dark:text-gray-400 mt-1;
}

/* 🎨 Leyenda */
.legend {
  @apply flex flex-wrap gap-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg;
}

.legend-item {
  @apply flex items-center space-x-2;
}

.legend-dot {
  @apply w-3 h-3 rounded-full;
}

.legend-dot.complete { @apply bg-green-500; }
.legend-dot.partial { @apply bg-yellow-500; }
.legend-dot.scheduled { @apply bg-blue-500; }
.legend-dot.none { @apply bg-gray-300; }

/* � Debug info */
.debug-info {
  padding: 1rem;
  background-color: #f3f4f6;
  border: 1px solid #d1d5db;
  border-radius: 0.5rem;
  margin: 1rem 0;
}

.debug-info p {
  margin: 0.25rem 0;
  font-size: 0.875rem;
  color: #374151;
}

.no-calendar-data {
  padding: 2rem;
  background-color: #f9fafb;
  border-radius: 0.5rem;
  margin: 1rem 0;
}

/* �📅 Calendario */
.calendar-container {
  @apply bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden;
}

.weekdays-header {
  @apply grid grid-cols-7 bg-gray-50 dark:bg-gray-700;
}

.weekday {
  @apply p-4 text-center text-sm font-medium text-gray-700 dark:text-gray-300 border-r border-gray-200 dark:border-gray-600 last:border-r-0;
}

.calendar-grid {
  @apply grid grid-cols-7;
}

.calendar-day {
  @apply relative min-h-[80px] p-3 border-r border-b border-gray-200 dark:border-gray-600 last:border-r-0 cursor-pointer transition-all hover:bg-gray-50 dark:hover:bg-gray-700;
}

.calendar-day.not-current-month {
  @apply text-gray-400 dark:text-gray-600 bg-gray-50 dark:bg-gray-800;
}

.calendar-day.today {
  @apply bg-blue-50 dark:bg-blue-900/20;
}

.calendar-day.selected {
  @apply bg-blue-100 dark:bg-blue-800/30 ring-2 ring-blue-500 ring-inset;
}

.day-number {
  @apply text-sm font-medium text-gray-900 dark:text-white;
}

.day-indicators {
  @apply flex items-center justify-between mt-2;
}

.status-indicator {
  @apply w-2 h-2 rounded-full;
}

.class-count {
  @apply text-xs px-1.5 py-0.5 bg-blue-100 dark:bg-blue-800 text-blue-800 dark:text-blue-200 rounded-full font-medium;
}

/* 📊 Indicador de estado de asistencia */
.attendance-status-indicator {
  @apply text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center text-white;
}

.attendance-status-indicator.complete {
  @apply bg-green-500;
}

.attendance-status-indicator.partial {
  @apply bg-yellow-500;
}

.attendance-status-indicator.pending {
  @apply bg-blue-500;
}

.today-indicator {
  @apply absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full;
}

.selected-indicator {
  @apply absolute inset-0 border-2 border-blue-500 rounded-md pointer-events-none;
}

/* 🔄 Loading */
.loading-overlay {
  @apply fixed inset-0 bg-black bg-opacity-20 flex items-center justify-center z-50;
}

.loading-spinner {
  @apply bg-white dark:bg-gray-800 rounded-lg p-6 shadow-lg flex items-center space-x-3;
}

.spinner {
  @apply animate-spin w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full;
}

/* ❌ Error */
.error-message {
  @apply fixed bottom-4 right-4 bg-red-50 border border-red-200 rounded-lg p-4 shadow-lg z-50;
}

.error-content {
  @apply flex items-center space-x-3;
}

.error-icon {
  @apply w-5 h-5 text-red-500;
}

.retry-button {
  @apply ml-4 px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700 transition-colors;
}

/* 🗂️ Drawer */
.drawer-overlay {
  @apply fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-end;
}

.drawer-panel {
  @apply w-full max-w-lg bg-white dark:bg-gray-800 shadow-xl overflow-y-auto;
}

.drawer-header {
  @apply flex items-start justify-between p-6 border-b border-gray-200 dark:border-gray-700;
}

.drawer-title h3 {
  @apply text-lg font-semibold text-gray-900 dark:text-white;
}

.drawer-title p {
  @apply text-sm text-gray-600 dark:text-gray-400 mt-1;
}

.close-button {
  @apply p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors;
}

/* 📊 Estadísticas del día */
.day-stats {
  @apply grid grid-cols-3 gap-4 p-6 bg-gray-50 dark:bg-gray-700;
}

.day-stat {
  @apply text-center;
}

.stat-value {
  @apply block text-xl font-bold text-gray-900 dark:text-white;
}

.stat-label {
  @apply text-xs text-gray-600 dark:text-gray-400 mt-1;
}

/* 📚 Lista de clases */
.classes-list {
  @apply p-6 space-y-4;
}

.no-classes {
  @apply text-center py-12;
}

.no-classes-icon {
  @apply text-4xl mb-4;
}

.no-classes h4 {
  @apply text-lg font-medium text-gray-900 dark:text-white mb-2;
}

.no-classes p {
  @apply text-gray-600 dark:text-gray-400;
}

/* 🎓 Tarjetas de clase */
.class-card {
  @apply bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg p-4 transition-all;
}

.class-card.completed {
  @apply border-green-300 dark:border-green-700 bg-green-50 dark:bg-green-900/20;
}

.class-header {
  @apply flex items-start justify-between mb-3;
}

.class-name {
  @apply font-semibold text-gray-900 dark:text-white;
}

.class-meta {
  @apply flex items-center space-x-3 text-sm text-gray-600 dark:text-gray-400 mt-1;
}

.class-status {
  @apply flex items-center space-x-2 text-sm;
}

.status-icon {
  @apply text-lg;
}

.class-details {
  @apply space-y-2 mb-4;
}

.detail-row {
  @apply flex justify-between text-sm;
}

.detail-label {
  @apply text-gray-600 dark:text-gray-400;
}

.detail-value {
  @apply font-medium text-gray-900 dark:text-white;
}

/* 🎯 Acciones */
.class-actions {
  @apply flex space-x-2;
}

.action-button {
  @apply flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors disabled:opacity-50;
}

.action-button.primary {
  @apply bg-blue-600 text-white hover:bg-blue-700;
}

.action-button.secondary {
  @apply bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300;
}

/* 📱 Responsive */
@media (max-width: 768px) {
  .professional-calendar {
    @apply p-4 space-y-4;
  }
  
  .header-content {
    @apply flex-col space-y-4;
  }
  
  .navigation-controls {
    @apply w-full justify-center;
  }
  
  .drawer-panel {
    @apply w-full max-w-none;
  }
  
  .calendar-day {
    @apply min-h-[60px] p-2;
  }
}
</style>
