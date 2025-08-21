<template>
  <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50" @click="$emit('cancel')">
    <div class="bg-white dark:bg-gray-800 rounded-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-2xl" @click.stop>
      <div class="p-6 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
        <div class="flex items-center space-x-3">
          <span class="text-xl">✏️</span>
          <h3 class="text-lg font-semibold text-gray-900 dark:text-white">Editar Clase</h3>
        </div>
        <button 
          class="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300 p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors duration-200" 
          @click="$emit('cancel')"
        >
          ✕
        </button>
      </div>

      <form @submit.prevent="onSave" class="p-6 space-y-6">
        <!-- Basic Information -->
        <div class="space-y-4">
          <h4 class="text-md font-medium text-gray-900 dark:text-white flex items-center space-x-2">
            <span>📝</span>
            <span>Información Básica</span>
          </h4>
          
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div class="md:col-span-2">
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Nombre de la Clase *
              </label>
              <input 
                v-model="localForm.name" 
                type="text"
                required
                class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white transition-colors duration-200"
                placeholder="Ej: Piano Intermedio"
              />
              <p v-if="errors?.name" class="mt-1 text-sm text-red-500">{{ errors.name }}</p>
            </div>

            <div class="md:col-span-2">
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Descripción
              </label>
              <textarea 
                v-model="localForm.description" 
                rows="3"
                class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white transition-colors duration-200"
                placeholder="Descripción de la clase..."
              ></textarea>
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Instrumento *
              </label>
              <input 
                v-model="localForm.instrument" 
                type="text"
                required
                class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white transition-colors duration-200"
                placeholder="Ej: Piano, Guitarra, Violín"
              />
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Maestro *
              </label>
              <select 
                v-model="localForm.teacherId" 
                required
                class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white transition-colors duration-200"
              >
                <option value="">Seleccione un maestro</option>
                <option v-for="t in teachers" :key="t.id" :value="t.id">{{ t.name }}</option>
              </select>
              <p v-if="errors?.teacherId" class="mt-1 text-sm text-red-500">{{ errors.teacherId }}</p>
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Capacidad Máxima
              </label>
              <input 
                v-model.number="localForm.capacity" 
                type="number"
                min="1"
                max="50"
                class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white transition-colors duration-200"
                placeholder="Ej: 10"
              />
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Estado
              </label>
              <select 
                v-model="localForm.status"
                class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white transition-colors duration-200"
              >
                <option value="active">✅ Activa</option>
                <option value="inactive">⏸️ Inactiva</option>
                <option value="suspended">🚫 Suspendida</option>
              </select>
            </div>
          </div>
        </div>

        <!-- Schedule Section -->
        <div class="space-y-4">
          <h4 class="text-md font-medium text-gray-900 dark:text-white flex items-center space-x-2">
            <span>📅</span>
            <span>Horario Principal</span>
          </h4>
          
          <div class="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
            <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Día de la Semana
                </label>
                <select 
                  v-model="firstSlot.day"
                  class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white transition-colors duration-200"
                >
                  <option value="monday">Lunes</option>
                  <option value="tuesday">Martes</option>
                  <option value="wednesday">Miércoles</option>
                  <option value="thursday">Jueves</option>
                  <option value="friday">Viernes</option>
                  <option value="saturday">Sábado</option>
                  <option value="sunday">Domingo</option>
                </select>
              </div>
              
              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Hora de Inicio
                </label>
                <input 
                  v-model="firstSlot.startTime" 
                  type="time"
                  class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white transition-colors duration-200"
                />
              </div>
              
              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Hora de Fin
                </label>
                <input 
                  v-model="firstSlot.endTime" 
                  type="time"
                  class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white transition-colors duration-200"
                />
              </div>
            </div>
          </div>
        </div>

        <!-- Error Message -->
        <div v-if="errors?.general" class="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <p class="text-sm text-red-600 dark:text-red-400">{{ errors.general }}</p>
        </div>

        <!-- Action Buttons -->
        <div class="flex justify-end space-x-3 pt-4 border-t border-gray-200 dark:border-gray-700">
          <button 
            type="button"
            class="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors duration-200"
            @click="$emit('cancel')"
          >
            Cancelar
          </button>
          <button 
            type="submit"
            class="px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors duration-200"
          >
            💾 Guardar Cambios
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { reactive, watch } from 'vue';
import type { PropType } from 'vue';
import type { ClassData } from '../types/class';
import type { Teacher } from '../../Teachers/types/teacher';
import type { ClassScheduleSlot } from '../types/classForm';

const emit = defineEmits<{
  (e: 'update:editForm', payload: Partial<ClassData> | null): void;
  (e: 'save'): void;
  (e: 'cancel'): void;
}>();

const props = defineProps({
  editForm: { type: Object as PropType<Partial<ClassData> | null>, required: true },
  errors: { type: Object as PropType<Record<string, string> | null>, required: false },
  teachers: { type: Array as PropType<Teacher[]>, required: false, default: () => [] },
});

// Local copy to allow two-way editing inside the modal
const localForm = reactive<Partial<ClassData>>(Object.assign({}, props.editForm || {}));

watch(() => props.editForm, (n) => {
  // sync when parent changes
  Object.assign(localForm, (n as Partial<ClassData>) || {});
}, { deep: true });

watch(localForm, (val) => {
  // emit a plain JSON-serializable copy
  const copy = JSON.parse(JSON.stringify(val || null));
  emit('update:editForm', copy as Partial<ClassData> | null);
}, { deep: true });

const ensureFirstSlot = () => {
  if (!localForm.schedule || typeof localForm.schedule !== 'object') {
    (localForm as any).schedule = { slots: [] as ClassScheduleSlot[] };
  }
  const maybe = (localForm.schedule as { slots?: unknown });
  if (!Array.isArray((maybe as any).slots)) (maybe as any).slots = [];
  const slots = ((maybe as any).slots as ClassScheduleSlot[]) || [];
  if (slots.length === 0) {
    slots.push({ id: 'slot-1', day: 'monday', startTime: '', endTime: '', duration: '' });
    (maybe as any).slots = slots;
  }
  return ((maybe as any).slots as ClassScheduleSlot[])[0];
};

const firstSlot = ensureFirstSlot();

const onSave = () => {
  emit('save');
};
</script>

<style scoped>
</style>
