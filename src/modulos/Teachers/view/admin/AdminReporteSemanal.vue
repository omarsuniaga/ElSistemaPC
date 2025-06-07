<template>
  <div class="admin-reporte-semanal p-4">
    <h1 class="text-2xl font-bold mb-6">Reporte Semanal de Clases</h1>
    
    <!-- Selector de semana -->
    <div class="mb-6 bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
      <div class="flex flex-wrap items-center gap-4">
        <button 
          @click="previousWeek" 
          class="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700"
          :disabled="isLoading"
        >
          <ChevronLeftIcon class="h-5 w-5" />
        </button>
        
        <div class="text-lg font-medium">
          {{ formattedWeekRange }}
        </div>
        
        <button 
          @click="nextWeek" 
          class="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700"
          :disabled="isLoading"
        >
          <ChevronRightIcon class="h-5 w-5" />
        </button>
        
        <button 
          @click="setCurrentWeek" 
          class="ml-auto px-3 py-1 bg-primary-100 text-primary-700 dark:bg-primary-900 dark:text-primary-300 rounded-md hover:bg-primary-200 dark:hover:bg-primary-800"
          :disabled="isLoading"
        >
          Semana actual
        </button>
      </div>
    </div>
    
    <!-- Estado de carga -->
    <div v-if="isLoading" class="flex justify-center items-center py-12">
      <div class="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600"></div>
    </div>
    
    <!-- Mensaje de error -->
    <div v-else-if="error" class="bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 p-4 rounded-lg mb-6">
      {{ error }}
    </div>
    
    <div v-else>
      <!-- Resumen general de la semana -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div class="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
          <h3 class="text-lg font-medium mb-2">Total de clases</h3>
          <p class="text-3xl font-bold">{{ totalClases }}</p>
        </div>
        
        <div class="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
          <h3 class="text-lg font-medium mb-2">Asistencia promedio</h3>
          <p class="text-3xl font-bold">{{ asistenciaPromedio }}%</p>
        </div>
        
            </div>
        <!-- Clases destacadas con validación segura -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div class="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
          <h3 class="text-lg font-medium mb-2">Clase con más alumnos</h3>
          <p class="text-xl font-bold">{{ safeGet(claseMasAlumnos, 'nombre', 'N/A') }}</p>
          <p v-if="safeGet(claseMasAlumnos, 'nombre')">{{ safeGet(claseMasAlumnos, 'cantidad', 0) }} alumnos</p>
        </div>
        
        <div class="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
          <h3 class="text-lg font-medium mb-2">Clase con menos alumnos</h3>
          <p class="text-xl font-bold">{{ safeGet(claseMenosAlumnos, 'nombre', 'N/A') }}</p>
          <p v-if="safeGet(claseMenosAlumnos, 'nombre')">{{ safeGet(claseMenosAlumnos, 'cantidad', 0) }} alumnos</p>
        </div>
      </div>
      
      <!-- Tabs para los días de la semana -->
      <div class="mb-6">
        <div class="border-b border-gray-200 dark:border-gray-700">
          <nav class="flex flex-wrap -mb-px">
            <button
              v-for="(dia, index) in diasSemana"
              :key="index"
              @click="selectedDay = index"
              class="py-2 px-4 text-center border-b-2 font-medium text-sm"
              :class="selectedDay === index 
                ? 'border-primary-500 text-primary-600 dark:text-primary-400' 
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'"
            >
              {{ dia }}
            </button>
          </nav>
        </div>
          <!-- Contenido del día seleccionado con validación segura -->
        <div class="mt-4">
          <div v-if="safeArrayLength(safeGet(clasesPorDia, selectedDay, [])) > 0" class="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
            <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead class="bg-gray-50 dark:bg-gray-900">
                <tr>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Clase</th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Horario</th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Alumnos</th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Asistencia</th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Maestro</th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Observaciones</th>
                </tr>
              </thead>
              <tbody class="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                <tr v-for="clase in safeGet(clasesPorDia, selectedDay, [])" :key="safeGet(clase, 'id', Math.random())">
                  <td class="px-6 py-4 whitespace-nowrap">
                    <div class="font-medium">{{ safeGet(clase, 'name', 'Clase sin nombre') }}</div>
                    <div class="text-sm text-gray-500 dark:text-gray-400">{{ safeGet(clase, 'instrument', 'Sin instrumento') }}</div>
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap">
                    <div>{{ formatTime(safeGet(clase, 'horario.startTime')) }} - {{ formatTime(safeGet(clase, 'horario.endTime')) }}</div>
                    <div class="text-sm text-gray-500 dark:text-gray-400">{{ calcularDuracion(safeGet(clase, 'horario', {})) }}</div>
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap">
                    <div>{{ safeArrayLength(safeGet(clase, 'studentIds', [])) }} alumnos</div>
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap">
                    <div>{{ safeGet(clase, 'asistencia.presentes', 0) }} / {{ safeArrayLength(safeGet(clase, 'studentIds', [])) }}</div>
                    <div class="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5 mt-1">
                      <div 
                        class="bg-primary-600 h-2.5 rounded-full" 
                        :style="`width: ${calcularPorcentajeAsistenciaSafe(clase)}%`"
                      ></div>
                    </div>
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap">
                    <div>{{ obtenerNombreMaestro(clase.teacherId) }}</div>
                    <div class="text-sm" :class="clase.maestroAsistio ? 'text-green-500' : 'text-red-500'">
                      {{ clase.maestroAsistio ? 'Asistió' : 'No registró' }}
                    </div>
                  </td>
                  <td class="px-6 py-4">
                    <button 
                      v-if="clase.observaciones?.length" 
                      @click="mostrarObservaciones(clase)"
                      class="text-primary-600 hover:text-primary-800 dark:text-primary-400 dark:hover:text-primary-300"
                    >
                      Ver ({{ clase.observaciones.length }})
                    </button>
                    <span v-else class="text-gray-400">Sin observaciones</span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <div v-else class="bg-white dark:bg-gray-800 p-6 rounded-lg shadow text-center">
            <p class="text-gray-500 dark:text-gray-400">No hay clases programadas para este día</p>
          </div>
        </div>
      </div>
      
      <!-- Reporte completo de la semana -->
      <div class="mb-6">
        <h2 class="text-xl font-bold mb-4">Reporte completo de la semana</h2>
        
        <div class="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
          <div class="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
            <div>
              <span class="font-medium">Total de observaciones: </span>
              <span>{{ totalObservaciones }}</span>
            </div>
            
            <button 
              @click="exportarReporte" 
              class="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
            >
              Exportar reporte
            </button>
          </div>
          
          <div class="p-4">
            <h3 class="font-medium text-lg mb-2">Observaciones destacadas</h3>
            <ul class="space-y-2">
              <li v-for="(obs, index) in observacionesDestacadas" :key="index" class="p-3 bg-gray-50 dark:bg-gray-900 rounded-md">
                <div class="flex justify-between">
                  <span class="font-medium">{{ obs.className }}</span>
                  <span class="text-sm text-gray-500">{{ formatDate(obs.date) }}</span>
                </div>
                <p class="mt-1">{{ obs.text }}</p>
              </li>
            </ul>
          </div>
        </div>
      </div>
      
      <!-- Modal de observaciones -->
      <Dialog :open="showObservacionesModal" @close="showObservacionesModal = false" class="relative z-50">
        <div class="fixed inset-0 bg-black/30" aria-hidden="true" />
        
        <div class="fixed inset-0 flex items-center justify-center p-4">
          <DialogPanel class="w-full max-w-md rounded-lg bg-white dark:bg-gray-800 p-6 shadow-xl">
            <h3 class="text-lg font-medium mb-4">Observaciones de la clase</h3>
            
            <ul v-if="observacionesClaseSeleccionada.length" class="space-y-3 mb-4">
              <li v-for="(obs, index) in observacionesClaseSeleccionada" :key="index" class="p-3 bg-gray-50 dark:bg-gray-900 rounded-md">
                <div class="flex justify-between">
                  <span class="font-medium">{{ obs.author || 'Sistema' }}</span>
                  <span class="text-sm text-gray-500">{{ formatTime(obs.timestamp) }}</span>
                </div>
                <p class="mt-1">{{ obs.text }}</p>
              </li>
            </ul>
            <p v-else class="text-gray-500 mb-4">No hay observaciones para mostrar</p>
            
            <div class="flex justify-end">
              <button 
                @click="showObservacionesModal = false" 
                class="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300"
              >
                Cerrar
              </button>
            </div>
          </DialogPanel>
        </div>
      </Dialog>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { format, startOfWeek, endOfWeek, addDays, addWeeks, subWeeks, parseISO, differenceInMinutes } from 'date-fns'
