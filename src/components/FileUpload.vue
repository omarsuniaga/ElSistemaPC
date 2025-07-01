<!-- components/FileUpload.vue -->
<script setup lang="ts">
import {ref, onMounted} from "vue"
import {getStorage, ref as storageRef, uploadBytesResumable, getDownloadURL} from "firebase/storage"
import {getApp} from "firebase/app"

const props = defineProps<{
  accept?: string
  multiple?: boolean
  label?: string
  maxSize?: number // in MB (not bytes)
  path?: string // Firebase storage path
}>()

const emit = defineEmits<{
  select: [files: FileList]
  success: [url: string]
  error: [message: string]
  progress: [percentage: number]
}>()

const fileInput = ref<HTMLInputElement | null>(null)
const isDragging = ref(false)
const isUploading = ref(false)
const uploadProgress = ref(0)

// Storage setup
const getFirebaseStorage = () => {
  try {
    return getStorage(getApp())
  } catch (error) {
    console.error("Error getting Firebase Storage:", error)
    emit("error", "No se pudo conectar con el almacenamiento")
    return null
  }
}

// Validar Firebase Storage al cargar el componente
onMounted(() => {
  try {
    const storage = getFirebaseStorage()
    if (!storage) {
      console.warn(
        "[FileUpload] No se pudo inicializar Firebase Storage. Verifica la configuración de Firebase."
      )
    } else {
      console.log("[FileUpload] Firebase Storage inicializado correctamente")
    }
  } catch (error) {
    console.error("[FileUpload] Error al validar Firebase Storage:", error)
  }
})

const triggerFileInput = () => {
  if (fileInput.value) {
    fileInput.value.click()
  }
}

const onFilesSelected = (event: Event) => {
  const files = (event.target as HTMLInputElement).files
  if (!files || files.length === 0) return

  validateAndProcessFiles(files)
}

const onDragEnter = (event: DragEvent) => {
  event.preventDefault()
  isDragging.value = true
}

const onDragLeave = (event: DragEvent) => {
  event.preventDefault()
  isDragging.value = false
}

const onDrop = (event: DragEvent) => {
  event.preventDefault()
  isDragging.value = false

  if (!event.dataTransfer) return

  validateAndProcessFiles(event.dataTransfer.files)
}

// Reset the file input
const resetFileInput = () => {
  if (fileInput.value) {
    fileInput.value.value = ""
  }
  return
}

const validateAndProcessFiles = (files: FileList) => {
  // Validate max size (convert MB to bytes)
  if (props.maxSize) {
    const maxSizeBytes = props.maxSize * 1024 * 1024
    for (let i = 0; i < files.length; i++) {
      if (files[i].size > maxSizeBytes) {
        emit(
          "error",
          `El archivo ${files[i].name} excede el tamaño máximo permitido (${props.maxSize}MB)`
        )
        return
      }
    }
  }

  emit("select", files)

  // If path is provided, upload to Firebase
  if (props.path) {
    uploadToFirebase(files[0]) // For now, just upload the first file
  }
}

