<template>
  <div class="alumnos-selector">
    <div class="mb-4">
      <div class="flex justify-between items-center mb-2">
        <h4 class="text-sm font-medium text-gray-700">{{ title }}</h4>
        <div class="flex items-center space-x-2">
          <button class="text-xs text-blue-600 hover:text-blue-800" @click="selectAll">
            Seleccionar todos
          </button>
          <button class="text-xs text-gray-600 hover:text-gray-800" @click="unselectAll">
            Deseleccionar todos
          </button>
          <button
            v-if="withAttendanceFilter"
            class="inline-flex items-center text-xs text-blue-600 hover:text-blue-800"
            :class="{'opacity-50': isLoadingAttendance}"
            @click="filterByAttendance"
          >
            <span v-if="isLoadingAttendance" class="mr-1">
              <svg class="animate-spin h-3 w-3" fill="none" viewBox="0 0 24 24">
                <circle
                  class="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  stroke-width="4"
                />
                <path
                  class="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
            </span>
            Solo presentes
          </button>
        </div>
      </div>

      <!-- Barra de búsqueda -->
      <div class="mb-3">
        <input
          v-model="search"
          type="text"
          placeholder="Buscar alumno..."
          class="w-full px-3 py-2 text-sm border border-gray-300 rounded-md"
        />
      </div>

      <!-- Lista de alumnos -->
      <div class="overflow-y-auto max-h-60 border border-gray-200 rounded-md bg-white">
        <div v-if="isLoading" class="flex justify-center items-center py-8">
          <div class="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600" />
        </div>
        <div
          v-else-if="filteredAlumnos.length === 0"
          class="py-8 text-center text-gray-500 text-sm"
        >
          No se encontraron alumnos
        </div>
        <div v-else>
          <div
            v-for="alumno in filteredAlumnos"
            :key="alumno.id"
            class="flex items-center p-2 cursor-pointer hover:bg-gray-50 border-b border-gray-100 last:border-b-0"
            :class="{'bg-gray-50': alumno.ausente}"
            @click="toggleAlumno(alumno.id)"
          >
            <input
              type="checkbox"
              :checked="selectedAlumnos.includes(alumno.id)"
              class="h-4 w-4 text-blue-600 border-gray-300 rounded"
              @click.stop
            />
            <div class="ml-3 flex-grow">
              <div class="flex items-center">
                <span class="text-sm font-medium text-gray-800">{{ alumno.nombre }}</span>
                <span
                  v-if="alumno.instrumento"
                  class="ml-2 text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded"
                >
                  {{ alumno.instrumento }}
                </span>
              </div>
              <div v-if="alumno.nivel" class="text-xs text-gray-500">Nivel: {{ alumno.nivel }}</div>
            </div>
            <div v-if="alumno.ausente" class="text-xs text-red-500 font-medium">Ausente</div>
          </div>
        </div>
      </div>
    </div>

    <!-- Información de selección -->
    <div v-if="!hideCounter && selectedAlumnos.length > 0" class="mt-2 text-sm text-gray-600">
      {{ selectedAlumnos.length }}
      {{ selectedAlumnos.length === 1 ? "alumno seleccionado" : "alumnos seleccionados" }}
    </div>
  </div>
</template>

<script setup lang="ts">
import {ref, computed, watch, onMounted} from "vue"
import {useAttendanceStore} from "@/modulos/Attendance/store/attendance"
import {useStudentsStore} from "@/modulos/Students/store/students"

// Tipo para los alumnos
interface Alumno {
  id: string
  nombre: string
  instrumento?: string
  nivel?: string
  filaId?: string
  ausente?: boolean
}

