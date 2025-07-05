<template>
  <div class="p-6">
    <div class="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
      <div class="flex justify-between items-center mb-6">
        <div>
          <h1 class="text-2xl font-bold text-gray-900 dark:text-white">
            📱 Gestión de Notificaciones WhatsApp
          </h1>
          <p class="text-gray-600 dark:text-gray-400 mt-2">
            Sistema completo para enviar mensajes automáticos según el tipo de situación:
            ausencias, tardanzas y justificaciones
          </p>
        </div>
        <button
          class="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
          @click="openModal"
        >
          <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-3.582 8-8 8a8.003 8.003 0 01-7.93-6.94c-.42-.7-.7-1.5-.7-2.36C4.37 7.82 7.82 4.37 10.64 4.37c.86 0 1.66.28 2.36.7A8.003 8.003 0 0121 12z"
            />
          </svg>
          Gestionar Notificaciones
        </button>
      </div>

      <!-- Estadísticas rápidas -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div class="bg-gradient-to-r from-red-400 to-red-600 p-6 rounded-lg text-white">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-red-100">Ausencias</p>
              <p class="text-2xl font-bold">{{ stats.ausentes || 0 }}</p>
              <p class="text-sm text-red-100">Sin justificar</p>
            </div>
            <div class="text-3xl opacity-80">❌</div>
          </div>
        </div>

        <div class="bg-gradient-to-r from-yellow-400 to-yellow-600 p-6 rounded-lg text-white">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-yellow-100">Tardanzas</p>
              <p class="text-2xl font-bold">{{ stats.tarde || 0 }}</p>
              <p class="text-sm text-yellow-100">Llegadas tardías</p>
            </div>
            <div class="text-3xl opacity-80">⏰</div>
          </div>
        </div>

        <div class="bg-gradient-to-r from-blue-400 to-blue-600 p-6 rounded-lg text-white">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-blue-100">Justificadas</p>
              <p class="text-2xl font-bold">{{ stats.justificado || 0 }}</p>
              <p class="text-sm text-blue-100">Con justificación</p>
            </div>
            <div class="text-3xl opacity-80">📝</div>
          </div>
        </div>
      </div>

      <!-- Historial reciente -->
      <div class="bg-gray-50 dark:bg-gray-700 rounded-lg p-6">
        <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-4">
          📋 Historial de Mensajes Recientes
        </h3>
        
        <div
          v-if="recentMessages.length === 0"
          class="text-center py-8 text-gray-500 dark:text-gray-400"
        >
          <svg class="mx-auto h-12 w-12 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2M4 13h2m13-8V4a1 1 0 00-1-1H7a1 1 0 00-1 1v1m8 0V4.5"
            />
          </svg>
          <p>No hay mensajes enviados recientemente</p>
          <p class="text-sm mt-1">Los mensajes aparecerán aquí después de enviarlos</p>
        </div>

        <div v-else class="space-y-3">
          <div
            v-for="message in recentMessages.slice(0, 5)"
            :key="message.id"
            class="flex items-center justify-between p-4 bg-white dark:bg-gray-600 rounded-lg"
          >
            <div class="flex items-center space-x-3">
              <div class="flex-shrink-0">
                <div
                  class="w-3 h-3 rounded-full"
                  :class="message.success ? 'bg-green-500' : 'bg-red-500'"
                />
              </div>
              <div>
                <p class="text-sm font-medium text-gray-900 dark:text-white">
                  {{ message.studentName }}
                </p>
                <p class="text-xs text-gray-500 dark:text-gray-400">
                  {{ message.type }} • {{ formatDate(message.timestamp) }}
                </p>
              </div>
            </div>
            <div class="text-right">
              <p class="text-sm text-gray-600 dark:text-gray-300">
                {{ message.sentTo }}
              </p>
            </div>
          </div>
        </div>
      </div>

      <!-- Instrucciones -->
      <div
        class="mt-8 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6"
      >
        <h4 class="text-lg font-medium text-blue-900 dark:text-blue-300 mb-3">
          💡 Cómo funciona el sistema de notificaciones inteligentes
        </h4>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-blue-800 dark:text-blue-300">
          <div>
            <p class="font-medium mb-2">❌ Ausencias sin justificar:</p>
            <p>Sistema de escalación automática con 4 niveles según historial semanal</p>
          </div>
          <div>
            <p class="font-medium mb-2">⏰ Tardanzas:</p>
            <p>Mensajes recordando la importancia de la puntualidad</p>
          </div>
          <div>
            <p class="font-medium mb-2">📝 Ausencias justificadas:</p>
            <p>Información sobre recuperación y próximas actividades</p>
          </div>
        </div>
        <div class="mt-4 p-4 bg-white dark:bg-gray-800 rounded border">
          <p class="text-sm font-medium text-gray-900 dark:text-white mb-2">
            🎯 Selección inteligente de destinatarios:
          </p>
          <ul class="text-sm text-gray-600 dark:text-gray-400 space-y-1">
            <li>• Verifica números de teléfono disponibles (madre/padre)</li>
            <li>• Permite selección manual de destinatarios</li>
            <li>• Usa plantillas específicas según el tipo de situación</li>
            <li>• Personaliza mensajes con variables dinámicas</li>
          </ul>
        </div>
      </div>
    </div>

    <!-- Modal de gestión de notificaciones -->
    <WhatsAppNotificacionesModal
      :is-visible="isModalVisible"
      @close="closeModal"
      @messages-sent="handleMessagesSent"
    />
  </div>
