<script setup lang="ts">
// ../modulos/Teacher/components/TeacherForm.vue
import { ref, computed, watchEffect } from 'vue';
import FileUpload from '@/components/FileUpload.vue';
import { MinusCircleIcon, PlusCircleIcon } from '@heroicons/vue/24/outline';
import type { Teacher } from '../types';
import { uploadFile } from '@/firebase';

const props = defineProps<{
  initialData?: Teacher;
  isLoading?: boolean;
  enrollmentOnly?: boolean;  // New prop to control which fields to display
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

// Input fields for adding new items
const newSpecialty = ref('');
const newInstrument = ref({ name: '', level: 'Intermedio' });
const newSchedule = ref({
  dayOfWeek: 1,
  isAvailable: true,
  startTime: '',
  endTime: '',
  timeBlocks: []
});

// Watch for prop changes and update form data
watchEffect(() => {
  if (props.initialData) {
    formData.value = { ...defaultData, ...props.initialData };
  }
});

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
    item => item.day === newSchedule.value.dayOfWeek.toString()
  );
  
  if (existingDayIndex >= 0) {
    // Si el día ya existe, agregamos un nuevo bloque de tiempo
    formData.value.schedule[existingDayIndex].timeBlocks.push({
      start: newSchedule.value.startTime,
      end: newSchedule.value.endTime,
      isAvailable: newSchedule.value.isAvailable
    });
  } else {
    // Si es un nuevo día, creamos un nuevo registro
    formData.value.schedule.push({
      day: newSchedule.value.dayOfWeek.toString(),
      isAvailable: newSchedule.value.isAvailable,
      timeBlocks: [{
        start: newSchedule.value.startTime,
        end: newSchedule.value.endTime,
        isAvailable: newSchedule.value.isAvailable
      }]
    });
  }
  
  // Resetear el formulario
  newSchedule.value = {
    dayOfWeek: 1,
    isAvailable: true,
    startTime: '',
    endTime: '',
    timeBlocks: []
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

<template>
  <form @submit.prevent="handleSubmit" class="space-y-6">
    <!-- Profile Photo (only shown when not in enrollmentOnly mode) -->
    <div v-if="!props.enrollmentOnly">
      <label class="form-label">Foto de Perfil</label>
      <div class="flex items-center gap-4">
        <img
          :src="formData.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${formData.name}`"
          :alt="formData.name"
          class="w-20 h-20 rounded-full object-cover"
        />
        <FileUpload
          accept="image/*"
          label="Cambiar foto"
          @select="handlePhotoUpload"
        />
      </div>
    </div>

    <!-- Basic Info (only shown when not in enrollmentOnly mode) -->
    <div class="grid grid-cols-1 md:grid-cols-2 gap-4" v-if="!props.enrollmentOnly">
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
          required
          class="form-input"
          :disabled="props.isLoading"
        />
      </div>
    </div>

    <!-- Biography (only shown when not in enrollmentOnly mode) -->
    <div v-if="!props.enrollmentOnly">
      <label for="biography" class="form-label">Biografía</label>
      <textarea
        id="biography"
        v-model="formData.biography"
        rows="4"
        class="form-input"
        :disabled="props.isLoading"
      ></textarea>
    </div>

    <!-- Specialties -->
    <div>
      <label class="form-label">Especialidades</label>
      <div class="flex gap-2 mb-2">
        <input
          v-model="newSpecialty"
          type="text"
          class="form-input"
          placeholder="Nueva especialidad"
          :disabled="props.isLoading"
        />
        <button
          type="button"
          class="btn btn-primary"
          @click="addSpecialty"
          :disabled="props.isLoading"
        >
          <PlusCircleIcon class="w-5 h-5" />
        </button>
      </div>
      <div class="flex flex-wrap gap-2">
        <span
          v-for="(specialty, index) in formData.specialties"
          :key="index"
          class="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center gap-1"
        >
          {{ specialty }}
          <button
            type="button"
            class="text-gray-500 hover:text-red-500"
            @click="removeSpecialty(index)"
            :disabled="props.isLoading"
          >
            <MinusCircleIcon class="w-4 h-4" />
          </button>
        </span>
      </div>
    </div>

    <!-- Instruments -->
    <div>
      <label class="form-label">Instrumentos</label>
      <div class="flex gap-2 mb-2">
        <input
          v-model="newInstrument.name"
          type="text"
          class="form-input"
          placeholder="Nombre del instrumento"
          :disabled="props.isLoading"
        />
        <select
          v-model="newInstrument.level"
          class="form-input"
          :disabled="props.isLoading"
        >
          <option value="Principiante">Principiante</option>
          <option value="Intermedio">Intermedio</option>
          <option value="Avanzado">Avanzado</option>
          <option value="Experto">Experto</option>
        </select>
        <button
          type="button"
          class="btn btn-primary"
          @click="addInstrument"
          :disabled="props.isLoading"
        >
          <PlusCircleIcon class="w-5 h-5" />
        </button>
      </div>
      <div class="space-y-2">
        <div
          v-for="(instrument, index) in formData.instruments"
          :key="index"
          class="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-800 rounded-lg"
        >
          <span>{{ instrument.instrument }} - {{ instrument.level }}</span>
          <button
            type="button"
            class="text-gray-500 hover:text-red-500"
            @click="removeInstrument(index)"
            :disabled="props.isLoading"
          >
            <MinusCircleIcon class="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>

    <!-- Schedule - Disponibilidad del Profesor -->
    <div>
      <label class="form-label">Disponibilidad del Profesor</label>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-2">
        <select
          v-model="newSchedule.dayOfWeek"
          class="form-input"
          :disabled="props.isLoading"
        >
          <option :value="1">Lunes</option>
          <option :value="2">Martes</option>
          <option :value="3">Miércoles</option>
          <option :value="4">Jueves</option>
          <option :value="5">Viernes</option>
          <option :value="6">Sábado</option>
          <option :value="7">Domingo</option>
        </select>
        <div class="flex items-center gap-2">
          <span class="text-sm text-gray-600 dark:text-gray-400">Disponible:</span>
          <input
            v-model="newSchedule.isAvailable"
            type="checkbox"
            class="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
            :disabled="props.isLoading"
          />
        </div>
        <div>
          <label class="text-xs text-gray-500 dark:text-gray-400">Hora de inicio</label>
          <input
            v-model="newSchedule.startTime"
            type="time"
            class="form-input"
            :disabled="props.isLoading"
          />
        </div>
        <div>
          <label class="text-xs text-gray-500 dark:text-gray-400">Hora de fin</label>
          <input
            v-model="newSchedule.endTime"
            type="time"
            class="form-input"
            :disabled="props.isLoading"
          />
        </div>
        <button
          type="button"
          class="btn btn-primary md:col-span-2"
          @click="addSchedule"
          :disabled="props.isLoading"
        >
          Agregar Disponibilidad
        </button>
      </div>
      
      <!-- Mostrar disponibilidad por día -->
      <div class="space-y-4 mt-4">
        <div
          v-for="(daySchedule, dayIndex) in formData.schedule"
          :key="dayIndex"
          class="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
        >
          <div class="flex items-center justify-between mb-2">
            <h4 class="font-medium text-gray-900 dark:text-white">
              {{ ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'][parseInt(daySchedule.day) - 1] }}
            </h4>
            <button
              type="button"
              class="text-gray-500 hover:text-red-500"
              @click="removeSchedule(dayIndex)"
              :disabled="props.isLoading"
            >
              <MinusCircleIcon class="w-5 h-5" />
            </button>
          </div>
          
          <!-- Bloques de tiempo para este día -->
          <div class="space-y-2 pl-4">
            <div
              v-for="(timeBlock, blockIndex) in daySchedule.timeBlocks"
              :key="blockIndex"
              class="flex items-center justify-between p-2 bg-white dark:bg-gray-700 rounded border border-gray-200 dark:border-gray-600"
            >
              <div class="flex items-center gap-2">
                <span
                  :class="{
                    'text-green-600 dark:text-green-400': timeBlock.isAvailable,
                    'text-red-600 dark:text-red-400': !timeBlock.isAvailable
                  }"
                >
                  {{ timeBlock.isAvailable ? 'Disponible' : 'No disponible' }}
                </span>
                <span>{{ timeBlock.start }} - {{ timeBlock.end }}</span>
              </div>
              <button
                type="button"
                class="text-gray-500 hover:text-red-500"
                @click="removeSchedule(dayIndex, blockIndex)"
                :disabled="props.isLoading"
              >
                <MinusCircleIcon class="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Actions -->
    <div class="flex justify-end gap-3">
      <button
        type="button"
        class="btn btn-secondary"
        @click="handleCancel"
        :disabled="props.isLoading"
      >
        Cancelar
      </button>
      <button
        type="submit"
        class="btn btn-primary"
        :disabled="props.isLoading"
      >
        {{ props.isLoading ? 'Guardando...' : 'Guardar' }}
      </button>
    </div>
  </form>
</template>

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
</style>