<template>
  <div v-if="dialog" class="fixed inset-0 z-50 overflow-y-auto">
    <div class="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
      <!-- Fondo oscuro -->
      <div class="fixed inset-0 transition-opacity" aria-hidden="true">
        <div class="absolute inset-0 bg-gray-500 opacity-75"></div>
      </div>
      
      <!-- Contenido del diálogo -->
      <div class="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full">
        <!-- Encabezado -->
        <div class="bg-blue-600 px-4 py-3 sm:px-6 sm:flex sm:items-center sm:justify-between">
          <h3 class="text-lg font-medium text-white">
            {{ isEditing ? 'Editar Clase' : 'Nueva Clase' }}
          </h3>
          <button @click="closeDialog" class="text-white hover:text-gray-200 focus:outline-none">
            <span class="sr-only">Cerrar</span>
            <svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <!-- Formulario -->
        <form ref="form" @submit.prevent="save" class="p-6 space-y-6">
          <!-- Información Básica -->
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <!-- Nombre de la clase -->
            <div>
              <label for="name" class="block text-sm font-medium text-gray-700">
                Nombre de la clase <span class="text-red-500">*</span>
              </label>
              <input 
                v-model="formData.name" 
                type="text" 
                id="name" 
                class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm" 
                required
              >
            </div>

            <!-- Nivel -->
            <div>
              <label for="level" class="block text-sm font-medium text-gray-700">
                Nivel <span class="text-red-500">*</span>
              </label>
              <select 
                v-model="formData.level" 
                id="level" 
                class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm" 
                required
              >
                <option v-for="level in levels" :key="level" :value="level">
                  {{ level }}
                </option>
              </select>
            </div>

            <!-- Instrumento -->
            <div>
              <label for="instrument" class="block text-sm font-medium text-gray-700">
                Instrumento <span class="text-red-500">*</span>
              </label>
              <select 
                v-model="formData.instrument" 
                id="instrument" 
                class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                required
              >
                <option v-for="instrument in instruments" :key="instrument" :value="instrument">
                  {{ instrument }}
                </option>
              </select>
            </div>

            <!-- Profesor -->
            <div>
              <label for="teacherId" class="block text-sm font-medium text-gray-700">
                Profesor <span class="text-red-500">*</span>
              </label>
              <select 
                v-model="formData.teacherId" 
                id="teacherId" 
                class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                required
              >
                <option 
                  v-for="teacher in availableTeachers" 
                  :key="teacher.id" 
                  :value="teacher.id"
                >
                  {{ teacher.fullName }}
                </option>
              </select>
            </div>

            <!-- Descripción -->
            <div class="md:col-span-2">
              <label for="description" class="block text-sm font-medium text-gray-700">
                Descripción
              </label>
              <textarea 
                v-model="formData.description" 
                id="description" 
                rows="3"
                class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              ></textarea>
            </div>
          </div>

          <!-- Horario de Clases -->
          <div class="border-t border-gray-200 pt-6">
            <h3 class="text-lg font-medium text-gray-900 mb-4">Horario de Clases</h3>
            <p class="text-sm text-gray-500 mb-4">
              Agrega los horarios en los que se impartirá esta clase
            </p>

            <!-- Lista de horarios -->
            <div v-for="(slot, index) in formData.schedule.slots" :key="`slot-${index}`" class="mb-4 p-4 border border-gray-200 rounded-lg">
              <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
                <!-- Día de la semana -->
                <div>
                  <label :for="`day-${index}`" class="block text-sm font-medium text-gray-700">
                    Día <span class="text-red-500">*</span>
                  </label>
                  <select
                    v-model="slot.day"
                    :id="`day-${index}`"
                    class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                    required
                  >
                    <option v-for="day in daysOfWeek" :key="day.value" :value="day.value">
                      {{ day.label }}
                    </option>
                  </select>
                </div>

                <!-- Hora de inicio -->
                <div>
                  <label :for="`start-time-${index}`" class="block text-sm font-medium text-gray-700">
                    Hora inicio <span class="text-red-500">*</span>
                  </label>
                  <input
                    v-model="slot.startTime"
                    type="time"
                    :id="`start-time-${index}`"
                    @change="updateEndTimeMin(index)"
                    class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                    required
                  >
                </div>

                <!-- Hora de fin -->
                <div>
                  <label :for="`end-time-${index}`" class="block text-sm font-medium text-gray-700">
                    Hora fin <span class="text-red-500">*</span>
                  </label>
                  <input
                    v-model="slot.endTime"
                    type="time"
                    :id="`end-time-${index}`"
                    :min="slot.startTime"
                    class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                    required
                  >
                </div>

                <!-- Botón para eliminar horario -->
                <div class="flex items-end">
                  <button
                    v-if="formData.schedule.slots.length > 1"
                    type="button"
                    @click="removeScheduleSlot(index)"
                    class="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-red-700 bg-red-100 hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                    title="Eliminar horario"
                  >
                    <svg class="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                    Eliminar
                  </button>
                </div>
              </div>
            </div>

            <!-- Botón para agregar nuevo horario -->
            <button
              type="button"
              @click="addScheduleSlot"
              class="mt-2 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <svg class="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
              </svg>
              Agregar horario
            </button>
          </div>

          <!-- Lista de Estudiantes -->
          <div class="border-t border-gray-200 pt-6">
            <h3 class="text-lg font-medium text-gray-900 mb-4">Estudiantes</h3>
            
            <!-- Barra de búsqueda -->
            <div class="relative mb-4">
              <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg class="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <input
                v-model="studentSearch"
                type="text"
                class="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                placeholder="Buscar estudiantes..."
              >
            </div>
            
            <!-- Lista de estudiantes -->
            <div class="border border-gray-200 rounded-lg overflow-hidden">
              <ul class="divide-y divide-gray-200 max-h-60 overflow-y-auto">
                <li 
                  v-for="student in filteredStudents" 
                  :key="student.id"
                  @click="toggleStudent(student)"
                  :class="{ 'bg-blue-50': isStudentSelected(student.id) }"
                  class="px-4 py-3 hover:bg-gray-50 cursor-pointer flex items-center"
                >
                  <input
                    type="checkbox"
                    :checked="isStudentSelected(student.id)"
                    class="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded mr-3"
                    @click.stop
                  >
                  <div>
                    <p class="text-sm font-medium text-gray-900">{{ student.fullName }}</p>
                    <p class="text-sm text-gray-500">{{ student.email }}</p>
                  </div>
                </li>
              </ul>
            </div>
          </div>

          <!-- Acciones del formulario -->
          <div class="flex justify-end space-x-3 pt-6 border-t border-gray-200">
            <button
              type="button"
              @click="closeDialog"
              class="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Cancelar
            </button>
            <button
              type="submit"
              :disabled="loading"
              class="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <svg v-if="loading" class="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              {{ loading ? 'Guardando...' : 'Guardar' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue';
import { v4 as uuidv4 } from 'uuid';
import { useTeachersStore } from '@/stores/teachers';
import { useStudentsStore } from '@/stores/students';

// Interfaces
interface ClassScheduleSlot {
  day: string;
  startTime: string;
  endTime: string;
}

interface ClassData {
  id: string;
  name: string;
  level: string;
  instrument: string;
  description: string;
  teacherId: string;
  studentIds: string[];
  schedule: { slots: ClassScheduleSlot[] };
  status: string;
  room: string;
  requirements: string[];
  createdAt?: Date;
  updatedAt?: Date;
}

interface Teacher {
  id: string;
  fullName: string;
  email: string;
  isActive: boolean;
}

interface Student {
  id: string;
  fullName: string;
  email: string;
  instrument: string;
  level: string;
  isActive: boolean;
}

interface TeacherOption extends Teacher {
  name: string;
  isAvailable: boolean;
}

interface StudentOption {
  id: string;
  name: string;
  email: string;
  instrument: string;
  level: string;
  isSelected: boolean;
}

interface ClassFormData extends Omit<ClassData, 'schedule'> {
  schedule: { slots: ClassScheduleSlot[] };
}

const props = defineProps<{
  modelValue: boolean;
  classData?: ClassData;
}>();

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void;
  (e: 'saved', classData: ClassData): void;
}>();

// Constants
const daysOfWeek = [
  { label: 'Lunes', value: 'monday' },
  { label: 'Martes', value: 'tuesday' },
  { label: 'Miércoles', value: 'wednesday' },
  { label: 'Jueves', value: 'thursday' },
  { label: 'Viernes', value: 'friday' },
  { label: 'Sábado', value: 'saturday' },
  { label: 'Domingo', value: 'sunday' }
];

const levels = [
  'Principiante',
  'Intermedio',
  'Avanzado',
  'Profesional'
];

const instruments = [
  'Piano',
  'Guitarra',
  'Violín',
  'Violonchelo',
  'Contrabajo',
  'Flauta',
  'Clarinete',
  'Saxofón',
  'Trompeta',
  'Trombón',
  'Batería',
  'Percusión',
  'Canto',
  'Otro'
];

// Reactive data
const dialog = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
});

