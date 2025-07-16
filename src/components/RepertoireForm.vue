```vue
<template>
  <Dialog :open="true" class="relative z-50" @close="emit('cancel')">
    <div class="fixed inset-0 bg-black/30" aria-hidden="true" />
    <div class="fixed inset-0 flex items-center justify-center p-4">
      <DialogPanel class="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full">
        <h2 class="text-lg font-semibold mb-4">
          {{ props.initialData ? "Editar Repertorio" : "Nuevo Repertorio" }}
        </h2>

        <form class="space-y-4" @submit.prevent="handleSubmit">
          <div>
            <label class="block text-sm font-medium mb-1">Nombre</label>
            <input v-model="formData.name" type="text" class="input" required />
          </div>

          <div>
            <label class="block text-sm font-medium mb-1">Descripción</label>
            <textarea v-model="formData.description" class="input" rows="3" />
          </div>

          <div>
            <label class="block text-sm font-medium mb-1">Categoría</label>
            <select v-model="formData.category" class="input" required>
              <option value="">Seleccionar categoría</option>
              <option v-for="category in categories" :key="category" :value="category">
                {{ category }}
              </option>
            </select>
          </div>

          <div>
            <label class="block text-sm font-medium mb-1">Tags</label>
            <div class="flex flex-wrap gap-2 mb-2">
              <span
                v-for="tag in formData.tags"
                :key="tag"
                class="px-2 py-1 text-sm bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200 rounded-full flex items-center gap-1"
              >
                {{ tag }}
                <button type="button" class="hover:text-red-600" @click="removeTag(tag)">×</button>
              </span>
            </div>
            <select
              class="input"
              @change="
                addTag($event.target.value)
                $event.target.value = ''
              "
            >
              <option value="">Agregar tag</option>
              <option
                v-for="tag in availableTags.filter((t) => !formData.tags.includes(t))"
                :key="tag"
                :value="tag"
              >
                {{ tag }}
              </option>
            </select>
          </div>

          <div class="flex justify-end gap-3 mt-6">
            <button
              type="button"
              class="btn bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600"
              @click="emit('cancel')"
            >
              Cancelar
            </button>
            <button type="submit" class="btn btn-primary">
              {{ props.initialData ? "Guardar Cambios" : "Crear Repertorio" }}
            </button>
          </div>
        </form>
      </DialogPanel>
    </div>
  </Dialog>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { Dialog, DialogPanel } from '@headlessui/vue';
import type { Repertoire } from '../types/repertoire';

const props = defineProps<{
  initialData?: Partial<Repertoire>
}>();

const emit = defineEmits<{
  (e: 'submit', data: Partial<Repertoire>): void
  (e: 'cancel'): void
}>();

const formData = ref({
  name: '',
  description: '',
  category: '',
  tags: [] as string[],
  ...props.initialData,
});

const categories = ['Classical', 'Jazz', 'Popular', 'Contemporary', 'Folk'];

const availableTags = [
  'piano',
  'violin',
  'guitar',
  'ensemble',
  'solo',
  'duet',
  'beginner',
  'intermediate',
  'advanced',
];

const addTag = (tag: string) => {
  if (!formData.value.tags.includes(tag)) {
    formData.value.tags.push(tag);
  }
};

const removeTag = (tag: string) => {
  formData.value.tags = formData.value.tags.filter((t) => t !== tag);
};

const handleSubmit = () => {
  emit('submit', formData.value);
};
</script>
```
