<template>
  <div class="teacher-weekly-schedule">
    <!-- Listado de clases por día -->
    <div class="space-y-8">
      <div v-for="day in weekDays" :key="day" class="day-section">
        <div class="day-header">
          <h3 class="text-xl font-semibold text-gray-900 dark:text-white">{{ day }}</h3>
        </div>
        
        <div class="class-list">
          <div 
            v-for="class_ in teacherClasses.filter(c => normalizeSchedule(c.schedule).some(s => s.day === day))" 
            :key="class_.id"
            :class="['class-item', getClassBackgroundColor(class_)]"
            @click="selectClass(class_)"
          >
            <div class="class-item-content">
              <div class="class-name">{{ class_.name }}</div>
              
              <div class="class-details">
                <div class="class-time">
                  <ClockIcon class="h-4 w-4 mr-1" />
                  <span>{{ formatClassTime(class_) }}</span>
                </div>
                
                <div v-if="class_.classroom" class="class-location">
                  <MapPinIcon class="h-4 w-4 mr-1" />
                  <span>{{ class_.classroom }}</span>
                </div>
                
                <div v-if="class_.instrument" class="class-instrument">
                  <MusicalNoteIcon class="h-4 w-4 mr-1" />
                  <span>{{ class_.instrument }}</span>
                </div>
                
                <div class="class-students">
                  <UserGroupIcon class="h-4 w-4 mr-1" />
                  <span>{{ class_.studentIds?.length || 0 }} estudiantes</span>
                </div>
              </div>
            </div>
          </div>
          
          <div v-if="!teacherClasses.some(c => normalizeSchedule(c.schedule).some((s: { day: string }) => s.day === day))" class="empty-day">
            <p>No hay clases programadas</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Detalle de clase seleccionada -->
    <div v-if="selectedClass" class="selected-class-detail">
      <div class="selected-class-header">
        <h3 class="selected-class-title">{{ selectedClass.name }}</h3>
        <button @click="selectedClass = null" class="close-button">
          <XMarkIcon class="h-5 w-5" />
        </button>
      </div>

      <div class="selected-class-info">
        <div class="info-item">
          <div class="info-label">Horario</div>
          <div class="info-value">{{ formatClassSchedule(selectedClass) }}</div>
        </div>
        <div class="info-item">
          <div class="info-label">Aula</div>
          <div class="info-value">{{ selectedClass.classroom || 'Sin asignar' }}</div>
        </div>
        <div class="info-item">
          <div class="info-label">Instrumento</div>
          <div class="info-value">{{ selectedClass.instrument || 'No especificado' }}</div>
        </div>
        <div class="info-item">
          <div class="info-label">Estudiantes</div>
          <div class="info-value">{{ selectedClass.studentIds?.length || 0 }} estudiantes</div>
        </div>
      </div>

      <div class="selected-class-actions">
        <router-link
          :to="`/teacher/attendance/${getCurrentDate()}/${selectedClass.id}`"
          class="attendance-button"
        >
          Tomar asistencia
        </router-link>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useClassesStore } from '../../Classes/store/classes'
import { format } from 'date-fns'
import { XMarkIcon, ClockIcon, MapPinIcon, UserGroupIcon } from '@heroicons/vue/24/outline'
import { MusicalNoteIcon } from '@heroicons/vue/24/solid'

// Estado reactivo
const selectedClass = ref(null)

// Días de la semana para mostrar en el calendario
const weekDays = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado']

const props = defineProps<{
  teacherId?: string
  classes?: any[]
}>()

const classesStore = useClassesStore()

// Clases del profesor (ahora puede ser pasado como prop o consultado al store)
const teacherClasses = computed(() => {
  if (props.classes && props.classes.length > 0) {
    return props.classes
  }
  
  if (!props.teacherId) {
    console.warn('TeacherWeeklySchedule: teacherId prop is required')
    return []
  }
  return classesStore.classes.filter(c => c.teacherId === props.teacherId)
})

// Cargar clases si aún no están cargadas
onMounted(async () => {
  if (classesStore.classes.length === 0) {
    await classesStore.fetchClasses()
  }
})

// Observar cambios en el teacherId
watch(() => props.teacherId, async (newVal) => {
  if (newVal && classesStore.classes.length === 0) {
    await classesStore.fetchClasses()
  }
})

