<script setup lang="ts">
import {CheckCircleIcon, XCircleIcon, ClockIcon} from "@heroicons/vue/24/outline"

const props = defineProps<{
  isDisabled: boolean
}>()

const emit = defineEmits<{
  (e: "mark-all-present"): void
  (e: "mark-all-absent"): void
  (e: "mark-all-late"): void
  (e: "reset-all"): void
}>()
</script>

<template>
  <thead class="bg-gray-50 dark:bg-gray-800">
    <tr>
      <th
        class="px-1 sm:px-4 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider w-1/2 sm:w-auto"
      >
        Estudiante
      </th>
      <th
        class="px-1 sm:px-4 py-2 sm:py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider w-1/4 sm:w-auto"
      >
        <div class="flex justify-end gap-1 sm:gap-2">
          <span class="hidden sm:inline mr-2 mt-1">Marcar Todos:</span>
          <button
            class="btn btn-icon btn-xs sm:btn-sm p-1 sm:p-1.5 btn-success"
            :disabled="props.isDisabled"
            title="Marcar todos como presentes"
            @click="emit('mark-all-present')"
          >
            <CheckCircleIcon class="w-3 h-3 sm:w-4 sm:h-4" />
          </button>
          <button
            class="btn btn-icon btn-xs sm:btn-sm p-1 sm:p-1.5 btn-danger"
            :disabled="props.isDisabled"
            title="Marcar todos como ausentes"
            @click="emit('mark-all-absent')"
          >
            <XCircleIcon class="w-3 h-3 sm:w-4 sm:h-4" />
          </button>
          <button
            class="btn btn-icon btn-xs sm:btn-sm p-1 sm:p-1.5 btn-warning"
            :disabled="props.isDisabled"
            title="Marcar todos con tardanza"
            @click="emit('mark-all-late')"
          >
            <ClockIcon class="w-3 h-3 sm:w-4 sm:h-4" />
          </button>
          <button
            class="btn btn-icon btn-xs sm:btn-sm p-1 sm:p-1.5 btn-outline"
            :disabled="props.isDisabled"
            title="Reestablecer todos los estados"
            @click="emit('reset-all')"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              class="w-3 h-3 sm:w-4 sm:h-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
          </button>
        </div>
      </th>
    </tr>
  </thead>
</template>