const form = ref<HTMLFormElement | null>(null);
const loading = ref(false);
const studentSearch = ref('');
const teacherAvailability = ref<Record<string, { available: boolean; reason?: string }>>({});

// Form data
const formData = ref<ClassFormData>({
  id: '',
  name: '',
  level: '',
  instrument: '',
  description: '',
  teacherId: '',
  studentIds: [],
  schedule: { slots: [{ day: 'monday', startTime: '09:00', endTime: '10:00' }] },
  status: 'active',
  room: '',
  requirements: []
});

// Computed properties
const isEditing = computed(() => !!props.classData?.id);

const availableTeachers = computed<TeacherOption[]>(() => {
  const teachersStore = useTeachersStore();
  return teachersStore.teachers.map(teacher => ({
    ...teacher,
    fullName: `${teacher.nombre} ${teacher.apellido}`.trim(),
    isAvailable: isTeacherAvailable(teacher.id)
  }));
});

const availableStudents = computed<StudentOption[]>(() => {
  const studentsStore = useStudentsStore();
  return studentsStore.students.map(student => ({
    ...student,
    fullName: `${student.nombre} ${student.apellido}`.trim(),
    instrument: student.instrumento || '',
    level: student.nivel || '',
    isSelected: formData.value.studentIds.includes(student.id)
  }));
});

