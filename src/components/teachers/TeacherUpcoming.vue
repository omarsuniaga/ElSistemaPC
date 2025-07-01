<template>
  <div class="teacher-upcoming">
    <!-- Selector de rango de fechas -->
    <div class="flex flex-col sm:flex-row justify-between items-center gap-4 mb-6">
      <h2 class="text-lg font-semibold">Próximas Clases</h2>

      <div class="flex space-x-2">
        <button
          class="btn"
          :class="
            dateRange === 'today'
              ? 'bg-blue-600 hover:bg-blue-700 text-white'
              : 'bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600'
          "
          @click="setDateRange('today')"
        >
          Hoy
        </button>
        <button
          class="btn"
          :class="
            dateRange === 'week'
              ? 'bg-blue-600 hover:bg-blue-700 text-white'
              : 'bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600'
          "
          @click="setDateRange('week')"
        >
          Esta Semana
        </button>
        <button
          class="btn"
          :class="
            dateRange === 'month'
              ? 'bg-blue-600 hover:bg-blue-700 text-white'
              : 'bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600'
          "
          @click="setDateRange('month')"
        >
          Este Mes
        </button>
      </div>
    </div>

    <!-- Vista de Timeline -->
    <div class="mb-6">
      <!-- Clases de hoy -->
      <div class="mb-8">
        <h3 class="text-md font-semibold mb-4 flex items-center text-blue-700 dark:text-blue-400">
          <CalendarIcon class="w-5 h-5 mr-2" />
          {{ formatDateTitle(today) }}
        </h3>

        <div
          class="timeline relative pl-8 before:absolute before:left-3 before:top-2 before:bottom-2 before:w-0.5 before:bg-blue-200 dark:before:bg-blue-900/50"
        >
          <div
            v-if="getTodayClasses().length === 0"
            class="py-4 text-gray-500 dark:text-gray-400 text-sm"
          >
            No hay clases programadas para hoy.
          </div>

          <div
            v-for="event in getTodayClasses()"
            :key="event.id"
            class="timeline-item relative mb-8 last:mb-0"
          >
            <!-- Indicador de tiempo -->
            <div
              class="absolute -left-8 w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center"
            >
              <ClockIcon class="w-3 h-3 text-white" />
            </div>

            <!-- Hora -->
            <div class="text-sm font-semibold text-blue-600 dark:text-blue-400 mb-1">
              {{ formatTime(event.startDateTime) }} - {{ formatTime(event.endDateTime) }}
            </div>

            <!-- Contenido del evento -->
            <div class="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
              <div class="p-4">
                <div class="flex flex-col md:flex-row md:items-center justify-between gap-3">
                  <div>
                    <h4 class="text-lg font-medium">{{ event.title }}</h4>
                    <p class="text-gray-600 dark:text-gray-400 text-sm mb-2">
                      {{ event.location }}
                    </p>

                    <div class="flex flex-wrap gap-2">
                      <span
                        class="px-2 py-1 text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200 rounded-full"
                      >
                        {{ event.instrument || "Múltiples instrumentos" }}
                      </span>
                      <span
                        class="px-2 py-1 text-xs bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-200 rounded-full"
                      >
                        {{ event.level || "Todos los niveles" }}
                      </span>
                    </div>
                  </div>

                  <div class="flex items-center space-x-3">
                    <div class="flex items-center">
                      <UserGroupIcon class="w-5 h-5 text-gray-500 mr-1" />
                      <span class="text-sm">{{ event.studentCount }} estudiantes</span>
                    </div>

                    <button
                      class="btn bg-blue-600 text-white hover:bg-blue-700"
                      @click="goToClass(event.classId)"
                    >
                      Ver Clase
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Clases próximas -->
      <template v-for="(group, index) in groupedUpcomingClasses" :key="index">
        <div class="mb-8">
          <h3 class="text-md font-semibold mb-4 flex items-center text-gray-700 dark:text-gray-300">
            <CalendarIcon class="w-5 h-5 mr-2" />
            {{ formatDateTitle(group.date) }}
          </h3>

          <div
            class="timeline relative pl-8 before:absolute before:left-3 before:top-2 before:bottom-2 before:w-0.5 before:bg-gray-200 dark:before:bg-gray-700"
          >
            <div
              v-for="event in group.events"
              :key="event.id"
              class="timeline-item relative mb-8 last:mb-0"
            >
              <!-- Indicador de tiempo -->
              <div
                class="absolute -left-8 w-6 h-6 rounded-full bg-gray-500 flex items-center justify-center"
              >
                <ClockIcon class="w-3 h-3 text-white" />
              </div>

              <!-- Hora -->
              <div class="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-1">
                {{ formatTime(event.startDateTime) }} - {{ formatTime(event.endDateTime) }}
              </div>

              <!-- Contenido del evento -->
              <div class="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
                <div class="p-4">
                  <div class="flex flex-col md:flex-row md:items-center justify-between gap-3">
                    <div>
                      <h4 class="text-lg font-medium">{{ event.title }}</h4>
                      <p class="text-gray-600 dark:text-gray-400 text-sm mb-2">
                        {{ event.location }}
                      </p>

                      <div class="flex flex-wrap gap-2">
                        <span
                          class="px-2 py-1 text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200 rounded-full"
                        >
                          {{ event.instrument || "Múltiples instrumentos" }}
                        </span>
                        <span
                          class="px-2 py-1 text-xs bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-200 rounded-full"
                        >
                          {{ event.level || "Todos los niveles" }}
                        </span>
                      </div>
                    </div>

                    <div class="flex items-center space-x-3">
                      <div class="flex items-center">
                        <UserGroupIcon class="w-5 h-5 text-gray-500 mr-1" />
                        <span class="text-sm">{{ event.studentCount }} estudiantes</span>
                      </div>

                      <button
                        class="btn bg-blue-600 text-white hover:bg-blue-700"
                        @click="goToClass(event.classId)"
                      >
                        Ver Clase
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </template>
    </div>

    <!-- Estado vacío -->
    <div v-if="upcomingEvents.length === 0 && !isLoading" class="text-center py-12">
      <CalendarIcon class="h-16 w-16 mx-auto text-gray-400" />
      <h3 class="mt-2 text-lg font-medium text-gray-500">No hay clases próximas</h3>
      <p class="mt-1 text-gray-500">No tienes clases programadas para {{ getDateRangeText() }}.</p>
    </div>

    <!-- Estado de carga -->
    <div v-if="isLoading" class="text-center py-12">
      <div
        class="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]"
      />
      <p class="mt-2 text-gray-500">Cargando clases...</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import {ref, computed, onMounted} from "vue"
