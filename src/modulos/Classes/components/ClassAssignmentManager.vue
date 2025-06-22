<template>
  <div class="class-assignment-manager">
    <!-- Header -->
    <div class="mb-6">
      <h2 class="text-2xl font-bold text-gray-900 dark:text-white mb-2">
        Gestión de Asignaciones
      </h2>
      <p class="text-gray-600 dark:text-gray-400">
        Asigna profesores, estudiantes y horarios a las clases
      </p>
    </div>

    <!-- Quick Stats -->
    <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
      <div class="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
        <div class="flex items-center">
          <div class="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg mr-3">
            <AcademicCapIcon class="h-5 w-5 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <p class="text-sm text-gray-600 dark:text-gray-400">Total Clases</p>
            <p class="text-xl font-semibold text-gray-900 dark:text-white">{{ totalClasses }}</p>
          </div>
        </div>
      </div>

      <div class="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
        <div class="flex items-center">
          <div class="p-2 bg-green-100 dark:bg-green-900 rounded-lg mr-3">
            <UserIcon class="h-5 w-5 text-green-600 dark:text-green-400" />
          </div>
          <div>
            <p class="text-sm text-gray-600 dark:text-gray-400">Con Profesor</p>
            <p class="text-xl font-semibold text-gray-900 dark:text-white">{{ classesWithTeacher }}</p>
          </div>
        </div>
      </div>

      <div class="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
        <div class="flex items-center">
          <div class="p-2 bg-purple-100 dark:bg-purple-900 rounded-lg mr-3">
            <UsersIcon class="h-5 w-5 text-purple-600 dark:text-purple-400" />
          </div>
          <div>
            <p class="text-sm text-gray-600 dark:text-gray-400">Con Estudiantes</p>
            <p class="text-xl font-semibold text-gray-900 dark:text-white">{{ classesWithStudents }}</p>
          </div>
        </div>
      </div>

      <div class="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
        <div class="flex items-center">
          <div class="p-2 bg-yellow-100 dark:bg-yellow-900 rounded-lg mr-3">
            <ClockIcon class="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
          </div>
          <div>
            <p class="text-sm text-gray-600 dark:text-gray-400">Con Horario</p>
            <p class="text-xl font-semibold text-gray-900 dark:text-white">{{ classesWithSchedule }}</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Assignment Cards -->
    <div class="space-y-6">
      <div
        v-for="classItem in classes"
        :key="classItem.id"
        class="bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden"
      >
        <!-- Class Header -->
        <div class="p-6 border-b border-gray-200 dark:border-gray-700">
          <div class="flex items-center justify-between">
            <div class="flex items-center">
              <div class="h-12 w-12 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center mr-4">
                <MusicalNoteIcon class="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <h3 class="text-lg font-semibold text-gray-900 dark:text-white">{{ classItem.name }}</h3>
                <p class="text-sm text-gray-600 dark:text-gray-400">{{ classItem.level }} • {{ classItem.instrument }}</p>
              </div>
            </div>
            
            <div class="flex items-center space-x-2">
              <!-- Status indicators -->
              <div class="flex items-center space-x-1">
                <div 
                  :class="[
                    'w-2 h-2 rounded-full',
                    classItem.teacherId ? 'bg-green-500' : 'bg-red-500'
                  ]"
                  :title="classItem.teacherId ? 'Profesor asignado' : 'Sin profesor'"
                ></div>
                <div 
                  :class="[
                    'w-2 h-2 rounded-full',
                    classItem.studentIds?.length ? 'bg-green-500' : 'bg-red-500'
                  ]"
                  :title="classItem.studentIds?.length ? 'Estudiantes asignados' : 'Sin estudiantes'"
                ></div>
                <div 
                  :class="[
                    'w-2 h-2 rounded-full',
                    classItem.schedule ? 'bg-green-500' : 'bg-red-500'
                  ]"
                  :title="classItem.schedule ? 'Horario configurado' : 'Sin horario'"
                ></div>
              </div>
              
              <button
                @click="toggleExpanded(classItem.id)"
                class="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
              >
                <ChevronDownIcon 
                  :class="[
                    'h-5 w-5 transition-transform',
                    expandedClasses.includes(classItem.id) ? 'rotate-180' : ''
                  ]"
                />
              </button>
            </div>
          </div>
        </div>

        <!-- Expanded Content -->
        <div v-if="expandedClasses.includes(classItem.id)" class="p-6 space-y-6">
          <!-- Teacher Assignment -->
          <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <!-- Teacher Selection -->
            <div class="space-y-3">
              <h4 class="text-sm font-medium text-gray-900 dark:text-white flex items-center">
                <UserIcon class="h-4 w-4 mr-2" />
                Profesor Asignado
              </h4>
              
              <select
                :value="classItem.teacherId || ''"
                @change="assignTeacher(classItem.id, ($event.target as HTMLSelectElement).value)"
                class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="">Seleccionar profesor...</option>
                <option 
                  v-for="teacher in availableTeachers" 
                  :key="teacher.id" 
                  :value="teacher.id"
                >
                  {{ teacher.name }}
                </option>
              </select>
              
              <div v-if="classItem.teacherId" class="text-xs text-green-600 dark:text-green-400">
                ✓ Profesor asignado
              </div>
            </div>

            <!-- Students Assignment -->
            <div class="space-y-3">
              <h4 class="text-sm font-medium text-gray-900 dark:text-white flex items-center">
                <UsersIcon class="h-4 w-4 mr-2" />
                Estudiantes ({{ classItem.studentIds?.length || 0 }})
              </h4>
              
              <div class="max-h-32 overflow-y-auto space-y-1 border border-gray-200 dark:border-gray-600 rounded-lg p-2">
                <label 
                  v-for="student in availableStudents" 
                  :key="student.id"
                  class="flex items-center space-x-2 text-sm cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 p-1 rounded"
                >
                  <input
                    type="checkbox"
                    :checked="classItem.studentIds?.includes(student.id) || false"
                    @change="toggleStudent(classItem.id, student.id)"
                    class="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span class="text-gray-700 dark:text-gray-300">{{ student.name }}</span>
                </label>
              </div>
              
              <div class="text-xs text-gray-500 dark:text-gray-400">
                {{ classItem.studentIds?.length || 0 }} estudiante(s) asignado(s)
              </div>
            </div>

            <!-- Schedule Assignment -->
            <div class="space-y-3">
              <h4 class="text-sm font-medium text-gray-900 dark:text-white flex items-center">
                <ClockIcon class="h-4 w-4 mr-2" />
                Horario
              </h4>
              
              <div class="space-y-2">
                <select
                  :value="getScheduleDay(classItem.schedule)"
                  @change="updateScheduleDay(classItem.id, ($event.target as HTMLSelectElement).value)"
                  class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                >
                  <option value="">Seleccionar día...</option>
                  <option value="Lunes">Lunes</option>
                  <option value="Martes">Martes</option>
                  <option value="Miércoles">Miércoles</option>
                  <option value="Jueves">Jueves</option>
                  <option value="Viernes">Viernes</option>
                  <option value="Sábado">Sábado</option>
                </select>
                
                <div class="grid grid-cols-2 gap-2">
                  <input
                    type="time"
                    :value="getScheduleStartTime(classItem.schedule)"
                    @change="updateScheduleStartTime(classItem.id, ($event.target as HTMLInputElement).value)"
                    placeholder="Hora inicio"
                    class="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                  />
                  <input
                    type="time"
                    :value="getScheduleEndTime(classItem.schedule)"
                    @change="updateScheduleEndTime(classItem.id, ($event.target as HTMLInputElement).value)"
                    placeholder="Hora fin"
                    class="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                  />
                </div>
              </div>
              
              <div v-if="classItem.schedule" class="text-xs text-green-600 dark:text-green-400">
                ✓ {{ formatSchedule(classItem.schedule) }}
              </div>
            </div>
          </div>

          <!-- Action Buttons -->
          <div class="flex justify-end space-x-3 pt-4 border-t border-gray-200 dark:border-gray-700">
            <button
              @click="saveAssignments(classItem.id)"
              class="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors flex items-center"
            >
              <CheckIcon class="h-4 w-4 mr-2" />
              Guardar Cambios
            </button>
            
            <button
              @click="resetAssignments(classItem.id)"
              class="px-4 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-600 dark:hover:bg-gray-500 text-gray-700 dark:text-gray-300 rounded-lg font-medium transition-colors flex items-center"
            >
              <ArrowPathIcon class="h-4 w-4 mr-2" />
              Restablecer
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import type { ClassData } from '../types/class';
import {
  AcademicCapIcon,
  UserIcon,
  UsersIcon,
  ClockIcon,
  MusicalNoteIcon,
  ChevronDownIcon,
  CheckIcon,
  ArrowPathIcon
} from '@heroicons/vue/24/outline';

