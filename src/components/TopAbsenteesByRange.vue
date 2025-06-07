<template>
  <div
    class="card hover:shadow-md transition-shadow duration-300 mt-8"
    v-bind="$attrs"
  >
    <div
      class="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-4 space-y-3 lg:space-y-0"
    >
      <h3 class="text-lg font-semibold flex items-center">
        <ExclamationTriangleIcon class="w-5 h-5 mr-2 text-red-500" />
        Alumnos con más ausencias
      </h3>
      <div class="flex flex-wrap w-full lg:w-auto gap-2 items-center">
        <div
          class="grid grid-cols-1 xs:grid-cols-2 sm:flex sm:flex-row gap-2 w-full sm:w-auto"
        >
          <div class="flex items-center">
            <label class="text-sm whitespace-nowrap mr-1">Desde:</label>
            <input
              type="date"
              v-model="absenceRange.start"
              class="dark:text-black border rounded px-2 py-2 text-sm w-full touch-manipulation"
            />
          </div>
          <div class="flex items-center">
            <label class="text-sm whitespace-nowrap mr-1">Hasta:</label>
            <input
              type="date"
              v-model="absenceRange.end"
              class="border dark:text-black rounded px-2 py-2 text-sm w-full touch-manipulation"
            />
          </div>
          <button
            @click="filtrarAusenciasPorRango"
            class="col-span-1 xs:col-span-2 sm:col-span-1 sm:ml-2 px-4 py-2 bg-indigo-600 text-white rounded text-sm hover:bg-indigo-700 transition-colors duration-200"
          >
            Filtrar
          </button>
        </div>
      </div>
    </div>
    
    <!-- Indicador de carga -->
    <div v-if="isLoading" class="flex justify-center items-center py-8">
      <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500"></div>
      <span class="ml-2 text-sm text-gray-600 dark:text-gray-400">Cargando datos...</span>
    </div>
    
    <!-- Mensaje de error -->
    <div v-else-if="error" class="bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-200 p-4 rounded mb-4">
      {{ error }}
      <button @click="calcularTopAbsentees" class="ml-2 underline">Reintentar</button>
    </div>

    <!-- Vista de tabla para pantallas medianas y grandes -->
    <div v-else class="hidden md:block overflow-x-auto">
      <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
        <thead class="bg-gray-50 dark:bg-gray-700">
          <tr>
            <th
              @click="setSort('student')"
              class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer select-none"
            >
              Estudiante
              <span v-if="sortColumn === 'student'">{{
                sortDirection === "asc" ? "▲" : "▼"
              }}</span>
            </th>
            <th
              @click="setSort('absences')"
              class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer select-none"
            >
              Ausencias
              <span v-if="sortColumn === 'absences'">{{
                sortDirection === "asc" ? "▲" : "▼"
              }}</span>
            </th>
            <th
              @click="setSort('totalClasses')"
              class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer select-none"
            >
              Total Clases
              <span v-if="sortColumn === 'totalClasses'">{{
                sortDirection === "asc" ? "▲" : "▼"
              }}</span>
            </th>
            <th
              @click="setSort('attendanceRate')"
              class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer select-none"
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
        <tbody
          class="bg-white divide-y divide-gray-200 dark:bg-gray-800 dark:divide-gray-700"
        >
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
                {{ Math.round(student.attendanceRate) }}%
              </span>
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-center flex justify-center">
              <!-- Acciones con iconos -->
              <button
                v-if="student.absences === 3"
                class="bg-green-500 hover:bg-green-600 text-white p-1.5 rounded text-xs mr-1 flex items-center"
                @click="openWhatsappModal(student)"
                title="Enviar WhatsApp"
              >
                <ChatBubbleOvalLeftEllipsisIcon class="h-4 w-4 mr-1" />
              </button>
              <button
                v-if="student.absences === 4"
                class="bg-yellow-500 hover:bg-yellow-600 text-white p-1.5 rounded text-xs mr-1 flex items-center"
                @click="handleAmmonition(student)"
                title="Generar PDF de Amonestación"
              >
                <DocumentTextIcon class="h-4 w-4 mr-1" />
              </button>
              <button
                v-if="student.absences === 5"
                class="bg-red-500 hover:bg-red-600 text-white p-1.5 rounded text-xs flex items-center"
                @click="handleRetiro(student)"
                title="Generar PDF de Retiro"
              >
                <DocumentIcon class="h-4 w-4 mr-1" />
                <span>Retiro</span>
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
    
    <!-- Vista de tarjetas para dispositivos móviles -->
    <div class="md:hidden space-y-4">
      <div class="flex justify-start mb-2 text-sm">
        <button 
          @click="setSort('student')" 
          class="mr-3 flex items-center font-medium"
        >
          Nombre
          <span v-if="sortColumn === 'student'" class="ml-1">{{
            sortDirection === "asc" ? "▲" : "▼"
          }}</span>
        </button>
        <button 
          @click="setSort('absences')" 
          class="mr-3 flex items-center font-medium"
        >
          Ausencias
          <span v-if="sortColumn === 'absences'" class="ml-1">{{
            sortDirection === "asc" ? "▲" : "▼"
          }}</span>
        </button>
        <button 
          @click="setSort('attendanceRate')" 
          class="flex items-center font-medium"
        >
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
            @click="openAbsencesModal(student)"
            class="text-blue-600 underline text-base font-medium cursor-pointer"
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
                {{ Math.round(student.attendanceRate) }}%
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
            @click="openWhatsappModal(student)"
          >
            <ChatBubbleOvalLeftEllipsisIcon class="h-5 w-5 mr-1.5" />
            WhatsApp
          </button>
          <button
            v-if="student.absences === 4"
            class="bg-yellow-500 hover:bg-yellow-600 text-white px-3 py-2 rounded text-sm flex items-center"
            @click="handleAmmonition(student)"
          >
            <DocumentTextIcon class="h-5 w-5 mr-1.5" />
            Amonestación
          </button>
          <button
            v-if="student.absences === 5"
            class="bg-red-500 hover:bg-red-600 text-white px-3 py-2 rounded text-sm flex items-center"
            @click="handleRetiro(student)"
          >
            <DocumentIcon class="h-5 w-5 mr-1.5" />
            Retiro
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
        <div style="text-align: center; margin-bottom: 24px;">
          <!-- Encabezado con título de la institución en lugar de imagen -->
          <div style="font-size: 18px; font-weight: bold; margin-bottom: 8px;">ACADEMIA DE MÚSICA</div>
          <h2 style="color: #b91c1c; margin-bottom: 8px">
            Amonestación Formal por Inasistencias
          </h2>
          <p style="color: #777777; font-style: italic; margin-top: 0;">Documento oficial</p>
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
          <div v-html="pdfAmonestacionFormateado"></div>
        </div>
        
        <!-- Fix: Replacing <p> with <div> to avoid HTML validation error -->
        <div style="margin-top: 40px; text-align: center;">
          <!-- Firma como texto en lugar de imagen -->
          <hr style="border: none; border-top: 1px solid #999; width: 180px; margin: 20px auto 5px;" />
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
        <div style="text-align: center; margin-bottom: 24px;">
          <!-- Encabezado con título de la institución en lugar de imagen -->
          <div style="font-size: 18px; font-weight: bold; margin-bottom: 8px;">ACADEMIA DE MÚSICA</div>
          <h2 style="color: #b91c1c; margin-bottom: 8px">
            Notificación de Retiro por Inasistencias
          </h2>
          <p style="color: #777777; font-style: italic; margin-top: 0;">Documento oficial</p>
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
          <div v-html="pdfRetiroFormateado"></div>
        </div>
        
        <!-- Fix: Replacing <p> with <div> to avoid HTML validation error -->
        <div style="margin-top: 40px; text-align: center;">
          <!-- Firma como texto en lugar de imagen -->
          <hr style="border: none; border-top: 1px solid #999; width: 180px; margin: 20px auto 5px;" />
          <span style="font-weight: bold">Coordinación Académica</span>
        </div>
      </div>
    </div>
    <div
      v-if="showWhatsappModal"
      class="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 p-4"
    >
      <div
        class="bg-white dark:bg-gray-900 rounded-lg shadow-lg p-6 w-full max-w-md"
      >
        <div class="flex items-center mb-4">
          <ChatBubbleOvalLeftEllipsisIcon class="h-6 w-6 text-green-500 mr-2" />
          <h2 class="text-lg font-semibold">Enviar WhatsApp</h2>
        </div>
        <div class="mb-2">
          <strong>Alumno:</strong>
          {{ whatsappStudent ? studentName(whatsappStudent.studentId) : "" }}
        </div>
        <div class="mb-2">
          <strong>Teléfonos:</strong>
          <div v-if="selectedPhones.length">
            <ul>
              <li v-for="phone in selectedPhones" :key="phone">{{ phone }}</li>
            </ul>
          </div>
          <div v-else class="text-red-500 text-xs">
            No hay teléfonos registrados
          </div>
        </div>
        <div class="mb-2">
          <label class="block text-sm font-medium mb-1">Mensaje:</label>
          <textarea
            v-model="whatsappMessage"
            rows="3"
            class="w-full border rounded px-3 py-2 text-sm dark:text-black"
          ></textarea>
        </div>
        <div class="flex justify-end gap-2 mt-4">
          <button
            @click="closeWhatsappModal"
            class="px-4 py-2 rounded bg-gray-300 hover:bg-gray-400 text-gray-700 flex items-center"
          >
            <XMarkIcon class="h-5 w-5 mr-1.5" />
            Cancelar
          </button>
          <button
            @click="sendWhatsappMessage"
            class="px-4 py-2 rounded bg-green-600 hover:bg-green-700 text-white flex items-center"
          >
            <PaperAirplaneIcon class="h-5 w-5 mr-1.5" />
            Enviar
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
        @click="closeAbsencesModal"
        class="absolute top-2 right-2 text-gray-500 hover:text-gray-700 flex items-center justify-center rounded-full h-8 w-8"
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
      <div v-else class="text-gray-500">
        No hay ausencias detalladas para este alumno.
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
// Permitir heredar atributos extra (como 'class') en el div raíz
// eslint-disable-next-line vue/require-explicit-emits
defineOptions({ inheritAttrs: false });
import { ref, nextTick, computed, onMounted } from "vue";
import html2pdf from "html2pdf.js";
import { 
  ExclamationTriangleIcon, 
  ChatBubbleOvalLeftEllipsisIcon, 
  DocumentTextIcon,
  DocumentIcon,
  XMarkIcon,
  PaperAirplaneIcon,
  CalendarIcon
} from "@heroicons/vue/24/outline";
import { useAttendanceStore } from "../modulos/Attendance/store/attendance";
import { useStudentsStore } from "../modulos/Students/store/students";
import { useClassesStore } from "../modulos/Classes/store/classes";
import { db } from "../firebase";
import { doc, setDoc, getDoc } from "firebase/firestore";
import { useAuthStore } from "../stores/auth";

