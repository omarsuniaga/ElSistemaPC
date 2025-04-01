<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useClassesStore } from '../../Classes/store/classes'
import { format } from 'date-fns'
import { XMarkIcon, ClockIcon, MapPinIcon, UserGroupIcon } from '@heroicons/vue/24/outline'
import { MusicalNoteIcon } from '@heroicons/vue/24/solid'

// Estado reactivo para la clase seleccionada
const selectedClass = ref(null)

// Array de días de la semana a mostrar en el calendario
const weekDays = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado']

// Props del componente: teacherId y clases (opcional)
const props = defineProps<{
  teacherId?: string
  classes?: any[]
}>()

const classesStore = useClassesStore()

// Computed para obtener las clases del profesor, ya sea por prop o filtrando en el store
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

// Computed que agrupa las clases por día usando la función normalizeSchedule
const classesByDay = computed(() => {
  const map: Record<string, any[]> = {}
  weekDays.forEach(day => {
    map[day] = teacherClasses.value.filter(c => {
      const normalized = normalizeSchedule(c.schedule)
      return normalized.some(s => s.day === day)
    })
  })
  return map
})

// Cargar las clases al montar el componente si aún no se han cargado
onMounted(async () => {
  if (classesStore.classes.length === 0) {
    await classesStore.fetchClasses()
  }
})

// Observar cambios en el teacherId para recargar las clases si es necesario
watch(() => props.teacherId, async (newVal) => {
  if (newVal && classesStore.classes.length === 0) {
    await classesStore.fetchClasses()
  }
})

// Función que devuelve el color de fondo de la clase según su instrumento
const getClassBackgroundColor = (clase) => {
  const instrument = clase.instrument?.toLowerCase() || ''
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
  return 'bg-gray-100 border border-gray-300 text-gray-800 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-200'
}

// Función para formatear el rango horario de la clase (inicio - fin)
const formatClassTime = (clase) => {
  const schedule = normalizeSchedule(clase.schedule)[0]
  if (!schedule) return ''
  return `${schedule.startTime} - ${schedule.endTime}`
}

// Función para formatear el horario completo con día e intervalo
const formatClassSchedule = (clase) => {
  const schedule = normalizeSchedule(clase.schedule)[0]
  if (!schedule) return 'Sin horario asignado'
  return `${schedule.day} ${schedule.startTime} - ${schedule.endTime}`
}

