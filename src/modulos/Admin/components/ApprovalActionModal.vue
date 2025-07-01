<template>
  <div
    class="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50"
    @click="$emit('close')"
  >
    <div
      class="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white dark:bg-gray-800"
      @click.stop
    >
      <!-- Header -->
      <div class="mb-4">
        <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
          {{ action === "approve" ? "Aprobar Solicitud" : "Rechazar Solicitud" }}
        </h3>
        <p class="text-sm text-gray-600 dark:text-gray-400 mt-1">
          {{ approval?.title }}
        </p>
      </div>

      <!-- Content -->
      <div class="mb-6">
        <div v-if="action === 'approve'" class="text-center py-4">
          <CheckCircleIcon class="w-16 h-16 text-green-500 mx-auto mb-4" />
          <p class="text-gray-700 dark:text-gray-300">
            ¿Estás seguro de que deseas aprobar esta solicitud?
          </p>
        </div>

        <div v-else class="space-y-4">
          <div class="text-center py-4">
            <XCircleIcon class="w-16 h-16 text-red-500 mx-auto mb-4" />
            <p class="text-gray-700 dark:text-gray-300 mb-4">
              ¿Estás seguro de que deseas rechazar esta solicitud?
            </p>
          </div>

          <!-- Reason Input -->
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Motivo del rechazo (opcional)
            </label>
            <textarea
              v-model="rejectionReason"
              rows="3"
              class="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              placeholder="Explica por qué se rechaza esta solicitud..."
            />
          </div>
        </div>
      </div>

      <!-- Actions -->
      <div class="flex justify-end space-x-3">
        <button
          class="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors duration-200"
          @click="$emit('cancel')"
        >
          Cancelar
        </button>

        <button
          class="px-4 py-2 text-sm font-medium text-white rounded-md transition-colors duration-200"
          :class="
            action === 'approve' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'
          "
          @click="handleConfirm"
        >
          {{ action === "approve" ? "Aprobar" : "Rechazar" }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import {ref} from "vue"
import {CheckCircleIcon, XCircleIcon} from "@heroicons/vue/24/outline"

interface PendingApproval {
  id: string
  type: string
  title: string
  description: string
  requestedBy: string
  requestedAt: Date
  priority: string
  data: any
}

interface Props {
  approval: PendingApproval | null
  action: "approve" | "reject" | null
}

defineProps<Props>()

const emit = defineEmits<{
  confirm: [reason?: string]
  cancel: []
  close: []
}>()

const rejectionReason = ref("")

const handleConfirm = () => {
  emit("confirm", rejectionReason.value || undefined)
}
</script>
