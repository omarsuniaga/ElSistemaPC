<template>
  <div>
    <div class="flex justify-end mb-4">
      <button class="btn btn-primary flex items-center gap-2" @click="exportProfileToPDF">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          class="h-5 w-5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M12 4v16m8-8H4"
          />
        </svg>
        Exportar a PDF
      </button>
      <button
        v-if="!isEditing"
        class="btn bg-red-600 hover:bg-red-700 text-white font-bold px-4 py-2 rounded-lg shadow transition-all duration-200 ml-2"
        title="Eliminar alumno"
        @click="handleDelete"
      >
        <TrashIcon class="w-5 h-5 inline mr-1" /> Eliminar
      </button>
    </div>
    <div id="student-profile-pdf">
      <div class="student-profile mb-16 px-2 sm:px-4 md:px-8">
        <!-- Header con avatar y acciones -->
        <div
          class="profile-header bg-gradient-to-r from-blue-500 to-indigo-600 text-white p-8 rounded-b-3xl shadow-lg flex flex-col items-center relative"
        >
          <div class="absolute top-4 right-4 flex gap-2">
            <button
              v-if="!isEditing"
              class="btn bg-white/20 hover:bg-white/40 text-white font-bold px-4 py-2 rounded-lg shadow transition-all duration-200"
              title="Editar perfil"
              @click="handleEdit"
            >
              <PencilIcon class="w-5 h-5 inline mr-1" /> Editar
            </button>
          </div>
          <StudentAvatar
            :first-name="student.nombre || ''"
            :last-name="student.apellido || ''"
            size="xl"
            class="shadow-lg border-4 border-white mb-4"
          />
          <h1 class="text-3xl font-extrabold tracking-tight mb-2 drop-shadow-lg">
            {{ student.nombre }} {{ student.apellido }}
          </h1>
          <div class="flex gap-2 mb-2">
            <span
              class="inline-flex items-center px-3 py-1 rounded-full bg-white/20 text-white font-semibold text-sm shadow"
            >
              <MusicalNoteIcon class="w-4 h-4 mr-1" />
              {{ student.instrumento?.nombre || student.instrumento || "Sin instrumento" }}
            </span>
            <span
              v-if="student.clase"
              class="inline-flex items-center px-3 py-1 rounded-full bg-indigo-400/60 text-white font-semibold text-sm shadow"
            >
              <AcademicCapIcon class="w-4 h-4 mr-1" />
              {{ student.clase }}
            </span>
          </div>
          <div v-if="isEditing" class="flex gap-3 mt-2">
            <button
              class="btn bg-green-600 hover:bg-green-700 text-white font-bold px-4 py-2 rounded-lg shadow transition-all duration-200"
              title="Guardar cambios"
              @click="handleSave"
            >
              <CheckIcon class="w-5 h-5 inline mr-1" /> Guardar
            </button>
            <button
              class="btn bg-gray-600 hover:bg-gray-700 text-white font-bold px-4 py-2 rounded-lg shadow transition-all duration-200"
              title="Cancelar edición"
              @click="handleCancel"
            >
              <XMarkIcon class="w-5 h-5 inline mr-1" /> Cancelar
            </button>
          </div>
        </div>

        <!-- Tarjetas de información -->
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-6 mt-8">
          <!-- Información Personal -->
          <div class="card bg-white dark:bg-gray-800 shadow rounded-xl p-6">
            <h2
              class="flex items-center gap-2 text-lg font-semibold mb-4 text-blue-700 dark:text-blue-300"
            >
              <UserIcon class="w-5 h-5" /> Información Personal
            </h2>
            <div class="space-y-2">
              <div><span class="font-medium">Edad:</span> {{ calculatedAge }} años</div>
              <div><span class="font-medium">Fecha de Nacimiento:</span> {{ student.nac }}</div>
              <div><span class="font-medium">Sexo:</span> {{ student.sexo }}</div>
              <div><span class="font-medium">Madre:</span> {{ student.madre }}</div>
              <div><span class="font-medium">Padre:</span> {{ student.padre }}</div>
            </div>
          </div>
          <!-- Información Académica -->
          <div class="card bg-white dark:bg-gray-800 shadow rounded-xl p-6">
            <h2
              class="flex items-center gap-2 text-lg font-semibold mb-4 text-indigo-700 dark:text-indigo-300"
            >
              <AcademicCapIcon class="w-5 h-5" /> Información Académica
            </h2>
            <div class="space-y-2">
              <div>
                <span class="font-medium">Instrumento:</span>
                {{ student.instrumento?.nombre || student.instrumento }}
              </div>
              <div><span class="font-medium">Clase:</span> {{ student.clase }}</div>
              <div>
                <span class="font-medium">Grupos:</span>
                <span v-if="student.grupo && student.grupo.length > 0">{{
                  student.grupo.join(", ")
                }}</span
                ><span v-else>Sin grupos</span>
              </div>
              <div>
                <span class="font-medium">Nivel:</span> {{ student.nivel || "No especificado" }}
              </div>
            </div>
          </div>
          <!-- Contacto -->
          <div class="card bg-white dark:bg-gray-800 shadow rounded-xl p-6">
            <h2
              class="flex items-center gap-2 text-lg font-semibold mb-4 text-green-700 dark:text-green-300"
            >
              <PhoneIcon class="w-5 h-5" /> Contacto
            </h2>
            <div class="space-y-2">
              <div><span class="font-medium">Teléfono:</span> {{ student.tlf }}</div>
              <div><span class="font-medium">Email:</span> {{ student.email }}</div>
              <div><span class="font-medium">Dirección:</span> {{ student.direccion }}</div>
            </div>
          </div>
          <!-- Documentos -->
          <div class="card bg-white dark:bg-gray-800 shadow rounded-xl p-6">
            <h2
              class="flex items-center gap-2 text-lg font-semibold mb-4 text-amber-700 dark:text-amber-300"
            >
              <DocumentTextIcon class="w-5 h-5" /> Documentos
            </h2>
            <div class="space-y-2">
              <div v-if="student.documentos?.contrato_instrumento">
                <span class="font-medium">Contrato de Instrumento:</span>
                <a
                  :href="student.documentos.contrato_instrumento.url"
                  target="_blank"
                  class="text-blue-600 hover:underline ml-2"
                  >Ver documento</a
                >
              </div>
              <div v-else class="text-gray-500 italic">Contrato de instrumento no subido</div>
              <div v-if="student.documentos?.terminos_condiciones">
                <span class="font-medium">Términos y Condiciones:</span>
                <a
                  :href="student.documentos.terminos_condiciones.url"
                  target="_blank"
                  class="text-blue-600 hover:underline ml-2"
                  >Ver documento</a
                >
              </div>
              <div v-else class="text-gray-500 italic">Términos y condiciones no subidos</div>
            </div>
          </div>
        </div>

        <!-- Estadísticas y asistencia -->
        <div class="mt-8 flex flex-col gap-6 md:flex-row md:items-start">
          <!-- Gráfico circular y estadísticas -->
          <div
            class="flex flex-col items-center justify-center bg-white dark:bg-gray-800 shadow rounded-xl p-6 w-full md:w-1/3 mb-6 md:mb-0"
          >
            <svg class="w-24 h-24 mb-2" viewBox="0 0 100 100">
              <circle cx="50" cy="50" r="40" fill="none" stroke="#e5e7eb" stroke-width="10" />
              <circle
                cx="50"
                cy="50"
                r="40"
                fill="none"
                :stroke="
                  studentAttendance.summary?.attendanceRate >= 80
                    ? '#22c55e'
                    : studentAttendance.summary?.attendanceRate >= 60
                      ? '#f59e0b'
                      : '#ef4444'
                "
                stroke-width="10"
                :stroke-dasharray="`${studentAttendance.summary?.attendanceRate || 0}, 100`"
                stroke-dashoffset="25"
                transform="rotate(-90 50 50)"
              />
              <text
                x="50"
                y="50"
                text-anchor="middle"
                dominant-baseline="middle"
                font-size="18"
                font-weight="bold"
                :fill="
                  studentAttendance.summary?.attendanceRate >= 80
                    ? '#22c55e'
                    : studentAttendance.summary?.attendanceRate >= 60
                      ? '#f59e0b'
                      : '#ef4444'
                "
              >
                {{ studentAttendance.summary?.attendanceRate || 0 }}%
              </text>
            </svg>
            <div class="text-center text-sm text-gray-600 dark:text-gray-400 mt-2">Asistencia</div>
          </div>
          <div class="grid grid-cols-2 gap-4 flex-1 w-full md:w-2/3">
            <!-- Estadísticas clave -->
            <div class="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg shadow-sm text-center">
              <div class="text-xs text-gray-500">Clases Totales</div>
              <div class="text-2xl font-bold text-blue-600 dark:text-blue-400">
                {{ studentAttendance.summary?.total || 0 }}
              </div>
            </div>
            <div class="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg shadow-sm text-center">
              <div class="text-xs text-gray-500">Asistencias</div>
              <div class="text-2xl font-bold text-green-600 dark:text-green-400">
                {{ studentAttendance.summary?.present || 0 }}
              </div>
            </div>
            <div class="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg shadow-sm text-center">
              <div class="text-xs text-gray-500">Ausencias</div>
              <div class="text-2xl font-bold text-red-600 dark:text-red-400">
                {{ studentAttendance.summary?.absent || 0 }}
              </div>
            </div>
            <div class="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg shadow-sm text-center">
              <div class="text-xs text-gray-500">Tardanzas</div>
              <div class="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
                {{ studentAttendance.summary?.late || 0 }}
              </div>
            </div>
          </div>
        </div>
        <!-- Gráfica de tendencia de asistencia -->
        <div class="mt-8 bg-white dark:bg-gray-800 shadow rounded-xl p-6">
          <h3
            class="text-lg font-semibold mb-4 flex items-center gap-2 text-blue-700 dark:text-blue-300"
          >
            <ChartBarIcon class="w-5 h-5" /> Tendencia de Asistencia
          </h3>
          <div class="w-full overflow-x-auto">
            <Line
              :data="attendanceData"
              :options="chartOptions"
              style="min-width: 320px; max-width: 100%; height: 320px"
            />
          </div>
        </div>
        <!-- Historial de asistencias -->
        <div class="mt-8 bg-white dark:bg-gray-800 shadow rounded-xl p-6 overflow-x-auto">
          <h3
            class="text-lg font-semibold mb-4 flex items-center gap-2 text-blue-700 dark:text-blue-300"
          >
            <CalendarIcon class="w-5 h-5" /> Asistencias Recientes
          </h3>
          <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead class="bg-blue-50 dark:bg-blue-900/20">
              <tr>
                <th
                  class="px-3 py-3 text-left text-xs font-medium text-blue-700 dark:text-blue-400 uppercase tracking-wider"
                >
                  Fecha
                </th>
                <th
                  class="px-3 py-3 text-left text-xs font-medium text-blue-700 dark:text-blue-400 uppercase tracking-wider"
                >
                  Clase
                </th>
                <th
                  class="px-3 py-3 text-left text-xs font-medium text-blue-700 dark:text-blue-400 uppercase tracking-wider"
                >
                  Estado
                </th>
              </tr>
            </thead>
            <tbody class="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-800">
              <tr v-for="(record, index) in filteredAttendanceRecords" :key="index">
                <td class="px-3 py-2 text-sm">{{ record.formattedDateCapitalized }}</td>
                <td class="px-3 py-2 text-sm">{{ record.className }}</td>
                <td class="px-3 py-2 text-sm">
                  <span
                    v-if="record.status && record.status.toLowerCase() === 'ausente'"
                    class="badge bg-red-100 text-red-700"
                    >Ausente</span
                  >
                  <span
                    v-else-if="record.status && record.status.toLowerCase() === 'presente'"
                    class="badge bg-green-100 text-green-700"
                    >Presente</span
                  >
                  <span
                    v-else-if="record.status && record.status.toLowerCase() === 'tardanza'"
                    class="badge bg-yellow-100 text-yellow-700"
                    >Tardanza</span
                  >
                  <span
                    v-else-if="record.status && record.status.toLowerCase() === 'justificado'"
                    class="badge bg-blue-100 text-blue-700"
                    >Justificado</span
                  >
                  <span v-else class="badge bg-gray-100 text-gray-700">{{
                    record.status || "No registrado"
                  }}</span>
                  <span v-if="record.justification" class="ml-2 text-xs italic text-gray-500"
                    >({{ record.justification }})</span
                  >
                </td>
              </tr>
              <tr v-if="filteredAttendanceRecords.length === 0">
                <td colspan="3" class="px-3 py-8 text-center text-gray-500">
                  No hay registros de asistencia en el rango seleccionado
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Historial de Observaciones -->
        <div class="mt-8 bg-white dark:bg-gray-800 shadow rounded-xl p-6">
          <h3
            class="text-lg font-semibold mb-4 flex items-center gap-2 text-indigo-700 dark:text-indigo-300"
          >
            <DocumentTextIcon class="w-5 h-5" /> Historial de Observaciones
          </h3>
          <div class="flex flex-col sm:flex-row gap-2 mb-4 items-center">
            <label class="text-sm"
              >Desde:
              <input v-model="obsDateRange.start" type="date" class="input ml-2" />
            </label>
            <label class="text-sm"
              >Hasta:
              <input v-model="obsDateRange.end" type="date" class="input ml-2" />
            </label>
          </div>
          <div v-if="studentObservations.length > 0" class="space-y-4">
            <div
              v-for="obs in studentObservations"
              :key="obs.id"
              class="border-b border-gray-200 dark:border-gray-700 pb-4 last:border-b-0"
            >
              <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                <div class="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                  <span class="font-semibold text-indigo-600 dark:text-indigo-300">{{
                    obs.authorName || obs.author
                  }}</span>
                  <span>•</span>
                  <span>{{ obs.date }}</span>
                  <span
                    v-if="obs.type"
                    class="ml-2 px-2 py-0.5 rounded-full text-xs font-medium"
                    :class="{
                      'bg-blue-100 text-blue-700': obs.type === 'academico',
                      'bg-green-100 text-green-700': obs.type === 'comportamiento',
                      'bg-yellow-100 text-yellow-700': obs.type === 'asistencia',
                      'bg-purple-100 text-purple-700': obs.type === 'evaluacion',
                      'bg-gray-100 text-gray-700': obs.type === 'general',
                    }"
                  >
                    {{ obs.type }}
                  </span>
                </div>
                <div
                  v-if="obs.priority"
                  class="text-xs font-semibold uppercase tracking-wide"
                  :class="{
                    'text-red-600': obs.priority === 'critica',
                    'text-yellow-600': obs.priority === 'alta',
                    'text-blue-600': obs.priority === 'media',
                    'text-gray-500': obs.priority === 'baja',
                  }"
                >
                  {{ obs.priority }}
                </div>
              </div>
              <div class="mt-2 text-gray-800 dark:text-gray-100 whitespace-pre-line">
                {{ obs.content?.text || obs.text }}
              </div>
            </div>
          </div>
          <div v-else class="text-gray-500 italic">
            No hay observaciones donde el alumno haya sido etiquetado en este rango de fechas.
          </div>
        </div>

        <!-- Historial de Mensajes WhatsApp -->
        <div class="mt-8 bg-white dark:bg-gray-800 shadow rounded-xl p-6">
          <h3
            class="text-lg font-semibold mb-4 flex items-center gap-2 text-green-700 dark:text-green-300"
          >
            <PhoneIcon class="w-5 h-5" /> Historial de Mensajes WhatsApp
          </h3>
          <div class="flex flex-col sm:flex-row gap-2 mb-4 items-center">
            <label class="text-sm"
              >Desde:
              <input v-model="whatsappDateRange.start" type="date" class="input ml-2" />
            </label>
            <label class="text-sm"
              >Hasta:
              <input v-model="whatsappDateRange.end" type="date" class="input ml-2" />
            </label>
            <button class="btn btn-secondary ml-2" @click="loadWhatsAppLogs">Filtrar</button>
          </div>
          <div v-if="whatsappLogsStore.loading" class="text-center py-4 text-gray-500">
            Cargando historial...
          </div>
          <div v-else-if="whatsappLogsStore.error" class="text-center py-4 text-red-500">
            {{ whatsappLogsStore.error }}
          </div>
          <div v-else-if="whatsappLogsStore.logs.length > 0" class="space-y-4">
            <div
              v-for="log in whatsappLogsStore.logs"
              :key="log.id"
              class="border-b border-gray-200 dark:border-gray-700 pb-4 last:border-b-0"
            >
              <div class="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 mb-1">
                <span>{{
                  new Date(
                    log.sentAt?.seconds ? log.sentAt.seconds * 1000 : log.sentAt
                  ).toLocaleString("es-ES", {dateStyle: "medium", timeStyle: "short"})
                }}</span>
                <span
                  v-if="log.presetName"
                  class="ml-2 px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300"
                  >{{ log.presetName }}</span
                >
              </div>
              <div class="mt-1 text-gray-800 dark:text-gray-100 whitespace-pre-line">
                {{ log.message }}
              </div>
            </div>
          </div>
          <div v-else class="text-gray-500 italic">
            No hay mensajes enviados por WhatsApp al representante en el historial.
          </div>
        </div>
      </div>
    </div>
    <!-- Modal de confirmación de eliminación -->
    <div
      v-if="showDeleteConfirm"
      class="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40"
    >
      <div class="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 max-w-md w-full">
        <h2 class="text-xl font-bold mb-4 text-red-700">¿Eliminar alumno?</h2>
        <p class="mb-6">
          ¿Estás seguro que deseas eliminar este alumno? Esta acción no se puede deshacer.
        </p>
        <div class="flex justify-end gap-3">
          <button
            class="btn bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600"
            @click="showDeleteConfirm = false"
          >
            Cancelar
          </button>
          <button
            :disabled="isDeleting"
            class="btn bg-red-600 hover:bg-red-700 text-white font-bold px-4 py-2 rounded-lg shadow transition-all duration-200"
            @click="confirmDelete"
          >
            <span v-if="isDeleting" class="animate-spin mr-2">⏳</span>
            Eliminar
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue';
import { ref as vueRef } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { format, isValid } from 'date-fns';
import { es } from 'date-fns/locale';
import {
  UserIcon,
  AcademicCapIcon,
  CalendarIcon,
  PhoneIcon,
  EnvelopeIcon,
  BuildingLibraryIcon,
  ClockIcon,
  DocumentTextIcon,
  ChartBarIcon,
  CameraIcon,
  MusicalNoteIcon,
  UserGroupIcon,
  BookOpenIcon,
  CheckCircleIcon,
  XCircleIcon,
  ArrowPathIcon,
  PencilIcon,
  TrashIcon,
  CheckIcon,
  XMarkIcon,
  IdentificationIcon,
  BriefcaseIcon,
  MapPinIcon,
  ArchiveBoxIcon,
  DocumentArrowUpIcon,
  ArrowTopRightOnSquareIcon,
} from '@heroicons/vue/24/outline';
import { useStudentsStore } from '../store/students';
import { useClassesStore } from '../../Classes/store/classes';
import { useAttendanceStore } from '../../Attendance/store/attendance';
import { useAttendance } from '../../Attendance/composables/useAttendance';
import { useTeachersStore } from '../../Teachers/store/teachers';
import PerformanceWidget from '../../Performance/components/PerformanceWidget.vue';
import FileUpload from '../../../components/FileUpload.vue';
import StudentAvatar from '../components/StudentAvatar.vue';
import { useObservationsStore } from '@/stores/observations';
import type { ObservationData } from '@/stores/observations';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { db } from '../../../firebase/config';
import { useWhatsAppLogsStore } from '@/stores/whatsappLogs';
import { generarPdfDesdeHtml } from '@/utils/pdfService';
import { Line } from 'vue-chartjs';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

