<template>
  <div
    :class="[
      'notification-card',
      'bg-white dark:bg-gray-800 rounded-lg shadow-sm border transition-all duration-200',
      notification.status === 'unread'
        ? 'border-l-4 border-l-blue-500 border-gray-200 dark:border-gray-600'
        : 'border-gray-200 dark:border-gray-600',
      'hover:shadow-md hover:border-gray-300 dark:hover:border-gray-500',
    ]"
  >
    <div class="p-4">
      <!-- Header -->
      <div class="flex items-start justify-between mb-3">
        <div class="flex items-start space-x-3">
          <!-- Icono según el tipo -->
          <div
            :class="[
              'flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center',
              getNotificationStyles().background,
            ]"
          >
            <component
              :is="getNotificationIcon()"
              :class="['w-5 h-5', getNotificationStyles().icon]"
            />
          </div>

          <div class="flex-1 min-w-0">
            <!-- Título -->
            <h3
              :class="[
                'text-sm font-medium',
                notification.status === 'unread'
                  ? 'text-gray-900 dark:text-white'
                  : 'text-gray-700 dark:text-gray-300',
              ]"
            >
              {{ notification.title }}
            </h3>

            <!-- De quién viene -->
            <p
              v-if="notification.fromUserName"
              class="text-xs text-gray-500 dark:text-gray-400 mt-1"
            >
              De: {{ notification.fromUserName }}
            </p>
          </div>
        </div>

        <!-- Estado y fecha -->
        <div class="flex flex-col items-end text-xs text-gray-500 dark:text-gray-400">
          <span>{{ formatDate(notification.createdAt) }}</span>
          <span
            v-if="notification.status === 'unread'"
            class="mt-1 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200"
          >
            Sin leer
          </span>
        </div>
      </div>

      <!-- Mensaje -->
      <div class="mb-4">
        <p class="text-sm text-gray-700 dark:text-gray-300">
          {{ notification.message }}
        </p>

        <!-- Información específica para registro de estudiantes -->
        <div
          v-if="notification.type === 'student-registration' && notification.studentData"
          class="mt-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
        >
          <h4 class="text-sm font-medium text-gray-900 dark:text-white mb-2">
            Información del Estudiante:
          </h4>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
            <div>
              <span class="text-gray-600 dark:text-gray-400">Nombre:</span>
              <span class="ml-2 font-medium text-gray-900 dark:text-white">
                {{ notification.studentName }}
              </span>
            </div>
            <div v-if="notification.studentData.email">
              <span class="text-gray-600 dark:text-gray-400">Email:</span>
              <span class="ml-2 text-gray-900 dark:text-white">
                {{ notification.studentData.email }}
              </span>
            </div>
            <div v-if="notification.studentData.phone">
              <span class="text-gray-600 dark:text-gray-400">Teléfono:</span>
              <span class="ml-2 text-gray-900 dark:text-white">
                {{ notification.studentData.phone }}
              </span>
            </div>
            <div v-if="notification.studentData.instrument">
              <span class="text-gray-600 dark:text-gray-400">Instrumento:</span>
              <span class="ml-2 text-gray-900 dark:text-white">
                {{ notification.studentData.instrument }}
              </span>
            </div>
          </div>
        </div>
      </div>

      <!-- Acciones -->
      <div class="flex flex-wrap gap-2">
        <!-- Marcar como leído -->
        <button
          v-if="notification.status === 'unread'"
          class="inline-flex items-center px-3 py-1.5 border border-gray-300 dark:border-gray-600 shadow-sm text-xs font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          @click="$emit('mark-as-read', notification.id)"
        >
          <CheckIcon class="w-4 h-4 mr-1" />
          Marcar como leído
        </button>

        <!-- Asignar a clase (solo para registros de estudiantes) -->
        <button
          v-if="notification.type === 'student-registration' && notification.status === 'unread'"
          class="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
          @click="$emit('assign-to-class', notification)"
        >
          <PlusCircleIcon class="w-4 h-4 mr-1" />
          Asignar a Clase
        </button>

        <!-- Desestimar -->
        <button
          v-if="notification.status === 'unread'"
          class="inline-flex items-center px-3 py-1.5 border border-gray-300 dark:border-gray-600 shadow-sm text-xs font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
          @click="$emit('dismiss', notification.id)"
        >
          <XMarkIcon class="w-4 h-4 mr-1" />
          Omitir
        </button>

        <!-- Estado de acción tomada -->
        <div
          v-if="notification.status === 'action-taken'"
          class="inline-flex items-center px-3 py-1.5 rounded-md text-xs font-medium bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200"
        >
          <CheckCircleIcon class="w-4 h-4 mr-1" />
          Acción completada
        </div>

        <!-- Estado desestimado -->
        <div
          v-if="notification.status === 'dismissed'"
          class="inline-flex items-center px-3 py-1.5 rounded-md text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300"
        >
          <XCircleIcon class="w-4 h-4 mr-1" />
          Omitida
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import {computed} from "vue"
import {
  CheckIcon,
  XMarkIcon,
  PlusCircleIcon,
  CheckCircleIcon,
  XCircleIcon,
  UserPlusIcon,
  MegaphoneIcon,
  InformationCircleIcon,
  CogIcon,
} from "@heroicons/vue/24/outline"
import type {GeneralNotification} from "../services/generalNotifications"

