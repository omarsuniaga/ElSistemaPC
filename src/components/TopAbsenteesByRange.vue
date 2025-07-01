<template>
  <div class="card hover:shadow-md transition-shadow duration-300 mt-8" v-bind="$attrs">
    <div
      class="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-4 space-y-3 lg:space-y-0"
    >
      <h3 class="text-lg font-semibold flex items-center">
        <ExclamationTriangleIcon class="w-5 h-5 mr-2 text-red-500" />
        Alumnos con más ausencias
      </h3>
      <div class="flex flex-wrap w-full lg:w-auto gap-2 items-center">
        <!-- Botón de gestión de plantillas -->
        <button
          class="flex items-center px-3 py-2 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 transition-colors duration-200"
          title="Gestionar Plantillas de WhatsApp"
          @click="openWhatsAppTemplateManager"
        >
          <CogIcon class="w-4 h-4 mr-1" />
          Plantillas
        </button>

        <div class="grid grid-cols-1 xs:grid-cols-2 sm:flex sm:flex-row gap-2 w-full sm:w-auto">
          <div class="flex items-center">
            <label class="text-sm whitespace-nowrap mr-1">Desde:</label>
            <input
              v-model="absenceRange.start"
              type="date"
              class="dark:text-black border rounded px-2 py-2 text-sm w-full touch-manipulation"
            />
          </div>
          <div class="flex items-center">
            <label class="text-sm whitespace-nowrap mr-1">Hasta:</label>
            <input
              v-model="absenceRange.end"
              type="date"
              class="border dark:text-black rounded px-2 py-2 text-sm w-full touch-manipulation"
            />
          </div>
          <button
            class="col-span-1 xs:col-span-2 sm:col-span-1 sm:ml-2 px-4 py-2 bg-indigo-600 text-white rounded text-sm hover:bg-indigo-700 transition-colors duration-200"
            @click="filtrarAusenciasPorRango"
          >
            Filtrar
          </button>
        </div>
      </div>
    </div>

    <!-- Indicador de carga -->
    <div v-if="isLoading" class="flex justify-center items-center py-8">
      <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500" />
      <span class="ml-2 text-sm text-gray-600 dark:text-gray-400">Cargando datos...</span>
    </div>

    <!-- Mensaje de error -->
    <div
      v-else-if="error"
      class="bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-200 p-4 rounded mb-4"
    >
      {{ error }}
      <button class="ml-2 underline" @click="calcularTopAbsentees">Reintentar</button>
    </div>

    <!-- Vista de tabla para pantallas medianas y grandes -->
    <div v-else class="hidden md:block overflow-x-auto">
      <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
        <thead class="bg-gray-50 dark:bg-gray-700">
          <tr>
            <th
              class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer select-none"
              @click="setSort('student')"
            >
              Estudiante
              <span v-if="sortColumn === 'student'">{{ sortDirection === "asc" ? "▲" : "▼" }}</span>
            </th>
            <th
              class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer select-none"
              @click="setSort('absences')"
            >
              Ausencias
              <span v-if="sortColumn === 'absences'">{{
                sortDirection === "asc" ? "▲" : "▼"
              }}</span>
            </th>
            <th
              class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer select-none"
              @click="setSort('totalClasses')"
            >
              Total Clases
              <span v-if="sortColumn === 'totalClasses'">{{
                sortDirection === "asc" ? "▲" : "▼"
              }}</span>
            </th>
            <th
              class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer select-none"
              @click="setSort('attendanceRate')"
            >
              % Asistencia
              <span v-if="sortColumn === 'attendanceRate'">{{
                sortDirection === "asc" ? "▲" : "▼"
              }}</span>
            </th>

            <th
              class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
            >
              Acciones
            </th>
          </tr>
        </thead>
        <tbody class="bg-white divide-y divide-gray-200 dark:bg-gray-800 dark:divide-gray-700">
          <tr
            v-for="student in sortedAbsentees"
            :key="student.studentId"
            class="hover:bg-gray-50 dark:hover:bg-gray-700"
          >
            <td class="px-6 py-4 whitespace-nowrap flex items-center gap-3">
              <span
                class="text-blue-600 underline cursor-pointer"
                @click="openAbsencesModal(student)"
                >{{ studentName(student.studentId) }}</span
              >
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-center">
              <span class="text-red-600 font-bold">{{ student.absences }}</span>
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-center">
              <span class="font-medium">{{ student.totalClasses }}</span>
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-center">
              <span
                :class="getAttendanceRateClass(student.attendanceRate)"
                class="px-2 py-1 rounded-full text-xs"
                :title="`${student.attendedClasses} clases asistidas de ${student.totalClasses} totales`"
              >
                {{ isNaN(student.attendanceRate) ? "0" : Math.round(student.attendanceRate) }}%
              </span>
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-center flex justify-center">
              <!-- Acciones con iconos -->
              <button
                v-if="student.absences === 3"
                class="bg-green-500 hover:bg-green-600 text-white p-1.5 rounded text-xs mr-1 flex items-center"
                title="Enviar WhatsApp"
                @click="openWhatsAppModalForWarning(student)"
              >
                <ChatBubbleOvalLeftEllipsisIcon class="h-4 w-4 mr-1" />
              </button>
              <button
                v-if="student.absences === 4"
                class="bg-yellow-500 hover:bg-yellow-600 text-white p-1.5 rounded text-xs mr-1 flex items-center"
                title="Enviar Amonestación por WhatsApp"
                @click="openWhatsAppModalForWarning(student)"
              >
                <ChatBubbleOvalLeftEllipsisIcon class="h-4 w-4" />
              </button>
              <button
                v-if="student.absences === 4"
                class="bg-orange-500 hover:bg-orange-600 text-white p-1.5 rounded text-xs mr-1 flex items-center"
                title="Generar PDF de Amonestación"
                @click="generateAmonestacionPDF(student)"
              >
                <DocumentTextIcon class="h-4 w-4" />
              </button>
              <button
                v-if="student.absences === 5"
                class="bg-red-500 hover:bg-red-600 text-white p-1.5 rounded text-xs mr-1 flex items-center"
                title="Enviar Retiro por WhatsApp"
                @click="openWhatsAppModalForWarning(student)"
              >
                <ChatBubbleOvalLeftEllipsisIcon class="h-4 w-4" />
              </button>
              <button
                v-if="student.absences === 5"
                class="bg-gray-700 hover:bg-gray-800 text-white p-1.5 rounded text-xs flex items-center"
                title="Generar PDF de Retiro"
                @click="generateRetiroPDF(student)"
              >
                <DocumentIcon class="h-4 w-4" />
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Vista de tarjetas para dispositivos móviles -->
    <div class="md:hidden space-y-4">
      <div class="flex justify-start mb-2 text-sm">
        <button class="mr-3 flex items-center font-medium" @click="setSort('student')">
          Nombre
          <span v-if="sortColumn === 'student'" class="ml-1">{{
            sortDirection === "asc" ? "▲" : "▼"
          }}</span>
        </button>
        <button class="mr-3 flex items-center font-medium" @click="setSort('absences')">
          Ausencias
          <span v-if="sortColumn === 'absences'" class="ml-1">{{
            sortDirection === "asc" ? "▲" : "▼"
          }}</span>
        </button>
        <button class="flex items-center font-medium" @click="setSort('attendanceRate')">
          % Asistencia
          <span v-if="sortColumn === 'attendanceRate'" class="ml-1">{{
            sortDirection === "asc" ? "▲" : "▼"
          }}</span>
        </button>
      </div>

      <div
        v-for="student in sortedAbsentees"
        :key="student.studentId"
        class="bg-white dark:bg-gray-800 rounded-lg shadow p-4"
      >
        <div class="flex justify-between items-center mb-3">
          <h4
            class="text-blue-600 underline text-base font-medium cursor-pointer"
            @click="openAbsencesModal(student)"
          >
            {{ studentName(student.studentId) }}
          </h4>
          <div class="flex flex-col items-end">
            <div class="flex items-center mb-1">
              <span class="text-red-600 font-bold mr-2">{{ student.absences }}</span>
              <span
                :class="getAttendanceRateClass(student.attendanceRate)"
                class="px-2 py-1 rounded-full text-xs"
              >
                {{ isNaN(student.attendanceRate) ? "0" : Math.round(student.attendanceRate) }}%
              </span>
            </div>
            <div class="text-xs text-gray-500">
              {{ student.attendedClasses }} de {{ student.totalClasses }} clases
            </div>
          </div>
        </div>

        <div class="flex flex-wrap gap-2 justify-end">
          <button
            v-if="student.absences === 3"
            class="bg-green-500 hover:bg-green-600 text-white px-3 py-2 rounded text-sm flex items-center"
            @click="openWhatsAppModalForWarning(student)"
          >
            <ChatBubbleOvalLeftEllipsisIcon class="h-5 w-5 mr-1.5" />
            WhatsApp
          </button>
          <button
            v-if="student.absences === 4"
            class="bg-yellow-500 hover:bg-yellow-600 text-white px-2 py-1 rounded text-xs flex items-center"
            @click="openWhatsAppModalForWarning(student)"
          >
            <ChatBubbleOvalLeftEllipsisIcon class="h-4 w-4 mr-1" />
            WhatsApp
          </button>
          <button
            v-if="student.absences === 4"
            class="bg-orange-500 hover:bg-orange-600 text-white px-2 py-1 rounded text-xs flex items-center"
            @click="generateAmonestacionPDF(student)"
          >
            <DocumentTextIcon class="h-4 w-4 mr-1" />
            PDF
          </button>
          <button
            v-if="student.absences === 5"
            class="bg-red-500 hover:bg-red-600 text-white px-2 py-1 rounded text-xs flex items-center"
            @click="openWhatsAppModalForWarning(student)"
          >
            <ChatBubbleOvalLeftEllipsisIcon class="h-4 w-4 mr-1" />
            WhatsApp
          </button>
          <button
            v-if="student.absences === 5"
            class="bg-gray-700 hover:bg-gray-800 text-white px-2 py-1 rounded text-xs flex items-center"
            @click="generateRetiroPDF(student)"
          >
            <DocumentIcon class="h-4 w-4 mr-1" />
            PDF
          </button>
        </div>
      </div>
    </div>

    <!-- MODAL WHATSAPP -->
    <!-- PDF AMONESTACIÓN (OCULTO) -->
    <div id="pdf-amonestacion" style="display: none">
      <div
        style="
          font-family: Arial, sans-serif;
          max-width: 600px;
          margin: auto;
          border: 1px solid #eee;
          padding: 32px 24px;
        "
      >
        <div style="text-align: center; margin-bottom: 24px">
          <!-- Encabezado con título de la institución en lugar de imagen -->
          <div style="font-size: 18px; font-weight: bold; margin-bottom: 8px">
            ACADEMIA DE MÚSICA
          </div>
          <h2 style="color: #b91c1c; margin-bottom: 8px">Amonestación Formal por Inasistencias</h2>
          <p style="color: #777777; font-style: italic; margin-top: 0">Documento oficial</p>
        </div>

        <p><strong>Fecha:</strong> {{ pdfAmonestacionData.fecha }}</p>
        <p><strong>Alumno:</strong> {{ pdfAmonestacionData.nombre }}</p>
        <p><strong>Motivo:</strong> {{ pdfAmonestacionData.motivo }}</p>

        <div
          style="
            margin: 20px 0;
            padding: 16px;
            background: #fef2f2;
            border-left: 4px solid #b91c1c;
            line-height: 1.5;
            white-space: normal;
          "
        >
          <!-- Texto de amonestación directamente formateado para HTML -->
          <div v-html="pdfAmonestacionFormateado" />
        </div>

        <!-- Fix: Replacing <p> with <div> to avoid HTML validation error -->
        <div style="margin-top: 40px; text-align: center">
          <!-- Firma como texto en lugar de imagen -->
          <hr
            style="border: none; border-top: 1px solid #999; width: 180px; margin: 20px auto 5px"
          />
          <span style="font-weight: bold">Coordinación Académica</span>
        </div>
      </div>
    </div>
    <!-- PDF RETIRO (OCULTO) -->
    <div id="pdf-retiro" style="display: none">
      <div
        style="
          font-family: Arial, sans-serif;
          max-width: 600px;
          margin: auto;
          border: 1px solid #eee;
          padding: 32px 24px;
        "
      >
        <div style="text-align: center; margin-bottom: 24px">
          <!-- Encabezado con título de la institución en lugar de imagen -->
          <div style="font-size: 18px; font-weight: bold; margin-bottom: 8px">
            ACADEMIA DE MÚSICA
          </div>
          <h2 style="color: #b91c1c; margin-bottom: 8px">
            Notificación de Retiro por Inasistencias
          </h2>
          <p style="color: #777777; font-style: italic; margin-top: 0">Documento oficial</p>
        </div>

        <p><strong>Fecha:</strong> {{ pdfRetiroData.fecha }}</p>
        <p><strong>Alumno:</strong> {{ pdfRetiroData.nombre }}</p>
        <p><strong>Motivo:</strong> {{ pdfRetiroData.motivo }}</p>

        <div
          style="
            margin: 20px 0;
            padding: 16px;
            background: #fef2f2;
            border-left: 4px solid #b91c1c;
            line-height: 1.5;
            white-space: normal;
          "
        >
          <!-- Texto de retiro directamente formateado para HTML -->
          <div v-html="pdfRetiroFormateado" />
        </div>

        <!-- Fix: Replacing <p> with <div> to avoid HTML validation error -->
        <div style="margin-top: 40px; text-align: center">
          <!-- Firma como texto en lugar de imagen -->
          <hr
            style="border: none; border-top: 1px solid #999; width: 180px; margin: 20px auto 5px"
          />
          <span style="font-weight: bold">Coordinación Académica</span>
        </div>
      </div>
    </div>
    <div
      v-if="showWhatsAppModal"
      class="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 p-4"
    >
      <div class="bg-white dark:bg-gray-900 rounded-lg shadow-lg p-6 w-full max-w-md">
        <div class="flex items-center mb-4">
          <ChatBubbleOvalLeftEllipsisIcon class="h-6 w-6 text-green-500 mr-2" />
          <h2 class="text-lg font-semibold">Enviar WhatsApp</h2>
        </div>
        <div class="mb-2">
          <strong>Alumno:</strong>
          {{ selectedStudentForWhatsApp ? studentName(selectedStudentForWhatsApp.studentId) : "" }}
        </div>
        <div class="mb-2">
          <strong>Ausencias:</strong>
          {{ selectedStudentForWhatsApp?.absences || 0 }}
        </div>
        <div class="flex justify-end gap-2 mt-4">
          <button
            class="px-4 py-2 rounded bg-gray-300 hover:bg-gray-400 text-gray-700 flex items-center"
            @click="closeWhatsAppModal"
          >
            <XMarkIcon class="h-5 w-5 mr-1.5" />
            Cancelar
          </button>
        </div>
      </div>
    </div>
  </div>

  <!-- MODAL DE AUSENCIAS POR ALUMNO -->
  <div
    v-if="showAbsencesModal"
    class="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 p-4"
  >
    <div
      class="bg-white dark:bg-gray-900 rounded-lg shadow-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto relative"
    >
      <button
        class="absolute top-2 right-2 text-gray-500 hover:text-gray-700 flex items-center justify-center rounded-full h-8 w-8"
        @click="closeAbsencesModal"
      >
        <XMarkIcon class="h-6 w-6" />
      </button>
      <div class="flex items-center mb-4">
        <CalendarIcon class="h-6 w-6 text-red-500 mr-2" />
        <h2 class="text-lg font-semibold pr-8">
          Ausencias de {{ studentName(selectedAbsentee?.studentId) }}
        </h2>
      </div>
      <div v-if="absencesDetail.length">
        <ul class="list-disc pl-4">
          <li v-for="(absence, i) in absencesDetail" :key="i" class="mb-2">
            <span class="font-semibold">{{ absence.date }}:</span>
            {{ getClassName(absence.classId) }}
          </li>
        </ul>
      </div>
      <div v-else class="text-gray-500">No hay ausencias detalladas para este alumno.</div>
    </div>
  </div>

  <!-- MODAL DE WHATSAPP CON PRESETS -->
  <WhatsAppMessageModal
    v-if="whatsAppMessageData"
    :is-open="showWhatsAppModal"
    :student-data="whatsAppMessageData"
    @close="closeWhatsAppModal"
    @message-sent="handleMessageSent"
  />

  <!-- MODAL DE GESTIÓN DE PLANTILLAS -->
  <WhatsAppTemplateManager
    :is-open="showWhatsAppTemplateManager"
    @close="closeWhatsAppTemplateManager"
    @template-created="handleTemplateCreated"
    @template-updated="handleTemplateUpdated"
  />