const uploadToFirebase = async (file: File) => {
  const storage = getFirebaseStorage()
  if (!storage) {
    emit("error", "No se pudo inicializar el almacenamiento de Firebase")
    return
  }

  // Generar un nombre de archivo seguro con timestamp para evitar colisiones
  const timestamp = Date.now()
  const safeFileName = file.name.replace(/[^a-zA-Z0-9.]/g, "_")
  const fileName = `${timestamp}-${safeFileName}`

  // Asegurar que la ruta sea válida (con fallback a 'uploads')
  const uploadPath = props.path || "uploads"
  const filePath = `${uploadPath}/${fileName}`

  // Crear referencia al archivo en Firebase Storage
  const fileRef = storageRef(storage, filePath)

  // Iniciar indicadores de carga
  isUploading.value = true
  uploadProgress.value = 0

  console.log(`[FileUpload] Subiendo archivo a: ${filePath}`)

  // Iniciar la subida con seguimiento de progreso
  const uploadTask = uploadBytesResumable(fileRef, file)

  uploadTask.on(
    "state_changed",
    (snapshot) => {
      // Track upload progress
      const progress = Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100)
      uploadProgress.value = progress
      emit("progress", progress)
    },
    (error) => {
      // Handle errors
      console.error("[FileUpload] Error de subida:", error)
      isUploading.value = false
      emit("error", "Error al subir el archivo: " + error.message)
      resetFileInput()
    },
    async () => {
      // Upload complete
      try {
        const downloadURL = await getDownloadURL(uploadTask.snapshot.ref)
        // Validar que la URL sea válida (contiene el dominio de Firebase Storage)
        if (!downloadURL || typeof downloadURL !== "string") {
          console.error("[FileUpload] URL de descarga inválida:", downloadURL)
          emit("error", "La URL generada no es válida. Verifica la configuración de Firebase.")
          isUploading.value = false
          resetFileInput()
          return
        }

        // Validar que la URL sea de Firebase Storage y no de otro dominio
        if (
          downloadURL.includes("storage.example.com") ||
          !downloadURL.includes("firebasestorage.googleapis.com")
        ) {
          console.error("[FileUpload] URL de descarga no es de Firebase Storage:", downloadURL)
          emit(
            "error",
            "La URL generada no corresponde a Firebase Storage. Verifica la configuración."
          )
          isUploading.value = false
          resetFileInput()
          return
        }

        console.log(`[FileUpload] Archivo subido exitosamente. URL: ${downloadURL}`)
        isUploading.value = false
        resetFileInput()
        emit("success", downloadURL)
      } catch (error: any) {
        console.error("[FileUpload] Error al obtener URL de descarga:", error)
        isUploading.value = false
        resetFileInput()
        emit(
          "error",
          "Error al obtener la URL de descarga: " + (error.message || "Error desconocido")
        )
      }
    }
  )
}
</script>

<template>
  <div
    class="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg transition-colors hover:bg-gray-50 dark:hover:bg-gray-800/50"
    :class="[
      isDragging ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-400 dark:border-blue-600' : '',
      isUploading ? 'cursor-not-allowed' : 'cursor-pointer',
    ]"
    @click="triggerFileInput"
    @dragenter="onDragEnter"
    @dragover.prevent
    @dragleave="onDragLeave"
    @drop="onDrop"
  >
    <input
      ref="fileInput"
      type="file"
      :accept="accept"
      :multiple="multiple"
      class="hidden"
      :disabled="isUploading"
      @change="onFilesSelected"
    />

    <slot>
      <div class="flex flex-col items-center justify-center py-4 px-2">
        <template v-if="isUploading">
          <!-- Upload progress indication -->
          <div class="relative w-16 h-16 mb-2">
            <svg class="transform -rotate-90 w-16 h-16" viewBox="0 0 100 100">
              <circle
                class="text-gray-200 dark:text-gray-700"
                stroke-width="8"
                stroke="currentColor"
                fill="transparent"
                r="40"
                cx="50"
                cy="50"
              />
              <circle
                class="text-primary-600 dark:text-primary-400"
                stroke-width="8"
                :stroke-dasharray="251.2"
                :stroke-dashoffset="251.2 - (uploadProgress / 100) * 251.2"
                stroke-linecap="round"
                stroke="currentColor"
                fill="transparent"
                r="40"
                cx="50"
                cy="50"
              />
            </svg>
            <div class="absolute inset-0 flex items-center justify-center">
              <span class="text-sm font-semibold">{{ uploadProgress }}%</span>
            </div>
          </div>
          <p class="text-sm text-gray-600 dark:text-gray-400">Subiendo archivo...</p>
        </template>
        <template v-else>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            class="h-8 w-8 text-gray-400 mb-2"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
            />
          </svg>
          <p v-if="label" class="text-sm text-gray-600 dark:text-gray-400 text-center">
            {{ label }}
          </p>
          <p v-else class="text-sm text-gray-600 dark:text-gray-400 text-center">
            <span class="font-medium text-blue-600 dark:text-blue-400"> Haz clic o arrastra </span>
            para subir archivo
            <span v-if="maxSize" class="block text-xs mt-1"> (Máximo {{ maxSize }}MB) </span>
          </p>
        </template>
      </div>
    </slot>
  </div>
</template>
