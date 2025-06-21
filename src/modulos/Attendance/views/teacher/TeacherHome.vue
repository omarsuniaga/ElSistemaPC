<!-- src/modulos/attendance/views/TeacherHome.vue -->
<script setup lang="ts">
import { ref, onMounted, watch, computed } from "vue";
import { useRouter } from "vue-router";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, parseISO } from 'date-fns'

// Componentes
import AttendanceHeader from "../../components/AttendanceHeader.vue";
import Calendar from "@/components/Calendar.vue";
import DateClassSelector from "@/modulos/Classes/components/DateClassSelector.vue";
import AttendanceList from "../../components/AttendanceList.vue";
import ClassesModal from "../../components/ClassesModal.vue";

// Composables y store
import { useAttendanceState } from "../../composables/useAttendanceState";
import { useAttendanceActionsSimple as useAttendanceActions } from "../../composables/useAttendanceActionsSimple";
import { useModal } from "../../composables/useModal";
import { useToast } from "../../composables/useToast";
import { useAttendanceStore } from "../../store/attendance";
import { useAuthStore } from "../../../../stores/auth";

// Obtener las clases del maestro
import { useClassesStore } from '../../../Classes/store/classes'

const classesStore = useClassesStore();
const authStore = useAuthStore();

const {
  selectedDate,
  selectedClass,
  view,
  loading,
  students, // This is localStudents for useAttendanceActions
  attendanceRecords, // This is localAttendanceRecords
  init,
  setDate,
  setClass,
  loadCurrent,
} = useAttendanceState("maestro");

const toast = useToast();

// Provide the necessary options to useAttendanceActions
const attendanceActions = useAttendanceActions({
  localStudents: students, // Pass the students ref from useAttendanceState
  localAttendanceRecords: attendanceRecords, // Pass the attendanceRecords ref
  pendingChanges: ref(new Set<string>()), // Create a new ref for pendingChanges, or get from state if appropriate
  pendingJustifications: ref(new Map<string, { reason?: string; documentURL?: string }>()), // Create new ref for justifications
  displayToast: toast.success, // Pass the success toast function
  isProcessing: loading, // Pass the loading ref from useAttendanceState
  selectedDate: selectedDate, // Pass selectedDate ref
  selectedClass: selectedClass, // Pass selectedClass ref
});

const {
  pendingChangesCount // Now this should be correctly initialized
} = attendanceActions;

const modal = useModal();
const attendanceStore = useAttendanceStore();
const router = useRouter();

// Estado para el modal de clases
const showClassesModal = ref(false);
const modalDate = ref('');
const classesForDate = ref([]);

// Getter con fechas + status (registered / none / partial)
// const statuses = attendanceStore.dateAttendanceStatuses; // Replaced by getDateStatuses from useAttendanceState

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
  
  // Obtener las clases para la fecha seleccionada y mostrar el modal
  await fetchClassesForDate(date);
  modalDate.value = date;
  showClassesModal.value = true;
}