</template>

<script setup lang="ts">
// Permitir heredar atributos extra (como 'class') en el div raíz
// eslint-disable-next-line vue/require-explicit-emits
defineOptions({inheritAttrs: false})
import {ref, nextTick, computed, onMounted} from "vue"
import html2pdf from "html2pdf.js"
import {
  ExclamationTriangleIcon,
  ChatBubbleOvalLeftEllipsisIcon,
  DocumentTextIcon,
  DocumentIcon,
  XMarkIcon,
  PaperAirplaneIcon,
  CalendarIcon,
  CogIcon,
} from "@heroicons/vue/24/outline"
import {useAttendanceStore} from "../modulos/Attendance/store/attendance"
import {useStudentsStore} from "../modulos/Students/store/students"
import {useClassesStore} from "../modulos/Classes/store/classes"
import {db} from "../firebase"
import {doc, setDoc, getDoc} from "firebase/firestore"
import {useAuthStore} from "../stores/auth"
import WhatsAppMessageModal from "./WhatsAppMessageModal.vue"
import WhatsAppTemplateManager from "./WhatsAppTemplateManager.vue"
import type {MessageData} from "../composables/useWhatsAppPresets"

const props = defineProps<{
  limit?: number
  teacherId?: string
}>()
const authStore = useAuthStore()

