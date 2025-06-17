<template>
  <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
    <div class="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
      <!-- Header -->
      <div class="p-6 border-b border-gray-200 dark:border-gray-700">
        <div class="flex items-center justify-between">
          <h2 class="text-2xl font-bold text-gray-900 dark:text-white flex items-center">
            <DocumentTextIcon class="w-6 h-6 mr-2 text-emerald-500" />
            Generador de PDFs - Listados de Alumnos
          </h2>
          <button @click="$emit('close')" class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
            <XMarkIcon class="w-6 h-6" />
          </button>
        </div>
        <p class="text-gray-600 dark:text-gray-400 mt-2">
          Generar reportes personalizados con diferentes filtros y formatos
        </p>
      </div>

      <!-- Content -->
      <div class="p-6 space-y-6">        <!-- Report Type Selection -->
        <div>
          <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
            <CogIcon class="w-5 h-5 mr-2 text-blue-500" />
            Tipo de Reporte
          </h3>
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div
              v-for="type in reportTypes"
              :key="type.id"
              @click="selectedReportType = type.id"
              class="p-4 border-2 rounded-lg cursor-pointer transition-all duration-200 hover:shadow-md"
              :class="[
                selectedReportType === type.id 
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' 
                  : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500',
                'bg-white dark:bg-gray-700'
              ]"
            >
              <div class="flex items-center space-x-3">
                <div 
                  class="w-12 h-12 rounded-lg flex items-center justify-center"
                  :class="`bg-gradient-to-r from-${type.color}-500 to-${type.color}-600`"
                >
                  <component :is="type.icon" class="w-6 h-6 text-white" />
                </div>
                
                <div class="flex-1">
                  <h4 class="font-semibold text-gray-900 dark:text-white">
                    {{ type.title }}
                  </h4>
                  <p class="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    {{ type.description }}
                  </p>
                </div>
                
                <div v-if="selectedReportType === type.id" class="text-blue-500">
                  <CheckCircleIcon class="w-6 h-6" />
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Filter Options -->
        <div v-if="selectedReportType">
          <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
            <FunnelIcon class="w-5 h-5 mr-2 text-purple-500" />
            Filtros de Datos
          </h3>
          
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <!-- Class Filter -->
            <div v-if="showClassFilter">
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Clase Específica
              </label>
              <select 
                v-model="selectedClass"
                class="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="">Todas las clases</option>
                <option v-for="cls in availableClasses" :key="cls.id" :value="cls.id">
                  {{ cls.name }} - {{ cls.instrument }}
                </option>
              </select>
            </div>

            <!-- Teacher Filter -->
            <div v-if="showTeacherFilter">
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Maestro Específico
              </label>
              <select 
                v-model="selectedTeacher"
                class="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="">Todos los maestros</option>
                <option v-for="teacher in availableTeachers" :key="teacher.id" :value="teacher.id">
                  {{ teacher.name }}
                </option>
              </select>
            </div>

            <!-- Day Filter -->
            <div v-if="showDayFilter">
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Día de la Semana
              </label>
              <select 
                v-model="selectedDay"
                class="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="">Todos los días</option>
                <option value="lunes">Lunes</option>
                <option value="martes">Martes</option>
                <option value="miercoles">Miércoles</option>
                <option value="jueves">Jueves</option>
                <option value="viernes">Viernes</option>
                <option value="sabado">Sábado</option>
                <option value="domingo">Domingo</option>
              </select>
            </div>

            <!-- Age Range Filter -->
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Rango de Edad
              </label>
              <div class="flex space-x-2">
                <input 
                  v-model.number="ageRange.min"
                  type="number"
                  placeholder="Min"
                  class="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
                <input 
                  v-model.number="ageRange.max"
                  type="number"
                  placeholder="Max"
                  class="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
            </div>

            <!-- Active Status Filter -->
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Estado del Alumno
              </label>
              <select 
                v-model="selectedStatus"
                class="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="">Todos</option>
                <option value="active">Activos</option>
                <option value="inactive">Inactivos</option>
              </select>
            </div>
          </div>
        </div>

        <!-- Data Fields Selection -->
        <div v-if="selectedReportType">
          <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
            <ClipboardDocumentListIcon class="w-5 h-5 mr-2 text-green-500" />
            Campos a Incluir
          </h3>
          
          <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            <label 
              v-for="field in availableFields" 
              :key="field.id"
              class="flex items-center space-x-2 p-3 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer"
              :class="{ 'bg-blue-50 dark:bg-blue-900/20 border-blue-500': selectedFields.includes(field.id) }"
            >
              <input 
                type="checkbox" 
                :value="field.id"
                v-model="selectedFields"
                class="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span class="text-sm font-medium text-gray-700 dark:text-gray-300">{{ field.label }}</span>
            </label>
          </div>
        </div>

        <!-- PDF Format Options -->
        <div v-if="selectedReportType">
          <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
            <DocumentIcon class="w-5 h-5 mr-2 text-orange-500" />
            Opciones de Formato
          </h3>
          
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Orientación
              </label>
              <select 
                v-model="pdfOptions.orientation"
                class="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="portrait">Vertical (Portrait)</option>
                <option value="landscape">Horizontal (Landscape)</option>
              </select>
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Tamaño de Página
              </label>
              <select 
                v-model="pdfOptions.pageSize"
                class="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="letter">Carta (Letter)</option>
                <option value="a4">A4</option>
                <option value="legal">Legal</option>
              </select>
            </div>

            <div class="md:col-span-2">
              <label class="flex items-center space-x-2">
                <input 
                  type="checkbox" 
                  v-model="pdfOptions.includeHeader"
                  class="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span class="text-sm font-medium text-gray-700 dark:text-gray-300">Incluir encabezado con logo de la academia</span>
              </label>
            </div>

            <div class="md:col-span-2">
              <label class="flex items-center space-x-2">
                <input 
                  type="checkbox" 
                  v-model="pdfOptions.includeDate"
                  class="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span class="text-sm font-medium text-gray-700 dark:text-gray-300">Incluir fecha de generación</span>
              </label>
            </div>
          </div>
        </div>

        <!-- Advanced Options -->
        <div v-if="selectedReportType">
          <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
            <CogIcon class="w-5 h-5 mr-2 text-orange-500" />
            Opciones Avanzadas
          </h3>
          
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <!-- Include Photos -->
            <div class="flex items-center space-x-3">
              <input 
                type="checkbox" 
                id="includePhotos"
                v-model="pdfOptions.includePhotos"
                class="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <label for="includePhotos" class="text-sm font-medium text-gray-700 dark:text-gray-300">
                Incluir fotos de estudiantes
              </label>
            </div>

            <!-- Group by Class -->
            <div class="flex items-center space-x-3" v-if="selectedReportType === 'all'">
              <input 
                type="checkbox" 
                id="groupByClass"
                v-model="pdfOptions.groupByClass"
                class="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <label for="groupByClass" class="text-sm font-medium text-gray-700 dark:text-gray-300">
                Agrupar por clase
              </label>
            </div>

            <!-- Include Statistics -->
            <div class="flex items-center space-x-3">
              <input 
                type="checkbox" 
                id="includeStats"
                v-model="pdfOptions.includeStatistics"
                class="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <label for="includeStats" class="text-sm font-medium text-gray-700 dark:text-gray-300">
                Incluir estadísticas resumen
              </label>
            </div>

            <!-- Sort Options -->
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Ordenar por
              </label>
              <select 
                v-model="pdfOptions.sortBy"
                class="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="name">Nombre (A-Z)</option>
                <option value="age">Edad</option>
                <option value="class">Clase</option>
                <option value="instrument">Instrumento</option>
                <option value="enrollment">Fecha de inscripción</option>
              </select>
            </div>
          </div>
        </div>

        <!-- Preview Section -->
        <div v-if="selectedReportType && previewData.length > 0">
          <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
            <EyeIcon class="w-5 h-5 mr-2 text-indigo-500" />
            Vista Previa ({{ previewData.length }} registros)
          </h3>
          
          <div class="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 max-h-60 overflow-y-auto">
            <div class="text-xs text-gray-600 dark:text-gray-400 mb-2">
              Mostrando los primeros 5 registros
            </div>
            <div class="space-y-2">
              <div 
                v-for="(student, index) in previewData.slice(0, 5)" 
                :key="student.id"
                class="text-sm text-gray-700 dark:text-gray-300 p-2 bg-white dark:bg-gray-600 rounded"
              >
                <strong>{{ index + 1 }}.</strong> {{ student.nombre }} {{ student.apellido }} - {{ student.edad }} años
                <span v-if="student.clase" class="ml-2 text-blue-600 dark:text-blue-400">({{ student.clase }})</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Actions -->
      <div class="p-6 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-750">
        <div class="flex items-center justify-between">
          <div class="text-sm text-gray-600 dark:text-gray-400">
            <span v-if="previewData.length > 0">
              {{ previewData.length }} estudiantes encontrados
            </span>
          </div>
          
          <div class="flex space-x-3">
            <button 
              @click="$emit('close')"
              class="px-6 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
            >
              Cancelar
            </button>
            
            <button 
              @click="generatePreview"
              :disabled="!selectedReportType"
              class="px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg transition-colors flex items-center"
            >
              <EyeIcon class="w-4 h-4 mr-2" />
              Vista Previa
            </button>
            
            <button 
              @click="generatePDF"
              :disabled="!selectedReportType || previewData.length === 0 || isGenerating"
              class="px-6 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-400 text-white rounded-lg transition-colors flex items-center"
            >
              <DocumentArrowDownIcon v-if="!isGenerating" class="w-4 h-4 mr-2" />
              <div v-else class="w-4 h-4 mr-2 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              {{ isGenerating ? 'Generando...' : 'Generar PDF' }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { 
  DocumentTextIcon, 
  XMarkIcon, 
  CogIcon, 
  FunnelIcon, 
  ClipboardDocumentListIcon,
  DocumentIcon,
  EyeIcon,
  DocumentArrowDownIcon,
  CheckCircleIcon,
  AcademicCapIcon,
  UserGroupIcon,
  CalendarDaysIcon,
  UsersIcon,
  TableCellsIcon
} from '@heroicons/vue/24/outline'
import html2pdf from 'html2pdf.js'
import { useStudentsStore } from '../../Students/store/students'
import { useClassesStore } from '../../Classes/store/classes'
import { useTeachersStore } from '../../Teachers/store/teachers'

