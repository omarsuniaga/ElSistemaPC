<template>
  <div class="space-y-6">
    <div class="flex items-center justify-between mb-4">
      <h2 class="text-xl font-bold">Solicitudes de Clases Emergentes</h2>
      <div class="text-sm text-gray-500 dark:text-gray-400">
        {{ pendingRequests.length }} solicitudes pendientes
      </div>
    </div>

    <!-- Estado de carga -->
    <div v-if="isLoading" class="flex justify-center items-center py-8">
      <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
      <span class="ml-3 text-gray-600 dark:text-gray-400">Cargando solicitudes...</span>
    </div>

    <!-- Error -->
    <div
      v-else-if="error"
      class="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg text-red-700 dark:text-red-400"
    >
      {{ error }}
      <button class="text-sm underline ml-2" @click="loadEmergencyClasses">Reintentar</button>
    </div>

    <!-- Lista vacía -->
    <div v-else-if="pendingRequests.length === 0" class="text-center py-10">
      <div class="mb-4">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          class="h-12 w-12 mx-auto text-gray-400"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      </div>
      <h3 class="text-lg font-medium">No hay solicitudes pendientes</h3>
      <p class="text-gray-500 dark:text-gray-400 mt-1">Todas las solicitudes han sido procesadas</p>
    </div>

    <!-- Lista de solicitudes -->
    <div v-else class="space-y-4">
      <div
        v-for="request in pendingRequests"
        :key="request.id"
        class="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700 overflow-hidden"
      >
        <div class="p-4">
          <div class="flex items-center justify-between flex-wrap gap-2 mb-2">
            <h3 class="text-lg font-semibold">{{ request.className }}</h3>
            <span
              class="badge bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300"
            >
              Pendiente
            </span>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
            <div>
              <p class="text-sm text-gray-600 dark:text-gray-400">Solicitado por:</p>
              <p class="font-medium">{{ request.teacherName }}</p>
            </div>

            <div>
              <p class="text-sm text-gray-600 dark:text-gray-400">Fecha:</p>
              <p class="font-medium">{{ formatDate(request.date) }}</p>
            </div>
          </div>

          <div class="mb-4">
            <p class="text-sm text-gray-600 dark:text-gray-400">Razón:</p>
            <p class="italic border-l-2 border-gray-300 dark:border-gray-600 pl-3 py-1 mt-1">
              {{ request.reason }}
            </p>
          </div>

          <!-- Botones de acción -->
          <div class="flex flex-wrap gap-2 justify-end mt-4">
            <button
              :disabled="processingId === request.id"
              class="btn btn-danger flex items-center gap-1"
              @click="rejectRequest(request)"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                class="h-5 w-5"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fill-rule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                  clip-rule="evenodd"
                />
              </svg>
              Rechazar
            </button>

            <button
              :disabled="processingId === request.id"
              class="btn btn-success flex items-center gap-1"
              @click="approveRequest(request)"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                class="h-5 w-5"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fill-rule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clip-rule="evenodd"
                />
              </svg>
              Aprobar
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import {ref, onMounted, computed, watch} from "vue"
import {useEmergencyClassStore} from "../modulos/Attendance/store/emergencyClass"
import {useNotificationsStore} from "../stores/notifications"
import {format} from "date-fns"
import {es} from "date-fns/locale"

// Definir emisiones
const emit = defineEmits(["request-processed"])

// Referencias a los stores
const emergencyClassStore = useEmergencyClassStore()
const notificationsStore = useNotificationsStore()

// Variables reactivas
const isLoading = ref(false)
const error = ref("")
const processingId = ref<string | null>(null)

// Solicitudes pendientes
const pendingRequests = computed(() => {
  return emergencyClassStore.getPendingEmergencyClasses
})

// Formatear fecha
const formatDate = (dateString: string) => {
  try {
    const date = new Date(dateString)
    return format(date, "d 'de' MMMM, yyyy", {locale: es})
  } catch (error) {
    return dateString
  }
}

// Cargar solicitudes pendientes
const loadEmergencyClasses = async () => {
  isLoading.value = true
  error.value = ""

  try {
    await emergencyClassStore.fetchEmergencyClasses("Pendiente")
  } catch (err) {
    error.value = "Error al cargar las solicitudes de clases emergentes"
    console.error("Error loading emergency class requests:", err)
  } finally {
    isLoading.value = false
  }
}

// Aprobar solicitud
const approveRequest = async (request) => {
  processingId.value = request.id

  try {
    await emergencyClassStore.updateEmergencyClassStatus(request.id, "Aceptada")
    notificationsStore.showNotification({
      title: "Solicitud aprobada",
      message: `La clase emergente ${request.className} ha sido aprobada.`,
      type: "success",
    })

    // Emitir evento para actualizar contadores en componente padre
    emit("request-processed")
  } catch (error) {
    console.error("Error al aprobar la solicitud:", error)
    notificationsStore.showNotification({
      title: "Error",
      message: "No se pudo aprobar la solicitud. Inténtalo de nuevo.",
      type: "error",
    })
  } finally {
    processingId.value = null
  }
}

// Rechazar solicitud
const rejectRequest = async (request) => {
  processingId.value = request.id

  try {
    await emergencyClassStore.updateEmergencyClassStatus(request.id, "Rechazada")
    notificationsStore.showNotification({
      title: "Solicitud rechazada",
      message: `La clase emergente ${request.className} ha sido rechazada.`,
      type: "info",
    })

    // Emitir evento para actualizar contadores en componente padre
    emit("request-processed")
  } catch (error) {
    console.error("Error al rechazar la solicitud:", error)
    notificationsStore.showNotification({
      title: "Error",
      message: "No se pudo rechazar la solicitud. Inténtalo de nuevo.",
      type: "error",
    })
  } finally {
    processingId.value = null
  }
}

// Cargar datos al montar el componente
onMounted(() => {
  loadEmergencyClasses()
})
</script>

<style scoped>
.badge {
  @apply inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium;
}

.btn {
  @apply px-3 py-1.5 rounded-md text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2;
}

.btn-danger {
  @apply bg-red-100 text-red-700 hover:bg-red-200 focus:ring-red-500 dark:bg-red-900/20 dark:text-red-400 dark:hover:bg-red-900/40;
}

.btn-success {
  @apply bg-green-100 text-green-700 hover:bg-green-200 focus:ring-green-500 dark:bg-green-900/20 dark:text-green-400 dark:hover:bg-green-900/40;
}
</style>
