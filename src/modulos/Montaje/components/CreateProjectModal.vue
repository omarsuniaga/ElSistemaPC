<template>
  <div class="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full flex justify-center items-center z-50">
    <div class="relative p-8 border w-full max-w-2xl shadow-lg rounded-md bg-white">
      <h3 class="text-2xl font-bold text-gray-900 mb-6">Crear Nuevo Proyecto Musical</h3>
      
      <form @submit.prevent="handleSubmit" class="space-y-4">
        <div>
          <label for="projectName" class="block text-sm font-medium text-gray-700">Nombre del Proyecto</label>
          <input type="text" id="projectName" v-model="form.name" required
                 class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm" />
        </div>
        
        <div>
          <label for="projectDescription" class="block text-sm font-medium text-gray-700">Descripción</label>
          <textarea id="projectDescription" v-model="form.description" rows="3"
                    class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"></textarea>
        </div>

        <div>
          <label for="director" class="block text-sm font-medium text-gray-700">Director</label>
          <input type="text" id="director" v-model="form.director" required
                 class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm" />
        </div>

        <div>
          <label for="organization" class="block text-sm font-medium text-gray-700">Organización</label>
          <input type="text" id="organization" v-model="form.organization" required
                 class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm" />
        </div>

        <div>
          <label for="season" class="block text-sm font-medium text-gray-700">Temporada</label>
          <input type="text" id="season" v-model="form.season"
                 class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm" />
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label for="startDate" class="block text-sm font-medium text-gray-700">Fecha de Inicio</label>
            <input type="date" id="startDate" v-model="form.startDate" required
                   class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm" />
          </div>
          <div>
            <label for="endDate" class="block text-sm font-medium text-gray-700">Fecha de Fin</label>
            <input type="date" id="endDate" v-model="form.endDate" required
                   class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm" />
          </div>
        </div>

        <div class="flex justify-end space-x-3 mt-6">
          <button type="button" @click="$emit('close')"
                  class="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500">
            Cancelar
          </button>
          <button type="submit"
                  class="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
            Crear Proyecto
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, defineEmits } from 'vue'
import { useMontaje } from '../composables/useMontaje'

const emit = defineEmits(['close', 'projectCreated'])
const { createProject } = useMontaje()

const form = ref({
  name: '',
  description: '',
  director: '',
  organization: '',
  season: '',
  startDate: new Date().toISOString().split('T')[0],
  endDate: '',
})

const handleSubmit = async () => {
  try {
    const projectId = await createProject(
      form.value.name,
      form.value.description,
      form.value.director,
      form.value.organization,
      form.value.season,
      form.value.startDate,
      form.value.endDate
    )
    emit('projectCreated', projectId)
    emit('close')
  } catch (error) {
    console.error("Error al crear el proyecto:", error)
    alert("Error al crear el proyecto. Consulta la consola para más detalles.")
  }
}
</script>

<style scoped>
/* Puedes añadir estilos específicos del modal aquí si es necesario */
</style>
