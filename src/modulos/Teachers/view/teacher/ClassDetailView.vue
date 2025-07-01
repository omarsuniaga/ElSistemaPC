<script setup lang="ts">
import {ref, computed, onMounted} from "vue"
import {useRoute, useRouter} from "vue-router"
import {useClassesStore} from "../../../../modulos/Classes/store/classes"
import {useStudentsStore} from "../../../../modulos/Students/store/students"
import {useAuthStore} from "../../../../stores/auth"
import {
  CalendarIcon,
  ClockIcon,
  UserGroupIcon,
  MapPinIcon,
  MusicalNoteIcon,
  AcademicCapIcon,
  ArrowLeftIcon,
  ChevronDownIcon,
  ChevronUpIcon,
} from "@heroicons/vue/24/outline"
import {format} from "date-fns"
import {es} from "date-fns/locale"

// Stores
const classesStore = useClassesStore()
const studentsStore = useStudentsStore()
const authStore = useAuthStore()
const route = useRoute()
const router = useRouter()

// Estado
const isLoading = ref(true)
const error = ref(null)
const expandedStudentId = ref(null)

// Obtener el ID de la clase de los parámetros de la ruta
const classId = computed(() => route.params.id as string)

// Obtener los datos de la clase
// Modificar el computed para forzar recarga
const classData = computed(() => {
  return classesStore.classes.find((c) => c.id === classId.value)
})

// Verificar si la clase pertenece al maestro actual
const isTeacherClass = computed(() => {
  if (!classData.value || !authStore.user) return false
  return classData.value.teacherId === authStore.user.uid
})

// Obtener los estudiantes de la clase
const classStudents = computed(() => {
  if (!classData.value || !classData.value.studentIds) return []

  return studentsStore.students
    .filter((student) => classData.value.studentIds.includes(student.id))
    .map((student) => ({
      ...student,
      instruments: student.instrumento || [],
    }))
})

// Formatear los días de la semana
const formatDayOfWeek = (day) => {
  if (typeof day === "number") {
    const days = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"]
    return days[day]
  }
  return day
}

// Calcular la duración de la clase en horas y minutos
const calculateDuration = (startTime, endTime) => {
  if (!startTime || !endTime) return "No disponible"

  const [startHour, startMinute] = startTime.split(":").map(Number)
  const [endHour, endMinute] = endTime.split(":").map(Number)

  let hours = endHour - startHour
  let minutes = endMinute - startMinute

  if (minutes < 0) {
    hours -= 1
    minutes += 60
  }

  if (hours === 0) {
    return `${minutes} minutos`
  } else if (minutes === 0) {
    return `${hours} ${hours === 1 ? "hora" : "horas"}`
  } else {
    return `${hours} ${hours === 1 ? "hora" : "horas"} y ${minutes} minutos`
  }
}

// Alternar la expansión de un estudiante
const toggleStudentExpand = (studentId) => {
  if (expandedStudentId.value === studentId) {
    expandedStudentId.value = null
  } else {
    expandedStudentId.value = studentId
  }
}

// Volver a la página anterior
const goBack = () => {
  router.push("/teacher")
}

// Cargar datos necesarios
onMounted(async () => {
  isLoading.value = true
  try {
    // Cargar clases si no están cargadas
    if (classesStore.classes.length === 0) {
      await classesStore.fetchClasses()
    }

    // Cargar estudiantes si no están cargados
    if (studentsStore.students.length === 0) {
      await studentsStore.fetchStudents()
    }

    // Verificar si la clase existe y pertenece al maestro
    if (!classData.value) {
      error.value = "La clase no existe o no tienes acceso a ella"
    } else if (!isTeacherClass.value) {
      error.value = "No tienes permiso para ver esta clase"
      router.push("/teacher")
    }
  } catch (err) {
    console.error("Error al cargar datos:", err)
    error.value = "Error al cargar los datos de la clase"
  } finally {
    isLoading.value = false
  }
})
</script>

