<template>
  <div class="p-4 max-w-5xl mx-auto">
    <!-- Encabezado con título y botones -->
    <div class="mb-6 flex flex-col md:flex-row md:justify-between md:items-center gap-4">
      <div>
        <h1 class="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <CalendarIcon class="h-7 w-7 text-primary-600" />
          Horario de Clases
        </h1>
        <p v-if="teacher" class="text-gray-600 dark:text-gray-400 mt-1 text-lg">
          {{ teacher.name }}
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

    <!-- Contenido principal: vista del PDF y datos del maestro -->
    <div v-if="teacher" id="schedule-pdf" 
         class="bg-white text-black p-6 sm:p-8 rounded-lg shadow-lg mx-auto"
         style="min-height:297mm; width:210mm; max-width:100%;">
      <!-- Sección de encabezado del PDF -->
      <div class="flex justify-between items-start border-b-2 border-gray-300 pb-4 mb-6">
        <div>
          <div class="flex items-center gap-2">
            <img src="../../../assets/ElSistemaPCLogo.jpeg" alt="Logo Academia" class="h-12 w-auto" />
            <div>
              <h1 class="text-2xl font-bold text-primary-700">El Sistema PC</h1>
              <p class="text-gray-600">Horario de Clases - Maestro</p>
            </div>
          </div>
        </div>
        <div class="text-right">
          <p class="font-semibold text-gray-700">{{ getCurrentFormattedDate() }}</p>
          <p class="text-sm text-gray-500">Año Académico {{ new Date().getFullYear() }}</p>
        </div>
      </div>

      <!-- Información del maestro -->
      <div class="mb-8">
        <div class="flex items-center gap-2 bg-primary-50 p-3 rounded-t-lg border-b-2 border-primary-200">
          <UserIcon class="h-5 w-5 text-primary-700" />
          <h2 class="text-lg font-bold text-primary-700">Información del Maestro</h2>
        </div>
        <div class="bg-gray-50 p-4 rounded-b-lg shadow-sm profile-section">
          <!-- Cabecera de perfil con foto y nombre -->
          <div class="flex flex-col sm:flex-row items-center sm:items-start gap-4 mb-6 pb-6 border-b border-gray-200">
            <div class="relative">
              <img
                :src="teacher.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${teacher.name}`"
                :alt="teacher.name"
                class="w-24 h-24 sm:w-28 sm:h-28 rounded-full object-cover border-4 border-white shadow"
              />
              <div class="absolute bottom-0 right-0 w-6 h-6 bg-green-500 rounded-full border-2 border-white"></div>
            </div>
            <div class="text-center sm:text-left">
              <h3 class="text-2xl font-bold text-gray-800">{{ teacher.name }}</h3>
              <p class="text-gray-600 mb-3">{{ teacher.role || "Profesor" }}</p>
              <div class="flex flex-wrap justify-center sm:justify-start gap-1 mt-1">
                <span
                  v-for="specialty in teacher.specialties || []"
                  :key="specialty"
                  class="px-2.5 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full"
                >
                  {{ specialty }}
                </span>
                <span v-if="!teacher.specialties?.length" class="px-2.5 py-1 text-xs font-medium bg-gray-100 text-gray-800 rounded-full">
                  Educación Musical
                </span>
              </div>
            </div>
          </div>
          
          <!-- Información y disponibilidad -->
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <!-- Información de contacto -->
            <div>
              <h4 class="text-lg font-semibold text-gray-700 mb-3">Información de Contacto</h4>
              <div class="space-y-4">
                <div class="flex items-center gap-3">
                  <div class="flex-shrink-0 w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-600">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div>
                    <p class="text-sm text-gray-500">Email</p>
                    <p class="font-medium">{{ teacher.email || "No disponible" }}</p>
                  </div>
                </div>
                
                <div class="flex items-center gap-3">
                  <div class="flex-shrink-0 w-10 h-10 bg-green-100 rounded-full flex items-center justify-center text-green-600">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                  </div>
                  <div>
                    <p class="text-sm text-gray-500">Teléfono</p>
                    <p class="font-medium">{{ teacher.phone || "No disponible" }}</p>
                  </div>
                </div>
                
                <div class="flex items-center gap-3">
                  <div class="flex-shrink-0 w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center text-amber-600">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                    </svg>
                  </div>
                  <div>
                    <p class="text-sm text-gray-500">Experiencia</p>
                    <p class="font-medium">{{ teacher.experiencia || "No especificada" }}</p>
                  </div>
                </div>
              </div>
            </div>
            
            <!-- Sección de disponibilidad -->
            <div>
              <h4 class="text-lg font-semibold text-gray-700 mb-3">Disponibilidad</h4>
              <div class="bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
                <!-- Días de la semana -->
                <div class="grid grid-cols-7 gap-1 mb-4">
                  <div v-for="(day, i) in ['D', 'L', 'M', 'X', 'J', 'V', 'S']" :key="i"
                    :class="[
                      'text-center py-1.5 font-medium rounded text-sm availability-day',
                      isAvailableDay(i) ? 'bg-primary-100 text-primary-700' : 'bg-gray-100 text-gray-400'
                    ]"
                  >
                    {{ day }}
                  </div>
                </div>
                
                <!-- Bloques de horario -->
                <div class="space-y-2">
                  <div v-for="(timeBlock, idx) in getFormattedAvailability()" :key="idx"
                    class="flex items-center bg-primary-50 text-primary-700 px-3 py-2 rounded-md"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>{{ timeBlock }}</span>
                  </div>
                  <div v-if="!getFormattedAvailability().length" class="text-center text-gray-500 py-2">
                    No hay horarios específicos registrados
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Horario de Clases -->
      <div class="mb-8">
        <div class="flex items-center gap-2 bg-primary-50 p-3 rounded-t-lg border-b-2 border-primary-200">
          <CalendarIcon class="h-5 w-5 text-primary-700" />
          <h2 class="text-lg font-bold text-primary-700">Horario de Clases</h2>
        </div>
        <div class="bg-gray-50 p-4 rounded-b-lg shadow-sm">
          <div v-if="schedule && schedule.totalClasses > 0" class="space-y-4">
            <div class="grid grid-cols-2 gap-4">
              <div class="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg">
                <div class="text-sm text-gray-500 dark:text-gray-400">Clases Asignadas</div>
                <div class="text-xl font-semibold">{{ schedule.totalClasses }}</div>
              </div>
              <div class="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg">
                <div class="text-sm text-gray-500 dark:text-gray-400">Horas Semanales</div>
                <div class="text-xl font-semibold">{{ formatHours(schedule.weeklyHours) }}</div>
              </div>
            </div>
            <div v-if="schedule.hasConflicts" class="bg-yellow-50 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-200 p-3 rounded-lg text-sm">
              ⚠️ Hay conflictos en el horario
            </div>
            <ScheduleManager :schedule="schedule" :teacherId="teacher?.id" />
          </div>
          <div v-else class="text-center py-4 text-gray-500">
            No hay clases asignadas
          </div>
        </div>
      </div>

      <!-- Footer -->
      <div class="mt-8 pt-4 border-t text-center text-sm text-gray-500">
        <p>Este horario puede estar sujeto a cambios. Para más información, contacte con la Administracion.</p>
        <p class="mt-1">© {{ new Date().getFullYear() }} El Sistema Punta Cana - Todos los derechos reservados</p>
      </div>
    </div>

    <!-- Mensaje de error o ausencia de información -->
    <div v-else-if="!isLoading && error" class="p-4 max-w-5xl mx-auto text-center">
      <div class="bg-red-100 dark:bg-red-900/30 p-4 rounded-lg text-red-700 dark:text-red-400">
        <p class="mb-2">{{ error }}</p>
        <p>Este módulo está diseñado para maestros. Si eres maestro y ves este mensaje, por favor contacta al administrador.</p>
        <button @click="loadData(authStore.user?.uid)" class="mt-4 btn btn-secondary">
          Reintentar
        </button>
      </div>
    </div>

    <div v-else class="text-center py-12 text-gray-500">
      No se encontró información del maestro
    </div>
  </div>
