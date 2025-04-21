<script setup lang="ts">
import { ref, watch, onMounted } from 'vue';
import { useTeachersStore } from '../../Teachers/store/teachers';
import { useAuthStore } from '@/stores/auth'; // Add import for auth store

const props = defineProps({
  classData: {
    type: Object,
    default: null
  }
});
const emit = defineEmits(['save', 'cancel']);

// Stores
const teachersStore = useTeachersStore();
const authStore = useAuthStore(); // Add auth store

// Estado del formulario
const form = ref({
  name: '',
  description: '',
  level: 'Principiante',
  instrument: '',
  teacherId: '', // This will be set with the current user's UID
  classroom: '',
  schedule: {
    slots: [
      { day: '', startTime: '', endTime: '' } // Sesión vacía por defecto
    ]
  }
});

const levels = ['Principiante', 'Intermedio', 'Avanzado'];
const days = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];

const errors = ref({
  name: '',
  level: '',
  teacherId: '',
  schedule: ''
});

const isSubmitting = ref(false);

// Función para agregar una nueva sesión de horario
const addSession = () => {
  form.value.schedule.slots.push({ day: '', startTime: '', endTime: '' });
};

// Función para eliminar una sesión por índice
const removeSession = (index: number) => {
  form.value.schedule.slots.splice(index, 1);
};

// Validación del formulario, incluyendo horarios
const validateForm = () => {
  let isValid = true;
  errors.value = {
    name: '',
    level: '',
    teacherId: '',
    schedule: ''
  };

  if (!form.value.name.trim()) {
    errors.value.name = 'El nombre de la clase es requerido';
    isValid = false;
  }

  if (!form.value.level) {
    errors.value.level = 'El nivel es requerido';
    isValid = false;
  }

  if (form.value.schedule.slots.length === 0) {
    errors.value.schedule = 'Agrega al menos un horario';
    isValid = false;
  } else {
    form.value.schedule.slots.forEach((session) => {
      if (!session.day || !session.startTime || !session.endTime) {
        errors.value.schedule = 'Completa todos los campos de cada horario';
        isValid = false;
      }
    });
  }

  return isValid;
};

const handleSubmit = async () => {
  if (!validateForm()) return;

  isSubmitting.value = true;
  try {
    emit('save', {
      ...form.value,
      studentIds: props.classData?.studentIds || []
    });
  } catch (error) {
    console.error('Error al guardar la clase:', error);
  } finally {
    isSubmitting.value = false;
  }
};

// Inicializar formulario si se está editando
watch(
  () => props.classData,
  (newVal) => {
    if (newVal) {
      form.value = {
        name: newVal.name || '',
        description: newVal.description || '',
        level: newVal.level || 'Principiante',
        instrument: newVal.instrument || '',
        teacherId: newVal.teacherId || authStore.user?.uid || '', // Use existing or current user's UID
        classroom: newVal.classroom || '',
        schedule: {
          slots: Array.isArray(newVal.schedule?.slots)
            ? newVal.schedule.slots.map((slot) => ({
                day: slot.day || '',
                startTime: slot.startTime || '',
                endTime: slot.endTime || ''
              }))
            : [] // Default to empty array if not valid
        }
      };
    } else {
      // If creating a new class, set teacherId to current user's UID
      form.value.teacherId = authStore.user?.uid || '';
    }
  },
  { immediate: true }
);

onMounted(async () => {
  // Set the teacherId to the current user's UID if not already set
  if (!form.value.teacherId && authStore.user?.uid) {
    form.value.teacherId = authStore.user.uid;
  }
});
</script>

<template>
  <form @submit.prevent="handleSubmit" class="space-y-6">
    <!-- Nombre de la clase -->
    <div>
      <label for="name" class="block text-sm font-medium text-gray-100 dark:text-gray-100">
        Nombre de la clase <span class="text-red-500">*</span>
      </label>
      <input 
        id="name" 
        v-model="form.name" 
        type="text" 
        class="mt-1 block w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-100"
        :class="{'border-red-500': errors.name}"
      />
      <p v-if="errors.name" class="mt-1 text-sm text-red-500">{{ errors.name }}</p>
    </div>

    <!-- Descripción -->
    <div>
      <label for="description" class="block text-sm font-medium text-gray-700 dark:text-gray-300">
        Descripción
      </label>
      <textarea 
        id="description" 
        v-model="form.description" 
        rows="3" 
        class="mt-1 block w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-100"
      ></textarea>
    </div>

    <!-- Nivel e Instrumento -->
    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div>
        <label for="level" class="block text-sm font-medium text-gray-700 dark:text-gray-300">
          Nivel <span class="text-red-500">*</span>
        </label>
        <select 
          id="level" 
          v-model="form.level" 
          class="mt-1 block w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-100"
          :class="{'border-red-500': errors.level}"
        >
          <option v-for="level in levels" :key="level" :value="level">{{ level }}</option>
        </select>
        <p v-if="errors.level" class="mt-1 text-sm text-red-500">{{ errors.level }}</p>
      </div>

      <div>
        <label for="instrument" class="block text-sm font-medium text-gray-700 dark:text-gray-300">
          Instrumento
        </label>
        <input 
          id="instrument" 
          v-model="form.instrument" 
          type="text" 
          class="mt-1 block w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-100"
        />
      </div>
    </div>

    <!-- Aula (removed Profesor) -->
    <div>
      <label for="classroom" class="block text-sm font-medium text-gray-700 dark:text-gray-300">
        Aula
      </label>
      <input 
        id="classroom" 
        v-model="form.classroom" 
        type="text" 
        class="mt-1 block w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-100"
      />
    </div>

    <!-- Sección de Horarios -->
    <div>
      <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">
        Horarios <span class="text-red-500">*</span>
      </label>
      <div v-for="(slots, index) in form.schedule.slots" :key="index" class="flex items-center gap-2 mt-2">
        <select 
          v-model="slots.day" 
          class="block w-1/4 p-2 border border-gray-300 dark:border-gray-600 rounded-md"
        >
          <option value="" disabled>Seleccione un día</option>
          <option v-for="day in days" :key="day" :value="day">{{ day }}</option>
        </select>
        <input 
          type="time" 
          v-model="slots.startTime" 
          class="block w-1/4 p-2 border border-gray-300 dark:border-gray-600 rounded-md"
          placeholder="Inicio"
        />
        <input 
          type="time" 
          v-model="slots.endTime" 
          class="block w-1/4 p-2 border border-gray-300 dark:border-gray-600 rounded-md"
          placeholder="Fin"
        />
        <button type="button" @click="removeSession(index)" class="text-red-500">
          Eliminar
        </button>
      </div>
      <button type="button" @click="addSession" class="mt-2 text-blue-600">
        Agregar horario
      </button>
      <p v-if="errors.schedule" class="mt-1 text-sm text-red-500">{{ errors.schedule }}</p>
    </div>

    <!-- Botones de Acción -->
    <div class="flex justify-end space-x-3 pt-4 border-t border-gray-200 dark:border-gray-700">
      <button 
        type="button" 
        @click="emit('cancel')" 
        class="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700"
      >
        Cancelar
      </button>
      <button 
        type="submit" 
        :disabled="isSubmitting"
        class="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {{ isSubmitting ? 'Guardando...' : (props.classData ? 'Actualizar' : 'Crear') }}
      </button>
    </div>
  </form>
</template>

<style scoped>
/* Puedes agregar estilos personalizados aquí si es necesario */
</style>
