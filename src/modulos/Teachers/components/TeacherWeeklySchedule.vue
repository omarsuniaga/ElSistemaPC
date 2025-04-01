<script setup lang="ts">
import { ref, computed } from 'vue';

// ---------------------------
// Interfaces internas
// ---------------------------
interface ClassSlot {
  day: number | string;   // Puede ser 0-6 o "Lunes", etc.
  startTime: string;      // Formato "HH:mm"
  endTime: string;        // Formato "HH:mm"
}

interface ClassSchedule {
  slots: ClassSlot[];
}

export interface ClassItem {
  id: string;
  name: string;
  classroom?: string;
  studentIds?: string[];
  schedule: ClassSchedule;
  duration?: number;
  startTime?: string;
  endTime?: string;
}

interface DayItem {
  id: number;    // 0: Domingo, 1: Lunes, …, 6: Sábado
  name: string;
}

interface ClassSlotDetail {
  key: string;
  id: string;
  name: string;
  startTime: string;
  endTime: string;
  classroom?: string;
  studentCount: number;
  duration: number; // Duración en horas (mínimo 1)
}

interface ClassesByDay {
  [day: number]: ClassSlotDetail[];
}

// ---------------------------
// Props y Emits
// ---------------------------
const props = defineProps({
  classes: {
    type: Array as () => ClassItem[],
    required: true,
    default: () => []
  },
  schedules: {
    type: Array as () => any[],
    required: false,
    default: () => []
  }
});

const emit = defineEmits(['view-class']);

// ---------------------------
// Constantes: Días de la semana
// ---------------------------
const days: DayItem[] = [
  { id: 0, name: 'Domingo' },
  { id: 1, name: 'Lunes' },
  { id: 2, name: 'Martes' },
  { id: 3, name: 'Miércoles' },
  { id: 4, name: 'Jueves' },
  { id: 5, name: 'Viernes' },
  { id: 6, name: 'Sábado' }
];

// ---------------------------
// Helpers
// ---------------------------
function mapDayNameToNumber(day: string): number {
  const mapping: Record<string, number> = {
    'Domingo': 0,
    'Lunes': 1,
    'Martes': 2,
    'Miércoles': 3,
    'Miercoles': 3,
    'Jueves': 4,
    'Viernes': 5,
    'Sábado': 6,
    'Sabado': 6
  };
  return mapping[day] ?? -1;
}

function handleClassClick(classId: string): void {
  emit('view-class', classId);
}

function calculateDuration(startTime: string, endTime: string): number {
  const [sh, sm] = startTime.split(':').map(Number);
  const [eh, em] = endTime.split(':').map(Number);
  return (eh * 60 + em) - (sh * 60 + sm);
}

// ---------------------------
// Computed: Combinar data de clases y schedules
// ---------------------------
const combinedClasses = computed<ClassItem[]>(() => {
  return props.classes.map(classItem => {
    const matchingSchedules = props.schedules.filter(s => s.scheduleDay && s.scheduleDay.classId === classItem.id);
    let slots: ClassSlot[] = [];
    if (matchingSchedules.length > 0) {
      slots = matchingSchedules.map(s => ({
        day: s.scheduleDay.dayOfWeek,
        startTime: s.scheduleDay.timeSlot.startTime,
        endTime: s.scheduleDay.timeSlot.endTime
      }));
    } else if (classItem.schedule && Array.isArray(classItem.schedule.slots)) {
      slots = classItem.schedule.slots;
    }
    return { ...classItem, schedule: { slots } };
  });
});

