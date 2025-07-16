<template>
  <div class="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
    <div
      class="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-3xl max-h-[90vh] overflow-auto"
    >
      <div class="p-6">
        <div class="flex justify-between items-center mb-6">
          <h2 class="text-xl font-bold text-gray-900 dark:text-white">
            {{ props.editMode ? "Editar Horario" : "Nuevo Horario" }}
          </h2>
          <button
            class="text-gray-400 hover:text-gray-500 focus:outline-none"
            @click="emit('close')"
          >
            <span class="sr-only">Cerrar</span>
            <svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        <!-- Mode switch tabs -->
        <div class="mb-6 border-b border-gray-200 dark:border-gray-700">
          <div class="flex">
            <button
              class="py-2 px-4 font-medium text-sm focus:outline-none"
              :class="
                mode === 'schedule'
                  ? 'text-indigo-600 border-b-2 border-indigo-600'
                  : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'
              "
              @click="mode = 'schedule'"
            >
              Programar Clase Existente
            </button>
            <button
              class="py-2 px-4 font-medium text-sm focus:outline-none"
              :class="
                mode === 'class'
                  ? 'text-indigo-600 border-b-2 border-indigo-600'
                  : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'
              "
              @click="mode = 'class'"
            >
              Crear Nueva Clase
            </button>
          </div>
        </div>

        <!-- Schedule Entry Form -->
        <form v-if="mode === 'schedule'" class="space-y-6" @submit.prevent="handleSubmit">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <!-- Class selection -->
            <div>
              <label
                for="class"
                class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
              >
                Clase
              </label>
              <select
                id="class"
                v-model="formData.classId"
                class="block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                :class="{'border-red-500': errors.classId}"
              >
                <option value="">Seleccione una clase</option>
                <option v-for="class_ in classesStore.classes" :key="class_.id" :value="class_.id">
                  {{ class_.name }} ({{ class_.level }})
                </option>
              </select>
              <p v-if="errors.classId" class="mt-1 text-sm text-red-600">{{ errors.classId }}</p>
            </div>

            <!-- Teacher selection -->
            <div>
              <label
                for="teacher"
                class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
              >
                Profesor
              </label>
              <select
                id="teacher"
                v-model="formData.teacherId"
                class="block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                :class="{'border-red-500': errors.teacherId}"
              >
                <option value="">Seleccione un profesor</option>
                <option
                  v-for="teacher in teachersStore.teachers"
                  :key="teacher.id"
                  :value="teacher.id"
                >
                  {{ teacher.name }}
                </option>
              </select>
              <p v-if="errors.teacherId" class="mt-1 text-sm text-red-600">
                {{ errors.teacherId }}
              </p>
            </div>

            <!-- Day selection -->
            <div>
              <label
                for="dayOfWeek"
                class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
              >
                Día de la semana
              </label>
              <select
                id="dayOfWeek"
                v-model="formData.dayOfWeek"
                class="block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                :class="{'border-red-500': errors.schedule}"
              >
                <option value="">Seleccione un día</option>
                <option v-for="day in daysOfWeek" :key="day" :value="day">
                  {{ day }}
                </option>
              </select>
              <p v-if="errors.schedule" class="mt-1 text-sm text-red-600">{{ errors.schedule }}</p>
            </div>

            <!-- Classroom selection -->
            <div>
              <label
                for="classroom"
                class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
              >
                Aula
              </label>
              <select
                id="classroom"
                v-model="formData.classroom"
                class="block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                :class="{'border-red-500': errors.classroom}"
              >
                <option value="">Seleccione un aula</option>
                <option v-for="room in availableClassrooms" :key="room" :value="room">
                  {{ room }}
                </option>
              </select>
              <p v-if="errors.classroom" class="mt-1 text-sm text-red-600">
                {{ errors.classroom }}
              </p>
            </div>

            <!-- Time selection -->
            <div>
              <label
                for="startTime"
                class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
              >
                Hora de inicio
              </label>
              <select
                id="startTime"
                v-model="formData.startTime"
                class="block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="">Seleccione hora</option>
                <option v-for="time in timeSlots" :key="time" :value="time">
                  {{ time }}
                </option>
              </select>
            </div>

            <div>
              <label
                for="endTime"
                class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
              >
                Hora de finalización
              </label>
              <select
                id="endTime"
                v-model="formData.endTime"
                class="block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="">Seleccione hora</option>
                <option v-for="time in timeSlots" :key="time" :value="time">
                  {{ time }}
                </option>
              </select>
            </div>
          </div>

          <!-- Student selection -->
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Alumnos ({{ selectedStudents.length }} seleccionados)
            </label>
            <div class="mb-2">
              <input
                v-model="searchTerm"
                type="text"
                placeholder="Buscar alumnos..."
                class="block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
            <div
              class="border border-gray-300 dark:border-gray-600 rounded-md max-h-60 overflow-y-auto p-2"
            >
              <div
                v-for="student in filteredStudents"
                :key="student.id"
                class="flex items-center p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md cursor-pointer"
                @click="toggleStudent(student.id)"
              >
                <input
                  type="checkbox"
                  :checked="selectedStudents.includes(student.id)"
                  class="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                  @click.stop
                />
                <span class="ml-2">{{ student.nombre }} {{ student.apellido }}</span>
              </div>
              <div v-if="filteredStudents.length === 0" class="p-2 text-gray-500 text-center">
                No se encontraron resultados
              </div>
              <div v-if="studentsStore.students.length === 0" class="p-2 text-gray-500 text-center">
                No hay estudiantes registrados en el sistema
              </div>
            </div>
          </div>

          <div v-if="mode === 'schedule'" class="space-y-4">
            <div class="border-t pt-4 mt-4">
              <h3 class="text-lg font-medium mb-2">Horarios múltiples</h3>

              <!-- Lista de horarios agregados -->
              <div v-if="formData.schedules.length > 0" class="mb-4">
                <h4 class="text-sm font-medium mb-2">Horarios programados:</h4>
                <div class="space-y-2">
                  <div
                    v-for="(schedule, index) in formData.schedules"
                    :key="index"
                    class="flex items-center justify-between bg-gray-50 dark:bg-gray-700 p-2 rounded"
                  >
                    <span
                      >{{ schedule.day }} - {{ schedule.startTime }} a {{ schedule.endTime }}</span
                    >
                    <button
                      type="button"
                      class="text-red-600 hover:text-red-800"
                      @click="removeSchedule(index)"
                    >
                      <i class="fas fa-times" />
                    </button>
                  </div>
                </div>
              </div>

              <!-- Botón para agregar horario actual -->
              <button
                type="button"
                :disabled="!formData.dayOfWeek || !formData.startTime || !formData.endTime"
                class="mt-2 px-4 py-2 bg-green-600 text-white rounded-md disabled:bg-gray-400"
                @click="addSchedule"
              >
                <i class="fas fa-plus mr-2" />
                Agregar horario
              </button>
            </div>
          </div>

          <div class="flex justify-end space-x-3">
            <button
              type="button"
              class="px-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              @click="emit('close')"
            >
              Cancelar
            </button>
            <button
              type="submit"
              class="px-4 py-2 bg-indigo-600 border border-transparent rounded-md shadow-sm text-sm font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              :disabled="isSubmitting"
            >
              {{ props.editMode ? "Actualizar" : "Crear" }} Horario
            </button>
          </div>
        </form>

        <!-- New Class Form -->
        <form v-else class="space-y-6" @submit.prevent="handleSubmit">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <!-- Class name -->
            <div>
              <label
                for="className"
                class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
              >
                Nombre de la clase
              </label>
              <input
                id="className"
                v-model="newClassData.name"
                type="text"
                class="block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                :class="{'border-red-500': errors.name}"
              />
              <p v-if="errors.name" class="mt-1 text-sm text-red-600">{{ errors.name }}</p>
            </div>

            <!-- Level selection -->
            <div>
              <label
                for="level"
                class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
              >
                Nivel
              </label>
              <select
                id="level"
                v-model="newClassData.level"
                class="block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                :class="{'border-red-500': errors.level}"
              >
                <option v-for="level in levels" :key="level" :value="level">
                  {{ level }}
                </option>
              </select>
              <p v-if="errors.level" class="mt-1 text-sm text-red-600">{{ errors.level }}</p>
            </div>

            <!-- Instrument selection - Updated to use store and show categories -->
            <div>
              <label
                for="instrument"
                class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
              >
                Instrumento
              </label>
              <select
                id="instrument"
                v-model="newClassData.instrument"
                class="block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                :class="{'border-red-500': errors.instrument}"
              >
                <option value="">Seleccione un instrumento</option>
                <optgroup
                  v-for="(family, index) in instrumentoStore.getInstrumentFamilies()"
                  :key="index"
                  :label="family.familia"
                >
                  <option
                    v-for="instrument in instrumentoStore.getInstrumentsByFamily(family.id)"
                    :key="instrument.id"
                    :value="instrument.nombre"
                  >
                    {{ instrument.nombre }}
                  </option>
                </optgroup>
              </select>
              <p v-if="errors.instrument" class="mt-1 text-sm text-red-600">
                {{ errors.instrument }}
              </p>
            </div>

            <!-- Description -->
            <div class="md:col-span-2">
              <label
                for="description"
                class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
              >
                Descripción
              </label>
              <textarea
                id="description"
                v-model="newClassData.description"
                rows="3"
                class="block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
          </div>

          <!-- Add a note about Firestore storage -->
          <div v-if="mode === 'class'" class="text-sm text-gray-500 dark:text-gray-400 mb-4">
            <p>
              <i class="fas fa-info-circle mr-1" /> La clase será guardada en la base de datos y
              estará disponible para programar horarios.
            </p>
          </div>

          <div class="flex justify-end space-x-3">
            <button
              type="button"
              class="px-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              @click="emit('close')"
            >
              Cancelar
            </button>
            <button
              type="submit"
              class="px-4 py-2 bg-indigo-600 border border-transparent rounded-md shadow-sm text-sm font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              :disabled="isSubmitting"
            >
              Crear Clase
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue';
import { useTeachersStore } from '../../Teachers/store/teachers';
import { useClassesStore } from '../../Classes/store/classes';
import { useStudentsStore } from '../../Students/store/students';
import { useInstrumentoStore } from '../../Instruments/store/instrumento';
import { format, parse, isAfter } from 'date-fns';
import { es } from 'date-fns/locale';