// Stores
const studentsStore = useStudentsStore()
const classesStore = useClassesStore()
const teachersStore = useTeachersStore()

// Emits
defineEmits<{
  close: []
  generate: [options: any]
}>()

// State
const selectedReportType = ref('')
const selectedClass = ref('')
const selectedTeacher = ref('')
const selectedDay = ref('')
const selectedStatus = ref('')
const ageRange = ref({ min: null, max: null })
const selectedFields = ref<string[]>(['nombre', 'apellido', 'edad', 'telefono'])
const previewData = ref<any[]>([])
const isGenerating = ref(false)

const pdfOptions = ref({
  orientation: 'portrait',
  pageSize: 'letter',
  includeHeader: true,
  includeDate: true,
  includePhotos: false,
  groupByClass: false,
  includeStatistics: false,
  sortBy: 'name'
})

// Report Types Configuration
const reportTypes = ref([
  {
    id: 'by_class',
    title: 'Por Clase',
    description: 'Estudiantes agrupados por clase',
    icon: AcademicCapIcon,
    color: 'blue'
  },
  {
    id: 'by_teacher',
    title: 'Por Maestro',
    description: 'Estudiantes agrupados por maestro',
    icon: UserGroupIcon,
    color: 'green'
  },
  {
    id: 'by_day',
    title: 'Por Día',
    description: 'Estudiantes que tienen clases en un día específico',
    icon: CalendarDaysIcon,
    color: 'purple'
  },
  {
    id: 'all_students',
    title: 'Todos los Alumnos',
    description: 'Lista completa de estudiantes inscritos',
    icon: UsersIcon,
    color: 'orange'
  },
  {
    id: 'schedule_matrix',
    title: 'Matriz de Horarios',
    description: 'Horarios de todos los estudiantes en formato matriz',
    icon: TableCellsIcon,
    color: 'red'
  }
])

