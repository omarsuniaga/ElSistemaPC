<template>
  <div
    class="fixed inset-0 bg-gray-900/75 backdrop-blur-sm transition-opacity z-[100]"
    v-if="show"
    @click="$emit('close')"
  ></div>
  <div
    class="fixed inset-y-0 right-0 max-w-full flex z-[100] transform transition-all duration-300 ease-in-out"
    :class="{ 'translate-x-0': show, 'translate-x-full': !show }"
  >
    <div
      class="relative w-screen max-w-md bg-white dark:bg-gray-800 shadow-xl flex flex-col h-full"
      @click.stop
    >
      <!-- Header -->
      <div class="px-4 py-3 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
        <h2 class="text-lg font-medium text-gray-900 dark:text-white">Perfil del Maestro</h2>
        <button
          @click="$emit('close')"
          class="rounded-md text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500"
        >
          <span class="sr-only">Cerrar</span>
          <svg class="h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <!-- Content -->
      <div class="flex-1 overflow-y-auto pb-16">
        <div v-if="!teacher" class="flex justify-center items-center h-full">
          <p class="text-gray-500 dark:text-gray-400">Selecciona un maestro para ver sus detalles</p>
        </div>

        <div v-else class="space-y-6 p-4">
          <!-- Teacher Profile -->
          <div class="flex items-center space-x-4">
            <img
              :src="teacher.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${teacher.name}`"
              :alt="teacher.name"
              class="w-16 h-16 rounded-full"
            />
            <div>
              <h3 class="text-xl font-bold">{{ teacher.name }}</h3>
              <div class="flex flex-wrap gap-1 mt-1">
                <span
                  v-for="specialty in teacher.specialties || []"
                  :key="specialty"
                  class="px-2 py-0.5 text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200 rounded-full"
                >
                  {{ specialty }}
                </span>
              </div>
            </div>
          </div>

          <!-- Teacher Info -->
          <div class="bg-gray-50 dark:bg-gray-700/30 rounded-lg p-4 space-y-3">
            <h4 class="font-medium">Información Personal</h4>
            <div class="grid grid-cols-2 gap-3 text-sm">
              <div>
                <span class="text-gray-500 dark:text-gray-400">Edad:</span>
                <span class="ml-1 font-medium">{{ teacher.edad || "No disponible" }} años</span>
              </div>
              <div>
                <span class="text-gray-500 dark:text-gray-400">Teléfono:</span>
                <span class="ml-1 font-medium">{{ teacher.phone || "No disponible" }}</span>
              </div>
              <div class="col-span-2">
                <span class="text-gray-500 dark:text-gray-400">Email:</span>
                <span class="ml-1 font-medium">{{ teacher.email || "No disponible" }}</span>
              </div>
            </div>
          </div>

          <!-- Classes Section -->
          <div class="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
            <div class="bg-gray-50 dark:bg-gray-700/30 px-4 py-3 border-b border-gray-200 dark:border-gray-700">
              <h4 class="font-medium">Clases Asignadas</h4>
            </div>
            <div class="p-4">
              <div v-if="teacher.clases && teacher.clases.length > 0">
                <ul class="space-y-2">
                  <li 
                    v-for="(clase, index) in teacher.clases" 
                    :key="index"
                    class="flex items-center gap-2"
                  >
                    <div class="h-2 w-2 rounded-full bg-green-500"></div>
                    <span>{{ clase }}</span>
                  </li>
                </ul>
              </div>
              <div v-else class="text-center py-2 text-gray-500 dark:text-gray-400">
                No hay clases asignadas
              </div>
            </div>
          </div>

          <!-- Specialties Details -->
          <div class="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
            <div class="bg-gray-50 dark:bg-gray-700/30 px-4 py-3 border-b border-gray-200 dark:border-gray-700">
              <h4 class="font-medium">Especialidades</h4>
            </div>
            <div class="p-4">
              <div v-if="teacher.specialties && teacher.specialties.length > 0">
                <div class="flex flex-wrap gap-2">
                  <span 
                    v-for="(specialty, index) in teacher.specialties" 
                    :key="index"
                    class="px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200 rounded-full text-sm"
                  >
                    {{ specialty }}
                  </span>
                </div>
              </div>
              <div v-else class="text-center py-2 text-gray-500 dark:text-gray-400">
                No hay especialidades registradas
              </div>
            </div>
          </div>

          <!-- Action Buttons -->
          <div class="border-t border-gray-200 dark:border-gray-700 p-4">
            <div class="flex gap-3">
              <button 
                @click="$emit('edit', teacher.id)" 
                class="btn btn-outline-primary flex items-center justify-center flex-1"
              >
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                Editar Maestro
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps({
  show: {
    type: Boolean,
    required: true
  },
  teacher: {
    type: Object,
    default: null
  }
})

defineEmits(['close', 'edit'])
</script>
