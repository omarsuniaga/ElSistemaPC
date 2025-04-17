<template>
  <div class="admin-dashboard p-6">
    <h1 class="text-3xl font-bold mb-8">Dashboard Administrativo</h1>
    
    <!-- Panel de estadísticas diarias -->
    <div class="mb-8">
      <h2 class="text-2xl font-semibold mb-4">Actividad del día ({{ formattedCurrentDate }})</h2>
      <div class="grid grid-cols-1 md:grid-cols-4 gap-6">
        <!-- KPI de Estudiantes Presentes -->
        <div class="bg-white rounded-lg shadow p-6">
          <h3 class="text-lg font-medium text-gray-500">Estudiantes presentes hoy</h3>
          <div class="flex items-center justify-between mt-2">
            <div class="text-3xl font-bold">{{ studentsPresent }}</div>
            <div class="text-green-500 bg-green-100 rounded-full p-2">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
          <div class="text-sm text-gray-500 mt-2">
            {{ attendancePercentage }}% de asistencia
          </div>
        </div>

        <!-- KPI de Clases Regulares -->
        <div class="bg-white rounded-lg shadow p-6">
          <h3 class="text-lg font-medium text-gray-500">Clases regulares hoy</h3>
          <div class="flex items-center justify-between mt-2">
            <div class="text-3xl font-bold">{{ regularClasses }}</div>
            <div class="text-blue-500 bg-blue-100 rounded-full p-2">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
          </div>
          <div class="text-sm text-gray-500 mt-2">
            En {{ classroomsInUse }} salones
          </div>
        </div>

        <!-- KPI de Clases Emergentes -->
        <div class="bg-white rounded-lg shadow p-6">
          <h3 class="text-lg font-medium text-gray-500">Clases emergentes hoy</h3>
          <div class="flex items-center justify-between mt-2">
            <div class="text-3xl font-bold">{{ emergentClasses }}</div>
            <div class="text-purple-500 bg-purple-100 rounded-full p-2">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
          <div class="text-sm text-gray-500 mt-2">
            {{ emergentClassPercentage }}% del total de clases
          </div>
        </div>

        <!-- KPI de Profesores Presentes -->
        <div class="bg-white rounded-lg shadow p-6">
          <h3 class="text-lg font-medium text-gray-500">Maestros activos hoy</h3>
          <div class="flex items-center justify-between mt-2">
            <div class="text-3xl font-bold">{{ activeTeachers }}</div>
            <div class="text-purple-500 bg-purple-100 rounded-full p-2">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
          </div>
          <div class="text-sm text-gray-500 mt-2">
            {{ teacherAttendancePercentage }}% de asistencia
          </div>
        </div>
      </div>
    </div>

    <!-- Panel de Clases del Día -->
    <TodayClassesPanel ref="todayClassesPanel" class="mb-8" />

    <AttendanceWeeklyTable class="mb-8" />

    <!-- Alumnos con Mayor Ausencia -->
    <AbsenteesList class="mb-8" :className="null" :limit="5" />

  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { useAttendanceStore } from '../../../Attendance/store/attendance'
import { useStudentsStore } from '../../../Students/store/students'
import { useClassesStore } from '../../../Classes/store/classes'
import { useTeachersStore } from '../../store/teachers'
import TodayClassesPanel from '../../../../components/TodayClassesPanel.vue'
import AttendanceWeeklyTable from '../../../../components/AttendanceWeeklyTable.vue'
import AbsenteesList from '../../../../components/AbsenteesList.vue'
// Estado reactivo
const attendanceStore = useAttendanceStore()
const studentsStore = useStudentsStore()
const classesStore = useClassesStore()
const teachersStore = useTeachersStore()
const todayClassesPanel = ref<InstanceType<typeof TodayClassesPanel> | null>(null)

const isLoading = ref(true)
const error = ref<string | null>(null)
const presentStudentsList = ref<any[]>([])
const studentsPresent = ref(0)
const activeClasses = ref(0)
const regularClasses = ref(0)
const emergentClasses = ref(0)
const activeTeachers = ref(0)
const classroomsInUse = ref(0)
const attendancePercentage = ref(0)
const teacherAttendancePercentage = ref(0)
const emergentClassPercentage = ref(0)

// Fecha actual formateada
const formattedCurrentDate = computed(() => {
  return format(new Date(), "d 'de' MMMM, yyyy", { locale: es })
})

// Al montar el componente
onMounted(async () => {
  try {
    isLoading.value = true
    
    // Cargar datos necesarios de los almacenes
    await Promise.all([
      fetchAttendanceData(),
      loadStudentsData(),
      loadClassesData(),
      loadTeachersData()
    ])
    
    // Calcular estadísticas una vez que tenemos todos los datos
    calculateStatistics()
  } catch (err: any) {
    error.value = `Error al cargar datos: ${err.message}`
    console.error('Error en AdminHomeView:', err)
  } finally {
    isLoading.value = false
  }
})

// Observar cambios en el componente TodayClassesPanel
watch(() => todayClassesPanel.value, (newVal) => {
  if (newVal) {
    updateClassesStatistics()
  }
}, { immediate: true })