import { es } from 'date-fns/locale'
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/vue/24/outline'
import { Dialog, DialogPanel } from '@headlessui/vue'
import { useAttendanceStore } from '../../../Attendance/store/attendance'
import { useClassesStore } from '../../../Classes/store/classes'
import { useTeachersStore } from '../../store/teachers'
import { useStudentsStore } from '../../../Students/store/students'
import { useUserSessionsStore } from '../../../Users/store/userSessions'
import { 
  safeGet, 
  safeArrayLength, 
  safeStoreAccess, 
  safeFilter, 
  safeFind, 
  safeMath,
  isValidArray,
  isValidObject 
} from '@/utils/safeAccess'
import { useAdminErrorHandling } from '@/composables/useAdminErrorHandling'

// Stores
const attendanceStore = useAttendanceStore()
const classesStore = useClassesStore()
const teachersStore = useTeachersStore()
const studentsStore = useStudentsStore()
const userSessionsStore = useUserSessionsStore()

// Error handling composable
const { handleAdminError, safeAsyncOperation, validateData } = useAdminErrorHandling()

// Estado reactivo
const isLoading = ref(true)
const error = ref<string | null>(null)
const weekStart = ref(startOfWeek(new Date(), { weekStartsOn: 1 })) // Lunes como inicio de semana
const weekEnd = ref(endOfWeek(new Date(), { weekStartsOn: 1 })) // Domingo como fin de semana
const selectedDay = ref(0) // 0 = Lunes, 1 = Martes, etc.
const diasSemana = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo']
const clasesPorDia = ref<any[][]>(Array(7).fill().map(() => []))
const totalClases = ref(0)
const asistenciaPromedio = ref(0)
const diaMayorAsistencia = ref('')
const diaMenorAsistencia = ref('')
const claseMasAlumnos = ref<{ nombre: string, cantidad: number }>({ nombre: '', cantidad: 0 })
const claseMenosAlumnos = ref<{ nombre: string, cantidad: number }>({ nombre: '', cantidad: 0 })
const totalObservaciones = ref(0)
const observacionesDestacadas = ref<any[]>([])
const showObservacionesModal = ref(false)
const observacionesClaseSeleccionada = ref<any[]>([])

