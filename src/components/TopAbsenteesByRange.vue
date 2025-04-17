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
          class="grid grid-cols-2 sm:flex sm:flex-row gap-2 w-full sm:w-auto"
        >
          <div class="flex items-center">
            <label class="text-sm whitespace-nowrap mr-1">Desde:</label>
            <input
              type="date"
              v-model="absenceRange.start"
              class="dark:text-black border rounded px-2 py-1 text-sm w-full"
            />
          </div>
          <div class="flex items-center">
            <label class="text-sm whitespace-nowrap mr-1">Hasta:</label>
            <input
              type="date"
              v-model="absenceRange.end"
              class="border dark:text-black rounded px-2 py-1 text-sm w-full"
            />
          </div>
          <button
            @click="filtrarAusenciasPorRango"
            class="col-span-2 sm:col-span-1 sm:ml-2 px-3 py-1 bg-indigo-600 text-white rounded text-sm hover:bg-indigo-700 transition-colors duration-200"
          >
            Filtrar
          </button>
        </div>
      </div>
    </div>
    <div class="overflow-x-auto">
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
              <span
                :class="getAttendanceRateClass(student.attendanceRate)"
                class="px-2 py-1 rounded-full text-xs"
              >
                {{ Math.round(student.attendanceRate) }}%
              </span>
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-center">
              <!-- Acciones -->
              <button
                v-if="student.absences === 3"
                class="bg-green-500 hover:bg-green-600 text-white px-2 py-1 rounded text-xs mr-1"
                @click="openWhatsappModal(student)"
              >
                WhatsApp
              </button>
              <button
                v-if="student.absences === 4"
                class="bg-yellow-500 hover:bg-yellow-600 text-white px-2 py-1 rounded text-xs mr-1"
                @click="handleAmmonition(student)"
              >
                PDF Amonestación
              </button>
              <button
                v-if="student.absences === 5"
                class="bg-red-500 hover:bg-red-600 text-white px-2 py-1 rounded text-xs"
                @click="handleRetiro(student)"
              >
                PDF Retiro
              </button>
            </td>
          </tr>
        </tbody>
      </table>
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
        <h2 style="color: #b91c1c; text-align: center; margin-bottom: 16px">
          Amonestación Formal
        </h2>
        <p><strong>Fecha:</strong> {{ pdfAmonestacionData.fecha }}</p>
        <p><strong>Alumno:</strong> {{ pdfAmonestacionData.nombre }}</p>
        <p><strong>Motivo:</strong> {{ pdfAmonestacionData.motivo }}</p>
        <div
          style="
            margin: 20px 0;
            padding: 16px;
            background: #fef2f2;
            border-left: 4px solid #b91c1c;
          "
        >
          {{ pdfAmonestacionData.mensaje }}
        </div>
        <p style="margin-top: 40px">
          Atentamente,<br /><span style="font-weight: bold"
            >Coordinación Académica</span
          >
        </p>
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
        <h2 style="color: #b91c1c; text-align: center; margin-bottom: 16px">
          Notificación de Retiro
        </h2>
        <p><strong>Fecha:</strong> {{ pdfRetiroData.fecha }}</p>
        <p><strong>Alumno:</strong> {{ pdfRetiroData.nombre }}</p>
        <p><strong>Motivo:</strong> {{ pdfRetiroData.motivo }}</p>
        <div
          style="
            margin: 20px 0;
            padding: 16px;
            background: #fef2f2;
            border-left: 4px solid #b91c1c;
          "
        >
          {{ pdfRetiroData.mensaje }}
        </div>
        <p style="margin-top: 40px">
          Atentamente,<br /><span style="font-weight: bold"
            >Coordinación Académica</span
          >
        </p>
      </div>
    </div>
    <div
      v-if="showWhatsappModal"
      class="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50"
    >
      <div
        class="bg-white dark:bg-gray-900 rounded-lg shadow-lg p-6 w-full max-w-md"
      >
        <h2 class="text-lg font-semibold mb-2">Enviar WhatsApp</h2>
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
            class="w-full border rounded px-2 py-1 dark:text-black"
          ></textarea>
        </div>
        <div class="flex justify-end gap-2 mt-4">
          <button
            @click="closeWhatsappModal"
            class="px-3 py-1 rounded bg-gray-300 hover:bg-gray-400 text-gray-700"
          >
            Cancelar
          </button>
          <button
            @click="sendWhatsappMessage"
            class="px-3 py-1 rounded bg-green-600 hover:bg-green-700 text-white"
          >
            Enviar
          </button>
        </div>
      </div>
    </div>
  </div>
  <!-- MODAL DE AUSENCIAS POR ALUMNO -->
  <div
    v-if="showAbsencesModal"
    class="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50"
  >
    <div
      class="bg-white dark:bg-gray-900 rounded-lg shadow-lg p-6 w-full max-w-md relative"
    >
      <button
        @click="closeAbsencesModal"
        class="absolute top-2 right-2 text-gray-500 hover:text-gray-700 text-xl"
      >
        &times;
      </button>
      <h2 class="text-lg font-semibold mb-4">
        Ausencias de {{ studentName(selectedAbsentee?.studentId) }}
      </h2>
      <div v-if="absencesDetail.length">
        <ul class="list-disc pl-4">
          <li v-for="(absence, i) in absencesDetail" :key="i">
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
import { ExclamationTriangleIcon } from "@heroicons/vue/24/outline";
import { useAttendanceStore } from "../modulos/Attendance/store/attendance";
import { useStudentsStore } from "../modulos/Students/store/students";
import { useClassesStore } from "../modulos/Classes/store/classes";
import { db } from "../firebase";
import { doc, setDoc, getDoc } from "firebase/firestore";
import { useAuthStore } from "../stores/auth";