<template>
  <div class="container mx-auto px-4 py-6">
    <!-- Botón de regreso -->
    <button
      class="flex items-center text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 mb-4 transition-colors"
      @click="goBack"
    >
      <ArrowLeftIcon class="w-5 h-5 mr-1" />
      <span>Volver a mis clases</span>
    </button>

    <!-- Cargando -->
    <div v-if="isLoading" class="flex justify-center items-center py-12">
      <div class="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500" />
    </div>

    <!-- Error -->
    <div
      v-else-if="error"
      class="bg-red-100 dark:bg-red-900 border border-red-400 dark:border-red-700 text-red-700 dark:text-red-300 px-4 py-3 rounded relative mb-4"
    >
      <strong class="font-bold">Error:</strong>
      <span class="block sm:inline"> {{ error }}</span>
    </div>

    <!-- Contenido principal -->
    <div
      v-else-if="classData"
      class="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden"
    >
      <!-- Encabezado de la clase -->
      <div class="bg-gradient-to-r from-blue-500 to-indigo-600 text-white p-6">
        <h1 class="text-2xl md:text-3xl font-bold mb-2">{{ classData.name }}</h1>
        <div class="flex flex-wrap items-center text-sm md:text-base">
          <div v-if="classData.level" class="flex items-center mr-4 mb-2">
            <AcademicCapIcon class="w-5 h-5 mr-1" />
            <span>{{ classData.level }}</span>
          </div>
          <div v-if="classData.instrument" class="flex items-center mr-4 mb-2">
            <MusicalNoteIcon class="w-5 h-5 mr-1" />
            <span>{{ classData.instrument }}</span>
          </div>
          <div v-if="classData.classroom" class="flex items-center mb-2">
            <MapPinIcon class="w-5 h-5 mr-1" />
            <span>Aula {{ classData.classroom }}</span>
          </div>
        </div>
      </div>

      <!-- Información de la clase -->
      <div class="p-6">
        <!-- Descripción -->
        <div v-if="classData.description" class="mb-6">
          <h2 class="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-2">Descripción</h2>
          <p class="text-gray-600 dark:text-gray-400">{{ classData.description }}</p>
        </div>

        <!-- Horario -->
        <div class="mb-6">
          <h2 class="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-3 flex items-center">
            <CalendarIcon class="w-6 h-6 mr-2 text-blue-500" />
            Horario
          </h2>

          <div
            v-if="
              classData.schedule && classData.schedule.slots && classData.schedule.slots.length > 0
            "
            class="bg-gray-50 dark:bg-gray-700 rounded-lg p-4"
          >
            <div
              v-for="(slot, index) in classData.schedule.slots"
              :key="index"
              class="mb-3 last:mb-0 p-3 bg-white dark:bg-gray-800 rounded-md shadow-sm"
            >
              <div class="flex flex-wrap items-center justify-between">
                <div class="font-medium text-gray-800 dark:text-gray-200">
                  {{ formatDayOfWeek(slot.day) }}
                </div>
                <div class="flex items-center text-gray-600 dark:text-gray-400">
                  <ClockIcon class="w-4 h-4 mr-1" />
                  <span>{{ slot.startTime }} - {{ slot.endTime }}</span>
                  <span class="ml-2 text-sm"
                    >({{ calculateDuration(slot.startTime, slot.endTime) }})</span
                  >
                </div>
              </div>
            </div>
          </div>

          <div v-else class="text-gray-500 dark:text-gray-400 italic">
            No hay horarios programados para esta clase.
          </div>
        </div>

        <!-- Lista de estudiantes -->
        <div>
          <h2 class="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-3 flex items-center">
            <UserGroupIcon class="w-6 h-6 mr-2 text-blue-500" />
            Estudiantes ({{ classStudents.length }})
          </h2>

          <div v-if="classStudents.length > 0" class="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
            <div
              v-for="student in classStudents"
              :key="student.id"
              class="mb-3 last:mb-0 bg-white dark:bg-gray-800 rounded-md shadow-sm overflow-hidden"
            >
              <!-- Información básica del estudiante (siempre visible) -->
              <div
                class="p-3 flex items-center justify-between cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-750"
                @click="toggleStudentExpand(student.id)"
              >
                <div class="flex items-center">
                  <div
                    class="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center text-blue-600 dark:text-blue-300 font-bold mr-3"
                  >
                    {{ student.name ? student.name.charAt(0).toUpperCase() : "E" }}
                  </div>
                  <div>
                    <div class="font-medium text-gray-800 dark:text-gray-200">
                      {{ student.name }}
                    </div>
                    <div class="text-sm text-gray-500 dark:text-gray-400">
                      {{ student.email || "Sin correo" }}
                    </div>
                  </div>
                </div>

                <div class="flex items-center">
                  <div
                    v-if="student.instruments && student.instruments.length > 0"
                    class="mr-3 px-2 py-1 bg-indigo-100 dark:bg-indigo-900 text-indigo-800 dark:text-indigo-200 text-xs rounded-full"
                  >
                    {{ student.instruments.length }}
                    {{ student.instruments.length === 1 ? "instrumento" : "instrumentos" }}
                  </div>
                  <ChevronDownIcon
                    v-if="expandedStudentId !== student.id"
                    class="w-5 h-5 text-gray-400"
                  />
                  <ChevronUpIcon v-else class="w-5 h-5 text-gray-400" />
                </div>
              </div>

              <!-- Detalles expandibles del estudiante -->
              <div
                v-if="expandedStudentId === student.id"
                class="px-3 pb-3 pt-1 border-t border-gray-100 dark:border-gray-700"
              >
                <!-- Instrumentos -->
                <div v-if="student.instruments && student.instruments.length > 0" class="mb-3">
                  <h4 class="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Instrumentos
                  </h4>
                  <div class="flex flex-wrap gap-2">
                    <div
                      v-for="instrument in student.instruments"
                      :key="instrument.id"
                      class="px-3 py-1 bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 text-sm rounded-full flex items-center"
                    >
                      <MusicalNoteIcon class="w-4 h-4 mr-1" />
                      <span>{{ instrument.name || "Instrumento" }}</span>
                    </div>
                  </div>
                </div>

                <!-- Información adicional -->
                <div class="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                  <div v-if="student.phone" class="text-gray-600 dark:text-gray-400">
                    <span class="font-medium">Teléfono:</span> {{ student.phone }}
                  </div>
                  <div v-if="student.birthdate" class="text-gray-600 dark:text-gray-400">
                    <span class="font-medium">Fecha de nacimiento:</span>
                    {{ new Date(student.birthdate).toLocaleDateString() }}
                  </div>
                  <div
                    v-if="student.address"
                    class="text-gray-600 dark:text-gray-400 md:col-span-2"
                  >
                    <span class="font-medium">Dirección:</span> {{ student.address }}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div
            v-else
            class="text-gray-500 dark:text-gray-400 italic bg-gray-50 dark:bg-gray-700 rounded-lg p-4"
          >
            No hay estudiantes inscritos en esta clase.
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Transiciones para los elementos expandibles */
.expand-enter-active,
.expand-leave-active {
  transition: all 0.3s ease-in-out;
  max-height: 300px;
  overflow: hidden;
}

.expand-enter-from,
.expand-leave-to {
  max-height: 0;
  opacity: 0;
}
</style>