// Mock data - replace with actual stores
const availableTeachers = ref([
  { id: '1', name: 'María González' },
  { id: '2', name: 'Carlos Rodríguez' },
  { id: '3', name: 'Ana Martínez' },
]);

const availableStudents = ref([
  { id: '1', name: 'Juan Pérez' },
  { id: '2', name: 'Laura Jiménez' },
  { id: '3', name: 'Miguel Torres' },
  { id: '4', name: 'Sofia López' },
]);

const props = defineProps<{
  classes: ClassData[];
}>();

const emit = defineEmits<{
  (e: 'update-class', classId: string, updates: Partial<ClassData>): void;
  (e: 'save-assignments', classId: string): void;
}>();

const expandedClasses = ref<string[]>([]);

// Computed stats
const totalClasses = computed(() => props.classes.length);
const classesWithTeacher = computed(() => props.classes.filter(c => c.teacherId).length);
const classesWithStudents = computed(() => props.classes.filter(c => c.studentIds?.length).length);
const classesWithSchedule = computed(() => props.classes.filter(c => c.schedule).length);

// Methods
function toggleExpanded(classId: string) {
  const index = expandedClasses.value.indexOf(classId);
  if (index > -1) {
    expandedClasses.value.splice(index, 1);
  } else {
    expandedClasses.value.push(classId);
  }
}