const props = defineProps<{ limit?: number }>();
const authStore = useAuthStore();

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
        (r.status === "Ausente" || r.status === "Ausencia")
    )
    .map((r) => ({ date: r.date || r.Fecha, classId: r.classId }));
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

async function calcularTopAbsentees(startDate: string, endDate: string) {
  await attendanceStore.fetchAttendanceByDateRange(startDate, endDate);
  topAbsentees.value = attendanceStore.calculateAbsentStudents(
    props.limit || 10
  );
}

async function filtrarAusenciasPorRango() {
  await calcularTopAbsentees(absenceRange.value.start, absenceRange.value.end);
  await guardarFiltroUsuario();
}

const sortColumn = ref<
  "student" | "absences" | "attendanceRate"
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
  column: "student" | "absences" | "attendanceRate"
) {
  if (sortColumn.value === column) {
    sortDirection.value = sortDirection.value === "asc" ? "desc" : "asc";
  } else {
    sortColumn.value = column;
    sortDirection.value = column === "student" ? "asc" : "desc";
  }
  await guardarFiltroUsuario();
}

// Inicialización
onMounted(async () => {
  await restaurarFiltroUsuario();
  // Proteger acceso a absenceRange
  calcularTopAbsentees(
    absenceRange.value?.start ?? "",
    absenceRange.value?.end ?? ""
  );
});

const showWhatsappModal = ref(false);
const whatsappStudent = ref<any>(null);
const whatsappMessage = ref(
  "Estimado representante, su representado tiene 3 inasistencias. Por favor, comuníquese con la coordinación."
);
const selectedPhones = ref<string[]>([]);

function openWhatsappModal(student: any) {
  whatsappStudent.value = student;
  // Obtener teléfonos padre/madre si existen
  const studentData = studentsStore.getStudentById(student.studentId);
  selectedPhones.value = [];
  if (studentData?.tlf_padre) selectedPhones.value.push(studentData.tlf_padre);
  if (studentData?.tlf_madre) selectedPhones.value.push(studentData.tlf_madre);
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
  const webhookUrl = import.meta.env.VITE_WEBHOOK_URL;
  if (!webhookUrl) {
    alert("Error: No está definida la URL del webhook (VITE_WEBHOOK_URL)");
    return;
  }
  // Rellenar datos para el PDF
  const pdfContent = document.getElementById("pdf-amonestacion");
  pdfAmonestacionData.value = {
    nombre: studentName(student.studentId),
    fecha: new Date().toLocaleDateString(),
    motivo: "Acumulación de 4 inasistencias",
    mensaje:
      "Se le notifica formalmente que su representado ha acumulado 4 inasistencias. Favor comunicarse con la coordinación.",
  };
  await nextTick();
  // Generar PDF y obtener base64
  const opt = {
    margin: 10,
    filename: `amonestacion_${student.studentId}.pdf`,
    html2canvas: { scale: 2 },
    jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
  };
  const pdfBlob = await html2pdf().from(pdfContent).set(opt).outputPdf("blob");
  // Descargar localmente
  html2pdf().from(pdfContent).set(opt).save();
  // Convertir a base64
  const base64 = await blobToBase64(pdfBlob);
  // Enviar al webhook
  const payload = {
    studentId: student.studentId,
    nombre: studentName(student.studentId),
    tipo: "amonestacion",
    mensaje: "Se ha generado una amonestación por 4 inasistencias",
    fecha: new Date().toISOString(),
    pdfBase64: base64,
  };
  try {
    await fetch(webhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });
    alert("PDF de amonestación generado, descargado y enviado al webhook");
  } catch (e) {
    alert("Error enviando la amonestación al webhook");
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
async function handleRetiro(student: any) {
  const webhookUrl = import.meta.env.VITE_WEBHOOK_URL;
  if (!webhookUrl) {
    alert("Error: No está definida la URL del webhook (VITE_WEBHOOK_URL)");
    return;
  }
  // Rellenar datos para el PDF
  const pdfContent = document.getElementById("pdf-retiro");
  pdfRetiroData.value = {
    nombre: studentName(student.studentId),
    fecha: new Date().toLocaleDateString(),
    motivo: "Acumulación de 5 inasistencias",
    mensaje:
      "Por acumulación de 5 inasistencias, se solicita devolución del instrumento y se notifica retiro del programa. Puede reingresar en el futuro.",
  };
  await nextTick();
  // Generar PDF y obtener base64
  const opt = {
    margin: 10,
    filename: `retiro_${student.studentId}.pdf`,
    html2canvas: { scale: 2 },
    jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
  };
  const pdfBlob = await html2pdf().from(pdfContent).set(opt).outputPdf("blob");
  // Descargar localmente
  html2pdf().from(pdfContent).set(opt).save();
  // Convertir a base64
  const base64 = await blobToBase64(pdfBlob);
  // Enviar al webhook
  const payload = {
    studentId: student.studentId,
    nombre: studentName(student.studentId),
    tipo: "retiro",
    mensaje:
      "Por 5 inasistencias, se solicita devolución del instrumento y se notifica retiro del programa. Puede reingresar en el futuro.",
    fecha: new Date().toISOString(),
    pdfBase64: base64,
  };
  try {
    await fetch(webhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });
    alert("PDF de retiro generado, descargado y enviado al webhook");
  } catch (e) {
    alert("Error enviando el retiro al webhook");
  }
}

const pdfRetiroData = ref({ nombre: "", fecha: "", motivo: "", mensaje: "" });
</script>

<style scoped></style>
