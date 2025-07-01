<script setup lang="ts">
import {computed} from "vue"
import {useTeachersStore} from "../store/teachers"
import {useClassesStore} from "../../Classes/store/classes"
import {format} from "date-fns"
import {es} from "date-fns/locale"

const props = defineProps<{
  teacherId: string
}>()

const teachersStore = useTeachersStore()
const classesStore = useClassesStore()

interface Schedule {
  day: string
  startTime: string
  endTime: string
}

interface ScheduleSlot {
  day: string
  startTime: string
  endTime: string
}

interface ClassItem {
  id: string
  name: string
  schedule?: any
  scheduleDay?: any
  teacherId: string
  studentIds?: string[]
  classroom?: string
  startTime?: string
  endTime?: string
  studentCount?: number
}

// Get teacher data
const teacher = computed(() => {
  return teachersStore.getTeacherById(props.teacherId)
})

// Get teacher's classes
const teacherClasses = computed((): ClassItem[] => {
  return classesStore.classes
    .filter(
      (c): c is typeof c & {teacherId: string} =>
        typeof c.teacherId === "string" && c.teacherId === props.teacherId
    )
    .map((c) => ({
      ...c,
      teacherId: c.teacherId,
    }))
})

// Normalize schedule format
const normalizeSchedule = (schedule: any): Schedule[] => {
  if (!schedule) return []

  // Si es array, se asume estructura correcta
  if (Array.isArray(schedule)) {
    return schedule.map((s) => ({
      day: s.day || "Lunes",
      startTime: s.startTime || "08:00",
      endTime: s.endTime || "09:30",
    }))
  }

  // Si es objeto con slots
  if (schedule.slots && Array.isArray(schedule.slots)) {
    return schedule.slots.map((slot: ScheduleSlot) => ({
      day: slot.day,
      startTime: slot.startTime,
      endTime: slot.endTime,
    }))
  }

  // Si es objeto con days como array
  if (typeof schedule === "object" && schedule.days) {
    const days = Array.isArray(schedule.days) ? schedule.days : [schedule.days]
    return days.map((day: string) => ({
      day,
      startTime: schedule.startTime || "08:00",
      endTime: schedule.endTime || "09:30",
    }))
  }

  // Si es string (formato antiguo: "Lunes 14:30 - 16:00")
  if (typeof schedule === "string") {
    const parts = schedule.split(" ")
    if (parts.length >= 4) {
      return [
        {
          day: parts[0],
          startTime: parts[1],
          endTime: parts[3],
        },
      ]
    }
  }

  return []
}

// Calculate total weekly hours considering all schedule formats
const totalWeeklyHours = computed(() => {
  let total = 0
  teacherClasses.value.forEach((classItem) => {
    if (!classItem.schedule) return

    const normalizedSchedule = normalizeSchedule(classItem.schedule)
    normalizedSchedule.forEach((slot: Schedule) => {
      const [startHour, startMinute] = slot.startTime.split(":").map(Number)
      const [endHour, endMinute] = slot.endTime.split(":").map(Number)
      const duration = endHour - startHour + (endMinute - startMinute) / 60
      total += duration
    })
  })
  return Math.round(total * 10) / 10 // Redondear a 1 decimal
})

// Group classes by day with normalized schedules
const classesByDay = computed(() => {
  const days: Record<string, ClassItem[]> = {
    Lunes: [],
    Martes: [],
    Miércoles: [],
    Jueves: [],
    Viernes: [],
    Sábado: [],
    Domingo: [],
  }

  teacherClasses.value.forEach((classItem) => {
    const normalizedSchedule = normalizeSchedule(classItem.schedule)

    normalizedSchedule.forEach((slot: Schedule) => {
      if (days[slot.day]) {
        days[slot.day].push({
          ...classItem,
          startTime: slot.startTime,
          endTime: slot.endTime,
          studentCount: classItem.studentIds?.length || 0,
        })
      }
    })
  })

  // Sort classes by time for each day
  Object.keys(days).forEach((day) => {
    days[day].sort((a, b) => {
      const timeA = (a.startTime || "").split(":").map(Number)
      const timeB = (b.startTime || "").split(":").map(Number)
      return timeA[0] * 60 + timeA[1] - (timeB[0] * 60 + timeB[1])
    })
  })

  return days
})

