<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useAttendanceStore } from '../store/attendance'
import AbsenteesList from '../../../components/AbsenteesList.vue'

const attendanceStore = useAttendanceStore()

const isLoading = ref(true)
const error = ref('')

const analytics = computed(() => attendanceStore.analytics)

const getAttendanceRateClass = (rate: number) => {
  if (rate >= 90) return 'text-green-600 dark:text-green-400'
  if (rate >= 75) return 'text-yellow-600 dark:text-yellow-400'
  return 'text-red-600 dark:text-red-400'
}

const updateAnalytics = async () => {
  try {
    isLoading.value = true
    await attendanceStore.updateAnalytics()
  } catch (err) {
    error.value = 'Error al cargar las estadísticas'
    console.error('Error updating analytics:', err)
  } finally {
    isLoading.value = false
  }
}

onMounted(updateAnalytics)

// Watch for changes in attendance records to update analytics
watch(() => attendanceStore.records.length, updateAnalytics)
</script>
<template>
  <div class="space-y-6">
    <!-- Loading State -->
    <div v-if="isLoading" class="flex justify-center items-center py-12">
      <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 p-4 rounded-lg">
      {{ error }}
    </div>

    <div v-else>
      <!-- Overall Statistics -->
      <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div class="card">
          <h3 class="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
            Total Clases
          </h3>
          <p class="text-2xl font-bold">{{ analytics?.totalClasses || 0 }}</p>
        </div>

        <div class="card">
          <h3 class="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
            Total Alumnos
          </h3>
          <p class="text-2xl font-bold">{{ analytics?.totalStudents || 0 }}</p>
        </div>

        <div class="card">
          <h3 class="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
            Asistencia Promedio
          </h3>
          <p class="text-2xl font-bold" :class="getAttendanceRateClass(analytics?.averageAttendance || 0)">
            {{ Math.round(analytics?.averageAttendance || 0) }}%
          </p>
        </div>

        <div class="card">
          <h3 class="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
            Alumnos en Riesgo
          </h3>
          <p class="text-2xl font-bold text-red-600">
            {{ analytics?.absentStudents.filter(s => s.attendanceRate < 75).length || 0 }}
          </p>
        </div>
      </div>

      <!-- Attendance by Class -->
      <div class="card">
        <h3 class="text-lg font-semibold mb-4">Asistencia por Clase</h3>
        <div class="space-y-1">
          <div
            v-for="(stats, className) in analytics?.byClass"
            :key="className"
            class="p-4 border dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
          >
            <div class="flex justify-between items-start mb-2">
              <div>
                <h4 class="font-medium">{{ className }}</h4>
                <p class="text-sm text-gray-600 dark:text-gray-400">
                  Total: {{ stats.total }} registros
                </p>
              </div>
              <div class="text-right">
                <p class="text-2xl font-bold" :class="getAttendanceRateClass((stats.present + stats.justified) / stats.total * 100)">
                  {{ Math.round((stats.present + stats.justified) / stats.total * 100) }}%
                </p>
                <p class="text-sm text-gray-600 dark:text-gray-400">
                  asistencia
                </p>
              </div>
            </div>

            <div class="space-y-2">
              <!-- Progress Bars -->
              <div class="flex gap-2 items-center">
                <div class="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
                  <div
                    class="h-full bg-green-500"
                    :style="{ width: `${(stats.present / stats.total) * 100}%` }"
                  ></div>
                </div>
                <span class="text-sm text-gray-600 dark:text-gray-400 min-w-[80px] text-right">
                  {{ stats.present }} presentes
                </span>
              </div>

              <div class="flex gap-2 items-center">
                <div class="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
                  <div
                    class="h-full bg-red-500"
                    :style="{ width: `${(stats.absent / stats.total) * 100}%` }"
                  ></div>
                </div>
                <span class="text-sm text-gray-600 dark:text-gray-400 min-w-[80px] text-right">
                  {{ stats.absent }} ausentes
                </span>
              </div>

              <div class="flex gap-2 items-center">
                <div class="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
                  <div
                    class="h-full bg-yellow-500"
                    :style="{ width: `${(stats.delayed / stats.total) * 100}%` }"
                  ></div>
                </div>
                <span class="text-sm text-gray-600 dark:text-gray-400 min-w-[80px] text-right">
                  {{ stats.delayed }} tardanzas
                </span>
              </div>

              <div class="flex gap-2 items-center">
                <div class="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
                  <div
                    class="h-full bg-blue-500"
                    :style="{ width: `${(stats.justified / stats.total) * 100}%` }"
                  ></div>
                </div>
                <span class="text-sm text-gray-600 dark:text-gray-400 min-w-[80px] text-right">
                  {{ stats.justified }} justificados
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Most Absent Students -->
      <div class="card">
        <h3 class="text-lg font-semibold mb-4">Estudiantes con Mayor Ausencia</h3>
        <AbsenteesList :limit="5" />
      </div>
    </div>
  </div>
</template>
