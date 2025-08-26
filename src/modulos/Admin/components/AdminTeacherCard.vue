<template>
  <div
    class="group bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden hover:shadow-lg hover:border-blue-300 dark:hover:border-blue-600 transition-all duration-300 cursor-pointer transform hover:-translate-y-1"
    @click="handleCardClick"
  >
    <!-- Header with Status Badge -->
    <div class="relative p-6 pb-4">
      <div class="absolute top-4 right-4">
        <span
          :class="[
            'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
            teacher.status === 'active'
              ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
              : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
          ]"
        >
          <div
            :class="[
              'w-1.5 h-1.5 rounded-full mr-1.5',
              teacher.status === 'active' ? 'bg-green-400' : 'bg-red-400',
            ]"
          />
          {{ teacher.status === 'active' ? 'Activo' : 'Inactivo' }}
        </span>
      </div>

      <!-- Teacher Avatar and Basic Info -->
      <div class="flex items-start space-x-4">
        <div class="flex-shrink-0">
          <div
            class="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-xl shadow-lg"
          >
            <img
              v-if="teacher.profileImage"
              :src="teacher.profileImage"
              :alt="teacher.name"
              class="w-16 h-16 rounded-full object-cover"
            />
            <span v-else>{{ getInitials(teacher.name) }}</span>
          </div>
        </div>

        <div class="flex-1 min-w-0">
          <h3
            class="text-lg font-semibold text-gray-900 dark:text-white truncate group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors"
          >
            {{ teacher.name }}
          </h3>
          <p class="text-sm text-gray-600 dark:text-gray-400 mt-1 truncate">
            {{ teacher.email }}
          </p>
          <div class="flex items-center mt-2 space-x-2">
            <span
              class="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300"
            >
              <AcademicCapIcon class="w-3 h-3 mr-1" />
              {{ teacher.experience || 0 }} años
            </span>
            <span
              v-if="teacher.assignedClasses && teacher.assignedClasses.length > 0"
              class="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300"
            >
              <UserGroupIcon class="w-3 h-3 mr-1" />
              {{ teacher.assignedClasses.length }} clases
            </span>
          </div>
        </div>
      </div>
    </div>

    <!-- Specialties Section -->
    <div class="px-6 pb-4">
      <div class="flex flex-wrap gap-1">
        <span
          v-for="specialty in (teacher.specialty || []).slice(0, 3)"
          :key="specialty"
          class="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300"
        >
          <MusicalNoteIcon class="w-3 h-3 mr-1" />
          {{ getSpecialtyName(specialty) }}
        </span>
        <span
          v-if="(teacher.specialty || []).length > 3"
          class="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300"
        >
          +{{ (teacher.specialty || []).length - 3 }} más
        </span>
      </div>
    </div>

    <!-- Stats and Bio Preview -->
    <div class="px-6 pb-4">
      <div class="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3">
        <div class="grid grid-cols-3 gap-3 text-center">
          <div>
            <div class="text-lg font-semibold text-gray-900 dark:text-white">
              {{ teacher.assignedClasses?.length || 0 }}
            </div>
            <div class="text-xs text-gray-600 dark:text-gray-400">Clases</div>
          </div>
          <div>
            <div class="text-lg font-semibold text-gray-900 dark:text-white">
              {{ getTotalStudents() }}
            </div>
            <div class="text-xs text-gray-600 dark:text-gray-400">Estudiantes</div>
          </div>
          <div>
            <div class="text-lg font-semibold text-gray-900 dark:text-white">
              {{ getWeeklyHours() }}h
            </div>
            <div class="text-xs text-gray-600 dark:text-gray-400">Semanales</div>
          </div>
        </div>
      </div>
    </div>

    <!-- Bio Preview -->
    <div v-if="teacher.bio" class="px-6 pb-4">
      <p class="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
        {{ teacher.bio }}
      </p>
    </div>

    <!-- Action Footer -->
    <div
      class="px-6 py-4 bg-gray-50 dark:bg-gray-700/50 border-t border-gray-200 dark:border-gray-600 flex items-center justify-between"
    >
      <div class="flex items-center space-x-2">
        <button
          v-if="permissions.canEdit"
          class="p-2 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
          title="Editar maestro"
          @click.stop="$emit('edit', teacher)"
        >
          <PencilIcon class="w-4 h-4" />
        </button>
        <button
          v-if="permissions.canDelete"
          class="p-2 text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
          title="Eliminar maestro"
          @click.stop="$emit('delete', teacher)"
        >
          <TrashIcon class="w-4 h-4" />
        </button>
      </div>

      <div class="flex items-center space-x-2">
        <button
          class="inline-flex items-center px-3 py-1.5 border border-transparent rounded-md text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 transition-colors"
          @click.stop="handleViewClasses"
        >
          <AcademicCapIcon class="w-3 h-3 mr-1" />
          Clases
        </button>
      </div>
    </div>

    <!-- Hover Effect Overlay -->
    <div
      class="absolute inset-0 bg-gradient-to-r from-blue-500/0 to-purple-500/0 group-hover:from-blue-500/5 group-hover:to-purple-500/5 transition-all duration-300 pointer-events-none"
    />
  </div>