// Agregar las variables faltantes
const isLoading = ref(false)
const error = ref<string | null>(null)
const selectedClass = ref<string>("")

// Modal de ausencias detalladas
const showAbsencesModal = ref(false)
const selectedAbsentee = ref<any>(null)

// Computed para ausencias detalladas del alumno seleccionado
type AbsenceDetail = {date: string; classId: string}
const classesStore = useClassesStore()

function getClassName(classId: string): string {
  const classObj = classesStore.classes.find((c) => c.id === classId)
  return classObj?.name || classId || "Clase desconocida"
}

const absencesDetail = computed<AbsenceDetail[]>(() => {
  if (!selectedAbsentee.value) return []
  // Buscar ausencias en los registros del store
  return attendanceStore.records
    .filter((r) => r.studentId === selectedAbsentee.value.studentId && r.status === "Ausente")
    .map((r) => ({date: r.fecha, classId: r.classId}))
})

function openAbsencesModal(student: any) {
  selectedAbsentee.value = student
  showAbsencesModal.value = true
}
function closeAbsencesModal() {
  showAbsencesModal.value = false
  selectedAbsentee.value = null
}

const attendanceStore = useAttendanceStore()
const studentsStore = useStudentsStore()

// Siempre inicializado para evitar undefined
// Por defecto, rango de un mes
function getDefaultMonthRange() {
  const today = new Date()
  const end = today.toISOString().slice(0, 10)
  const prevMonth = new Date(today)
  prevMonth.setMonth(today.getMonth() - 1)
  const start = prevMonth.toISOString().slice(0, 10)
  return {start, end}
}
const absenceRange = ref<{start: string; end: string}>(getDefaultMonthRange())