import {useRouter} from "vue-router"
import {
  format,
  isToday,
  isThisWeek,
  isThisMonth,
  isSameDay,
  parseISO,
  addMinutes,
  startOfDay,
  endOfDay,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  isBefore,
  isAfter,
} from "date-fns"
import {es} from "date-fns/locale"
import {useClassesStore} from "../../stores/classes"
import {ClockIcon, CalendarIcon, UserGroupIcon} from "@heroicons/vue/24/outline"

// Router
const router = useRouter()

// Stores
const classesStore = useClassesStore()

// Estado
const isLoading = ref(true)
const dateRange = ref("week") // 'today', 'week', 'month'
const today = new Date()
const upcomingEvents = ref([])

// ID del profesor (simulado)
const teacherId = "1" // En un caso real, se obtendría del usuario autenticado

// Establecer el rango de fechas
const setDateRange = (range) => {
  dateRange.value = range
  loadClassEvents()
}

// Texto para el rango de fechas seleccionado
const getDateRangeText = () => {
  switch (dateRange.value) {
    case "today":
      return "hoy"
    case "week":
      return "esta semana"
    case "month":
      return "este mes"
    default:
      return "el período seleccionado"
  }
}

// Agrupar eventos por fecha
const groupedUpcomingClasses = computed(() => {
  const todayEvents = upcomingEvents.value.filter((event) => isToday(event.startDateTime))

  const futureEvents = upcomingEvents.value.filter((event) => !isToday(event.startDateTime))

  // Agrupar eventos por fecha
  const groupedEvents = []
  futureEvents.forEach((event) => {
    const eventDate = startOfDay(event.startDateTime)

    // Buscar si ya existe un grupo para esta fecha
    const existingGroup = groupedEvents.find((group) => isSameDay(group.date, eventDate))

    if (existingGroup) {
      existingGroup.events.push(event)
    } else {
      groupedEvents.push({
        date: eventDate,
        events: [event],
      })
    }
  })

  // Ordenar grupos por fecha
  return groupedEvents.sort((a, b) => a.date.getTime() - b.date.getTime())
})

// Obtener clases para hoy
const getTodayClasses = () => {
  return upcomingEvents.value.filter((event) => isToday(event.startDateTime))
}

