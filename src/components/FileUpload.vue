```vue
<script setup lang="ts">
import { ref, computed } from 'vue'
import { 
  CloudArrowUpIcon,
  DocumentIcon,
  PhotoIcon,
  XMarkIcon
} from '@heroicons/vue/24/outline'

const props = defineProps<{
  accept?: string
  multiple?: boolean
  maxSize?: number // in MB
  label?: string
  showPreview?: boolean
}>()

const emit = defineEmits<{
  (e: 'select', files: FileList): void
  (e: 'error', message: string): void
}>()

const fileInput = ref<HTMLInputElement | null>(null)
const isUploading = ref(false)
const uploadProgress = ref(0)
const dragOver = ref(false)
const selectedFiles = ref<File[]>([])
const error = ref('')

const acceptedTypes = computed(() => {
  if (!props.accept) return []
  return props.accept.split(',').map(type => type.trim())
})

const iconComponent = computed(() => {
  if (props.accept?.includes('image')) return PhotoIcon
  if (props.accept?.includes('application') || props.accept?.includes('text')) return DocumentIcon
  return CloudArrowUpIcon
})

const handleClick = () => {
  fileInput.value?.click()
}

const validateFile = (file: File): boolean => {
  // Check file type
  if (acceptedTypes.value.length > 0) {
    const fileType = file.type || ''
    const isValidType = acceptedTypes.value.some(type => 
      fileType.startsWith(type.replace('*', ''))
    )
    if (!isValidType) {
      error.value = 'Tipo de archivo no permitido'
      return false
    }
  }

  // Check file size
  if (props.maxSize && file.size > props.maxSize * 1024 * 1024) {
    error.value = `El archivo excede el tamaño máximo de ${props.maxSize}MB`
    return false
  }

  return true
}

const handleChange = (event: Event) => {
  const input = event.target as HTMLInputElement
  if (!input.files?.length) return

  error.value = ''
  const validFiles: File[] = []

  Array.from(input.files).forEach(file => {
    if (validateFile(file)) {
      validFiles.push(file)
    }
  })

  if (validFiles.length > 0) {
    selectedFiles.value = props.multiple ? validFiles : [validFiles[0]]
    emit('select', input.files)
  } else if (error.value) {
    emit('error', error.value)
  }

  input.value = '' // Reset input
}

const handleDrop = (event: DragEvent) => {
  event.preventDefault()
  dragOver.value = false

  if (!event.dataTransfer?.files.length) return

  error.value = ''
  const validFiles: File[] = []

  Array.from(event.dataTransfer.files).forEach(file => {
    if (validateFile(file)) {
      validFiles.push(file)
    }
  })

  if (validFiles.length > 0) {
    selectedFiles.value = props.multiple ? validFiles : [validFiles[0]]
    emit('select', event.dataTransfer.files)
  } else if (error.value) {
    emit('error', error.value)
  }
}

const handleDragOver = (event: DragEvent) => {
  event.preventDefault()
  dragOver.value = true
}

const handleDragLeave = (event: DragEvent) => {
  event.preventDefault()
  dragOver.value = false
}

const removeFile = (index: number) => {
  selectedFiles.value.splice(index, 1)
}
</script>

<template>
  <div>
    <input
      ref="fileInput"
      type="file"
      :accept="accept"
      :multiple="multiple"
      class="hidden"
      @change="handleChange"
    />

    <div
      class="relative"
      @drop="handleDrop"
      @dragover="handleDragOver"
      @dragleave="handleDragLeave"
    >
      <!-- Upload Area -->
      <div
        class="flex flex-col items-center justify-center p-6 border-2 border-dashed rounded-lg transition-colors"
        :class="[
          dragOver ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/10' : 'border-gray-300 dark:border-gray-600',
          error ? 'border-red-500 bg-red-50 dark:bg-red-900/10' : ''
        ]"
      >
        <!-- Icon -->
        <component
          :is="iconComponent"
          class="w-12 h-12 mb-4"
          :class="dragOver ? 'text-primary-500' : 'text-gray-400'"
        />

        <!-- Label -->
        <p class="text-sm text-center mb-2">
          <span class="font-medium text-primary-600 dark:text-primary-400">
            {{ label || 'Subir archivo' }}
          </span>
          <span class="text-gray-500 dark:text-gray-400">
            o arrastra y suelta
          </span>
        </p>

        <!-- File types -->
        <p v-if="accept" class="text-xs text-gray-500 dark:text-gray-400">
          {{ accept.split(',').join(', ') }}
        </p>

        <!-- Max size -->
        <p v-if="maxSize" class="text-xs text-gray-500 dark:text-gray-400">
          Máximo {{ maxSize }}MB
        </p>

        <!-- Error message -->
        <p v-if="error" class="mt-2 text-sm text-red-600 dark:text-red-400">
          {{ error }}
        </p>

        <!-- Upload button -->
        <button
          type="button"
          @click="handleClick"
          class="mt-4 btn bg-primary-600 text-white hover:bg-primary-700"
        >
          Seleccionar Archivo{{ multiple ? 's' : '' }}
        </button>
      </div>

      <!-- File Preview -->
      <div v-if="showPreview && selectedFiles.length > 0" class="mt-4 space-y-2">
        <div
          v-for="(file, index) in selectedFiles"
          :key="index"
          class="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-800 rounded"
        >
          <div class="flex items-center gap-2">
            <DocumentIcon class="w-5 h-5 text-gray-400" />
            <span class="text-sm">{{ file.name }}</span>
          </div>
          <button
            @click="removeFile(index)"
            class="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded"
          >
            <XMarkIcon class="w-4 h-4" />
          </button>
        </div>
      </div>

      <!-- Progress Bar -->
      <div
        v-if="isUploading"
        class="mt-4 h-2 bg-gray-200 dark:bg-gray-700 rounded overflow-hidden"
      >
        <div
          class="h-full bg-primary-600 transition-all duration-300"
          :style="{ width: `${uploadProgress}%` }"
        ></div>
      </div>
    </div>
  </div>
</template>
```