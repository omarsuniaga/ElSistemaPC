<template>
  <TransitionRoot appear :show="show" as="template">
    <Dialog as="div" class="relative z-50" @close="handleClose">
      <TransitionChild
        as="template"
        enter="duration-300 ease-out"
        enter-from="opacity-0"
        enter-to="opacity-100"
        leave="duration-200 ease-in"
        leave-from="opacity-100"
        leave-to="opacity-0"
      >
        <div class="fixed inset-0 bg-black/50 backdrop-blur-sm" />
      </TransitionChild>

      <div class="fixed inset-0 overflow-y-auto">
        <div class="flex min-h-full items-center justify-center p-4 text-center">
          <TransitionChild
            as="template"
            enter="duration-300 ease-out"
            enter-from="opacity-0 scale-95"
            enter-to="opacity-100 scale-100"
            leave="duration-200 ease-in"
            leave-from="opacity-100 scale-100"
            leave-to="opacity-0 scale-95"
          >
            <DialogPanel
              class="w-full max-w-md transform overflow-hidden rounded-2xl bg-white dark:bg-gray-800 p-6 text-left align-middle shadow-xl transition-all"
            >
              <!-- Header con icono de invitación -->
              <div class="flex items-center mb-6">
                <div class="flex-shrink-0">
                  <div
                    class="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center"
                  >
                    <UserPlusIcon class="w-6 h-6 text-blue-600 dark:text-blue-400" />
                  </div>
                </div>
                <div class="ml-4">
                  <DialogTitle
                    as="h3"
                    class="text-lg font-semibold leading-6 text-gray-900 dark:text-white"
                  >
                    Invitación a Clase Compartida
                  </DialogTitle>
                  <p class="text-sm text-gray-500 dark:text-gray-400">
                    {{ invitation?.fromUserName }} te ha invitado a colaborar
                  </p>
                </div>
              </div>

              <!-- Contenido de la invitación -->
              <div class="mb-6">
                <div class="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 space-y-3">
                  <div class="flex justify-between">
                    <span class="text-sm font-medium text-gray-700 dark:text-gray-300">Clase:</span>
                    <span class="text-sm text-gray-900 dark:text-white font-semibold">{{
                      invitation?.className
                    }}</span>
                  </div>

                  <div class="flex justify-between">
                    <span class="text-sm font-medium text-gray-700 dark:text-gray-300"
                      >Invitado por:</span
                    >
                    <span class="text-sm text-gray-900 dark:text-white">{{
                      invitation?.fromUserName
                    }}</span>
                  </div>

                  <div class="border-t border-gray-200 dark:border-gray-600 pt-3">
                    <span class="text-sm font-medium text-gray-700 dark:text-gray-300 block mb-2"
                      >Permisos otorgados:</span
                    >
                    <div class="space-y-1">
                      <div class="flex items-center text-sm text-gray-600 dark:text-gray-400">
                        <CheckIcon
                          v-if="invitation?.permissions?.canTakeAttendance"
                          class="w-4 h-4 text-green-500 mr-2"
                        />
                        <XMarkIcon v-else class="w-4 h-4 text-red-500 mr-2" />
                        Tomar asistencia
                      </div>
                      <div class="flex items-center text-sm text-gray-600 dark:text-gray-400">
                        <CheckIcon
                          v-if="invitation?.permissions?.canAddObservations"
                          class="w-4 h-4 text-green-500 mr-2"
                        />
                        <XMarkIcon v-else class="w-4 h-4 text-red-500 mr-2" />
                        Agregar observaciones
                      </div>
                      <div class="flex items-center text-sm text-gray-600 dark:text-gray-400">
                        <CheckIcon
                          v-if="invitation?.permissions?.canViewAttendanceHistory"
                          class="w-4 h-4 text-green-500 mr-2"
                        />
                        <XMarkIcon v-else class="w-4 h-4 text-red-500 mr-2" />
                        Ver historial de asistencia
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Fecha de expiración -->
              <div v-if="invitation?.expiresAt" class="mb-6 text-center">
                <p class="text-xs text-gray-500 dark:text-gray-400">
                  Esta invitación expira el {{ formatExpirationDate(invitation.expiresAt) }}
                </p>
              </div>

              <!-- Mensaje de error -->
              <div
                v-if="error"
                class="mb-4 p-3 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-700 rounded-lg"
              >
                <p class="text-sm text-red-600 dark:text-red-400">{{ error }}</p>
              </div>

              <!-- Botones de acción -->
              <div class="flex items-center justify-end space-x-3">
                <button
                  ref="rejectButton"
                  type="button"
                  tabindex="0"
                  :disabled="isLoading"
                  class="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  @click="handleReject"
                >
                  Rechazar
                </button>
                <button
                  ref="acceptButton"
                  type="button"
                  tabindex="0"
                  :disabled="isLoading"
                  class="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center"
                  @click="handleAccept"
                >
                  <span v-if="isLoading" class="mr-2">
                    <svg
                      class="animate-spin h-4 w-4"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        class="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        stroke-width="4"
                      />
                      <path
                        class="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      />
                    </svg>
                  </span>
                  {{ isLoading ? "Procesando..." : "Aceptar" }}
                </button>
              </div>

              <!-- Opción para "Recordar más tarde" -->
              <div class="mt-4 text-center">
                <button
                  :disabled="isLoading"
                  class="text-xs text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 underline disabled:opacity-50"
                  @click="handleRemindLater"
                >
                  Recordar más tarde
                </button>
              </div>
            </DialogPanel>
          </TransitionChild>
        </div>
      </div>
    </Dialog>
  </TransitionRoot>
</template>

<script setup lang="ts">
import {ref, computed} from "vue"
import {format} from "date-fns"
import {es} from "date-fns/locale"
import {Dialog, DialogPanel, DialogTitle, TransitionChild, TransitionRoot} from "@headlessui/vue"
import {UserPlusIcon, CheckIcon, XMarkIcon} from "@heroicons/vue/24/outline"

import type {TeacherNotification} from "../services/teacherNotifications"

interface Props {
  show: boolean
  invitation: TeacherNotification | null
  isLoading?: boolean
  error?: string | null
}

interface Emits {
  (e: "close"): void
  (e: "accept", notificationId: string): void
  (e: "reject", notificationId: string): void
  (e: "remind-later"): void
}

const props = withDefaults(defineProps<Props>(), {
  isLoading: false,
  error: null,
})

const emit = defineEmits<Emits>()

// Formatear fecha de expiración
const formatExpirationDate = (date: Date | string) => {
  const expDate = typeof date === "string" ? new Date(date) : date
  return format(expDate, "d 'de' MMMM 'de' yyyy 'a las' HH:mm", {locale: es})
}

// Manejadores de eventos
const handleClose = () => {
  if (!props.isLoading) {
    emit("close")
  }
}

const handleAccept = () => {
  if (props.invitation?.id) {
    emit("accept", props.invitation.id)
  }
}

const handleReject = () => {
  if (props.invitation?.id) {
    emit("reject", props.invitation.id)
  }
}

const handleRemindLater = () => {
  emit("remind-later")
  emit("close")
}
</script>

<style scoped>
/* Animaciones personalizadas si es necesario */
.notification-fade-enter-active,
.notification-fade-leave-active {
  transition: all 0.3s ease;
}

.notification-fade-enter-from,
.notification-fade-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}
</style>
