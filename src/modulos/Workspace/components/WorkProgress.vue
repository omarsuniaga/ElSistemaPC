<template>
  <div class="space-y-6">
    <!-- Selector de Vista -->
    <div class="flex flex-wrap gap-4 justify-center">
      <button
        v-for="(label, mode) in viewModes"
        :key="mode"
        @click="currentView.value = mode"
        class="px-4 py-2 rounded-lg"
        :class="currentView.value === mode ? 'bg-primary-600 text-white' : 'bg-gray-200 dark:bg-gray-700'"
      >
        {{ label }}
      </button>
    </div>

    <!-- Vista General (4to caso) -->
    <div v-if="currentView.value === 'general'" class="space-y-6">
      <div class="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
        <div v-for="section in sections" :key="section.name" class="card">
          <h3 class="font-semibold mb-2">{{ section.displayName }}</h3>
          <div class="flex items-end gap-2">
            <div class="flex-grow h-4 bg-gray-200 dark:bg-gray-700 rounded">
              <div
                class="h-full bg-primary-600 rounded"
                :style="{ width: `${getSectionProgress(work.id, section.name)}%` }"
              ></div>
            </div>
            <span class="text-sm font-medium">
              {{ getSectionProgress(work.id, section.name) }}%
            </span>
          </div>
        </div>
      </div>

      <!-- Vista detallada de instrumentos -->
      <div class="space-y-4">
        <div v-for="instrument in work.instruments" :key="instrument.id" class="card">
          <div class="flex justify-between items-start mb-4">
            <div>
              <h3 class="font-semibold">{{ instrument.name }}</h3>
              <p class="text-sm text-gray-600 dark:text-gray-400">
                {{ getInstrumentProgress(work.id, instrument.id) }}% completado
              </p>
            </div>
          </div>

          <div class="grid grid-cols-10 gap-1">
            <div
              v-for="measure in instrument.measures"
              :key="measure.id"
              class="aspect-square rounded cursor-pointer relative group transition-all duration-200"
              :class="getStatusColor(measure.progress)"
              @click="updateProgress(measure, instrument)"
            >
              <span class="absolute inset-0 flex items-center justify-center text-white text-xs font-medium opacity-0 group-hover:opacity-100">
                {{ measure.number }}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Vista por Estudiante (1er caso) -->
    <div v-else-if="currentView.value === 'student'" class="space-y-6">
      <div class="mb-4">
        <select v-model="selectedStudent.value" class="input">
          <option value="">Seleccionar estudiante</option>
          <option
            v-for="student in students"
            :key="student.id"
            :value="student.id"
          >
            {{ student.nombre }} {{ student.apellido }}
          </option>
        </select>
      </div>

      <div v-if="selectedStudent.value" class="space-y-4">
        <div v-for="instrument in studentInstruments" :key="instrument.id" class="card">
          <div class="flex justify-between items-start mb-4">
            <div>
              <h3 class="font-semibold">{{ instrument.name }}</h3>
              <p class="text-sm text-gray-600 dark:text-gray-400">
                {{ getInstrumentProgress(work.id, instrument.id, selectedStudent.value) }}% completado
              </p>
            </div>
          </div>

          <div class="grid grid-cols-10 gap-1">
            <div
              v-for="measure in instrument.measures"
              :key="measure.id"
              class="aspect-square rounded cursor-pointer relative group transition-all duration-200"
              :class="getStatusColor(measure.studentProgress?.[selectedStudent.value] || 0)"
              @click="updateStudentProgress(measure, instrument)"
            >
              <span class="absolute inset-0 flex items-center justify-center text-white text-xs font-medium opacity-0 group-hover:opacity-100">
                {{ measure.number }}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Vista por Sección (3er caso) -->
    <div v-else-if="currentView.value === 'section'" class="space-y-6">
      <div class="mb-4">
        <select v-model="selectedSection.value" class="input">
          <option value="">Seleccionar sección</option>
          <option
            v-for="section in sections"
            :key="section.name"
            :value="section.name"
          >
            {{ section.displayName }}
          </option>
        </select>
      </div>

      <div v-if="selectedSection.value" class="space-y-4">
        <div
          v-for="instrument in sectionInstruments"
          :key="instrument.id"
          class="card"
        >
          <div class="flex justify-between items-start mb-4">
            <div>
              <h3 class="font-semibold">{{ instrument.name }}</h3>
              <p class="text-sm text-gray-600 dark:text-gray-400">
                {{ getInstrumentProgress(work.id, instrument.id) }}% completado
              </p>
            </div>
          </div>

          <!-- Vista de estudiantes por instrumento (2do caso) -->
          <div v-if="instrument.studentProgress" class="mb-4">
            <h4 class="text-sm font-medium mb-2">Progreso por Estudiante</h4>
            <div class="grid gap-2">
              <div
                v-for="(progress, studentId) in instrument.studentProgress"
                :key="studentId"
                class="flex items-center gap-2"
              >
                <span class="text-sm">{{ getStudentName(studentId) }}</span>
                <div class="flex-grow h-2 bg-gray-200 dark:bg-gray-700 rounded">
                  <div
                    class="h-full bg-primary-600 rounded"
                    :style="{ width: `${progress}%` }"
                  ></div>
                </div>
                <span class="text-sm font-medium">{{ progress }}%</span>
              </div>
            </div>
          </div>

          <div class="grid grid-cols-10 gap-1">
            <div
              v-for="measure in instrument.measures"
              :key="measure.id"
              class="aspect-square rounded cursor-pointer relative group transition-all duration-200"
              :class="getStatusColor(measure.progress)"
              @click="updateProgress(measure, instrument)"
            >
              <span class="absolute inset-0 flex items-center justify-center text-white text-xs font-medium opacity-0 group-hover:opacity-100">
                {{ measure.number }}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import type { MusicalWork, Measure, Instrument } from '../types/repertoire'
