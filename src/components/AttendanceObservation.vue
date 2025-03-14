<template>
  <div
    v-if="modelValue"
    class="fixed inset-0 flex items-center justify-center z-50"
  >
    <div class="absolute inset-0 bg-black/50" @click="close"></div>
    <div class="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-2xl z-10">
      <div class="p-6">
        <div class="flex justify-between items-center mb-6">
          <h2 class="text-xl font-bold">Observaciones de Asistencia</h2>
          <button @click="close" class="text-gray-500 hover:text-gray-700">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <!-- Información de contexto -->
        <div class="mb-4 p-4 bg-gray-100 dark:bg-gray-700 rounded-lg">
          <p><strong>Estudiante:</strong> {{ studentName }}</p>
          <p><strong>Clase:</strong> {{ className }}</p>
          <p><strong>Fecha:</strong> {{ formatDate(attendanceDate) }}</p>
        </div>

        <!-- Lista de observaciones existentes -->
        <div v-if="observations.length > 0" class="mb-6">
          <h3 class="text-lg font-medium mb-3">Observaciones previas</h3>
          <div class="space-y-3">
            <div v-for="obs in observations" :key="obs.id" 
                 class="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <div class="flex justify-between items-start">
                <div class="text-sm text-gray-600 dark:text-gray-400">
                  {{ formatDate(obs.fecha) }} - {{ obs.maestroNombre }}
                </div>
                <button @click="deleteObservation(obs.id)" 
                        class="text-red-500 hover:text-red-700">
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" 
                       viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" 
                          stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <p class="mt-1">{{ obs.observacion }}</p>
            </div>
          </div>
        </div>

        <!-- Formulario para nueva observación -->
        <div class="mb-6">
          <h3 class="text-lg font-medium mb-3">Nueva observación</h3>
          <textarea
            v-model="newObservation"
            rows="4"
            class="w-full p-3 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
            placeholder="Escriba su observación aquí..."
          ></textarea>
          <div class="text-sm text-gray-500 mt-1">
            {{ characterCount }}/500 caracteres
          </div>
        </div>

        <!-- Botones de acción -->
        <div class="flex justify-end gap-3">
          <button @click="close" class="btn">
            Cancelar
          </button>
          <button 
            @click="saveObservation"
            :disabled="!newObservation.trim() || isLoading"
            class="btn btn-primary"
          >
            <span v-if="isLoading">Guardando...</span>
            <span v-else>Guardar observación</span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { useFirestoreStore } from '../stores/firestore'
import { useAuthStore } from '../stores/auth'

const props = defineProps<{
  modelValue: boolean
  studentId: string
  studentName: string
  classId: string
  className: string
  attendanceId: string
  attendanceDate: string
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
  (e: 'observation-added'): void
}>()

const firestoreStore = useFirestoreStore()
const authStore = useAuthStore()

const newObservation = ref('')
const isLoading = ref(false)
const observations = ref<any[]>([])

// Formatear fecha
const formatDate = (date: string) => {
  return format(new Date(date), 'PPP', { locale: es })
}

// Contador de caracteres
const characterCount = computed(() => newObservation.value.length)

const close = () => {
  emit('update:modelValue', false)
  newObservation.value = ''
}

// Cargar observaciones existentes
const loadObservations = async () => {
  try {
    const obs = await firestoreStore.getObservations(props.attendanceId)
    observations.value = obs
  } catch (error: any) {
    console.error('Error al cargar observaciones:', error)
    // Mostrar un mensaje más amigable si es un error de índice
    if (error?.message?.includes('requires an index')) {
      // El error ya está siendo manejado en el store con una solución alternativa
      // pero podríamos mostrar un mensaje al usuario si es necesario
    }
  }
}

// Guardar nueva observación
const saveObservation = async () => {
  if (!newObservation.value.trim()) return

  isLoading.value = true
  try {
    const observation = {
      maestroId: authStore.user?.uid,
      maestroNombre: authStore.user?.displayName || 'Maestro',
      claseId: props.classId,
      claseNombre: props.className,
      fecha: new Date().toISOString(),
      observacion: newObservation.value.trim(),
      asistenciaId: props.attendanceId
    }

    await firestoreStore.addObservation(observation)
    
    newObservation.value = ''
    emit('observation-added')
    await loadObservations()
  } catch (error) {
    console.error('Error al guardar observación:', error)
  } finally {
    isLoading.value = false
  }
}

// Eliminar observación
const deleteObservation = async (observationId: string) => {
  if (!confirm('¿Está seguro de eliminar esta observación?')) return

  try {
    await firestoreStore.deleteObservation(observationId)
    await loadObservations()
  } catch (error) {
    console.error('Error al eliminar observación:', error)
  }
}

// Cargar observaciones al montar el componente
loadObservations()
</script>