const route = useRoute();
const router = useRouter();
const studentsStore = useStudentsStore();
const classesStore = useClassesStore();
const attendanceStore = useAttendanceStore();
const teachersStore = useTeachersStore();
const observationsStore = useObservationsStore();
const whatsappLogsStore = useWhatsAppLogsStore();

// Composable optimizado para asistencias
const {
  loading: attendanceLoading,
  error: attendanceError,
  getStudentRecords,
  searchByDateRange,
} = useOptimizedAttendance();

const studentId = route.params.id as string;
const student = computed(() => studentsStore.students.find((s) => s.id.toString() === studentId));

// Función para calcular la edad basada en la fecha de nacimiento
const calculatedAge = computed(() => {
  try {
    if (!student.value?.nac) return '?';

    let birthDate;
    let dateStr: any = student.value.nac;

    // Si es un objeto Date, convertirlo a string ISO
    if (dateStr instanceof Date) {
      dateStr = dateStr.toISOString().split('T')[0];
    }

    // Asegurarnos de que es un string
    dateStr = String(dateStr);

    // Limpiar la fecha de caracteres extra
    dateStr = dateStr.trim().replace(/[^\d/-]/g, '');

    if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
      // Formato YYYY-MM-DD
      birthDate = new Date(dateStr);
    } else if (/^\d{2}\/\d{2}\/\d{4}$/.test(dateStr)) {
      // Formato DD/MM/YYYY
      const [day, month, year] = dateStr.split('/').map(Number);
      birthDate = new Date(year, month - 1, day);
    } else if (/^\d{2}-\d{2}-\d{4}$/.test(dateStr)) {
      // Formato DD-MM-YYYY
      const [day, month, year] = dateStr.split('-').map(Number);
      birthDate = new Date(year, month - 1, day);
    } else {
      // Último intento de parsear la fecha
      birthDate = new Date(dateStr);
    }

    // Validar que la fecha es válida y está en un rango razonable
    if (
      isNaN(birthDate.getTime()) ||
      birthDate.getFullYear() < 1900 ||
      birthDate.getFullYear() > new Date().getFullYear()
    ) {
      console.error('Fecha de nacimiento inválida o fuera de rango:', dateStr);
      return '?';
    }

    // Calcular edad
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();

    // Ajustar edad si aún no ha llegado el cumpleaños este año
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }

    return age;
  } catch (error) {
    console.error('Error al calcular la edad:', error);
    return '?';
  }
});

