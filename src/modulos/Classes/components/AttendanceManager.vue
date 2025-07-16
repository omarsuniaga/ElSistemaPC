<template>
  <div class="attendance-manager bg-white shadow-lg rounded-lg p-6 dark:bg-gray-800">
    <div class="flex justify-between items-center mb-6">
      <h3 class="text-xl font-semibold text-gray-800 dark:text-gray-200">Control de Asistencia</h3>

      <div class="flex items-center space-x-2">
        <span class="text-sm text-gray-600 dark:text-gray-400">{{ formattedDate }}</span>
        <button
          class="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          @click="showDatePicker = !showDatePicker"
        >
          <CalendarIcon class="h-5 w-5" />
        </button>
        <!-- Simple date picker -->
        <div
          v-if="showDatePicker"
          class="absolute mt-2 bg-white dark:bg-gray-800 shadow-lg rounded-lg p-4 z-10"
        >
          <input
            v-model="selectedDate"
            type="date"
            class="block w-full text-sm border-gray-300 rounded-md"
          />
        </div>
      </div>
    </div>

    <div v-if="students.length > 0">
      <!-- Attendance form -->
      <div class="mb-4 overflow-x-auto">
        <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead class="bg-gray-50 dark:bg-gray-700">
            <tr>
              <th
                scope="col"
                class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
              >
                Estudiante
              </th>
              <th
                scope="col"
                class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
              >
                Asistencia
              </th>
              <th
                scope="col"
                class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
              >
                Observaciones
              </th>
            </tr>
          </thead>
          <tbody class="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
            <tr v-for="(student, idx) in attendanceRecords" :key="student.id">
              <td class="px-6 py-4 whitespace-nowrap">
                <div class="text-sm font-medium text-gray-900 dark:text-gray-100">
                  {{ student.name }}
                </div>
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <div class="flex items-center space-x-4">
                  <button
                    :class="[
                      'px-3 py-1 rounded-full text-xs font-medium',
                      student.present
                        ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                        : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300',
                    ]"
                    @click="setAttendance(idx, true)"
                  >
                    Presente
                  </button>
                  <button
                    :class="[
                      'px-3 py-1 rounded-full text-xs font-medium',
                      student.present === false
                        ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                        : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300',
                    ]"
                    @click="setAttendance(idx, false)"
                  >
                    Ausente
                  </button>
                </div>
              </td>
              <td class="px-6 py-4">
                <input
                  v-model="student.notes"
                  type="text"
                  placeholder="Añadir nota..."
                  class="block w-full text-sm border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-300 rounded-md"
                />
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Action buttons -->
      <div class="flex flex-col sm:flex-row gap-3 mt-6">
        <button
          class="flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          @click="saveAttendance"
        >
          <SaveIcon class="h-4 w-4 mr-1.5" />
          Guardar Asistencia
        </button>
        <button
          class="flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
          :disabled="!hasAttendanceRecords"
          @click="downloadAttendanceReport"
        >
          <DocumentArrowDownIcon class="h-4 w-4 mr-1.5" />
          Reporte de Asistencia
        </button>
        <button
          class="flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
          @click="downloadMonthlyReport"
        >
          <ChartBarIcon class="h-4 w-4 mr-1.5" />
          Reporte Mensual
        </button>
      </div>
    </div>
    <div v-else class="text-center py-8">
      <UserGroupIcon class="mx-auto h-12 w-12 text-gray-400" />
      <p class="mt-2 text-gray-600 dark:text-gray-400">
        No hay estudiantes para registrar asistencia
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import {
  CalendarIcon,
  DocumentArrowDownIcon,
  ChartBarIcon,
  SaveIcon,
  UserGroupIcon,
} from '@heroicons/vue/24/outline';
import { generateAttendancePDF } from '@/utils/pdf/pdf-export';

interface Student {
  id: string
  name: string
  age?: number
  instrument?: string
}

interface AttendanceRecord {
  id: string
  name: string
  present: boolean | null
  notes: string
}

const props = defineProps<{
  students: Student[]
  classId: string
  className: string
  teacherName: string
  savedAttendance?: Array<{
    studentId: string
    date: string
    present: boolean
    notes?: string
  }>
}>();

const emit = defineEmits(['save-attendance']);

// Date management
const currentDate = ref(new Date());
const showDatePicker = ref(false);
const selectedDate = ref(currentDate.value.toISOString().split('T')[0]);

