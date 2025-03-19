<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useStudentsStore } from '../stores/students'
import { useClassesStore } from '../stores/classes'
import { useTeachersStore } from '../stores/teachers'
import html2pdf from 'html2pdf.js'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { CalendarIcon, ClockIcon, AcademicCapIcon, BuildingOfficeIcon, UserIcon, DocumentArrowDownIcon, ShareIcon } from '@heroicons/vue/24/outline'

const route = useRoute()
const router = useRouter()
const studentsStore = useStudentsStore()
const classesStore = useClassesStore()
const teachersStore = useTeachersStore()

const studentId = computed(() => route.params.id as string)
const isLoading = ref(true)
const error = ref<string | null>(null)
const showShareOptions = ref(false)

// Student data
const student = ref(null)

// Schedule data
const studentClasses = ref([])
const weekdays = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado']

// Mejora en la carga de datos de clases
const loadData = async () => {
  try {
    isLoading.value = true
    error.value = null
    
    // Validar ID del estudiante
    if (!studentId.value) {
      throw new Error('ID de estudiante no proporcionado')
    }
    
    // Carga paralela de datos necesarios
    await Promise.all([
      studentsStore.fetchStudents(),
      classesStore.fetchClasses(),
      teachersStore.fetchTeachers()
    ])
    
    // Obtener estudiante
    student.value = studentsStore.getStudentById(studentId.value)
    
    if (!student.value) {
      throw new Error('Estudiante no encontrado')
    }
    
    // Obtener clases del estudiante con manejo mejorado de errores
    studentClasses.value = classesStore.classes
      .filter(classItem => {
        // Validar que la clase tenga studentIds y sea un array
        if (!classItem || !classItem.studentIds || !Array.isArray(classItem.studentIds)) {
          return false
        }
        return classItem.studentIds.includes(studentId.value)
      })
      .map(classItem => {
        // Buscar profesor
        let teacherName = 'Sin profesor asignado'
        if (classItem.teacherId) {
          const teacher = teachersStore.getTeacherById(classItem.teacherId)
          if (teacher) {
            teacherName = `${teacher.name || ''} ${teacher.apellido || ''}`.trim() || teacher.email || 'Sin nombre'
          }
        }
        
        // Asegurarse de que schedule e items relacionados existan
        const schedule = classItem.schedule || {}
        const days = Array.isArray(schedule.days) ? schedule.days : []
        const startTime = schedule.startTime || ''
        const endTime = schedule.endTime || ''
        
        return {
          id: classItem.id,
          name: classItem.name || 'Clase sin nombre',
          teacher: teacherName,
          days: days,
          startTime: startTime,
          endTime: endTime,
          location: classItem.description || classItem.location || 'Por definir', // Usar description como ubicación
          subject: classItem.subject || classItem.name || 'No especificado',
          color: getRandomColor(classItem.id) // Usar ID para color consistente
        }
      })
      
    console.log(`Clases cargadas para el estudiante: ${studentClasses.value.length}`, studentClasses.value)
    
    // Si no hay clases, mostrar mensaje pero no error
    if (studentClasses.value.length === 0) {
      console.log('No se encontraron clases para este estudiante')
    }
    
  } catch (err: any) {
    console.error('Error cargando datos:', err)
    error.value = err.message || 'Error cargando horario'
  } finally {
    isLoading.value = false
  }
}

// Get teacher from class
const getTeacherName = (teacherId: string) => {
  const teacher = teachersStore.getTeacherById(teacherId)
  return teacher ? `${teacher.name || ''} ${teacher.apellido || ''}` : 'Sin profesor'
}

