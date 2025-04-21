<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { useTeachersStore } from '../../../modulos/Teachers/store/teachers'
import { useClassesStore } from '../../../modulos/Classes/store/classes'
import { useScheduleStore } from '../../../modulos/Schedules/store/schedule'
import { useUserSessionsStore as useUserStore } from '../../../modulos/Users/store/userSessions'
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
  // Usar primero el ID de la ruta si existe
  if (route.params.id) return route.params.id as string
  
  // Si no hay ID en la ruta, intentar usar el ID del usuario autenticado
  return auth.currentUser?.uid || ''
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
    
    // Verificar que tengamos un teacherId válido de la ruta o del usuario actual
    if (!teacherId.value) {
      // Si estamos autenticados pero no tenemos ID de maestro, intentar buscar por usuario
      if (auth.currentUser) {
        console.log('Usuario autenticado pero sin ID de maestro, buscando por userId:', auth.currentUser.uid)
        // Intentar cargar un maestro basado en el ID de usuario
        try {
          // Asegurarnos que los maestros estén cargados
          await teachersStore.fetchTeachers()
          
          // Buscar un maestro que tenga el userId correspondiente al usuario actual
          const teacherByUserId = teachersStore.teachers.find(t => t.uid === auth.currentUser?.uid)
          
          if (teacherByUserId) {
            console.log('Maestro encontrado mediante userId:', teacherByUserId.id)
            teacher.value = {
              ...teacherByUserId,
              experiencia: typeof teacherByUserId.experiencia === 'string' 
                ? { institution: teacherByUserId.experiencia } 
                : teacherByUserId.experiencia
            }
            return // Continuar con el maestro encontrado
          }
        } catch (e) {
          console.warn('Error al buscar maestro por userId:', e)
        }
      }
      
      throw new Error('No se puede determinar el ID del maestro. Por favor inicie sesión o verifique la URL.')
    }

    // MÉTODO 3.5: Buscar explícitamente por authUid
    if (!teacher.value && auth.currentUser && teachersStore.fetchTeacherByAuthUid) {
      console.log('Buscando maestro por authUid en Firebase:', auth.currentUser.uid)
      try {
        const teacherByAuthUid = await teachersStore.fetchTeacherByAuthUid(auth.currentUser.uid)
        if (teacherByAuthUid) {
          console.log('Maestro encontrado por authUid:', teacherByAuthUid.id)
          teacher.value = {
            ...teacherByAuthUid,
            experiencia: typeof teacherByAuthUid.experiencia === 'string' 
              ? { institution: teacherByAuthUid.experiencia } 
              : teacherByAuthUid.experiencia
          }
        }
      } catch (e) {
        console.warn('Error al buscar maestro por authUid:', e)
      }
    }
    
    console.log('Buscando maestro con ID:', teacherId.value)
    
    // MÉTODO 1: Intentar usando getTeacherById directamente (puede funcionar si ya está en caché)
    if (teachersStore.getTeacherById) {
      const fetchedTeacher = teachersStore.getTeacherById(teacherId.value)
      if (fetchedTeacher) {
        teacher.value = {
          ...fetchedTeacher,
          experiencia: typeof fetchedTeacher.experiencia === 'string'
            ? { institution: fetchedTeacher.experiencia }
            : fetchedTeacher.experiencia
        }
        console.log('Maestro encontrado en caché:', teacher.value.name)
      }
    }
    
    // MÉTODO 2: Si no lo encontramos, cargar todos los maestros y volver a intentar
    if (!teacher.value) {
      console.log('Maestro no encontrado en caché, cargando todos los maestros...')
      await teachersStore.fetchTeachers()
      
      if (teachersStore.getTeacherById) {
        const fetchedTeacher = teachersStore.getTeacherById(teacherId.value)
        if (fetchedTeacher) {
          teacher.value = {
            ...fetchedTeacher,
            experiencia: typeof fetchedTeacher.experiencia === 'string'
              ? { institution: fetchedTeacher.experiencia }
              : fetchedTeacher.experiencia
          }
        } else {
          teacher.value = null
        }
      } else {
        // Búsqueda manual si getTeacherById no existe
        const foundTeacher = teachersStore.teachers.find(t => t.id === teacherId.value)
        if (foundTeacher) {
          teacher.value = {
            ...foundTeacher,
            experiencia: typeof foundTeacher.experiencia === 'string' 
              ? { institution: foundTeacher.experiencia } 
              : foundTeacher.experiencia
          }
        } else {
          teacher.value = null
        }
      }
      
      if (teacher.value) {
        console.log('Maestro encontrado después de cargar todos:', teacher.value.name)
      }
    }
    
    // MÉTODO 3: Buscar al maestro por userId
    if (!teacher.value && teachersStore.teachers) {
      console.log('Intentando buscar maestro por userId...')
      const foundTeacher = teachersStore.teachers.find(t => t.uid === teacherId.value)
      
      if (foundTeacher) {
        teacher.value = {
          ...foundTeacher,
          experiencia: typeof foundTeacher.experiencia === 'string'
            ? { institution: foundTeacher.experiencia }
            : foundTeacher.experiencia
        }
        console.log('Maestro encontrado por userId:', teacher.value.name)
      } else {
        teacher.value = null
      }
    }
    
    // MÉTODO 4: Último recurso - actualizar datos desde Firebase y buscar nuevamente
    if (!teacher.value) {
      console.log('Último intento: actualizar datos desde Firebase y buscar nuevamente')
      try {
        // Recargar todos los maestros desde Firebase
        await teachersStore.fetchTeachers()
        
        // Intentar obtener el maestro con los datos actualizados
        const fetchedTeacher = teachersStore.getTeacherById(teacherId.value)
        if (fetchedTeacher) {
          teacher.value = {
            ...fetchedTeacher,
            experiencia: typeof fetchedTeacher.experiencia === 'string'
              ? { institution: fetchedTeacher.experiencia }
              : fetchedTeacher.experiencia
          }
          console.log('Maestro encontrado después de actualizar datos:', teacher.value.name)
        }
      } catch (e) {
        console.error('Error al actualizar y buscar maestro en Firebase:', e)
      }
    }
        // Handle the case where user is not a teacher
    if (!teacher.value && auth.currentUser) {
      try {
        // Intentar obtener información del usuario actual
        const userStore = useUserStore()
        
        // Obtener la información del usuario actual o sus sesiones
        const currentUser = auth.currentUser;
        
        // ID tokens contain the claims, not the User object directly
        let userRole = 'unknown';
        
        // Get role from multiple sources to ensure we find it
        if (currentUser) {
          try {
            // Method 1: Get role from token claims
            const idTokenResult = await currentUser.getIdTokenResult(true); // Force token refresh
            
            console.log('Token claims:', idTokenResult.claims); // Debug log
            
            // Check if role exists in claims
            if (idTokenResult.claims.role) {
              userRole = idTokenResult.claims.role;
              console.log('Role found in token claims:', userRole);
            } else if (idTokenResult.claims.custom_claims && idTokenResult.claims.custom_claims.role) {
              // Some implementations nest custom claims
              userRole = idTokenResult.claims.custom_claims.role;
              console.log('Role found in nested custom claims:', userRole);
            }
            
            // Method 2: Try to get role from user store if available
            if (userRole === 'unknown' && userStore.currentUser && userStore.currentUser.role) {
              userRole = userStore.currentUser.role;
              console.log('Role found in user store:', userRole);
            }
            
            // Method 3: Check if user email matches any teacher email
            if (userRole === 'unknown' && currentUser.email) {
              const teacherWithEmail = teachersStore.teachers.find(t => 
                t.email && t.email.toLowerCase() === currentUser.email.toLowerCase()
              );
              
              if (teacherWithEmail) {
                userRole = 'teacher'; // If email matches a teacher, assume role is teacher
                console.log('User email matches a teacher email, assuming role is teacher');
                
                // Set the teacher value since we found a match
                teacher.value = {
                  ...teacherWithEmail,
                  experiencia: typeof teacherWithEmail.experiencia === 'string'
                    ? { institution: teacherWithEmail.experiencia }
                    : teacherWithEmail.experiencia
                };
              }
            }
            
            // Method 4: Check if user UID matches any teacher UID
            if (userRole === 'unknown') {
              const teacherWithUid = teachersStore.teachers.find(t => 
                t.uid === currentUser.uid || t.userId === currentUser.uid
              );
              
              if (teacherWithUid) {
                userRole = 'teacher'; // If UID matches a teacher, assume role is teacher
                console.log('User UID matches a teacher UID, assuming role is teacher');
                
                // Set the teacher value since we found a match
                teacher.value = {
                  ...teacherWithUid,
                  experiencia: typeof teacherWithUid.experiencia === 'string'
                    ? { institution: teacherWithUid.experiencia }
                    : teacherWithUid.experiencia
                };
              }
            }
          } catch (tokenErr) {
            console.warn("Couldn't get user role from token:", tokenErr);
          }
        }
        
        // Si el usuario tiene un rol diferente a 'teacher', mostrar mensaje adecuado
        if (userRole !== 'teacher' && !teacher.value) {
          console.warn('El usuario actual no tiene rol de maestro:', userRole);
          error.value = 'No tienes acceso a esta página. Esta vista está disponible solo para maestros.';
          isLoading.value = false;
          return; // Exit early with a meaningful error
        }
      } catch(e) {
        console.warn('Error al verificar rol de usuario:', e)
      }
      
      // Only show error if we still don't have a teacher value
      if (!teacher.value) {
        console.error('No se encontró maestro con ID:', teacherId.value)
        throw new Error('No se encontró información del maestro. Por favor verifique que el ID sea correcto o contacte al administrador.')
      }
    }
    
    // Cargar horarios desde el store de schedules
    await scheduleStore.fetchAllSchedules()
    const teacherSchedules = teacher.value ? scheduleStore.getSchedulesByTeacher(teacher.value.id) : []
    
    // Procesar los horarios para obtener la información necesaria
    if (teacherSchedules && teacherSchedules.length > 0) {
      // Obtener clases para el componente TeacherWeeklySchedule
      await classesStore.fetchClasses()
      // Define interfaces outside the map function
      interface ClassSchedule {
        day: string;
        startTime: string;
        endTime: string;
      }

      interface ClassItem {
        id: string;
        name: string;
        teacherId: string;
        instrument: string;
        classroom: string;
        studentIds: string[];
        schedule: ClassSchedule[];
      }

      // Type the map function and its parameters
      teacherClasses.value = teacherSchedules.map((scheduleItem: ScheduleItem): ClassItem => {
        const classInfo: any = classesStore.getClassById(scheduleItem.scheduleDay.classId)
        
        const classItem: ClassItem = {
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
        return classItem
      })
      
      // Calcular métricas para mostrar en la vista
      const weeklyHours = teacherSchedules.reduce((total, s) => {
        return total + (s.scheduleDay.timeSlot.duration / 60)
      }, 0)
      
      // Define a type for a schedule entry (each item in the schedule array)
      interface ScheduleEntry {
        dayOfWeek: string;
        className: string;
        startTime: string;
        endTime: string;
        classId: string;
        room: string;
        studentCount: number;
      }

      // Crear objeto de horario para la vista
      schedule.value = {
        totalClasses: teacherSchedules.length,
        weeklyHours: weeklyHours,
        hasConflicts: false, // Podría implementarse detección de conflictos
        schedule: teacherSchedules.map((s: ScheduleItem): ScheduleEntry => ({
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
      if (teacher.value) {
        const teacherScheduleData = await teachersStore.getTeacherSchedule(teacher.value.id)
        // Transformar TeacherScheduleSummary al formato esperado por Schedule
        if (teacherScheduleData) {
          const transformedSchedule = {
            totalClasses: teacherScheduleData.totalClasses,
            weeklyHours: teacherScheduleData.weeklyHours,
            hasConflicts: teacherScheduleData.hasConflicts,
            schedule: Array.isArray(teacherScheduleData.schedule) 
              ? teacherScheduleData.schedule 
              : Object.entries(teacherScheduleData.schedule || {}).flatMap(([day, slots]) => 
                  Array.isArray(slots) ? slots.map(slot => ({
                    dayOfWeek: day,
                    className: slot.className || 'Clase sin nombre',
                    startTime: slot.startTime,
                    endTime: slot.endTime,
                    classId: slot.classId || '',
                    room: slot.room || '',
                    studentCount: slot.studentCount || 0
                  })) : []
                )
          }
          schedule.value = transformedSchedule
        } else {
          schedule.value = null
        }
      } else {
        console.error('No teacher found to get schedule')
        schedule.value = null
      }
    }
  } catch (err: any) {
    console.error('Error cargando datos:', err)
    error.value = err.message || 'Error cargando datos'
  } finally {
    isLoading.value = false
  }
}

// Fix the onMounted function to properly handle errors
onMounted(async () => {
  try {
    await loadData()
    
    // Only try to display classes if we successfully loaded the teacher
    if (teacher.value) {
      console.log('Teacher Classes:', getTeacherClasses(teacher.value.id))
    }
  } catch (e) {
    // Error already handled by loadData function
    console.log('Could not load teacher data, skipping class fetch')
  }
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

// Improve the getTeacherClasses function
const getTeacherClasses = (teacherId: string) => {
  if (!teacherId || !teacher.value) return []
  
  // Always use the successfully fetched teacher's ID, not the route parameter
  const effectiveTeacherId = teacher.value.id
  
  return teacherClasses.value.length > 0 
    ? teacherClasses.value 
    : classesStore.classes.filter(class_ => class_.teacherId === effectiveTeacherId)
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
            <TeacherWeeklySchedule :teacherId="teacherId" :classes="getTeacherClasses(teacherId)" />
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