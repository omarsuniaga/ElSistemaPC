    <script setup lang="ts">
    import { ref, computed, onMounted } from 'vue'
    import { useRoute } from 'vue-router'
    import { useTeachersStore } from '../../store/teachers'
    import { useClassesStore } from '../../../Classes/store/classes'
    import { format, parseISO } from 'date-fns'
    import { es } from 'date-fns/locale'
    import { TeacherWeeklySchedule } from '../../components/TeacherWeeklySchedule.vue'
    import html2pdf from 'html2pdf.js'
    import type { SVGAttributes } from 'vue'
    import { getAuth } from 'firebase/auth'

    export interface HeroIconProps extends SVGAttributes {}

    import { 
      CalendarIcon, 
      DocumentArrowDownIcon, 
      ShareIcon, 
      UserIcon,
      AcademicCapIcon,
      BriefcaseIcon,
      ClockIcon
    } from '@heroicons/vue/24/outline'

    // Obtener teacherId de la ruta o auth
    const route = useRoute()
    const auth = getAuth()
    const teachersStore = useTeachersStore()
    const classesStore = useClassesStore()
    const selectedTeacher = ref('')

    // Agregar tipos explícitos para mejorar la seguridad de tipos
    const teacherId = computed(() => {
      // Preferir el ID del usuario autenticado si está disponible
      if (auth.currentUser?.uid) return auth.currentUser.uid
      // Fallback al ID de la ruta
      return route.params.id as string
    })
    const isLoading = ref(true)
    const error = ref<string | null>(null)

    // Definir una interfaz para la experiencia del profesor
    interface TeacherExperience {
      institution: string;
      role: string;
      startDate: string;
      endDate: string;
      description: string;
    }

    // Definir una interfaz para el teacher para mejorar el tipado
    interface Teacher {
      id: string;
      name: string;
      photoURL?: string;
      specialties?: string[];
      experiencia?: string;
      phone?: string;
      email?: string;
    }
    const teacher = ref<Teacher | null>(null)
    // Definir una interfaz para el schedule para mejorar el tipado
    interface Schedule {
      totalClasses: number;
      weeklyHours: number;
      hasConflicts?: boolean;
      schedule: Array<{
        dayOfWeek: string;
        className: string;
        startTime: string;
        endTime: string;
      }>;
    }
    const schedule = ref<Schedule | null>(null)

    // Función para cargar datos del maestro y su horario
    const loadData = async () => {
      try {
        isLoading.value = true
        error.value = null
        // Cargar maestros si aún no se han cargado
        await teachersStore.fetchTeachers()
        const fetchedTeacher = teachersStore.getTeacherById(teacherId.value)
        if (fetchedTeacher) {
          teacher.value = {
            id: fetchedTeacher.id,
            name: fetchedTeacher.name,
            photoURL: fetchedTeacher.photoURL,
            specialties: fetchedTeacher.specialties,
            experiencia: fetchedTeacher.experiencia,
            phone: fetchedTeacher.phone,
            email: fetchedTeacher.email
          }
        } else {
          teacher.value = null
        }
        if (!teacher.value) {
          throw new Error('Maestro no encontrado')
        }
        schedule.value = await teachersStore.getTeacherSchedule(teacher.value.id)
      } catch (err: any) {
        console.error('Error cargando datos:', err)
        error.value = err.message || 'Error cargando datos'
      } finally {
        isLoading.value = false
      }
    }

    onMounted(async () => {
      console.log("aqui toy")
      await loadData()
    })

    const formatHours = (hours: number): string => {
      return `${Math.floor(hours)} h ${Math.round((hours % 1) * 60)} min`
    }

    // Función para parsear la experiencia del profesor
    const parseExperience = (experienceStr: string | undefined): TeacherExperience[] => {
      if (!experienceStr) return [];
      try {
        return JSON.parse(experienceStr);
      } catch (e) {
        console.error('Error parsing experience:', e);
        return [];
      }
    }

    // Función para formatear fechas
    const formatDate = (dateStr: string): string => {
      try {
        return format(parseISO(dateStr), 'MMM yyyy', { locale: es });
      } catch (e) {
        return dateStr;
      }
    }

    // Función para obtener el periodo de trabajo
    const getWorkPeriod = (startDate: string, endDate: string): string => {
      const start = formatDate(startDate);
      const end = endDate === 'present' || endDate === 'actual' ? 'Actual' : formatDate(endDate);
      return `${start} - ${end}`;
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
      return classesStore.classes.filter(class_ => class_.teacherId === teacherId)
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
              PDF
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

        <!-- Loading / Error -->
        <div v-if="isLoading" class="flex justify-center items-center py-12">
          <div class="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600"></div>
        </div>
        <div v-else-if="error" class="bg-red-100 dark:bg-red-900/30 p-4 rounded-lg text-red-700 dark:text-red-400">
          {{ error }}
          <button @click="loadData" class="ml-2 underline">Reintentar</button>
        </div>
        
        <!-- PDF Document -->
        <div 
          v-else-if="teacher && !isLoading && !error"
          id="schedule-pdf" 
          class="bg-white text-black p-6 sm:p-8 rounded-lg shadow-lg mx-auto"
          style="min-height: 297mm; width: 210mm; max-width: 100%;"
        >
          <!-- Encabezado -->
          <div class="flex justify-between items-start border-b-2 border-gray-300 pb-4 mb-6">
            <div>
              <div class="flex items-center gap-2">
                <!-- Puede sustituir por el logo de la Academia -->
                <img src="../assets/ElSistemaPCLogo.jpeg" alt="Logo Academia" class="h-12 w-auto" />
                <div>
                  <h1 class="text-2xl font-bold text-primary-700">Academia de Música</h1>
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
            
            <div class="bg-gray-50 p-4 rounded-b-lg shadow-sm">
              <div class="flex items-center gap-4">
                <img
                  :src="teacher.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${teacher.name}`"
                  :alt="teacher.name"
                  class="w-16 h-16 rounded-full"
                />
                <div>
                  <h3 class="text-xl font-bold">{{ teacher.name }}</h3>
                  <div class="flex flex-wrap gap-1 mt-1">
                    <span
                      v-for="specialty in teacher.specialties || []"
                      :key="specialty"
                      class="px-2 py-0.5 text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200 rounded-full"
                    >
                      {{ specialty }}
                    </span>
                  </div>
                </div>
              </div>
              
              <!-- Datos adicionales (se pueden ampliar según disponibilidad) -->
              <div class="grid grid-cols-2 gap-3 text-sm mt-4">
                <!-- Experiencia profesional -->
                <div class="col-span-2">
                  <div class="text-gray-700 dark:text-gray-300 font-medium mb-2 flex items-center">
                    <BriefcaseIcon class="h-4 w-4 mr-1 text-primary-600" />
                    Experiencia Profesional
                  </div>
                  
                  <div v-if="parseExperience(teacher.experiencia).length > 0" class="space-y-3">
                    <div 
                      v-for="(exp, index) in parseExperience(teacher.experiencia)" 
                      :key="index"
                      class="bg-white dark:bg-gray-700 p-3 rounded-lg border border-gray-200 dark:border-gray-600 hover:shadow-md transition-shadow"
                    >
                      <div class="flex justify-between items-start">
                        <div>
                          <h4 class="font-semibold text-primary-700 dark:text-primary-400">{{ exp.role }}</h4>
                          <p class="text-gray-600 dark:text-gray-400">{{ exp.institution }}</p>
                        </div>
                        <div class="text-xs text-gray-500 dark:text-gray-400 flex items-center">
                          <ClockIcon class="h-3 w-3 mr-1" />
                          {{ getWorkPeriod(exp.startDate, exp.endDate) }}
                        </div>
                      </div>
                      <p v-if="exp.description" class="mt-2 text-sm text-gray-600 dark:text-gray-300">
                        {{ exp.description }}
                      </p>
                    </div>
                  </div>
                  <p v-else class="text-gray-500 dark:text-gray-400 italic">
                    No hay información de experiencia disponible
                  </p>
                </div>
                
                <div>
                  <span class="text-gray-500 dark:text-gray-400">Teléfono:</span>
                  <span class="ml-1 font-medium">{{ teacher.phone || "No disponible" }}</span>
                </div>
                <div class="col-span-2">
                  <span class="text-gray-500 dark:text-gray-400">Email:</span>
                  <span class="ml-1 font-medium">{{ teacher.email || "No disponible" }}</span>
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
                
                <!-- Integración del componente TeacherWeeklySchedule -->
                <TeacherWeeklySchedule :teacherId="teacher?.id" />
              </div>
              <div v-else class="text-center py-4 text-gray-500">
                No hay clases asignadas
              </div>
            </div>
          </div>
          
          <!-- Footer -->
          <div class="mt-8 pt-4 border-t text-center text-sm text-gray-500">
            <p>Este horario puede estar sujeto a cambios. Para más información, contacte con la Administración.</p>
            <p class="mt-1">© {{ new Date().getFullYear() }} El Sistema Punta Cana - Todos los derechos reservados</p>
          </div>
        </div>
        
        <!-- En caso de no encontrar el maestro -->
        <div v-else class="text-center py-12 text-gray-500">
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
    </style>
