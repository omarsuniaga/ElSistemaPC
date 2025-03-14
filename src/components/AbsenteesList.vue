<template>
  <div class="space-y-4">
    <h3 class="text-lg font-semibold">Alumnos con Mayor Ausencia</h3>
    
    <div class="space-y-2">
      <div
        v-for="student in absentStudents"
        :key="student.studentId"
        class="p-4 bg-white dark:bg-gray-800 rounded-lg shadow"
      >
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-3">
            <img
              :src="getStudent(student.studentId)?.avatar"
              :alt="getStudent(student.studentId)?.nombre"
              class="w-10 h-10 rounded-full"
            />
            <div>
              <p class="font-medium">
                {{ getStudent(student.studentId)?.nombre }}
                {{ getStudent(student.studentId)?.apellido }}
              </p>
              <p class="text-sm text-gray-600 dark:text-gray-400">
                {{ getStudent(student.studentId)?.clase }}
              </p>
            </div>
          </div>
          <div class="text-right">
            <p class="text-2xl font-bold text-red-600 dark:text-red-400">
              {{ student.absences }}
            </p>
            <p class="text-sm text-gray-600 dark:text-gray-400">ausencias</p>
          </div>
        </div>
        
        <div class="mt-2 pt-2 border-t dark:border-gray-700">
          <p class="text-sm text-gray-600 dark:text-gray-400">
            Última asistencia: {{ formatDate(student.lastAttendance) }}
          </p>
          <div class="mt-1 flex gap-2">
            <span
              class="px-2 py-1 text-xs rounded-full"
              :class="getAttendanceRateClass(getAttendanceRate(student.studentId))"
            >
              {{ Math.round(getAttendanceRate(student.studentId)) }}% asistencia
            </span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { useStudentsStore } from '../stores/students'
import { useAttendanceStore } from '../stores/attendance'

const props = defineProps<{
  className?: string
  limit?: number
}>()

const studentsStore = useStudentsStore()
const attendanceStore = useAttendanceStore()

const absentStudents = computed(() => 
  attendanceStore.getMostAbsentStudents(props.limit || 5)
)

const getStudent = (studentId: string) => 
  studentsStore.students.find(s => s.id === studentId)

const getAttendanceRate = (studentId: string) =>
  props.className
    ? attendanceStore.getStudentAttendanceRate(studentId, props.className)
    : 0

const formatDate = (date: string) =>
  format(new Date(date), 'PPP', { locale: es })

const getAttendanceRateClass = (rate: number) => {
  if (rate >= 90) return 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200'
  if (rate >= 75) return 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-200'
  return 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200'
}
</script>