// Rango de fechas formateado
const formattedWeekRange = computed(() => {
  const start = format(weekStart.value, "d 'de' MMMM", { locale: es })
  const end = format(weekEnd.value, "d 'de' MMMM, yyyy", { locale: es })
  return `${start} - ${end}`
})

// Cambiar a la semana anterior
const previousWeek = () => {
  weekStart.value = subWeeks(weekStart.value, 1)
  weekEnd.value = subWeeks(weekEnd.value, 1)
  cargarDatosSemana()
}

// Cambiar a la semana siguiente
const nextWeek = () => {
  weekStart.value = addWeeks(weekStart.value, 1)
  weekEnd.value = addWeeks(weekEnd.value, 1)
  cargarDatosSemana()
}

// Volver a la semana actual
const setCurrentWeek = () => {
  weekStart.value = startOfWeek(new Date(), { weekStartsOn: 1 })
  weekEnd.value = endOfWeek(new Date(), { weekStartsOn: 1 })
  cargarDatosSemana()
}

// Formatear hora
const formatTime = (timeString: string) => {
  if (!timeString) return 'N/A'
  return timeString
}

// Formatear fecha
const formatDate = (dateString: string) => {
  if (!dateString) return 'N/A'
  try {
    return format(parseISO(dateString), "d 'de' MMMM", { locale: es })
  } catch (e) {
    return dateString
  }
}

// Calcular duración de una clase
const calcularDuracion = (horario: any) => {
  if (!horario || !horario.startTime || !horario.endTime) return 'N/A'
  
  try {
    // Convertir las horas a objetos Date para calcular la diferencia
    const startDate = new Date(`2000-01-01T${horario.startTime}`)
    const endDate = new Date(`2000-01-01T${horario.endTime}`)
    
    const minutes = differenceInMinutes(endDate, startDate)
    const hours = Math.floor(minutes / 60)
    const remainingMinutes = minutes % 60
    
    if (hours > 0) {
      return `${hours}h ${remainingMinutes > 0 ? remainingMinutes + 'min' : ''}`
    } else {
      return `${minutes}min`
    }
  } catch (e) {
    return 'N/A'
  }
}

