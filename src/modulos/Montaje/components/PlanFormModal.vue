<template>
  <div
    v-if="isOpen"
    class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
    @click.self="closeModal"
  >
    <div class="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
      <!-- Header -->
      <div class="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 rounded-t-lg">
        <div class="flex items-center justify-between">
          <h2 class="text-xl font-semibold text-gray-900">
            {{ isEditing ? 'Editar Plan de Montaje' : 'Nuevo Plan de Montaje' }}
          </h2>
          <button
            @click="closeModal"
            class="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
            </svg>
          </button>
        </div>
      </div>

      <!-- Content -->
      <form @submit.prevent="handleSubmit" class="p-6 space-y-6">
        <!-- Basic Information -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">
              Nombre del Plan *
            </label>
            <input
              v-model="form.nombre"
              type="text"
              required
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Ej: Plan de Montaje Semestral"
            >
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">
              Obra Asociada *
            </label>
            <select
              v-model="form.obraId"
              required
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Seleccionar obra...</option>
              <option
                v-for="obra in availableWorks"
                :key="obra.id"
                :value="obra.id"
              >
                {{ obra.titulo }} - {{ obra.compositor }}
              </option>
            </select>
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">
              Maestro Responsable
            </label>
            <input
              v-model="form.maestroResponsableNombre"
              type="text"
              disabled
              class="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100 focus:outline-none"
            >
          </div>
        </div>

        <!-- Description -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">
            Descripción
          </label>
          <textarea
            v-model="form.descripcion"
            rows="3"
            class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Descripción del plan de montaje..."
          ></textarea>
        </div>

        <!-- Dates -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">
              Fecha de Inicio *
            </label>
            <input
              v-model="form.fechaInicio"
              type="date"
              required
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">
              Fecha de Finalización *
            </label>
            <input
              v-model="form.fechaFin"
              type="date"
              required
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
          </div>
        </div>

        <!-- Goals -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">
            Objetivos del Plan
          </label>
          <div class="space-y-2">
            <div
              v-for="(objetivo, index) in form.objetivos"
              :key="index"
              class="flex items-center space-x-2"
            >
              <input
                v-model="form.objetivos[index]"
                type="text"
                class="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Objetivo del plan..."
              >
              <button
                type="button"
                @click="removeObjective(index)"
                class="text-red-500 hover:text-red-700 p-1"
              >
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                </svg>
              </button>
            </div>
            <button
              type="button"
              @click="addObjective"
              class="text-blue-600 hover:text-blue-800 text-sm font-medium"
            >
              + Agregar Objetivo
            </button>
          </div>
        </div>

        <!-- Phases -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-4">
            Fases del Plan
          </label>
          <div class="space-y-4">
            <div
              v-for="(fase, index) in form.fases"
              :key="index"
              class="border border-gray-200 rounded-lg p-4"
            >
              <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-3">
                <input
                  v-model="fase.nombre"
                  type="text"
                  placeholder="Nombre de la fase"
                  class="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                <input
                  v-model="fase.fechaInicio"
                  type="date"
                  class="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                <input
                  v-model="fase.fechaFin"
                  type="date"
                  class="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
              </div>
              <textarea
                v-model="fase.descripcion"
                placeholder="Descripción de la fase..."
                rows="2"
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 mb-2"
              ></textarea>
              <div class="flex justify-end">
                <button
                  type="button"
                  @click="removePhase(index)"
                  class="text-red-500 hover:text-red-700 text-sm"
                >
                  Eliminar Fase
                </button>
              </div>
            </div>
            <button
              type="button"
              @click="addPhase"
              class="text-blue-600 hover:text-blue-800 text-sm font-medium"
            >
              + Agregar Fase
            </button>
          </div>
        </div>

        <!-- Form Actions -->
        <div class="flex justify-end space-x-3 pt-6 border-t border-gray-200">
          <button
            type="button"
            @click="closeModal"
            class="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
          >
            Cancelar
          </button>
          <button
            type="submit"
            :disabled="isSubmitting"
            class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            {{ isSubmitting ? 'Guardando...' : (isEditing ? 'Actualizar' : 'Crear Plan') }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useMontaje } from '../composables/useMontaje'
