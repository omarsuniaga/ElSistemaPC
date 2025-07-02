<template>
  <div class="min-h-screen bg-gray-50 dark:bg-gray-900">
    <!-- Header -->
    <header
      class="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700"
    >
      <div class="px-6 py-4">
        <div class="flex items-center justify-between">
          <div>
            <h1 class="text-2xl font-bold text-gray-900 dark:text-white">Detalle de Clase</h1>
            <p class="mt-1 text-sm text-gray-600 dark:text-gray-400">
              Información detallada de la clase
            </p>
          </div>
        </div>
      </div>
    </header>

    <!-- Main Content -->
    <main class="p-6">
      <div class="max-w-7xl mx-auto">
        <ClassDetailView :id="classId" />
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import ClassDetailView from "../../../modulos/Classes/view/ClassDetailView.vue"

const props = defineProps({
  id: {type: String, required: true},
})

const classId = props.id
</script>