// Available Fields for PDF
const availableFields = ref([
  { id: 'nombre', label: 'Nombre' },
  { id: 'apellido', label: 'Apellido' },
  { id: 'edad', label: 'Edad' },
  { id: 'fechaNacimiento', label: 'Fecha de Nacimiento' },
  { id: 'telefono', label: 'Teléfono' },
  { id: 'email', label: 'Email' },
  { id: 'direccion', label: 'Dirección' },
  { id: 'nombreTutor', label: 'Nombre del Tutor' },
  { id: 'telefonoTutor', label: 'Teléfono del Tutor' },
  { id: 'clase', label: 'Clase' },
  { id: 'instrumento', label: 'Instrumento' },
  { id: 'maestro', label: 'Maestro' },
  { id: 'horario', label: 'Horario' },
  { id: 'fechaInscripcion', label: 'Fecha de Inscripción' },
  { id: 'estado', label: 'Estado' }
])

// Computed Properties
const availableClasses = computed(() => classesStore.classes || [])
const availableTeachers = computed(() => teachersStore.teachers || [])

const showClassFilter = computed(() => 
  ['by_class', 'all_students'].includes(selectedReportType.value)
)

const showTeacherFilter = computed(() => 
  ['by_teacher', 'all_students'].includes(selectedReportType.value)
)

