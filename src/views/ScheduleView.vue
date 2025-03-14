<template>
  <div class="py-6">
    <div class="flex justify-between items-center mb-6">
      <h1 class="text-2xl font-bold">Horarios de Clases</h1>
      <div class="flex gap-3">
        <button 
          @click="showByDay = !showByDay"
          class="btn btn-primary flex items-center gap-2"
        >
          <CalendarIcon class="w-5 h-5" />
          {{ showByDay ? 'Ver por Clase' : 'Ver por Día' }}
        </button>
      </div>
    </div>

    <!-- Vista por Día -->
    <div v-if="showByDay" class="grid grid-cols-7 gap-4">
      <div v-for="day in days" :key="day" class="card">
        <h2 class="text-lg font-semibold mb-4">{{ day }}</h2>
        <div class="space-y-3">
          <div
            v-for="class_ in getClassesByDay(day.toLowerCase())"
            :key="class_.id"
            class="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
          >
            <p class="font-medium">{{ class_.name }}</p>
            <p class="text-sm text-gray-600 dark:text-gray-400">
              {{ getScheduleTime(class_.schedule) }}
            </p>
            <p class="text-sm text-gray-600 dark:text-gray-400">
              {{ getTeacherName(class_.teacherId) }}
            </p>
          </div>
        </div>
      </div>
    </div>

    <!-- Vista por Clase -->
    <ClassScheduleList v-else />
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { CalendarIcon } from '@heroicons/vue/24/outline'
import ClassScheduleList from '../components/ClassScheduleList.vue'
import { useClassesStore } from '../stores/classes'
import { useTeachersStore } from '../stores/teachers'

const classesStore = useClassesStore()
const teachersStore = useTeachersStore()
const showByDay = ref(false)

const days = [
  'Lunes',
  'Martes',
  'Miércoles',
  'Jueves',
  'Viernes',
  'Sábado',
  'Domingo'
]

const getClassesByDay = (day: string) => {
  return classesStore.classes.filter(class_ => 
    class_.schedule.toLowerCase().includes(day)
  )
}

const getScheduleTime = (schedule: string) => {
  const timeMatch = schedule.match(/\d{1,2}:\d{2}-\d{1,2}:\d{2}/)
  return timeMatch ? timeMatch[0] : ''
}

const getTeacherName = (teacherId: string) => {
  const teacher = teachersStore.teachers.find(t => t.id === teacherId)
  return teacher ? teacher.name : 'Sin asignar'
}
</script>