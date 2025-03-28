<!-- components/JustifiedAbsenceModal.vue -->
<script setup lang="ts">
import { ref } from 'vue';

defineProps<{
  student: any
}>()

const emit = defineEmits(['close', 'save'])

const reason = ref('')

const save = () => {
  emit('save', { reason: reason.value })
  close()
}

const close = () => {
  reason.value = '';
  emit('close')
}
</script>

<template>
  <div v-if="$props.student" class="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
    <div class="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-xl max-w-md w-full">
      <h2 class="text-lg font-semibold mb-4">Justificar Ausencia</h2>
      <p class="mb-4">Estudiante: {{ $props.student.nombre }} {{ $props.student.apellido }}</p>
      
      <label for="reason" class="block text-sm font-medium text-gray-700 dark:text-gray-300">Razón:</label>
      <textarea id="reason" v-model="reason" rows="3" class="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"></textarea>
      
      <div class="mt-4 flex justify-end gap-2">
        <button @click="close" class="btn btn-secondary">Cancelar</button>
        <button @click="save" class="btn btn-primary">Guardar</button>
      </div>
    </div>
  </div>
</template>