const topAbsentees = ref<any[]>([])
const absenceSort = ref("absences")

function studentName(studentId: string) {
  const student = studentsStore.getStudentById(studentId)
  if (student) {
    const fullName = `${student.nombre || ""} ${student.apellido || ""}`.trim()
    return fullName || "Estudiante sin nombre"
  }
  return "Estudiante no encontrado"
}

function getAttendanceRateClass(rate: number) {
  if (rate >= 90) return "bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200"
  if (rate >= 75) return "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-200"
  return "bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200"
}

function formatDate(dateString: string): string {
  if (!dateString) return ""
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateString)) return dateString
  const [year, month, day] = dateString.split("-")
  return `${day}-${month}-${year}`
}

// Función para formatear el texto del PDF reemplazando saltos de línea y viñetas
const formatearTextoParaPDF = (texto: string) => {
  if (!texto) return ""

  // Reemplazar saltos de línea por <br>
  let formateado = texto.replace(/\n/g, "<br>")

  // Dar formato a las viñetas para mejor visualización
  formateado = formateado.replace(
    /• /g,
    '<span style="display: inline-block; width: 20px; margin-left: 10px;">•</span>'
  )

  return formateado
}

// Computed para formatos HTML de los mensajes
const pdfAmonestacionFormateado = computed(() => {
  return formatearTextoParaPDF(pdfAmonestacionData.value.mensaje)
})