import type { PlanAccion, Obra } from '../types'
import { useAuthStore } from '@/stores/auth';

interface Props {
  isOpen: boolean
  plan?: PlanAccion | null
  availableWorks: Obra[]
}

interface Emits {
  (e: 'close'): void
  (e: 'saved', plan: PlanAccion): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const { createPlan, updatePlan } = useMontaje()
const authStore = useAuthStore();

const isSubmitting = ref(false)

const isEditing = computed(() => !!props.plan)

const form = ref({
  nombre: '',
  descripcion: '',
  obraId: '',
  fechaInicio: '',
  fechaFin: '',
  maestroResponsableId: authStore.user?.uid || '',
  maestroResponsableNombre: authStore.user?.displayName || '',
  objetivos: [''],
  fases: [{
    nombre: '',
    descripcion: '',
    fechaInicio: '',
    fechaFin: '',
    orden: 1
  }]
})

watch(() => props.plan, (newPlan) => {
  if (newPlan) {
    form.value = {
      nombre: newPlan.nombre,
      descripcion: newPlan.descripcion || '',
      obraId: newPlan.obraId,
      fechaInicio: newPlan.fechaInicio.split('T')[0],
      fechaFin: newPlan.fechaFin.split('T')[0],
      maestroResponsableId: newPlan.maestroResponsableId || authStore.user?.uid || '',
      maestroResponsableNombre: newPlan.maestroResponsableNombre || authStore.user?.displayName || '',
      objetivos: newPlan.objetivos.length > 0 ? [...newPlan.objetivos] : [''],
      fases: newPlan.fases.length > 0 ? [...newPlan.fases] : [{
        nombre: '',
        descripcion: '',
        fechaInicio: '',
        fechaFin: '',
        orden: 1
      }]
    }
  }
}, { immediate: true })

const addObjective = () => {
  form.value.objetivos.push('')
}

const removeObjective = (index: number) => {
  if (form.value.objetivos.length > 1) {
    form.value.objetivos.splice(index, 1)
  }
}

const addPhase = () => {
  form.value.fases.push({
    nombre: '',
    descripcion: '',
    fechaInicio: '',
    fechaFin: '',
    orden: form.value.fases.length + 1
  })
}

const removePhase = (index: number) => {
  if (form.value.fases.length > 1) {
    form.value.fases.splice(index, 1)
    // Reorder phases
    form.value.fases.forEach((fase, i) => {
      fase.orden = i + 1
    })
  }
}

const handleSubmit = async () => {
  isSubmitting.value = true
  
  try {
    const planData = {
      nombre: form.value.nombre,
      descripcion: form.value.descripcion,
      obraId: form.value.obraId,
      fechaInicio: form.value.fechaInicio,
      fechaFin: form.value.fechaFin,
      maestroResponsableId: form.value.maestroResponsableId,
      maestroResponsableNombre: form.value.maestroResponsableNombre,
      objetivos: form.value.objetivos.filter(obj => obj.trim() !== ''),
      fases: form.value.fases.filter(fase => fase.nombre.trim() !== '')
    }

    let savedPlan: PlanAccion

    if (isEditing.value && props.plan) {
      savedPlan = await updatePlan(props.plan.id, planData)
    } else {
      savedPlan = await createPlan(planData)
    }

    emit('saved', savedPlan)
    closeModal()
  } catch (error) {
    console.error('Error saving plan:', error)
  } finally {
    isSubmitting.value = false
  }
}

const closeModal = () => {
  emit('close')
  // Reset form
  form.value = {
    nombre: '',
    descripcion: '',
    obraId: '',
    fechaInicio: '',
    fechaFin: '',
    maestroResponsableId: authStore.user?.uid || '',
    maestroResponsableNombre: authStore.user?.displayName || '',
    objetivos: [''],
    fases: [{
      nombre: '',
      descripcion: '',
      fechaInicio: '',
      fechaFin: '',
      orden: 1
    }]
  }
}
</script>
