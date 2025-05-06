<script setup lang="ts">
import { computed, ref, PropType } from 'vue';
import KpiCard from './KpiCard.vue';

interface Teacher {
  id?: string | number;
  photoURL?: string;
  nombre?: string;
  apellido?: string;
  email?: string;
  phone?: string;
  instrument?: string;
  classes?: Array<{
    name: string;
    time?: string;
  }>;
}

const props = defineProps({
  activeTeachers: {
    type: Number,
    required: true
  },
  teacherAttendancePercentage: {
    type: Number,
    required: true
  },
  totalTeachers: {
    type: Number,
    default: 0
  },
  activeTeachersData: {
    type: Array as PropType<Teacher[]>,
    default: () => []
  }
});

// State for modal
const showModal = ref(false);
const selectedTeacher = ref(null);

// Determine color based on percentage
const attendanceColor = computed(() => {
  if (props.teacherAttendancePercentage >= 90) return 'green';
  if (props.teacherAttendancePercentage >= 70) return 'blue';
  if (props.teacherAttendancePercentage >= 50) return 'yellow';
  return 'red';
});

// Calculate how many avatars to show directly
const visibleAvatars = computed(() => {
  return props.activeTeachersData.slice(0, 5); // Show first 5 teachers
});

// Calculate if there are more teachers to show
const hasMoreTeachers = computed(() => {
  return props.activeTeachersData.length > 5;
});

// Calculate how many more teachers there are
const moreTeachersCount = computed(() => {
  return props.activeTeachersData.length - 5;
});

const totalTeachersDisplay = computed(() => {
  return props.totalTeachers || props.activeTeachers;
});

// Open modal with teacher details
const openTeacherModal = (teacher) => {
  selectedTeacher.value = teacher;
  showModal.value = true;
};

// Open modal with all teachers
const viewAllTeachers = () => {
  selectedTeacher.value = null;
  showModal.value = true;
};
</script>

