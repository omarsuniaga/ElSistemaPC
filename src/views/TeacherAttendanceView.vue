<!-- src/modulos/attendance/views/TeacherAttendanceView.vue -->
<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useAttendanceState } from '../composables/useAttendanceState'
import { useModal } from '../composables/useModal'
import { useToast } from '../composables/useToast'
import { useAttendanceStore } from '../store/attendanceData'

import AttendanceHeader from '../components/AttendanceHeader.vue'
import Calendar from '@/components/Calendar.vue'
import DateClassSelector from '@/modulos/Classes/components/DateClassSelector.vue'
import AttendanceList from '../components/AttendanceList.vue'

// Estado centralizado para maestro
const state = useAttendanceState('teacher')
const modal = useModal()
const toast = useToast()
const attendanceStore = useAttendanceStore()
const router = useRouter()

// Clases con registro en la fecha seleccionada
const classesWithRecords = ref<string[]>([])

/** Actualiza la lista de clases que ya tienen asistencia registrada */
async function updateClassesWithRecords() {
  await attendanceStore.fetchAttendanceDocuments()
  classesWithRecords.value = attendanceStore.attendanceDocuments
    .filter(doc => doc.fecha === state.selectedDate)
    .map(doc => doc.classId)
}

/** Maneja cambio de fecha */
async function handleDateChange(date: string) {
  await state.setDate(date)
  state.view = 'class-select'
  await updateClassesWithRecords()
}

/** Maneja selección de clase */
function handleClassSelect(classId: string) {
  state.setClass(classId)
  state.view = 'attendance-form'
  state.loadCurrent()
}

/** Cuando se guarda la asistencia */
function handleSaved() {
  toast.success('Asistencia guardada')
  updateClassesWithRecords()
}

onMounted(async () => {
  await state.init()
  await updateClassesWithRecords()
})

// Cada vez que cambia la fecha, refrescar clases con registros
watch(() => state.selectedDate, updateClassesWithRecords)
</script>

<template>
  <div class="p-4 space-y-4">
    <!-- Header limpio -->
    <AttendanceHeader
      :selected-date="state.selectedDate"    
      :selected-class="state.selectedClass"
      role="maestro"
      @changeView="state.view = $event"
      @analytics="modal.open('analytics')"
      @report="modal.open('report')"

    />

    <!-- Vista: Calendario -->
    <Calendar
      v-if="state.view === 'calendar'"
      :selected-date="state.selectedDate"
      @select="handleDateChange"
      class="mx-auto"
    />

    <!-- Vista: Selector de clases -->
    <DateClassSelector
      v-else-if="state.view === 'class-select'"
      v-model="state.selectedClass"
      :selected-date="state.selectedDate"
      :classes-with-records="classesWithRecords"
      :is-loading="state.loading"
      @update:model-value="handleClassSelect"
      @date-change="handleDateChange"
    />

    <!-- Vista: Lista de Asistencia -->
    <AttendanceList
      v-else-if="state.view === 'attendance-form'"
      :selected-date="state.selectedDate"
      :selected-class="state.selectedClass"
      @saved="handleSaved"
      @error="toast.error($event)"
    />
  </div>
</template>

<style scoped>
/* Estilos opcionales */
</style>
