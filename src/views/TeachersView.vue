<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useTeachersStore } from '../stores/teachers'
import { useClassesStore } from '../stores/classes' // Added import for Classes store
import { PlusCircleIcon, EllipsisVerticalIcon } from '@heroicons/vue/24/outline'
// import { default as BaseCard } from '../components/BaseCard.vue'
import { default as ConfirmModal } from '../components/ConfirmModal.vue'
import TeacherDrawer from '../components/TeacherDrawer.vue'

const router = useRouter()
const teachersStore = useTeachersStore()
const classesStore = useClassesStore() // Added Classes store initialization

const isLoading = ref(true)
const showDeleteModal = ref(false)
const teacherToDelete = ref<string | null>(null)
const error = ref<string | null>(null)
const selectedTeacher = ref<any>(null)
const showTeacherDrawer = ref(false)
const activeDropdown = ref<string | null>(null)

const searchQuery = ref('')
// Change initialization to get from localStorage
const sortOrder = ref<'asc' | 'desc' | 'none'>(
  localStorage.getItem('teachers-sort-order') as 'asc' | 'desc' | 'none' || 'none'
)

onMounted(async () => {
  try {
    await teachersStore.fetchTeachers()
    await classesStore.fetchClasses() // Added to fetch classes data
  } catch (err: any) {
    console.error('❌ Error al cargar maestros:', err)
    error.value = err.message
  } finally {
    isLoading.value = false
  }
})

const handleView = (teacher: any) => {
  selectedTeacher.value = teacher
  showTeacherDrawer.value = true
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

const toggleDropdown = (id: string) => {
  if (activeDropdown.value === id) {
    activeDropdown.value = null
  } else {
    activeDropdown.value = id
  }
}

const closeDropdowns = () => {
  activeDropdown.value = null
}

// Function to get classes for a specific teacher by ID
const getTeacherClasses = (teacherId: string) => {
  return classesStore.classes.filter(cls => cls.teacherId === teacherId)
}

// Computed property for filtered and sorted teachers
const filteredTeachers = computed(() => {
  let result = [...teachersStore.teachers]
  
  // Filter by search query
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    result = result.filter(teacher => 
      teacher.name.toLowerCase().includes(query)
    )
  }
  
  // Sort by name
  if (sortOrder.value !== 'none') {
    result.sort((a, b) => {
      const nameA = a.name.toLowerCase()
      const nameB = b.name.toLowerCase()
      
      if (sortOrder.value === 'asc') {
        return nameA.localeCompare(nameB)
      } else {
        return nameB.localeCompare(nameA)
      }
    })
  }
  
  return result
})

const toggleSort = () => {
  if (sortOrder.value === 'none') sortOrder.value = 'asc'
  else if (sortOrder.value === 'asc') sortOrder.value = 'desc'
  else sortOrder.value = 'none'
  
  // Save to localStorage when changed
  localStorage.setItem('teachers-sort-order', sortOrder.value)
}

// Watch for sortOrder changes to save to localStorage
watch(sortOrder, (newValue) => {
  localStorage.setItem('teachers-sort-order', newValue)
})
</script>