</template>

<script setup lang="ts">
import {
  AcademicCapIcon,
  MusicalNoteIcon,
  UserGroupIcon,
  PencilIcon,
  TrashIcon,
  EyeIcon,
} from '@heroicons/vue/24/outline';

interface ITeacher {
  uid?: string
  id: string
  name: string
  email: string
  phone?: string
  specialty?: string[]
  specialties?: string[]
  experience?: number | string
  status?: string
  bio?: string
  biography?: string
  profileImage?: string
  photoURL?: string
  assignedClasses?: string[]
  classCount?: number
  availableHours?: string[]
  createdAt?: Date
  updatedAt?: Date
  [key: string]: unknown
}

interface IPermissions {
  canView: boolean
  canEdit: boolean
  canDelete: boolean
}

interface ClassData {
  id: string
  name: string
  teacherId?: string
  studentIds?: string[]
  schedule?: {
    slots?: Array<{
      dayOfWeek: number
      startTime: string
      endTime: string
    }>
  }
}

const props = defineProps<{
  teacher: ITeacher
  permissions: IPermissions
  teacherClasses?: ClassData[]
}>();

const emit = defineEmits<{
  view: [teacher: ITeacher]
  edit: [teacher: ITeacher]
  delete: [teacher: ITeacher]
  'view-classes': [teacher: ITeacher]
}>();

const getInitials = (name: string): string => {
  return name
    .split(' ')
    .map((word) => word[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
};

const getSpecialtyName = (specialty: string): string => {
  const specialties: Record<string, string> = {
    piano: 'Piano',
    guitar: 'Guitarra',
    violin: 'Violín',
    drums: 'Batería',
    voice: 'Canto',
    bass: 'Bajo',
    flute: 'Flauta',
    saxophone: 'Saxofón',
    trumpet: 'Trompeta',
    cello: 'Violonchelo',
  };
  return specialties[specialty] || specialty;
};

const handleCardClick = () => {
  handleViewClasses();
};

const getTotalStudents = (): number => {
  if (!props.teacherClasses) return 0;
  
  const uniqueStudents = new Set<string>();
  props.teacherClasses.forEach(cls => {
    cls.studentIds?.forEach(studentId => uniqueStudents.add(studentId));
  });
  
  return uniqueStudents.size;
};

const getWeeklyHours = (): number => {
  if (!props.teacherClasses) return 0;
  
  return props.teacherClasses.reduce((total, cls) => {
    if (!cls.schedule?.slots) return total;
    
    return total + cls.schedule.slots.reduce((classTotal, slot) => {
      const start = new Date(`2000-01-01 ${slot.startTime}`);
      const end = new Date(`2000-01-01 ${slot.endTime}`);
      const hours = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
      return classTotal + (hours > 0 ? hours : 0);
    }, 0);
  }, 0);
};

const handleViewClasses = () => {
  emit('view-classes', props.teacher);
};
</script>

<style scoped>
.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

/* Enhanced hover effects */
.group:hover .transform {
  transform: translateY(-2px);
}

/* Smooth transitions */
* {
  transition-property: all;
  transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
  transition-duration: 200ms;
}

/* Card elevation on hover */
.group:hover {
  box-shadow:
    0 20px 25px -5px rgba(0, 0, 0, 0.1),
    0 10px 10px -5px rgba(0, 0, 0, 0.04);
}

.dark .group:hover {
  box-shadow:
    0 20px 25px -5px rgba(0, 0, 0, 0.3),
    0 10px 10px -5px rgba(0, 0, 0, 0.2);
}

/* Button hover states */
button:hover {
  transform: scale(1.05);
}

/* Avatar gradient variations */
.bg-gradient-to-br:nth-child(4n + 1) {
  background: linear-gradient(to bottom right, #3b82f6, #8b5cf6);
}

.bg-gradient-to-br:nth-child(4n + 2) {
  background: linear-gradient(to bottom right, #10b981, #3b82f6);
}

.bg-gradient-to-br:nth-child(4n + 3) {
  background: linear-gradient(to bottom right, #f59e0b, #ef4444);
}

.bg-gradient-to-br:nth-child(4n + 4) {
  background: linear-gradient(to bottom right, #8b5cf6, #ec4899);
}
</style>