const filteredStudents = computed<StudentOption[]>(() => {
  if (!studentSearch.value.trim()) return availableStudents.value;
  
  const query = studentSearch.value.toLowerCase().trim();
  return availableStudents.value.filter(student => 
    student.fullName.toLowerCase().includes(query) ||
    student.email?.toLowerCase().includes(query) ||
    student.instrument.toLowerCase().includes(query) ||
    (student.level && student.level.toLowerCase().includes(query))
  );
});

const selectedStudents = computed<StudentOption[]>(() => {
  return availableStudents.value.filter(student => 
    formData.value.studentIds.includes(student.id)
  );
});

const hasScheduleError = computed<boolean>(() => {
  return formData.value.schedule.some(slot => {
    if (!slot.startTime || !slot.endTime) return false;
    const start = new Date(`1970/01/01 ${slot.startTime}`);
    const end = new Date(`1970/01/01 ${slot.endTime}`);
    return start >= end;
  });
});

const isFormValid = computed<boolean>(() => {
  return (
    formData.value.name.trim() !== '' &&
    formData.value.level.trim() !== '' &&
    formData.value.instrument.trim() !== '' &&
    formData.value.teacherId.trim() !== '' &&
    !hasScheduleError.value &&
    formData.value.schedule.length > 0
  );
});

