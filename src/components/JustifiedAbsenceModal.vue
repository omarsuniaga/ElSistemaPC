<!-- components/JustifiedAbsenceModal.vue -->
<script setup lang="ts">
import {ref} from "vue"

defineProps<{
  student: any
}>()

const emit = defineEmits(["close", "save"])

const reason = ref("")
const file = ref<File | null>(null)
const isUploading = ref(false)
const documentUrl = ref("")
const errorMessage = ref("")

const handleFileChange = (event: Event) => {
  const input = event.target as HTMLInputElement
  if (input.files && input.files.length > 0) {
    file.value = input.files[0]
  }
}

const save = () => {
  if (!reason.value.trim()) {
    errorMessage.value = "Por favor ingrese una razón para la justificación"
    return
  }

  // Enviar tanto la razón como el archivo si existe
  emit("save", {
    reason: reason.value,
    documentUrl: documentUrl.value,
    file: file.value,
  })

  close()
}

const close = () => {
  reason.value = ""
  file.value = null
  documentUrl.value = ""
  errorMessage.value = ""
  emit("close")
}

// Make sure the component is exported as default
defineExpose({})
if (import.meta.env?.PROD === false) {
  // @ts-ignore - This ensures the component has a default export
  // which helps with certain bundlers and IDE tooling
  const _default = {}
}
</script>

<template>
  <div
    v-if="$props.student"
    class="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50"
  >
    <div class="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-xl max-w-md w-full">
      <h2 class="text-lg font-semibold mb-4">Justificar Ausencia</h2>
      <p class="mb-4">Estudiante: {{ $props.student.nombre }} {{ $props.student.apellido }}</p>

      <div class="mb-4">
        <label for="reason" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
          >Razón:</label
        >
        <textarea
          id="reason"
          v-model="reason"
          rows="3"
          class="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
          placeholder="Explique la razón de la ausencia"
        />
        <p v-if="errorMessage" class="mt-1 text-sm text-red-600">{{ errorMessage }}</p>
      </div>

      <div class="mb-4">
        <label
          for="document"
          class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
          >Documento de soporte (opcional):</label
        >
        <input
          id="document"
          type="file"
          class="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100 dark:file:bg-primary-900 dark:file:text-primary-300"
          @change="handleFileChange"
        />
        <p class="mt-1 text-sm text-gray-500">
          Adjunte un documento que justifique la ausencia (PDF, imagen, etc.)
        </p>
        <div v-if="file" class="mt-2 text-sm text-gray-600 dark:text-gray-400">
          Archivo seleccionado: {{ file.name }}
        </div>
      </div>

      <div class="mt-4 flex justify-end gap-2">
        <button class="btn btn-secondary" @click="close">Cancelar</button>
        <button class="btn btn-primary" :disabled="isUploading" @click="save">
          <span v-if="isUploading">
            <svg
              class="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                class="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                stroke-width="4"
              />
              <path
                class="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            Subiendo...
          </span>
          <span v-else>Guardar</span>
        </button>
      </div>
    </div>
  </div>
</template>