// Props
interface Props {
  notification: GeneralNotification
}

const props = defineProps<Props>()

// Emits
defineEmits<{
  "mark-as-read": [notificationId: string]
  dismiss: [notificationId: string]
  "assign-to-class": [notification: GeneralNotification]
  "action-taken": [notificationId: string, actionDetails?: any]
}>()

// Computed
const getNotificationIcon = () => {
  switch (props.notification.type) {
    case "student-registration":
      return UserPlusIcon
    case "general-announcement":
      return MegaphoneIcon
    case "class-update":
      return InformationCircleIcon
    case "system-update":
      return CogIcon
    default:
      return InformationCircleIcon
  }
}

const getNotificationStyles = () => {
  switch (props.notification.type) {
    case "student-registration":
      return {
        background: "bg-green-100 dark:bg-green-900/30",
        icon: "text-green-600 dark:text-green-400",
      }
    case "general-announcement":
      return {
        background: "bg-blue-100 dark:bg-blue-900/30",
        icon: "text-blue-600 dark:text-blue-400",
      }
    case "class-update":
      return {
        background: "bg-yellow-100 dark:bg-yellow-900/30",
        icon: "text-yellow-600 dark:text-yellow-400",
      }
    case "system-update":
      return {
        background: "bg-purple-100 dark:bg-purple-900/30",
        icon: "text-purple-600 dark:text-purple-400",
      }
    default:
      return {
        background: "bg-gray-100 dark:bg-gray-700",
        icon: "text-gray-600 dark:text-gray-400",
      }
  }
}

const formatDate = (date: Date | any) => {
  if (!date) return ""

  const dateObj = date instanceof Date ? date : date.toDate ? date.toDate() : new Date(date)
  const now = new Date()
  const diffInHours = Math.abs(now.getTime() - dateObj.getTime()) / (1000 * 60 * 60)

  if (diffInHours < 1) {
    const minutes = Math.floor(diffInHours * 60)
    return `hace ${minutes} min`
  } else if (diffInHours < 24) {
    const hours = Math.floor(diffInHours)
    return `hace ${hours}h`
  } else if (diffInHours < 48) {
    return "ayer"
  } else {
    return dateObj.toLocaleDateString("es-ES", {
      day: "2-digit",
      month: "2-digit",
      year: "2-digit",
    })
  }
}
</script>

<style scoped>
.notification-card {
  transition: all 0.2s ease-in-out;
}

.notification-card:hover {
  transform: translateY(-2px);
}
</style>