const props = defineProps({
  editMode: {
    type: Boolean,
    default: false,
  },
  initialData: {
    type: Object,
    default: () => ({}),
  },
});

const emit = defineEmits(['close', 'save']);

const teachersStore = useTeachersStore();
const classesStore = useClassesStore();
const studentsStore = useStudentsStore();
const instrumentoStore = useInstrumentoStore();

// Form mode state
const mode = ref('schedule');
const isSubmitting = ref(false);

// Form data for scheduling
const formData = ref({
  id: props.initialData.id || '',
  classId: props.initialData.classId || '',
  teacherId: props.initialData.teacherId || '',
  studentIds: props.initialData?.studentIds ? [...props.initialData.studentIds] : [],
  schedule: props.initialData.schedule || '',
  classroom: props.initialData.classroom || '',
  dayOfWeek: '',
  startTime: '',
  endTime: '',
  schedules: [] as Array<{day: string; startTime: string; endTime: string}>,
});

// Form data for new class
const newClassData = ref({
  name: '',
  level: '',
  instrument: '',
  description: '',
});

// Computed properties
const availableClassrooms = computed(() => [
  'Aula 101',
  'Aula 102',
  'Aula 103',
  'Sala de Piano',
  'Sala de Percusión',
  'Estudio A',
  'Estudio B',
]);

