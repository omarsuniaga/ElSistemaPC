<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useStudentsStore } from '../stores/students'
import { PlusCircleIcon } from '@heroicons/vue/24/outline'

const router = useRouter()
const studentsStore = useStudentsStore()

const newStudent = ref({
  nombre: '',
  apellido: '',
  instrumento: '',
  edad: '',
  tlf: '',
  email: '',
  direccion: '',
  observaciones: ''
})

const isLoading = ref(false)
const error = ref<string | null>(null)

const handleSubmit = async () => {
  try {
    isLoading.value = true
    error.value = null
    
    await studentsStore.createStudent(newStudent.value)
    router.push({ name: 'Students' })
  } catch (err: any) {
    error.value = err.message || 'Error al crear el alumno'
  } finally {
    isLoading.value = false
  }
}
</script>

<template>
  <div class="max-w-2xl mx-auto p-4">
    <h1 class="text-2xl font-bold mb-6">Nuevo Alumno</h1>
    
    <form @submit.prevent="handleSubmit" class="space-y-4">
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nombre</label>
          <input 
            v-model="newStudent.nombre" 
            type="text" 
            required
            class="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 py-2 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 dark:text-white"
          />
        </div>
        
        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Apellido</label>
          <input 
            v-model="newStudent.apellido" 
            type="text" 
            required
            class="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 py-2 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 dark:text-white"
          />
        </div>
      </div>
      
      <div>
        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Instrumento</label>
        <input 
          v-model="newStudent.instrumento" 
          type="text" 
          class="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 py-2 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 dark:text-white"
        />
      </div>
      
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Edad</label>
          <input 
            v-model="newStudent.edad" 
            type="text" 
            class="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 py-2 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 dark:text-white"
          />
        </div>
        
        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Teléfono</label>
          <input 
            v-model="newStudent.tlf" 
            type="tel" 
            class="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 py-2 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 dark:text-white"
          />
        </div>
      </div>
      
      <div>
        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email</label>
        <input 
          v-model="newStudent.email" 
          type="email" 
          class="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 py-2 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 dark:text-white"
        />
      </div>
      
      <div>
        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Dirección</label>
        <textarea 
          v-model="newStudent.direccion" 
          rows="2"
          class="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 py-2 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 dark:text-white"
        ></textarea>
      </div>
      
      <div>
        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Observaciones</label>
        <textarea 
          v-model="newStudent.observaciones" 
          rows="3"
          class="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 py-2 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 dark:text-white"
        ></textarea>
      </div>
      
      <div v-if="error" class="bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 p-4 rounded-lg">
        {{ error }}
      </div>
      
      <div class="flex justify-end space-x-3 pt-4">
        <button 
          type="button" 
          @click="router.push({ name: 'Students' })"
          class="btn btn-outline"
        >
          Cancelar
        </button>
        
        <button 
          type="submit" 
          :disabled="isLoading"
          class="btn btn-primary flex items-center gap-2"
        >
          <span v-if="isLoading" class="animate-spin">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M21 12a9 9 0 1 1-6.219-8.56" />
            </svg>
          </span>
          <span v-else>Guardar</span>
        </button>
      </div>
    </form>
  </div>
</template>