// Calcular porcentaje de asistencia de forma segura
const calcularPorcentajeAsistenciaSafe = (clase: any) => {
  return safeMath(() => {
    const studentIds = safeGet(clase, 'studentIds', []);
    const totalStudents = safeArrayLength(studentIds);
    
    if (totalStudents === 0) return 0;
    
    const presentes = safeGet(clase, 'asistencia.presentes', 0);
    return Math.round((presentes * 100) / totalStudents);
  }, 0);
}

// Calcular porcentaje de asistencia (versión legacy para compatibilidad)
const calcularPorcentajeAsistencia = (clase: any) => {
  return calcularPorcentajeAsistenciaSafe(clase);
}

// Obtener nombre del maestro de forma segura
const obtenerNombreMaestro = (teacherId: string) => {
  if (!teacherId) return 'Sin asignar';
  
  const teachers = safeStoreAccess(teachersStore, 'teachers', []);
  const teacher = safeFind(teachers, (t: any) => safeGet(t, 'id') === teacherId);
  
  return teacher ? safeGet(teacher, 'name', 'Desconocido').trim() : 'Desconocido';
}

// Mostrar observaciones de una clase de forma segura
const mostrarObservaciones = (clase: any) => {
  const observaciones = safeGet(clase, 'observaciones', []);
  observacionesClaseSeleccionada.value = isValidArray(observaciones) ? observaciones : [];
  showObservacionesModal.value = true;
}

// Exportar reporte
const exportarReporte = () => {
  // Implementación de exportación (PDF, Excel, etc.)
  console.log('Exportando reporte...')
  // Aquí iría la lógica para generar y descargar el reporte
}

// Cargar datos de la semana seleccionada
const cargarDatosSemana = async () => {
  try {
    isLoading.value = true
    error.value = null
    
    // Formatear fechas para consultas
    const startDate = format(weekStart.value, 'yyyy-MM-dd')
    const endDate = format(weekEnd.value, 'yyyy-MM-dd')
    
    // Cargar datos necesarios
    await Promise.all([
      classesStore.fetchClasses(),
      teachersStore.fetchTeachers(),
      studentsStore.fetchStudents(),
      attendanceStore.fetchAttendanceDocuments(startDate, endDate)
    ])
    
    // Procesar clases por día de la semana
    procesarClasesPorDia()
    
    // Calcular estadísticas
    calcularEstadisticas()
    
  } catch (err: any) {
    console.error('Error al cargar datos de la semana:', err)
    error.value = `Error al cargar datos: ${err.message}`
  } finally {
    isLoading.value = false
  }
}

// Procesar clases por día de la semana
const procesarClasesPorDia = () => {
  // Reiniciar arrays
  clasesPorDia.value = Array(7).fill().map(() => [])
  
  // Obtener todas las clases programadas
  const clasesScheduled = classesStore.getScheduledClasses
  
  // Procesar cada clase
  clasesScheduled.forEach(clase => {
    if (!clase.schedule || !clase.schedule.slots) return
    
    // Procesar cada slot de horario
    clase.schedule.slots.forEach(slot => {
      // Determinar el día de la semana (0 = Lunes, 6 = Domingo)
      let dayIndex: number
      
      if (typeof slot.day === 'string') {
        const dayMap: Record<string, number> = {
          'lunes': 0, 'martes': 1, 'miércoles': 2, 'jueves': 3, 
          'viernes': 4, 'sábado': 5, 'domingo': 6
        }
        dayIndex = dayMap[slot.day.toLowerCase()] ?? -1
      } else if (typeof slot.day === 'number') {
        // Ajustar el índice si es necesario (si 0 = Domingo en el sistema)
        dayIndex = slot.day === 0 ? 6 : slot.day - 1
      } else {
        return
      }
      
      if (dayIndex < 0 || dayIndex > 6) return
      
      // Crear objeto de clase con datos adicionales
      const claseConDatos = {
        ...clase,
        horario: {
          startTime: slot.startTime,
          endTime: slot.endTime
        },
        asistencia: {
          presentes: 0,
          ausentes: 0
        },
        maestroAsistio: false,
        observaciones: []
      }
      
      // Buscar registros de asistencia para esta clase
      const fechaClase = format(addDays(weekStart.value, dayIndex), 'yyyy-MM-dd')
      const asistenciasClase = attendanceStore.attendanceDocuments.filter(
        doc => doc.classId === clase.id && doc.fecha === fechaClase
      )
      
      // Si hay registros de asistencia, procesar datos
      if (asistenciasClase.length > 0) {
        const doc = asistenciasClase[0]
        
        // Contar presentes y ausentes
        let presentes = 0
        let ausentes = 0
        
        if (doc.attendanceRecords) {
          Object.values(doc.attendanceRecords).forEach((status: any) => {
            if (status === 'Presente') presentes++
            else ausentes++
          })
        }
        
        claseConDatos.asistencia = { presentes, ausentes }
        claseConDatos.maestroAsistio = true
        
        // Obtener observaciones
        if (doc.data.observations) {
          claseConDatos.observaciones = doc.data.observations
        }
      }
      
      // Añadir a la lista del día correspondiente
      clasesPorDia.value[dayIndex].push(claseConDatos)
    })
  })
}

