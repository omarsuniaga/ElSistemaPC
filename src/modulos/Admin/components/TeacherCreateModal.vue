<template>
  <div
    v-if="isVisible"
    class="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50"
  >
    <div
      class="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white"
    >
      <div class="mt-3">
        <!-- Header -->
        <div class="flex items-center justify-between pb-4 border-b">
          <h3 class="text-lg font-medium text-gray-900">Crear Nuevo Maestro</h3>
          <button class="text-gray-400 hover:text-gray-600" @click="$emit('close')">
            <XMarkIcon class="w-6 h-6" />
          </button>
        </div>

        <!-- Form -->
        <form class="mt-6 space-y-6" @submit.prevent="handleSubmit">
          <!-- Basic Information -->
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label class="block text-sm font-medium text-gray-700"> Nombre * </label>
              <input
                v-model="form.nombre"
                type="text"
                required
                class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700"> Apellido * </label>
              <input
                v-model="form.apellido"
                type="text"
                required
                class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
            </div>
          </div>

          <!-- Contact Information -->
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label class="block text-sm font-medium text-gray-700"> Email * </label>
              <input
                v-model="form.email"
                type="email"
                required
                class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700"> Teléfono </label>
              <input
                v-model="form.telefono"
                type="tel"
                class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
            </div>
          </div>

          <!-- Specialties -->
          <div>
            <label class="block text-sm font-medium text-gray-700"> Especialidades </label>
            <textarea
              v-model="form.especialidades"
              rows="2"
              placeholder="Ingresa las especialidades separadas por comas"
              class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>

          <!-- Status -->
          <div>
            <label class="flex items-center">
              <input
                v-model="form.activo"
                type="checkbox"
                class="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
              <span class="ml-2 text-sm text-gray-700">Maestro activo</span>
            </label>
          </div>

          <!-- Actions -->
          <div class="flex items-center justify-end space-x-3 pt-6 border-t">
            <button
              type="button"
              class="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              @click="$emit('close')"
            >
              Cancelar
            </button>
            <button
              type="submit"
              :disabled="loading"
              class="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            >
              {{ loading ? "Creando..." : "Crear Maestro" }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import { XMarkIcon } from '@heroicons/vue/24/outline';

// Props
const props = defineProps<{
  isVisible: boolean
}>();

// Emits
const emit = defineEmits<{
  close: []
  create: [teacher: any]
}>();

// State
const loading = ref(false);
const form = ref({
  nombre: '',
  apellido: '',
  email: '',
  telefono: '',
  especialidades: '',
  activo: true,
});

// Reset form when modal closes
watch(
  () => props.isVisible,
  (newValue) => {
    if (!newValue) {
      form.value = {
        nombre: '',
        apellido: '',
        email: '',
        telefono: '',
        especialidades: '',
        activo: true,
      };
    }
  },
);

// Handle form submission
const handleSubmit = async () => {
  try {
    loading.value = true;

    // Process specialties
    const especialidadesArray = form.value.especialidades
      .split(',')
      .map((s) => s.trim())
      .filter((s) => s.length > 0);

    const teacherData = {
      ...form.value,
      especialidades: especialidadesArray,
    };

    emit('create', teacherData);
  } catch (error) {
    console.error('Error creating teacher:', error);
  } finally {
    loading.value = false;
  }
};
</script>