const daysOfWeek = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
const timeSlots = generateTimeSlots();

// Validation
const errors = ref({
  classId: '',
  teacherId: '',
  studentIds: '',
  schedule: '',
  classroom: '',
  name: '',
  level: '',
  instrument: '',
});

const instrumentCategories = computed(() => ['Cuerda', 'Viento', 'Percusión', 'Otros']);

// Selected students management
const selectedStudents = ref(props.initialData?.studentIds || []);
const searchTerm = ref('');

const filteredStudents = computed(() => {
  if (!searchTerm.value) return studentsStore.students;
  const term = searchTerm.value.toLowerCase();
  return studentsStore.students.filter((student) => {
    const fullName = `${student.nombre || ''} ${student.apellido || ''}`.toLowerCase();
    return fullName.includes(term);
  });
});

// Time slot generation
function generateTimeSlots(interval: number = 30) {
  const slots = [];
  for (let hour = 7; hour <= 21; hour++) {
    for (let minute = 0; minute < 60; minute += interval) {
      const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
      slots.push(timeString);
    }
  }
  return slots;
}

// Schedule validation
function validateSchedule(schedule: any) {
  const errors = [];

  if (!schedule.day) {
    errors.push('El día es requerido');
  }

  if (!schedule.startTime || !schedule.endTime) {
    errors.push('Las horas de inicio y fin son requeridas');
    return errors;
  }

  const start = parse(schedule.startTime, 'HH:mm', new Date());
  const end = parse(schedule.endTime, 'HH:mm', new Date());

  if (isAfter(start, end)) {
    errors.push('La hora de inicio debe ser anterior a la hora de fin');
  }

  return errors;
}