import { INSTRUMENT_SECTIONS } from '../types/repertoire'
import { useRepertoireStore } from '../stores/repertoire'
import { useStudentsStore } from '../stores/students'

const props = defineProps<{
  work: MusicalWork
  repertoireId: number
}>()

const repertoireStore = useRepertoireStore()
const studentsStore = useStudentsStore()

const currentView = ref<'general' | 'student' | 'section'>('general')
const selectedStudent = ref('')
const selectedSection = ref('')

const viewModes = {
  general: 'Vista General',
  student: 'Por Estudiante',
  section: 'Por Sección'
}

const sections = INSTRUMENT_SECTIONS
const students = computed(() => studentsStore.students)

const sectionInstruments = computed(() => {
  if (!selectedSection.value) return []
  return props.work.instruments.filter(i => i.section === selectedSection.value)
})

const studentInstruments = computed(() => {
  if (!selectedStudent.value) return []
  return props.work.instruments.filter(i => 
    i.studentProgress?.[selectedStudent.value] !== undefined
  )
})

const getStudentName = (studentId: string) => {
  const student = studentsStore.students.find(s => s.id.toString() === studentId)
  return student ? `${student.nombre} ${student.apellido}` : 'Estudiante'
}

const getStatusColor = (progress: number) => {
  if (progress <= 20) return 'bg-red-500'
  if (progress <= 40) return 'bg-orange-500'
  if (progress <= 60) return 'bg-yellow-500'
  if (progress <= 80) return 'bg-blue-500'
  return 'bg-green-500'
}

const updateProgress = async (measure: Measure, instrument: Instrument) => {
  let newProgress = Math.min(100, Math.floor(measure.progress / 20) * 20 + 20)

  try {
    await repertoireStore.updateMeasureProgress(
      props.repertoireId,
      props.work.id,
      instrument.id,
      measure.id,
      newProgress
    )
  } catch (err) {
    console.error('Error updating progress:', err)
  }
}

const updateStudentProgress = async (measure: Measure, instrument: Instrument) => {
  if (!selectedStudent.value) return

  const currentProgress = measure.studentProgress?.[selectedStudent.value] || 0
  const newProgress = Math.min(100, Math.floor(currentProgress / 20) * 20 + 20)

  try {
    await repertoireStore.updateMeasureProgress(
      props.repertoireId,
      props.work.id,
      instrument.id,
      measure.id,
      newProgress,
      selectedStudent.value
    )
  } catch (err) {
    console.error('Error updating student progress:', err)
  }
}

const getSectionProgress = (workId: number, sectionName: string) => {
  return repertoireStore.getSectionProgress(workId, sectionName)
}

const getInstrumentProgress = (workId: number, instrumentId: number, studentId?: string) => {
  return repertoireStore.getInstrumentProgress(workId, instrumentId, studentId)
}
</script>