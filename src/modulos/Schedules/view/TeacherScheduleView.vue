<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { useTeachersStore } from '@/modulos/Teachers/store/teachers'
import { useClassesStore } from '@/modulos/Classes/store/classes'
import { useScheduleStore } from '@/modulos/Schedules/store/schedule'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import TeacherWeeklySchedule from '../../Teachers/components/TeacherWeeklySchedule.vue'
import html2pdf from 'html2pdf.js'
import type { SVGAttributes } from 'vue'
import { 
  CalendarIcon, 
  DocumentArrowDownIcon, 
  ShareIcon, 
  UserIcon 
} from '@heroicons/vue/24/outline'
import { getAuth } from 'firebase/auth'

// Definir interfaces
export interface HeroIconProps extends SVGAttributes {}

// Interfaces para los datos
interface TimeSlot {
  startTime: string;
  endTime: string;
  duration: number;
}

interface ScheduleDay {
  dayOfWeek: string;
  timeSlot: TimeSlot;
  classId: string;
  teacherId: string;
  roomId: string;
  studentIds: string[];
}

interface ScheduleItem {
  scheduleDay: ScheduleDay;
}

interface Teacher {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  photoURL?: string;
  specialties?: string[];
  experiencia: {
    institution?: string;
    description?: string;
    role?: string;
  };
}

interface Schedule {
  totalClasses: number;
  weeklyHours: number;
  hasConflicts?: boolean;
  schedule: Array<{
    dayOfWeek: string;
    className: string;
    startTime: string;
    endTime: string;
    classId: string;
    room: string;
    studentCount: number;
  }>;
}

const route = useRoute()
const teachersStore = useTeachersStore()
const classesStore = useClassesStore()
const scheduleStore = useScheduleStore()
const auth = getAuth()

// Agregar tipos explícitos para mejorar la seguridad de tipos
const teacherId = computed(() => {
  // Primero intentar obtener el ID del usuario autenticado
  if (auth.currentUser) return auth.currentUser.uid
  // Si no hay usuario autenticado, usar el ID de la ruta
  return route.params.id as string
})
const isLoading = ref(true)
const error = ref<string | null>(null)

const teacher = ref<Teacher | null>(null)
const schedule = ref<Schedule | null>(null)
const teacherClasses = ref<any[]>([])

// Función para cargar datos del maestro y su horario
const loadData = async () => {
  try {
    isLoading.value = true
    error.value = null
    // Cargar maestros si aún no se han cargado
    await teachersStore.fetchTeachers()
    teacher.value = teachersStore.getTeacherById(teacherId.value)
    if (!teacher.value) {
      throw new Error('No se encontró información del maestro. Por favor verifique que el ID sea correcto o contacte al administrador.')
    }
    
    // Cargar horarios desde el store de schedules
    await scheduleStore.fetchAllSchedules()
    const teacherSchedules = scheduleStore.getSchedulesByTeacher(teacher.value.id)
    
    // Procesar los horarios para obtener la información necesaria
    if (teacherSchedules && teacherSchedules.length > 0) {
      // Obtener clases para el componente TeacherWeeklySchedule
      await classesStore.fetchClasses()
      teacherClasses.value = teacherSchedules.map(scheduleItem => {
        const classInfo = classesStore.getClassById(scheduleItem.scheduleDay.classId)
        return {
          id: scheduleItem.scheduleDay.classId,
          name: classInfo?.name || 'Clase sin nombre',
          teacherId: scheduleItem.scheduleDay.teacherId,
          instrument: classInfo?.instrument || '',
          classroom: scheduleItem.scheduleDay.roomId,
          studentIds: scheduleItem.scheduleDay.studentIds,
          schedule: [{
            day: scheduleItem.scheduleDay.dayOfWeek,
            startTime: scheduleItem.scheduleDay.timeSlot.startTime,
            endTime: scheduleItem.scheduleDay.timeSlot.endTime
          }]
        }
      })
      
      // Calcular métricas para mostrar en la vista
      const weeklyHours = teacherSchedules.reduce((total, s) => {
        return total + (s.scheduleDay.timeSlot.duration / 60)
      }, 0)
      
      // Crear objeto de horario para la vista
      schedule.value = {
        totalClasses: teacherSchedules.length,
        weeklyHours: weeklyHours,
        hasConflicts: false, // Podría implementarse detección de conflictos
        schedule: teacherSchedules.map(s => ({
          dayOfWeek: s.scheduleDay.dayOfWeek,
          className: classesStore.getClassById(s.scheduleDay.classId)?.name || 'Clase sin nombre',
          startTime: s.scheduleDay.timeSlot.startTime,
          endTime: s.scheduleDay.timeSlot.endTime,
          classId: s.scheduleDay.classId,
          room: s.scheduleDay.roomId,
          studentCount: s.scheduleDay.studentIds.length
        }))
      }
    } else {
      // Si no hay horarios en el store de schedules, intentar con el método del store de teachers
      schedule.value = await teachersStore.getTeacherSchedule(teacher.value.id)
    }
  } catch (err: any) {
    console.error('Error cargando datos:', err)
    error.value = err.message || 'Error cargando datos'
  } finally {
    isLoading.value = false
  }
}