// Función para obtener las clases programadas en una fecha específica
async function fetchClassesForDate(date: string) {
  try {
    const dayOfWeek = format(parseISO(date), 'EEEE').toLowerCase();
    const teacherId = authStore.user?.uid;
    
    if (!teacherId) {
      console.error('[TeacherHome] No hay un usuario logueado con uid');
      classesForDate.value = [];
      return;
    }
    
    console.log(`[TeacherHome] Buscando clases para el maestro ${teacherId} en la fecha ${date} (${dayOfWeek})`);
    
    // Obtener todas las clases primero
    await classesStore.fetchClasses();
    
    // 1. Obtener clases programadas donde el maestro es el encargado principal
    const scheduledClasses = classesStore.getClassesByDayAndTeacherId(dayOfWeek, teacherId) || [];
    console.log(`[TeacherHome] Clases programadas como encargado para ${dayOfWeek}:`, scheduledClasses.length);
    
    // 2. Obtener clases compartidas donde el maestro es asistente
    const sharedClasses = classesStore.classes.filter(cls => {
      // Verificar si el maestro es asistente en esta clase
      const isAssistant = cls.teachers?.some(teacher => 
        teacher.teacherId === teacherId && teacher.role.toString() === 'ASSISTANT'
      );
      
      if (!isAssistant) return false;
      
      // Verificar si la clase está programada para este día
      if (!cls.schedule?.slots || !Array.isArray(cls.schedule.slots)) {
        return false;
      }
      
      const hasSlotForDay = cls.schedule.slots.some(slot => {
        const slotDay = slot.day?.toLowerCase()?.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
        const currentDay = dayOfWeek.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
        return slotDay === currentDay;
      });
      
      return hasSlotForDay;
    });
    console.log(`[TeacherHome] Clases compartidas como asistente para ${dayOfWeek}:`, sharedClasses.length);
    
    // 3. Obtener clases que tienen asistencia registrada para esta fecha específica
    await attendanceStore.fetchAttendanceDocuments();
    const attendanceRecords = attendanceStore.attendanceDocuments.filter(record => 
      record.fecha === date && record.teacherId === teacherId
    );
    console.log(`[TeacherHome] Registros de asistencia para ${date}:`, attendanceRecords.length);
    
    // 4. Crear un mapa para evitar duplicados y combinar información
    const classMap = new Map();
    
    // Procesar clases programadas (encargado principal)
    for (const cls of scheduledClasses) {
      const hasAttendance = attendanceStore.isClassRegistered(date, cls.id);
      
      classMap.set(cls.id, {
        ...cls,
        teacher: `Profesor ${cls.teacherId?.substring(0, 6) || 'N/A'}`,
        teacherId: cls.teacherId,
        hasAttendance: hasAttendance,
        classType: 'scheduled',
        isScheduledClass: true,
        schedule: cls.schedule
      });
    }
    
    // Procesar clases compartidas (asistente)
    for (const cls of sharedClasses) {
      const hasAttendance = attendanceStore.isClassRegistered(date, cls.id);
      
      // Obtener permisos del maestro asistente
      const myTeacherData = cls.teachers?.find(t => t.teacherId === teacherId);
      const canTakeAttendance = myTeacherData?.permissions?.canTakeAttendance || false;
      
      classMap.set(cls.id, {
        ...cls,
        teacher: `Profesor ${cls.teacherId?.substring(0, 6) || 'N/A'}`,
        teacherId: cls.teacherId,
        teachers: cls.teachers,
        hasAttendance: hasAttendance,
        classType: 'shared',
        isScheduledClass: true,
        teacherPermissions: {
          canTakeAttendance: canTakeAttendance
        },
        schedule: cls.schedule
      });
    }
    
    // Procesar clases con asistencia registrada (pueden ser clases extra o de recuperación)
    for (const record of attendanceRecords) {
      const existingClass = classMap.get(record.classId);
      
      if (existingClass) {
        // Ya existe en las programadas/compartidas, actualizar info
        existingClass.hasAttendance = true;
        existingClass.attendanceRecord = record;
      } else {
        // Clase no programada pero con asistencia (clase extra/recuperación)
        const classInfo = classesStore.classes.find(c => c.id === record.classId);
        
        if (classInfo) {
          classMap.set(record.classId, {
            ...classInfo,
            teacher: `Profesor ${classInfo.teacherId?.substring(0, 6) || 'N/A'}`,
            teacherId: classInfo.teacherId,
            hasAttendance: true,
            classType: 'recorded',
            isScheduledClass: false,
            attendanceRecord: record,
            schedule: classInfo.schedule || { slots: [] }
          });
        } else {
          // Clase no encontrada en el store, crear entrada básica
          classMap.set(record.classId, {
            id: record.classId,
            name: `Clase ${record.classId}`,
            teacher: '',
            teacherId: teacherId,
            hasAttendance: true,
            classType: 'recorded',
            isScheduledClass: false,
            attendanceRecord: record,
            schedule: { slots: [] },
            studentIds: []
          });
        }
      }
    }
    
    // Convertir el mapa a array
    const allClasses = Array.from(classMap.values());
    
    // Preparar datos para el modal con el formato esperado
    classesForDate.value = allClasses.map(classItem => {
      // Obtener horario formateado
      let timeString = '';
      if (classItem.schedule?.slots && classItem.schedule.slots.length > 0) {
        const slot = classItem.schedule.slots.find(s => {
          const slotDay = s.day?.toLowerCase()?.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
          const currentDay = dayOfWeek.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
          return slotDay === currentDay;
        });
        
        if (slot) {
          timeString = `${slot.startTime} - ${slot.endTime}`;
        }
      }
      
      return {
        id: classItem.id,
        name: classItem.name,
        teacher: classItem.teacher,
        teacherId: classItem.teacherId,
        teachers: classItem.teachers,
        time: timeString,
        students: classItem.studentIds?.length || 0,
        studentIds: classItem.studentIds,
        hasAttendance: classItem.hasAttendance,
        classType: classItem.classType,
        isScheduledClass: classItem.isScheduledClass,
        hasAttendanceRecord: classItem.hasAttendance,
        attendanceRecord: classItem.attendanceRecord,
        teacherPermissions: classItem.teacherPermissions,
        schedule: classItem.schedule
      };
    });
    
    console.log(`[TeacherHome] Total de clases encontradas para ${teacherId}:`, classesForDate.value.length);
    
  } catch (error) {
    console.error('[TeacherHome] Error al obtener las clases:', error);
    classesForDate.value = [];
  }
}