const props = defineProps({
  modelValue: {
    type: Array as PropType<string[]>,
    default: () => [],
  },
  title: {
    type: String,
    default: "Selección de Alumnos",
  },
  filaId: {
    type: String,
    default: "",
  },
  instrumentoId: {
    type: String,
    default: "",
  },
  claseId: {
    type: String,
    default: "",
  },
  alumnosList: {
    type: Array as PropType<Alumno[]>,
    default: () => [],
  },
  withAttendanceFilter: {
    type: Boolean,
    default: false,
  },
  fechaSesion: {
    type: [Date, String],
    default: () => new Date().toISOString().split("T")[0],
  },
  hideCounter: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits(["update:modelValue", "selection-change"])

// Estado
const selectedAlumnos = ref<string[]>([...props.modelValue])
const alumnos = ref<Alumno[]>(props.alumnosList || [])
const search = ref("")
const isLoading = ref(false)
const isLoadingAttendance = ref(false)

// Stores
const studentStore = useStudentsStore()
const attendanceStore = useAttendanceStore()

// Alumnos filtrados por búsqueda
const filteredAlumnos = computed(() => {
  if (!search.value.trim()) {
    return alumnos.value
  }

  const searchLower = search.value.toLowerCase()
  return alumnos.value.filter(
    (alumno) =>
      alumno.nombre.toLowerCase().includes(searchLower) ||
      (alumno.instrumento && alumno.instrumento.toLowerCase().includes(searchLower))
  )
})

// Métodos
const cargarAlumnos = async () => {
  if (props.alumnosList) {
    alumnos.value = [...props.alumnosList]
    return
  }

  try {
    isLoading.value = true

    // Primero cargar todos los estudiantes
    await studentStore.fetchStudents()

    if (props.filaId) {
      // Para filas específicas, necesitaríamos integración con el módulo de clases
      // Por ahora, cargamos todos los estudiantes activos
      const estudiantesActivos = studentStore.activeStudents
      alumnos.value = estudiantesActivos.map((a) => ({
        id: a.id,
        nombre: `${a.nombre} ${a.apellido}`,
        instrumento: a.instrumento,
        nivel: a.clase,
        filaId: props.filaId,
      }))
    } else if (props.claseId) {
      // Cargar alumnos de una clase específica usando el campo grupo
      const estudiantesActivos = studentStore.activeStudents
      const alumnosClase = estudiantesActivos.filter(
        (a) => a.grupo && Array.isArray(a.grupo) && a.grupo.includes(props.claseId)
      )

      alumnos.value = alumnosClase.map((a) => ({
        id: a.id,
        nombre: `${a.nombre} ${a.apellido}`,
        instrumento: a.instrumento,
        nivel: a.clase,
        filaId: a.classId,
      }))

      // Si hay un instrumentoId, filtrar por instrumento
      if (props.instrumentoId) {
        alumnos.value = alumnos.value.filter((a) => a.instrumento === props.instrumentoId)
      }

      // Si withAttendanceFilter está activado, cargar asistencia
      if (props.withAttendanceFilter) {
        await actualizarAsistencia()
      }
    }
  } catch (error) {
    console.error("Error al cargar alumnos:", error)
  } finally {
    isLoading.value = false
  }
}

const toggleAlumno = (alumnoId: string) => {
  const index = selectedAlumnos.value.indexOf(alumnoId)
  if (index === -1) {
    selectedAlumnos.value.push(alumnoId)
  } else {
    selectedAlumnos.value.splice(index, 1)
  }
  emitChange()
}

const selectAll = () => {
  selectedAlumnos.value = filteredAlumnos.value.map((a) => a.id)
  emitChange()
}

const unselectAll = () => {
  selectedAlumnos.value = []
  emitChange()
}

const filterByAttendance = async () => {
  if (!props.claseId) return

  try {
    isLoadingAttendance.value = true
    await actualizarAsistencia()

    // Seleccionar solo alumnos presentes
    selectedAlumnos.value = alumnos.value
      .filter((alumno) => !alumno.ausente)
      .map((alumno) => alumno.id)

    emitChange()
  } catch (error) {
    console.error("Error al filtrar por asistencia:", error)
  } finally {
    isLoadingAttendance.value = false
  }
}

const actualizarAsistencia = async () => {
  if (!props.claseId) return

  try {
    // Cargar asistencia para la fecha especificada
    await attendanceStore.fetchAttendanceForSession(props.claseId, props.fechaSesion)

    // Obtener IDs de alumnos ausentes
    const ausentes = attendanceStore.getAbsentStudentIds(props.claseId, props.fechaSesion)

    // Actualizar propiedad ausente en los alumnos
    alumnos.value = alumnos.value.map((alumno) => ({
      ...alumno,
      ausente: ausentes.includes(alumno.id),
    }))
  } catch (error) {
    console.error("Error al actualizar asistencia:", error)
  }
}

const emitChange = () => {
  emit("update:modelValue", selectedAlumnos.value)
  emit("selection-change", {
    alumnos: selectedAlumnos.value,
    totalSeleccionados: selectedAlumnos.value.length,
  })
}

// Sincronizar con props
watch(
  () => props.modelValue,
  (newValue) => {
    selectedAlumnos.value = [...newValue]
  },
  {deep: true}
)

// Cargar datos iniciales
onMounted(async () => {
  await cargarAlumnos()

  // Si hay alumnos en la filaId, seleccionar a todos por defecto
  if (props.filaId && alumnos.value.length > 0 && selectedAlumnos.value.length === 0) {
    selectedAlumnos.value = alumnos.value.map((a) => a.id)
    emitChange()
  }
})
</script>

<style scoped>
.alumnos-selector {
  @apply w-full;
}
</style>