</template>

<script setup lang="ts">
import html2pdf from 'html2pdf.js'
import { ref, computed, onMounted } from 'vue'
import { useTeachersStore } from '../../Teachers/store/teachers'
import { useClassesStore } from '../../Classes/store/classes'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { CalendarIcon, UserIcon, DocumentArrowDownIcon, ShareIcon } from '@heroicons/vue/24/outline'
import ScheduleNavigation from '../components/ScheduleNavigation.vue'
import ScheduleManager from './ScheduleManager.vue'
import { useAuthStore } from '../../../stores/auth'

const authStore = useAuthStore()
const teachersStore = useTeachersStore()
const classesStore = useClassesStore()
const teacherId = ref("")
const isLoading = ref(true)
const error = ref<string | null>(null)
const teacher = ref<any>(null)
const schedule = ref<any>(null)

const loadData = async (uid: string) => {
  try {
    isLoading.value = true
    error.value = null
    console.log('Intentando cargar datos para UID:', uid)
    
    if (!uid) {
      error.value = 'Usuario no autenticado'
      return
    }
    
    await teachersStore.fetchTeachers()
    
    const foundTeacher = teachersStore.teachers.find(t => t.uid === uid || t.id === uid)
    if (foundTeacher) {
      teacher.value = foundTeacher
      schedule.value = await teachersStore.getTeacherSchedule(foundTeacher.id)
      console.log('Maestro encontrado:', teacher.value)
    } else {
      await teachersStore.fetchTeachers(true)
      const retryTeacher = teachersStore.teachers.find(t => t.uid === uid || t.id === uid)
      
      if (retryTeacher) {
        teacher.value = retryTeacher
        schedule.value = await teachersStore.getTeacherSchedule(retryTeacher.id)
        console.log('Maestro encontrado en segundo intento:', teacher.value)
      } else {
        console.error('No se pudo encontrar al maestro con UID:', uid)
        console.log('Maestros disponibles:', teachersStore.teachers)
        error.value = 'No se pudo encontrar información del maestro'
      }
    }
  } catch (err: any) {
    console.error('Error cargando datos:', err)
    error.value = err.message || 'Error cargando datos'
  } finally {
    isLoading.value = false
  }
}