// Mejorar función para obtener color (consistente para cada clase)
const getRandomColor = (seed: string) => {
  const colors = [
    'bg-blue-100 text-blue-800 border-blue-200',
    'bg-green-100 text-green-800 border-green-200',
    'bg-yellow-100 text-yellow-800 border-yellow-200',
    'bg-red-100 text-red-800 border-red-200',
    'bg-purple-100 text-purple-800 border-purple-200',
    'bg-pink-100 text-pink-800 border-pink-200',
    'bg-indigo-100 text-indigo-800 border-indigo-200'
  ]
  // Usar suma de caracteres del ID para seleccionar color
  const charSum = seed.split('').reduce((sum, char) => sum + char.charCodeAt(0), 0)
  return colors[charSum % colors.length]
}

// Format time for display
const formatTime = (time: string) => {
  if (!time) return ''
  return time
}

// Mejorar función para obtener clases por día con manejo mejorado
const getClassesByDay = (day: string) => {
  if (!day) return []
  
  return studentClasses.value
    .filter(classItem => {
      if (!Array.isArray(classItem.days)) return false
      return classItem.days.some(d => {
        // Manejo seguro de comparación
        if (typeof d !== 'string') return false
        return d.toLowerCase() === day.toLowerCase()
      })
    })
    .sort((a, b) => {
      // Ordenar por hora de inicio (con manejo de valores nulos)
      if (!a.startTime) return 1
      if (!b.startTime) return -1
      return a.startTime.localeCompare(b.startTime)
    })
}

// Count weekly activities
const weeklyActivitiesCount = computed(() => {
  let count = 0
  weekdays.forEach(day => {
    count += getClassesByDay(day).length
  })
  return count
})

// Calculate total weekly hours
const weeklyHours = computed(() => {
  let totalMinutes = 0
  
  studentClasses.value.forEach(classItem => {
    if (classItem.startTime && classItem.endTime) {
      const [startHour, startMinute] = classItem.startTime.split(':').map(Number)
      const [endHour, endMinute] = classItem.endTime.split(':').map(Number)
      
      let duration = (endHour * 60 + endMinute) - (startHour * 60 + startMinute)
      if (duration < 0) duration += 24 * 60 // Handle crossing midnight
      
      totalMinutes += duration * classItem.days.length
    }
  })
  
  // Convert minutes to hours and minutes
  const hours = Math.floor(totalMinutes / 60)
  const minutes = totalMinutes % 60
  
  return `${hours}h ${minutes > 0 ? minutes + 'm' : ''}`
})

// Generate and download PDF
const downloadPDF = () => {
  const element = document.getElementById('schedule-pdf')
  const options = {
    margin: 10,
    filename: `horario_${student.value.nombre}_${student.value.apellido}.pdf`,
    image: { type: 'jpeg', quality: 0.98 },
    html2canvas: { scale: 2, useCORS: true },
    jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
  }
  
  html2pdf().from(element).set(options).save()
}

// Share schedule
const shareSchedule = async () => {
  try {
    // Primero generamos el PDF como un blob
    const element = document.getElementById('schedule-pdf')
    const options = {
      margin: 10,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    }
    
    const pdfBlob = await html2pdf().from(element).set(options).outputPdf('blob')
    
    // Crear un objeto File para compartir
    const file = new File(
      [pdfBlob], 
      `horario_${student.value.nombre}_${student.value.apellido}.pdf`, 
      { type: 'application/pdf' }
    )
    
    // Verificar si el navegador soporta Web Share API
    if (navigator.share && navigator.canShare({ files: [file] })) {
      await navigator.share({
        files: [file],
        title: `Horario de ${student.value.nombre} ${student.value.apellido}`,
        text: 'Aquí está el horario de clases'
      })
    } else {
      // Fallback para navegadores que no soportan compartir archivos
      showShareOptions.value = true
      // Crear un URL para que el usuario pueda descargar manualmente
      const fileURL = URL.createObjectURL(file)
      window.open(fileURL, '_blank')
    }
  } catch (error) {
    console.error('Error al compartir:', error)
  }
}

// Format date
const getCurrentDate = () => {
  return format(new Date(), 'PPP', { locale: es })
}

// Agregar un watcher para recargar datos si cambia el ID
watch(() => route.params.id, async (newId) => {
  if (newId) {
    await loadData()
  }
})