</template>

<script setup lang="ts">
import {ref, onMounted} from "vue"
import WhatsAppNotificacionesModal from "@/components/WhatsAppNotificacionesModal.vue"
import {useWhatsAppNotificacionesModal} from "@/composables/useWhatsAppNotificacionesModal"
import {getMessageStatistics} from "@/services/attendanceNotifications"

// Composable para el modal
const {
  isModalVisible,
  openModal,
  closeModal,
  handleMessagesSent: baseHandleMessagesSent,
} = useWhatsAppNotificacionesModal()

// State
const stats = ref({
  ausentes: 0,
  tarde: 0,
  justificado: 0,
})

const recentMessages = ref<any[]>([])

// Methods
const loadStats = async () => {
  try {
    // Cargar estadísticas de la semana actual
    const endDate = new Date()
    const startDate = new Date()
    startDate.setDate(endDate.getDate() - 7)

    const messageStats = await getMessageStatistics(
      startDate.toISOString().split("T")[0],
      endDate.toISOString().split("T")[0]
    )

    // Procesar estadísticas por tipo
    messageStats.forEach((stat) => {
      if (stat.type.includes("ausente")) stats.value.ausentes = stat.count
      if (stat.type.includes("tarde")) stats.value.tarde = stat.count
      if (stat.type.includes("justificado")) stats.value.justificado = stat.count
    })
  } catch (error) {
    console.error("Error loading stats:", error)
  }
}

const formatDate = (date: Date | string) => {
  const d = new Date(date)
  return d.toLocaleDateString("es-ES", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  })
}

const handleMessagesSent = (result: {
  success: number
  failed: number
  messages: any[]
}) => {
  // Llamar al handler base del composable
  baseHandleMessagesSent(result)

  // Agregar mensajes al historial local
  const newMessages = result.messages.map((msg) => ({
    id: Date.now() + Math.random(),
    studentName: msg.studentName || "Estudiante",
    type: msg.type || "Notificación",
    sentTo: msg.recipient || "Destinatario",
    success: msg.success || false,
    timestamp: new Date(),
  }))

  recentMessages.value.unshift(...newMessages.slice(0, 5))

  // Recargar estadísticas
  loadStats()
}

// Lifecycle
onMounted(() => {
  loadStats()
})
</script>

<style scoped>
/* Estilos específicos del demo si es necesario */
</style>
