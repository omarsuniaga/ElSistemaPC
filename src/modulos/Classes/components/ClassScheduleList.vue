<template>
  <div class="space-y-4">
    <div v-if="isLoading" class="flex justify-center items-center py-12">
      <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
    </div>

    <div v-else-if="error" class="bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 p-4 rounded-lg">
      {{ error }}
    </div>

    <div v-else class="grid gap-4">
      <div v-for="class_ in classes" :key="class_.id" class="card p-4">
        <div class="flex justify-between items-start">
          <div>
            <h3 class="text-lg font-semibold">{{ class_.name }}</h3>
            <p class="text-sm text-gray-600 dark:text-gray-400">
              Profesor: {{ getTeacherName(class_.teacherId) }}
            </p>
          </div>
          <span class="px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200 rounded-full text-sm">
            {{ getStudentCount(class_.studentIds) }} Alumnos
          </span>
        </div>

        <div class="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <h4 class="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">Horario</h4>
            <div class="space-y-1">
              <div v-for="day in getScheduleDays(class_.schedule)" :key="day" 
                   class="flex items-center gap-2 text-sm">
                <span class="font-medium">{{ day }}:</span>
                <span>{{ getScheduleTime(class_.schedule) }}</span>
              </div>
            </div>
          </div>

          <div>
            <h4 class="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">Estudiantes</h4>
            <ul class="space-y-1">              <li v-for="student in getStudents(class_.studentIds)" :key="student.id"
                  class="text-sm flex items-center gap-2">
                <StudentAvatar
                  :first-name="student.nombre || ''"
                  :last-name="student.apellido || ''"
                  size="xs"
                />
                {{ student.nombre }} {{ student.apellido }}
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useClassesStore } from '../store/classes'
import { useTeachersStore } from '../../Teachers/store/teachers'
import { useStudentsStore } from '../../Students/store/students'
import StudentAvatar from '../../Students/components/StudentAvatar.vue'

const classesStore = useClassesStore()
const teachersStore = useTeachersStore()
const studentsStore = useStudentsStore()

const isLoading = ref(true)
const error = ref('')

const classes = computed(() => classesStore.classes)

const getTeacherName = (teacherId: string | undefined): string => {
  if (!teacherId) return 'Sin asignar'
  const teacher = teachersStore.teachers.find(t => t.id === teacherId)
  return teacher ? teacher.name : 'Sin asignar'
}

const getStudentCount = (studentIds: string[] | undefined) => {
  return studentIds?.length || 0
}

const getScheduleDays = (schedule: string | { days: string[]; startTime: string; endTime: string; } | undefined) => {
  if (typeof schedule === 'object' && schedule !== null && 'days' in schedule) {
    return schedule.days
  }
  return []
}

const getScheduleTime = (schedule: string | { days: string[]; startTime: string; endTime: string; } | undefined) => {
  if (typeof schedule === 'object' && schedule !== null && 'startTime' in schedule && 'endTime' in schedule) {
    return `${schedule.startTime}-${schedule.endTime}`
  }
  return ''
}

const getStudents = (studentIds: string[] = []) => {
  return studentsStore.students.filter(student => studentIds.includes(student.id))
}

onMounted(async () => {
  try {
    await Promise.all([
      classesStore.fetchClasses(),
      teachersStore.fetchTeachers(),
      studentsStore.fetchStudents()
    ])
  } catch (err) {
    error.value = 'Error al cargar los datos'
    console.error('Error loading data:', err)
  } finally {
    isLoading.value = false
  }
})
</script>