onMounted(async () => {
  await loadData()
  // mostrar la consulta a firebase desde el store
  console.log('Teacher Classes:', getTeacherClasses(teacherId.value))
})

const formatHours = (hours: number): string => {
  return `${Math.floor(hours)} h ${Math.round((hours % 1) * 60)} min`
}

// PDF & compartir
const downloadPDF = (): void => {
  const element = document.getElementById('schedule-pdf')
  if (!element || !teacher.value) return;
  
  const options = {
    margin: 10,
    filename: `horario_${teacher.value.name}.pdf`,
    image: { type: 'jpeg', quality: 0.98 },
    html2canvas: { scale: 2, useCORS: true },
    jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
  }
  
  html2pdf().from(element).set(options).save()
}

const shareSchedule = async (): Promise<void> => {
  if (!teacher.value) return;
  
  try {
    const element = document.getElementById('schedule-pdf')
    if (!element) return;
    
    const options = {
      margin: 10,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    }
    const pdfBlob = await html2pdf().from(element).set(options).outputPdf('blob')
    const file = new File([pdfBlob], `horario_${teacher.value.name}.pdf`, { type: 'application/pdf' })
    
    if (navigator.share && navigator.canShare({ files: [file] })) {
      await navigator.share({
        files: [file],
        title: `Horario de ${teacher.value.name}`,
        text: 'Aquí está el horario de clases'
      })
    } else {
      const fileURL = URL.createObjectURL(file)
      window.open(fileURL, '_blank')
    }
  } catch (error) {
    console.error('Error al compartir:', error)
  }
}

const getCurrentFormattedDate = (): string => {
  return format(new Date(), "EEEE, d 'de' MMMM 'de' yyyy", { locale: es })
}

const getTeacherClasses = (teacherId: string) => {
  if (!teacherId) return []
  return teacherClasses.value.length > 0 ? teacherClasses.value : classesStore.classes.filter(class_ => class_.teacherId === teacherId)
}
</script>

