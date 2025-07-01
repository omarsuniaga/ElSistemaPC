<template>
  <div class="p-4">
    <h1 class="text-2xl mb-4">Actividades registradas para el {{ formattedDate }}</h1>
    <div v-if="activities.length === 0">
      <p>No se han registrado actividades para esta fecha.</p>
    </div>
    <ul v-else class="space-y-4">
      <li
        v-for="activity in activities"
        :key="activity.classId"
        class="p-4 border rounded-lg hover:bg-gray-50 cursor-pointer"
        @click="viewDetails(activity)"
      >
        <h2 class="text-xl font-bold">Clase: {{ activity.classId }}</h2>
        <p><strong>Presentes:</strong> {{ activity.data.presentes.length }}</p>
        <p><strong>Ausentes:</strong> {{ activity.data.ausentes.length }}</p>
        <p>
          <strong>Tardanzas:</strong>
          {{
            activity.data.tarde.filter(
              (id) => !activity.data.justificacion?.some((j) => j.id === id)
            ).length
          }}
        </p>
        <p>
          <strong>Justificados:</strong>
          {{ activity.data.justificacion ? activity.data.justificacion.length : 0 }}
        </p>
      </li>
    </ul>
  </div>
</template>

<script setup lang="ts">
import {ref, computed, onMounted} from "vue"
import {useRoute, useRouter} from "vue-router"
import {useAttendanceStore} from "../modulos/Attendance/store/attendance"
import {format, parseISO, isValid} from "date-fns"
import {es} from "date-fns/locale"

const route = useRoute()
const router = useRouter()
const attendanceStore = useAttendanceStore()

// Get date param from URL (ej: "20250318")
const routeDateParam = route.params.date as string

// Convert from YYYYMMDD to YYYY-MM-DD
const formattedDate = computed(() => {
  if (routeDateParam && routeDateParam.length === 8) {
    const year = routeDateParam.substring(0, 4)
    const month = routeDateParam.substring(4, 6)
    const day = routeDateParam.substring(6, 8)
    return `${year}-${month}-${day}`
  }
  return routeDateParam || ""
})

const activities = ref<any[]>([])

onMounted(async () => {
  try {
    // Load all attendance documents
    await attendanceStore.fetchAttendanceDocuments()
    // Filter documents matching the selected date
    activities.value = attendanceStore.attendanceDocuments.filter(
      (doc) => doc.fecha === formattedDate.value
    )
  } catch (error) {
    console.error("Error fetching activities:", error)
  }
})

const viewDetails = (activity: any) => {
  // Navigate to the detail view: /attendance/YYYYMMDD/classId
  const dateParam = route.params.date
  router.push(`/attendance/${dateParam}/${activity.classId}`)
}
</script>