// Form submission
const handleSubmit = async () => {
  try {
    isSubmitting.value = true;
    errors.value = {
      classId: '',
      teacherId: '',
      studentIds: '',
      schedule: '',
      classroom: '',
      name: '',
      level: '',
      instrument: '',
    };
    let isValid = true;

    // Validación básica
    if (mode.value === 'schedule') {
      if (!formData.value.classId) {
        errors.value.classId = 'Seleccione una clase';
        isValid = false;
      }
      if (!formData.value.teacherId) {
        errors.value.teacherId = 'Seleccione un profesor';
        isValid = false;
      }
      if (!formData.value.classroom) {
        errors.value.classroom = 'Seleccione un aula';
        isValid = false;
      }
      if (formData.value.schedules.length === 0) {
        errors.value.schedule = 'Agregue al menos un horario';
        isValid = false;
      }
    }

    // Validación de horarios
    const scheduleErrors = formData.value.schedules.flatMap(validateSchedule);
    if (scheduleErrors.length > 0) {
      errors.value.schedule = scheduleErrors.join(', ');
      isValid = false;
    }

    if (!isValid) return;

    // Formatear datos para guardar
    const dataToSave = {
      type: mode.value,
      data: {
        ...formData.value,
        schedule: formatScheduleForSave(formData.value.schedules),
      },
    };

    emit('save', dataToSave);
  } catch (error: any) {
    console.error('Error en el formulario:', error);
    errors.value.schedule = error.message;
  } finally {
    isSubmitting.value = false;
  }
};

// Schedule formatting
function formatScheduleForSave(
  schedules: Array<{day: string; startTime: string; endTime: string}>,
) {
  if (schedules.length === 1) {
    const schedule = schedules[0];
    return `${schedule.day} ${schedule.startTime} - ${schedule.endTime}`;
  }

  return {
    days: [...new Set(schedules.map((s) => s.day))],
    times: schedules.map((s) => ({
      day: s.day,
      startTime: s.startTime,
      endTime: s.endTime,
    })),
  };
}

// Schedule management
const addSchedule = () => {
  const scheduleErrors = validateSchedule({
    day: formData.value.dayOfWeek,
    startTime: formData.value.startTime,
    endTime: formData.value.endTime,
  });

  if (scheduleErrors.length > 0) {
    errors.value.schedule = scheduleErrors.join(', ');
    return;
  }

  formData.value.schedules.push({
    day: formData.value.dayOfWeek,
    startTime: formData.value.startTime,
    endTime: formData.value.endTime,
  });

  // Limpiar campos
  formData.value.dayOfWeek = '';
  formData.value.startTime = '';
  formData.value.endTime = '';
  errors.value.schedule = '';
};

const removeSchedule = (index: number) => {
  formData.value.schedules.splice(index, 1);
};

const toggleStudent = (studentId: string) => {
  const index = selectedStudents.value.indexOf(studentId);
  if (index === -1) {
    selectedStudents.value.push(studentId);
  } else {
    selectedStudents.value.splice(index, 1);
  }
  formData.value.studentIds = [...selectedStudents.value];
};

// Initialization
onMounted(() => {
  if (props.initialData?.schedule) {
    const schedule = props.initialData.schedule;
    if (typeof schedule === 'string') {
      const [day, startTime, , endTime] = schedule.split(' ');
      formData.value.schedules = [
        {
          day,
          startTime,
          endTime: endTime || '',
        },
      ];
    } else if (schedule.times) {
      formData.value.schedules = schedule.times;
    }
  }
});
</script>
