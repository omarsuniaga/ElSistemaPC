<script setup lang="ts">
import { ref, computed } from 'vue';
import { useTeachersStore } from '../stores/teachers';
import { useInstrumentoStore } from '../stores/instrumento';
import type { Class } from '../types/class';
import { ChevronDownIcon, CheckIcon } from '@heroicons/vue/24/solid';

// Types para validación
interface FormErrors {
  name?: string;
  teacherId?: string;
  level?: string;
  instrument?: string;
  schedule?: string;
}

const props = defineProps<{
  initialData?: Partial<Class>;
  isLoading?: boolean;
}>();

const emit = defineEmits<{
  (e: 'submit', data: Partial<Class>): void;
  (e: 'cancel'): void;
}>();

// Stores
const teachersStore = useTeachersStore();
const instrumentoStore = useInstrumentoStore();

// Constantes
const weekDays = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
const levelOptions = ['Iniciación', 'Básico', 'Intermedio', 'Avanzado'];

// Datos del formulario
const formData = ref<Partial<Class>>({
  name: '',
  teacherId: '',
  studentIds: [],
  level: '',
  instrument: '',
  schedule: {
    days: [],
    startTime: '',
    endTime: ''
  },
  description: '',
  ...props.initialData
});

// Ensure schedule is always defined
if (!formData.value.schedule) {
  formData.value.schedule = { days: [], startTime: '', endTime: '' };
}

// Gestión de errores de validación
const formErrors = ref<FormErrors>({});

// UI state
const daySelectOpen = ref(false);
const selectedDaysText = computed(() => {
  if (!formData.value.schedule?.days?.length) return 'Seleccionar días';
  if (formData.value.schedule.days.length === 1) return formData.value.schedule.days[0];
  return `${formData.value.schedule.days.length} días seleccionados`;
});

// Computed properties
const instrumentsByFamily = computed(() => instrumentoStore.instrumentsByFamily);
const teachers = computed(() => teachersStore.teachers);

// Métodos para trabajar con días
const toggleDay = (day: string) => {
  const days = formData.value.schedule?.days || [];
  const index = days.indexOf(day);
  if (index === -1) {
    days.push(day);
  } else {
    days.splice(index, 1);
  }
  if (!formData.value.schedule) formData.value.schedule = { days, startTime: '', endTime: '' };
  else formData.value.schedule.days = days;
};

const isDaySelected = (day: string) => {
  return formData.value.schedule?.days?.includes(day) || false;
};

// Validación del formulario
const validateForm = (): boolean => {
  formErrors.value = {};
  let isValid = true;
  
  if (!formData.value.name?.trim()) {
    formErrors.value.name = 'El nombre es requerido';
    isValid = false;
  }
  
  if (!formData.value.teacherId) {
    formErrors.value.teacherId = 'El profesor es requerido';
    isValid = false;
  }
  
  if (!formData.value.level) {
    formErrors.value.level = 'El nivel es requerido';
    isValid = false;
  }
  
  if (!formData.value.instrument) {
    formErrors.value.instrument = 'El instrumento es requerido';
    isValid = false;
  }
  
  if (!formData.value.schedule?.days?.length || 
      !formData.value.schedule?.startTime || 
      !formData.value.schedule?.endTime) {
    formErrors.value.schedule = 'El horario completo es requerido';
    isValid = false;
  }
  
  return isValid;
};

// Envío del formulario
const handleSubmit = () => {
  if (validateForm()) {
    emit('submit', formData.value);
  }
};
</script>

