<template>
  <div class="bg-white dark:bg-gray-800 rounded-lg shadow p-4 sm:p-6">
    <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-4">
      Notificaciones Pendientes
    </h3>
    <div v-if="loading" class="space-y-4">
      <div class="h-12 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
      <div class="h-12 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
    </div>
    <div
      v-else-if="pending.absent.length === 0 && pending.late.length === 0"
      class="text-center py-4"
    >
      <p class="text-sm text-gray-500 dark:text-gray-400">No hay notificaciones pendientes.</p>
    </div>
    <div v-else class="space-y-3">
      <!-- Absent Notifications -->
      <div
        v-if="pending.absent.length > 0"
        class="bg-red-50 dark:bg-red-900/30 p-3 rounded-lg flex items-center justify-between"
      >
        <div>
          <div class="flex items-center">
            <p class="font-medium text-red-800 dark:text-red-200">
              {{ pending.absent.length }} Ausencias
            </p>
            <div class="relative group ml-2">
              <QuestionMarkCircleIcon
                class="h-4 w-4 text-gray-400 dark:text-gray-500 cursor-pointer"
              />
              <div
                class="absolute bottom-full mb-2 w-64 bg-gray-700 text-white text-xs rounded py-1 px-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none z-10"
              >
                Estudiantes ausentes hoy que aún no han sido notificados.
              </div>
            </div>
          </div>
          <p class="text-xs text-red-600 dark:text-red-400">Listos para notificar</p>
        </div>
        <button
          :disabled="notifying.absent"
          :class="{'opacity-50 cursor-not-allowed': notifying.absent}"
          class="px-3 py-1 bg-red-500 text-white text-sm rounded-md hover:bg-red-600 transition-colors"
          @click="handleNotify('absent')"
        >
          <span v-if="notifying.absent">Enviando...</span>
          <span v-else>Notificar</span>
        </button>
      </div>
      <!-- Late Notifications -->
      <div
        v-if="pending.late.length > 0"
        class="bg-yellow-50 dark:bg-yellow-900/30 p-3 rounded-lg flex items-center justify-between"
      >
        <div>
          <div class="flex items-center">
            <p class="font-medium text-yellow-800 dark:text-yellow-200">
              {{ pending.late.length }} Tardanzas
            </p>
            <div class="relative group ml-2">
              <QuestionMarkCircleIcon
                class="h-4 w-4 text-gray-400 dark:text-gray-500 cursor-pointer"
              />
              <div
                class="absolute bottom-full mb-2 w-64 bg-gray-700 text-white text-xs rounded py-1 px-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none z-10"
              >
                Estudiantes con tardanza hoy que aún no han sido notificados.
              </div>
            </div>
          </div>
          <p class="text-xs text-yellow-600 dark:text-yellow-400">Listos para notificar</p>
        </div>
        <button
          :disabled="notifying.late"
          :class="{'opacity-50 cursor-not-allowed': notifying.late}"
          class="px-3 py-1 bg-yellow-500 text-white text-sm rounded-md hover:bg-yellow-600 transition-colors"
          @click="handleNotify('late')"
        >
          <span v-if="notifying.late">Enviando...</span>
          <span v-else>Notificar</span>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import {ref, onMounted} from "vue"
import {db} from "../../../firebase"
import {collection, query, where, getDocs} from "firebase/firestore"
import {
  notifyUnexcusedAbsences,
  notifyLateStudents,
} from "../../../services/attendanceNotifications"
import {QuestionMarkCircleIcon} from "@heroicons/vue/24/solid"

defineOptions({name: "PendingNotifications"})

const loading = ref(true)
const notifying = ref({absent: false, late: false})
const pending = ref({
  absent: [] as string[],
  late: [] as string[],
})

const fetchPendingNotifications = async () => {
  loading.value = true
  try {
    const todayStr = new Date().toISOString().split("T")[0]
    const attendanceQuery = query(collection(db, "attendance"), where("date", "==", todayStr))
    const snapshot = await getDocs(attendanceQuery)

    const absentIds = new Set<string>()
    const lateIds = new Set<string>()

    snapshot.forEach((doc) => {
      const data = doc.data()
      ;(data.ausentes || []).forEach((id: string) => absentIds.add(id))
      ;(data.tardes || []).forEach((id: string) => lateIds.add(id))
    })

    // Here you would ideally cross-reference with notification_history
    // to see who has NOT been notified yet. For simplicity, we assume none have.
    pending.value.absent = Array.from(absentIds)
    pending.value.late = Array.from(lateIds)
  } catch (error) {
    console.error("Error fetching pending notifications:", error)
  } finally {
    loading.value = false
  }
}

const handleNotify = async (type: "absent" | "late") => {
  if (type === "absent") {
    notifying.value.absent = true
    await notifyUnexcusedAbsences(pending.value.absent)
    pending.value.absent = [] // Clear after notifying
    notifying.value.absent = false
  } else if (type === "late") {
    notifying.value.late = true
    await notifyLateStudents(pending.value.late)
    pending.value.late = [] // Clear after notifying
    notifying.value.late = false
  }
  // Optionally, add a toast notification for success
}

onMounted(() => {
  fetchPendingNotifications()
})
</script>