// Format time to display duration
const formatDuration = (startTime: string | undefined, endTime: string | undefined): string => {
  if (!startTime || !endTime) return "N/A"

  const [startHour, startMinute] = startTime.split(":").map(Number)
  const [endHour, endMinute] = endTime.split(":").map(Number)
  const durationInMinutes = endHour * 60 + endMinute - (startHour * 60 + startMinute)
  const hours = Math.floor(durationInMinutes / 60)
  const minutes = durationInMinutes % 60

  if (hours === 0) {
    return `${minutes} min`
  }
  return minutes === 0 ? `${hours} Hrs` : `${hours} Hrs ${minutes} Min`
}

// Get list of unique subjects
const subjects = computed(() => {
  const uniqueSubjects = new Set<string>()
  teacherClasses.value.forEach((classItem) => {
    uniqueSubjects.add(classItem.name)
  })
  return Array.from(uniqueSubjects)
})

// Format current date
const currentDate = computed(() => {
  return format(new Date(), "dd/MM/yyyy", {locale: es})
})
</script>

<template>
  <div id="schedule-pdf" class="bg-white p-8 max-w-4xl mx-auto">
    <!-- Header -->
    <div class="flex items-center justify-between mb-6 border-b pb-4">
      <div class="flex items-center gap-4">
        <img src="@/assets/ElSistemaPCLogo.jpeg" alt="El Sistema PC Logo" class="h-16 w-auto" />
        <div>
          <h1 class="text-2xl font-bold">El Sistema Punta Cana</h1>
          <p class="text-gray-600">Horario Semanal</p>
        </div>
      </div>
    </div>

    <!-- Teacher Info -->
    <div class="mb-6">
      <h2 class="text-xl mb-2">
        Maestro: <span class="font-bold">{{ teacher?.name }}</span>
      </h2>
      <div class="flex gap-6 text-sm text-gray-600">
        <p>Asignaturas: {{ subjects.join(", ") }}</p>
        <p>Horas Semanales: {{ totalWeeklyHours }} horas</p>
      </div>
    </div>

    <!-- Schedule by Day -->
    <div class="space-y-6">
      <template v-for="(dayClasses, day) in classesByDay" :key="day">
        <div v-if="dayClasses.length > 0">
          <h3 class="text-lg font-bold mb-3">{{ day }}:</h3>
          <div class="space-y-4 pl-4">
            <div
              v-for="class_ in dayClasses"
              :key="class_.id"
              class="border-l-2 border-gray-200 pl-4"
            >
              <div class="text-lg font-semibold">
                {{ class_.name }} - {{ class_.startTime }} a {{ class_.endTime }}
              </div>
              <div class="text-gray-600">
                <p>Salón {{ class_.classroom }}</p>
                <p>{{ class_.studentCount }} Alumnos</p>
                <p>Tiempo: {{ formatDuration(class_.startTime, class_.endTime) }}</p>
              </div>
            </div>
          </div>
        </div>
      </template>
    </div>

    <!-- Footer -->
    <div class="mt-8 pt-4 border-t text-sm text-gray-500">
      <p>Última Actualización: {{ currentDate }}</p>
      <p class="mt-2">
        Estos horarios pueden ser sujetos a cambios, si presenta algún inconveniente por favor
        preguntar en administración para ser gestionado correctamente.
      </p>
    </div>
  </div>
</template>

<style scoped>
@media print {
  #schedule-pdf {
    padding: 20mm;
  }

  @page {
    margin: 0;
    size: A4;
  }
}
</style>
