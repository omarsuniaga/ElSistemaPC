<script setup lang="ts">
// src/modulos/Teachers/view/TeacherEditView.vue
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useTeachersStore } from '../store/teachers'
import TeacherForm from '../components/TeacherForm.vue'
import type { Teacher } from '../types/teachers'

const route = useRoute()
const router = useRouter()
const teachersStore = useTeachersStore()

const teacherId = route.params.id as string
const teacher = computed(() => {
  // Buscar por id (Firestore) o por uid (auth)
  return teachersStore.getTeacherById(teacherId) ||
         teachersStore.teachers.find(t => t.uid === teacherId)
})

const isLoading = ref(false)
const error = ref<string | null>(null)

// Cargar maestros si la lista está vacía
onMounted(async () => {
  if (!teachersStore.teachers.length) {
    isLoading.value = true
    try {
      await teachersStore.fetchTeachers()
    } catch (err: any) {
      error.value = err.message || 'Error al cargar maestros'
    } finally {
      isLoading.value = false
    }
  }
})

// Si el maestro no se encuentra tras cargar, mostrar error
watch(
  () => teacher.value,
  (val) => {
    if (!val && !isLoading.value && teachersStore.teachers.length) {
      error.value = 'Maestro no encontrado'
    } else {
      error.value = null
    }
  },
  { immediate: true }
)

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
console.log("TEacher Edit", teacher.value)
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

    <div v-if="isLoading" class="text-center py-12 text-gray-500 dark:text-gray-400">
      Cargando datos del maestro...
    </div>
    <div v-else-if="teacher" class="card">
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