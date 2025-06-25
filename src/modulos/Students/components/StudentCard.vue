<template>
  <div
    class="bg-white dark:bg-gray-800 rounded-xl shadow p-4 flex flex-col items-center hover:shadow-lg transition cursor-pointer group relative"
    @click="$emit('open')"
  >
    <!-- Indicador de estado -->
    <span v-if="student.activo !== undefined" :class="student.activo ? 'bg-green-400' : 'bg-red-400'" class="absolute top-3 left-3 w-3 h-3 rounded-full border-2 border-white dark:border-gray-800"></span>
    <StudentAvatar :first-name="student.nombre" :last-name="student.apellido" size="xl" />
    <div class="mt-2 text-center w-full">
      <div class="font-bold text-lg truncate">{{ student.nombre }} {{ student.apellido }}</div>
      <div class="text-sm text-gray-500 truncate">{{ student.instrumento || 'Sin instrumento asignado' }}</div>
      <div v-if="student.grupo && student.grupo.length" class="text-xs text-blue-600 dark:text-blue-300 mt-1 truncate">
        {{ student.grupo.join(', ') }}
      </div>
      <div class="mt-1">
        <span 
          v-if="!loadingAttendance"
          :class="attendanceColor" 
          class="font-semibold" 
          :title="attendanceTooltip"
        >
          {{ displayAttendance }}% asistencia
        </span>
        <span 
          v-else
          class="text-gray-400 text-sm font-semibold"
          title="Calculando asistencia..."
        >
          <svg class="animate-spin -ml-1 mr-2 h-3 w-3 text-gray-400 inline" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          Calculando...
        </span>
      </div>
    </div>
    <!-- Acciones rápidas -->
    <div class="flex gap-2 mt-3 w-full justify-center opacity-0 group-hover:opacity-100 transition-opacity">
      <button class="btn btn-xs btn-primary" @click.stop="$emit('profile')" title="Ver perfil">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 inline" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5.121 17.804A13.937 13.937 0 0112 15c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
      </button>
      <button class="btn btn-xs btn-secondary" @click.stop="$emit('edit')" title="Editar alumno">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 inline" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536M9 13h3l8-8a2.828 2.828 0 00-4-4l-8 8v3z" /></svg>
      </button>
      <button class="btn btn-xs btn-danger" @click.stop="$emit('delete')" title="Eliminar alumno">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 inline" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" /></svg>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, onMounted } from 'vue'
import { useAttendanceStore } from '../../Attendance/store/attendance'
import StudentAvatar from './StudentAvatar.vue'

interface Props {
  student: any
  attendance?: number
}

const props = withDefaults(defineProps<Props>(), {
  attendance: 0
})

const attendanceStore = useAttendanceStore()
const lastMonthAttendance = ref<number>(0)
const loadingAttendance = ref<boolean>(true)

// Cache estático para evitar múltiples llamadas por el mismo estudiante
const attendanceCache = new Map<string, { value: number; timestamp: number }>()
const CACHE_DURATION = 5 * 60 * 1000 // 5 minutos

// Calcular el porcentaje de asistencia del último mes
const calculateLastMonthAttendance = async () => {
  try {
    loadingAttendance.value = true
    
    // Verificar cache primero
    const cacheKey = props.student.id
    const cached = attendanceCache.get(cacheKey)
    const now = Date.now()
    
    if (cached && (now - cached.timestamp) < CACHE_DURATION) {
      lastMonthAttendance.value = cached.value
      loadingAttendance.value = false
      return
    }
    
    const today = new Date()
    const oneMonthAgo = new Date(today)
    oneMonthAgo.setMonth(today.getMonth() - 1)
    
    const startDate = oneMonthAgo.toISOString().split('T')[0]
    const endDate = today.toISOString().split('T')[0]
    
    // Obtener registros de asistencia del estudiante en el último mes
    const attendanceRecords = await attendanceStore.getStudentAttendanceByDateRange(
      props.student.id,
      startDate,
      endDate
    )
    
    if (!attendanceRecords || attendanceRecords.length === 0) {
      lastMonthAttendance.value = 0
      // Guardar en cache
      attendanceCache.set(cacheKey, { value: 0, timestamp: now })
      return
    }
    
    // Calcular porcentaje de asistencia
    const presentCount = attendanceRecords.filter(record => 
      record.status === 'Presente' || record.status === 'Justificado'
    ).length
    
    const totalCount = attendanceRecords.length
    const percentage = totalCount > 0 ? Math.round((presentCount / totalCount) * 100) : 0
    
    lastMonthAttendance.value = percentage
    
    // Guardar en cache
    attendanceCache.set(cacheKey, { value: percentage, timestamp: now })
    
  } catch (error) {
    console.error('Error calculating last month attendance for student:', props.student.id, error)
    lastMonthAttendance.value = 0
  } finally {
    loadingAttendance.value = false
  }
}

// Computed para el porcentaje de asistencia a mostrar (prioriza último mes)
const displayAttendance = computed(() => {
  return lastMonthAttendance.value || props.attendance
})

// Computed para el tooltip informativo
const attendanceTooltip = computed(() => {
  if (loadingAttendance.value) {
    return 'Calculando asistencia...'
  }
  
  const now = new Date()
  const oneMonthAgo = new Date(now)
  oneMonthAgo.setMonth(now.getMonth() - 1)
  
  const formatDate = (date: Date) => date.toLocaleDateString('es-ES', { 
    day: '2-digit', 
    month: '2-digit', 
    year: 'numeric' 
  })
  
  return `${displayAttendance.value}% asistencia (${formatDate(oneMonthAgo)} - ${formatDate(now)})`
})

const attendanceColor = computed(() => {
  const attendance = displayAttendance.value
  if (attendance >= 90) return 'text-green-600'
  if (attendance >= 75) return 'text-yellow-600'
  return 'text-red-600'
})

onMounted(() => {
  calculateLastMonthAttendance()
})
</script>

<style scoped>
.bg-white {
  background: var(--color-bg, #fff);
}
.dark .bg-white {
  background: #23272f;
}
</style> 