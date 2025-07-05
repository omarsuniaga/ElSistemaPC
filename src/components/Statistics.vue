```vue
<script setup lang="ts">
import {ref, computed, onMounted} from "vue"
import {Line, Bar, Doughnut} from "vue-chartjs"
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  type ChartData,
  type ChartOptions,
} from "chart.js"
import {useStudentsStore} from "../modulos/Students/store/students"
import {useTeachersStore} from "../stores/teachers"
import {useClassesStore} from "../stores/classes"
import {useAttendanceStore} from "../stores/attendance"

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
)

const props = defineProps<{
  type: "student" | "teacher"
  id: number | string
  period?: "week" | "month" | "year"
}>()

const studentsStore = useStudentsStore()
const teachersStore = useTeachersStore()
const classesStore = useClassesStore()
const attendanceStore = useAttendanceStore()

const isLoading = ref(true)
const error = ref("")

// Chart data
const attendanceData = computed<ChartData>(() => ({
  labels: ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"],
  datasets: [
    {
      label: "Asistencia",
      data: [95, 87, 92, 88, 90, 85, 89],
      borderColor: "#22c55e",
      backgroundColor: "#22c55e",
    },
  ],
}))

const performanceData = computed<ChartData>(() => ({
  labels: ["Teoría", "Técnica", "Interpretación", "Ritmo"],
  datasets: [
    {
      data: [85, 92, 78, 88],
      backgroundColor: ["#3b82f6", "#22c55e", "#eab308", "#ec4899"],
    },
  ],
}))

const progressData = computed<ChartData>(() => ({
  labels: ["Ene", "Feb", "Mar", "Abr", "May", "Jun"],
  datasets: [
    {
      label: "Progreso",
      data: [65, 70, 75, 82, 85, 90],
      borderColor: "#8b5cf6",
      backgroundColor: "#8b5cf6",
    },
  ],
}))

const chartOptions: ChartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      position: "top",
    },
  },
  scales: {
    y: {
      beginAtZero: true,
      max: 100,
    },
  },
}

// Metrics
const metrics = computed(() => {
  if (props.type === "student") {
    return {
      attendance: "90%",
      performance: "85%",
      progress: "75%",
      level: "Intermedio",
    }
  } else {
    return {
      students: "15",
      classes: "45",
      rating: "4.8",
      experience: "5 años",
    }
  }
})

onMounted(async () => {
  try {
    // Fetch data based on type and id
    if (props.type === "student") {
      await Promise.all([studentsStore.fetchStudents(), attendanceStore.fetchAttendance()])
    } else {
      await Promise.all([teachersStore.fetchTeachers(), classesStore.fetchClasses()])
    }
    isLoading.value = false
  } catch (err) {
    error.value = "Error al cargar los datos"
    isLoading.value = false
  }
})
</script>

<template>
  <div class="space-y-6">
    <!-- Loading State -->
    <div v-if="isLoading" class="flex justify-center items-center py-12">
      <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
    </div>

    <!-- Error State -->
    <div
      v-else-if="error"
      class="bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 p-4 rounded-lg"
    >
      {{ error }}
    </div>

    <div v-else>
      <!-- Key Metrics -->
      <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div v-for="(value, key) in metrics" :key="key" class="card">
          <h3 class="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
            {{ key.charAt(0).toUpperCase() + key.slice(1) }}
          </h3>
          <p class="text-2xl font-bold">{{ value }}</p>
        </div>
      </div>

      <!-- Charts -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <!-- Attendance Chart -->
        <div class="card">
          <h3 class="text-lg font-semibold mb-4">Asistencia</h3>
          <div class="h-64">
            <Line :data="attendanceData" :options="chartOptions" />
          </div>
        </div>

        <!-- Performance Chart -->
        <div class="card">
          <h3 class="text-lg font-semibold mb-4">Rendimiento</h3>
          <div class="h-64">
            <Doughnut :data="performanceData" :options="chartOptions" />
          </div>
        </div>

        <!-- Progress Chart -->
        <div class="card md:col-span-2">
          <h3 class="text-lg font-semibold mb-4">Progreso</h3>
          <div class="h-64">
            <Bar :data="progressData" :options="chartOptions" />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
```