<template>
  <div class="py-2" @click="closeDropdowns">
    <div class="flex justify-between items-center mb-2">
      <h1 class="text-2xl font-bold">Maestros</h1>
      <button
        @click="toggleSort"
        class="btn flex items-center  min-w-[140px] justify-center"
        :class="{
          'btn-outline': sortOrder === 'none',
          'btn-secondary': sortOrder !== 'none'
        }"
      >
        <span v-if="sortOrder === 'none'"></span>
        <span v-else-if="sortOrder === 'asc'"></span>
        <span v-else></span>
        
        <svg v-if="sortOrder === 'asc'" xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12" />
        </svg>
        <svg v-else-if="sortOrder === 'desc'" xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 4h13M3 8h9m-9 4h9m5-4v12m0 0l-4-4m4 4l4-4" />
        </svg>
        <svg v-else xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
        </svg>
      </button>
    </div>

    <!-- Search and Sort Controls -->
    <div class="flex flex-col sm:flex-row gap-3 mb-2">
      <div class="relative flex-grow">
        <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
        <input
          v-model="searchQuery"
          type="text"
          placeholder="Buscar maestros..."
          class="pl-10 w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 py-2 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 dark:text-white"
        />
      </div>

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

    <!-- Teachers List - WhatsApp/Telegram Style -->
    <div v-else-if="filteredTeachers.length > 0" class="bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden">
      <ul class="divide-y divide-gray-200 dark:divide-gray-700">
        <li 
          v-for="teacher in filteredTeachers" 
          :key="teacher.uid"
          class="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
        >
          <div 
            class="flex items-center px-4 py-3 cursor-pointer relative"
            @click="handleView(teacher)"
          >
            <!-- Avatar -->
            <div class="flex-shrink-0 mr-4">
              <img
                :src="teacher.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${teacher.name}`"
                :alt="`${teacher.name}`"
                class="w-12 h-12 rounded-full object-cover border-2 border-gray-200 dark:border-gray-600"
              />
            </div>
            
            <!-- Info -->
            <div class="flex-1 min-w-0">
              <h3 class="text-base font-medium text-gray-900 dark:text-white truncate">
                {{ teacher.name }}
              </h3>
              <div class="flex flex-wrap gap-1 mt-0.5">
                <span 
                  v-for="esp in teacher.specialties"
                  :key="esp"
                  class="px-2 py-0.5 text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200 rounded-full"
                >
                  {{ esp }}
                </span>
              </div>
              <p class="text-sm text-gray-500 dark:text-gray-400 truncate mt-0.5">
                {{ getTeacherClasses(teacher.id).length > 0 
                   ? getTeacherClasses(teacher.id).map(cls => cls.name).join(', ') 
                   : 'Sin clases asignadas' }}
              </p>
            </div>
            
            <!-- Action button -->
            <div class="flex-shrink-0 ml-2" @click.stop>
              <button 
                class="p-1.5 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors relative"
                @click="toggleDropdown(teacher.id)"
              >
                <EllipsisVerticalIcon class="h-5 w-5 text-gray-500 dark:text-gray-400" />
              </button>
              
              <!-- Dropdown menu -->
              <div 
                v-if="activeDropdown === teacher.id"
                class="absolute right-4 z-10 mt-1 bg-white dark:bg-gray-800 rounded-md shadow-lg border border-gray-200 dark:border-gray-700 py-1 w-48"
              >
                <button 
                  @click="handleEdit(teacher.id)" 
                  class="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                  Editar
                </button>
                <button 
                  @click="handleDelete(teacher.id)" 
                  class="w-full text-left px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                  Eliminar
                </button>
              </div>
            </div>
          </div>
        </li>
      </ul>
    </div>

    <!-- Empty Search Results -->
    <div 
      v-else-if="searchQuery && teachersStore.teachers.length > 0" 
      class="text-center py-12 text-gray-500 dark:text-gray-400"
    >
      No se encontraron maestros que coincidan con "{{ searchQuery }}"
      <button 
        @click="searchQuery = ''" 
        class="text-primary-600 dark:text-primary-400 hover:underline block mt-2"
      >
        Mostrar todos los maestros
      </button>
    </div>

    <!-- Empty State -->
    <div 
      v-else 
      class="text-center py-12 text-gray-500 dark:text-gray-400"
    >
      No hay maestros registrados
    </div>

    <!-- Floating Action Button -->
    <button
      @click="router.push('/teachers/new')"
      class="fixed bottom-16 right-6 w-10 h-10 rounded-full bg-primary-600 hover:bg-primary-700 
             text-white shadow-lg flex items-center justify-center transition-all 
             hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2 
             focus:ring-primary-500 z-10"
      title="Añadir Maestro"
    >
      <PlusCircleIcon class="w-7 h-7" />
    </button>

    <!-- Teacher Profile Drawer -->
    <TeacherDrawer
      :show="showTeacherDrawer"
      :teacher="selectedTeacher"
      @close="showTeacherDrawer = false"
      @edit="handleEdit"
    />

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