// Función para normalizar diferentes formatos de horario a un formato estándar
const normalizeSchedule = (schedule) => {
  if (!schedule) return []
  
  // Si el horario es un arreglo, se asume estructura correcta
  if (Array.isArray(schedule)) {
    return schedule.map(s => ({
      day: s.day || 'Lunes',
      startTime: s.startTime || '08:00',
      endTime: s.endTime || '09:30'
    }))
  }
  
  // Si es un objeto con propiedad days (array o único valor)
  if (typeof schedule === 'object' && schedule.days) {
    const days = Array.isArray(schedule.days) ? schedule.days : [schedule.days]
    return days.map(day => ({
      day: day,
      startTime: schedule.startTime || '08:00',
      endTime: schedule.endTime || '09:30'
    }))
  }
  
  // Si es un string en formato antiguo (ej. "Lunes 14:30 - 16:00")
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

// Función para seleccionar una clase y mostrar sus detalles
const selectClass = (clase) => {
  selectedClass.value = clase
}

// Función que retorna la fecha actual en formato "yyyyMMdd" para usar en la URL
const getCurrentDate = () => {
  return format(new Date(), 'yyyyMMdd')
}
</script>
<template>
  <!-- Contenedor principal utilizando elementos semánticos -->
  <section class="teacher-weekly-schedule p-4 max-w-full mx-auto">
    <!-- Listado de clases agrupadas por día -->
    <div class="space-y-8">
      <!-- Se recorre el arreglo de días -->
      <section v-for="day in weekDays" :key="day" class="day-section">
        <!-- Encabezado semántico para cada día -->
        <header class="day-header border-b-2 border-gray-200 pb-2">
          <h3 class="text-xl font-semibold text-gray-900 dark:text-white">{{ day }}</h3>
        </header>
        
        <div class="class-list mt-4">
          <!-- Se recorre la lista de clases filtradas para el día actual -->
          <article
            v-for="clase in classesByDay[day]"
            :key="clase.id"
            :class="['class-item cursor-pointer transition rounded-lg p-4 shadow', getClassBackgroundColor(clase)]"
            @click="selectClass(clase)"
          >
            <div class="class-item-content flex flex-col gap-2">
              <!-- Nombre de la clase -->
              <div class="class-name font-semibold text-lg text-gray-900 dark:text-white">
                {{ clase.name }}
              </div>
              <!-- Detalles de la clase -->
              <div class="class-details flex flex-wrap gap-2 text-sm">
                <div class="class-time flex items-center text-gray-600 dark:text-gray-400">
                  <ClockIcon class="h-4 w-4 mr-1" />
                  <span>{{ formatClassTime(clase) }}</span>
                </div>
                <div v-if="clase.classroom" class="class-location flex items-center text-gray-600 dark:text-gray-400">
                  <MapPinIcon class="h-4 w-4 mr-1" />
                  <span>{{ clase.classroom }}</span>
                </div>
                <div v-if="clase.instrument" class="class-instrument flex items-center text-gray-600 dark:text-gray-400">
                  <MusicalNoteIcon class="h-4 w-4 mr-1" />
                  <span>{{ clase.instrument }}</span>
                </div>
                <div class="class-students flex items-center text-gray-600 dark:text-gray-400">
                  <UserGroupIcon class="h-4 w-4 mr-1" />
                  <span>{{ clase.studentIds?.length || 0 }} estudiantes</span>
                </div>
              </div>
            </div>
          </article>
          
          <!-- Mensaje cuando no hay clases programadas para el día -->
          <div v-if="classesByDay[day].length === 0" class="empty-day p-4 text-center italic text-gray-500 bg-gray-50 rounded">
            <p>No hay clases programadas</p>
          </div>
        </div>
      </section>
    </div>

    <!-- Panel de detalle de la clase seleccionada, utilizando un elemento semántico <aside> -->
    <aside v-if="selectedClass" class="selected-class-detail mt-8 p-6 rounded bg-white shadow border-l-4 border-indigo-600 dark:bg-gray-800">
      <header class="selected-class-header flex justify-between items-center mb-6">
        <h3 class="selected-class-title text-2xl font-bold text-gray-900 dark:text-white">{{ selectedClass.name }}</h3>
        <button @click="selectedClass = null" class="close-button text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white">
          <XMarkIcon class="h-5 w-5" />
        </button>
      </header>
      <div class="selected-class-info grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div class="info-item">
          <div class="info-label text-sm text-gray-500 dark:text-gray-400">Horario</div>
          <div class="info-value font-medium text-gray-900 dark:text-white">{{ formatClassSchedule(selectedClass) }}</div>
        </div>
        <div class="info-item">
          <div class="info-label text-sm text-gray-500 dark:text-gray-400">Aula</div>
          <div class="info-value font-medium text-gray-900 dark:text-white">{{ selectedClass.classroom || 'Sin asignar' }}</div>
        </div>
        <div class="info-item">
          <div class="info-label text-sm text-gray-500 dark:text-gray-400">Instrumento</div>
          <div class="info-value font-medium text-gray-900 dark:text-white">{{ selectedClass.instrument || 'No especificado' }}</div>
        </div>
        <div class="info-item">
          <div class="info-label text-sm text-gray-500 dark:text-gray-400">Estudiantes</div>
          <div class="info-value font-medium text-gray-900 dark:text-white">{{ selectedClass.studentIds?.length || 0 }} estudiantes</div>
        </div>
      </div>
      <footer class="selected-class-actions flex justify-end">
        <router-link
          :to="`/teacher/attendance/${getCurrentDate()}/${selectedClass.id}`"
          class="attendance-button inline-block px-4 py-2 bg-indigo-600 text-white font-medium rounded hover:bg-indigo-700"
        >
          Tomar asistencia
        </router-link>
      </footer>
    </aside>
  </section>
</template>

<style scoped>
/* Estilos generales del componente */
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

/* Estilos para el panel de detalle de clase */
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
  text-decoration: none;
}

/* Ajustes responsivos */
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
