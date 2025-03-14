<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useTeachersStore } from '../stores/teachers'
import { PlusCircleIcon } from '@heroicons/vue/24/outline'
import { default as BaseCard } from '../components/BaseCard.vue'
import { default as ConfirmModal } from '../components/ConfirmModal.vue'

const router = useRouter()
const teachersStore = useTeachersStore()

const isLoading = ref(true)
const showDeleteModal = ref(false)
const teacherToDelete = ref<string | null>(null)
const error = ref<string | null>(null)

onMounted(async () => {
  try {
    await teachersStore.fetchTeachers()
  } catch (err: any) {
    console.error('❌ Error al cargar maestros:', err)
    error.value = err.message
  } finally {
    isLoading.value = false
  }
})

const handleView = (id: string) => {
  router.push(`/teachers/${id}`)
}

const handleEdit = (id: string) => {
  router.push(`/teachers/${id}/edit`)
}

const handleDelete = (id: string) => {
  teacherToDelete.value = id
  showDeleteModal.value = true
}

const confirmDelete = async () => {
  if (!teacherToDelete.value) return
  
  try {
    await teachersStore.deleteTeacher(String(teacherToDelete.value))
    error.value = null
  } catch (err: any) {
    error.value = err.message
  } finally {
    showDeleteModal.value = false
    teacherToDelete.value = null
  }
}
</script>

<template>
  <div class="py-6">
    <div class="flex justify-between items-center mb-6">
      <h1 class="text-2xl font-bold">Maestros</h1>
      <button 
        class="btn btn-primary flex items-center gap-2"
        @click="router.push('/teachers/new')"
        title="Añadir Maestro"
      >
        <PlusCircleIcon class="w-5 h-5" />
        <span class="hidden sm:inline">Añadir Maestro</span>
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
        @click="teachersStore.fetchTeachers()"
        class="ml-2 text-sm underline hover:no-underline"
      >
        Reintentar
      </button>
    </div>

    <!-- Teachers List -->
    <div v-else-if="teachersStore.teachers.length > 0" class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <BaseCard
        v-for="teacher in teachersStore.teachers"
        :key="teacher.uid"
        class="relative"
        @click="handleView(teacher.id)"
        @edit="handleEdit(teacher.id)"
        @delete="handleDelete(teacher.id)"
      >
        <template #header>
          <div class="flex items-center gap-4">
            <img
              :src="teacher.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${teacher.name}`"
              :alt="`${teacher.name}`"
              class="w-12 h-12 rounded-full object-cover"
            />
            <div>
              <h3 class="font-medium">
                {{ teacher.name }}
              </h3>
              <div class="flex flex-wrap gap-1 mt-1">
                <span 
                  v-for="esp in teacher.specialties"
                  :key="esp"
                  class="px-2 py-0.5 text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200 rounded-full"
                >
                  {{ esp }}
                </span>
              </div>
            </div>
          </div>
          <div class="mt-2 text-sm text-gray-600 dark:text-gray-400">
            <div class="grid grid-cols-2 gap-2">
              <p><strong>Edad:</strong> {{ teacher.edad }} años</p>
              <p><strong>Teléfono:</strong> {{ teacher.phone }}</p>
              <p class="col-span-2"><strong>Email:</strong> {{ teacher.email }}</p>
              <p class="col-span-2">
                <strong>Clases:</strong>
                <span class="ml-1">{{ teacher.clases?.join(', ') || 'Sin clases asignadas' }}</span>
              </p>
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
      No hay maestros registrados
    </div>

    <!-- Delete Confirmation Modal -->
    <ConfirmModal
      :show="showDeleteModal"
      title="Eliminar Maestro"
      message="¿Estás seguro que deseas eliminar este maestro? Esta acción no se puede deshacer."
      :is-loading="isLoading"
      @confirm="confirmDelete"
      @cancel="showDeleteModal = false"
    />
  </div>
</template>