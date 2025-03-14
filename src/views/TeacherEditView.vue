<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useTeachersStore } from '../stores/teachers'
import TeacherForm from '../components/TeacherForm.vue'
import type { Teacher } from '../types'

const route = useRoute()
const router = useRouter()
const teachersStore = useTeachersStore()

const teacherId = route.params.id as string
const teacher = computed(() => teachersStore.teachers.find(t => t.id === teacherId))

const isLoading = ref(false)
const error = ref<string | null>(null)

const handleSubmit = async (data: Partial<Teacher>) => {
  if (!teacher.value) return
  
  isLoading.value = true
  error.value = null
  
  try {
    await teachersStore.updateTeacher(teacherId, data)
    router.push(`/teachers/${teacherId}`)
  } catch (err: any) {
    error.value = err.message
  } finally {
    isLoading.value = false
  }
}

const handleCancel = () => {
  router.push(`/teachers/${teacherId}`)
}
</script>

<template>
  <div class="py-6">
    <div class="mb-6">
      <h1 class="text-2xl font-bold">Editar Maestro</h1>
    </div>

    <!-- Error Alert -->
    <div 
      v-if="error"
      class="mb-6 p-4 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded-lg"
    >
      {{ error }}
    </div>

    <div v-if="teacher" class="card">
      <TeacherForm
        :initial-data="teacher"
        :is-loading="isLoading"
        @submit="handleSubmit"
        @cancel="handleCancel"
      />
    </div>
    <div v-else class="text-center py-12 text-gray-500 dark:text-gray-400">
      Maestro no encontrado
    </div>
  </div>
</template>