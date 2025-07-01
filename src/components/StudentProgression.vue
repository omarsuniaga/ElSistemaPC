<!-- src/components/StudentProgression.vue -->
<script setup lang="ts">
import {ref, computed} from "vue"
import {useClassesStore} from "../modulos/Classes/store/classes"
import {useStudentsStore} from "../modulos/Students/store/students"

const props = defineProps<{
  studentId: string
  classId: string
}>()

const emit = defineEmits<{
  (e: "promoted", classId: string): void
}>()

const classesStore = useClassesStore()
const studentsStore = useStudentsStore()
const isLoading = ref(false)
const error = ref("")
const progressionData = ref<any>(null)

const student = computed(() => studentsStore.students.find((s) => s.id === props.studentId))

const currentClass = computed(() => classesStore.getClassById(props.classId))

const checkProgression = async () => {
  try {
    isLoading.value = true
    error.value = ""
    progressionData.value = await classesStore.checkStudentProgression(
      props.studentId,
      props.classId
    )
  } catch (err: any) {
    error.value = err.message || "Error al verificar progresión"
  } finally {
    isLoading.value = false
  }
}

const promoteStudent = async () => {
  try {
    isLoading.value = true
    error.value = ""
    const newClass = await classesStore.promoteStudent(props.studentId, props.classId)
    emit("promoted", newClass.id)
  } catch (err: any) {
    error.value = err.message || "Error al promover estudiante"
  } finally {
    isLoading.value = false
  }
}
</script>

<template>
  <div class="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
    <div v-if="student && currentClass" class="space-y-4">
      <div class="flex justify-between items-start">
        <div>
          <h3 class="text-lg font-medium">{{ student.nombre }} {{ student.apellido }}</h3>
          <p class="text-sm text-gray-600 dark:text-gray-400">
            Nivel actual: {{ currentClass.level }}
          </p>
        </div>

        <button
          class="px-3 py-1 text-sm bg-blue-100 hover:bg-blue-200 dark:bg-blue-900/30 dark:hover:bg-blue-800/40 text-blue-800 dark:text-blue-200 rounded-full"
          :disabled="isLoading"
          @click="checkProgression"
        >
          Verificar Progreso
        </button>
      </div>

      <!-- Progression Results -->
      <div v-if="progressionData" class="space-y-3 mt-4">
        <div class="grid grid-cols-3 gap-4">
          <div class="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <div class="text-sm text-gray-600 dark:text-gray-400">Asistencia</div>
            <div class="text-lg font-medium">
              {{ Math.round(progressionData.metrics.attendanceRate) }}%
            </div>
          </div>

          <div class="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <div class="text-sm text-gray-600 dark:text-gray-400">Promedio</div>
            <div class="text-lg font-medium">
              {{ Math.round(progressionData.metrics.averageScore) }}%
            </div>
          </div>

          <div class="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <div class="text-sm text-gray-600 dark:text-gray-400">Clases</div>
            <div class="text-lg font-medium">
              {{ progressionData.metrics.classesAttended }}
            </div>
          </div>
        </div>

        <div v-if="progressionData.canAdvance" class="mt-4">
          <div class="mb-2 text-sm text-green-600 dark:text-green-400">
            ¡El estudiante cumple con los criterios para avanzar al siguiente nivel!
          </div>
          <button
            class="w-full px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg"
            :disabled="isLoading"
            @click="promoteStudent"
          >
            Promover al Siguiente Nivel
          </button>
        </div>

        <div v-else class="mt-4 text-sm text-gray-600 dark:text-gray-400">
          <p>El estudiante aún no cumple con todos los criterios para avanzar:</p>
          <ul class="list-disc list-inside mt-2">
            <li v-if="progressionData.metrics.attendanceRate < 85">
              La asistencia debe ser mayor al 85%
            </li>
            <li v-if="progressionData.metrics.averageScore < 80">
              El promedio debe ser mayor al 80%
            </li>
            <li v-if="progressionData.metrics.classesAttended < 20">
              Debe completar al menos 20 clases
            </li>
          </ul>
        </div>
      </div>

      <!-- Error Message -->
      <div v-if="error" class="mt-4 text-sm text-red-600 dark:text-red-400">
        {{ error }}
      </div>
    </div>
  </div>
</template>
