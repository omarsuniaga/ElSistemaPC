<template>
  <div
    v-if="show"
    class="fixed inset-0 z-50 overflow-y-auto"
    aria-labelledby="modal-title"
    role="dialog"
    aria-modal="true"
  >
    <div
      class="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0"
    >
      <!-- Background overlay -->
      <div
        class="fixed inset-0 bg-gray-500 bg-opacity-75 dark:bg-gray-900 dark:bg-opacity-75 transition-opacity"
        aria-hidden="true"
        @click="$emit('close')"
      />

      <!-- Modal panel -->
      <div
        class="inline-block align-bottom bg-white dark:bg-gray-800 rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full"
      >
        <div class="absolute top-0 right-0 pt-4 pr-4">
          <button
            type="button"
            class="bg-white dark:bg-gray-800 rounded-md text-gray-400 hover:text-gray-500 dark:hover:text-gray-300 focus:outline-none"
            @click="$emit('close')"
          >
            <span class="sr-only">Cerrar</span>
            <svg
              class="h-6 w-6"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              aria-hidden="true"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        <!-- Student profile content -->
        <div class="bg-white dark:bg-gray-800 px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
          <div class="sm:flex sm:items-start">
            <!-- Student avatar/icon -->
            <div
              class="mx-auto flex-shrink-0 flex items-center justify-center h-16 w-16 rounded-full bg-blue-100 dark:bg-blue-900 sm:mx-0 sm:h-12 sm:w-12"
            >
              <svg
                class="h-8 w-8 text-blue-600 dark:text-blue-300"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                aria-hidden="true"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                />
              </svg>
            </div>

            <!-- Student info -->
            <div class="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left flex-grow">
              <h3
                id="modal-title"
                class="text-lg leading-6 font-medium text-gray-900 dark:text-gray-100"
              >
                {{ student.name }}
              </h3>

              <div class="mt-4 space-y-4">
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div v-if="student.age" class="bg-gray-50 dark:bg-gray-700 p-3 rounded-md">
                    <h4 class="text-sm font-medium text-gray-500 dark:text-gray-400">Edad</h4>
                    <p class="text-base text-gray-900 dark:text-gray-100">{{ student.age }} años</p>
                  </div>

                  <div v-if="student.instrument" class="bg-gray-50 dark:bg-gray-700 p-3 rounded-md">
                    <h4 class="text-sm font-medium text-gray-500 dark:text-gray-400">
                      Instrumento
                    </h4>
                    <p class="text-base text-gray-900 dark:text-gray-100">
                      {{ student.instrument }}
                    </p>
                  </div>

                  <div v-if="student.email" class="bg-gray-50 dark:bg-gray-700 p-3 rounded-md">
                    <h4 class="text-sm font-medium text-gray-500 dark:text-gray-400">Email</h4>
                    <p class="text-base text-gray-900 dark:text-gray-100">{{ student.email }}</p>
                  </div>

                  <div v-if="student.phone" class="bg-gray-50 dark:bg-gray-700 p-3 rounded-md">
                    <h4 class="text-sm font-medium text-gray-500 dark:text-gray-400">Teléfono</h4>
                    <p class="text-base text-gray-900 dark:text-gray-100">{{ student.phone }}</p>
                  </div>

                  <div
                    v-if="student.address"
                    class="bg-gray-50 dark:bg-gray-700 p-3 rounded-md sm:col-span-2"
                  >
                    <h4 class="text-sm font-medium text-gray-500 dark:text-gray-400">Dirección</h4>
                    <p class="text-base text-gray-900 dark:text-gray-100">{{ student.address }}</p>
                  </div>
                </div>

                <div v-if="student.notes" class="bg-gray-50 dark:bg-gray-700 p-3 rounded-md">
                  <h4 class="text-sm font-medium text-gray-500 dark:text-gray-400">Notas</h4>
                  <p class="text-base text-gray-900 dark:text-gray-100">{{ student.notes }}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Actions -->
        <div class="bg-gray-50 dark:bg-gray-700 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
          <button
            class="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm"
            @click="viewFullProfile"
          >
            Ver perfil completo
          </button>
          <button
            type="button"
            class="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 dark:border-gray-600 shadow-sm px-4 py-2 bg-white dark:bg-gray-800 text-base font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
            @click="$emit('close')"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
interface Student {
  id: string
  name: string
  age?: number
  instrument?: string
  email?: string
  phone?: string
  address?: string
  notes?: string
}

const props = defineProps<{
  student: Student
  show: boolean
}>()

const emit = defineEmits(["close", "view-profile"])

// Handle viewing full profile
const viewFullProfile = () => {
  emit("view-profile", props.student.id)
}
</script>

<style scoped>
.transform {
  transition: all 0.3s ease-out;
}

/* Add animation for modal entrance and exit */
.modal-enter-active,
.modal-leave-active {
  transition:
    opacity 0.3s,
    transform 0.3s;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
  transform: translateY(10px);
}
</style>
