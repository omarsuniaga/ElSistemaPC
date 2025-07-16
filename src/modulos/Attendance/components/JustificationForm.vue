<template>
  <div class="p-4 space-y-4">
    <!-- Mensaje de error -->
    <div v-if="error" class="bg-red-50 p-4 rounded-md">
      <p class="text-red-800">{{ error }}</p>
    </div>

    <!-- Formulario -->
    <div class="space-y-4">
      <!-- Razón de la justificación -->
      <div>
        <label class="block text-sm font-medium text-gray-700">Razón de la ausencia</label>
        <textarea
          v-model="reason"
          rows="4"
          class="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
          placeholder="Describe la razón de la ausencia..."
        />
      </div>

      <!-- Subida de documento -->
      <div>
        <label class="block text-sm font-medium text-gray-700">Documento de respaldo</label>
        <div
          class="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md"
        >
          <div class="space-y-1 text-center">
            <svg
              class="mx-auto h-12 w-12 text-gray-400"
              stroke="currentColor"
              fill="none"
              viewBox="0 0 48 48"
              aria-hidden="true"
            >
              <path
                d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
            </svg>
            <div class="flex text-sm text-gray-600">
              <label
                for="file-upload"
                class="relative cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-blue-500"
              >
                <span>Subir un archivo</span>
                <input
                  id="file-upload"
                  type="file"
                  class="sr-only"
                  @change="
                    (e) => {
                      const target = e.target as HTMLInputElement
                      if (target.files && target.files[0]) {
                        uploadDocument(target.files[0])
                      }
                    }
                  "
                />
              </label>
              <p class="pl-1">o arrastrar y soltar</p>
            </div>
            <p class="text-xs text-gray-500">PNG, JPG, PDF hasta 10MB</p>
          </div>
        </div>
      </div>

      <!-- Estado de carga -->
      <div v-if="uploading" class="text-center">
        <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto" />
        <p class="mt-2 text-sm text-gray-600">Subiendo documento...</p>
      </div>

      <!-- Documento subido -->
      <div v-if="documentUrl" class="flex items-center justify-between p-3 bg-gray-50 rounded-md">
        <div class="flex items-center">
          <svg class="h-5 w-5 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
            <path
              fill-rule="evenodd"
              d="M8 4a3 3 0 00-3 3v4a5 5 0 0010 0V7a1 1 0 112 0v4a7 7 0 11-14 0V7a5 5 0 0110 0v4a3 3 0 11-6 0V7a1 1 0 012 0v4a1 1 0 102 0V7a3 3 0 00-3-3z"
              clip-rule="evenodd"
            />
          </svg>
          <span class="ml-2 text-sm text-gray-600">Documento subido</span>
        </div>
        <button class="text-red-600 hover:text-red-800" @click="documentUrl = ''">Eliminar</button>
      </div>

      <!-- Botones de acción -->
      <div class="flex justify-end gap-4 mt-4">
        <button
          class="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
          @click="emit('cancel')"
        >
          Cancelar
        </button>
        <button
          :disabled="!isValid || uploading || !canJustify"
          class="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 disabled:opacity-50"
          :title="!canJustify ? 'No tienes permisos para crear justificaciones' : ''"
          @click="saveJustification"
        >
          Guardar Justificación
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import type { JustificationData } from '../types/attendance';
import { useAttendanceStore } from '../store/attendance';
import { useAuthStore } from '../../../stores/auth';
import { useRBACStore } from '../../../stores/rbacStore';

const props = defineProps<{
  studentId: string
  classId: string
  date: string
}>();

const emit = defineEmits(['saved', 'cancel']);

const attendanceStore = useAttendanceStore();
const authStore = useAuthStore();
const rbacStore = useRBACStore();

// RBAC permissions
const canJustify = computed(() => rbacStore.hasPermission('attendance_justify'));

// Estado del formulario
const reason = ref('');
const documentUrl = ref('');
const uploading = ref(false);
const error = ref<string | null>(null);

// Computed para validación
const isValid = computed(() => {
  return reason.value.trim().length > 0;
});

// Método para subir documento
const uploadDocument = async (file: File) => {
  try {
    uploading.value = true;
    error.value = null;
    // Aquí iría la lógica para subir el archivo a Firebase Storage
    // Por ahora solo simulamos la URL
    documentUrl.value = 'https://example.com/document.pdf';
  } catch (err) {
    error.value = 'Error al subir el documento';
    console.error(err);
  } finally {
    uploading.value = false;
  }
};

// Método para guardar la justificación
const saveJustification = async () => {
  if (!isValid.value || !canJustify.value) return;
  const justification: Omit<JustificationData, 'id' | 'createdAt' | 'updatedAt'> = {
    studentId: props.studentId,
    classId: props.classId,
    fecha: props.date,
    reason: reason.value,
    documentUrl: documentUrl.value,
    approvalStatus: 'pending',
    timeLimit: new Date(new Date(props.date).getTime() + 48 * 60 * 60 * 1000),
  };

  try {
    await attendanceStore.addJustification(justification);
    emit('saved');
  } catch (err) {
    error.value = 'Error al guardar la justificación';
    console.error(err);
  }
};
</script>