const pdfRetiroFormateado = computed(() => {
  return formatearTextoParaPDF(pdfRetiroData.value.mensaje)
})

// Variables para PDFs
const pdfAmonestacionData = ref({
  fecha: "",
  nombre: "",
  motivo: "",
  mensaje: "",
})

const pdfRetiroData = ref({
  fecha: "",
  nombre: "",
  motivo: "",
  mensaje: "",
})

// Función para generar PDF de amonestación
const generateAmonestacionPDF = async (student: any) => {
  const studentInfo = studentsStore.getStudentById(student.studentId)
  if (!studentInfo) return

  const studentName = `${studentInfo.nombre} ${studentInfo.apellido}`.trim()
  const currentDate = new Date().toLocaleDateString("es-ES")

  pdfAmonestacionData.value = {
    fecha: currentDate,
    nombre: studentName,
    motivo: `Ausencias excesivas (${student.absences} faltas)`,
    mensaje: `Estimado/a representante,

Por medio de la presente, le notificamos que el estudiante ${studentName} ha recibido una AMONESTACIÓN FORMAL por las siguientes razones:

• Ausencias acumuladas: ${student.absences}
• Fecha de evaluación: ${currentDate}
• Clase: ${getClassName(student.classId || "")}

Esta amonestación queda registrada en el expediente del estudiante. De continuar con esta conducta, se procederá con medidas disciplinarias más severas.

Solicitamos su inmediata atención a este asunto y su colaboración para mejorar la asistencia del estudiante.

Es importante mantener la asistencia regular para el progreso académico del estudiante.

Esperamos su comprensión y colaboración.`,
  }

  // Generar PDF
  await nextTick()
  const element = document.getElementById("pdf-amonestacion")
  if (element) {
    const opt = {
      margin: 1,
      filename: `amonestacion_${studentName.replace(/\s+/g, "_")}_${currentDate.replace(/\//g, "-")}.pdf`,
      image: {type: "jpeg", quality: 0.98},
      html2canvas: {scale: 2, useCORS: true},
      jsPDF: {unit: "in", format: "letter", orientation: "portrait"},
    }

    try {
      await html2pdf().set(opt).from(element).save()
    } catch (error) {
      console.error("Error generating PDF:", error)
    }
  }
}