// Add the missing classes computed property
const classes = computed(() => {
  // If classesStore has classes array, use it to extract the names
  // Otherwise provide a default set of groups
  return classesStore.classes && classesStore.classes.length > 0
    ? Array.from(new Set(classesStore.classes.map((c) => c.name))).filter(
      (name) => name && typeof name === 'string',
    )
    : ['Teoría Musical', 'Coro', 'Orquesta'];
});

const attendanceData = computed(() => {
  // Si tenemos datos reales de asistencia, usarlos
  if (studentAttendance.value && studentAttendance.value.chartData) {
    const { labels, presentData, absentData, justifiedData, lateData, attendanceRateData } =
      studentAttendance.value.chartData;

    return {
      labels,
      datasets: [
        {
          label: '% Asistencia',
          data: attendanceRateData,
          borderColor: '#3b82f6',
          backgroundColor: 'rgba(59, 130, 246, 0.1)',
          borderWidth: 3,
          pointBackgroundColor: '#3b82f6',
          pointRadius: 5,
          pointHoverRadius: 7,
          fill: true,
          tension: 0.3,
          type: 'line',
          yAxisID: 'y1',
          order: 0,
        },
        {
          label: 'Asistencias',
          data: presentData,
          borderColor: '#22c55e',
          backgroundColor: 'rgba(34, 197, 94, 0.7)',
          borderWidth: 1,
          yAxisID: 'y',
          order: 1,
        },
        {
          label: 'Tardanzas',
          data: lateData,
          borderColor: '#f59e0b',
          backgroundColor: 'rgba(245, 158, 11, 0.7)',
          borderWidth: 1,
          yAxisID: 'y',
          order: 2,
        },
        {
          label: 'Ausencias',
          data: absentData,
          borderColor: '#ef4444',
          backgroundColor: 'rgba(239, 68, 68, 0.7)',
          borderWidth: 1,
          yAxisID: 'y',
          order: 3,
        },
        {
          label: 'Justificadas',
          data: justifiedData,
          borderColor: '#a855f7',
          backgroundColor: 'rgba(168, 85, 247, 0.7)',
          borderWidth: 1,
          yAxisID: 'y',
          order: 4,
        },
      ],
    };
  }

  // Si no hay datos reales, usar datos de ejemplo
  const labels = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun'];
  const present = [12, 10, 14, 8, 10, 11];
  const absent = [3, 4, 2, 3, 2, 4];
  const justified = [1, 2, 1, 1, 1, 2];
  const late = [2, 1, 2, 3, 2, 1];
  const rate = [80, 75, 85, 70, 80, 75];

  return {
    labels,
    datasets: [
      {
        label: '% Asistencia',
        data: rate,
        borderColor: '#3b82f6',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        borderWidth: 3,
        pointBackgroundColor: '#3b82f6',
        pointRadius: 5,
        pointHoverRadius: 7,
        fill: true,
        tension: 0.3,
        type: 'line',
        yAxisID: 'y1',
        order: 0,
      },
      {
        label: 'Asistencias',
        data: present,
        borderColor: '#22c55e',
        backgroundColor: 'rgba(34, 197, 94, 0.7)',
        borderWidth: 1,
        yAxisID: 'y',
        order: 1,
      },
      {
        label: 'Tardanzas',
        data: late,
        borderColor: '#f59e0b',
        backgroundColor: 'rgba(245, 158, 11, 0.7)',
        borderWidth: 1,
        yAxisID: 'y',
        order: 2,
      },
      {
        label: 'Ausencias',
        data: absent,
        borderColor: '#ef4444',
        backgroundColor: 'rgba(239, 68, 68, 0.7)',
        borderWidth: 1,
        yAxisID: 'y',
        order: 3,
      },
      {
        label: 'Justificadas',
        data: justified,
        borderColor: '#a855f7',
        backgroundColor: 'rgba(168, 85, 247, 0.7)',
        borderWidth: 1,
        yAxisID: 'y',
        order: 4,
      },
    ],
  };
});