function handleClassSelect(classId: string) {
  setClass(classId);
  loadCurrent(); // Cargar alumnos y registros de asistencia
  view.value = "attendance-form"; // Cambiar la vista SOLO después de cargar los datos
  showClassesModal.value = false; // Cerrar el modal si está abierto
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

// Transform dateStatuses to the format expected by Calendar.vue's markedDates prop
const calendarMarkedDates = computed(() => {
  const statuses = getDateStatuses.value;
  if (!statuses) return [];
  return Object.entries(statuses).map(([date, statusInfo]) => {
    let color = '#cccccc'; // Default for 'none'
    let style: 'dot' | 'circle' | 'highlight' = 'dot';
    let tooltip = `Fecha: ${date}`;

    // Example: Customize based on statusInfo.type or statusInfo.count
    // This logic needs to be adapted based on the actual structure of statusInfo
    // and how you want to represent different states (e.g., 'attendance', 'partial', 'none')
    if (statusInfo.type === 'attendance') {
      if (statusInfo.count > 0) {
        color = '#4ade80'; // green for registered
        tooltip = `Asistencia registrada (${statusInfo.count} clases)`;
      } else {
        color = '#facc15'; // yellow for partial/pending (example)
        tooltip = `Asistencia parcial/pendiente`;
      }
    } else if (statusInfo.type === 'none') {
      // Keep default or set specific style for 'none'
      color = '#9ca3af'; // gray for no records
      tooltip = `Sin registros de asistencia`;
    }
    // Add more conditions for other statuses if necessary

    return {
      date,
      style,
      color,
      tooltip
    };
  });
});

// Computed para mostrar el nombre de la clase seleccionada en el header
const selectedClassName = computed(() => {
  if (!selectedClass.value) return '';
  const found = classesStore.classes.find(c => c.id === selectedClass.value);
  return found ? found.name : selectedClass.value;
});

// Función para volver al calendario desde el header
function handleChangeView(newView: 'calendar' | 'class-select' | 'attendance-form') {
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
l log   @analytics="modal.open('analytics')"
e  @report="modal.open('report')"
  :pending-changes-count="Number(pendingChangesCount?.value) || 0" 
/>

    <!-- Modal que muestra las clases disponibles para la fecha seleccionada -->
    <ClassesModal
      :is-open="showClassesModal"
      :date="modalDate"
      :classes="classesForDate"
      @close="showClassesModal = false"
      @select-class="handleClassSelect"
    />
    
    <Transition name="fade" mode="out-in">
      <!-- Calendario con puntos de colores -->
      <Calendar
        v-if="view === 'calendar'"
        :model-value="selectedDate" 
        :marked-dates="calendarMarkedDates"
        @update:model-value="handleDateChange" 
        @day-click="handleDateChange" 
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
        :date="selectedDate"
        :class-id="selectedClass"
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