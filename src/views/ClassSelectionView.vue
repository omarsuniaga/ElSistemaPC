<template>
  <div class="max-w-3xl mx-auto p-4">
    <h2 class="text-lg font-semibold mb-3 text-center sm:text-left">Seleccionar Clase</h2>
    <DateClassSelector
      v-model="selectedClass"
      v-model:selectedDate="selectedDate"
      :dayFilter="true"
      :isLoading="isLoading"
      :classesWithRecords="classesWithRecords"
      @continue="goToAttendance"
      @date-change="onDateChange"
      class="max-w-full"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import DateClassSelector from '../modulos/Classes/components/DateClassSelector.vue'
import { useAttendanceStore } from '../modulos/Attendance/store/attendance'
import { getCurrentDate } from '../utils/dateUtils'

const router = useRouter()
const route = useRoute()
const attendanceStore = useAttendanceStore()

// Iniciar desde query o hoy
const selectedDate = ref<string>(route.query.date as string || getCurrentDate())
const selectedClass = ref<string>(route.query.class as string || '')
const isLoading = ref(false)

// Clases con registro en la fecha actual
const classesWithRecords = computed(() =>
  attendanceStore.attendanceDocuments
    .filter(doc => doc.fecha === selectedDate.value)
    .map(doc => doc.classId)
)

function onDateChange(date: string) {
  selectedDate.value = date
  router.replace({ query: { date } })
}

function goToAttendance() {
  if (!selectedClass.value) return
  const formatted = selectedDate.value.replace(/-/g, '')
  router.push(`/attendance/${formatted}/${selectedClass.value}`)
}
</script>