<template>
  <KpiCard
    title="Maestros activos"
    :value="activeTeachers"
    icon="users"
    color="indigo"
    cardId="teachers-kpi"
  >
    <!-- Teacher attendance rate -->
    <div class="mb-3">
      <div class="flex justify-between text-xs mb-1">
        <span class="font-medium text-gray-700 dark:text-gray-300">Asistencia</span>
        <span class="font-bold" :class="`text-${attendanceColor}-600 dark:text-${attendanceColor}-400`">
          {{ teacherAttendancePercentage }}%
        </span>
      </div>
      <div class="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
        <div 
          :class="`bg-${attendanceColor}-600 dark:bg-${attendanceColor}-500`"
          class="h-1.5 rounded-full transition-all duration-500" 
          :style="`width: ${teacherAttendancePercentage}%`"
        ></div>
      </div>
      <div class="text-xs text-gray-600 dark:text-gray-400 mt-1 flex justify-between">
        <span>{{ activeTeachers }} presentes</span>
        <span>de {{ totalTeachersDisplay }} docentes</span>
      </div>
    </div>

    <!-- Active Teachers Avatars -->
    <div class="mt-4 border-t border-gray-200 dark:border-gray-700 pt-3">
      <div class="flex items-center justify-between">
        <h4 class="text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">Maestros activos hoy</h4>
        <button 
          v-if="activeTeachersData.length > 0"
          @click="viewAllTeachers" 
          class="text-xs text-indigo-600 dark:text-indigo-400 hover:underline"
        >
          Ver todos
        </button>
      </div>
      
      <!-- Teacher avatars display -->
      <div v-if="activeTeachersData.length > 0" class="flex items-center mt-1 relative">
        <!-- Individual Avatars -->
        <div class="flex -space-x-2 overflow-hidden">
          <div 
            v-for="(teacher, index) in visibleAvatars" 
            :key="teacher.id || index"
            @click="openTeacherModal(teacher)"
            class="teacher-avatar inline-block h-8 w-8 rounded-full ring-2 ring-white dark:ring-gray-800 cursor-pointer hover:scale-110 transition-transform"
            :class="[`z-${30 - index}`]"
          >
            <img 
              v-if="teacher.avatar  || teacher.photoURL" 
              :src="teacher.avatar || teacher.photoURL" 
              :alt="`${teacher.nombre || 'Maestro'}`"
              class="h-full w-full object-cover rounded-full" 
            />
            <div v-else class="h-full w-full bg-indigo-500 flex items-center justify-center text-white font-bold">
              {{ (teacher.nombre || '').charAt(0) }}{{ (teacher.apellido || '').charAt(0) }}
            </div>
          </div>
          
          <!-- More indicator if needed -->
          <div 
            v-if="hasMoreTeachers"
            @click="viewAllTeachers"
            class="inline-block h-8 w-8 rounded-full ring-2 ring-white dark:ring-gray-800 bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-xs font-medium text-gray-700 dark:text-gray-300 cursor-pointer z-0 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
          >
            +{{ moreTeachersCount }}
          </div>
        </div>
      </div>
      
      <!-- No teachers message -->
      <div v-else class="text-xs text-gray-500 dark:text-gray-400 italic">
        No hay maestros activos para mostrar
      </div>
    </div>

    <!-- Modal for showing teacher details -->
    <div v-if="showModal" class="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div class="bg-white dark:bg-gray-800 rounded-lg max-w-lg w-full max-h-[80vh] overflow-y-auto">
        <!-- Modal header -->
        <div class="flex justify-between items-center p-4 border-b border-gray-200 dark:border-gray-700">
          <h3 class="text-lg font-medium text-gray-900 dark:text-white">
            {{ selectedTeacher ? `${selectedTeacher.nombre} ${selectedTeacher.apellido || ''}` : 'Maestros Activos' }}
          </h3>
          <button 
            @click="showModal = false"
            class="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
          >
            <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        <!-- Modal content -->
        <div class="p-4">
          <!-- Single teacher details -->
          <div v-if="selectedTeacher" class="flex flex-col items-center">
            <div class="h-24 w-24 rounded-full overflow-hidden mb-3">
              <img 
                v-if="selectedTeacher.photoURL" 
                :src="selectedTeacher.photoURL" 
                :alt="`${selectedTeacher.nombre || 'Maestro'}`"
                class="h-full w-full object-cover" 
              />
              <div v-else class="h-full w-full bg-indigo-500 flex items-center justify-center text-white text-2xl font-bold">
                {{ (selectedTeacher.nombre || '').charAt(0) }}{{ (selectedTeacher.apellido || '').charAt(0) }}
              </div>
            </div>
            
            <h4 class="text-xl font-bold text-gray-900 dark:text-white">
              {{ selectedTeacher.nombre }} {{ selectedTeacher.apellido || '' }}
            </h4>
            
            <p v-if="selectedTeacher.email" class="text-gray-600 dark:text-gray-400 mb-2">
              {{ selectedTeacher.email }}
            </p>
            
            <p v-if="selectedTeacher.phone" class="text-gray-600 dark:text-gray-400 mb-2">
              {{ selectedTeacher.phone }}
            </p>
            
            <p v-if="selectedTeacher.instrument" class="font-medium text-gray-800 dark:text-gray-200 mb-3">
              Especialidad: {{ selectedTeacher.instrument }}
            </p>
            
            <div v-if="selectedTeacher.classes" class="w-full mt-3">
              <h5 class="font-medium text-gray-800 dark:text-gray-200 mb-2">Clases:</h5>
              <ul class="list-disc pl-5 text-gray-600 dark:text-gray-400">
                <li v-for="(clase, index) in selectedTeacher.classes" :key="index">
                  {{ clase.name }} ({{ clase.time || 'Sin horario' }})
                </li>
              </ul>
            </div>
          </div>
          
          <!-- All teachers list -->
          <div v-else>
            <ul class="divide-y divide-gray-200 dark:divide-gray-700">
              <li 
                v-for="(teacher, index) in activeTeachersData" 
                :key="teacher.id || index"
                @click="openTeacherModal(teacher)"
                class="py-3 flex items-center hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer rounded-lg px-2"
              >
                <!-- Teacher avatar -->
                <div class="h-10 w-10 rounded-full overflow-hidden mr-3 flex-shrink-0">
                  <img 
                    v-if="teacher.photoURL" 
                    :src="teacher.photoURL" 
                    :alt="`${teacher.nombre || 'Maestro'}`"
                    class="h-full w-full object-cover" 
                  />
                  <div v-else class="h-full w-full bg-indigo-500 flex items-center justify-center text-white font-bold">
                    {{ (teacher.nombre || '').charAt(0) }}{{ (teacher.apellido || '').charAt(0) }}
                  </div>
                </div>
                
                <!-- Teacher info -->
                <div class="flex-1 min-w-0">
                  <p class="text-sm font-medium text-gray-900 dark:text-white truncate">
                    {{ teacher.nombre }} {{ teacher.apellido || '' }}
                  </p>
                  <p v-if="teacher.instrument" class="text-xs text-gray-500 dark:text-gray-400 truncate">
                    {{ teacher.instrument }}
                  </p>
                </div>
                
                <!-- Arrow indicator -->
                <div class="text-gray-400">
                  <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </li>
            </ul>
          </div>
        </div>
        
        <!-- Modal footer -->
        <div class="border-t border-gray-200 dark:border-gray-700 p-4 flex justify-end">
          <button 
            @click="showModal = false"
            class="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-white rounded-md hover:bg-gray-300 dark:hover:bg-gray-600"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  </KpiCard>
</template>

<style scoped>
.teacher-avatar:hover {
  z-index: 40 !important;
}
</style>