const showDayFilter = computed(() => 
  ['by_day', 'schedule_matrix'].includes(selectedReportType.value)
)

// Methods
const generatePreview = async () => {
  try {    // Load data from stores
    await Promise.all([
      studentsStore.fetchStudents(),
      classesStore.fetchClasses(),
      teachersStore.fetchTeachers()
    ])

    let filteredStudents = [...studentsStore.students]

    // Apply filters based on selected criteria
    if (selectedClass.value) {
      filteredStudents = filteredStudents.filter(s => s.classId === selectedClass.value)
    }

    if (selectedTeacher.value) {
      const teacherClasses = availableClasses.value.filter(c => c.teacherId === selectedTeacher.value)
      const classIds = teacherClasses.map(c => c.id)
      filteredStudents = filteredStudents.filter(s => classIds.includes(s.classId))
    }

    if (selectedStatus.value) {
      filteredStudents = filteredStudents.filter(s => 
        selectedStatus.value === 'active' ? s.activo : !s.activo
      )
    }

    if (ageRange.value.min || ageRange.value.max) {
      filteredStudents = filteredStudents.filter(s => {
        const age = calculateAge(s.fechaNacimiento)
        const min = ageRange.value.min || 0
        const max = ageRange.value.max || 100
        return age >= min && age <= max
      })
    }

    // Enrich student data with additional info
    previewData.value = filteredStudents.map(student => ({
      ...student,
      edad: calculateAge(student.fechaNacimiento),
      clase: getClassName(student.classId),
      maestro: getTeacherName(student.classId),
      instrumento: getClassInstrument(student.classId)
    }))

  } catch (error) {
    console.error('Error generating preview:', error)
  }
}

const generatePDF = async () => {
  if (!selectedReportType.value || previewData.value.length === 0) return

  isGenerating.value = true

  try {
    const pdfContent = generatePDFContent()
    const element = document.createElement('div')
    element.innerHTML = pdfContent
    element.style.position = 'absolute'
    element.style.left = '-9999px'
    document.body.appendChild(element)

    const opt = {
      margin: 1,
      filename: generateFileName(),
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true },
      jsPDF: { 
        unit: 'in', 
        format: pdfOptions.value.pageSize, 
        orientation: pdfOptions.value.orientation 
      }
    }

    await html2pdf().set(opt).from(element).save()
    document.body.removeChild(element)

  } catch (error) {
    console.error('Error generating PDF:', error)
  } finally {
    isGenerating.value = false
  }
}

