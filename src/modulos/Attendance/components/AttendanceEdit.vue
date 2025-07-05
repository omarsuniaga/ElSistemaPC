<template>
  <div class="p-4 bg-white dark:bg-gray-800 rounded-lg shadow">
    <h3 class="text-lg font-semibold mb-4">Editar Asistencia</h3>

    <!-- Student Info -->
    <div class="mb-4 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
      <div class="flex items-center gap-3">
        <div
          :class="[
            'w-10 h-10 rounded-full flex items-center justify-center text-white text-sm',
            getAvatarBgColor(student),
          ]"
        >
          {{ getStudentInitials(student) }}
        </div>
        <div>
          <p class="font-medium">{{ student?.nombre }} {{ student?.apellido }}</p>
          <p class="text-sm text-gray-600 dark:text-gray-400">
            {{ student?.instrumento }} - {{ formatDate(attendance.Fecha) }}
          </p>
        </div>
      </div>
    </div>

    <!-- Status Selection -->
    <div class="mb-4">
      <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
        Estado de asistencia
      </label>
      <div class="flex flex-wrap gap-2">
        <button
          v-for="status in ['Presente', 'Ausente', 'Tardanza', 'Justificado']"
          :key="status"
          :class="[
            'px-3 py-2 rounded-lg transition-colors flex items-center gap-2',
            getButtonActiveClass(status as AttendanceStatus, attendance.status),
          ]"
          @click="attendance.status = status as AttendanceStatus"
        >
          <CheckCircleIcon v-if="status === 'Presente'" class="w-5 h-5" />
          <XCircleIcon v-if="status === 'Ausente'" class="w-5 h-5" />
          <ClockIcon v-if="status === 'Tardanza'" class="w-5 h-5" />
          <DocumentCheckIcon v-if="status === 'Justificado'" class="w-5 h-5" />
          {{ status }}
        </button>
      </div>
    </div>

    <!-- Justification (if status is Justificado) -->
    <div v-if="attendance.status === 'Justificado'" class="mb-4">
      <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
        Justificación
      </label>
      <textarea
        v-model="justification.reason"
        class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white transition-colors duration-200"
        rows="3"
        placeholder="Ingrese la razón de la justificación"
      />

      <div class="mt-2">
        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Documento de respaldo (opcional)
        </label>
        <input
          type="file"
          class="block w-full text-sm text-gray-900 bg-white dark:bg-gray-700 dark:text-white border border-gray-300 dark:border-gray-600 rounded-lg cursor-pointer file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-primary-50 file:text-primary-700 dark:file:text-primary-300 dark:file:bg-primary-900/30 hover:file:bg-primary-100"
          @change="handleFileUpload"
        />
      </div>
    </div>

    <!-- History -->
    <div v-if="changeHistory.length > 0" class="mb-4">
      <h4 class="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
        Historial de cambios
      </h4>
      <div class="max-h-40 overflow-y-auto bg-gray-50 dark:bg-gray-700 rounded-lg p-2">
        <div
          v-for="(change, index) in changeHistory"
          :key="index"
          class="text-xs p-2 border-b last:border-0 border-gray-200 dark:border-gray-600"
        >
          <div class="flex justify-between">
            <span> {{ change.oldStatus || "No registrado" }} → {{ change.newStatus }} </span>
            <span class="text-gray-500 dark:text-gray-400">
              {{ formatDate(change.timestamp, "PPpp") }}
            </span>
          </div>
        </div>
      </div>
    </div>

    <!-- Action Buttons -->
    <div class="flex justify-end gap-2 mt-6">
      <button
        class="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
        @click="$emit('close')"
      >
        Cancelar
      </button>
      <button :disabled="isSaving" class="btn btn-primary" @click="saveChanges">
        <span v-if="isSaving">Guardando...</span>
        <span v-else>Guardar Cambios</span>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import {ref, computed, onMounted} from "vue"
import {useAttendanceStore} from "../stores/attendance"
import {useStudentsStore} from "../../Students/store/students"
import {format, parseISO} from "date-fns"
import {es} from "date-fns/locale"
import {CheckCircleIcon, XCircleIcon, ClockIcon, DocumentCheckIcon} from "@heroicons/vue/24/outline"
import type {AttendanceRecord, AttendanceStatus, Student} from "../types"

const props = defineProps<{
  studentId: string
  date: string
  classId: string
}>()

const emit = defineEmits<{
  (e: "close"): void
  (e: "saved"): void
}>()

const attendanceStore = useAttendanceStore()
const studentsStore = useStudentsStore()
const isSaving = ref(false)
const justification = ref({
  reason: "",
  documentUrl: "",
})

