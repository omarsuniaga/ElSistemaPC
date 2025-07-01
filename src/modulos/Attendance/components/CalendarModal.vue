<template>
  <div v-if="modelValue" class="fixed inset-0 flex items-center justify-center z-50">
    <div class="absolute inset-0 bg-black/50" @click="close" />
    <div class="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md z-10">
      <div
        class="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center"
      >
        <h3 class="text-lg font-semibold text-gray-900 dark:text-gray-100">Seleccionar Fecha</h3>
        <button class="text-gray-500 hover:text-gray-700" @click="close">
          <XMarkIcon class="w-5 h-5" />
        </button>
      </div>
      <div class="p-4">
        <Calendar
          :selected-date="selectedDate"
          :current-month="currentMonth"
          :marked-dates="markedDates"
          @select="handleSelect"
          @month-change="handleMonthChange"
        />
      </div>
      <div class="p-4 border-t border-gray-200 dark:border-gray-700 flex justify-end">
        <button class="btn btn-secondary mr-2" @click="close">Cancelar</button>
        <button class="btn btn-primary" @click="confirmSelection">Confirmar</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import {ref, watch} from "vue"
import {XMarkIcon} from "@heroicons/vue/24/outline"
import Calendar from "../../../components/Calendar.vue"

import {useAttendanceStore} from "../store/attendance"

const attendanceStore = useAttendanceStore()

const props = defineProps<{
  modelValue: boolean
  initialDate: string
  markedDates?: string[]
  classId?: string
}>()

const emit = defineEmits<{
  (e: "update:modelValue", value: boolean): void
  (e: "select", date: string): void
  (e: "month-change", month: Date): void
}>()

const selectedDate = ref(props.initialDate)
const currentMonth = ref(new Date())

// Actualizar selectedDate si cambia initialDate
watch(
  () => props.initialDate,
  (newDate) => {
    selectedDate.value = newDate
  }
)

// Manejar selección de fecha en el calendario
const handleSelect = (date: any) => {
  if (typeof date === "string") {
    selectedDate.value = date
  } else if (date && date.date) {
    selectedDate.value = date.date
  }
}

// Manejar cambio de mes en el calendario
const handleMonthChange = (newMonth: Date) => {
  currentMonth.value = newMonth
  emit("month-change", newMonth)
  // Cargar registros de asistencia para el nuevo mes
  if (props.classId) {
    attendanceStore.fetchAttendanceRecords({
      classId: props.classId,
      startDate: newMonth,
      endDate: new Date(newMonth.getFullYear(), newMonth.getMonth() + 1, 0),
    })
  } else {
    attendanceStore.fetchAllAttendanceDates(
      new Date(newMonth.getFullYear(), newMonth.getMonth(), 1),
      new Date(newMonth.getFullYear(), newMonth.getMonth() + 1, 0)
    )
  }
}

const confirmSelection = () => {
  emit("select", selectedDate.value)
  close()
}

const close = () => {
  emit("update:modelValue", false)
}
</script>
