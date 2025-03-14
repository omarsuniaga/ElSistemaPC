<script setup lang="ts">
import { ref, computed } from 'vue'
import { Dialog, DialogPanel } from '@headlessui/vue'
import { useClassesStore } from '../stores/classes'
import { useTeachersStore } from '../stores/teachers'
import type { Class } from '../types'

const props = defineProps<{
  initialData?: Partial<Class>
}>()

const emit = defineEmits<{
  (e: 'submit', data: Partial<Class>): void
  (e: 'cancel'): void
}>()

const classesStore = useClassesStore()
const teachersStore = useTeachersStore()

const formData = ref({
  name: '',
  teacherId: 0,
  level: '',
  instrument: '',
  schedule: '',
  description: '',
  ...props.initialData
})

const instruments = [
  'Piano',
  'Violín',
  'Guitarra'
]

const levels = [
  'Principiante',
  'Intermedio',
  'Avanzado'
]

const teachers = computed(() => teachersStore.activeTeachers)

const handleSubmit = () => {
  emit('submit', formData.value)
}
</script>

<template>
  <Dialog open @close="emit('cancel')" class="relative z-50">
    <div class="fixed inset-0 bg-black/30" aria-hidden="true" />
    <div class="fixed inset-0 flex items-center justify-center p-4">
      <DialogPanel class="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full">
        <h2 class="text-lg font-semibold mb-4">{{ props.initialData ? 'Editar' : 'Nueva' }} Clase</h2>
        
        <form @submit.prevent="handleSubmit" class="space-y-4">
          <div>
            <label class="block text-sm font-medium mb-1">Nombre de la Clase</label>
            <input
              v-model="formData.name"
              type="text"
              class="input"
              required
            />
          </div>

          <div>
            <label class="block text-sm font-medium mb-1">Profesor</label>
            <select
              v-model="formData.teacherId"
              class="input"
              required
            >
              <option value="">Seleccionar profesor</option>
              <option
                v-for="teacher in teachers"
                :key="teacher.id"
                :value="teacher.id"
              >
                {{ teacher.name }}
              </option>
            </select>
          </div>

          <div>
            <label class="block text-sm font-medium mb-1">Instrumento</label>
            <select
              v-model="formData.instrument"
              class="input"
              required
            >
              <option value="">Seleccionar instrumento</option>
              <option
                v-for="instrument in instruments"
                :key="instrument"
                :value="instrument"
              >
                {{ instrument }}
              </option>
            </select>
          </div>

          <div>
            <label class="block text-sm font-medium mb-1">Nivel</label>
            <select
              v-model="formData.level"
              class="input"
              required
            >
              <option value="">Seleccionar nivel</option>
              <option
                v-for="level in levels"
                :key="level"
                :value="level"
              >
                {{ level }}
              </option>
            </select>
          </div>

          <div>
            <label class="block text-sm font-medium mb-1">Horario</label>
            <input
              v-model="formData.schedule"
              type="text"
              class="input"
              placeholder="Ej: Lunes y Miércoles 15:00-17:00"
              required
            />
          </div>

          <div>
            <label class="block text-sm font-medium mb-1">Descripción</label>
            <textarea
              v-model="formData.description"
              class="input"
              rows="3"
            ></textarea>
          </div>

          <div class="flex justify-end gap-3 mt-6">
            <button
              type="button"
              @click="emit('cancel')"
              class="btn bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600"
            >
              Cancelar
            </button>
            <button
              type="submit"
              class="btn btn-primary"
            >
              {{ props.initialData ? 'Guardar Cambios' : 'Crear Clase' }}
            </button>
          </div>
        </form>
      </DialogPanel>
    </div>
  </Dialog>
</template>