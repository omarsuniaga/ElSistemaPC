<script setup lang="ts">
import {ref, computed, onMounted, inject, type Ref} from "vue"
import {useAttendanceStore} from "../../Attendance/store/attendance"
import {useAuthStore} from "../../../modulos/Auth/store/auth"
import {fetchUnifiedObservationsForClass} from "../../../composables/useUnifiedObservations"
import {
  ChevronDownIcon,
  ChevronRightIcon,
  EllipsisVerticalIcon,
  EyeIcon,
  CalendarIcon,
  UserIcon,
  ClockIcon,
  DocumentTextIcon,
  MusicalNoteIcon,
} from "@heroicons/vue/24/outline"
import {Menu, MenuButton, MenuItems, MenuItem} from "@headlessui/vue"
import {format} from "date-fns"
import {es} from "date-fns/locale"

// Props del componente
const props = defineProps<{
  classes: Array<any>
}>()

// Stores
const attendanceStore = useAttendanceStore()
const authStore = useAuthStore()

// Obtener el teacherId del componente padre
const currentTeacherId = inject<Ref<string>>("currentTeacherId")

// Estado local
const expandedClasses = ref<Set<string>>(new Set())
const classObservations = ref<Record<string, any[]>>({})
const loadingObservations = ref<Record<string, boolean>>({})

// Computed para filtrar clases del maestro actual
const teacherClasses = computed(() => {
  if (!currentTeacherId?.value) return props.classes
  return props.classes.filter(
    (cls) =>
      cls.teacherId === currentTeacherId.value ||
      cls.assistantTeachers?.includes(currentTeacherId.value)
  )
})

// Función para alternar expansión de clase
const toggleClassExpansion = async (classId: string) => {
  if (expandedClasses.value.has(classId)) {
    expandedClasses.value.delete(classId)
  } else {
    expandedClasses.value.add(classId)
    // Cargar observaciones si no están cargadas
    if (!classObservations.value[classId]) {
      await loadClassObservations(classId)
    }
  }
}

// Función para cargar observaciones de una clase
const loadClassObservations = async (classId: string) => {
  try {
    loadingObservations.value[classId] = true

    // Usar la nueva función de observaciones unificadas
    console.log(`[ObservacionesSection] Loading unified observations for class: ${classId}`)
    const observations = await fetchUnifiedObservationsForClass(classId)
    classObservations.value[classId] = observations || []

    console.log(
      `[ObservacionesSection] Loaded ${observations.length} unified observations for class ${classId}`
    )
  } catch (error) {
    console.error("Error loading unified observations for class:", classId, error)

    // Fallback al método anterior si falla
    try {
      console.log(`[ObservacionesSection] Falling back to old method for class: ${classId}`)
      const fallbackObservations = await attendanceStore.fetchObservationsForClass(classId)
      classObservations.value[classId] = fallbackObservations || []
    } catch (fallbackError) {
      console.error("Fallback method also failed:", fallbackError)
      classObservations.value[classId] = []
    }
  } finally {
    loadingObservations.value[classId] = false
  }
}

// Función para formatear fecha
const formatDate = (dateString: string) => {
  try {
    const date = new Date(dateString)
    return format(date, "dd/MM/yyyy HH:mm", {locale: es})
  } catch {
    return dateString
  }
}

// Función para formatear el horario/slots con iconos
const formatScheduleWithIcons = (schedule: string | undefined, slots: any) => {
  if (!schedule && !slots) return "Horario no definido"

  // Si slots es un array de objetos
  if (Array.isArray(slots)) {
    return slots
      .map((slot) => {
        const day = slot.day || slot.dia || ""
        const time = slot.time || slot.hora || ""
        return `${day} ${time}`
      })
      .join(", ")
  }

  // Si slots es un objeto
  if (slots && typeof slots === "object") {
    const day = slots.day || slots.dia || ""
    const time = slots.time || slots.hora || ""
    return `${day} ${time}`
  }

  // Si slots es un string
  if (typeof slots === "string") {
    return slots
  }

  // Fallback al schedule original
  return schedule || "Horario no definido"
}

