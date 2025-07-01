<template>
  <div class="pending-approvals-list">
    <!-- Loading State -->
    <div v-if="loading" class="flex items-center justify-center py-8">
      <div class="animate-spin rounded-full h-6 w-6 border-2 border-gray-300 border-t-blue-600" />
    </div>

    <!-- Empty State -->
    <div
      v-else-if="!approvals || approvals.length === 0"
      class="flex flex-col items-center justify-center py-8 text-center"
    >
      <CheckCircleIcon class="w-12 h-12 text-green-300 dark:text-green-600 mb-3" />
      <p class="text-sm text-gray-500 dark:text-gray-400">No hay aprobaciones pendientes</p>
      <p class="text-xs text-gray-400 dark:text-gray-500 mt-1">¡Todo está al día!</p>
    </div>

    <!-- Approvals List -->
    <div v-else class="space-y-0">
      <div
        v-for="(approval, index) in approvals"
        :key="approval.id"
        class="approval-item group relative"
        :class="{'border-b border-gray-100 dark:border-gray-700': index < approvals.length - 1}"
      >
        <div
          class="p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors duration-200 rounded-lg"
        >
          <!-- Approval Header -->
          <div class="flex items-start justify-between mb-3">
            <div class="flex items-start space-x-3 flex-1">
              <!-- Priority Indicator -->
              <div class="flex-shrink-0 mt-1">
                <div class="w-3 h-3 rounded-full" :class="getPriorityColor(approval.priority)" />
              </div>

              <!-- Content -->
              <div class="flex-1 min-w-0">
                <div class="flex items-center space-x-2 mb-1">
                  <h4 class="text-sm font-medium text-gray-900 dark:text-white truncate">
                    {{ approval.title }}
                  </h4>
                  <span
                    class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium"
                    :class="getTypeClasses(approval.type)"
                  >
                    {{ getTypeLabel(approval.type) }}
                  </span>
                </div>

                <p class="text-sm text-gray-600 dark:text-gray-400 mb-2">
                  {{ approval.description }}
                </p>

                <!-- Request Info -->
                <div class="flex items-center space-x-4 text-xs text-gray-500 dark:text-gray-400">
                  <div class="flex items-center space-x-1">
                    <UserIcon class="w-3 h-3" />
                    <span>{{ approval.requestedBy }}</span>
                  </div>
                  <div class="flex items-center space-x-1">
                    <ClockIcon class="w-3 h-3" />
                    <span>{{ formatTimeAgo(approval.requestedAt) }}</span>
                  </div>
                </div>
              </div>
            </div>

            <!-- Priority Badge -->
            <div class="flex-shrink-0 ml-2">
              <span
                class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium"
                :class="getPriorityBadgeClasses(approval.priority)"
              >
                {{ getPriorityLabel(approval.priority) }}
              </span>
            </div>
          </div>

          <!-- Additional Data Preview -->
          <div
            v-if="approval.data && showPreview"
            class="mb-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
          >
            <div class="text-xs text-gray-600 dark:text-gray-400">
              <div
                v-for="(value, key) in getPreviewData(approval.data)"
                :key="key"
                class="flex justify-between py-1"
              >
                <span class="font-medium">{{ formatKey(key) }}:</span>
                <span>{{ value }}</span>
              </div>
            </div>
          </div>

          <!-- Action Buttons -->
          <div class="flex items-center justify-between">
            <div class="flex space-x-2">
              <button
                class="inline-flex items-center px-3 py-1.5 border border-transparent text-xs leading-4 font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors duration-200"
                :disabled="processing === approval.id"
                @click="handleApprove(approval)"
              >
                <CheckIcon class="w-3 h-3 mr-1" />
                Aprobar
              </button>

              <button
                class="inline-flex items-center px-3 py-1.5 border border-gray-300 dark:border-gray-600 text-xs leading-4 font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200"
                :disabled="processing === approval.id"
                @click="handleReject(approval)"
              >
                <XMarkIcon class="w-3 h-3 mr-1" />
                Rechazar
              </button>
            </div>

            <!-- Quick Actions -->
            <div class="flex items-center space-x-1">
              <button
                class="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded transition-colors duration-200"
                :title="showPreview ? 'Ocultar detalles' : 'Ver detalles'"
                @click="togglePreview(approval.id)"
              >
                <EyeIcon v-if="!showPreview" class="w-4 h-4" />
                <EyeSlashIcon v-else class="w-4 h-4" />
              </button>

              <button
                class="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded transition-colors duration-200"
                title="Ver detalles completos"
                @click="viewFullDetails(approval)"
              >
                <ArrowTopRightOnSquareIcon class="w-4 h-4" />
              </button>
            </div>
          </div>

          <!-- Processing Overlay -->
          <div
            v-if="processing === approval.id"
            class="absolute inset-0 bg-white dark:bg-gray-800 bg-opacity-80 flex items-center justify-center rounded-lg"
          >
            <div class="flex items-center space-x-2">
              <div
                class="animate-spin rounded-full h-4 w-4 border-2 border-blue-600 border-t-transparent"
              />
              <span class="text-sm text-gray-600 dark:text-gray-400">Procesando...</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Load More -->
    <div v-if="hasMore" class="pt-4 border-t border-gray-100 dark:border-gray-700">
      <button
        class="w-full text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 font-medium py-2 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors duration-200"
        :disabled="loadingMore"
        @click="$emit('loadMore')"
      >
        <span v-if="loadingMore" class="flex items-center justify-center space-x-2">
          <div
            class="animate-spin rounded-full h-4 w-4 border-2 border-blue-600 border-t-transparent"
          />
          <span>Cargando...</span>
        </span>
        <span v-else>Ver más aprobaciones</span>
      </button>
    </div>

    <!-- Confirmation Modal -->
    <ApprovalActionModal
      v-if="showModal"
      :approval="selectedApproval"
      :action="selectedAction"
      @confirm="confirmAction"
      @cancel="cancelAction"
    />
  </div>
