<template>
  <div class="bg-white dark:bg-gray-800 rounded-lg shadow p-3 md:p-4">
    <h2
      class="text-base md:text-lg font-semibold text-gray-900 dark:text-white mb-3 flex justify-between items-center"
    >
      <span>Clases Programadas para Hoy</span>
      <span
        v-if="!loading"
        class="flex items-center gap-1.5 px-2 py-1 bg-amber-100 text-amber-800 rounded text-sm"
      >
        <CalendarIcon class="h-4 w-4" />
        {{ todaysClasses.length }} clases
      </span>
    </h2>

    <!-- Loading State -->
    <div v-if="loading" class="flex justify-center items-center py-8">
      <div class="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500" />
      <span class="ml-2 text-sm text-gray-600 dark:text-gray-400">Cargando clases...</span>
    </div>

    <!-- Classes List -->
    <div v-else-if="todaysClasses.length > 0" class="space-y-3">
      <div
        v-for="classItem in todaysClasses"
        :key="classItem.id"
        class="p-3 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/20 cursor-pointer transition-all"
        @click="onViewClass(classItem.id)"
      >
        <div class="flex justify-between items-start">
          <div class="flex-1">
            <h3 class="font-medium text-gray-800 dark:text-gray-200">{{ classItem.name }}</h3>
            <p class="text-sm text-gray-600 dark:text-gray-400">
              {{ classItem.level || "Sin nivel" }} - {{ classItem.instrument || "Sin instrumento" }}
            </p>

            <!-- Today's Slots Only -->
            <div v-if="getTodaysSlots(classItem).length > 0" class="flex flex-wrap gap-1 mt-1.5">
              <span
                v-for="(slot, idx) in getTodaysSlots(classItem)"
                :key="idx"
                class="text-xs bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 px-1.5 py-0.5 rounded"
              >
                {{ slot.startTime }} - {{ slot.endTime }}
              </span>
            </div>

            <p class="mt-1 text-xs text-gray-500 dark:text-gray-400">
              Aula: {{ classItem.classroom || "Sin asignar" }} | Estudiantes:
              {{ classItem.studentIds?.length || 0 }}
            </p>
          </div>

          <div class="flex space-x-1 ml-2">
            <button
              class="p-1 text-green-600 dark:text-green-400 hover:bg-green-100 dark:hover:bg-green-900/20 rounded-md transition-colors"
              title="Tomar Asistencia"
              @click.stop="onTakeAttendance(classItem.id)"
            >
              <ClipboardDocumentCheckIcon class="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Empty State -->
    <div v-else class="text-center py-8">
      <CalendarIcon class="h-12 w-12 text-gray-400 mx-auto mb-2" />
      <p class="text-gray-500 dark:text-gray-400 text-sm">No tienes clases programadas para hoy.</p>
      <p class="text-xs text-gray-400 dark:text-gray-500 mt-1">
        {{
          new Date().toLocaleDateString("es-ES", {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
          })
        }}
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, onMounted, watch } from 'vue';
import { CalendarIcon, ClipboardDocumentCheckIcon } from '@heroicons/vue/24/outline';
import { useRouter } from 'vue-router';
import { useClassesStore } from '../../Classes/store/classes';
import { useAuthStore } from '../../../stores/auth';
import { useTeachersStore } from '../store/teachers';

// Define types for class data
interface ClassScheduleSlot {
  day: string | number
  startTime: string
  endTime: string
}

interface ClassData {
  id: string
  name: string
  description?: string
  level?: string
  instrument?: string
  classroom?: string
  studentIds?: string[]
  teacherId?: string
  schedule?: {
    slots?: ClassScheduleSlot[]
  }
}

// Stores and Router
const router = useRouter();
const classesStore = useClassesStore();
const teachersStore = useTeachersStore();
const authStore = useAuthStore();

// State
const loading = ref(true);
const currentTeacherId = ref('');
const currentTeacher = ref<any>(null);

// Computed properties
const teacherClasses = computed(() => {
  if (!Array.isArray(classesStore.classes)) {
    console.warn('classesStore.classes is not an array', classesStore.classes);
    return [];
  }
  // Filter by currentTeacherId derived from store/auth
  return classesStore.classes.filter((classItem) => classItem.teacherId === currentTeacherId.value);
});

// Clases programadas para hoy (por día de la semana)
const todaysClasses = computed(() => {
  const today = new Date();
  const todayDayOfWeek = today.getDay(); // 0 = domingo, 6 = sábado

  const dayMapping: {[key: string | number]: number} = {
    domingo: 0,
    dom: 0,
    sunday: 0,
    sun: 0,
    '0': 0,
    lunes: 1,
    lun: 1,
    monday: 1,
    mon: 1,
    '1': 1,
    martes: 2,
    mar: 2,
    tuesday: 2,
    tue: 2,
    '2': 2,
    miércoles: 3,
    miercoles: 3,
    mié: 3,
    mie: 3,
    wednesday: 3,
    wed: 3,
    '3': 3,
    jueves: 4,
    jue: 4,
    thursday: 4,
    thu: 4,
    '4': 4,
    viernes: 5,
    vie: 5,
    friday: 5,
    fri: 5,
    '5': 5,
    sábado: 6,
    sabado: 6,
    sáb: 6,
    sab: 6,
    saturday: 6,
    sat: 6,
    '6': 6,
  };

  // Filter classes that have at least one slot scheduled for today
  return teacherClasses.value.filter((classItem) => {
    if (!classItem.schedule?.slots || !Array.isArray(classItem.schedule.slots)) return false;

    return classItem.schedule.slots.some((slot) => {
      // Ensure slot.day is treated as a number (0-6)
      const slotDayNum =
        typeof slot.day === 'string'
          ? dayMapping[slot.day.toLowerCase().trim()]
          : typeof slot.day === 'number'
            ? slot.day
            : undefined;

      return (
        slotDayNum !== undefined &&
        slotDayNum >= 0 &&
        slotDayNum <= 6 &&
        slotDayNum === todayDayOfWeek
      );
    });
  });
});

