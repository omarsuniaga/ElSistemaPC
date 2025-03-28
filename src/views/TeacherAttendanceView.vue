<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { storeToRefs } from 'pinia'
import { useAuthStore } from '../stores/auth'
import { useAttendanceStore } from '../modulos/Attendance/store/attendance'
import { useClassesStore } from '../modulos/Classes/store/classes'
import { useStudentsStore } from '../modulos/Students/store/students'
import Calendar from '../components/Calendar.vue'
import Modal from '../components/shared/Modal.vue'
import AttendanceList from '../modulos/Attendance/components/AttendanceList.vue'
import JustifiedAbsenceModal from '../components/JustifiedAbsenceModal.vue'
import AttendanceObservation from '../modulos/Attendance/components/AttendanceObservation.vue'
import { getCurrentDate } from '../utils/dateUtils'

const authStore = useAuthStore()
const attendanceStore = useAttendanceStore()
const classesStore = useClassesStore()
const studentsStore = useStudentsStore()

// Estados
const selectedDate = ref(getCurrentDate())
const selectedClass = ref('')
const isLoading = ref(true)
const showJustifiedAbsenceModal = ref(false)
const showObservationsModal = ref(false)
const selectedStudentForJustification = ref(null)
const selectedStudentForObs = ref(null)

// Computed properties
const teacherClasses = computed(() => {
  // Filtrar solo las clases asignadas al maestro actual
  return classesStore.classes.filter(c => c.teacherId === authStore.user?.uid)
})

const availableClassesForDate = computed(() => {
  if (!selectedDate.value) return []
  
  return teacherClasses.value.filter(c => {
    // Verificar si la clase está programada para esta fecha
    return attendanceStore.getClassScheduleDays(c.id).includes(
      new Date(selectedDate.value).toLocaleDateString('es-ES', { weekday: 'lowercase' })
    )
  })
})

const studentsInClass = computed(() => {
  if (!selectedClass.value) return []
  return studentsStore.getStudentsByClass(selectedClass.value)
})

const isDateEditable = computed(() => {
  return attendanceStore.validateAttendanceDate(selectedDate.value)
})

// Handlers
const handleDateSelect = async (date: string) => {
  selectedDate.value = date
  
  if (availableClassesForDate.value.length === 1) {
    // Si solo hay una clase disponible, seleccionarla automáticamente
    await selectClass(availableClassesForDate.value[0].id)
  } else {
    selectedClass.value = ''
  }
}

const selectClass = async (classId: string) => {
  selectedClass.value = classId
  await loadAttendanceData(classId)
}

const loadAttendanceData = async (classId: string) => {
  try {
    isLoading.value = true
    await attendanceStore.fetchAttendanceDocument(selectedDate.value, classId)
  } catch (error) {
    console.error('Error loading attendance:', error)
  } finally {
    isLoading.value = false
  }
}

const handleUpdateStatus = async (studentId: string, status: string) => {
  if (!isDateEditable.value) {
    alert('No se puede modificar asistencia para fechas futuras')
    return
  }
  
  if (status === 'Justificado') {
    selectedStudentForJustification.value = studentsInClass.value.find(s => s.id === studentId)
    showJustifiedAbsenceModal.value = true
    return
  }
  
  await attendanceStore.saveAttendance({
    studentId,
    classId: selectedClass.value,
    Fecha: selectedDate.value,
    status: status as AttendanceStatus
  })
}

// Inicialización
onMounted(async () => {
  try {
    await Promise.all([
      classesStore.fetchClasses(),
      studentsStore.fetchStudents()
    ])
    
    // Cargar fechas con registros para el calendario
    await attendanceStore.fetchAllAttendanceDates()
  } finally {
    isLoading.value = false
  }
})
</script>

<template>
  <div class="p-4 space-y-4">
    <h1 class="text-2xl font-bold mb-4">Asistencia de Clases</h1>
    
    <!-- Loading state -->
    <div v-if="isLoading" class="flex justify-center">
      <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
    </div>
    
    <div v-else class="grid md:grid-cols-2 gap-4">
      <!-- Calendario y selector de clase -->
      <div class="space-y-4">
        <Calendar 
          :selected-date="selectedDate"
          :marked-dates="attendanceStore.getDatesWithRecords"
          :highlighted-dates="availableClassesForDate.map(c => selectedDate)"
          @select="handleDateSelect"
        />
        
        <!-- Lista de clases disponibles -->
        <div v-if="availableClassesForDate.length > 0" class="space-y-2">
          <h2 class="text-lg font-semibold">Clases disponibles:</h2>
          <div class="space-y-2">
            <button 
              v-for="class_ in availableClassesForDate" 
              :key="class_.id"
              @click="selectClass(class_.id)"
              :class="[
                'w-full p-3 rounded-lg text-left transition-colors',
                selectedClass === class_.id
                  ? 'bg-primary-100 dark:bg-primary-900 text-primary-900 dark:text-primary-100'
                  : 'bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700'
              ]"
            >
              {{ class_.name }}
            </button>
          </div>
        </div>
        
        <div v-else class="text-center p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <p class="text-gray-500">No hay clases programadas para esta fecha</p>
        </div>
      </div>
      
      <!-- Lista de asistencia -->
      <div v-if="selectedClass" class="space-y-4">
        <AttendanceList 
          :students="studentsInClass"
          :attendance-records="attendanceStore.attendanceRecords"
          :is-disabled="!isDateEditable"
          @update-status="handleUpdateStatus"
          @open-justification="(student) => {
            selectedStudentForJustification = student;
            showJustifiedAbsenceModal = true;
          }"
          @open-observation="(student) => {
            selectedStudentForObs = student;
            showObservationsModal = true;
          }"
        />
      </div>
    </div>
    
    <!-- Modales -->
    <JustifiedAbsenceModal 
      v-if="showJustifiedAbsenceModal"
      :student="selectedStudentForJustification"
      @close="showJustifiedAbsenceModal = false"
      @save="async (data) => {
        await attendanceStore.addJustificationToAttendance(
          selectedStudentForJustification.id,
          selectedDate,
          selectedClass,
          data.reason,
          data.file
        );
        showJustifiedAbsenceModal = false;
      }"
    />
    
    <AttendanceObservation 
      v-if="showObservationsModal"
      v-model="showObservationsModal"
      :student-id="selectedStudentForObs?.id"
      :student-name="`${selectedStudentForObs?.nombre} ${selectedStudentForObs?.apellido}`"
      :class-id="selectedClass"
      :class-name="selectedClass"
      :attendance-id="selectedDate"
      :attendance-date="selectedDate"
      @observation-added="() => {
        showObservationsModal = false;
        loadAttendanceData(selectedClass);
      }"
    />
  </div>
</template>