const generatePDFContent = () => {
  const reportType = reportTypes.value.find(r => r.id === selectedReportType.value)
  const currentDate = new Date().toLocaleDateString('es-ES')
  
  let content = `
    <div style="font-family: Arial, sans-serif; max-width: 100%; margin: 0 auto; padding: 20px;">
  `

  // Header
  if (pdfOptions.value.includeHeader) {
    content += `
      <div style="text-align: center; margin-bottom: 30px; border-bottom: 2px solid #333; padding-bottom: 20px;">
        <h1 style="color: #333; font-size: 24px; margin-bottom: 5px;">ACADEMIA DE MÚSICA</h1>
        <h2 style="color: #666; font-size: 18px; margin-bottom: 5px;">${reportType?.title || 'Listado de Estudiantes'}</h2>
        ${pdfOptions.value.includeDate ? `<p style="color: #888; font-size: 12px;">Generado el: ${currentDate}</p>` : ''}
      </div>
    `
  }

  // Content based on report type
  if (selectedReportType.value === 'by_class') {
    content += generateByClassContent()
  } else if (selectedReportType.value === 'by_teacher') {
    content += generateByTeacherContent()
  } else if (selectedReportType.value === 'by_day') {
    content += generateByDayContent()
  } else if (selectedReportType.value === 'schedule_matrix') {
    content += generateScheduleMatrixContent()
  } else {
    content += generateAllStudentsContent()
  }

  content += `</div>`
  return content
}

const generateByClassContent = () => {
  const groupedByClass = groupBy(previewData.value, 'clase')
  let content = ''

  Object.entries(groupedByClass).forEach(([className, students]) => {
    const studentList = students as any[]
    content += `
      <div style="margin-bottom: 30px;">
        <h3 style="background-color: #f0f0f0; padding: 10px; margin-bottom: 15px; font-size: 16px; color: #333;">
          ${className} (${studentList.length} estudiantes)
        </h3>
        ${generateStudentTable(studentList)}
      </div>
    `
  })

  return content
}

const generateByTeacherContent = () => {
  const groupedByTeacher = groupBy(previewData.value, 'maestro')
  let content = ''

  Object.entries(groupedByTeacher).forEach(([teacherName, students]) => {
    const studentList = students as any[]
    content += `
      <div style="margin-bottom: 30px;">
        <h3 style="background-color: #f0f0f0; padding: 10px; margin-bottom: 15px; font-size: 16px; color: #333;">
          Maestro: ${teacherName} (${studentList.length} estudiantes)
        </h3>
        ${generateStudentTable(studentList)}
      </div>
    `
  })

  return content
}

const generateByDayContent = () => {
  // For day-based reports, we'd need schedule information
  return generateStudentTable(previewData.value)
}

const generateScheduleMatrixContent = () => {
  // Generate a matrix-style schedule view
  return generateStudentTable(previewData.value)
}

const generateAllStudentsContent = () => {
  let content = ''
  
  // Add statistics if enabled
  if (pdfOptions.value.includeStatistics) {
    content += generateStatisticsSection()
  }
  
  // Sort students if needed
  let sortedStudents = [...previewData.value]
  if (pdfOptions.value.sortBy) {
    sortedStudents = sortStudents(sortedStudents, pdfOptions.value.sortBy)
  }
  
  // Group by class if enabled
  if (pdfOptions.value.groupByClass) {
    content += generateGroupedByClassContent(sortedStudents)
  } else {
    content += generateStudentTable(sortedStudents)
  }
  
  return content
}