</template>

<script setup lang="ts">
import {ref, computed} from "vue"
import {
  CheckCircleIcon,
  UserIcon,
  ClockIcon,
  CheckIcon,
  XMarkIcon,
  EyeIcon,
  EyeSlashIcon,
  ArrowTopRightOnSquareIcon,
} from "@heroicons/vue/24/outline"
import ApprovalActionModal from "./ApprovalActionModal.vue"

interface PendingApproval {
  id: string
  type:
    | "teacher_registration"
    | "schedule_change"
    | "class_creation"
    | "student_enrollment"
    | "resource_request"
  title: string
  description: string
  requestedBy: string
  requestedAt: Date
  priority: "low" | "medium" | "high"
  data: any
}

interface Props {
  approvals: PendingApproval[]
  loading?: boolean
  hasMore?: boolean
  loadingMore?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  loading: false,
  hasMore: false,
  loadingMore: false,
})

const emit = defineEmits<{
  approve: [approval: PendingApproval]
  reject: [approval: PendingApproval, reason?: string]
  loadMore: []
  viewDetails: [approval: PendingApproval]
}>()

// State
const processing = ref<string | null>(null)
const showPreview = ref(false)
const showModal = ref(false)
const selectedApproval = ref<PendingApproval | null>(null)
const selectedAction = ref<"approve" | "reject" | null>(null)

// Methods
const getPriorityColor = (priority: string) => {
  const colorMap = {
    low: "bg-green-400",
    medium: "bg-yellow-400",
    high: "bg-red-400",
  }
  return colorMap[priority as keyof typeof colorMap] || "bg-gray-400"
}

const getPriorityLabel = (priority: string) => {
  const labelMap = {
    low: "Baja",
    medium: "Media",
    high: "Alta",
  }
  return labelMap[priority as keyof typeof labelMap] || "Normal"
}