// Methods
const isTeacherAvailable = (teacherId: string): boolean => {
  return teacherAvailability.value[teacherId]?.available !== false;
};

const toggleStudent = (student: StudentOption) => {
  const index = formData.value.studentIds.indexOf(student.id);
  if (index === -1) {
    formData.value.studentIds.push(student.id);
  } else {
    formData.value.studentIds.splice(index, 1);
  }
};

const isStudentSelected = (studentId: string): boolean => {
  return formData.value.studentIds.includes(studentId);
};

const addScheduleSlot = () => {
  formData.value.schedule.slots.push({
    day: 'monday',
    startTime: '09:00',
    endTime: '10:00'
  });
};

const removeScheduleSlot = (index: number) => {
  if (formData.value.schedule.slots.length > 1) {
    formData.value.schedule.slots.splice(index, 1);
  }
};

const updateEndTimeMin = (index: number) => {
  const slot = formData.value.schedule.slots[index];
  if (slot.startTime >= slot.endTime) {
    // Add 30 minutes to start time
    const [hours, minutes] = slot.startTime.split(':').map(Number);
    const date = new Date();
    date.setHours(hours, minutes + 30, 0, 0);
    
    // Format as HH:MM
    const newEndTime = `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
    slot.endTime = newEndTime;
  }
};

const save = async () => {
  if (!form.value?.checkValidity()) {
    form.value?.reportValidity();
    return;
  }

  try {
    loading.value = true;
    
    const classData: ClassData = {
      ...formData.value,
      updatedAt: new Date(),
      schedule: formData.value.schedule
    };

    // Save to store or API
    if (isEditing.value) {
      // Update existing class
      // await classesStore.updateClass(classData);
      console.log('Updating class:', classData);
    } else {
      // Create new class
      classData.createdAt = new Date();
      // await classesStore.createClass(classData);
      console.log('Creating class:', classData);
    }

    // Emit saved event
    emit('saved', classData);
    
    // Close dialog
    close();
  } catch (error) {
    console.error('Error saving class:', error);
    // Show error message
  } finally {
    loading.value = false;
  }
};

const initForm = () => {
  if (props.classData) {
    // Editing existing class
    formData.value = {
      ...props.classData,
      schedule: props.classData.schedule || { slots: [] },
      room: props.classData.room || '',
      requirements: props.classData.requirements || []
    };
  } else {
    // New class
    formData.value = {
      id: uuidv4(),
      name: '',
      level: '',
      instrument: '',
      description: '',
      teacherId: '',
      studentIds: [],
      schedule: {
        slots: [
          { day: 'monday', startTime: '09:00', endTime: '10:00' }
        ]
      },
      status: 'active',
      room: '',
      requirements: []
    };
  }
  
  // Reset student search
  studentSearch.value = '';
  
  // Load teacher availability
  checkTeacherAvailability();
};

watch(dialog, (isOpen) => {
  if (isOpen) {
    initForm();
  }
});

const close = () => {
  dialog.value = false;
};

const closeDialog = () => {
  close();
};

onMounted(async () => {
  try {
    const [teachersStore, studentsStore] = [useTeachersStore(), useStudentsStore()];
    await Promise.all([
      teachersStore.fetchTeachers(),
      studentsStore.fetchStudents()
    ]);
    initForm();
  } catch (error) {
    console.error('Error loading data:', error);
  }
});
</script>

<style scoped>
.bg-blue-50 {
  background-color: #eff6ff;
}

/* Component styles */
.fixed {
  position: fixed;
}

.inset-0 {
  top: 0;
  right: 0;
  bottom: 0;
  left: 0;
}

.z-50 {
  z-index: 50;
}

.overflow-y-auto {
  overflow-y: auto;
}
</style>
