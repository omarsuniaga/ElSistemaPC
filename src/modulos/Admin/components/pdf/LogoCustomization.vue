<template>
  <div class="space-y-4">
    <h3 class="text-lg font-semibold text-gray-900 dark:text-white">Personalización del Logo</h3>

    <div class="space-y-4">
      <!-- Logo actual -->
      <div v-if="institutionalConfig?.logoUrl || tempLogo" class="space-y-3">
        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">
          Logo Actual
        </label>
        <div class="flex items-center space-x-4">
          <img
            :src="tempLogo || institutionalConfig?.logoUrl"
            alt="Logo institucional"
            class="w-16 h-16 object-contain border border-gray-200 dark:border-gray-700 rounded-lg"
          />
          <div class="flex-1">
            <p class="text-sm text-gray-600 dark:text-gray-400">Logo institucional configurado</p>
            <p class="text-xs text-gray-500 dark:text-gray-500">
              {{ tempLogo ? "Logo temporal" : "Logo permanente" }}
            </p>
          </div>
          <button
            class="px-3 py-1 text-sm text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 font-medium"
            @click="handleRemoveLogo"
          >
            Remover
          </button>
        </div>
      </div>

      <!-- Upload de logo -->
      <div class="space-y-3">
        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">
          {{ institutionalConfig?.logoUrl ? "Cambiar Logo" : "Subir Logo" }}
        </label>
        <div class="flex items-center space-x-4">
          <label class="flex-1">
            <input
              ref="fileInput"
              type="file"
              accept="image/*"
              class="hidden"
              @change="handleFileChange"
            />
            <div
              class="flex items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg hover:border-blue-400 dark:hover:border-blue-500 cursor-pointer transition-colors"
            >
              <div class="text-center">
                <PhotoIcon class="w-8 h-8 mx-auto text-gray-400 mb-2" />
                <p class="text-sm text-gray-600 dark:text-gray-400">
                  Haz clic para seleccionar una imagen
                </p>
                <p class="text-xs text-gray-500 dark:text-gray-500 mt-1">PNG, JPG, GIF hasta 5MB</p>
              </div>
            </div>
          </label>
        </div>
      </div>

      <!-- Información institucional -->
      <div class="space-y-3">
        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">
          Información Institucional
        </label>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label class="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
              Nombre de la Institución
            </label>
            <p class="text-sm text-gray-900 dark:text-white">
              {{ institutionalConfig?.institutionName || "No configurado" }}
            </p>
          </div>
          <div>
            <label class="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
              Dirección
            </label>
            <p class="text-sm text-gray-900 dark:text-white">
              {{ institutionalConfig?.address || "No configurado" }}
            </p>
          </div>
          <div>
            <label class="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
              Teléfono
            </label>
            <p class="text-sm text-gray-900 dark:text-white">
              {{ institutionalConfig?.phone || "No configurado" }}
            </p>
          </div>
          <div>
            <label class="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
              Email
            </label>
            <p class="text-sm text-gray-900 dark:text-white">
              {{ institutionalConfig?.email || "No configurado" }}
            </p>
          </div>
        </div>
      </div>

      <!-- Opciones de logo -->
      <div class="space-y-3">
        <label class="flex items-center">
          <input
            type="checkbox"
            :checked="pdfOptions.includeLogo"
            class="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
            @change="
              $emit('update:pdfOptions', {...pdfOptions, includeLogo: $event.target.checked})
            "
          />
          <span class="ml-3 text-sm font-medium text-gray-700 dark:text-gray-300">
            Incluir logo en el reporte
          </span>
        </label>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { PhotoIcon } from '@heroicons/vue/24/outline';

// Props
interface Props {
  institutionalConfig: any
  pdfOptions: {
    includeLogo: boolean
  }
}

const props = defineProps<Props>();

// Emits
const emit = defineEmits<{
  'logo-upload': [file: File]
  'remove-logo': []
  'update:pdfOptions': [value: any]
}>();

// Refs
const fileInput = ref<HTMLInputElement>();

// Funciones
const handleFileChange = (event: Event) => {
  const target = event.target as HTMLInputElement;
  const file = target.files?.[0];

  if (file) {
    // Validar tipo de archivo
    if (!file.type.startsWith('image/')) {
      alert('Por favor selecciona un archivo de imagen válido');
      return;
    }

    // Validar tamaño (5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('El archivo es demasiado grande. Máximo 5MB');
      return;
    }

    emit('logo-upload', file);

    // Limpiar input
    if (fileInput.value) {
      fileInput.value.value = '';
    }
  }
};

const handleRemoveLogo = () => {
  emit('remove-logo');
};
</script>