const props = defineProps<{ limit?: number }>();
const authStore = useAuthStore();

// Agregar las variables faltantes
const isLoading = ref(false);
const error = ref<string | null>(null);
const selectedClass = ref<string>('');

// Modal de ausencias detalladas
const showAbsencesModal = ref(false);
const selectedAbsentee = ref<any>(null);

// Computed para ausencias detalladas del alumno seleccionado
type AbsenceDetail = { date: string; classId: string };
const classesStore = useClassesStore();

function getClassName(classId: string): string {
  const classObj = classesStore.classes.find((c) => c.id === classId);
  return classObj?.name || classId || "Clase desconocida";
}

const absencesDetail = computed<AbsenceDetail[]>(() => {
  if (!selectedAbsentee.value) return [];
  // Buscar ausencias en los registros del store
  return attendanceStore.records
    .filter(
      (r) =>
        r.studentId === selectedAbsentee.value.studentId &&
        r.status === "Ausente"
    )
    .map((r) => ({ date: r.fecha, classId: r.classId }));
});

function openAbsencesModal(student: any) {
  selectedAbsentee.value = student;
  showAbsencesModal.value = true;
}
function closeAbsencesModal() {
  showAbsencesModal.value = false;
  selectedAbsentee.value = null;
}

const attendanceStore = useAttendanceStore();
const studentsStore = useStudentsStore();

