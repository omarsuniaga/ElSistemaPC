<template>
  <div
    class="fixed inset-0 z-50 overflow-y-auto"
    aria-labelledby="modal-title"
    role="dialog"
    aria-modal="true"
  >
    <!-- Background overlay -->
    <div
      class="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0"
    >
      <div
        class="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
        aria-hidden="true"
        @click="handleCancel"
      />

      <!-- Modal positioning -->
      <span class="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true"
        >&#8203;</span
      >

      <!-- Modal content -->
      <div
        class="relative inline-block align-bottom bg-white dark:bg-gray-800 rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full sm:p-6"
      >
        <!-- Header -->
        <div
          class="flex items-center justify-between pb-4 border-b border-gray-200 dark:border-gray-600"
        >
          <div>
            <h3 id="modal-title" class="text-lg font-medium text-gray-900 dark:text-white">
              Editar Estudiante
            </h3>
            <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Modifica la información del estudiante.
            </p>
          </div>
          <button
            class="rounded-md text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
            @click="handleCancel"
          >
            <XMarkIcon class="h-6 w-6" />
          </button>
        </div>

        <!-- Form -->
        <form class="mt-6" @submit.prevent="handleSubmit">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <!-- Personal Information Section -->
            <div class="col-span-2">
              <h4 class="text-base font-medium text-gray-900 dark:text-white mb-4">
                Información Personal
              </h4>
            </div>

            <!-- Full Name -->
            <div>
              <label for="name" class="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Nombre Completo *
              </label>
              <input
                id="name"
                v-model="formData.name"
                type="text"
                required
                class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                :class="{'border-red-500': errors.name}"
              />
              <p v-if="errors.name" class="mt-1 text-sm text-red-600">{{ errors.name }}</p>
            </div>

            <!-- Email -->
            <div>
              <label for="email" class="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Email *
              </label>
              <input
                id="email"
                v-model="formData.email"
                type="email"
                required
                class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                :class="{'border-red-500': errors.email}"
              />
              <p v-if="errors.email" class="mt-1 text-sm text-red-600">{{ errors.email }}</p>
            </div>

            <!-- Phone -->
            <div>
              <label for="phone" class="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Teléfono
              </label>
              <input
                id="phone"
                v-model="formData.phone"
                type="tel"
                class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              />
            </div>

            <!-- Age -->
            <div>
              <label for="age" class="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Edad
              </label>
              <input
                id="age"
                v-model="formData.age"
                type="number"
                min="1"
                max="120"
                class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              />
            </div>

            <!-- Status -->
            <div>
              <label
                for="status"
                class="block text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                Estado
              </label>
              <select
                id="status"
                v-model="formData.status"
                class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              >
                <option value="active">Activo</option>
                <option value="inactive">Inactivo</option>
                <option value="suspended">Suspendido</option>
              </select>
            </div>

            <!-- Enrollment Date -->
            <div>
              <label
                for="enrollmentDate"
                class="block text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                Fecha de Inscripción
              </label>
              <input
                id="enrollmentDate"
                v-model="formData.enrollmentDate"
                type="date"
                class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              />
            </div>

            <!-- Notes -->
            <div class="col-span-2">
              <label for="notes" class="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Notas Adicionales
              </label>
              <textarea
                id="notes"
                v-model="formData.notes"
                rows="3"
                class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                placeholder="Información adicional sobre el estudiante..."
              />
            </div>
          </div>

          <!-- Form Actions -->
          <div
            class="flex items-center justify-end space-x-3 mt-6 pt-4 border-t border-gray-200 dark:border-gray-600"
          >
            <button
              type="button"
              class="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-700"
              @click="handleCancel"
            >
              Cancelar
            </button>
            <button
              type="submit"
              :disabled="isSubmitting"
              class="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span v-if="isSubmitting" class="flex items-center">
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
                Guardando...
              </span>
              <span v-else>Guardar Cambios</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import {ref, reactive, onMounted} from "vue"
import {XMarkIcon} from "@heroicons/vue/24/outline"

// Props
interface Props {
  student?: any
}

const props = withDefaults(defineProps<Props>(), {
  student: null,
})

// Emits
const emit = defineEmits<{
  cancel: []
  submit: [data: any]
}>()

// Form data
const formData = reactive({
  name: "",
  email: "",
  phone: "",
  age: null as number | null,
  status: "active",
  enrollmentDate: "",
  notes: "",
})

// Form state
const isSubmitting = ref(false)
const errors = reactive({
  name: "",
  email: "",
})

// Initialize form data when editing
onMounted(() => {
  if (props.student) {
    Object.assign(formData, {
      name: props.student.name || "",
      email: props.student.email || "",
      phone: props.student.phone || "",
      age: props.student.age || null,
      status: props.student.status || "active",
      enrollmentDate: props.student.enrollmentDate || "",
      notes: props.student.notes || "",
    })
  }
})

// Validate form
const validateForm = () => {
  errors.name = ""
  errors.email = ""

  let isValid = true

  if (!formData.name.trim()) {
    errors.name = "El nombre es requerido"
    isValid = false
  }

  if (!formData.email.trim()) {
    errors.email = "El email es requerido"
    isValid = false
  } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
    errors.email = "El email no tiene un formato válido"
    isValid = false
  }

  return isValid
}

// Handle form submission
const handleSubmit = async () => {
  if (!validateForm()) {
    return
  }

  isSubmitting.value = true

  try {
    // Prepare data for submission
    const submitData = {
      ...formData,
      id: props.student?.id || null,
    }

    emit("submit", submitData)
  } catch (error) {
    console.error("Error al enviar el formulario:", error)
  } finally {
    isSubmitting.value = false
  }
}

// Handle cancel
const handleCancel = () => {
  emit("cancel")
}
</script>