// Watch for date changes
watch(selectedDate, (newDate) => {
  currentDate.value = new Date(newDate);
  showDatePicker.value = false;
  loadSavedAttendance();
});

const formattedDate = computed(() => {
  return currentDate.value.toLocaleDateString('es-ES', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
});

// Initialize attendance records with students data
const attendanceRecords = ref<AttendanceRecord[]>([]);

// Watch for students changes
watch(
  () => props.students,
  (newStudents) => {
    initializeAttendanceRecords();
    loadSavedAttendance();
  },
  { immediate: true },
);

// Initialize attendance records
const initializeAttendanceRecords = () => {
  attendanceRecords.value = props.students.map((student) => ({
    id: student.id,
    name: student.name,
    present: null,
    notes: '',
  }));
};

// Load saved attendance if available
const loadSavedAttendance = () => {
  if (!props.savedAttendance) return;

  const dateStr = currentDate.value.toISOString().split('T')[0];
  const savedForDate = props.savedAttendance.filter((a) => a.date === dateStr);

  if (savedForDate.length > 0) {
    attendanceRecords.value = attendanceRecords.value.map((record) => {
      const saved = savedForDate.find((s) => s.studentId === record.id);
      if (saved) {
        return {
          ...record,
          present: saved.present,
          notes: saved.notes || '',
        };
      }
      return record;
    });
  } else {
    // Reset if no saved attendance for this date
    initializeAttendanceRecords();
  }
};

// Check if we have any attendance records
const hasAttendanceRecords = computed(() => {
  return attendanceRecords.value.some((record) => record.present !== null);
});

// Set attendance status for a student
const setAttendance = (index: number, present: boolean) => {
  attendanceRecords.value[index].present = present;
};

// Save attendance data
const saveAttendance = () => {
  // Format the attendance data
  const attendanceData = attendanceRecords.value.map((record) => ({
    studentId: record.id,
    date: currentDate.value.toISOString().split('T')[0],
    present: record.present === true,
    notes: record.notes,
  }));

  // Emit the data to parent component to save
  emit('save-attendance', {
    classId: props.classId,
    date: currentDate.value,
    records: attendanceData,
  });
};

// Download attendance report
const downloadAttendanceReport = async () => {
  try {
    // Create attendance data in the format expected by the PDF generator
    const studentsWithAttendance = props.students.map((student) => {
      const record = attendanceRecords.value.find((r) => r.id === student.id);

      return {
        ...student,
        attendance:
          record && record.present !== null
            ? [
              {
                present: record.present === true,
                date: currentDate.value.toISOString().split('T')[0],
                notes: record.notes,
              },
            ]
            : [],
      };
    });

    // Generate the PDF report
    await generateAttendanceReportPDF({
      classId: props.classId,
      className: props.className,
      teacherName: props.teacherName,
      date: currentDate.value,
      students: studentsWithAttendance,
    });
  } catch (error) {
    console.error('Error generating attendance report:', error);
    alert('Hubo un problema al generar el reporte de asistencia.');
  }
};

// Download monthly report
const downloadMonthlyReport = async () => {
  try {
    const month = currentDate.value.getMonth() + 1; // JavaScript months are 0-indexed
    const year = currentDate.value.getFullYear();

    // For this example, we'll just use current attendance data
    // In a real app, you would load all attendance data for the month
    const studentsWithAttendance = props.students.map((student) => {
      const record = attendanceRecords.value.find((r) => r.id === student.id);

      return {
        ...student,
        attendance:
          record && record.present !== null
            ? [
              {
                present: record.present === true,
                date: currentDate.value.toISOString().split('T')[0],
                notes: record.notes,
              },
            ]
            : [],
      };
    });

    await generateMonthlyAttendanceReportPDF(
      props.className,
      props.teacherName,
      month,
      year,
      studentsWithAttendance,
    );
  } catch (error) {
    console.error('Error generating monthly report:', error);
    alert('Hubo un problema al generar el reporte mensual.');
  }
};
</script>

<style scoped>
.attendance-manager {
  transition:
    background-color 0.3s ease,
    color 0.3s ease;
}

/* Custom styles for table */
table {
  border-collapse: separate;
  border-spacing: 0;
}

th,
td {
  border-bottom-width: 1px;
}

tr:last-child td {
  border-bottom-width: 0;
}

/* Make sure disabled buttons look properly disabled */
button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
</style>