// Siempre inicializado para evitar undefined
// Por defecto, rango de un mes
function getDefaultMonthRange() {
  const today = new Date();
  const end = today.toISOString().slice(0, 10);
  const prevMonth = new Date(today);
  prevMonth.setMonth(today.getMonth() - 1);
  const start = prevMonth.toISOString().slice(0, 10);
  return { start, end };
}
const absenceRange = ref<{ start: string; end: string }>(
  getDefaultMonthRange()
);

const topAbsentees = ref<any[]>([]);
const absenceSort = ref("absences");

function studentName(studentId: string) {
  const student = studentsStore.getStudentById(studentId);
  if (student) {
    return `${student.nombre || ""} ${student.apellido || ""}`.trim();
  }
  return studentId;
}

function getAttendanceRateClass(rate: number) {
  if (rate >= 90)
    return "bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200";
  if (rate >= 75)
    return "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-200";
  return "bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200";
}

function formatDate(dateString: string): string {
  if (!dateString) return "";
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateString)) return dateString;
  const [year, month, day] = dateString.split("-");
  return `${day}-${month}-${year}`;
}

// Función para formatear el texto del PDF reemplazando saltos de línea y viñetas
const formatearTextoParaPDF = (texto: string) => {
  if (!texto) return '';
  
  // Reemplazar saltos de línea por <br>
  let formateado = texto.replace(/\n/g, '<br>');
  
  // Dar formato a las viñetas para mejor visualización
  formateado = formateado.replace(/• /g, '<span style="display: inline-block; width: 20px; margin-left: 10px;">•</span>');
  
  return formateado;
};