// Función para obtener datos de asistencia de hoy
async function fetchAttendanceData() {
  try {
    // Obtener la fecha actual en formato YYYY-MM-DD
    const currentDate = format(new Date(), 'yyyy-MM-dd')
    
    // Cargar los documentos de asistencia si no están ya cargados
    if (attendanceStore.attendanceDocuments.length === 0) {
      await attendanceStore.fetchAttendanceDocuments()
    }
    
    // Filtrar documentos por la fecha actual
    const todayDocuments = attendanceStore.attendanceDocuments
      .filter(doc => doc.fecha === currentDate)
      
    // Construir lista de estudiantes presentes
    const presentStudents: any[] = []
    
    // Set para guardar IDs únicos de estudiantes presentes
    const uniqueStudentIds = new Set<string>()
    
    // Procesar cada documento de asistencia
    for (const doc of todayDocuments) {
      // Obtener la información de la clase
      const classInfo = classesStore.getClassById(doc.classId)
      
      // Procesar estudiantes presentes
      doc.data.presentes.forEach(studentId => {
        // Añadir ID al set de estudiantes únicos
        uniqueStudentIds.add(studentId)
        
        // Obtener información del estudiante
        const student = studentsStore.items.find(s => s.id === studentId)
        
        if (student) {
          presentStudents.push({
            id: studentId,
            name: `${student.nombre} ${student.apellido || ''}`.trim(),
            className: classInfo?.name || 'Clase sin nombre',
            time: classInfo?.schedule || 'Horario no especificado'
          })
        }
      })
    }
    
    // Actualizar el estado con los datos procesados
    presentStudentsList.value = presentStudents
    studentsPresent.value = uniqueStudentIds.size
  } catch (err) {
    throw new Error(`Error al obtener datos de asistencia: ${err}`)
  }
}

// Función para cargar datos de estudiantes
async function loadStudentsData() {
  if (studentsStore.students.length === 0) {
    await studentsStore.fetchStudents()
  }
}

// Función para cargar datos de clases
async function loadClassesData() {
  if (classesStore.classes.length === 0) {
    await classesStore.fetchClasses()
  }
}

// Función para cargar datos de profesores
async function loadTeachersData() {
  if (teachersStore.teachers.length === 0) {
    await teachersStore.fetchTeachers()
  }
}

// Función para actualizar las estadísticas de clases desde el componente TodayClassesPanel
function updateClassesStatistics() {
  if (todayClassesPanel.value) {
    // Accedemos a los datos a través de métodos expuestos o con type assertion
    const panelInstance = todayClassesPanel.value as any;
    activeClasses.value = panelInstance.totalClassesToday || 0;
    regularClasses.value = panelInstance.totalRegularClasses || 0;
    emergentClasses.value = panelInstance.totalEmergentClasses || 0;
    
    // Calcular porcentaje de clases emergentes del total
    if (activeClasses.value > 0) {
      emergentClassPercentage.value = Math.round((emergentClasses.value / activeClasses.value) * 100)
    } else {
      emergentClassPercentage.value = 0
    }
  }
}

// Función para calcular estadísticas adicionales
function calculateStatistics() {
  const currentDate = format(new Date(), 'yyyy-MM-dd')
  const activeRooms = new Set<string>()
  const activeTeachersSet = new Set<string>()
  
  // Contar clases activas hoy - ahora usa el componente TodayClassesPanel
  updateClassesStatistics()
  
  // Actualizar salones y maestros activos
  attendanceStore.attendanceDocuments
    .filter(doc => doc.fecha === currentDate)
    .forEach(doc => {
      const classInfo = classesStore.getClassById(doc.classId)
      if (classInfo) {
        if (classInfo.classroom) activeRooms.add(classInfo.classroom)
        if (classInfo.teacherId) activeTeachersSet.add(classInfo.teacherId)
      }
    })
  
  // Actualizar contadores de salones y maestros
  classroomsInUse.value = activeRooms.size
  activeTeachers.value = activeTeachersSet.size
  
  // Calcular porcentajes de asistencia
  const totalActiveStudents = studentsStore.activeStudents.length
  if (totalActiveStudents > 0) {
    attendancePercentage.value = Math.round((studentsPresent.value / totalActiveStudents) * 100)
  }
  
  const totalTeachers = teachersStore.teachers.length
  if (totalTeachers > 0) {
    teacherAttendancePercentage.value = Math.round((activeTeachers.value / totalTeachers) * 100)
  }
}

// Función para contar estudiantes únicos presentes hoy
function countUniquePresentStudents(): number {
  // Esta función implementa el procedimiento detallado para contar estudiantes únicos
  // utilizando los datos en attendanceStore.attendanceDocuments
  
  const currentDate = format(new Date(), 'yyyy-MM-dd')
  const uniqueStudentIds = new Set<string>()
  
  attendanceStore.attendanceDocuments
    .filter(doc => doc.fecha === currentDate)
    .forEach(doc => {
      // Añadir cada ID de estudiante presente al conjunto
      doc.data.presentes.forEach(studentId => {
        uniqueStudentIds.add(studentId)
      })
    })
  
  return uniqueStudentIds.size
}
</script>

<style scoped>
.admin-dashboard {
  min-height: 100vh;
  background-color: #f3f4f6;
}
</style>