function assignTeacher(classId: string, teacherId: string) {
  emit('update-class', classId, { teacherId: teacherId || undefined });
}

function toggleStudent(classId: string, studentId: string) {
  const classItem = props.classes.find(c => c.id === classId);
  if (!classItem) return;
  
  const currentStudents = classItem.studentIds || [];
  const index = currentStudents.indexOf(studentId);
  
  let updatedStudents;
  if (index > -1) {
    updatedStudents = currentStudents.filter(id => id !== studentId);
  } else {
    updatedStudents = [...currentStudents, studentId];
  }
  
  emit('update-class', classId, { studentIds: updatedStudents });
}

function getScheduleDay(schedule: any): string {
  return schedule?.day || '';
}

function getScheduleStartTime(schedule: any): string {
  return schedule?.startTime || '';
}

function getScheduleEndTime(schedule: any): string {
  return schedule?.endTime || '';
}

function updateScheduleDay(classId: string, day: string) {
  const classItem = props.classes.find(c => c.id === classId);
  if (!classItem) return;
  
  const schedule = {
    ...classItem.schedule,
    day
  };
  
  emit('update-class', classId, { schedule });
}

function updateScheduleStartTime(classId: string, startTime: string) {
  const classItem = props.classes.find(c => c.id === classId);
  if (!classItem) return;
  
  const schedule = {
    ...classItem.schedule,
    startTime
  };
  
  emit('update-class', classId, { schedule });
}

function updateScheduleEndTime(classId: string, endTime: string) {
  const classItem = props.classes.find(c => c.id === classId);
  if (!classItem) return;
  
  const schedule = {
    ...classItem.schedule,
    endTime
  };
  
  emit('update-class', classId, { schedule });
}

function formatSchedule(schedule: any): string {
  if (!schedule) return 'Sin horario';
  
  if (schedule.day && schedule.startTime && schedule.endTime) {
    return `${schedule.day}: ${schedule.startTime} - ${schedule.endTime}`;
  }
  
  return 'Horario incompleto';
}

function saveAssignments(classId: string) {
  emit('save-assignments', classId);
}

function resetAssignments(classId: string) {
  // Reset to original state
  emit('update-class', classId, {
    teacherId: undefined,
    studentIds: [],
    schedule: undefined
  });
}
</script>

<style scoped>
.class-assignment-manager {
  padding: 1.5rem;
}

/* Status indicator animations */
.w-2.h-2 {
  transition: all 0.3s ease;
}

/* Smooth transitions for expand/collapse */
.rotate-180 {
  transform: rotate(180deg);
}

/* Custom scrollbar for student list */
.overflow-y-auto::-webkit-scrollbar {
  width: 4px;
}

.overflow-y-auto::-webkit-scrollbar-track {
  background: transparent;
}

.overflow-y-auto::-webkit-scrollbar-thumb {
  background: #d1d5db;
  border-radius: 2px;
}

.dark .overflow-y-auto::-webkit-scrollbar-thumb {
  background: #4b5563;
}
</style>
