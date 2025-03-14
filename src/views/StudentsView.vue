<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useStudentsStore } from '../stores/students'
import { PlusCircleIcon } from '@heroicons/vue/24/outline'
import BaseCard from '../components/BaseCard.vue'
import ConfirmModal from '../components/ConfirmModal.vue'

const router = useRouter()
const studentsStore = useStudentsStore()

const isLoading = ref(true)
const showDeleteModal = ref(false)
const studentToDelete = ref<string | null>(null)
const error = ref<string | null>(null)
const isDeleting = ref(false)

onMounted(async () => {
  try {
    await studentsStore.fetchStudents()
  } catch (err: any) {
    console.error('❌ Error al cargar estudiantes:', err)
    error.value = err.message
  } finally {
    isLoading.value = false
  }
})

const handleView = (id: string) => {
  router.push(`/students/${id}`)
}

const handleEdit = (id: string) => {
  router.push(`/students/${id}/edit`)
}

const handleDelete = (id: string) => {
  studentToDelete.value = id
  showDeleteModal.value = true
}

const confirmDelete = async () => {
  if (!studentToDelete.value) return
  
  isDeleting.value = true
  try {
    await studentsStore.deleteStudent(studentToDelete.value)
    error.value = null
  } catch (err: any) {
    error.value = err.message
  } finally {
    showDeleteModal.value = false
    studentToDelete.value = null
    isDeleting.value = false
  }
}
</script>

<template>
  <div class="py-6">
    <div class="flex justify-between items-center mb-6">
      <h1 class="text-2xl font-bold">Alumnos</h1>
      <button 
        class="btn btn-primary flex items-center gap-2"
        @click="router.push('/students/new')"
        title="Añadir Alumno"
      >
        <PlusCircleIcon class="w-5 h-5" />
        <span class="hidden sm:inline">Añadir Alumno</span>
      </button>
    </div>

    <!-- Loading State -->
    <div v-if="isLoading" class="flex justify-center items-center py-12">
      <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
    </div>

    <!-- Error State -->
    <div 
      v-else-if="error" 
      class="bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 p-4 rounded-lg mb-4"
    >
      {{ error }}
      <button 
        @click="studentsStore.fetchStudents()"
        class="ml-2 text-sm underline hover:no-underline"
      >
        Reintentar
      </button>
    </div>

    <!-- Students List -->
    <div v-else-if="studentsStore.students.length > 0" class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <BaseCard
        v-for="student in studentsStore.students"
        :key="student.id"
        :title="`${student.nombre} ${student.apellido}`"
        :class="{'bg-pink-100': !student.grupo?.length}"
        class="relative"
        @click="handleView(student.id)"
        @edit="handleEdit(student.id)"
        @delete="handleDelete(String(student.id))"
      >
        <template #header>
          <div class="flex items-center gap-4">
            <img
              :src="student.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${student.nombre}`"
              :alt="`${student.nombre} ${student.apellido}`"
              class="w-12 h-12 rounded-full"
            />
            <div>
              <h3 class="font-medium">
                {{ student.nombre }} {{ student.apellido }}
              </h3>
              <div class="flex flex-wrap gap-1 mt-1">
                <span 
                  v-for="grupo in student.grupo"
                  :key="grupo"
                  class="px-2 py-0.5 text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200 rounded-full"
                >
                  {{ grupo }}
                </span>
              </div>
            </div>
          </div>
          <div class="mt-2 text-sm text-gray-600 dark:text-gray-400">
            <div class="grid grid-cols-2 gap-2">
              <p><strong>Edad:</strong> {{ student.edad }} años</p>
              <p><strong>Teléfono:</strong> {{ student.tlf }}</p>
              <p class="col-span-2"><strong>Email:</strong> {{ student.email }}</p>
              <p><strong>Instrumento:</strong> {{ student.instrumento }}</p>
              <p><strong>Inscripción:</strong> {{ student.fecInscripcion }}</p>
            </div>
          </div>
        </template>
      </BaseCard>
    </div>

    <!-- Empty State -->
    <div 
      v-else 
      class="text-center py-12 text-gray-500 dark:text-gray-400"
    >
      No hay alumnos registrados
    </div>

    <!-- Delete Confirmation Modal -->
    <ConfirmModal
  v-if="showDeleteModal"
  :show="showDeleteModal"
  title="Eliminar Alumno"
  message="¿Estás seguro que deseas eliminar este alumno? Esta acción no se puede deshacer."
  :isLoading="isDeleting"
  @confirm="confirmDelete"
  @cancel="showDeleteModal = false"
/>
  </div>
</template>