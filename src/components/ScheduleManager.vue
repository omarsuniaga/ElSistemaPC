```vue
<script setup lang="ts">
import { ref, computed } from 'vue'
import { useTeachersStore } from '../stores/teachers'
import { useClassesStore } from '../stores/classes'
import { useStudentsStore } from '../stores/students'

const teachersStore = useTeachersStore()
const classesStore = useClassesStore()
const studentsStore = useStudentsStore()

const conflicts = ref<{
  teacherId: string
  classId: number
  type: 'overlap' | 'capacity' | 'level'
  description: string
}[]>([])

const schedule = computed(() => {
  const allClasses = classesStore.classes
  const allTeachers = teachersStore.teachers
  
  return allClasses.map(class_ => {
    const teacher = allTeachers.find(t => t.id === class_.teacherId)
    return {
      ...class_,
      teacher: teacher?.name || 'Sin asignar',
      students: class_.studentIds.length,
      hasConflict: conflicts.value.some(c => c.classId === class_.id)
    }
  })
})

const checkConflicts = () => {
  conflicts.value = []

  // Check for schedule overlaps
  schedule.value.forEach(class1 => {
    schedule.value.forEach(class2 => {
      if (class1.id !== class2.id && 
          class1.teacherId === class2.teacherId &&
          // Add logic to check time overlap
          true) {
        conflicts.value.push({
          teacherId: class1.teacherId.toString(),
          classId: class1.id,
          type: 'overlap',
          description: `Conflicto de horario con ${class2.name}`
        })
      }
    })
  })

  // Check classroom capacity
  schedule.value.forEach(class_ => {
    if (class_.students > 10) { // Example capacity limit
      conflicts.value.push({
        teacherId: class_.teacherId.toString(),
        classId: class_.id,
        type: 'capacity',
        description: 'Excede la capacidad máxima del aula'
      })
    }
  })

  // Check student level compatibility
  schedule.value.forEach(class_ => {
    const students = studentsStore.students.filter(s => 
      class_.studentIds.includes(s.id)
    )
    
    if (students.some(s => s.level !== class_.level)) {
      conflicts.value.push({
        teacherId: class_.teacherId.toString(),
        classId: class_.id,
        type: 'level',
        description: 'Niveles de estudiantes incompatibles'
      })
    }
  })
}

const optimizeSchedule = () => {
  // Implement schedule optimization logic here
  // This would involve:
  // 1. Analyzing teacher availability
  // 2. Student preferences
  // 3. Room availability
  // 4. Level grouping
  // 5. Minimizing conflicts
}

const suggestChanges = () => {
  // Implement logic to suggest schedule improvements
  // This would provide recommendations for:
  // 1. Resolving conflicts
  // 2. Better time slots
  // 3. Group redistributions
  // 4. Room reassignments
}
</script>

<template>
  <div class="space-y-6">
    <!-- Schedule Controls -->
    <div class="flex justify-between items-center">
      <h2 class="text-lg font-semibold">Horarios</h2>
      <div class="flex gap-3">
        <button
          @click="checkConflicts"
          class="btn bg-yellow-600 text-white hover:bg-yellow-700"
        >
          Verificar Conflictos
        </button>
        <button
          @click="optimizeSchedule"
          class="btn bg-green-600 text-white hover:bg-green-700"
        >
          Optimizar
        </button>
        <button
          @click="suggestChanges"
          class="btn bg-blue-600 text-white hover:bg-blue-700"
        >
          Sugerir Cambios
        </button>
      </div>
    </div>

    <!-- Conflicts -->
    <div v-if="conflicts.length > 0" class="card bg-red-50 dark:bg-red-900/10">
      <h3 class="text-lg font-semibold text-red-700 dark:text-red-400 mb-4">
        Conflictos Detectados
      </h3>
      <div class="space-y-2">
        <div
          v-for="conflict in conflicts"
          :key="`${conflict.teacherId}-${conflict.classId}`"
          class="flex items-center justify-between p-2 bg-white dark:bg-gray-800 rounded"
        >
          <div>
            <p class="font-medium">
              {{ schedule.find(s => s.id === conflict.classId)?.name }}
            </p>
            <p class="text-sm text-gray-600 dark:text-gray-400">
              {{ conflict.description }}
            </p>
          </div>
          <span
            class="px-2 py-1 text-sm rounded"
            :class="{
              'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400': conflict.type === 'overlap',
              'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400': conflict.type === 'capacity',
              'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400': conflict.type === 'level'
            }"
          >
            {{ conflict.type }}
          </span>
        </div>
      </div>
    </div>

    <!-- Schedule Grid -->
    <div class="overflow-x-auto">
      <table class="w-full">
        <thead>
          <tr>
            <th class="px-4 py-2 text-left bg-gray-50 dark:bg-gray-800">Clase</th>
            <th class="px-4 py-2 text-left bg-gray-50 dark:bg-gray-800">Profesor</th>
            <th class="px-4 py-2 text-left bg-gray-50 dark:bg-gray-800">Horario</th>
            <th class="px-4 py-2 text-left bg-gray-50 dark:bg-gray-800">Alumnos</th>
            <th class="px-4 py-2 text-left bg-gray-50 dark:bg-gray-800">Estado</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="class_ in schedule"
            :key="class_.id"
            class="border-b dark:border-gray-700"
            :class="{ 'bg-red-50 dark:bg-red-900/10': class_.hasConflict }"
          >
            <td class="px-4 py-2">{{ class_.name }}</td>
            <td class="px-4 py-2">{{ class_.teacher }}</td>
            <td class="px-4 py-2">{{ class_.schedule }}</td>
            <td class="px-4 py-2">{{ class_.students }}</td>
            <td class="px-4 py-2">
              <span
                class="px-2 py-1 text-sm rounded"
                :class="class_.hasConflict ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'"
              >
                {{ class_.hasConflict ? 'Conflicto' : 'OK' }}
              </span>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>
```