onMounted(async () => {
  await loadData()
})

// Determinar si estamos en modo desarrollo
const isDevelopmentMode = ref(false)

// Intenta establecer el modo de desarrollo de manera segura
try {
  // @ts-ignore - Ignorar error de TypeScript por acceder a import.meta
  isDevelopmentMode.value = import.meta.env.DEV === true
} catch (e) {
  console.log('No se pudo determinar el modo de desarrollo')
  isDevelopmentMode.value = false
}

// Añadir métodos para formatear contenido
const formatDayName = (day: string) => {
  const dayNames = {
    'lunes': 'Lunes',
    'martes': 'Martes',
    'miercoles': 'Miércoles',
    'miércoles': 'Miércoles',
    'jueves': 'Jueves',
    'viernes': 'Viernes',
    'sabado': 'Sábado',
    'sábado': 'Sábado',
    'domingo': 'Domingo'
  };
  return dayNames[day.toLowerCase()] || day;
}

// Formatear hora de manera más legible
const formatTimeDisplay = (time: string) => {
  if (!time) return '';
  
  // Convertir formato 24h a 12h para mejor legibilidad
  const [hours, minutes] = time.split(':');
  const hourNum = parseInt(hours);
  const ampm = hourNum >= 12 ? 'PM' : 'AM';
  const hour12 = hourNum % 12 || 12;
  
  return `${hour12}:${minutes} ${ampm}`;
}

// Formatear fecha más completa
const getCurrentFormattedDate = () => {
  return format(new Date(), "EEEE, d 'de' MMMM 'de' yyyy", { locale: es });
}
</script>

