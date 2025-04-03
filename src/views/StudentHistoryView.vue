<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { where, orderBy, limit } from 'firebase/firestore'
import { useFirestoreCollection } from '../composables/useFirestoreCollection'
import { usePaginatedFirestore } from '../composables/usePaginatedFirestore'
import BaseList from '../components/ui/BaseList.vue'
import BaseCard from '../components/ui/BaseCard.vue'
import BaseModal from '../components/ui/BaseModal.vue'
import GroupSelector from '../components/GroupSelector.vue'

// Interfaces para tipado
interface Student {
  id: string;
  firstName: string;
  lastName: string;
  groupId: string;
  email?: string;
  phoneNumber?: string;
}

interface Attendance {
  id: string;
  studentId: string;
  date: Date | any; // Timestamp de Firestore
  status: 'present' | 'absent' | 'late' | 'justified';
  justification?: string;
  createdAt: Date | any;
}

// Estado local para filtros
const selectedGroupId = ref<string | null>(null)
const selectedStudent = ref<Student | null>(null)
const showStudentModal = ref(false)
const showAttendanceModal = ref(false)
const selectedAttendance = ref<Attendance | null>(null)
const dateFilter = ref<{start: Date | null, end: Date | null}>({
  start: null,
  end: null
})

// Consultar lista de estudiantes con consulta reactiva
const studentConstraints = computed(() => {
  const constraints = []
  
  if (selectedGroupId.value) {
    constraints.push(where('groupId', '==', selectedGroupId.value))
  }
  
  constraints.push(orderBy('lastName'))
  constraints.push(orderBy('firstName'))
  
  return constraints
})

const { 
  items: students, 
  loading: loadingStudents, 
  error: studentError 
} = useFirestoreCollection<Student>('students', studentConstraints)

// Consulta de historial de asistencia con paginación (datos históricos)
const { 
  items: attendanceHistory, 
  loading: loadingAttendance, 
  error: attendanceError,
  hasMore,
  loadNextPage,
  updateFilters
} = usePaginatedFirestore<Attendance>('attendance', {
  pageSize: 20,
  orderByField: 'date',
  orderDirection: 'desc',
  filters: []
})

// Actualizar filtros cuando cambian
watch([selectedStudent, dateFilter], () => {
  const newFilters = []
  
  if (selectedStudent.value) {
    newFilters.push(where('studentId', '==', selectedStudent.value.id))
  }
  
  if (dateFilter.value.start) {
    newFilters.push(where('date', '>=', dateFilter.value.start))
  }
  
  if (dateFilter.value.end) {
    newFilters.push(where('date', '<=', dateFilter.value.end))
  }
  
  updateFilters(newFilters)
}, { deep: true })

// Métodos
const handleGroupChange = (groupId: string) => {
  selectedGroupId.value = groupId
}

const openStudentDetails = (student: Student) => {
  selectedStudent.value = student
  showStudentModal.value = true
}

const openAttendanceDetails = (attendance: Attendance) => {
  selectedAttendance.value = attendance
  showAttendanceModal.value = true
}

const handleSearchByDates = () => {
  // La actualización de los filtros ya está manejada por el watcher
}

const loadMoreAttendance = () => {
  if (!loadingAttendance.value) {
    loadNextPage()
  }
}

// Formateo de fechas para mostrar
const formatDate = (date: any): string => {
  if (!date) return ''
  
  if (date.toDate) {
    // Timestamp de Firestore
    return date.toDate().toLocaleDateString('es-ES')
  } else if (date instanceof Date) {
    return date.toLocaleDateString('es-ES')
  }
  
  return String(date)
}
</script>

