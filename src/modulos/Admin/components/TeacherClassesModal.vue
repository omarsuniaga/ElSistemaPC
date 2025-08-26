<template>
  <Dialog :open="show" @close="$emit('close')" class="relative z-50">
    <div class="fixed inset-0 bg-black/30 dark:bg-black/50" aria-hidden="true" />
    
    <div class="fixed inset-0 flex items-center justify-center p-4">
      <DialogPanel class="w-full max-w-4xl bg-white dark:bg-gray-800 rounded-lg shadow-xl overflow-hidden">
        <!-- Header -->
        <div class="px-6 py-4 bg-blue-600 dark:bg-blue-700">
          <div class="flex items-center justify-between">
            <div>
              <h3 class="text-lg font-medium text-white">
                Clases de {{ teacherName }}
              </h3>
              <p class="text-sm text-blue-100">
                {{ classes.length }} clase{{ classes.length !== 1 ? 's' : '' }} asignada{{ classes.length !== 1 ? 's' : '' }}
                • {{ totalStudents }} estudiante{{ totalStudents !== 1 ? 's' : '' }}
                • {{ totalWeeklyHours }}h semanales
              </p>
            </div>
            <button
              @click="$emit('close')"
              class="text-white hover:text-gray-200 transition-colors"
            >
              <XMarkIcon class="h-6 w-6" />
            </button>
          </div>
        </div>

        <!-- Content -->
        <div class="p-6">
          <!-- Empty State -->
          <div v-if="classes.length === 0" class="text-center py-12">
            <AcademicCapIcon class="mx-auto h-12 w-12 text-gray-400" />
            <h3 class="mt-2 text-sm font-medium text-gray-900 dark:text-white">
              Sin clases asignadas
            </h3>
            <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Este maestro no tiene clases asignadas actualmente.
            </p>
          </div>

          <!-- Classes Grid -->
          <div v-else class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div
              v-for="cls in classes"
              :key="cls.id"
              @click="navigateToClass(cls.id)"
              class="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 hover:bg-gray-100 dark:hover:bg-gray-600 cursor-pointer transition-colors border border-gray-200 dark:border-gray-600 hover:border-blue-300 dark:hover:border-blue-500"
            >
              <!-- Class Header -->
              <div class="flex items-start justify-between mb-3">
                <div class="flex-1">
                  <h4 class="font-medium text-gray-900 dark:text-white">
                    {{ cls.name }}
                  </h4>
                  <p class="text-sm text-gray-600 dark:text-gray-400">
                    {{ cls.instrument || 'Sin instrumento' }}
                    {{ cls.level ? ` • ${cls.level}` : '' }}
                  </p>
                </div>
                <span
                  :class="[
                    'inline-flex items-center px-2 py-1 rounded-full text-xs font-medium',
                    cls.status === 'activa'
                      ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                      : 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300',
                  ]"
                >
                  {{ cls.status || 'activa' }}
                </span>
              </div>

              <!-- Class Stats -->
              <div class="grid grid-cols-3 gap-3 mb-3">
                <div class="text-center">
                  <div class="text-lg font-semibold text-gray-900 dark:text-white">
                    {{ cls.studentIds?.length || 0 }}
                  </div>
                  <div class="text-xs text-gray-600 dark:text-gray-400">Estudiantes</div>
                </div>
                <div class="text-center">
                  <div class="text-lg font-semibold text-gray-900 dark:text-white">
                    {{ getClassWeeklyHours(cls) }}h
                  </div>
                  <div class="text-xs text-gray-600 dark:text-gray-400">Semanales</div>
                </div>
                <div class="text-center">
                  <div class="text-lg font-semibold text-gray-900 dark:text-white">
                    {{ cls.maxStudents || 'Sin límite' }}
                  </div>
                  <div class="text-xs text-gray-600 dark:text-gray-400">Máximo</div>
                </div>
              </div>

              <!-- Schedule -->
              <div class="space-y-1">
                <div class="flex items-center text-sm text-gray-600 dark:text-gray-400">
                  <ClockIcon class="h-4 w-4 mr-2" />
                  {{ formatSchedule(cls) }}
                </div>
                <div class="flex items-center text-sm text-gray-600 dark:text-gray-400">
                  <MapPinIcon class="h-4 w-4 mr-2" />
                  {{ cls.room || 'Aula no asignada' }}
                </div>
              </div>

              <!-- Hover indicator -->
              <div class="mt-3 flex items-center justify-end">
                <div class="text-xs text-blue-600 dark:text-blue-400 opacity-0 group-hover:opacity-100 transition-opacity">
                  Click para ver detalles →
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Footer -->
        <div class="px-6 py-4 bg-gray-50 dark:bg-gray-700 border-t border-gray-200 dark:border-gray-600">
          <div class="flex justify-between items-center">
            <div class="text-sm text-gray-600 dark:text-gray-400">
              Total de horas semanales: <span class="font-medium">{{ totalWeeklyHours }}h</span>
            </div>
            <button
              @click="$emit('close')"
              class="px-4 py-2 bg-gray-200 dark:bg-gray-600 text-gray-800 dark:text-gray-200 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors"
            >
              Cerrar
            </button>
          </div>
        </div>
      </DialogPanel>
    </div>
  </Dialog>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useRouter } from 'vue-router';
import { Dialog, DialogPanel } from '@headlessui/vue';
import {
  XMarkIcon,
  AcademicCapIcon,
  ClockIcon,
  MapPinIcon,
} from '@heroicons/vue/24/outline';

interface ClassData {
  id: string;
  name: string;
  instrument?: string;
  level?: string;
  status?: string;
  studentIds?: string[];
  maxStudents?: number;
  room?: string;
  schedule?: {
    slots?: Array<{
      dayOfWeek: number;
      startTime: string;
      endTime: string;
    }>;
  };
}

const props = defineProps<{
  show: boolean;
  teacherName: string;
  classes: ClassData[];
}>();

const emit = defineEmits<{
  close: [];
}>();

const router = useRouter();

const totalStudents = computed(() => {
  return props.classes.reduce((total, cls) => total + (cls.studentIds?.length || 0), 0);
});

const totalWeeklyHours = computed(() => {
  return props.classes.reduce((total, cls) => total + getClassWeeklyHours(cls), 0);
});

const getClassWeeklyHours = (cls: ClassData): number => {
  if (!cls.schedule?.slots) return 0;
  
  return cls.schedule.slots.reduce((total, slot) => {
    const start = new Date(`2000-01-01 ${slot.startTime}`);
    const end = new Date(`2000-01-01 ${slot.endTime}`);
    const hours = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
    return total + (hours > 0 ? hours : 0);
  }, 0);
};

const formatSchedule = (cls: ClassData): string => {
  if (!cls.schedule?.slots || cls.schedule.slots.length === 0) {
    return 'Sin horario definido';
  }

  const dayNames = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
  
  return cls.schedule.slots
    .map((slot) => {
      const dayName = dayNames[slot.dayOfWeek] || 'Día inválido';
      return `${dayName} ${slot.startTime}-${slot.endTime}`;
    })
    .join(', ');
};

const navigateToClass = (classId: string) => {
  router.push(`/admin/classes/${classId}`);
  emit('close');
};
</script>

<style scoped>
/* Enhanced hover effects */
.group:hover .opacity-0 {
  opacity: 1;
}

/* Smooth transitions */
* {
  transition-property: all;
  transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
  transition-duration: 200ms;
}
</style>