<template>
  <div class="bg-white dark:bg-gray-800 rounded-lg p-6">
    <form @submit.prevent="handleSubmit" class="space-y-6">
      <!-- Campo: Nombre del Grupo -->
      <div class="space-y-2">
        <label for="name" class="block text-sm font-medium text-gray-700 dark:text-gray-300">
          Nombre del Grupo
        </label>
        <div class="relative rounded-md shadow-sm">
          <input
            id="name"
            v-model="formData.name"
            type="text"
            class="block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:text-white py-2.5 px-3"
            :class="{ 'border-red-500 dark:border-red-500': formErrors.name }"
            placeholder="Ej: Orquesta Juvenil 2024"
          />
        </div>
        <p v-if="formErrors.name" class="mt-1 text-sm text-red-600 dark:text-red-400">{{ formErrors.name }}</p>
      </div>
      
      <!-- Campo: Profesor -->
      <div class="space-y-2">
        <label for="teacher" class="block text-sm font-medium text-gray-700 dark:text-gray-300">
          Profesor
        </label>
        <div class="relative rounded-md shadow-sm">
          <select
            id="teacher"
            v-model="formData.teacherId"
            class="block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:text-white appearance-none py-2.5 px-3"
            :class="{ 'border-red-500 dark:border-red-500': formErrors.teacherId }"
          >
            <option value="">Seleccionar profesor</option>
            <option v-for="teacher in teachers" :key="teacher.id" :value="teacher.id">
              {{ teacher.name }}
            </option>
          </select>
          <div class="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
            <ChevronDownIcon class="h-4 w-4 text-gray-500 dark:text-gray-400" aria-hidden="true" />
          </div>
        </div>
        <p v-if="formErrors.teacherId" class="mt-1 text-sm text-red-600 dark:text-red-400">{{ formErrors.teacherId }}</p>
      </div>
      
      <!-- Fila: Nivel e Instrumento -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <!-- Campo: Nivel -->
        <div class="space-y-2">
          <label for="level" class="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Nivel
          </label>
          <div class="relative rounded-md shadow-sm">
            <select
              id="level"
              v-model="formData.level"
              class="block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:text-white appearance-none py-2.5 px-3"
              :class="{ 'border-red-500 dark:border-red-500': formErrors.level }"
            >
              <option value="">Seleccionar nivel</option>
              <option v-for="level in levelOptions" :key="level" :value="level">
                {{ level }}
              </option>
            </select>
            <div class="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
              <ChevronDownIcon class="h-4 w-4 text-gray-500 dark:text-gray-400" aria-hidden="true" />
            </div>
          </div>
          <p v-if="formErrors.level" class="mt-1 text-sm text-red-600 dark:text-red-400">{{ formErrors.level }}</p>
        </div>
        
        <!-- Campo: Instrumento -->
        <div class="space-y-2">
          <label for="instrument" class="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Instrumento
          </label>
          <div class="relative rounded-md shadow-sm">
            <select
              id="instrument"
              v-model="formData.instrument"
              class="block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:text-white appearance-none py-2.5 px-3"
              :class="{ 'border-red-500 dark:border-red-500': formErrors.instrument }"
            >
              <option value="">Seleccionar instrumento</option>
              <template v-for="(instruments, family) in instrumentsByFamily" :key="family">
                <optgroup :label="family" class="text-sm font-medium dark:text-gray-300">
                  <option 
                    v-for="instrument in instruments" 
                    :key="instrument"
                    :value="instrument"
                    class="dark:text-white"
                  >
                    {{ instrument }}
                  </option>
                </optgroup>
              </template>
            </select>
            <div class="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
              <ChevronDownIcon class="h-4 w-4 text-gray-500 dark:text-gray-400" aria-hidden="true" />
            </div>
          </div>
          <p v-if="formErrors.instrument" class="mt-1 text-sm text-red-600 dark:text-red-400">{{ formErrors.instrument }}</p>
        </div>
      </div>
      
      <!-- Campo: Horario -->
      <div class="space-y-2">
        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">
          Horario
        </label>
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <!-- Selector de días personalizado -->
          <div class="space-y-2">
            <label class="block text-xs text-gray-500 dark:text-gray-400">Días</label>
            <div class="relative">
              <div 
                @click="daySelectOpen = !daySelectOpen"
                class="cursor-pointer w-full flex items-center justify-between rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 py-2.5 px-3 text-sm text-gray-700 dark:text-white shadow-sm"
                :class="{ 'border-red-500 dark:border-red-500': formErrors.schedule }"
              >
                <span>{{ selectedDaysText }}</span>
                <ChevronDownIcon class="h-4 w-4 text-gray-500 dark:text-gray-400" />
              </div>
              
              <!-- Dropdown para días -->
              <div 
                v-if="daySelectOpen" 
                class="absolute z-10 mt-1 w-full rounded-md bg-white dark:bg-gray-700 shadow-lg border border-gray-200 dark:border-gray-600"
              >
                <div class="p-2">
                  <div 
                    v-for="day in weekDays" 
                    :key="day"
                    @click="toggleDay(day)"
                    class="flex items-center p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-600 cursor-pointer text-sm"
                  >
                    <div 
                      class="w-5 h-5 mr-2 flex items-center justify-center rounded border border-gray-300 dark:border-gray-500"
                      :class="{ 'bg-blue-600 border-blue-600': isDaySelected(day) }"
                    >
                      <CheckIcon v-if="isDaySelected(day)" class="w-3 h-3 text-white" />
                    </div>
                    <span class="text-gray-700 dark:text-gray-200">{{ day }}</span>
                  </div>
                </div>
                <div class="border-t border-gray-200 dark:border-gray-600 p-2">
                  <button 
                    @click="daySelectOpen = false" 
                    class="w-full py-1 px-2 text-sm text-center text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-gray-600 rounded"
                  >
                    Cerrar
                  </button>
                </div>
              </div>
            </div>
          </div>
          
          <!-- Horario: inicio y fin -->
          <div class="grid grid-cols-2 gap-4">
            <div class="space-y-2">
              <label class="block text-xs text-gray-500 dark:text-gray-400">Hora inicio</label>
              <input
                v-model="formData.schedule.startTime"
                type="time"
                class="block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:text-white py-2 px-3"
                :class="{ 'border-red-500 dark:border-red-500': formErrors.schedule }"
              />
            </div>
            <div class="space-y-2">
              <label class="block text-xs text-gray-500 dark:text-gray-400">Hora fin</label>
              <input
                v-model="formData.schedule.endTime"
                type="time"
                class="block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:text-white py-2 px-3"
                :class="{ 'border-red-500 dark:border-red-500': formErrors.schedule }"
              />
            </div>
          </div>
        </div>
        <p v-if="formErrors.schedule" class="mt-1 text-sm text-red-600 dark:text-red-400">{{ formErrors.schedule }}</p>
      </div>
      
      <!-- Campo: Descripción -->
      <div class="space-y-2">
        <label for="description" class="block text-sm font-medium text-gray-700 dark:text-gray-300">
          Descripción <span class="text-gray-500 dark:text-gray-400">(opcional)</span>
        </label>
        <textarea
          id="description"
          v-model="formData.description"
          class="block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:text-white py-2.5 px-3"
          rows="3"
          placeholder="Agrega notas o información adicional sobre este grupo..."
        ></textarea>
      </div>
      
      <!-- Botones de acción -->
      <div class="flex justify-end space-x-4 pt-4">
        <button
          type="button"
          @click="emit('cancel')"
          class="px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
          :disabled="props.isLoading"
        >
          Cancelar
        </button>
        <button
          type="submit"
          class="inline-flex justify-center items-center px-4 py-2.5 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-70"
          :disabled="props.isLoading"
        >
          <span v-if="props.isLoading" class="flex items-center">
            <svg class="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Guardando...
          </span>
          <span v-else>
            {{ props.initialData ? 'Guardar Cambios' : 'Crear Grupo' }}
          </span>
        </button>
      </div>
    </form>
  </div>
</template>

<style>
/* Estilos para el select en modo oscuro */
select option {
  @apply bg-white text-gray-900;
}

.dark select option {
  @apply bg-gray-700 text-white;
}

/* Mejora de la apariencia de optgroup */
select optgroup {
  @apply font-bold;
}

.dark select optgroup {
  @apply text-gray-300;
}
</style>