// Calcular estadísticas generales
const calcularEstadisticas = () => {
  // Total de clases en la semana
  totalClases.value = clasesPorDia.value.reduce((sum, clases) => sum + clases.length, 0)
  
  // Asistencia promedio
  let totalPresentes = 0
  let totalEstudiantes = 0
  
  clasesPorDia.value.forEach(clases => {
    clases.forEach(clase => {
      totalPresentes += clase.asistencia?.presentes || 0
      totalEstudiantes += clase.studentIds?.length || 0
    })
  })
  
  asistenciaPromedio.value = totalEstudiantes > 0 
    ? Math.round((totalPresentes / totalEstudiantes) * 100) 
    : 0
  
  // Día con mayor y menor asistencia
  const asistenciaPorDia = clasesPorDia.value.map((clases, index) => {
    const presentes = clases.reduce((sum, clase) => sum + (clase.asistencia?.presentes || 0), 0)
    const total = clases.reduce((sum, clase) => sum + (clase.studentIds?.length || 0), 0)
    const porcentaje = total > 0 ? (presentes / total) * 100 : 0
    
    return {
      dia: diasSemana[index],
      porcentaje,
      presentes,
      total
    }
  }).filter(dia => dia.total > 0) // Solo considerar días con clases
  
  if (asistenciaPorDia.length > 0) {
    const maxAsistencia = asistenciaPorDia.reduce((max, dia) => 
      dia.porcentaje > max.porcentaje ? dia : max, asistenciaPorDia[0])
      
    const minAsistencia = asistenciaPorDia.reduce((min, dia) => 
      dia.porcentaje < min.porcentaje ? dia : min, asistenciaPorDia[0])
    
    diaMayorAsistencia.value = maxAsistencia.dia
    diaMenorAsistencia.value = minAsistencia.dia
  } else {
    diaMayorAsistencia.value = 'N/A'
    diaMenorAsistencia.value = 'N/A'
  }
  
  // Clase con más y menos alumnos
  const todasLasClases = classesStore.classes.filter(c => c.studentIds && c.studentIds.length > 0)
  
  if (todasLasClases.length > 0) {
    const maxAlumnos = todasLasClases.reduce((max, clase) => 
      (clase.studentIds?.length || 0) > (max.studentIds?.length || 0) ? clase : max, todasLasClases[0])
      
    const minAlumnos = todasLasClases.reduce((min, clase) => 
      (clase.studentIds?.length || 0) < (min.studentIds?.length || 0) ? clase : min, todasLasClases[0])
    
    claseMasAlumnos.value = {
      nombre: maxAlumnos.name,
      cantidad: maxAlumnos.studentIds?.length || 0
    }
    
    claseMenosAlumnos.value = {
      nombre: minAlumnos.name,
      cantidad: minAlumnos.studentIds?.length || 0
    }
  }
  
  // Procesar observaciones
  let todasObservaciones: any[] = []
  
  clasesPorDia.value.forEach(clases => {
    clases.forEach(clase => {
      if (clase.observaciones && clase.observaciones.length > 0) {
        todasObservaciones = todasObservaciones.concat(
          clase.observaciones.map((obs: any) => ({
            ...obs,
            className: clase.name,
            classId: clase.id
          }))
        )
      }
    })
  })
  
  totalObservaciones.value = todasObservaciones.length
  
  // Seleccionar observaciones destacadas (limitamos a 5 para mostrar)
  observacionesDestacadas.value = todasObservaciones
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, 5)
}

// Inicializar datos al montar el componente
onMounted(async () => {
  await cargarDatosSemana()
})

// Observar cambios en la semana seleccionada
watch([weekStart, weekEnd], () => {
  cargarDatosSemana()
})
</script>