// Obtener y procesar los datos de asistencia del estudiante
const studentAttendance = computed(() => {
  if (!student.value || !studentId)
    return {
      records: [],
      summary: {
        total: 0,
        present: 0,
        absent: 0,
        justified: 0,
        late: 0,
        attendanceRate: 0,
      },
      classification: 'Sin datos',
      monthlyData: {},
      recentRecords: [],
      classPerformance: [],
    };
  // Obtener los registros de asistencia del estudiante usando el composable optimizado
  const attendanceRecords = getStudentRecords.value(studentId);

  // Si no hay registros, devolvemos un objeto vacío
  if (!attendanceRecords || attendanceRecords.length === 0) {
    return {
      records: [],
      summary: {
        total: 0,
        present: 0,
        absent: 0,
        justified: 0,
        late: 0,
        attendanceRate: 0,
      },
      classification: 'Sin datos',
      monthlyData: {},
      recentRecords: [],
      classPerformance: [],
    };
  }

  // Resumen de asistencias (normalizar estados a minúsculas para consistencia)
  const present = attendanceRecords.filter(
    (record) =>
      record.status?.toLowerCase() === 'presente' || record.status?.toLowerCase() === 'present',
  ).length;

  const absent = attendanceRecords.filter(
    (record) =>
      record.status?.toLowerCase() === 'ausente' || record.status?.toLowerCase() === 'absent',
  ).length;

  const justified = attendanceRecords.filter(
    (record) =>
      (record.status?.toLowerCase() === 'ausente' || record.status?.toLowerCase() === 'absent') &&
      record.justification,
  ).length;

  const late = attendanceRecords.filter(
    (record) =>
      record.status?.toLowerCase() === 'tardanza' ||
      record.status?.toLowerCase() === 'tarde' ||
      record.status?.toLowerCase() === 'late',
  ).length;

  const total = attendanceRecords.length;

  // Para el cálculo de tasa de asistencia, consideramos presentes + justificados + tarde como "asistencias"
  const attendedClasses = present + late;
  const attendanceRate = total > 0 ? Math.round((attendedClasses / total) * 100) : 0;

  // Clasificación del estudiante según su tasa de asistencia
  let classification = 'Sin datos';
  if (total > 0) {
    if (attendanceRate >= 70) {
      classification = 'Responsable';
    } else if (attendanceRate >= 40) {
      classification = 'Irregular';
    } else {
      classification = 'Crítico';
    }
  }

  // Obtener rendimiento por clase
  const classPerformance = [];

  // Definir tipo para resumen de clases
  interface ClassSummary {
    classId: string
    className: string
    total: number
    present: number
    absent: number
    justified: number
    late: number
    rate: number
  }

  const classesSummary: Record<string, ClassSummary> = {};

  // Agrupar registros por clase
  attendanceRecords.forEach((record) => {
    if (!record.classId) return;

    if (!classesSummary[record.classId]) {
      classesSummary[record.classId] = {
        classId: record.classId,
        className: '',
        total: 0,
        present: 0,
        absent: 0,
        justified: 0,
        late: 0,
        rate: 0,
      };
    }

    // Obtener nombre de la clase
    if (!classesSummary[record.classId].className) {
      const classInfo = classesStore.getClassById
        ? classesStore.getClassById(record.classId)
        : classesStore.classes.find((c) => c.id === record.classId);

      if (classInfo) {
        classesSummary[record.classId].className = classInfo.name || 'Clase sin nombre';
      }
    }

    classesSummary[record.classId].total++;

    if (record.status?.toLowerCase() === 'presente' || record.status?.toLowerCase() === 'present') {
      classesSummary[record.classId].present++;
    } else if (
      record.status?.toLowerCase() === 'ausente' ||
      record.status?.toLowerCase() === 'absent'
    ) {
      classesSummary[record.classId].absent++;
      if (record.justification) {
        classesSummary[record.classId].justified++;
      }
    } else if (
      record.status?.toLowerCase() === 'tardanza' ||
      record.status?.toLowerCase() === 'tarde' ||
      record.status?.toLowerCase() === 'late'
    ) {
      classesSummary[record.classId].late++;
    }
  });

  // Calcular tasa de asistencia para cada clase
  Object.values(classesSummary).forEach((classData) => {
    const attended = classData.present + classData.late;
    classData.rate = classData.total > 0 ? Math.round((attended / classData.total) * 100) : 0;
    classPerformance.push(classData);
  });

  // Ordenar clases por tasa de asistencia (de menor a mayor para resaltar problemas)
  classPerformance.sort((a, b) => a.rate - b.rate);

  // Datos para la gráfica por mes
  const monthlyData = attendanceRecords.reduce((acc, record) => {
    if (!record.Fecha) return acc;

    try {
      // Extraer el mes de la fecha
      const date = new Date(record.Fecha);
      const monthYear = format(date, 'MMM yyyy', { locale: es });

      if (!acc[monthYear]) {
        acc[monthYear] = {
          present: 0,
          absent: 0,
          justified: 0,
          late: 0,
          total: 0,
        };
      }

      acc[monthYear].total++;

      if (
        record.status?.toLowerCase() === 'presente' ||
        record.status?.toLowerCase() === 'present'
      ) {
        acc[monthYear].present++;
      } else if (
        record.status?.toLowerCase() === 'ausente' ||
        record.status?.toLowerCase() === 'absent'
      ) {
        acc[monthYear].absent++;
        if (record.justification) {
          acc[monthYear].justified++;
        }
      } else if (
        record.status?.toLowerCase() === 'tardanza' ||
        record.status?.toLowerCase() === 'tarde' ||
        record.status?.toLowerCase() === 'late'
      ) {
        acc[monthYear].late++;
      }
    } catch (error) {
      console.error('Error al procesar fecha:', record.Fecha, error);
    }

    return acc;
  }, {});

  // Convertir los datos mensuales para la gráfica
  const months = Object.keys(monthlyData).slice(-6); // Últimos 6 meses
  const presentData = months.map((m) => monthlyData[m].present);
  const absentData = months.map((m) => monthlyData[m].absent);
  const justifiedData = months.map((m) => monthlyData[m].justified);
  const lateData = months.map((m) => monthlyData[m].late);
  const attendanceRateData = months.map((m) => {
    const attended = monthlyData[m].present + monthlyData[m].late;
    return monthlyData[m].total > 0 ? Math.round((attended / monthlyData[m].total) * 100) : 0;
  });

  // Obtener los últimos 10 registros ordenados por fecha
  const recentRecords = [...attendanceRecords]
    .sort((a, b) => {
      if (!a.Fecha || !b.Fecha) return 0;
      return new Date(b.Fecha).getTime() - new Date(a.Fecha).getTime();
    })
    .slice(0, 10)
    .map((record) => {
      // Enriquecer los datos con información adicional
      const classInfo = classesStore.getClassById
        ? classesStore.getClassById(record.classId)
        : classesStore.classes.find((c) => c.id === record.classId);

      const teacherInfo =
        classInfo?.teacherId && teachersStore.getTeacherById
          ? teachersStore.getTeacherById(classInfo.teacherId)
          : teachersStore.teachers?.find((t) => t.id === classInfo?.teacherId);

      const recordDate = new Date(record.Fecha);
      return {
        ...record,
        className: classInfo?.name || 'Clase desconocida',
        teacherName: teacherInfo?.name || 'Profesor desconocido',
        formattedDate: recordDate
          ? format(recordDate, 'EEEE d \'de\' MMMM yyyy', { locale: es })
          : 'Fecha desconocida',
        // Format the date day with capitalization for better readability
        formattedDateCapitalized: recordDate
          ? format(recordDate, 'EEEE d \'de\' MMMM yyyy', { locale: es }).replace(/^\w/, (c) =>
            c.toUpperCase(),
          )
          : 'Fecha desconocida',
      };
    });

  return {
    records: attendanceRecords,
    summary: {
      total,
      present,
      absent,
      justified,
      late,
      attendanceRate,
    },
    classification,
    chartData: {
      labels: months,
      presentData,
      absentData,
      justifiedData,
      lateData,
      attendanceRateData,
    },
    monthlyData,
    recentRecords,
    classPerformance,
  };
});