// Obtener clases para un día y hora específicos
const getClassesForDayAndHour = (day, hour) => {
  return teacherClasses.value.filter(class_ => {
    if (!class_.schedule) return false
    
    // Normalizar el formato de horario
    const schedule = normalizeSchedule(class_.schedule)
    
    return schedule.some(s => {
      if (s.day !== day) return false
      
      const startHour = parseInt(s.startTime.split(':')[0])
      const endHour = parseInt(s.endTime.split(':')[0])
      const startMinutes = parseInt(s.startTime.split(':')[1])
      const endMinutes = parseInt(s.endTime.split(':')[1])
      
      // Si la clase comienza en esta hora o está en curso durante esta hora
      return (startHour === hour) || 
             (startHour < hour && endHour > hour) ||
             (startHour < hour && endHour === hour && endMinutes > 0)
    })
  })
}

// Calcular la posición y altura de una clase en la cuadrícula
const getClassPositionStyle = (class_, slotHour) => {
  const schedule = normalizeSchedule(class_.schedule)[0] // Tomar el primer horario
  if (!schedule) return {}
  
  const startHour = parseInt(schedule.startTime.split(':')[0])
  const startMinute = parseInt(schedule.startTime.split(':')[1])
  const endHour = parseInt(schedule.endTime.split(':')[0])
  const endMinute = parseInt(schedule.endTime.split(':')[1])
  
  // Calcular la posición superior (top) basada en minutos después de la hora
  let top = '0%'
  if (startHour === slotHour) {
    top = `${(startMinute / 60) * 100}%`
  }
  
  // Calcular la altura basada en la duración
  let height = '100%'
  if (startHour === slotHour) {
    const durationInMinutes = (endHour - startHour) * 60 + (endMinute - startMinute)
    const slotDurationInMinutes = 60 - startMinute
    
    if (durationInMinutes < slotDurationInMinutes) {
      height = `${(durationInMinutes / 60) * 100}%`
    } else {
      height = `${(slotDurationInMinutes / 60) * 100}%`
    }
  }
  
  return {
    top,
    height,
    left: '2px',
    right: '2px'
  }
}

// Obtener color de fondo para la clase basado en algún criterio (ej: instrumento)
const getClassBackgroundColor = (class_) => {
  const instrument = class_.instrument?.toLowerCase() || ''
  
  if (instrument.includes('piano')) {
    return 'bg-blue-100 border border-blue-300 text-blue-800 dark:bg-blue-900/20 dark:border-blue-700 dark:text-blue-200'
  }
  if (instrument.includes('violin') || instrument.includes('viola') || instrument.includes('cello')) {
    return 'bg-purple-100 border border-purple-300 text-purple-800 dark:bg-purple-900/20 dark:border-purple-700 dark:text-purple-200'
  }
  if (instrument.includes('flauta') || instrument.includes('clarinete') || instrument.includes('saxo')) {
    return 'bg-green-100 border border-green-300 text-green-800 dark:bg-green-900/20 dark:border-green-700 dark:text-green-200'
  }
  if (instrument.includes('percusión') || instrument.includes('batería')) {
    return 'bg-yellow-100 border border-yellow-300 text-yellow-800 dark:bg-yellow-900/20 dark:border-yellow-700 dark:text-yellow-200'
  }
  
  // Valor predeterminado
  return 'bg-gray-100 border border-gray-300 text-gray-800 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-200'
}

// Formatear la hora (de 24h a 12h con AM/PM)
const formatTime = (hour) => {
  return `${hour}:00`
}

// Formatear la hora de la clase
const formatClassTime = (class_) => {
  const schedule = normalizeSchedule(class_.schedule)[0]
  if (!schedule) return ''
  return `${schedule.startTime} - ${schedule.endTime}`
}

// Formatear el horario completo de la clase
const formatClassSchedule = (class_) => {
  const schedule = normalizeSchedule(class_.schedule)[0]
  if (!schedule) return 'Sin horario asignado'
  return `${schedule.day} ${schedule.startTime} - ${schedule.endTime}`
}