const getPriorityBadgeClasses = (priority: string) => {
  const classMap = {
    low: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
    medium: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300",
    high: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
  }
  return (
    classMap[priority as keyof typeof classMap] ||
    "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300"
  )
}

const getTypeLabel = (type: string) => {
  const labelMap = {
    teacher_registration: "Registro Maestro",
    schedule_change: "Cambio Horario",
    class_creation: "Crear Clase",
    student_enrollment: "Inscripción",
    resource_request: "Recurso",
  }
  return labelMap[type as keyof typeof labelMap] || "General"
}

const getTypeClasses = (type: string) => {
  const classMap = {
    teacher_registration: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
    schedule_change: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300",
    class_creation: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
    student_enrollment: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300",
    resource_request: "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300",
  }
  return (
    classMap[type as keyof typeof classMap] ||
    "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300"
  )
}

const formatTimeAgo = (timestamp: Date): string => {
  const now = new Date()
  const diffInSeconds = Math.floor((now.getTime() - timestamp.getTime()) / 1000)

  if (diffInSeconds < 60) {
    return "Ahora"
  } else if (diffInSeconds < 3600) {
    const minutes = Math.floor(diffInSeconds / 60)
    return `${minutes}m`
  } else if (diffInSeconds < 86400) {
    const hours = Math.floor(diffInSeconds / 3600)
    return `${hours}h`
  } else {
    const days = Math.floor(diffInSeconds / 86400)
    return `${days}d`
  }
}

const getPreviewData = (data: any) => {
  if (!data || typeof data !== "object") return {}

  // Show only first 3 key-value pairs for preview
  const entries = Object.entries(data).slice(0, 3)
  return Object.fromEntries(entries)
}

const formatKey = (key: string): string => {
  return key.replace(/([A-Z])/g, " $1").replace(/^./, (str) => str.toUpperCase())
}

const togglePreview = (approvalId: string) => {
  showPreview.value = !showPreview.value
}

const viewFullDetails = (approval: PendingApproval) => {
  emit("viewDetails", approval)
}

const handleApprove = (approval: PendingApproval) => {
  selectedApproval.value = approval
  selectedAction.value = "approve"
  showModal.value = true
}

const handleReject = (approval: PendingApproval) => {
  selectedApproval.value = approval
  selectedAction.value = "reject"
  showModal.value = true
}

const confirmAction = async (reason?: string) => {
  if (!selectedApproval.value || !selectedAction.value) return

  processing.value = selectedApproval.value.id

  try {
    if (selectedAction.value === "approve") {
      emit("approve", selectedApproval.value)
    } else {
      emit("reject", selectedApproval.value, reason)
    }
  } finally {
    processing.value = null
    showModal.value = false
    selectedApproval.value = null
    selectedAction.value = null
  }
}

const cancelAction = () => {
  showModal.value = false
  selectedApproval.value = null
  selectedAction.value = null
}
</script>

<style scoped>
.pending-approvals-list {
  max-height: 500px;
  overflow-y: auto;
}

.approval-item {
  transition: all 0.2s ease;
}

.approval-item:hover {
  transform: translateX(1px);
}

/* Custom scrollbar */
.pending-approvals-list::-webkit-scrollbar {
  width: 4px;
}

.pending-approvals-list::-webkit-scrollbar-track {
  background: transparent;
}

.pending-approvals-list::-webkit-scrollbar-thumb {
  background: #d1d5db;
  border-radius: 2px;
}

.pending-approvals-list::-webkit-scrollbar-thumb:hover {
  background: #9ca3af;
}

.dark .pending-approvals-list::-webkit-scrollbar-thumb {
  background: #4b5563;
}

.dark .pending-approvals-list::-webkit-scrollbar-thumb:hover {
  background: #6b7280;
}
</style>