// Variables para actualización de datos
const isRefreshing = ref(false);

// Función para actualizar los datos de asistencia del estudiante desde Firestore
const refreshAttendanceData = async () => {
  if (!studentId) return;

  try {
    isRefreshing.value = true;

    // Obtener fechas para el rango (últimos 3 meses)
    const today = new Date();
    const threeMonthsAgo = new Date(today);
    threeMonthsAgo.setMonth(today.getMonth() - 3);
    const startDate = format(threeMonthsAgo, 'yyyy-MM-dd');
    const endDate = format(today, 'yyyy-MM-dd');

    // Los datos se cargarán automáticamente en el mounted del componente
    console.log(`📊 Preparando datos de asistencia para el rango ${startDate} al ${endDate}`);

    // Si hay clases específicas del estudiante, cargar sus documentos de asistencia
    const studentClassIds = classesStore.classes
      .filter((c) => c.studentIds?.includes(studentId))
      .map((c) => c.id);

    if (studentClassIds.length > 0) {
      // Para cada clase, actualizar también los documentos de asistencia
      for (const classId of studentClassIds) {
        await attendanceStore.fetchAttendanceDocument(format(today, 'yyyy-MM-dd'), classId);
      }
    }

    console.log('✅ Datos de asistencia actualizados desde Firestore');
  } catch (error) {
    console.error('Error al actualizar los datos de asistencia:', error);
  } finally {
    isRefreshing.value = false;
  }
};

// Lista reactiva de clases para el estudiante actual
const studentClasses = computed(() => {
  if (!student.value || !studentId) {
    console.log('No hay estudiante seleccionado o ID de estudiante');
    return [];
  }
  // Normalizar el ID para asegurar que las comparaciones funcionen
  const normalizedStudentId = String(studentId);

  // Filtrar clases directamente usando las propiedades disponibles en classesStore.classes
  // Esto evita conflictos con getters/métodos
  const classesForStudent = classesStore.classes.filter(
    (classItem) =>
      classItem.studentIds &&
      Array.isArray(classItem.studentIds) &&
      classItem.studentIds.includes(normalizedStudentId),
  );

  // Devolver información relevante de las clases
  return classesForStudent.map((classItem) => {
    const teacherInfo = classItem.teacherId
      ? teachersStore.getTeacherById(classItem.teacherId)
      : null;
    const teacherName = teacherInfo ? teacherInfo.name : null;

    return {
      id: classItem.id,
      name: classItem.name || 'Clase sin nombre',
      teacher:
        teacherName ||
        (classItem.teacherId ? `Profesor (ID: ${classItem.teacherId})` : 'Sin profesor asignado'),
      level: classItem.level || 'Nivel no especificado',
      schedule:
        classItem.schedule && classItem.schedule.slots
          ? classItem.schedule.slots
            .map((slot) => `${slot.day} ${slot.startTime}-${slot.endTime}`)
            .join(', ')
          : 'Horario no definido',
    };
  });
});

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      position: 'top' as const,
      labels: {
        usePointStyle: true,
        padding: 15,
      },
    },
    tooltip: {
      mode: 'index',
      intersect: false,
      callbacks: {
        label(context) {
          let label = context.dataset.label || '';
          if (label) {
            label += ': ';
          }
          if (context.parsed.y !== null) {
            if (context.dataset.yAxisID === 'y1') {
              label += context.parsed.y + '%';
            } else {
              label += context.parsed.y;
            }
          }
          return label;
        },
      },
    },
  },
  scales: {
    y: {
      beginAtZero: true,
      title: {
        display: true,
        text: 'Cantidad de asistencias',
        color: '#6b7280',
      },
      grid: {
        color: 'rgba(160, 174, 192, 0.1)',
      },
      ticks: {
        color: '#6b7280',
      },
    },
    y1: {
      beginAtZero: true,
      position: 'right',
      max: 100,
      title: {
        display: true,
        text: 'Porcentaje (%)',
        color: '#3b82f6',
      },
      grid: {
        drawOnChartArea: false,
      },
      ticks: {
        color: '#3b82f6',
        callback(value) {
          return value + '%';
        },
      },
    },
    x: {
      grid: {
        color: 'rgba(160, 174, 192, 0.1)',
      },
      ticks: {
        color: '#6b7280',
      },
    },
  },
  interaction: {
    mode: 'index',
    intersect: false,
  },
};