// Computed para formatos HTML de los mensajes
const pdfAmonestacionFormateado = computed(() => {
  return formatearTextoParaPDF(pdfAmonestacionData.value.mensaje);
});

const pdfRetiroFormateado = computed(() => {
  return formatearTextoParaPDF(pdfRetiroData.value.mensaje);
});
// En TopAbsenteesByRange.vue, alrededor de la línea 555
async function calcularTopAbsentees() {
  try {
    isLoading.value = true;
    error.value = null;
    
    const result = await attendanceStore.fetchTopAbsentStudentsByRange(
      formattedStartDate.value,
      formattedEndDate.value,
      parseInt(props.limit || '10', 10),
      selectedClass.value || undefined
    );
    
    // Procesamiento adicional si es necesario
    topAbsentees.value = result;
  } catch (err: any) {
    console.error('Error al obtener datos de asistencia:', err);
    error.value = `Error al obtener datos de asistencia: ${err.message || err}`;
    topAbsentees.value = []; // Asegurar que no haya datos parciales
  } finally {
    isLoading.value = false;
  }
}

const sortColumn = ref<
  "student" | "absences" | "attendanceRate" | "totalClasses"
>("absences");
const sortDirection = ref<"asc" | "desc">("desc");

// --- Persistencia de filtro en Firestore ---
async function guardarFiltroUsuario() {
  const userId = authStore.user?.uid;
  if (!userId) return;
  const filtro = {
    columna: sortColumn.value,
    direccion: sortDirection.value,
    rangoFechas: { ...absenceRange.value },
  };
  await setDoc(doc(db, "CONFIGURACION", `${userId}_TopAbsenteesByRange`), {
    tabla: "TopAbsenteesByRange",
    filtro,
    usuarioId: userId,
    timestamp: new Date(),
  });
}

async function restaurarFiltroUsuario() {
  const userId = authStore.user?.uid;
  if (!userId) return;
  
  try {
    const filtroDoc = await getDoc(
      doc(db, "CONFIGURACION", `${userId}_TopAbsenteesByRange`)
    );
    
    if (filtroDoc.exists()) {
      const { filtro } = filtroDoc.data();
      if (filtro) {
        if (filtro.columna) sortColumn.value = filtro.columna;
        if (filtro.direccion) sortDirection.value = filtro.direccion;
        if (filtro.rangoFechas) {
          absenceRange.value.start =
            filtro.rangoFechas?.start ?? getDefaultMonthRange().start;
          absenceRange.value.end =
            filtro.rangoFechas?.end ?? getDefaultMonthRange().end;
        }
      }
    } else {
      // Si no hay filtro guardado, usar un mes por defecto
      const def = getDefaultMonthRange();
      absenceRange.value.start = def.start;
      absenceRange.value.end = def.end;
    }
  } catch (error) {
    console.error("Error al restaurar filtros:", error);
    // En caso de error, utilizar valores por defecto
    const def = getDefaultMonthRange();
    absenceRange.value.start = def.start;
    absenceRange.value.end = def.end;
  }
}

