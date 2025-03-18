<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useStudentsStore } from '../stores/students'
import { PlusCircleIcon, MagnifyingGlassIcon, EllipsisVerticalIcon } from '@heroicons/vue/24/outline'
import BaseCard from '../components/BaseCard.vue'
import ConfirmModal from '../components/ConfirmModal.vue'
import StudentDrawer from '../components/StudentDrawer.vue'

const router = useRouter()
const studentsStore = useStudentsStore()

const isLoading = ref(true)
const showDeleteModal = ref(false)
const studentToDelete = ref<string | null>(null)
const error = ref<string | null>(null)
const isDeleting = ref(false)
const searchQuery = ref('')
const showStudentDrawer = ref(false)
const selectedStudent = ref(null)
const activeMenu = ref<string | null>(null)

// Computed property para ordenar estudiantes por apellido y filtrar por búsqueda
const sortedStudents = computed(() => {
  let filtered = [...studentsStore.students]
  
  // Aplicar filtro de búsqueda si hay texto
  if (searchQuery.value.trim()) {
    const query = searchQuery.value.toLowerCase().trim()
    filtered = filtered.filter(student => 
      student.nombre.toLowerCase().includes(query) ||
      student.apellido.toLowerCase().includes(query) ||
      (student.instrumento && student.instrumento.toLowerCase().includes(query)) ||
      (student.grupo && student.grupo.some(g => g.toLowerCase().includes(query)))
    )
  }
  
  // Ordenar por apellido
  return filtered.sort((a, b) => 
    a.apellido.localeCompare(b.apellido)
  )
})

// Función para abrir el drawer con los detalles del estudiante
const openStudentDrawer = (student) => {
  selectedStudent.value = student
  showStudentDrawer.value = true
}

// Función para mostrar/ocultar el menú de opciones
const toggleMenu = (event: Event, studentId: string) => {
  event.stopPropagation() // Evitar que se abra el drawer
  activeMenu.value = activeMenu.value === studentId ? null : studentId
}

// Función para manejar la acción de editar desde el menú
const handleEditFromMenu = (event: Event, id: string) => {
  event.stopPropagation() // Evitar que se abra el drawer
  handleEdit(id)
  activeMenu.value = null
}

// Función para manejar la acción de eliminar desde el menú
const handleDeleteFromMenu = (event: Event, id: string) => {
  event.stopPropagation() // Evitar que se abra el drawer
  handleDelete(id)
  activeMenu.value = null
}

onMounted(async () => {
  try {
    await studentsStore.fetchStudents()
  } catch (err: any) {
    console.error('❌ Error al cargar estudiantes:', err)
    error.value = err.message || 'Error al cargar la lista de estudiantes'
  } finally {
    isLoading.value = false
  }
})

const handleView = (id: string) => {
  if (!id) return
  router.push(`/students/${id}`)
}

const handleEdit = (id: string) => {
  if (!id) return
  router.push(`/students/${id}/edit`)
}

const handleDelete = (id: string) => {
  if (!id) return
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
    error.value = err.message || 'Error al eliminar al estudiante'
  } finally {
    showDeleteModal.value = false
    studentToDelete.value = null
    isDeleting.value = false
  }
}

// Función para recargar la lista de estudiantes
const reloadStudents = async () => {
  isLoading.value = true
  error.value = null
  
  try {
    await studentsStore.fetchStudents()
  } catch (err: any) {
    console.error('❌ Error al recargar estudiantes:', err)
    error.value = err.message || 'Error al recargar la lista de estudiantes'
  } finally {
    isLoading.value = false
  }
}
</script>

<template>
  <div class="py-6">
    <div class="mb-6">
      <h1 class="text-2xl font-bold">Alumnos</h1>
    </div>

    <!-- Search Bar -->
    <div class="relative mb-4">
      <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
        <MagnifyingGlassIcon class="h-5 w-5 text-gray-400" />
      </div>
      <input
        type="text"
        v-model="searchQuery"
        placeholder="Buscar alumnos..."
        class="pl-10 pr-4 py-2 w-full rounded-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
      />
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
        @click="reloadStudents"
        class="ml-2 text-sm underline hover:no-underline"
      >
        Reintentar
      </button>
    </div>

    <!-- Students List (WhatsApp/Telegram Style) -->
    <div v-else-if="sortedStudents.length > 0" class="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
      <ul class="divide-y divide-gray-200 dark:divide-gray-700">
        <li 
          v-for="student in sortedStudents" 
          :key="student.id"
          @click="openStudentDrawer(student)"
          class="hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer transition-colors"
        >
          <div class="px-4 py-3 flex items-start space-x-3">
            <!-- Avatar -->
            <div class="flex-shrink-0">
              <img
                :src="student.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${student.nombre}`"
                :alt="`${student.nombre} ${student.apellido}`"
                class="h-12 w-12 rounded-full"
              />
            </div>
            
            <!-- Student Info -->
            <div class="flex-1 min-w-0">
              <div class="flex items-center justify-between">
                <p class="text-sm font-medium text-gray-900 dark:text-white truncate">
                  {{ student.nombre }} {{ student.apellido }}
                </p>
                <div class="flex items-center">
                  <p class="text-xs text-gray-500 dark:text-gray-400 mr-2">
                    {{ student.fecInscripcion || "Sin fecha" }}
                  </p>
                  <!-- Three dots menu button -->
                  <div class="relative">
                    <button 
                      @click="toggleMenu($event, student.id)" 
                      class="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                    >
                      <EllipsisVerticalIcon class="h-5 w-5 text-gray-500 dark:text-gray-400" />
                    </button>
                    
                    <!-- Dropdown menu -->
                    <div 
                      v-if="activeMenu === student.id"
                      class="absolute right-0 mt-1 w-36 bg-white dark:bg-gray-800 rounded-md shadow-lg z-10 border border-gray-200 dark:border-gray-700"
                    >
                      <div class="py-1">
                        <button
                          @click="handleEditFromMenu($event, student.id)"
                          class="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
                        >
                          Editar
                        </button>
                        <button
                          @click="handleDeleteFromMenu($event, student.id)"
                          class="w-full text-left px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-700"
                        >
                          Eliminar
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              <!-- Instrument -->
              <p class="mt-1 text-sm text-gray-500 dark:text-gray-400 truncate">
                {{ student.instrumento || "Sin instrumento asignado" }}
              </p>
            </div>
            
            <!-- No action buttons here as per new requirements -->
          </div>
        </li>
      </ul>
    </div>

    <!-- Empty State -->
    <div 
      v-else 
      class="text-center py-12 text-gray-500 dark:text-gray-400"
    >
      No hay alumnos registrados
    </div>

    <!-- Student Drawer -->
    <StudentDrawer
      :show="showStudentDrawer"
      :student="selectedStudent"
      @close="showStudentDrawer = false"
      @edit="handleEdit"
    />

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

    <!-- Floating Action Button for adding new student -->
    <button
      @click="router.push('/students/new')"
      class="fixed bottom-16 right-6 w-10 h-10 rounded-full bg-primary-600 hover:bg-primary-700 text-white shadow-lg flex items-center justify-center z-10 transition-all duration-200 hover:scale-105"
      title="Añadir Alumno"
    >
      <PlusCircleIcon class="w-8 h-8" />
    </button>
  </div>
</template>