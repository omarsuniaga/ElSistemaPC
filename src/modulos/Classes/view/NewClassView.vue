<template>
  <div class="max-w-4xl mx-auto px-4 py-8">
    <div class="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
      <h1 class="text-2xl font-bold text-gray-900 dark:text-white mb-6">Nueva Clase</h1>
      
      <div v-if="isLoading" class="flex justify-center my-8">
        <div class="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
      </div>
      
      <div v-else>
        <div v-if="errorMessage" class="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6">
          {{ errorMessage }}
        </div>
        
        <div v-if="successMessage" class="bg-green-100 border-l-4 border-green-500 text-green-700 p-4 mb-6">
          {{ successMessage }}
        </div>
        
        <form class="space-y-6" @submit.prevent="createClass">
          <!-- Información básica -->
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label for="name" class="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Nombre de la Clase *
              </label>
              <input
                id="name"
                v-model="classData.name"
                type="text"
                class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                required
              />
            </div>
            
            <div>
              <label for="teacher" class="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Profesor *
              </label>
              <select
                id="teacher"
                v-model="classData.teacherId"
                class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                required
              >
                <option value="" disabled>Seleccione un profesor</option>
                <option v-for="teacher in teachers" :key="teacher.id" :value="teacher.id">
                  {{ teacher.firstName }} {{ teacher.lastName }}
                </option>
              </select>
            </div>
          </div>
          
          <!-- Descripción -->
          <div>
            <label for="description" class="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Descripción
            </label>
            <textarea
              id="description"
              v-model="classData.description"
              rows="3"
              class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
            ></textarea>
          </div>
          
          <!-- Horario -->
          <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label for="dayOfWeek" class="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Día de la Semana *
              </label>
              <select
                id="dayOfWeek"
                v-model="classData.schedule.dayOfWeek"
                class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                required
              >
                <option v-for="day in 7" :key="day-1" :value="day-1">
                  {{ getDayName(day-1) }}
                </option>
              </select>
            </div>
            
            <div>
              <label for="startTime" class="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Hora de Inicio *
              </label>
              <input
                id="startTime"
                v-model="classData.schedule.startTime"
                type="time"
                class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                required
              />
            </div>
            
            <div>
              <label for="endTime" class="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Hora de Fin *
              </label>
              <input
                id="endTime"
                v-model="classData.schedule.endTime"
                type="time"
                class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                required
              />
            </div>
          </div>
          
          <!-- Ubicación y capacidad -->
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label for="location" class="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Ubicación
              </label>
              <input
                id="location"
                v-model="classData.location"
                type="text"
                class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
              />
            </div>
            
            <div>
              <label for="capacity" class="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Capacidad
              </label>
              <input
                id="capacity"
                v-model.number="classData.capacity"
                type="number"
                min="1"
                class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
              />
            </div>
          </div>
          
          <!-- Estudiantes -->
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Estudiantes *
            </label>
            <div class="max-h-60 overflow-y-auto border border-gray-300 rounded-md p-2">
              <div v-for="student in students" :key="student.id" class="flex items-center p-2 hover:bg-gray-100 dark:hover:bg-gray-700">
                <input
                  :id="`student-${student.id}`"
                  v-model="classData.studentIds"
                  type="checkbox"
                  :value="student.id"
                  class="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                />
                <label :for="`student-${student.id}`" class="ml-2 block text-sm text-gray-900 dark:text-gray-300">
                  {{ student.firstName }} {{ student.lastName }}
                </label>
              </div>
            </div>
          </div>
          
          <!-- Botones de acción -->
          <div class="flex justify-end space-x-4">
            <button
              type="button"
              class="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
              @click="cancelCreation"
            >
              Cancelar
            </button>
            <button
              type="submit"
              :disabled="isLoading"
              class="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
            >
              {{ isLoading ? 'Creando...' : 'Crear Clase' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue';
import { useRouter } from 'vue-router';

import { useStudentsStore } from '../../Students/store';
import { useTeachersStore } from '../../Teachers/store';
import { useClassesStore } from '../store';

const router = useRouter();
const classesStore = useClassesStore();
const teachersStore = useTeachersStore();
const studentsStore = useStudentsStore();

const isLoading = ref(false);
const teachers = ref([]);
const students = ref([]);
const instruments = ref([]);
const errorMessage = ref('');
const successMessage = ref('');

const classData = reactive({
  name: '',
  description: '',
  teacherId: '',
  studentIds: [],
  instrumentId: '',
  schedule: {
    dayOfWeek: 1,
    startTime: '08:00',
    endTime: '09:00',
  },
  location: '',
  capacity: 1,
  isActive: true,
});

onMounted(async () => {
  isLoading.value = true;
  try {
    // Cargar datos necesarios para el formulario
    const [teachersData, studentsData, instrumentsData] = await Promise.all([
      teachersStore.fetchTeachers(),
      studentsStore.fetchStudents(),
      classesStore.fetchInstruments(),
    ]);
    
    teachers.value = teachersData || [];
    students.value = studentsData || [];
    instruments.value = instrumentsData || [];
  } catch (error) {
    console.error('Error al cargar datos:', error);
    errorMessage.value = 'Error al cargar datos necesarios para el formulario';
  } finally {
    isLoading.value = false;
  }
});

const validateForm = () => {
  if (!classData.name) return 'El nombre de la clase es obligatorio';
  if (!classData.teacherId) return 'Debe seleccionar un profesor';
  if (classData.studentIds.length === 0) return 'Debe seleccionar al menos un estudiante';
  if (!classData.schedule.startTime || !classData.schedule.endTime) return 'El horario es obligatorio';
  
  return null;
};

const createClass = async () => {
  const validationError = validateForm();
  if (validationError) {
    errorMessage.value = validationError;
    return;
  }
  
  isLoading.value = true;
  errorMessage.value = '';
  
  try {
    await classesStore.createClass(classData);
    successMessage.value = 'Clase creada exitosamente';
    
    // Redirigir a la lista de clases después de un breve retraso
    setTimeout(() => {
      router.push('/admin/classes');
    }, 1500);
  } catch (error) {
    console.error('Error al crear la clase:', error);
    errorMessage.value = 'Error al crear la clase: ' + (error.message || 'Error desconocido');
  } finally {
    isLoading.value = false;
  }
};

const cancelCreation = () => {
  router.push('/admin/classes');
};

const getDayName = (dayNumber) => {
  const days = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
  return days[dayNumber] || 'Día inválido';
};
</script>

<template>
  <div class="max-w-4xl mx-auto px-4 py-8">
    <div class="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
      <h1 class="text-2xl font-bold text-gray-900 dark:text-white mb-6">Nueva Clase</h1>
      
      <div v-if="isLoading" class="flex justify-center my-8">
        <div class="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
      </div>
      
      <div v-else>
        <div v-if="errorMessage" class="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6">
          {{ errorMessage }}
        </div>
        
        <div v-if="successMessage" class="bg-green-100 border-l-4 border-green-500 text-green-700 p-4 mb-6">
          {{ successMessage }}
        </div>
        
        <form @submit.prevent="createClass" class="space-y-6">
          <!-- Información básica -->
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label for="name" class="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Nombre de la Clase *
              </label>
              <input
                id="name"
                v-model="classData.name"
                type="text"
                class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                required
              />
            </div>
            
            <div>
              <label for="teacher" class="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Profesor *
              </label>
              <select
                id="teacher"
                v-model="classData.teacherId"
                class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                required
              >
                <option value="" disabled>Seleccione un profesor</option>
                <option v-for="teacher in teachers" :key="teacher.id" :value="teacher.id">
                  {{ teacher.firstName }} {{ teacher.lastName }}
                </option>
              </select>
            </div>
          </div>
          
          <!-- Descripción -->
          <div>
            <label for="description" class="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Descripción
            </label>
            <textarea
              id="description"
              v-model="classData.description"
              rows="3"
              class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
            ></textarea>
          </div>
          
          <!-- Horario -->
          <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label for="dayOfWeek" class="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Día de la Semana *
              </label>
              <select
                id="dayOfWeek"
                v-model="classData.schedule.dayOfWeek"
                class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                required
              >
                <option v-for="day in 7" :key="day-1" :value="day-1">
                  {{ getDayName(day-1) }}
                </option>
              </select>
            </div>
            
            <div>
              <label for="startTime" class="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Hora de Inicio *
              </label>
              <input
                id="startTime"
                v-model="classData.schedule.startTime"
                type="time"
                class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                required
              />
            </div>
            
            <div>
              <label for="endTime" class="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Hora de Fin *
              </label>
              <input
                id="endTime"
                v-model="classData.schedule.endTime"
                type="time"
                class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                required
              />
            </div>
          </div>
          
          <!-- Ubicación y capacidad -->
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label for="location" class="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Ubicación
              </label>
              <input
                id="location"
                v-model="classData.location"
                type="text"
                class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
              />
            </div>
            
            <div>
              <label for="capacity" class="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Capacidad
              </label>
              <input
                id="capacity"
                v-model.number="classData.capacity"
                type="number"
                min="1"
                class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
              />
            </div>
          </div>
          
          <!-- Estudiantes -->
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Estudiantes *
            </label>
            <div class="max-h-60 overflow-y-auto border border-gray-300 rounded-md p-2">
              <div v-for="student in students" :key="student.id" class="flex items-center p-2 hover:bg-gray-100 dark:hover:bg-gray-700">
                <input
                  type="checkbox"
                  :id="`student-${student.id}`"
                  :value="student.id"
                  v-model="classData.studentIds"
                  class="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                />
                <label :for="`student-${student.id}`" class="ml-2 block text-sm text-gray-900 dark:text-gray-300">
                  {{ student.firstName }} {{ student.lastName }}
                </label>
              </div>
            </div>
          </div>
          
          <!-- Botones de acción -->
          <div class="flex justify-end space-x-4">
            <button
              type="button"
              @click="cancelCreation"
              class="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
            >
              Cancelar
            </button>
            <button
              type="submit"
              :disabled="isLoading"
              class="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
            >
              {{ isLoading ? 'Creando...' : 'Crear Clase' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>