// Función para obtener los días de la semana en formato legible
const formatDaysOfWeek = (slots: any) => {
  if (!slots) return []

  const daysMap: Record<string, string> = {
    monday: "Lunes",
    tuesday: "Martes",
    wednesday: "Miércoles",
    thursday: "Jueves",
    friday: "Viernes",
    saturday: "Sábado",
    sunday: "Domingo",
    lunes: "Lunes",
    martes: "Martes",
    miercoles: "Miércoles",
    miércoles: "Miércoles",
    jueves: "Jueves",
    viernes: "Viernes",
    sabado: "Sábado",
    sábado: "Sábado",
    domingo: "Domingo",
  }

  if (Array.isArray(slots)) {
    return slots.map((slot) => {
      const day = slot.day || slot.dia || ""
      const time = slot.time || slot.hora || ""
      return {
        day: daysMap[day.toLowerCase()] || day,
        time,
      }
    })
  }

  if (typeof slots === "object" && slots !== null) {
    const day = slots.day || slots.dia || ""
    const time = slots.time || slots.hora || ""
    return [
      {
        day: daysMap[day.toLowerCase()] || day,
        time,
      },
    ]
  }
  return []
}

// Función para obtener el nombre del autor de la observación
const getAuthorName = (observation: any) => {
  return observation.authorName || observation.teacherName || "Autor desconocido"
}

// Función para obtener el color del tipo de observación
const getObservationTypeColor = (type: string) => {
  const colors = {
    positive: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
    negative: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
    neutral: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
    general: "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200",
  }
  return colors[type as keyof typeof colors] || colors.general
}

onMounted(() => {
  console.log("ObservacionesSection mounted with classes:", teacherClasses.value.length)
})
</script>