// ---------------------------
// Computed: Agrupar clases por día
// ---------------------------
const classesByDay = computed<ClassesByDay>(() => {
  const result: ClassesByDay = {};
  days.forEach(day => {
    result[day.id] = [];
  });

  combinedClasses.value.forEach(classItem => {
    if (!classItem.schedule || !Array.isArray(classItem.schedule.slots)) return;
    classItem.schedule.slots.forEach(slot => {
      if (!slot.day || !slot.startTime || !slot.endTime) return;

      const dayId: number = typeof slot.day === 'string'
        ? mapDayNameToNumber(slot.day)
        : Number(slot.day);
      if (isNaN(dayId) || dayId < 0 || dayId > 6) return;

      const durationInMinutes = calculateDuration(slot.startTime, slot.endTime);
      // Mínimo 60 minutos (1 hora) en caso de error o superposición
      const durationHours = Math.max(durationInMinutes / 60, 1);

      const slotDetail: ClassSlotDetail = {
        key: `${classItem.id}-${slot.startTime}`,
        id: classItem.id,
        name: classItem.name,
        startTime: slot.startTime,
        endTime: slot.endTime,
        classroom: classItem.classroom,
        studentCount: Array.isArray(classItem.studentIds) ? classItem.studentIds.length : 0,
        duration: durationHours
      };
      result[dayId].push(slotDetail);
    });
  });

  // Ordenar cada día por la hora de inicio
  Object.keys(result).forEach(dayKey => {
    result[Number(dayKey)] = result[Number(dayKey)].sort((a, b) => a.startTime.localeCompare(b.startTime));
  });

  return result;
});

// ---------------------------
// Computed: Total de horas semanales
// ---------------------------
const totalWeeklyHours = computed<number>(() => {
  let total = 0;
  for (const day in classesByDay.value) {
    classesByDay.value[Number(day)].forEach(slot => {
      total += slot.duration;
    });
  }
  return total;
});

// ---------------------------
// Computed: Días activos (con clases)
// ---------------------------
const activeDays = computed<DayItem[]>(() => {
  return days.filter(day => classesByDay.value[day.id] && classesByDay.value[day.id].length > 0);
});
</script>

<template>
  <div class="teacher-weekly-schedule p-2">
    <!-- Cabecera con horas semanales -->
    <div class="flex justify-end mb-4">
      <div class="text-sm font-semibold text-gray-700 dark:text-gray-200">
        Horas Semanales: {{ totalWeeklyHours.toFixed(1) }}
      </div>
    </div>

    <!-- Iterar solo por días activos -->
    <div v-if="activeDays.length > 0">
      <div
        v-for="day in activeDays"
        :key="day.id"
        class="mb-6 page-break-inside-avoid"
      >
        <!-- Encabezado del día -->
        <h3 class="text-lg font-bold text-gray-800 dark:text-gray-100 mb-2 border-b border-gray-300 dark:border-gray-600">
          {{ day.name }}
        </h3>
        <!-- Tabla con las clases de ese día -->
        <table class="w-full text-sm border border-gray-300 dark:border-gray-600">
          <thead class="bg-gray-100 dark:bg-gray-700 border-b border-gray-300 dark:border-gray-600">
            <tr>
              <th class="p-2 text-left text-gray-700 dark:text-gray-300">Hora</th>
              <th class="p-2 text-left text-gray-700 dark:text-gray-300">Clase</th>
              <th class="p-2 text-left text-gray-700 dark:text-gray-300">Aula</th>
              <th class="p-2 text-left text-gray-700 dark:text-gray-300">Est.</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="slot in classesByDay[day.id]"
              :key="slot.key"
              class="hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer transition-colors"
              @click="handleClassClick(slot.id)"
            >
              <td class="p-2 text-gray-600 dark:text-gray-200">
                {{ slot.startTime }} - {{ slot.endTime }}
              </td>
              <td class="p-2 font-semibold text-gray-700 dark:text-gray-100 truncate">
                {{ slot.name }}
              </td>
              <td class="p-2 text-gray-600 dark:text-gray-200">
                {{ slot.classroom || 'Sin aula' }}
              </td>
              <td class="p-2 text-center text-gray-600 dark:text-gray-200">
                {{ slot.studentCount }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
    <div v-else class="text-center text-gray-500 italic">
      No hay clases programadas.
    </div>
  </div>
</template>

<style scoped>
.teacher-weekly-schedule {
  font-family: 'Helvetica', sans-serif;
}
.page-break-inside-avoid {
  page-break-inside: avoid;
}
@media print {
  .teacher-weekly-schedule {
    padding: 4mm;
    font-size: 0.8rem;
  }
  table {
    page-break-inside: avoid;
  }
}
</style>