const generateStudentTable = (students: any[]) => {
  if (students.length === 0) return '<p style="text-align: center; color: #666; font-style: italic; padding: 20px; background: #f8f9fa; border-radius: 8px; border: 1px dashed #ccc;">📋 No hay estudiantes que coincidan con los criterios seleccionados.</p>'
  let table = `
    <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 12px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
      <thead>
        <tr style="background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%); color: white;">
  `

  // Add photo column if enabled
  if (pdfOptions.value.includePhotos) {
    table += `<th style="border: 1px solid #dee2e6; padding: 10px; text-align: center; width: 60px;">Foto</th>`
  }

  // Generate headers based on selected fields
  selectedFields.value.forEach(fieldId => {
    const field = availableFields.value.find(f => f.id === fieldId)
    if (field) {
      table += `<th style="border: 1px solid #dee2e6; padding: 10px; text-align: left; font-weight: 600;">${field.label}</th>`
    }
  })

  table += `
        </tr>
      </thead>
      <tbody>
  `

  // Generate rows
  students.forEach((student, index) => {    table += `<tr style="background-color: ${index % 2 === 0 ? '#f8f9fa' : 'white'}; transition: background-color 0.2s;">`
    
    // Add photo cell if enabled
    if (pdfOptions.value.includePhotos) {
      const photoUrl = student.photoURL || student.avatar || ''
      if (photoUrl) {
        table += `<td style="border: 1px solid #dee2e6; padding: 8px; text-align: center;">
          <img src="${photoUrl}" style="width: 40px; height: 40px; border-radius: 50%; object-fit: cover;" />
        </td>`
      } else {
        table += `<td style="border: 1px solid #dee2e6; padding: 8px; text-align: center; color: #999;">
          <div style="width: 40px; height: 40px; border-radius: 50%; background: #e9ecef; display: flex; align-items: center; justify-content: center; font-size: 16px;">👤</div>
        </td>`
      }
    }
    
    selectedFields.value.forEach(fieldId => {
      let cellValue = ''
      let cellStyle = 'border: 1px solid #dee2e6; padding: 8px;'
      
      switch (fieldId) {
        case 'fechaNacimiento':
          cellValue = formatDate(student[fieldId])
          break
        case 'fechaInscripcion':
          cellValue = formatDate(student[fieldId])
          break
        case 'edad':
          cellValue = student.edad ? `${student.edad} años` : '-'
          cellStyle += ' text-align: center;'
          break
        case 'estado':
          const isActive = student.activo
          cellValue = isActive ? '✅ Activo' : '❌ Inactivo'
          cellStyle += ` color: ${isActive ? '#28a745' : '#dc3545'}; font-weight: 500;`
          break
        case 'telefono':
          cellValue = student[fieldId] ? `📞 ${student[fieldId]}` : '-'
          break
        case 'email':
          cellValue = student[fieldId] ? `✉️ ${student[fieldId]}` : '-'
          break
        case 'instrumento':
          cellValue = student[fieldId] ? `🎵 ${student[fieldId]}` : '-'
          break
        case 'clase':
          cellValue = student[fieldId] ? `📚 ${student[fieldId]}` : '-'
          break
        default:
          cellValue = student[fieldId] || '-'
      }
      
      table += `<td style="${cellStyle}">${cellValue}</td>`
    })
    
    table += `</tr>`
  })

  table += `
      </tbody>
    </table>
  `

  return table
}

// Helper Functions
const calculateAge = (birthDate: any) => {
  if (!birthDate) return 0
  const today = new Date()
  const birth = new Date(birthDate)
  let age = today.getFullYear() - birth.getFullYear()
  const monthDiff = today.getMonth() - birth.getMonth()
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--
  }
  return age
}

const getClassName = (classId: string) => {
  const cls = availableClasses.value.find(c => c.id === classId)
  return cls ? cls.name : 'Sin clase'
}

const getTeacherName = (classId: string) => {
  const cls = availableClasses.value.find(c => c.id === classId)
  if (!cls) return 'Sin maestro'
  const teacher = availableTeachers.value.find(t => t.id === cls.teacherId)
  return teacher ? teacher.name : 'Sin maestro'
}

const getClassInstrument = (classId: string) => {
  const cls = availableClasses.value.find(c => c.id === classId)
  return cls ? cls.instrument : 'Sin instrumento'
}

const formatDate = (date: any) => {
  if (!date) return '-'
  try {
    return new Date(date).toLocaleDateString('es-ES')
  } catch {
    return '-'
  }
}

const groupBy = (array: any[], key: string) => {
  return array.reduce((groups, item) => {
    const group = item[key] || 'Sin especificar'
    groups[group] = groups[group] || []
    groups[group].push(item)
    return groups
  }, {})
}

const generateFileName = () => {
  const reportType = reportTypes.value.find(r => r.id === selectedReportType.value)
  const date = new Date().toISOString().split('T')[0]
  return `listado_estudiantes_${reportType?.title.toLowerCase().replace(/\s+/g, '_')}_${date}.pdf`
}