const sortedAbsentees = computed(() => {
  if (!topAbsentees.value) return [];
  const arr = [...topAbsentees.value];
  return arr.sort((a, b) => {
    let valA, valB;
    switch (sortColumn.value) {
      case "student":
        valA = studentName(a.studentId);
        valB = studentName(b.studentId);
        break;
      case "absences":
        valA = a.absences;
        valB = b.absences;
        break;
      case "attendanceRate":
        valA = a.attendanceRate;
        valB = b.attendanceRate;
        break;
      case "totalClasses":
        valA = a.totalClasses;
        valB = b.totalClasses;
        break;
      default:
        valA = a.absences;
        valB = b.absences;
    }
    if (valA < valB) return sortDirection.value === "asc" ? -1 : 1;
    if (valA > valB) return sortDirection.value === "asc" ? 1 : -1;
    return 0;
  });
});

async function setSort(
  column: "student" | "absences" | "attendanceRate" | "totalClasses"
) {
  if (sortColumn.value === column) {
    sortDirection.value = sortDirection.value === "asc" ? "desc" : "asc";
  } else {
    sortColumn.value = column;
    sortDirection.value = column === "student" ? "asc" : "desc";
  }
  await guardarFiltroUsuario();
}

// Computed para fechas formateadas
const formattedStartDate = computed(() => absenceRange.value?.start || '');
const formattedEndDate = computed(() => absenceRange.value?.end || '');

// Función para filtrar ausencias por rango de fechas
async function filtrarAusenciasPorRango() {
  await calcularTopAbsentees();
  await guardarFiltroUsuario();
}

// Inicialización
onMounted(async () => {
  await restaurarFiltroUsuario();
  await calcularTopAbsentees();
});

const showWhatsappModal = ref(false);
const whatsappStudent = ref<any>(null);
const whatsappMessage = ref(
  "Estimado representante, su representado tiene 3 inasistencias. Por favor, comuníquese con la coordinación."
);
const selectedPhones = ref<string[]>([]);

// Textos específicos para cada nivel de inasistencia
const getWhatsappInasistenciasTexto = (studentName: string, instrument: string = "") => {
  const instrumentText = instrument ? ` de ${instrument}` : '';
  return `Estimado representante,

Por medio de la presente comunicación se le notifica que el alumno ${studentName}, estudiante${instrumentText} de nuestra institución, ha acumulado 3 inasistencias.

Las ausencias afectan significativamente el progreso individual y colectivo, ya que la práctica musical en conjunto requiere la participación regular de todos los integrantes para mantener el avance del grupo.

Le solicitamos comunicarse a la brevedad con la Coordinación Académica para aclarar los motivos de estas ausencias y tomar las medidas necesarias para evitar que la situación progrese a una amonestación formal.

Atentamente,
Coordinación Académica`;
};

const getAmonestacionTexto = (studentName: string, instrument: string = "", studentId: string = "") => {
  const instrumentText = instrument ? ` de ${instrument}` : '';
  return `Nos dirigimos a usted para notificar formalmente que el alumno ${studentName} (ID: ${studentId}), estudiante${instrumentText} de nuestra institución musical, ha acumulado un total de 4 inasistencias a la fecha.

De acuerdo al reglamento de nuestra institución, este número de ausencias representa un impedimento significativo para el adecuado desarrollo musical del estudiante y afecta directamente al avance del grupo en las clases colectivas. La música como disciplina colectiva requiere de la participación constante y comprometida de todos sus integrantes.

Las ausencias provocan:
• Retraso en el aprendizaje individual del estudiante
• Desbalance en los ensambles musicales
• Dificultad para mantener el progreso y repertorio del conjunto
• Necesidad de tiempo adicional para nivelación

Esta amonestación formal constituye un aviso previo a la posible solicitud de retiro del programa si se acumula una ausencia adicional. Le solicitamos contactar urgentemente a la Coordinación Académica para discutir medidas correctivas y compromisos de asistencia futura.`;
};