// Obtener el estudiante y registro de asistencia
const student = computed<Student | undefined>(() => {
  return studentsStore.students.find((s) => s.id === props.studentId)
})

// Estado inicial de la asistencia
const attendance = ref<AttendanceRecord>({
  studentId: props.studentId,
  Fecha: props.date,
  classId: props.classId,
  status: "Ausente",
})

// Historial de cambios de estado
const changeHistory = computed(() => {
  return attendanceStore.getStatusChanges(props.studentId, props.date, props.classId)
})

// Cargar datos existentes
onMounted(async () => {
  // Buscar si ya existe un registro para este estudiante, fecha y clase
  const existingRecords = attendanceStore.getRecordsByDateAndClass(props.date, props.classId)
  const existingRecord = existingRecords.find((r) => r.studentId === props.studentId)

  if (existingRecord) {
    attendance.value = {...existingRecord}
    if (existingRecord.justification) {
      justification.value = {
        reason: existingRecord.justification.reason || "",
        documentUrl: existingRecord.justification.documentUrl || "",
      }
    }
  }
})

// Guardar cambios
const saveChanges = async () => {
  isSaving.value = true
  try {
    // Actualizar la justificación si el estado es 'Justificado'
    if (attendance.value.status === "Justificado") {
      attendance.value.justification = {
        ...justification.value,
        timestamp: new Date(),
      }
    }

    // Guardar el registro de asistencia
    await attendanceStore.updateAttendance({
      id: attendance.value.id,
      studentId: props.studentId,
      classId: props.classId,
      Fecha: props.date,
      status: attendance.value.status,
      justification: attendance.value.justification,
      createdAt: attendance.value.createdAt || new Date().toISOString(),
    })

    emit("saved")
    emit("close")
  } catch (error) {
    console.error("Error al guardar la asistencia:", error)
    alert("Hubo un error al guardar los cambios. Por favor intente nuevamente.")
  } finally {
    isSaving.value = false
  }
}

// Manejar carga de archivo
const handleFileUpload = (event: Event) => {
  const input = event.target as HTMLInputElement
  if (input.files && input.files.length > 0) {
    const file = input.files[0]
    // Aquí implementaría la carga del archivo a Firebase Storage
    // y almacenaría la URL en justification.documentUrl
    // Por ahora, solo mostramos el nombre del archivo
    justification.value.documentUrl = `documento-${file.name}`
  }
}

// Utilidades para el UI
const formatDate = (date: string | Date, formatStr: string = "PPP") => {
  const dateObj = typeof date === "string" ? parseISO(date) : date
  return format(dateObj, formatStr, {locale: es})
}

// Función para generar las iniciales del alumno para usar como avatar
const getStudentInitials = (student: Student | undefined): string => {
  if (!student) return "??"

  const nombre = student.nombre || ""
  const apellido = student.apellido || ""

  const firstInitial = nombre.charAt(0).toUpperCase()
  const lastInitial = apellido.charAt(0).toUpperCase()

  return `${firstInitial}${lastInitial}`
}

// Función para obtener el color de fondo para el avatar basado en el nombre
const getAvatarBgColor = (student: Student | undefined): string => {
  if (!student) return "bg-gray-300"

  // Genera un número único basado en el nombre y apellido
  const stringToHash = (str: string): number => {
    let hash = 0
    for (let i = 0; i < str.length; i++) {
      hash = str.charCodeAt(i) + ((hash << 5) - hash)
    }
    return hash
  }

  const hash = stringToHash(student.nombre + student.apellido)

  // Lista de colores de fondo para los avatares
  const colors = [
    "bg-blue-500",
    "bg-red-500",
    "bg-green-500",
    "bg-yellow-500",
    "bg-indigo-500",
    "bg-purple-500",
    "bg-pink-500",
    "bg-teal-500",
    "bg-orange-500",
  ]

  // Selecciona un color basado en el hash
  return colors[Math.abs(hash) % colors.length]
}

const getButtonActiveClass = (status: AttendanceStatus, currentStatus: AttendanceStatus) => {
  if (status !== currentStatus) {
    const baseColors: Record<AttendanceStatus, string> = {
      Presente: "bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400",
      Ausente: "bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400",
      Tardanza: "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400",
      Justificado: "bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400",
    }
    return baseColors[status]
  }

  const activeColors: Record<AttendanceStatus, string> = {
    Presente: "bg-green-600 text-white",
    Ausente: "bg-red-600 text-white",
    Tardanza: "bg-yellow-600 text-white",
    Justificado: "bg-blue-600 text-white",
  }
  return activeColors[status]
}
</script>