onMounted(async () => {
  authStore.$subscribe((mutation, state) => {
    if (state.user) {
      teacherId.value = state.user.uid
      loadData(state.user.uid)
    }
  })
  
  if (authStore.user) {
    teacherId.value = authStore.user.uid
    await loadData(authStore.user.uid)
  } else {
    console.log('Esperando autenticación del usuario...')
  }
})

const formatHours = (hours: number) => {
  return `${Math.floor(hours)} h ${Math.round((hours % 1) * 60)} min`
}

const downloadPDF = () => {
  const element = document.getElementById('schedule-pdf')
  const options = {
    margin: 10,
    filename: `horario_${teacher.value ? teacher.value.name : 'maestro'}.pdf`,
    image: { type: 'jpeg', quality: 0.98 },
    html2canvas: { scale: 2, useCORS: true },
    jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
  }
  
  html2pdf().from(element).set(options).save()
}

const shareSchedule = async () => {
  try {
    if (!teacher.value) {
      console.error('No hay información del maestro para compartir')
      return
    }

    const element = document.getElementById('schedule-pdf')
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

const getCurrentFormattedDate = () => {
  return format(new Date(), "EEEE, d 'de' MMMM 'de' yyyy", { locale: es })
}

const getTeacherClasses = (teacherId: string) => {
  if (!teacherId) return []
  return classesStore.classes.filter(class_ => class_.teacherId === teacherId)
}

const isAvailableDay = (dayIndex: number): boolean => {
  if (!teacher.value || !schedule.value || !schedule.value.schedule) return false;
  
  const dayNames = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
  const dayName = dayNames[dayIndex];
  
  return schedule.value.schedule.some((slot: any) => 
    slot.dayOfWeek && slot.dayOfWeek.toLowerCase() === dayName
  );
};

const getFormattedAvailability = () => {
  if (!teacher.value || !schedule.value || !schedule.value.schedule) return [];
  
  const dayGroups: Record<string, string[]> = {};
  
  schedule.value.schedule.forEach((slot: any) => {
    if (slot.dayOfWeek) {
      const day = slot.dayOfWeek.charAt(0).toUpperCase() + slot.dayOfWeek.slice(1);
      const timeRange = `${slot.startTime || '--:--'} - ${slot.endTime || '--:--'}`;
      
      if (!dayGroups[day]) {
        dayGroups[day] = [];
      }
      
      dayGroups[day].push(timeRange);
    }
  });
  
  return Object.entries(dayGroups).map(([day, times]) => {
    const uniqueTimes = [...new Set(times)];
    return `${day}: ${uniqueTimes.join(', ')}`;
  });
};
</script>

<style scoped>
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
.btn {
  transition: all 0.3s ease;
}
#schedule-pdf [class*="bg-"] {
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}
#schedule-pdf [class*="bg-"]:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 6px rgba(0,0,0,0.1);
}

/* Nuevos estilos para la sección del perfil */
.profile-section {
  transition: all 0.3s ease;
}
.profile-section:hover {
  box-shadow: 0 4px 20px rgba(0,0,0,0.08);
}

/* Mejoras para la disponibilidad */
.availability-day {
  transition: all 0.2s ease;
}
.availability-day:hover {
  transform: scale(1.05);
}
</style>