// Función para generar PDF de retiro
const generateRetiroPDF = async (student: any) => {
  const studentInfo = studentsStore.getStudentById(student.studentId)
  if (!studentInfo) return

  const studentName = `${studentInfo.nombre} ${studentInfo.apellido}`.trim()
  const currentDate = new Date().toLocaleDateString("es-ES")

  pdfRetiroData.value = {
    fecha: currentDate,
    nombre: studentName,
    motivo: `Ausencias excesivas que superan el límite permitido (${student.absences} faltas)`,
    mensaje: `Estimado/a representante,

Después de múltiples advertencias y amonestaciones, lamentamos informarle que el estudiante ${studentName} ha sido RETIRADO de la institución por las siguientes razones:

• Ausencias acumuladas: ${student.absences}
• Fecha efectiva de retiro: ${currentDate}
• Clase: ${getClassName(student.classId || "")}

Esta decisión se toma después de agotar todas las instancias de diálogo y compromiso establecidas en el reglamento interno de la institución.

Los documentos del estudiante estarán disponibles para retiro en coordinación académica en un plazo de 15 días hábiles.

Lamentamos no haber podido contar con la colaboración necesaria para mantener la asistencia regular del estudiante.`,
  }

  // Generar PDF
  await nextTick()
  const element = document.getElementById("pdf-retiro")
  if (element) {
    const opt = {
      margin: 1,
      filename: `retiro_${studentName.replace(/\s+/g, "_")}_${currentDate.replace(/\//g, "-")}.pdf`,
      image: {type: "jpeg", quality: 0.98},
      html2canvas: {scale: 2, useCORS: true},
      jsPDF: {unit: "in", format: "letter", orientation: "portrait"},
    }

    try {
      await html2pdf().set(opt).from(element).save()
    } catch (error) {
      console.error("Error generating PDF:", error)
    }
  }
}

