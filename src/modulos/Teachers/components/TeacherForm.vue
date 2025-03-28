<script setup lang="ts">
import { ref } from 'vue'
import type { Teacher, TeacherInstrument, TeacherSchedule } from '../types'
import FileUpload from './FileUpload.vue'
import { uploadFile } from '../services/storage'
import { MinusCircleIcon, PlusCircleIcon } from '@heroicons/vue/24/outline'

const props = withDefaults(defineProps<{
  initialData?: Partial<Teacher>
  isLoading?: boolean
}>(), {
  initialData: () => ({}),
  isLoading: false
})

const emit = defineEmits<{
  (e: 'submit', data: Partial<Teacher>): void
  (e: 'cancel'): void
}>()

const formData = ref({
  name: '',
  email: '',
  phone: '',
  address: '',
  biography: '',
  photoURL: '',
  specialties: [] as string[],
  instruments: [] as TeacherInstrument[],
  schedule: [] as TeacherSchedule[],
  status: 'activo' as const,
  ...props.initialData
})

const newInstrument = ref({ name: '', level: 'Principiante' })
const newSchedule = ref({
  dayOfWeek: 1,
  startTime: '09:00',
  endTime: '10:00',
  className: ''
})
const newSpecialty = ref('')

const handlePhotoUpload = async (files: FileList) => {
  if (!files.length) return
  
  try {
    const file = files[0]
    const fileName = file.name
    const path = `photos/teachers/${fileName}`
    const result = await uploadFile(file, path, "images")
    
    formData.value.avatar = result.url
  } catch (error) {
    console.error('Error uploading photo:', error)
  }
}

const addInstrument = () => {
  if (newInstrument.value.name && newInstrument.value.level) {
    formData.value.instruments.push({
      id: '',
      teacherId: '',
      instrument: newInstrument.value.name,
      level: newInstrument.value.level,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    })
    newInstrument.value = { name: '', level: 'Principiante' }
  }
}

const removeInstrument = (index: number) => {
  formData.value.instruments.splice(index, 1)
}

const addSchedule = () => {
  if (newSchedule.value.className) {
    formData.value.schedule.push({
      id: '',
      teacherId: '',
      day: newSchedule.value.dayOfWeek.toString(),
      start: newSchedule.value.startTime,
      end: newSchedule.value.endTime,
      class: newSchedule.value.className,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    })
    newSchedule.value = {
      dayOfWeek: 1,
      startTime: '09:00',
      endTime: '10:00',
      className: ''
    }
  }
}

const removeSchedule = (index: number) => {
  formData.value.schedule.splice(index, 1)
}

const addSpecialty = () => {
  if (newSpecialty.value && !formData.value.specialties.includes(newSpecialty.value)) {
    formData.value.specialties.push(newSpecialty.value)
    newSpecialty.value = ''
  }
}

const removeSpecialty = (index: number) => {
  formData.value.specialties.splice(index, 1)
}

const handleSubmit = () => {
  emit('submit', formData.value)
}

const handleCancel = () => {
  emit('cancel')
}
</script>

<template>
  <form @submit.prevent="handleSubmit" class="space-y-6">
    <!-- Profile Photo -->
    <div>
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

    <!-- Basic Info -->
    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div>
        <label for="name" class="form-label">Nombre Completo</label>
        <input
          id="name"
          v-model="formData.name"
          type="text"
          required
          class="form-input"
          :disabled="isLoading"
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
          :disabled="isLoading"
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
          :disabled="isLoading"
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
          :disabled="isLoading"
        />
      </div>
    </div>

    <!-- Biography -->
    <div>
      <label for="biography" class="form-label">Biografía</label>
      <textarea
        id="biography"
        v-model="formData.biography"
        rows="4"
        class="form-input"
        :disabled="isLoading"
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
          :disabled="isLoading"
        />
        <button
          type="button"
          class="btn btn-primary"
          @click="addSpecialty"
          :disabled="isLoading"
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
            :disabled="isLoading"
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
          :disabled="isLoading"
        />
        <select
          v-model="newInstrument.level"
          class="form-input"
          :disabled="isLoading"
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
          :disabled="isLoading"
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
            :disabled="isLoading"
          >
            <MinusCircleIcon class="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>

    <!-- Schedule -->
    <div>
      <label class="form-label">Horario de Clases</label>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-2">
        <select
          v-model="newSchedule.dayOfWeek"
          class="form-input"
          :disabled="isLoading"
        >
          <option :value="1">Lunes</option>
          <option :value="2">Martes</option>
          <option :value="3">Miércoles</option>
          <option :value="4">Jueves</option>
          <option :value="5">Viernes</option>
          <option :value="6">Sábado</option>
          <option :value="7">Domingo</option>
        </select>
        <input
          v-model="newSchedule.className"
          type="text"
          class="form-input"
          placeholder="Nombre de la clase"
          :disabled="isLoading"
        />
        <input
          v-model="newSchedule.startTime"
          type="time"
          class="form-input"
          :disabled="isLoading"
        />
        <input
          v-model="newSchedule.endTime"
          type="time"
          class="form-input"
          :disabled="isLoading"
        />
        <button
          type="button"
          class="btn btn-primary md:col-span-2"
          @click="addSchedule"
          :disabled="isLoading"
        >
          Agregar Horario
        </button>
      </div>
      <div class="space-y-2">
        <div
          v-for="(schedule, index) in formData.schedule"
          :key="index"
          class="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-800 rounded-lg"
        >
          <span>
            {{ ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'][parseInt(schedule.day) - 1] }}:
            {{ schedule.class }} ({{ schedule.start }} - {{ schedule.end }})
          </span>
          <button
            type="button"
            class="text-gray-500 hover:text-red-500"
            @click="removeSchedule(index)"
            :disabled="isLoading"
          >
            <MinusCircleIcon class="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>

    <!-- Actions -->
    <div class="flex justify-end gap-3">
      <button
        type="button"
        class="btn btn-secondary"
        @click="handleCancel"
        :disabled="isLoading"
      >
        Cancelar
      </button>
      <button
        type="submit"
        class="btn btn-primary"
        :disabled="isLoading"
      >
        {{ isLoading ? 'Guardando...' : 'Guardar' }}
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