const isUploading = ref(false);
const showDeleteConfirm = ref(false);
const isDeleting = ref(false);

// Función para manejar errores de carga de imágenes
const handleImageError = (event: Event) => {
  const imgElement = event.target as HTMLImageElement;
  const fallbackUrl = `https://api.dicebear.com/7.x/avataaars/svg?seed=${student.value?.nombre || 'default'}`;
  console.log(
    '[StudentProfileView] Error al cargar imagen de avatar, usando fallback:',
    fallbackUrl,
  );
  imgElement.src = fallbackUrl;
};

// Reemplazar la función actual por esta
const handleProfilePhotoUpload = async (url) => {
  if (!student.value) return;

  isUploading.value = true;
  try {
    console.log('[StudentProfileView] URL de foto recibida:', url);

    // Verificar que sea una URL válida de Firebase Storage
    if (!url || !url.includes('firebasestorage.googleapis.com')) {
      console.error('[StudentProfileView] URL inválida:', url);
      throw new Error('La URL de la imagen no es válida');
    }

    await studentsStore.updateStudent(studentId, { photoURL: url });
    console.log('[StudentProfileView] Avatar actualizado correctamente');
  } catch (error) {
    console.error('Error actualizando foto de perfil:', error);
  } finally {
    isUploading.value = false;
  }
};

const handleDocumentUpload = async (files: FileList, documentType: string) => {
  if (!student.value || !files.length) return;

  isUploading.value = true;
  try {
    const file = files[0];
    const path = `documents/${student.value.id}/${documentType}/${file.name}`;
    const url = await uploadFile(file, path);

    const documentos = {
      ...(student.value.documentos || {}),
      [documentType]: {
        url,
        fecha: new Date().toISOString(),
      },
    };

    await studentsStore.updateStudent(studentId, {
      ...student.value,
      documentos,
    });
  } catch (error) {
    console.error('Error uploading document:', error);
    // Add error handling/notification here
  } finally {
    isUploading.value = false;
  }
};

const isEditing = ref(false);
// Define a type for localStudent that matches the student structure
type StudentType = typeof student.value
const localStudent = ref({} as StudentType);

// Extract unique instruments from all students
const uniqueInstruments = computed(() => {
  // Create a Set to automatically handle uniqueness
  const instrumentSet = new Set();

  // Extract instruments from all students
  studentsStore.students.forEach((student) => {
    if (student.instrumento && student.instrumento.trim() !== '') {
      instrumentSet.add(student.instrumento);
    }
  });

  // Convert Set to Array and sort alphabetically
  return Array.from(instrumentSet).sort();
});

// Extract unique groups from all students
const uniqueGroups = computed(() => {
  // Create a Set to automatically handle uniqueness
  const groupSet = new Set();

  // Extract groups from all students
  studentsStore.students.forEach((student) => {
    // Check if grupo property exists and is an array
    if (student.grupo && Array.isArray(student.grupo)) {
      // Add each group to the set
      student.grupo.forEach((group) => {
        if (group && typeof group === 'string' && group.trim() !== '') {
          groupSet.add(group.trim());
        }
      });
    }
    // Handle case where grupo might be a string
    else if (student.grupo && typeof student.grupo === 'string' && student.grupo.trim() !== '') {
      groupSet.add(student.grupo.trim());
    }
  });

  // Convert Set to Array and sort alphabetically
  return Array.from(groupSet).sort();
});

// Extract unique classes from all students (using grupos values as classes)
const availableClasses = computed(() => {
  // Create a Set to automatically handle uniqueness
  const classSet = new Set();

  // Extract classes from students' grupo property
  studentsStore.students.forEach((student) => {
    // Add regular clase values
    if (student.clase && typeof student.clase === 'string' && student.clase.trim() !== '') {
      classSet.add(student.clase.trim());
    }
    // Add values from grupo arrays as potential classes
    if (student.grupo) {
      // Handle grupo as array
      if (Array.isArray(student.grupo)) {
        student.grupo.forEach((group) => {
          if (group && typeof group === 'string' && group.trim() !== '') {
            classSet.add(group.trim());
          }
        });
      }
      // Handle grupo as string that looks like an array "[item1,item2]"
      else if (
        typeof student.grupo === 'string' &&
        student.grupo.startsWith('[') &&
        student.grupo.endsWith(']')
      ) {
        try {
          const parsed = JSON.parse(student.grupo);
          if (Array.isArray(parsed)) {
            parsed.forEach((item) => {
              if (item && typeof item === 'string' && item.trim() !== '') {
                classSet.add(item.trim());
              }
            });
          } else {
            // If parsing doesn't result in array, use as string
            classSet.add(student.grupo.trim());
          }
        } catch (e) {
          // If parsing fails, use as string
          if (student.grupo.trim() !== '') {
            classSet.add(student.grupo.trim());
          }
        }
      }
      // Handle grupo as simple string (fallback)
      else if (typeof student.grupo === 'string' && student.grupo?.trim() !== '') {
        classSet.add(student.grupo.trim());
      }
    }
  });

  // Convert Set to Array and sort alphabetically
  return Array.from(classSet).sort();
});

watch(
  student,
  (newStudent) => {
    if (newStudent) {
      localStudent.value = { ...newStudent };
    }
  },
  { immediate: true },
);

const handleEdit = () => {
  if (student.value?.id) {
    router.push(`/students/edit/${student.value.id}`);
  } else {
    console.error('No se pudo obtener el ID del estudiante');
  }
};

const handleSave = async () => {
  if (isSaving.value) return;

  isSaving.value = true;

  try {
    // Crear un objeto solo con los campos que queremos actualizar
    const updates: any = {
      ...localStudent.value,
      updatedAt: new Date(),
    };

    // Actualizar la edad con el valor calculado antes de guardar
    if (localStudent.value.nac) {
      const calculatedAgeValue = calculatedAge.value;
      if (typeof calculatedAgeValue === 'number') {
        updates.edad = calculatedAgeValue;
      }
    }

    // Eliminar campos que no deberían actualizarse
    delete updates.id;
    delete updates.createdAt;

    console.log('Actualizando estudiante con datos:', updates);

    await studentsStore.updateStudent(studentId, updates);

    // Actualizar los datos locales con los datos actualizados del store
    const updatedStudent = studentsStore.getStudentById(studentId);
    if (updatedStudent) {
      localStudent.value = { ...updatedStudent };
    }

    isEditing.value = false;
    showNotification('Cambios guardados correctamente', 'success');
  } catch (error) {
    console.error('Error al guardar cambios:', error);
    showNotification('Error al guardar los cambios. Por favor, inténtalo de nuevo.', 'error');
  } finally {
    isSaving.value = false;
  }
};

const handleDelete = () => {
  showDeleteConfirm.value = true;
};