<template>
  <div class="student-history-view">
    <h1 class="text-xl font-bold mb-4">Historial de estudiantes</h1>
    
    <!-- Filtros -->
    <div class="filters mb-6">
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div class="group-selector">
          <label class="block text-sm font-medium mb-1">Grupo</label>
          <GroupSelector 
            :value="selectedGroupId"
            @change="handleGroupChange"
          />
        </div>
        
        <div class="date-filter">
          <label class="block text-sm font-medium mb-1">Rango de fechas</label>
          <div class="flex gap-2">
            <div class="flex-1">
              <input 
                type="date" 
                v-model="dateFilter.start" 
                class="w-full px-3 py-2 border rounded"
                :disabled="!selectedStudent"
              />
            </div>
            <div class="flex-1">
              <input 
                type="date" 
                v-model="dateFilter.end" 
                class="w-full px-3 py-2 border rounded"
                :disabled="!selectedStudent"
              />
            </div>
            <button 
              @click="handleSearchByDates"
              class="px-4 py-2 bg-blue-600 text-white rounded"
              :disabled="!selectedStudent"
            >
              Buscar
            </button>
          </div>
        </div>
      </div>
    </div>
    
    <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
      <!-- Lista de estudiantes -->
      <div class="students-list md:col-span-1">
        <div class="bg-gray-50 p-4 rounded-md shadow mb-2">
          <h2 class="text-lg font-semibold mb-2">Estudiantes</h2>
          
          <BaseList
            :items="students"
            :loading="loadingStudents"
            :error="studentError"
            empty-message="No hay estudiantes en el grupo seleccionado"
            @item-click="openStudentDetails"
          >
            <template #item="{ item }">
              <BaseCard
                :title="`${item.firstName} ${item.lastName}`"
                :subtitle="item.email"
                hoverable
                clickable
                variant="outlined"
              >
                <template v-if="item.phoneNumber">
                  <p class="text-sm">Tel: {{ item.phoneNumber }}</p>
                </template>
              </BaseCard>
            </template>
          </BaseList>
        </div>
      </div>
      
      <!-- Historial de asistencia -->
      <div class="attendance-history md:col-span-2">
        <div class="bg-gray-50 p-4 rounded-md shadow">
          <h2 class="text-lg font-semibold mb-2">
            {{ selectedStudent 
              ? `Historial de ${selectedStudent.firstName} ${selectedStudent.lastName}` 
              : 'Seleccione un estudiante para ver su historial' 
            }}
          </h2>
          
          <BaseList
            :items="attendanceHistory"
            :loading="loadingAttendance"
            :error="attendanceError"
            :empty-message="selectedStudent 
              ? 'No hay registros de asistencia para este estudiante en el rango seleccionado'
              : 'Seleccione un estudiante para ver su historial'"
            @item-click="openAttendanceDetails"
          >
            <template #item="{ item }">
              <div 
                class="attendance-item flex items-center justify-between p-2 hover:bg-gray-100 cursor-pointer"
              >
                <div class="flex items-center">
                  <div 
                    :class="[
                      'status-indicator mr-3 w-3 h-3 rounded-full',
                      item.status === 'present' && 'bg-green-500',
                      item.status === 'absent' && 'bg-red-500',
                      item.status === 'late' && 'bg-yellow-500',
                      item.status === 'justified' && 'bg-blue-500'
                    ]"
                  ></div>
                  <span>{{ formatDate(item.date) }}</span>
                </div>
                
                <div class="attendance-status">
                  <span
                    :class="[
                      'px-2 py-1 text-xs rounded',
                      item.status === 'present' && 'bg-green-100 text-green-800',
                      item.status === 'absent' && 'bg-red-100 text-red-800',
                      item.status === 'late' && 'bg-yellow-100 text-yellow-800',
                      item.status === 'justified' && 'bg-blue-100 text-blue-800'
                    ]"
                  >
                    {{ item.status === 'present' ? 'Presente' : 
                       item.status === 'absent' ? 'Ausente' :
                       item.status === 'late' ? 'Tarde' : 'Justificado' }}
                  </span>
                </div>
              </div>
            </template>
            
            <template #footer>
              <button 
                v-if="hasMore" 
                @click="loadMoreAttendance"
                :disabled="loadingAttendance"
                class="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded"
              >
                {{ loadingAttendance ? 'Cargando...' : 'Cargar más' }}
              </button>
            </template>
            
            <template #empty>
              <div class="text-center py-8">
                <svg class="w-16 h-16 text-gray-300 mx-auto mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p v-if="selectedStudent">No hay registros de asistencia para este estudiante en el rango seleccionado</p>
                <p v-else>Seleccione un estudiante para ver su historial</p>
              </div>
            </template>
          </BaseList>
        </div>
      </div>
    </div>
    
    <!-- Modal de detalles del estudiante -->
    <BaseModal
      v-model="showStudentModal"
      :title="selectedStudent ? `${selectedStudent.firstName} ${selectedStudent.lastName}` : ''"
      size="md"
    >
      <div v-if="selectedStudent" class="student-details">
        <div class="grid grid-cols-2 gap-4">
          <div>
            <h4 class="text-sm font-medium text-gray-500">Nombre</h4>
            <p>{{ selectedStudent.firstName }} {{ selectedStudent.lastName }}</p>
          </div>
          
          <div>
            <h4 class="text-sm font-medium text-gray-500">Grupo</h4>
            <p>{{ selectedStudent.groupId }}</p>
          </div>
          
          <div>
            <h4 class="text-sm font-medium text-gray-500">Email</h4>
            <p>{{ selectedStudent.email || 'No disponible' }}</p>
          </div>
          
          <div>
            <h4 class="text-sm font-medium text-gray-500">Teléfono</h4>
            <p>{{ selectedStudent.phoneNumber || 'No disponible' }}</p>
          </div>
        </div>
      </div>
      
      <template #footer>
        <button 
          @click="showStudentModal = false"
          class="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded mr-2"
        >
          Cerrar
        </button>
        
        <button 
          class="px-4 py-2 bg-blue-600 text-white rounded"
          @click="showStudentModal = false"
        >
          Ver historial completo
        </button>
      </template>
    </BaseModal>
    
    <!-- Modal de detalles de asistencia -->
    <BaseModal
      v-model="showAttendanceModal"
      title="Detalle de asistencia"
      size="md"
    >
      <div v-if="selectedAttendance" class="attendance-details">
        <div class="grid grid-cols-2 gap-4 mb-4">
          <div>
            <h4 class="text-sm font-medium text-gray-500">Fecha</h4>
            <p>{{ formatDate(selectedAttendance.date) }}</p>
          </div>
          
          <div>
            <h4 class="text-sm font-medium text-gray-500">Estado</h4>
            <span
              :class="[
                'px-2 py-1 text-xs rounded',
                selectedAttendance.status === 'present' && 'bg-green-100 text-green-800',
                selectedAttendance.status === 'absent' && 'bg-red-100 text-red-800',
                selectedAttendance.status === 'late' && 'bg-yellow-100 text-yellow-800',
                selectedAttendance.status === 'justified' && 'bg-blue-100 text-blue-800'
              ]"
            >
              {{ selectedAttendance.status === 'present' ? 'Presente' : 
                 selectedAttendance.status === 'absent' ? 'Ausente' :
                 selectedAttendance.status === 'late' ? 'Tarde' : 'Justificado' }}
            </span>
          </div>
        </div>
        
        <div v-if="selectedAttendance.justification" class="mb-4">
          <h4 class="text-sm font-medium text-gray-500">Justificación</h4>
          <p class="bg-gray-50 p-3 rounded border">{{ selectedAttendance.justification }}</p>
        </div>
      </div>
      
      <template #footer>
        <button 
          @click="showAttendanceModal = false"
          class="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded"
        >
          Cerrar
        </button>
      </template>
    </BaseModal>
  </div>
</template>

<style scoped>
.student-history-view {
  padding: 1rem;
}

.filters {
  background-color: #f9fafb;
  padding: 1rem;
  border-radius: 0.5rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

@media (max-width: 768px) {
  .filters > div {
    flex-direction: column;
  }
}
</style>