<template>
  <div class="p-2 max-w-5xl mx-auto pb-2">
    <!-- Header con título y botones -->
    <div class="mb-4 flex flex-col md:flex-row md:justify-between md:items-center gap-2">
      <div>
        <h1 class="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-1">
          <CalendarIcon class="h-6 w-6 text-primary-600" />
          Horario de Clases
        </h1>
        <p v-if="teacher" class="text-gray-600 dark:text-gray-400 mt-0.5 text-sm">
          {{ teacher.name }}
        </p>
      </div>
      
      <div class="flex flex-wrap gap-1.5">
        <button 
          @click="downloadPDF"
          class="btn btn-primary flex items-center gap-1.5 py-1.5 px-3 text-sm"
          aria-label="Descargar PDF"
        >
          <DocumentArrowDownIcon class="w-4 h-4" />
          <span class="hidden sm:inline">PDF</span>
        </button>
        
        <button 
          @click="shareSchedule"
          class="btn btn-outline flex items-center gap-1.5 py-1.5 px-3 text-sm"
          aria-label="Compartir horario"
        >
          <ShareIcon class="w-4 h-4" />
          <span class="hidden sm:inline">Compartir</span>
        </button>
      </div>
    </div>

    <!-- Loading / Error -->
    <div v-if="isLoading" class="flex justify-center items-center py-8">
      <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
    </div>
    <div v-else-if="error" class="bg-red-100 dark:bg-red-900/30 p-3 rounded-lg text-red-700 dark:text-red-400 text-sm">
      {{ error }}
      <button @click="loadData" class="ml-2 underline">Reintentar</button>
    </div>
    
    <!-- PDF Document -->
    <div 
      v-else-if="teacher && !isLoading && !error"
      id="schedule-pdf" 
      class="bg-white text-black p-3 sm:p-5 rounded-lg shadow mx-auto"
      style="min-height: auto; width: 100%; max-width: 100%;"
    >
      <!-- Encabezado -->
      <div class="flex flex-col sm:flex-row justify-between items-start border-b border-gray-300 sm:pb-3 mb-4">
        <div>
          <div class="flex items-center gap-2">
            <!-- Puede sustituir por el logo de la Academia -->
            <img src="@/assets/ElSistemaPCLogo.jpeg" alt="Logo Academia" class="h-6 sm:h-10 w-auto" />
            <div>
              <h1 class="text-lg sm:text-xl font-bold text-primary-700">Academia de Música</h1>
              <p class="text-xs sm:text-sm text-gray-600">Horario de Clases - Maestro</p>
            </div>
          </div>
        </div>
        <div class="text-right mt-2 sm:mt-0">
          <p class="font-semibold text-gray-700 text-sm">{{ getCurrentFormattedDate() }}</p>
          <p class="text-xs text-gray-500">Año Académico {{ new Date().getFullYear() }}</p>
        </div>
      </div>
      
      <!-- Información del maestro -->
      <div class="mb-4 sm:mb-1">
        <div class="flex items-center gap-1.5 bg-primary-50 p-1 rounded-t-lg border-b border-primary-200">
          <UserIcon class="h-4 w-4 text-primary-700" />
          <h2 class="text-base font-bold text-primary-700">Información del Maestro</h2>
        </div>
        
        <div class="bg-gray-50 p-1 rounded-b-lg shadow-sm">
          <div class="flex flex-row items-center gap-3">
            <img
              :src="teacher.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${teacher.name}`"
              :alt="teacher.name"
              class="w-12 h-12 rounded-full"
            />
            <div class="flex-1 min-w-0">
              <h3 class="text-base font-bold truncate">{{ teacher.name }}</h3>
              <div class="flex flex-wrap gap-1 mt-0.5">
                <span
                  v-for="specialty in teacher.specialties || []"
                  :key="specialty"
                  class="px-1.5 py-0.5 text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200 rounded-full"
                >
                  {{ specialty }}
                </span>
              </div>
            </div>
          </div>
          
          <!-- Datos adicionales (se pueden ampliar según disponibilidad) -->
          <div class="grid grid-cols-2 gap-2 text-xs mt-2">
            <div class="col-span-2 sm:col-span-1 block">
              <span class="text-gray-500 dark:text-gray-400">Experiencia:</span>
              <span class="ml-1 font-medium">{{ teacher.experiencia?.institution || "No disponible" }}</span>
            </div>
            <div class="col-span-2 sm:col-span-1 block">
              <span class="text-gray-500 dark:text-gray-400">Teléfono:</span>
              <span class="ml-1 font-medium">{{ teacher.phone || "No disponible" }}</span>
            </div>
            <div class="col-span-2 sm:col-span-1 block sm:hidden">
              <span class="text-gray-500 dark:text-gray-400">Email:</span>
              <span class="ml-1 font-medium truncate ">{{ teacher.email || "No disponible" }}</span>
            </div>
            <div class="col-span-2 flex justify-between" v-if="schedule">
              <div class="col-span-2 sm:col-span-1 block sm:hidden">
              <span class="text-gray-500 dark:text-gray-400">Clases:</span>
              <span class="ml-1 font-medium">{{ schedule.totalClasses }}</span>
              </div>
              <div class="col-span-2 sm:col-span-1 block sm:hidden" >
              <span class="text-gray-500 dark:text-gray-400">Horas:</span>
              <span class="ml-1 font-medium">{{ formatHours(schedule.weeklyHours) }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <!-- Horario de Clases -->
      <div class="mb-4">
        <div class="flex items-center gap-1.5 bg-primary-50 p-2 rounded-t-lg border-b border-primary-200">
          <CalendarIcon class="h-4 w-4 text-primary-700" />
          <h2 class="text-base font-bold text-primary-700">Horario de Clases</h2>
        </div>
        <div class="bg-gray-50 p-2 rounded-b-lg shadow-sm overflow-x-auto">
          <div v-if="schedule && schedule.totalClasses > 0" class="space-y-3">
   
            <div v-if="schedule.hasConflicts" class="bg-yellow-50 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-200 p-2 rounded-lg text-xs">
              ⚠️ Hay conflictos en el horario
            </div>
            
            <!-- Integración del componente TeacherWeeklySchedule -->
            <TeacherWeeklySchedule :teacherId="teacherId" />
          </div>
          <div v-else class="text-center py-3 text-gray-500 text-sm">
            No hay clases asignadas
          </div>
        </div>
      </div>
      
      <!-- Footer -->
      <div class="mt-4 pt-2 border-t text-center text-xs text-gray-500">
        <p>Este horario puede estar sujeto a cambios. Para más información, contacte con la Administración.</p>
        <p class="mt-0.5">© {{ new Date().getFullYear() }} El Sistema Punta Cana</p>
      </div>
    </div>
    
    <!-- En caso de no encontrar el maestro -->
    <div v-else class="text-center py-8 text-gray-500 text-sm">
      No se encontró información del maestro
    </div>
  </div>
</template>

<style scoped>
@media print {
  body {
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
    color-adjust: exact !important; /* Agregar propiedad estándar */
  }
  #schedule-pdf {
    margin: 0;
    padding: 12mm;
    box-shadow: none;
  }
}
.btn {
  transition: all 0.2s ease;
}
#schedule-pdf [class*="bg-"] {
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}
#schedule-pdf [class*="bg-"]:hover {
  transform: translateY(-1px);
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

/* Reduce el espaciado en mobile */
@media (max-width: 640px) {
  #schedule-pdf {
    padding: 8px;
  }
  
  .mb-4 {
    margin-bottom: 0.75rem;
  }
  
  .gap-2 {
    gap: 0.375rem;
  }
  
  .p-3 {
    padding: 0.625rem;
  }
  
  .text-base {
    font-size: 0.9rem;
  }
}

/* Clase utilitaria para reducir el interlineado */
.leading-tight {
  line-height: 1.2;
}
</style>