// Helper functions for enhanced PDF generation
const generateStatisticsSection = () => {
  const totalStudents = previewData.value.length
  const activeStudents = previewData.value.filter(s => s.estado === 'active').length
  const classesCounts = {}
  const instrumentCounts = {}
  let totalAge = 0
  
  previewData.value.forEach(student => {
    // Count by class
    const clase = student.clase || 'Sin clase'
    classesCounts[clase] = (classesCounts[clase] || 0) + 1
    
    // Count by instrument  
    const instrumento = student.instrumento || 'Sin instrumento'
    instrumentCounts[instrumento] = (instrumentCounts[instrumento] || 0) + 1
    
    // Sum ages for average
    if (student.edad) totalAge += student.edad
  })
  
  const averageAge = totalStudents > 0 ? (totalAge / totalStudents).toFixed(1) : 0
  
  return `
    <div style="background-color: #f8f9fa; padding: 15px; margin-bottom: 25px; border-radius: 5px;">
      <h3 style="color: #333; margin-bottom: 15px; font-size: 16px;">📊 Estadísticas Generales</h3>
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px;">
        <div style="background: white; padding: 10px; border-radius: 3px; border-left: 4px solid #007bff;">
          <strong>Total de Estudiantes:</strong> ${totalStudents}
        </div>
        <div style="background: white; padding: 10px; border-radius: 3px; border-left: 4px solid #28a745;">
          <strong>Estudiantes Activos:</strong> ${activeStudents}
        </div>
        <div style="background: white; padding: 10px; border-radius: 3px; border-left: 4px solid #ffc107;">
          <strong>Edad Promedio:</strong> ${averageAge} años
        </div>
        <div style="background: white; padding: 10px; border-radius: 3px; border-left: 4px solid #dc3545;">
          <strong>Clases Diferentes:</strong> ${Object.keys(classesCounts).length}
        </div>
      </div>
      
      <div style="margin-top: 15px;">
        <h4 style="color: #555; font-size: 14px; margin-bottom: 8px;">Distribución por Instrumento:</h4>
        <div style="font-size: 12px; color: #666;">
          ${Object.entries(instrumentCounts).map(([inst, count]) => `${inst}: ${count}`).join(' • ')}
        </div>
      </div>
    </div>
  `
}

const sortStudents = (students: any[], sortBy: string) => {
  return students.sort((a, b) => {
    switch (sortBy) {
      case 'name':
        return (a.nombre || '').localeCompare(b.nombre || '')
      case 'age':
        return (a.edad || 0) - (b.edad || 0)
      case 'class':
        return (a.clase || '').localeCompare(b.clase || '')
      case 'instrument':
        return (a.instrumento || '').localeCompare(b.instrumento || '')
      case 'enrollment':
        return new Date(a.fechaInscripcion || 0).getTime() - new Date(b.fechaInscripcion || 0).getTime()
      default:
        return 0
    }
  })
}

const generateGroupedByClassContent = (students: any[]) => {
  const groupedByClass = groupBy(students, 'clase')
  let content = ''

  Object.entries(groupedByClass).forEach(([className, classStudents]) => {
    const studentList = classStudents as any[]
    content += `
      <div style="margin-bottom: 30px; page-break-inside: avoid;">
        <h3 style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 12px; margin-bottom: 15px; font-size: 16px; border-radius: 5px;">
          🎵 ${className} (${studentList.length} estudiantes)
        </h3>
        ${generateStudentTable(studentList)}
      </div>
    `
  })

  return content
}

// Watchers
watch(selectedReportType, () => {
  previewData.value = []
  selectedClass.value = ''
  selectedTeacher.value = ''
  selectedDay.value = ''
})

// Lifecycle
onMounted(async () => {
  try {
    await Promise.all([
      classesStore.fetchClasses(),
      teachersStore.fetchTeachers()
    ])
  } catch (error) {
    console.error('Error loading initial data:', error)
  }
})
</script>

<style scoped>
/* Custom styles for the modal */
.animate-spin {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}
</style>
