<!-- src/modulos/attendance/views/TeacherHome.vue -->
<script setup lang="ts">
import { ref, onMounted, watch, computed } from "vue";
import { useRouter } from "vue-router";
import { format, startOfMonth, endOfMonth, eachDayOfInterval } from 'date-fns'

// Componentes
import AttendanceHeader from "../../components/AttendanceHeader.vue";
import Calendar from "@/components/Calendar.vue";
import DateClassSelector from "@/modulos/Classes/components/DateClassSelector.vue";
import AttendanceList from "../../components/AttendanceList.vue";

// Composables y store
import { useAttendanceState } from "../../composables/useAttendanceState";
import { useModal } from "../../composables/useModal";
import { useToast } from "../../composables/useToast";
import { useAttendanceStore } from "../../store/attendance";

// Obtener las clases del maestro
import { useClassesStore } from '@/modulos/Classes/store/classes'
const classesStore = useClassesStore();

// Desestructuramos TODO lo que necesitamos de useAttendanceState
const {
  selectedDate,
  selectedClass,
  view,
  loading,
  students,
  attendanceRecords,
  init,
  setDate,
  setClass,
  loadCurrent,
} = useAttendanceState("maestro");

const modal = useModal();
const toast = useToast();
const attendanceStore = useAttendanceStore();
const router = useRouter();

// Getter con fechas + status (registered / none / partial)
const statuses = attendanceStore.dateAttendanceStatuses;

// IDs de clases que ya tienen registro en la fecha actual
const classesWithRecords = ref<string[]>([]);

async function updateClassesWithRecords() {
  await attendanceStore.fetchAttendanceDocuments();
  classesWithRecords.value = attendanceStore.attendanceDocuments
    .filter((doc) => doc.fecha === selectedDate.value)
    .map((doc) => doc.classId);
}

async function handleDateChange(date: string) {
  await setDate(date);
  view.value = "class-select";
  await updateClassesWithRecords();
}

function handleClassSelect(classId: string) {
  setClass(classId);
  loadCurrent(); // Cargar alumnos y registros de asistencia
  view.value = "attendance-form"; // Cambiar la vista SOLO después de cargar los datos
}

function handleSaved() {
  toast.success("Asistencia guardada");
  updateClassesWithRecords();
}

onMounted(async () => {
  await init();
  await updateClassesWithRecords();
});

// Cuando cambie la fecha, recargamos las clases con registros
watch(selectedDate, updateClassesWithRecords);

// Computed para obtener el mes mostrado en el calendario
const displayedMonth = ref(new Date()); // Puedes actualizar esto según tu lógica de navegación de mes

// Computed para calcular el estado de cada fecha usando el getter del store
const getDateStatuses = computed(() => attendanceStore.dateAttendanceStatuses);

// Computed para mostrar el nombre de la clase seleccionada en el header
const selectedClassName = computed(() => {
  if (!selectedClass.value) return '';
  const found = classesStore.classes.find(c => c.id === selectedClass.value);
  return found ? found.name : selectedClass.value;
});

// Función para volver al calendario desde el header
function handleChangeView(newView: string) {
  view.value = newView;
}
</script>

<template>
  <div class="p-4 space-y-4">
    <!-- Header -->
    <AttendanceHeader
  :selected-date="selectedDate"
  :selected-class="selectedClassName"
  role="maestro"
  @changeView="handleChangeView"
  @analytics="modal.open('analytics')"
  @report="modal.open('report')"
/>

    <Transition name="fade" mode="out-in">
      <!-- Calendario con puntos de colores -->
      <Calendar
        v-if="view === 'calendar'"
        :selected-date="selectedDate" 
        :date-statuses="getDateStatuses"
        @select="handleDateChange"
        @date-change="handleDateChange"
      />

      <DateClassSelector
  v-else-if="view === 'class-select'"
  v-model="selectedClass"
  :selected-date="selectedDate"
  :classes-with-records="classesWithRecords"
  :is-loading="loading"
  @update:model-value="handleClassSelect"
  @continue="view = 'attendance-form'"
  @date-change="handleDateChange"
/>

      <AttendanceList
  v-else-if="view === 'attendance-form'"
  :selected-date="selectedDate"
  :selected-class="selectedClass"
  :students="students"
  :attendance-records="attendanceRecords"
  @saved="handleSaved"
  @error="toast.error($event)"
/>
    </Transition>
  </div>
</template>
<style>
.fade-enter-active, .fade-leave-active {
  transition: opacity 0.3s ease;
}
.fade-enter-from, .fade-leave-to {
  opacity: 0;
}
</style>