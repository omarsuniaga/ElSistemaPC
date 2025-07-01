<template>
  <div class="container mx-auto px-4 py-8">
    <div class="max-w-4xl mx-auto">
      <div class="flex items-center mb-6">
        <button
          class="mr-3 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
          @click="goBack"
        >
          <svg
            class="h-6 w-6"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M10 19l-7-7m0 0l7-7m-7 7h18"
            />
          </svg>
        </button>
        <h1 class="text-2xl font-bold text-gray-900 dark:text-gray-100">
          Añadir Estudiante a Clase
        </h1>
      </div>

      <div class="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
        <p class="text-gray-600 dark:text-gray-300 mb-6">
          Seleccione los estudiantes que desea añadir a la clase {{ className || classId }}.
        </p>

        <!-- Content will be implemented later -->
        <div class="text-center py-8">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            class="h-16 w-16 mx-auto text-gray-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M12 6v6m0 0v6m0-6h6m-6 0H6"
            />
          </svg>
          <p class="mt-4 text-lg text-gray-500">Esta funcionalidad está en desarrollo</p>
          <p class="mt-2 text-gray-500">
            Por favor, utilice temporalmente la sección de administración de estudiantes
          </p>
          <button
            class="mt-6 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            @click="goBack"
          >
            Volver atrás
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import {ref, onMounted} from "vue"
import {useRoute, useRouter} from "vue-router"

const route = useRoute()
const router = useRouter()

const classId = ref(route.params.classId as string)
const className = ref("")

onMounted(() => {
  // You could fetch class details here if needed
})

const goBack = () => {
  router.back()
}
</script>