const confirmDelete = async () => {
  if (!student.value?.id) return;
  isDeleting.value = true;
  try {
    await studentsStore.deleteStudent(student.value.id);
    showDeleteConfirm.value = false;
    isDeleting.value = false;
    // Redirigir a la lista de alumnos tras eliminar
    router.push('/students');
  } catch (error) {
    isDeleting.value = false;
    showDeleteConfirm.value = false;
    console.error('Error al eliminar alumno:', error);
    // Aquí podrías mostrar un toast o alerta
  }
};

// onMounted para cargar los datos necesarios del estudiante
onMounted(async () => {
  // Cargar el id de estudiante desde la ruta
  const studentId = route.params.id as string;

  // Verificar si tenemos un ID de estudiante válido
  if (studentId) {
    try {
      isRefreshing.value = true;
      console.log('🔄 Cargando datos del estudiante:', studentId);

      // Asegurar que los estudiantes estén cargados
      if (studentsStore.students.length === 0) {
        await studentsStore.fetchStudents();
      }

      // Asegurar que tenemos el estudiante actual
      if (!student.value) {
        await studentsStore.fetchStudentById(studentId);
      }

      // Cargar las clases específicas para este estudiante desde Firestore
      await classesStore.fetchClassesByStudentId(studentId);

      // Si tenemos IDs de profesores, cargarlos también
      if (classesStore.classes.length > 0) {
        const teacherIds = new Set<string>();

        // Recopilar todos los IDs de profesores de las clases del estudiante
        classesStore.classes
          .filter((c) => c.studentIds?.includes(studentId))
          .forEach((c) => {
            if (c.teacherId) teacherIds.add(c.teacherId);
          });

        // Cargar información de los profesores si no la tenemos ya
        if (teacherIds.size > 0 && teachersStore.teachers.length === 0) {
          await teachersStore.fetchTeachers();
        }

        // Obtener todas las clases del estudiante
        const studentClassIds = classesStore.classes
          .filter((c) => c.studentIds?.includes(studentId))
          .map((c) => c.id);
        // Cargar las asistencias para cada clase
        try {
          // Obtener fechas para el rango (últimos 3 meses)
          const today = new Date();
          const threeMonthsAgo = new Date(today);
          threeMonthsAgo.setMonth(today.getMonth() - 3);

          const startDate = format(threeMonthsAgo, 'yyyy-MM-dd');
          const endDate = format(today, 'yyyy-MM-dd');

          // Cargar registros de asistencia usando el composable optimizado
          console.log(`🔄 Cargando asistencias del ${startDate} al ${endDate}`);
          await searchByDateRange(startDate, endDate);

          console.log('✅ Registros de asistencia cargados correctamente');
        } catch (error) {
          console.error('❌ Error al cargar registros de asistencia:', error);
        }
      }

      console.log('✅ Datos del estudiante cargados correctamente');
    } catch (error) {
      console.error('❌ Error al cargar datos del estudiante:', error);
    } finally {
      isRefreshing.value = false;
    }
  } else {
    console.error('❌ ID de estudiante no válido:', studentId);
  }
});

// Función para determinar la información de contacto
const contactInfo = computed(() => {
  if (!student.value) return null;

  const contacts = [];

  // Agregar teléfono del estudiante si existe y es válido
  if (student.value.tlf && student.value.tlf !== 'Vacio' && student.value.tlf.trim()) {
    contacts.push({ number: student.value.tlf.trim(), type: 'Personal' });
  }

  // Agregar teléfono de la madre si existe y es válido
  if (
    student.value.tlf_madre &&
    student.value.tlf_madre !== 'Vacio' &&
    student.value.tlf_madre.trim()
  ) {
    contacts.push({ number: student.value.tlf_madre.trim(), type: 'Madre' });
  }

  // Agregar teléfono del padre si existe y es válido
  if (
    student.value.tlf_padre &&
    student.value.tlf_padre !== 'Vacio' &&
    student.value.tlf_padre.trim()
  ) {
    contacts.push({ number: student.value.tlf_padre.trim(), type: 'Padre' });
  }

  return contacts;
});

// Función para calcular la fecha de inscripción
const inscriptionDate = computed(() => {
  if (!student.value) return null;

  let date = null;

  // Primero intentar usar la fecha de inscripción explícita si existe
  if (student.value.fecInscripcion) {
    const parsedDate = new Date(student.value.fecInscripcion);
    if (!isNaN(parsedDate.getTime())) {
      date = parsedDate;
    }
  }

  // Si no hay fecha de inscripción explícita, intentar con createdAt
  if (!date && student.value.createdAt) {
    if (typeof student.value.createdAt === 'number') {
      date = new Date(student.value.createdAt);
    } else if (typeof student.value.createdAt === 'string') {
      date = new Date(student.value.createdAt);
    } else if (student.value.createdAt?.toDate) {
      date = student.value.createdAt.toDate();
    }
  }

  // Si aún no tenemos fecha, intentar con el ID numérico como último recurso
  if (!date && /^\d+$/.test(student.value.id)) {
    const timestamp = parseInt(student.value.id);
    // Verificar que el timestamp parece válido (después de 2000 y antes de ahora)
    if (timestamp > 946684800000 && timestamp < Date.now()) {
      date = new Date(timestamp);
    }
  }

  return date;
});

// Función para formatear fechas de manera consistente
const formatDate = (date) => {
  if (!date || !isValid(new Date(date))) return 'Fecha no disponible';
  return format(new Date(date), 'dd/MM/yyyy', { locale: es });
};

const handleDocumentDelete = async (documentType) => {
  try {
    const documentos = { ...student.value.documentos };
    delete documentos[documentType];
    await studentsStore.updateStudent(studentId, {
      ...student.value,
      documentos,
    });
  } catch (error) {
    console.error('Error deleting document:', error);
  }
};

const isDocumentPDF = (documentType) => {
  return student.value?.documentos?.[documentType]?.url?.toLowerCase().endsWith('.pdf');
};

const isDocumentImage = (documentType) => {
  const url = student.value?.documentos?.[documentType]?.url?.toLowerCase();
  return url?.endsWith('.jpg') || url?.endsWith('.jpeg') || url?.endsWith('.png');
};

// Date range for attendance records - default to last month
const dateRange = ref({
  start: format(new Date(new Date().setMonth(new Date().getMonth() - 1)), 'yyyy-MM-dd'),
  end: format(new Date(), 'yyyy-MM-dd'),
});

// Reset date range to initial state (last month to current date)
const resetDateRange = () => {
  dateRange.value = {
    start: format(new Date(new Date().setMonth(new Date().getMonth() - 1)), 'yyyy-MM-dd'),
    end: format(new Date(), 'yyyy-MM-dd'),
  };
};

// Filtered attendance records based on date range
const filteredAttendanceRecords = computed(() => {
  if (!studentAttendance.value.records) return [];

  // Use recentRecords for formatting but filter by the date range
  const filtered = studentAttendance.value.recentRecords.filter((record) => {
    if (!record.Fecha) return false;

    try {
      const recordDate = new Date(record.Fecha);
      const startDate = new Date(dateRange.value.start);
      const endDate = new Date(dateRange.value.end);

      // Validate dates
      if (isNaN(recordDate.getTime())) return false;

      // Filter by date range
      if (isValid(startDate) && recordDate < startDate) return false;
      if (isValid(endDate) && recordDate > endDate) return false;

      return true;
    } catch (error) {
      console.error('Error filtering date:', error);
      return false;
    }
  });

  // Sort by date (most recent first)
  return [...filtered].sort((a, b) => {
    if (!a.Fecha || !b.Fecha) return 0;
    return new Date(b.Fecha).getTime() - new Date(a.Fecha).getTime();
  });
});