const getRetiroTexto = (studentName: string, instrument: string = "", studentId: string = "") => {
  const instrumentText = instrument ? ` de ${instrument}` : '';
  return `Por medio de la presente, nos vemos en la obligación de notificar que el alumno ${studentName} (ID: ${studentId}), estudiante${instrumentText} de nuestra institución musical, ha acumulado un total de 5 inasistencias, superando el límite establecido en nuestro reglamento académico.

En consecuencia, y velando por la calidad de la formación colectiva de todos nuestros estudiantes, procedemos a notificar:

1. El retiro temporal del estudiante del programa actual
2. La solicitud de devolución del instrumento asignado (si aplica)
3. La suspensión de las clases hasta nueva evaluación

En una institución dedicada a la formación musical, la práctica colectiva constituye un pilar fundamental de aprendizaje. Las inasistencias recurrentes generan un impacto negativo significativo en:
• El progreso del conjunto musical
• La cohesión del grupo
• El avance en el repertorio programado
• El desarrollo técnico secuencial requerido

El estudiante podrá solicitar su reingreso para un próximo ciclo mediante una carta de compromiso formal, donde exprese su disponibilidad para cumplir con la asistencia requerida. Dicha solicitud será evaluada por el consejo académico.

Agradecemos su comprensión y quedamos a su disposición para cualquier aclaratoria adicional.`;
};

async function openWhatsappModal(student: any) {
  whatsappStudent.value = student;
  // Obtener teléfonos padre/madre si existen
  const studentData = studentsStore.getStudentById(student.studentId);
  selectedPhones.value = [];
  if (studentData?.tlf_padre) selectedPhones.value.push(studentData.tlf_padre);
  if (studentData?.tlf_madre) selectedPhones.value.push(studentData.tlf_madre);
  
  // Personalizar mensaje con datos del estudiante
  const estudiante = studentName(student.studentId);
  const instrumento = studentData?.instrumento || "";
  whatsappMessage.value = getWhatsappInasistenciasTexto(estudiante, instrumento);
  
  showWhatsappModal.value = true;
}
function closeWhatsappModal() {
  showWhatsappModal.value = false;
  whatsappStudent.value = null;
}
async function sendWhatsappMessage() {
  const webhookUrl = import.meta.env.VITE_WEBHOOK_URL;
  if (!webhookUrl) {
    alert("Error: No está definida la URL del webhook (VITE_WEBHOOK_URL)");
    return;
  }
  const payload = {
    studentId: whatsappStudent.value.studentId,
    nombre: studentName(whatsappStudent.value.studentId),
    phones: selectedPhones.value,
    message: whatsappMessage.value,
    tipo: "invitacion-mensaje",
  };
  try {
    await fetch(webhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });
    closeWhatsappModal();
    alert("Mensaje enviado");
  } catch (e) {
    alert("Error enviando el mensaje al webhook");
  }
}
async function handleAmmonition(student: any) {
  try {
    const webhookUrl = import.meta.env.VITE_WEBHOOK_URL;
    if (!webhookUrl) {
      alert("Error: No está definida la URL del webhook (VITE_WEBHOOK_URL)");
      return;
    }
    
    // Obtener datos del estudiante
    const studentData = studentsStore.getStudentById(student.studentId);
    const nombreCompleto = studentName(student.studentId);
    const instrumento = studentData?.instrumento || "";
    
    // Rellenar datos para el PDF
    const pdfContent = document.getElementById("pdf-amonestacion");
    pdfAmonestacionData.value = {
      nombre: nombreCompleto,
      fecha: new Date().toLocaleDateString(),
      motivo: "Acumulación de 4 inasistencias",
      mensaje: getAmonestacionTexto(nombreCompleto, instrumento, student.studentId),
    };
    
    await nextTick();
    
    // Configuración optimizada para html2pdf
    const opt = {
      margin: 10,
      filename: `amonestacion_${student.studentId}.pdf`,
      html2canvas: { 
        scale: 2,
        logging: false,
        useCORS: true
      },
      jsPDF: { 
        unit: "mm", 
        format: "a4", 
        orientation: "portrait",
        compress: true
      },
    };
    
    try {
      // Generar PDF y obtener base64
      const pdfBlob = await html2pdf().from(pdfContent).set(opt).outputPdf("blob");
      // Descargar localmente
      html2pdf().from(pdfContent).set(opt).save();
      // Convertir a base64
      const base64 = await blobToBase64(pdfBlob);
      
      // Enviar al webhook
      const payload = {
        studentId: student.studentId,
        nombre: nombreCompleto,
        tipo: "amonestacion",
        mensaje: "Se ha generado una amonestación por 4 inasistencias",
        fecha: new Date().toISOString(),
        pdfBase64: base64,
      };
      
      await fetch(webhookUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });
      
      alert("PDF de amonestación generado, descargado y enviado al webhook");
    } catch (error) {
      console.error("Error generando o enviando el PDF:", error);
      alert("Error al generar el PDF. Se descargará una copia local.");
      // Intentar solo la descarga local como fallback
      html2pdf().from(pdfContent).set(opt).save();
    }
  } catch (error) {
    console.error("Error en el procesamiento de la amonestación:", error);
    alert("Se produjo un error al procesar la amonestación. Por favor, inténtelo nuevamente.");
  }
}