async function calcularTopAbsentees() {
  try {
    isLoading.value = true
    error.value = null

    let result

    // Si hay teacherId, usar el método específico para maestros
    if (props.teacherId) {
      console.log(`[TopAbsenteesByRange] Fetching absent students for teacher: ${props.teacherId}`)
      result = await attendanceStore.fetchTopAbsentStudentsByTeacher(
        formattedStartDate.value,
        formattedEndDate.value,
        props.teacherId,
        props.limit || 10
      )
    } else {
      // Si no hay teacherId, usar el método general
      result = await attendanceStore.fetchTopAbsentStudentsByRange(
        formattedStartDate.value,
        formattedEndDate.value,
        props.limit || 10,
        selectedClass.value || undefined
      )
    }

    // Procesamiento adicional: filtrar estudiantes sin nombre válido y agregar datos necesarios
    const processedResult = result
      .map((student) => {
        // Agregar el nombre del estudiante
        const studentInfo = studentsStore.getStudentById(student.studentId)
        if (!studentInfo) {
          return null // Excluir estudiantes no encontrados
        }

        const fullName = `${studentInfo.nombre || ""} ${studentInfo.apellido || ""}`.trim()
        if (!fullName) {
          return null // Excluir estudiantes sin nombre
        }

        // Calcular datos adicionales para el componente
        const attendedClasses = Math.max(0, (student.totalPossibleClasses || 0) - student.absences)
        const attendanceRate =
          student.totalPossibleClasses > 0
            ? (attendedClasses / student.totalPossibleClasses) * 100
            : 0

        return {
          ...student,
          studentName: fullName,
          attendedClasses,
          attendanceRate: isNaN(attendanceRate) ? 0 : attendanceRate,
          totalClasses: student.totalPossibleClasses || 0,
        }
      })
      .filter((student) => student !== null) // Remover estudiantes nulos

    topAbsentees.value = processedResult
  } catch (err: any) {
    console.error("Error al obtener datos de asistencia:", err)
    error.value = `Error al obtener datos de asistencia: ${err.message || err}`
    topAbsentees.value = [] // Asegurar que no haya datos parciales
  } finally {
    isLoading.value = false
  }
}

const sortColumn = ref<"student" | "absences" | "attendanceRate" | "totalClasses">("absences")
const sortDirection = ref<"asc" | "desc">("desc")

// --- Persistencia de filtro en Firestore ---
async function guardarFiltroUsuario() {
  const userId = authStore.user?.uid
  if (!userId) return
  const filtro = {
    columna: sortColumn.value,
    direccion: sortDirection.value,
    rangoFechas: {...absenceRange.value},
  }
  await setDoc(doc(db, "CONFIGURACION", `${userId}_TopAbsenteesByRange`), {
    tabla: "TopAbsenteesByRange",
    filtro,
    usuarioId: userId,
    timestamp: new Date(),
  })
}

async function restaurarFiltroUsuario() {
  const userId = authStore.user?.uid
  if (!userId) return

  try {
    const filtroDoc = await getDoc(doc(db, "CONFIGURACION", `${userId}_TopAbsenteesByRange`))

    if (filtroDoc.exists()) {
      const {filtro} = filtroDoc.data()
      if (filtro) {
        if (filtro.columna) sortColumn.value = filtro.columna
        if (filtro.direccion) sortDirection.value = filtro.direccion
        if (filtro.rangoFechas) {
          absenceRange.value.start = filtro.rangoFechas?.start ?? getDefaultMonthRange().start
          absenceRange.value.end = filtro.rangoFechas?.end ?? getDefaultMonthRange().end
        }
      }
    } else {
      // Si no hay filtro guardado, usar un mes por defecto
      const def = getDefaultMonthRange()
      absenceRange.value.start = def.start
      absenceRange.value.end = def.end
    }
  } catch (error) {
    console.error("Error al restaurar filtros:", error)
    // En caso de error, utilizar valores por defecto
    const def = getDefaultMonthRange()
    absenceRange.value.start = def.start
    absenceRange.value.end = def.end
  }
}

const sortedAbsentees = computed(() => {
  if (!topAbsentees.value) return []
  const arr = [...topAbsentees.value]
  return arr.sort((a, b) => {
    let valA, valB
    switch (sortColumn.value) {
      case "student":
        valA = studentName(a.studentId)
        valB = studentName(b.studentId)
        break
      case "absences":
        valA = a.absences
        valB = b.absences
        break
      case "attendanceRate":
        valA = a.attendanceRate
        valB = b.attendanceRate
        break
      case "totalClasses":
        valA = a.totalClasses
        valB = b.totalClasses
        break
      default:
        valA = a.absences
        valB = b.absences
    }
    if (valA < valB) return sortDirection.value === "asc" ? -1 : 1
    if (valA > valB) return sortDirection.value === "asc" ? 1 : -1
    return 0
  })
})

