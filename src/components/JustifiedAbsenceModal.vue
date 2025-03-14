<script setup lang="ts">
import { ref, computed } from 'vue'
import { Dialog, DialogPanel } from '@headlessui/vue'
import FileUpload from './FileUpload.vue'

const props = defineProps<{
  student: {
    id: string;
    nombre: string;
    apellido: string;
  } | null;
  date?: string;
}>()

const emit = defineEmits<{
  (e: 'save', data: { reason: string; documentUrl?: string; file?: File }): void
  (e: 'close'): void
}>()

const reason = ref('')
const file = ref<File | null>(null)
const error = ref('')
const isUploading = ref(false)
const uploadProgress = ref(0)

// Computed property for the formatted date
const formattedDate = computed(() => {
  if (!props.date) return new Date().toLocaleDateString()
  return new Date(props.date).toLocaleDateString()
})

// Computed property for the student's full name
const studentName = computed(() => {
  if (!props.student) return ''
  return `${props.student.nombre} ${props.student.apellido}`
})

const handleSubmit = async () => {
  if (!reason.value.trim()) {
    error.value = 'La razón es requerida'
    return
  }

  try {
    isUploading.value = true
    
    // Instead of uploading the file here, we'll pass it to the parent component
    // to be handled by the attendance store
    emit('save', {
      reason: reason.value,
      file: file.value || undefined
    })
  } catch (err) {
    console.error('Error processing justification:', err)
    error.value = 'Error al procesar la justificación'
  } finally {
    isUploading.value = false
  }
}

const handleFileSelect = (files: FileList) => {
  if (files.length > 0) {
    file.value = files[0]
  }
}
</script>

<template>
  <Dialog :open="true" @close="emit('close')" class="relative z-50">
    <div class="fixed inset-0 bg-black/30" aria-hidden="true" />
    <div class="fixed inset-0 flex items-center justify-center p-4">
      <DialogPanel class="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full">
        <h2 class="text-lg font-semibold mb-4">Justificar Ausencia</h2>
        
        <div class="mb-4">
          <p class="text-sm text-gray-600 dark:text-gray-400">
            Alumno: {{ studentName }}
          </p>
          <p class="text-sm text-gray-600 dark:text-gray-400">
            Fecha: {{ formattedDate }}
          </p>
        </div>

        <form @submit.prevent="handleSubmit" class="space-y-4">
          <div>
            <label class="block text-sm font-medium mb-1">Razón</label>
            <textarea
              v-model="reason"
              rows="3"
              class="input"
              placeholder="Ingrese la razón de la ausencia..."
              required
            ></textarea>
          </div>

          <div>
            <label class="block text-sm font-medium mb-1">Comprobante (opcional)</label>
            <FileUpload
              accept="image/*,.pdf"
              @select="handleFileSelect"
              show-preview
            />
          </div>

          <div v-if="error" class="text-red-600 text-sm">
            {{ error }}
          </div>

          <div class="flex justify-end gap-3">
            <button
              type="button"
              @click="emit('close')"
              class="btn bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600"
            >
              Cancelar
            </button>
            <button
              type="submit"
              class="btn btn-primary"
            >
              Guardar
            </button>
          </div>
        </form>
      </DialogPanel>
    </div>
  </Dialog>
</template>