async function handleRetiro(student: any) {
  try {
    const webhookUrl = import.meta.env.VITE_WEBHOOK_URL;
    if (!webhookUrl) {
      alert("Error: No está definida la URL del webhook (VITE_WEBHOOK_URL)");
      return;
    }
    
    // Obtener datos del estudiante
    const studentData = studentsStore.getStudentById(student.studentId);
    const nombreCompleto = studentName(student.studentId);
    const instrumento = studentData?.instrumento || "";
    
    // Rellenar datos para el PDF
    const pdfContent = document.getElementById("pdf-retiro");
    pdfRetiroData.value = {
      nombre: nombreCompleto,
      fecha: new Date().toLocaleDateString(),
      motivo: "Acumulación de 5 inasistencias",
      mensaje: getRetiroTexto(nombreCompleto, instrumento, student.studentId),
    };
    
    await nextTick();
    
    // Configuración optimizada para html2pdf
    const opt = {
      margin: 10,
      filename: `retiro_${student.studentId}.pdf`,
      html2canvas: { 
        scale: 2,
        logging: false,
        useCORS: true
      },
      jsPDF: { 
        unit: "mm", 
        format: "a4", 
        orientation: "portrait",
        compress: true
      },
    };
    
    try {
      // Generar PDF y obtener base64
      const pdfBlob = await html2pdf().from(pdfContent).set(opt).outputPdf("blob");
      // Descargar localmente
      html2pdf().from(pdfContent).set(opt).save();
      // Convertir a base64
      const base64 = await blobToBase64(pdfBlob);
      
      // Enviar al webhook
      const payload = {
        studentId: student.studentId,
        nombre: nombreCompleto,
        tipo: "retiro",
        mensaje: "Por 5 inasistencias, se solicita devolución del instrumento y se notifica retiro del programa. Puede reingresar en el futuro.",
        fecha: new Date().toISOString(),
        pdfBase64: base64,
      };
      
      await fetch(webhookUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });
      
      alert("PDF de retiro generado, descargado y enviado al webhook");
    } catch (error) {
      console.error("Error generando o enviando el PDF:", error);
      alert("Error al generar el PDF. Se descargará una copia local.");
      // Intentar solo la descarga local como fallback
      html2pdf().from(pdfContent).set(opt).save();
    }
  } catch (error) {
    console.error("Error en el procesamiento del retiro:", error);
    alert("Se produjo un error al procesar el documento de retiro. Por favor, inténtelo nuevamente.");
  }
}

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve((reader.result as string).split(",")[1]);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

const pdfAmonestacionData = ref({
  nombre: "",
  fecha: "",
  motivo: "",
  mensaje: "",
});

const pdfRetiroData = ref({ nombre: "", fecha: "", motivo: "", mensaje: "" });
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