<template>
  <div class="bg-white dark:bg-gray-800 rounded-lg shadow p-3 md:p-4">
    <div class="flex items-center justify-between mb-4">
      <h2 class="text-base md:text-lg font-semibold text-gray-900 dark:text-white">
        <DocumentTextIcon class="w-5 h-5 inline mr-2" />
        Historial de Observaciones por Clase
      </h2>
      <span class="text-sm text-gray-500 dark:text-gray-400">
        {{ teacherClasses.length }} clase{{ teacherClasses.length !== 1 ? "s" : "" }}
      </span>
    </div>

    <!-- Lista de clases -->
    <div v-if="teacherClasses.length > 0" class="space-y-3">
      <div
        v-for="classItem in teacherClasses"
        :key="classItem.id"
        class="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden"
      >
        <!-- Cabecera de la clase -->
        <div class="bg-gray-50 dark:bg-gray-700 p-4">
          <div class="flex items-center justify-between">
            <div class="flex items-center space-x-3">
              <button
                class="flex items-center space-x-2 text-left hover:bg-gray-100 dark:hover:bg-gray-600 rounded p-1 transition-colors"
                @click="toggleClassExpansion(classItem.id)"
              >
                <ChevronRightIcon
                  v-if="!expandedClasses.has(classItem.id)"
                  class="w-4 h-4 text-gray-500"
                />
                <ChevronDownIcon v-else class="w-4 h-4 text-gray-500" />
                <div>
                  <h3 class="font-medium text-gray-900 dark:text-white">
                    {{ classItem.name || classItem.nombre }}
                  </h3>
                  <div class="flex items-center space-x-3 text-sm text-gray-500 dark:text-gray-400">
                    <span class="flex items-center">
                      <MusicalNoteIcon class="w-4 h-4 mr-1" />
                      {{ classItem.instrument || classItem.tipo }}
                    </span>
                    <span class="flex items-center">
                      <ClockIcon class="w-4 h-4 mr-1" />
                      {{ formatScheduleWithIcons(classItem.schedule, classItem.slots) }}
                    </span>
                  </div>
                  <!-- Mostrar detalles de horarios si hay slots estructurados -->
                  <div v-if="formatDaysOfWeek(classItem.slots).length > 0" class="mt-1">
                    <div class="flex flex-wrap gap-2">
                      <span
                        v-for="slot in formatDaysOfWeek(classItem.slots)"
                        :key="`${slot.day}-${slot.time}`"
                        class="inline-flex items-center px-2 py-1 rounded-full text-xs bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200"
                      >
                        <CalendarIcon class="w-3 h-3 mr-1" />
                        {{ slot.day }}
                        <ClockIcon class="w-3 h-3 ml-1 mr-1" />
                        {{ slot.time }}
                      </span>
                    </div>
                  </div>
                </div>
              </button>
            </div>

            <!-- Menú hamburguesa -->
            <Menu as="div" class="relative">
              <MenuButton
                class="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              >
                <EllipsisVerticalIcon class="w-5 h-5 text-gray-500 dark:text-gray-400" />
              </MenuButton>
              <MenuItems
                class="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-md shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none z-10"
              >
                <MenuItem v-slot="{active}">
                  <button
                    :class="[
                      active ? 'bg-gray-100 dark:bg-gray-700' : '',
                      'group flex items-center w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-300',
                    ]"
                    @click="loadClassObservations(classItem.id)"
                  >
                    <EyeIcon class="w-4 h-4 mr-3" />
                    Ver todas las observaciones
                  </button>
                </MenuItem>
                <MenuItem v-slot="{active}">
                  <button
                    :class="[
                      active ? 'bg-gray-100 dark:bg-gray-700' : '',
                      'group flex items-center w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-300',
                    ]"
                    @click="toggleClassExpansion(classItem.id)"
                  >
                    <DocumentTextIcon class="w-4 h-4 mr-3" />
                    {{ expandedClasses.has(classItem.id) ? "Contraer" : "Expandir" }} historial
                  </button>
                </MenuItem>
              </MenuItems>
            </Menu>
          </div>
        </div>

        <!-- Observaciones expandidas -->
        <div
          v-if="expandedClasses.has(classItem.id)"
          class="border-t border-gray-200 dark:border-gray-700"
        >
          <!-- Loading state -->
          <div
            v-if="loadingObservations[classItem.id]"
            class="flex items-center justify-center py-8"
          >
            <div class="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-500" />
            <span class="ml-2 text-sm text-gray-600 dark:text-gray-400"
              >Cargando observaciones...</span
            >
          </div>

          <!-- Lista de observaciones -->
          <div
            v-else-if="classObservations[classItem.id]?.length > 0"
            class="divide-y divide-gray-200 dark:divide-gray-700"
          >
            <div
              v-for="observation in classObservations[classItem.id]"
              :key="observation.id"
              class="p-4 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              <div class="flex items-start space-x-3">
                <div class="flex-shrink-0">
                  <div
                    class="w-8 h-8 bg-indigo-100 dark:bg-indigo-900 rounded-full flex items-center justify-center"
                  >
                    <DocumentTextIcon class="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                  </div>
                </div>
                <div class="flex-1 min-w-0">
                  <div class="flex items-center justify-between mb-2">
                    <div class="flex items-center space-x-2">
                      <span
                        v-if="observation.type"
                        :class="[
                          'px-2 py-1 rounded-full text-xs font-medium',
                          getObservationTypeColor(observation.type),
                        ]"
                      >
                        {{ observation.type }}
                      </span>
                      <span class="flex items-center text-xs text-gray-500 dark:text-gray-400">
                        <CalendarIcon class="w-3 h-3 mr-1" />
                        {{ formatDate(observation.fecha || observation.createdAt) }}
                      </span>
                    </div>
                  </div>

                  <p class="text-sm text-gray-900 dark:text-white mb-2">
                    {{ observation.observacion || observation.content || "Sin contenido" }}
                  </p>

                  <div class="flex items-center space-x-4 text-xs text-gray-500 dark:text-gray-400">
                    <span class="flex items-center">
                      <UserIcon class="w-3 h-3 mr-1" />
                      {{ getAuthorName(observation) }}
                    </span>
                    <span v-if="observation.studentName" class="flex items-center">
                      <span class="w-2 h-2 bg-gray-400 rounded-full mr-1" />
                      Estudiante: {{ observation.studentName }}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Sin observaciones -->
          <div v-else class="p-8 text-center text-gray-500 dark:text-gray-400">
            <DocumentTextIcon class="w-12 h-12 mx-auto mb-4 text-gray-300 dark:text-gray-600" />
            <p class="text-sm">No hay observaciones registradas para esta clase</p>
            <p class="text-xs mt-1">Las observaciones aparecerán aquí cuando se registren</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Sin clases -->
    <div v-else class="text-center py-12 text-gray-500 dark:text-gray-400">
      <DocumentTextIcon class="w-16 h-16 mx-auto mb-4 text-gray-300 dark:text-gray-600" />
      <h3 class="text-lg font-medium mb-2">No hay clases disponibles</h3>
      <p class="text-sm">No se encontraron clases para mostrar observaciones</p>
    </div>
  </div>
</template>

<style scoped>
/* Estilos adicionales si es necesario */
.transition-colors {
  transition:
    background-color 0.15s ease-in-out,
    color 0.15s ease-in-out;
}
</style>
