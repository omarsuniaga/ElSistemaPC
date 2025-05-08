
<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { useAttendanceStore } from '@/modulos/Attendance/store/attendance'
import { useClassesStore } from '@/modulos/Classes/store/classes'
import { useTeachersStore } from '@/modulos/Teachers/store/teachers'
import { format, parseISO, isAfter, isBefore, isWithinInterval, addDays, subDays } from 'date-fns'
import { es } from 'date-fns/locale'
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/vue/24/outline'

const attendanceStore = useAttendanceStore()
const classesStore = useClassesStore()
const teachersStore = useTeachersStore()

const isLoading = ref(true)
const error = ref<string | null>(null)
const now = ref(new Date())
const selectedDate = ref(new Date()) // Nueva ref para la fecha seleccionada

// Actualiza la hora cada minuto para monitoreo en tiempo real
let intervalId = null;
onMounted(() => {
  fetchData();
  now.value = new Date();
  selectedDate.value = new Date(); // Inicializar con la fecha actual
});
onUnmounted(() => {
  if (intervalId) clearInterval(intervalId);
})

async function fetchData() {
  try {
    isLoading.value = true
    await Promise.all([
      classesStore.fetchClasses(),
      teachersStore.fetchTeachers(),
      attendanceStore.fetchAttendanceDocuments()
    ])
  } catch (err: any) {
    error.value = 'Error al cargar datos de clases o asistencia'
  } finally {
    isLoading.value = false
  }
}

// Obtiene el índice del día seleccionado (0=domingo, 1=lunes, ...)
const selectedDayIndex = computed(() => selectedDate.value.getDay())

// Formato de la fecha seleccionada para mostrar en la UI
const formattedSelectedDate = computed(() => {
  return format(selectedDate.value, "EEEE, d 'de' MMMM", { locale: es })
})

// Función para ir al día anterior
function goToPreviousDay() {
  selectedDate.value = subDays(selectedDate.value, 1)
}

// Función para ir al día siguiente
function goToNextDay() {
  selectedDate.value = addDays(selectedDate.value, 1)
}

// Función para volver al día actual
function goToToday() {
  selectedDate.value = new Date()
}

// Usa un ref para forzar la reactividad de classesToday
const classesTodayData = ref([])

watch([
  () => attendanceStore.attendanceDocuments,
  () => classesStore.classes,
  selectedDate // Observar cambios en la fecha seleccionada en lugar de now
], () => {
  const formattedDate = format(selectedDate.value, 'yyyy-MM-dd')
  const allClasses = classesStore.getClassesByDay(selectedDayIndex.value) || []
  const attendanceDocs = attendanceStore.attendanceDocuments || []

  // Mapear clases con estado y datos de asistencia
  const mapped = allClasses.map(classItem => {
    const slot = classItem.schedule?.slots?.find(slot => {
      if (typeof slot.day === 'number') return slot.day === selectedDayIndex.value
      if (typeof slot.day === 'string') {
        const daysEs = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado']
        const daysEn = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']
        return (
          slot.day.toLowerCase() === daysEs[selectedDayIndex.value] ||
          slot.day.toLowerCase() === daysEn[selectedDayIndex.value]
        )
      }
      return false
    })
    const startTime = slot?.startTime || '00:00'
    const endTime = slot?.endTime || '23:59'
    const startDateTime = parseISO(`${formattedDate}T${startTime}`)
    const endDateTime = parseISO(`${formattedDate}T${endTime}`)
    let status = 'active'
    if (isBefore(now.value, startDateTime)) status = 'next'
    else if (isAfter(now.value, endDateTime)) status = 'finished'
    else if (isWithinInterval(now.value, { start: startDateTime, end: endDateTime })) status = 'active'

    // Buscar el maestro por ID y obtener su nombre
    const teacher = teachersStore.teachers.find(t => t.id === classItem.teacherId)
    const teacherName = teacher?.name || 'Profesor'

    // Buscar el documento de asistencia para esta clase en la fecha seleccionada
    const attendanceDoc = attendanceDocs.find(doc => doc.classId === classItem.id && doc.fecha === formattedDate)
    const presentCount = attendanceDoc ? (attendanceDoc.data.presentes?.length || 0) : 0
    const totalStudents = classItem.studentIds?.length || 0
    return {
      id: classItem.id,
      name: classItem.name,
      startTime,
      endTime,
      status,
      teacherName,
      classroom: classItem.classroom,
      presentCount,
      totalStudents
    }
  })
  mapped.sort((a, b) => {
    type StatusType = 'active' | 'next' | 'finished';
    const order: Record<StatusType, number> = { active: 0, next: 1, finished: 2 }
    if (order[a.status as StatusType] !== order[b.status as StatusType]) return order[a.status as StatusType] - order[b.status as StatusType]
    return a.startTime.localeCompare(b.startTime)
  })
  classesTodayData.value = mapped
}, { immediate: true })