// Función para normalizar diferentes formatos de horario
const normalizeSchedule = (schedule) => {
  if (!schedule) return []
  
  // Si es array, se asume estructura correcta
  if (Array.isArray(schedule)) {
    return schedule.map(s => ({
      day: s.day || 'Lunes',
      startTime: s.startTime || '08:00',
      endTime: s.endTime || '09:30'
    }))
  }
  
  // Si es objeto con days como array
  if (typeof schedule === 'object' && schedule.days) {
    const days = Array.isArray(schedule.days) ? schedule.days : [schedule.days]
    return days.map(day => ({
      day: day,
      startTime: schedule.startTime || '08:00',
      endTime: schedule.endTime || '09:30'
    }))
  }
  
  // Si es string (formato antiguo: "Lunes 14:30 - 16:00")
  if (typeof schedule === 'string') {
    const parts = schedule.split(' ')
    if (parts.length >= 4) {
      return [{
        day: parts[0],
        startTime: parts[1],
        endTime: parts[3]
      }]
    }
  }
  
  return []
}

// Seleccionar una clase para mostrar sus detalles
const selectClass = (class_) => {
  selectedClass.value = class_
}

// Fecha actual para la URL de asistencia
const getCurrentDate = () => {
  return format(new Date(), 'yyyyMMdd')
}
</script>

<style scoped>
.teacher-weekly-schedule {
  max-width: 100%;
  margin: 0 auto;
  padding: 1rem;
}

.day-section {
  margin-bottom: 2rem;
}

.day-header {
  padding: 0.75rem 0;
  margin-bottom: 0.75rem;
  border-bottom: 2px solid #e5e7eb;
}

.class-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.class-item {
  padding: 1rem;
  border-radius: 0.5rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  cursor: pointer;
  transition: transform 0.2s, box-shadow 0.2s;
}

.class-item:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.class-item-content {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.class-name {
  font-weight: 600;
  font-size: 1.125rem;
  color: #111827;
}

.dark .class-name {
  color: #f9fafb;
}

.class-details {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  font-size: 0.875rem;
}

.class-time, .class-location, .class-instrument, .class-students {
  display: flex;
  align-items: center;
  color: #4b5563;
}

.dark .class-time, .dark .class-location, .dark .class-instrument, .dark .class-students {
  color: #9ca3af;
}

.empty-day {
  padding: 2rem;
  text-align: center;
  color: #6b7280;
  font-style: italic;
  background-color: #f9fafb;
  border-radius: 0.5rem;
}

.dark .empty-day {
  background-color: #1f2937;
  color: #9ca3af;
}

/* Selected class detail styles */
.selected-class-detail {
  margin-top: 2rem;
  padding: 1.5rem;
  border-radius: 0.5rem;
  background-color: white;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  border-left: 4px solid #4f46e5;
}

.dark .selected-class-detail {
  background-color: #1f2937;
  border-left-color: #6366f1;
}

.selected-class-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
}

.selected-class-title {
  font-size: 1.25rem;
  font-weight: 700;
  color: #111827;
}

.dark .selected-class-title {
  color: #f9fafb;
}

.close-button {
  color: #6b7280;
  transition: color 0.2s;
}

.close-button:hover {
  color: #111827;
}

.dark .close-button:hover {
  color: #f9fafb;
}

.selected-class-info {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 1.5rem;
  margin-bottom: 1.5rem;
}

.info-item {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.info-label {
  font-size: 0.875rem;
  color: #6b7280;
}

.dark .info-label {
  color: #9ca3af;
}

.info-value {
  font-weight: 500;
  color: #111827;
}

.dark .info-value {
  color: #f9fafb;
}

.selected-class-actions {
  display: flex;
  justify-content: flex-end;
}

.attendance-button {
  display: inline-block;
  padding: 0.5rem 1rem;
  background-color: #4f46e5;
  color: white;
  font-weight: 500;
  font-size: 0.875rem;
  border-radius: 0.375rem;
  transition: background-color 0.2s;
  text-decoration: none;
}

.attendance-button:hover {
  background-color: #4338ca;
}

/* Responsive adjustments */
@media (max-width: 640px) {
  .class-details {
    flex-direction: column;
    gap: 0.5rem;
  }
  
  .selected-class-info {
    grid-template-columns: 1fr;
  }
}
</style>