// Métodos para el widget de rendimiento
const handleViewPerformanceDetails = () => {
  // Navegar a una vista detallada de rendimiento
  router.push(`/students/${studentId}/performance`);
};

const handleViewRecommendations = () => {
  // Navegar a las recomendaciones específicas del estudiante
  router.push(`/students/${studentId}/recommendations`);
};

const handleExpandPerformance = () => {
  // Expandir el widget de rendimiento en una vista modal o pantalla completa
  // Por ahora simplemente navegamos a los detalles
  handleViewPerformanceDetails();
};

// Rango de fechas para filtrar observaciones (por defecto últimos 6 meses)
const today = new Date();
const sixMonthsAgo = new Date();
sixMonthsAgo.setMonth(today.getMonth() - 6);
const obsDateRange = ref({
  start: sixMonthsAgo.toISOString().split('T')[0],
  end: today.toISOString().split('T')[0],
});

const studentObservations = computed<ObservationData[]>(() => {
  if (!student.value || !student.value.id) return [];
  return observationsStore.getObservationsByStudentIdAndDateRange(
    student.value.id,
    obsDateRange.value.start,
    obsDateRange.value.end,
  );
});

// Historial de mensajes WhatsApp usando el store
const whatsappDateRange = ref({
  start: sixMonthsAgo.toISOString().split('T')[0],
  end: today.toISOString().split('T')[0],
});

const loadWhatsAppLogs = async () => {
  if (!student.value || !student.value.id) return;
  await whatsappLogsStore.fetchLogsByStudentIdAndDateRange(
    student.value.id,
    whatsappDateRange.value.start,
    whatsappDateRange.value.end,
  );
};

watch([() => student.value?.id, whatsappDateRange], loadWhatsAppLogs, { immediate: true });

onMounted(async () => {
  if (student.value && student.value.id) {
    await observationsStore.fetchObservations({ studentId: student.value.id });
  }
});

const exportProfileToPDF = async () => {
  const nombre = student.value ? `${student.value.nombre}_${student.value.apellido}` : 'Alumno';
  await generarPdfDesdeHtml({
    elementId: 'student-profile-pdf',
    filename: `Perfil_${nombre}.pdf`,
    logoUrl: new URL('@/assets/ElSistemaPCLogo.jpeg', import.meta.url).href,
    institutionName: 'El Sistema Punta Cana',
    footerText: 'Documento generado automáticamente por El Sistema PC',
    margin: 10,
  });
};
</script>

<style scoped>
/* Animaciones y transiciones */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.5s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.slide-up-enter-active,
.slide-up-leave-active {
  transition: all 0.3s ease-out;
}
.slide-up-enter-from {
  opacity: 0;
  transform: translateY(30px);
}
.slide-up-leave-to {
  opacity: 0;
  transform: translateY(-30px);
}

.bounce-enter-active {
  animation: bounce-in 0.5s;
}
.bounce-leave-active {
  animation: bounce-in 0.5s reverse;
}
@keyframes bounce-in {
  0% {
    transform: scale(0);
  }
  50% {
    transform: scale(1.05);
  }
  100% {
    transform: scale(1);
  }
}

.animate-fade-in {
  animation: fadeIn 0.5s ease-in;
}

@keyframes fadeIn {
  0% {
    opacity: 0;
  }
  100% {
    opacity: 1;
  }
}

.animate-slide-up {
  animation: slideUp 0.5s ease-out forwards;
}

@keyframes slideUp {
  0% {
    opacity: 0;
    transform: translateY(20px);
  }
  100% {
    opacity: 1;
    transform: translateY(0);
  }
}

.card {
  background-color: white;
  border-radius: 0.5rem;
  box-shadow:
    0 4px 6px -1px rgba(0, 0, 0, 0.1),
    0 2px 4px -1px rgba(0, 0, 0, 0.06);
  padding: 1.5rem;
  transition: all 0.3s ease;
}

.dark .card {
  background-color: #1f2937;
}

.card:hover {
  transform: translateY(-4px);
  box-shadow:
    0 10px 15px -3px rgba(0, 0, 0, 0.1),
    0 4px 6px -2px rgba(0, 0, 0, 0.05);
}

.info-tag {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.25rem 0.75rem;
  border-radius: 9999px;
  font-size: 0.875rem;
  font-weight: 500;
}

.info-tag-primary {
  background-color: #dbeafe;
  color: #1e40af;
}

.dark .info-tag-primary {
  background-color: rgba(30, 58, 138, 0.3);
  color: #93c5fd;
}

.info-tag-success {
  background-color: #dcfce7;
  color: #166534;
}

.dark .info-tag-success {
  background-color: rgba(22, 101, 52, 0.3);
  color: #86efac;
}

.info-tag-warning {
  background-color: #fef3c7;
  color: #92400e;
}

.dark .info-tag-warning {
  background-color: rgba(146, 64, 14, 0.3);
  color: #fcd34d;
}

.info-tag-danger {
  background-color: #fee2e2;
  color: #b91c1c;
}

.dark .info-tag-danger {
  background-color: rgba(185, 28, 28, 0.3);
  color: #fca5a5;
}

.profile-section-title {
  font-size: 1.125rem;
  font-weight: 600;
  margin-bottom: 1rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  position: relative;
  padding-bottom: 0.5rem;
}

.profile-section-title::after {
  content: "";
  position: absolute;
  bottom: 0;
  left: 0;
  width: 2rem;
  height: 2px;
  background: linear-gradient(90deg, #3b82f6 0%, #8b5cf6 100%);
  transition: width 0.3s ease;
}

.profile-section-title:hover::after {
  width: 100%;
}

.profile-avatar {
  border-radius: 9999px;
  object-fit: cover;
  border: 2px solid #3b82f6;
  box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.3);
  transition: all 0.3s ease;
}

.profile-avatar:hover {
  transform: scale(1.05);
  border-color: #8b5cf6;
}

.data-label {
  font-size: 0.875rem;
  color: #6b7280;
}

.dark .data-label {
  color: #9ca3af;
}

.data-value {
  font-weight: 500;
}

/* Estilos para la tarjeta de clase */
.class-card {
  padding: 0.75rem;
  border-radius: 0.5rem;
  border: 1px solid #f3f4f6;
  background: linear-gradient(145deg, #f3f4f6 0%, #eff6ff 100%);
  transition: all 0.3s ease;
  margin-bottom: 0.5rem;
}

.dark .class-card {
  border-color: #374151;
  background: linear-gradient(145deg, #1e293b 0%, #1e3a8a 100%);
}

.class-card:hover {
  transform: translateY(-3px) scale(1.02);
  box-shadow: 0 8px 15px -3px rgba(0, 0, 0, 0.1);
}

/* Animación para mostrar datos cargando */
@keyframes pulse {
  0%,
  100% {
    opacity: 0.5;
  }
  50% {
    opacity: 0.8;
  }
}

.loading-pulse {
  animation: pulse 1.5s ease-in-out infinite;
  background-color: #e5e7eb;
  border-radius: 0.375rem;
}

.dark .loading-pulse {
  background-color: #374151;
}

.btn-primary {
  background-color: #3b82f6;
  color: white;
  transition: all 0.3s ease;
}

.btn-primary:hover {
  background-color: #2563eb;
  transform: translateY(-2px);
}

.btn-success {
  background-color: #10b981;
  color: white;
  transition: all 0.3s ease;
}

.btn-success:hover {
  background-color: #059669;
  transform: translateY(-2px);
}

.btn-danger {
  background-color: #ef4444;
  color: white;
  transition: all 0.3s ease;
}

.btn-danger:hover {
  background-color: #dc2626;
  transform: translateY(-2px);
}

.icon-spin {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}
</style>