// Helper to get today's slots for a specific class
const getTodaysSlots = (classItem: ClassData) => {
  if (!classItem.schedule?.slots) return [];

  const today = new Date();
  const todayDayOfWeek = today.getDay();

  const dayMapping: {[key: string | number]: number} = {
    domingo: 0,
    dom: 0,
    sunday: 0,
    sun: 0,
    '0': 0,
    lunes: 1,
    lun: 1,
    monday: 1,
    mon: 1,
    '1': 1,
    martes: 2,
    mar: 2,
    tuesday: 2,
    tue: 2,
    '2': 2,
    miércoles: 3,
    miercoles: 3,
    mié: 3,
    mie: 3,
    wednesday: 3,
    wed: 3,
    '3': 3,
    jueves: 4,
    jue: 4,
    thursday: 4,
    thu: 4,
    '4': 4,
    viernes: 5,
    vie: 5,
    friday: 5,
    fri: 5,
    '5': 5,
    sábado: 6,
    sabado: 6,
    sáb: 6,
    sab: 6,
    saturday: 6,
    sat: 6,
    '6': 6,
  };

  return classItem.schedule.slots.filter((slot) => {
    const slotDayNum =
      typeof slot.day === 'string'
        ? dayMapping[slot.day.toLowerCase().trim()]
        : typeof slot.day === 'number'
          ? slot.day
          : undefined;
    return slotDayNum === todayDayOfWeek;
  });
};

// Helper to handle view class
const onViewClass = (classId: string) => {
  // Navigate to class detail or emit event to parent
  console.log('Viewing class:', classId);
  // You can add router navigation here if needed
};

// Helper to handle take attendance
const onTakeAttendance = (classId: string) => {
  const today = new Date();
  // Format date as YYYYMMDD
  const year = today.getFullYear();
  const month = (today.getMonth() + 1).toString().padStart(2, '0');
  const day = today.getDate().toString().padStart(2, '0');
  const dateString = `${year}${month}${day}`;

  // Navigate to the attendance route
  router
    .push({
      name: 'attendance',
      params: {
        date: dateString,
        classId,
      },
    })
    .catch((err) => {
      console.error('Error navigating to attendance route:', err);
    });
};

// Load data on mount
onMounted(async () => {
  loading.value = true;
  try {
    console.log('🔄 [TodaysClassesSection] Cargando datos...');

    // 1. Fetch teachers first to get current teacher ID
    if (teachersStore && typeof teachersStore.fetchTeachers === 'function') {
      await teachersStore.fetchTeachers();

      if (authStore.user?.uid) {
        // Try to find teacher by auth UID
        const teacher = await teachersStore.fetchTeacherByAuthUid?.(authStore.user.uid);
        if (teacher) {
          currentTeacherId.value = teacher.id;
          currentTeacher.value = teacher;
        } else {
          console.warn(
            '⚠️ No teacher found with auth UID:',
            authStore.user.uid,
            'Using UID as fallback.',
          );
          currentTeacherId.value = authStore.user.uid;
        }
      }
    }

    // 2. Fetch classes
    if (
      classesStore &&
      (typeof classesStore.forceSync === 'function' ||
        typeof classesStore.fetchClasses === 'function')
    ) {
      await (classesStore.forceSync ? classesStore.forceSync() : classesStore.fetchClasses());
    }

    console.log(
      `✅ [TodaysClassesSection] Datos cargados. Clases hoy: ${todaysClasses.value.length}`,
    );
  } catch (error) {
    console.error('❌ [TodaysClassesSection] Error cargando datos:', error);
  } finally {
    loading.value = false;
  }
});

// Watch for changes in currentTeacherId
watch(
  [currentTeacherId],
  async ([newTeacherId], [oldTeacherId]) => {
    if (newTeacherId && newTeacherId !== oldTeacherId) {
      console.log('🔄 [TodaysClassesSection] Teacher ID changed. Re-fetching classes.');
      try {
        if (
          classesStore &&
          (typeof classesStore.forceSync === 'function' ||
            typeof classesStore.fetchClasses === 'function')
        ) {
          await (classesStore.forceSync ? classesStore.forceSync() : classesStore.fetchClasses());
        }
      } catch (error) {
        console.error('❌ [TodaysClassesSection] Error re-fetching classes:', error);
      }
    }
  },
  { immediate: true },
);
</script>

<style scoped>
/* Add any specific styles for this section here */
</style>