<template>
  <div class="p-4 max-w-5xl mx-auto">
    <!-- Header con título y botones -->
    <div class="mb-6 flex flex-col md:flex-row md:justify-between md:items-center gap-4">
      <div>
        <h1 class="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <CalendarIcon class="h-7 w-7 text-primary-600" />
          Horario de Clases
        </h1>
        <p v-if="student" class="text-gray-600 dark:text-gray-400 mt-1 text-lg">
          {{ student.nombre }} {{ student.apellido }}
        </p>
      </div>
      
      <div class="flex gap-2">
        <button 
          @click="downloadPDF"
          class="btn btn-primary flex items-center gap-2 transition-all hover:scale-105"
        >
          <DocumentArrowDownIcon class="w-5 h-5" />
          Descargar PDF
        </button>
        
        <button 
          @click="shareSchedule"
          class="btn btn-outline flex items-center gap-2 transition-all hover:scale-105"
        >
          <ShareIcon class="w-5 h-5" />
          Compartir
        </button>
      </div>
    </div>

    <!-- Loading state -->
    <div v-if="isLoading" class="flex justify-center items-center py-12">
      <div class="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600"></div>
    </div>

    <!-- Error state -->
    <div v-else-if="error" class="bg-red-100 dark:bg-red-900/30 p-4 rounded-lg text-red-700 dark:text-red-400">
      {{ error }}
      <button @click="loadData" class="ml-2 underline">Reintentar</button>
    </div>

    <!-- No classes message -->
    <div v-else-if="!isLoading && !error && student && studentClasses.length === 0" 
         class="bg-yellow-50 border border-yellow-200 text-yellow-700 p-4 rounded-lg mb-6">
      <p class="font-medium">Este alumno no tiene clases asignadas.</p>
      <p class="text-sm mt-1">Puedes asignar clases al estudiante desde la sección de administración de clases.</p>
    </div>

    <!-- PDF Document -->
    <div 
      v-else-if="student"
      id="schedule-pdf" 
      class="bg-white text-black p-6 sm:p-8 rounded-lg shadow-lg mx-auto"
      style="min-height: 297mm; width: 210mm; max-width: 100%;"
    >
      <!-- Encabezado -->
      <div class="flex justify-between items-start border-b-2 border-gray-300 pb-4 mb-6">
        <div>
          <div class="flex items-center gap-2">
            <img src="../assets/ElSistemaPCLogo.jpeg" alt="Logo Academia" class="h-12 w-auto" />
            <div>
              <h1 class="text-2xl font-bold text-primary-700">Academia de Música</h1>
              <p class="text-gray-600">Horario Personal de Clases</p>
            </div>
          </div>
        </div>
        <div class="text-right">
          <p class="font-semibold text-gray-700">{{ getCurrentFormattedDate() }}</p>
          <p class="text-sm text-gray-500">Año Académico {{ new Date().getFullYear() }}</p>
        </div>
      </div>
      
      <!-- Datos del alumno -->
      <div class="mb-8">
        <div class="flex items-center gap-2 bg-primary-50 p-3 rounded-t-lg border-b-2 border-primary-200">
          <UserIcon class="h-5 w-5 text-primary-700" />
          <h2 class="text-lg font-bold text-primary-700">Información del Alumno</h2>
        </div>
        
        <div class="bg-gray-50 p-4 rounded-b-lg shadow-sm">
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-3">
            <div class="flex items-center">
              <span class="font-semibold w-32 text-gray-700">Nombre:</span> 
              <span class="text-gray-800">{{ student.nombre }} {{ student.apellido }}</span>
            </div>
            <div class="flex items-center">
              <span class="font-semibold w-32 text-gray-700">ID:</span> 
              <span class="text-gray-600 text-sm">{{ student.id }}</span>
            </div>
            <div v-if="student.instrumento" class="flex items-center">
              <span class="font-semibold w-32 text-gray-700">Instrumento:</span> 
              <span class="text-gray-800">{{ student.instrumento }}</span>
            </div>
            <div v-if="student.nivel" class="flex items-center">
              <span class="font-semibold w-32 text-gray-700">Nivel:</span> 
              <span class="text-gray-800">{{ student.nivel }}</span>
            </div>
            <div v-if="student.email" class="flex items-center">
              <span class="font-semibold w-32 text-gray-700">Email:</span> 
              <span class="text-gray-800">{{ student.email }}</span>
            </div>
            <div v-if="student.tlf" class="flex items-center">
              <span class="font-semibold w-32 text-gray-700">Teléfono:</span> 
              <span class="text-gray-800">{{ student.tlf }}</span>
            </div>
          </div>
          
          <div class="mt-5 p-3 bg-blue-50 rounded-lg border border-blue-100">
            <p class="font-semibold text-blue-800 mb-2">Resumen de Actividades</p>
            <div class="flex gap-x-6 gap-y-2 flex-wrap">
              <div class="flex items-center">
                <CalendarIcon class="h-5 w-5 mr-1 text-blue-700" />
                <span><strong>{{ weeklyActivitiesCount }}</strong> actividades semanales</span>
              </div>
              <div class="flex items-center">
                <ClockIcon class="h-5 w-5 mr-1 text-blue-700" />
                <span><strong>{{ weeklyHours }}</strong> horas semanales</span>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <!-- Horario por día -->
      <div class="mb-8">
        <div class="flex items-center gap-2 bg-primary-50 p-3 rounded-t-lg border-b-2 border-primary-200">
          <CalendarIcon class="h-5 w-5 text-primary-700" />
          <h2 class="text-lg font-bold text-primary-700">Horario de Clases</h2>
        </div>

        <div class="bg-gray-50 p-4 rounded-b-lg shadow-sm">
          <div v-for="(day, index) in weekdays" :key="day" 
               class="mb-5 last:mb-0"
               :class="{'border-b pb-5': index < weekdays.length - 1}">
            <h3 class="font-semibold text-lg flex items-center gap-2 mb-3 text-gray-800">
              <span class="w-7 h-7 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center text-sm font-bold">
                {{ day.charAt(0) }}
              </span>
              {{ day }}
            </h3>
            
            <div v-if="getClassesByDay(day).length > 0" class="space-y-3 pl-9">
              <div 
                v-for="classItem in getClassesByDay(day)" 
                :key="`${day}-${classItem.id}`"
                class="p-3 rounded-md border-l-4 shadow-sm transition-all"
                :class="classItem.color"
              >
                <div class="flex justify-between items-start">
                  <h4 class="font-semibold text-base">{{ classItem.name }}</h4>
                  <div class="flex items-center px-2 py-1 rounded-full bg-white bg-opacity-60 text-xs">
                    <ClockIcon class="h-3 w-3 mr-1" />
                    {{ formatTimeDisplay(classItem.startTime) }} - {{ formatTimeDisplay(classItem.endTime) }}
                  </div>
                </div>
                
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-x-3 gap-y-1 mt-2 text-sm">
                  <div class="flex items-center">
                    <AcademicCapIcon class="h-4 w-4 mr-1 flex-shrink-0" />
                    <span class="truncate">{{ classItem.teacher }}</span>
                  </div>
                  <div class="flex items-center">
                    <BuildingOfficeIcon class="h-4 w-4 mr-1 flex-shrink-0" />
                    <span class="truncate">{{ classItem.location }}</span>
                  </div>
                  <div class="sm:col-span-2 mt-1 text-xs border-t border-gray-200 border-opacity-60 pt-1 text-gray-700">
                    {{ classItem.subject }}
                  </div>
                </div>
              </div>
            </div>
            
            <div v-else class="text-gray-500 italic pl-9">
              No hay clases programadas
            </div>
          </div>
        </div>
      </div>
      
      <!-- Información de contacto -->
      <div class="mb-6 p-4 bg-gray-50 rounded-lg shadow-sm">
        <h3 class="font-semibold mb-3 text-gray-800 border-b pb-1">Contactos Importantes:</h3>
        <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-x-4 gap-y-3 text-sm">
          <div v-if="student.padre" class="bg-white p-2 rounded border border-gray-100">
            <p><span class="font-semibold text-gray-700">Padre:</span> {{ student.padre }}</p>
            <p v-if="student.tlf_padre" class="text-gray-600"><span class="font-semibold">Teléfono:</span> {{ student.tlf_padre }}</p>
          </div>
          <div v-if="student.madre" class="bg-white p-2 rounded border border-gray-100">
            <p><span class="font-semibold text-gray-700">Madre:</span> {{ student.madre }}</p>
            <p v-if="student.tlf_madre" class="text-gray-600"><span class="font-semibold">Teléfono:</span> {{ student.tlf_madre }}</p>
          </div>
          <div v-if="student.tutor" class="bg-white p-2 rounded border border-gray-100">
            <p><span class="font-semibold text-gray-700">Tutor:</span> {{ student.tutor }}</p>
            <p v-if="student.tlf_tutor" class="text-gray-600"><span class="font-semibold">Teléfono:</span> {{ student.tlf_tutor }}</p>
          </div>
        </div>
      </div>
      
      <!-- Footer -->
      <div class="mt-8 pt-4 border-t text-center text-sm text-gray-500">
        <p>Este horario puede estar sujeto a cambios. Para más información, contacte con la Academia de Música.</p>
        <p class="mt-1">© {{ new Date().getFullYear() }} Academia de Música - Todos los derechos reservados</p>
      </div>
    </div>

    <!-- No student data -->
    <div v-else class="text-center py-12 text-gray-500">
      No se encontró información del estudiante
    </div>
  </div>
</template>

<style scoped>
/* Estilos adicionales para mejorar la impresión */
@media print {
  body {
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
  }
  
  #schedule-pdf {
    margin: 0;
    padding: 15mm;
    box-shadow: none;
  }
}

/* Animaciones suaves */
.btn {
  transition: all 0.3s ease;
}

/* Efectos de hover para las clases */
#schedule-pdf [class*="bg-"] {
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

#schedule-pdf [class*="bg-"]:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 6px rgba(0,0,0,0.1);
}
</style>
