<template>
  <!-- Modal de invitación emergente -->
  <ClassInvitationModal
    :show="showInvitationModal"
    :invitation="currentInvitation"
    :is-loading="isProcessing"
    :error="error"
    @close="handleCloseModal"
    @accept="handleAcceptInvitation"
    @reject="handleRejectInvitation"
    @remind-later="handleRemindLater"
  />

  <!-- Indicador de notificaciones en la esquina (opcional) -->
  <div v-if="hasNewInvitations && !showInvitationModal" class="fixed bottom-4 right-4 z-40">
    <button
      class="relative bg-blue-600 hover:bg-blue-700 text-white p-3 rounded-full shadow-lg transition-all duration-300 hover:scale-105"
      @click="showLatestInvitation"
    >
      <BellIcon class="w-6 h-6" />
      <!-- Badge de contador -->
      <span
        v-if="pendingInvitationsCount > 0"
        class="absolute -top-2 -right-2 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white transform translate-x-1/2 -translate-y-1/2 bg-red-600 rounded-full"
      >
        {{ pendingInvitationsCount }}
      </span>
    </button>
  </div>
</template>

<script setup lang="ts">
import {ref, computed, watch, nextTick} from "vue"
import {BellIcon} from "@heroicons/vue/24/outline"
import {useToast} from "../../../composables/useToast"
import {useTeacherNotifications} from "../composables/useTeacherNotifications"
import ClassInvitationModal from "./ClassInvitationModal.vue"
import type {TeacherNotification} from "../services/teacherNotifications"

// Composables
const toast = useToast()
const {
  pendingInvitations,
  pendingInvitationsCount,
  hasNewInvitations,
  getLatestInvitation,
  acceptInvitation,
  rejectInvitation,
  error: notificationError,
} = useTeacherNotifications()

// Estado del modal
const showInvitationModal = ref(false)
const currentInvitation = ref<TeacherNotification | null>(null)
const isProcessing = ref(false)
const error = ref<string | null>(null)

// Computed
const lastShownInvitationId = ref<string | null>(null)
const shownInvitationIds = ref<Set<string>>(new Set())

// Observar nuevas invitaciones
watch(
  () => pendingInvitations.value,
  (newInvitations) => {
    console.log("Invitaciones pendientes actualizadas:", newInvitations.length)

    // Buscar invitaciones que no se han mostrado antes
    const newUnshownInvitations = newInvitations.filter(
      (invitation) => invitation.id && !shownInvitationIds.value.has(invitation.id)
    )

    // Si hay invitaciones nuevas sin mostrar y no hay modal abierto
    if (newUnshownInvitations.length > 0 && !showInvitationModal.value) {
      const latestInvitation = newUnshownInvitations[0]
      console.log("Nueva invitación detectada:", latestInvitation.id)
      showSpecificInvitation(latestInvitation)
    }
  },
  {deep: true, immediate: true}
)

// Métodos
const showLatestInvitation = () => {
  const latestInvitation = getLatestInvitation.value
  if (latestInvitation) {
    showSpecificInvitation(latestInvitation)
  }
}

const showSpecificInvitation = (invitation: TeacherNotification) => {
  currentInvitation.value = invitation
  lastShownInvitationId.value = invitation.id!

  // Marcar como mostrada
  if (invitation.id) {
    shownInvitationIds.value.add(invitation.id)
  }

  showInvitationModal.value = true
  error.value = null

  console.log("Mostrando modal de invitación para:", invitation.id)
}

const handleCloseModal = () => {
  console.log("Cerrando modal de invitación")
  showInvitationModal.value = false
  // Limpiar después de la animación
  nextTick(() => {
    currentInvitation.value = null
    error.value = null
  })
}

const handleAcceptInvitation = async (notificationId: string) => {
  isProcessing.value = true
  error.value = null

  try {
    const result = await acceptInvitation(notificationId)

    if (result.success) {
      toast.success("¡Invitación aceptada!", "Te has unido exitosamente a la clase compartida.")
      handleCloseModal()
    } else {
      error.value = result.error || "Error al aceptar la invitación"
    }
  } catch (err: any) {
    error.value = err.message || "Error inesperado al aceptar la invitación"
  } finally {
    isProcessing.value = false
  }
}

const handleRejectInvitation = async (notificationId: string) => {
  isProcessing.value = true
  error.value = null

  try {
    const result = await rejectInvitation(notificationId, "Rechazada desde modal")

    if (result.success) {
      toast.info("Invitación rechazada", "Has rechazado la invitación a la clase compartida.")
      handleCloseModal()
    } else {
      error.value = result.error || "Error al rechazar la invitación"
    }
  } catch (err: any) {
    error.value = err.message || "Error inesperado al rechazar la invitación"
  } finally {
    isProcessing.value = false
  }
}

const handleRemindLater = () => {
  toast.info("Recordatorio configurado", "Te recordaremos sobre esta invitación más tarde.")
  handleCloseModal()
}

// Observar errores del servicio de notificaciones
watch(
  () => notificationError.value,
  (newError) => {
    if (newError) {
      error.value = newError
    }
  }
)
</script>

<style scoped>
/* Estilos para animaciones si es necesario */
.notification-bounce {
  animation: bounce 1s infinite;
}

@keyframes bounce {
  0%,
  20%,
  53%,
  80%,
  100% {
    animation-timing-function: cubic-bezier(0.215, 0.61, 0.355, 1);
    transform: translate3d(0, 0, 0);
  }
  40%,
  43% {
    animation-timing-function: cubic-bezier(0.755, 0.05, 0.855, 0.06);
    transform: translate3d(0, -8px, 0);
  }
  70% {
    animation-timing-function: cubic-bezier(0.755, 0.05, 0.855, 0.06);
    transform: translate3d(0, -4px, 0);
  }
  90% {
    transform: translate3d(0, -2px, 0);
  }
}
</style>