// Cargar eventos de clases
const loadClassEvents = async () => {
  isLoading.value = true

  try {
    // Cargar clases si no están ya cargadas
    if (classesStore.classes.length === 0) {
      await classesStore.fetchClasses()
    }

    // Filtrar clases para este profesor
    const teacherClasses = classesStore.classes.filter((c) => c.teacherId === teacherId)

    // Calcular rango de fechas para filtrar eventos
    const currentDate = new Date()
    let rangeStart, rangeEnd

    switch (dateRange.value) {
      case "today":
        rangeStart = startOfDay(currentDate)
        rangeEnd = endOfDay(currentDate)
        break
      case "week":
        rangeStart = startOfWeek(currentDate, {weekStartsOn: 1})
        rangeEnd = endOfWeek(currentDate, {weekStartsOn: 1})
        break
      case "month":
        rangeStart = startOfMonth(currentDate)
        rangeEnd = endOfMonth(currentDate)
        break
    }

    // Convertir clases a eventos
    const events = []

    teacherClasses.forEach((cls) => {
      // Obtener eventos de clases programadas
      if (cls.scheduledDates) {
        cls.scheduledDates.forEach((scheduledDate) => {
          const eventDate = parseISO(scheduledDate.date)

          // Verificar si está en el rango seleccionado
          if (isAfter(eventDate, rangeStart) && isBefore(eventDate, rangeEnd)) {
            const [startHour, startMinute] = scheduledDate.time.split(":").map(Number)
            const startDateTime = new Date(eventDate)
            startDateTime.setHours(startHour, startMinute, 0)

            const duration = scheduledDate.duration || 1.5 // Duración por defecto: 1.5 horas
            const endDateTime = addMinutes(startDateTime, duration * 60)

            events.push({
              id: `scheduled-${cls.id}-${scheduledDate.date}`,
              classId: cls.id,
              title: cls.name,
              description: cls.description || "",
              startDateTime,
              endDateTime,
              location: scheduledDate.location || "Aula por asignar",
              instrument: cls.instrument || "Música",
              level: cls.level || "Todos los niveles",
              studentCount: cls.studentIds?.length || 0,
              isScheduled: true,
            })
          }
        })
      }

      // Obtener eventos del horario semanal regular
      if (cls.schedule) {
        cls.schedule.forEach((schedule) => {
          // Para cada día en el rango, verificar si corresponde al día de la semana del horario
          const currentCheckDate = new Date(rangeStart)

          while (currentCheckDate <= rangeEnd) {
            const weekDayName = format(currentCheckDate, "EEEE", {locale: es})
            const capitalizedWeekDay = weekDayName.charAt(0).toUpperCase() + weekDayName.slice(1)

            // Si el día coincide con el del horario
            if (capitalizedWeekDay === schedule.day) {
              const [startHour, startMinute] = schedule.startTime.split(":").map(Number)
              const startDateTime = new Date(currentCheckDate)
              startDateTime.setHours(startHour, startMinute, 0)

              const duration = schedule.duration || 1.5 // Duración por defecto: 1.5 horas
              const endDateTime = addMinutes(startDateTime, duration * 60)

              // Solo añadir si no hay un evento programado específicamente para esta fecha/hora
              const hasSpecificEvent = events.some(
                (event) =>
                  isSameDay(event.startDateTime, startDateTime) &&
                  event.startDateTime.getHours() === startHour &&
                  event.startDateTime.getMinutes() === startMinute
              )

              if (!hasSpecificEvent) {
                events.push({
                  id: `regular-${cls.id}-${format(startDateTime, "yyyy-MM-dd-HH-mm")}`,
                  classId: cls.id,
                  title: cls.name,
                  description: cls.description || "",
                  startDateTime,
                  endDateTime,
                  location: schedule.location || "Aula por asignar",
                  instrument: cls.instrument || "Música",
                  level: cls.level || "Todos los niveles",
                  studentCount: cls.studentIds?.length || 0,
                  isRegular: true,
                })
              }
            }

            // Avanzar al siguiente día
            currentCheckDate.setDate(currentCheckDate.getDate() + 1)
          }
        })
      }
    })

    // Ordenar eventos por fecha/hora
    events.sort((a, b) => a.startDateTime.getTime() - b.startDateTime.getTime())

    upcomingEvents.value = events
  } catch (error) {
    console.error("Error al cargar eventos de clases:", error)
  } finally {
    isLoading.value = false
  }
}

// Formatear título de fecha
const formatDateTitle = (date) => {
  if (isToday(date)) {
    return "Hoy, " + format(date, "d 'de' MMMM", {locale: es})
  }
  return format(date, "EEEE, d 'de' MMMM", {locale: es})
}

// Formatear hora
const formatTime = (date) => {
  return format(date, "HH:mm")
}

// Navegar a la página de detalles de clase
const goToClass = (classId) => {
  router.push(`/classes/${classId}`)
}

// Cargar datos al montar el componente
onMounted(() => {
  loadClassEvents()
})
</script>

<style scoped>
.btn {
  @apply px-3 py-1.5 rounded-md text-sm font-medium;
}

.timeline-item::after {
  content: "";
  position: absolute;
  left: -4.7px;
  top: 9px;
  height: 2px;
  width: 15px;
  @apply bg-blue-200 dark:bg-blue-900;
}
</style>