async function setSort(column: "student" | "absences" | "attendanceRate" | "totalClasses") {
  if (sortColumn.value === column) {
    sortDirection.value = sortDirection.value === "asc" ? "desc" : "asc"
  } else {
    sortColumn.value = column
    sortDirection.value = column === "student" ? "asc" : "desc"
  }
  await guardarFiltroUsuario()
}

// Computed para fechas formateadas
const formattedStartDate = computed(() => absenceRange.value?.start || "")
const formattedEndDate = computed(() => absenceRange.value?.end || "")

// Función para filtrar ausencias por rango de fechas
async function filtrarAusenciasPorRango() {
  await calcularTopAbsentees()
  await guardarFiltroUsuario()
}

// Inicialización
onMounted(async () => {
  await restaurarFiltroUsuario()
  await calcularTopAbsentees()
})

// Variables para el modal de WhatsApp
const showWhatsAppModal = ref(false)
const selectedStudentForWhatsApp = ref<any>(null)

// Variables para el gestor de plantillas
const showWhatsAppTemplateManager = ref(false)

// Función para abrir modal de WhatsApp para amonestación
const openWhatsAppModalForWarning = (student: any) => {
  selectedStudentForWhatsApp.value = student
  showWhatsAppModal.value = true
}

// Función para cerrar modal de WhatsApp
const closeWhatsAppModal = () => {
  showWhatsAppModal.value = false
  selectedStudentForWhatsApp.value = null
}

// Funciones para el gestor de plantillas
const openWhatsAppTemplateManager = () => {
  showWhatsAppTemplateManager.value = true
}

const closeWhatsAppTemplateManager = () => {
  showWhatsAppTemplateManager.value = false
}

const handleTemplateCreated = (template: any) => {
  console.log("Nueva plantilla creada:", template)
  // Aquí puedes agregar lógica adicional si es necesario
}

const handleTemplateUpdated = (template: any) => {
  console.log("Plantilla actualizada:", template)
  // Aquí puedes agregar lógica adicional si es necesario
}

// Función para manejar cuando se envía un mensaje
const handleMessageSent = (data: {preset: any; message: string}) => {
  console.log("Mensaje enviado:", data)
  // Aquí puedes agregar lógica adicional como logging o notificaciones
  closeWhatsAppModal()
}

// Computed para los datos del estudiante seleccionado para WhatsApp
const whatsAppMessageData = computed((): MessageData | null => {
  if (!selectedStudentForWhatsApp.value) return null

  const student = studentsStore.getStudentById(selectedStudentForWhatsApp.value.studentId)
  if (!student) return null

  // Obtener datos del representante
  const representanteName =
    (student as any).representante?.nombre ||
    (student as any).madre?.nombre ||
    (student as any).padre?.nombre ||
    "Representante"
  const representantePhone =
    (student as any).representante?.telefono ||
    (student as any).madre?.telefono ||
    (student as any).padre?.telefono ||
    ""

  // Obtener datos de la clase
  const classData = classesStore.classes.find(
    (c) => c.id === selectedStudentForWhatsApp.value.classId
  )
  const className = classData?.name || "Clase Musical"
  const teacherName = (authStore.user as any)?.displayName || "Maestro"

  // Generar detalles de ausencias si hay datos disponibles
  const absenceDetails =
    selectedStudentForWhatsApp.value.absenceDetails ||
    `El estudiante tiene ${selectedStudentForWhatsApp.value.absences} ausencias registradas.`

  return {
    studentName: `${student.nombre} ${student.apellido}`.trim(),
    representanteName,
    representantePhone,
    className,
    date: new Date().toLocaleDateString("es-ES"),
    absences: selectedStudentForWhatsApp.value.absences || 0,
    teacherName,
    institutionName: "Academia de Música",
    // Nuevas variables
    startDate: formattedStartDate.value,
    endDate: formattedEndDate.value,
    attendanceRate: selectedStudentForWhatsApp.value.attendanceRate || 0,
    absenceDetails,
  }
})
</script>

<style scoped>
/* Mejoras de interacción táctil */
.touch-manipulation {
  touch-action: manipulation;
}

/* Define el breakpoint xs para pantallas muy pequeñas */
@media (min-width: 480px) {
  .xs\:grid-cols-2 {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .xs\:col-span-2 {
    grid-column: span 2 / span 2;
  }
}
</style>