const classesToday = ref([])
watch(classesTodayData, (newClasses) => {
  classesToday.value = newClasses
})

// Helpers
function formatTime(time: string) {
  if (!time) return '--:--'
  if (/^\d{2}:\d{2}$/.test(time)) return time
  try {
    const date = new Date(`1970-01-01T${time}`)
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  } catch {
    return time
  }
}
function getStatusClass(status: string) {
  switch (status) {
    case 'active': return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
    case 'finished': return 'bg-gray-200 text-gray-600 dark:bg-gray-700 dark:text-gray-300'
    case 'next': return 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300'
    default: return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
  }
}
function getStatusLabel(status: string) {
  switch (status) {
    case 'active': return 'Activa'
    case 'finished': return 'Finalizada'
    case 'next': return 'Próxima'
    default: return 'Activa'
  }
}

// Determinar si estamos viendo el día actual
const isToday = computed(() => {
  const today = new Date()
  return (
    selectedDate.value.getDate() === today.getDate() &&
    selectedDate.value.getMonth() === today.getMonth() &&
    selectedDate.value.getFullYear() === today.getFullYear()
  )
})
</script>
<template>
  <section class="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden" aria-labelledby="today-classes-title">
    <!-- Navegación de días -->
    <div class="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
      <button 
        @click="goToPreviousDay" 
        class="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
        aria-label="Día anterior"
      >
        <ChevronLeftIcon class="h-5 w-5 text-gray-600 dark:text-gray-300" />
      </button>
      
      <div class="flex flex-col items-center">
        <h2 class="text-lg font-semibold text-gray-900 dark:text-white capitalize">
          {{ formattedSelectedDate }}
        </h2>
        <button 
          v-if="!isToday" 
          @click="goToToday" 
          class="text-xs text-blue-600 dark:text-blue-400 hover:underline mt-1"
        >
          Volver a hoy
        </button>
      </div>
      
      <button 
        @click="goToNextDay" 
        class="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
        aria-label="Día siguiente"
      >
        <ChevronRightIcon class="h-5 w-5 text-gray-600 dark:text-gray-300" />
      </button>
    </div>

    <div v-if="isLoading" class="flex justify-center items-center p-6">
      <div class="animate-pulse flex flex-col items-center">
        <div class="rounded-full bg-gray-200 dark:bg-gray-700 h-10 w-10 mb-2"></div>
        <div class="text-sm text-gray-500 dark:text-gray-400">Cargando clases...</div>
      </div>
    </div>

    <div v-else-if="error" class="p-6 text-center text-red-600 dark:text-red-400">
      <p>{{ error }}</p>
    </div>

    <div v-else>
      <ul v-if="classesToday.length > 0" class="divide-y divide-gray-200 dark:divide-gray-700" aria-label="Lista de clases programadas para hoy">
        <li v-for="classItem in classesToday" :key="classItem.id" class="p-4 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
          <div>
            <div class="flex items-center gap-2">
              <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
                :class="getStatusClass(classItem.status)">
                {{ getStatusLabel(classItem.status) }}
              </span>
              <span class="text-xs text-gray-500 dark:text-gray-400">
                {{ formatTime(classItem.startTime) }} - {{ formatTime(classItem.endTime) }}
              </span>
            </div>
            <div class="mt-1 font-semibold text-gray-900 dark:text-white">
              {{ classItem.name }}
            </div>
            <div class="text-xs text-gray-500 dark:text-gray-400">
              Maestro: {{ classItem.teacherName }} | {{ classItem.classroom || 'Sin asignar' }}
            </div>
          </div>
          <div class="flex flex-col items-end">
            <span class="text-sm font-medium">
              {{ classItem.presentCount }}/{{ classItem.totalStudents }} alumnos presentes
            </span>
            <span v-if="classItem.status === 'next'" class="text-xs text-indigo-600 dark:text-indigo-300 mt-1">
              Próxima clase
            </span>
          </div>
        </li>
      </ul>
      <div v-else class="p-6 text-center text-gray-500 dark:text-gray-400">
        No hay clases programadas para este día
      </div>
    </div>
  </section>
</template>
