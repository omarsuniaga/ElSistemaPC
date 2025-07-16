<template>
  <div class="modal-scroll-wrapper">
    <form class="space-y-6" @submit.prevent="handleSubmit">
      <!-- Ejemplo de campos principales -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label for="name" class="form-label">Nombre Completo</label>
          <input
            id="name"
            v-model="formData.name"
            type="text"
            required
            class="form-input"
            :disabled="props.isLoading"
          />
        </div>
        <div>
          <label for="email" class="form-label">Email</label>
          <input
            id="email"
            v-model="formData.email"
            type="email"
            required
            class="form-input"
            :disabled="props.isLoading"
          />
        </div>
        <div>
          <label for="phone" class="form-label">Teléfono</label>
          <input
            id="phone"
            v-model="formData.phone"
            type="tel"
            required
            class="form-input"
            :disabled="props.isLoading"
          />
        </div>
        <div>
          <label for="address" class="form-label">Dirección</label>
          <input
            id="address"
            v-model="formData.address"
            type="text"
            class="form-input"
            :disabled="props.isLoading"
          />
        </div>
      </div>
      <!-- Puedes agregar aquí el resto de campos y secciones del formulario -->
      <!-- ...existing code... -->
      <div class="flex justify-end gap-3">
        <button
          type="button"
          class="btn btn-secondary"
          :disabled="props.isLoading"
          @click="handleCancel"
        >
          Cancelar
        </button>
        <button type="submit" class="btn btn-primary" :disabled="props.isLoading">
          {{ props.isLoading ? "Guardando..." : "Guardar" }}
        </button>
      </div>
    </form>
  </div>
</template>

<script setup lang="ts">
// ../modulos/Teacher/components/TeacherForm.vue
import { ref, computed, watch } from 'vue';
import FileUpload from '@/components/FileUpload.vue';
import { MinusCircleIcon, PlusCircleIcon } from '@heroicons/vue/24/outline';
import type { Teacher } from '../types';
import { uploadFile } from '@/firebase';

const props = defineProps<{
  initialData?: Teacher
  isLoading?: boolean
  enrollmentOnly?: boolean // New prop to control which fields to display
}>();

const emit = defineEmits(['submit', 'cancel']);

// Default data structure
const defaultData = {
  id: '',
  name: '',
  email: '',
  phone: '',
  address: '',
  biography: '',
  photoURL: '',
  specialties: [],
  instruments: [],
  schedule: [],
  role: 'teacher',
};

// Form data with provided initial data or defaults
const formData = ref({ ...defaultData, ...props.initialData });

// Watch para actualizar el formulario cuando cambie el maestro a editar
watch(
  () => props.initialData,
  (newVal) => {
    if (newVal) {
      formData.value = { ...defaultData, ...newVal };
    }
  },
  { deep: true, immediate: true },
);

// Methods
function handlePhotoUpload(file: File) {
  if (!file) return;
  const uploadPath = `teachers/${Date.now()}_${file.name}`;
  uploadFile(uploadPath, file).then((url: string) => {
    formData.value.photoURL = url;
  });
}

function addSpecialty() {
  if (!newSpecialty.value.trim()) return;
  formData.value.specialties.push(newSpecialty.value.trim());
  newSpecialty.value = '';
}

function removeSpecialty(index: number) {
  formData.value.specialties.splice(index, 1);
}

function addInstrument() {
  if (!newInstrument.value.name.trim()) return;
  formData.value.instruments.push({
    instrument: newInstrument.value.name.trim(),
    level: newInstrument.value.level,
  });
  newInstrument.value = { name: '', level: 'Intermedio' };
}

function removeInstrument(index: number) {
  formData.value.instruments.splice(index, 1);
}

function addSchedule() {
  if (!newSchedule.value.startTime || !newSchedule.value.endTime) return;

  // Verificar si ya existe un registro para este día
  const existingDayIndex = formData.value.schedule.findIndex(
    (item) => item.day === newSchedule.value.dayOfWeek.toString(),
  );

  if (existingDayIndex >= 0) {
    // Si el día ya existe, agregamos un nuevo bloque de tiempo
    formData.value.schedule[existingDayIndex].timeBlocks.push({
      start: newSchedule.value.startTime,
      end: newSchedule.value.endTime,
      isAvailable: newSchedule.value.isAvailable,
    });
  } else {
    // Si es un nuevo día, creamos un nuevo registro
    formData.value.schedule.push({
      day: newSchedule.value.dayOfWeek.toString(),
      isAvailable: newSchedule.value.isAvailable,
      timeBlocks: [
        {
          start: newSchedule.value.startTime,
          end: newSchedule.value.endTime,
          isAvailable: newSchedule.value.isAvailable,
        },
      ],
    });
  }

  // Resetear el formulario
  newSchedule.value = {
    dayOfWeek: 1,
    isAvailable: true,
    startTime: '',
    endTime: '',
    timeBlocks: [],
  };
}

function removeSchedule(dayIndex: number, blockIndex?: number) {
  if (blockIndex !== undefined) {
    // Si se proporciona un índice de bloque, eliminamos solo ese bloque de tiempo
    const day = formData.value.schedule[dayIndex];
    day.timeBlocks.splice(blockIndex, 1);

    // Si no quedan bloques de tiempo, eliminamos el día completo
    if (day.timeBlocks.length === 0) {
      formData.value.schedule.splice(dayIndex, 1);
    }
  } else {
    // Si no se proporciona un índice de bloque, eliminamos el día completo
    formData.value.schedule.splice(dayIndex, 1);
  }
}

function handleSubmit() {
  emit('submit', { ...formData.value });
}

function handleCancel() {
  emit('cancel');
}
</script>

<style scoped>
.form-label {
  @apply block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1;
}

.form-input {
  @apply block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm dark:bg-gray-700 dark:text-white;
}

.btn {
  @apply px-4 py-2 rounded-md text-sm font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed;
}

.btn-primary {
  @apply bg-primary-600 text-white hover:bg-primary-700 focus:ring-primary-500;
}

.btn-secondary {
  @apply bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 focus:ring-gray-500;
}

.modal-scroll-wrapper {
  max-height: 80vh;
  overflow-y: auto;
  padding-right: 2px;
}
</style>
