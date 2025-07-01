<script setup lang="ts">
import {ref, computed} from "vue"
import {PaperAirplaneIcon, PaperClipIcon, XMarkIcon} from "@heroicons/vue/24/outline"

interface Attachment {
  id: string
  name: string
  type: string
  size: string
  file: File
}

const message = ref("")
const attachments = ref<Attachment[]>([])
const isSubmitting = ref(false)

const emit = defineEmits(["send-activity"])

const canSubmit = computed(() => {
  return message.value.trim() !== "" || attachments.value.length > 0
})

const handleFileSelect = (event: Event) => {
  const fileInput = event.target as HTMLInputElement
  if (!fileInput.files || fileInput.files.length === 0) return

  Array.from(fileInput.files).forEach((file) => {
    const attachment = {
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      name: file.name,
      type: file.type,
      size: formatFileSize(file.size),
      file,
    }
    attachments.value.push(attachment)
  })

  // Reset file input
  fileInput.value = ""
}

const formatFileSize = (bytes: number): string => {
  if (bytes < 1024) return bytes + " B"
  else if (bytes < 1048576) return (bytes / 1024).toFixed(1) + " KB"
  else return (bytes / 1048576).toFixed(1) + " MB"
}

const removeAttachment = (id: string) => {
  attachments.value = attachments.value.filter((att) => att.id !== id)
}

const sendActivity = () => {
  if (!canSubmit.value || isSubmitting.value) return

  isSubmitting.value = true

  const activityData = {
    content: message.value,
    attachments: attachments.value,
    timestamp: new Date().toISOString(),
  }

  emit("send-activity", activityData)

  // Reset form
  message.value = ""
  attachments.value = []
  isSubmitting.value = false
}
</script>

<template>
  <div
    class="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 p-3 sticky bottom-0"
  >
    <div v-if="attachments.length > 0" class="flex flex-wrap gap-2 mb-3">
      <div
        v-for="file in attachments"
        :key="file.id"
        class="bg-gray-100 dark:bg-gray-700 rounded-lg pl-3 pr-1 py-1 flex items-center text-sm"
      >
        <span class="truncate max-w-[150px]">{{ file.name }}</span>
        <button
          class="ml-1 p-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 rounded-full"
          @click="removeAttachment(file.id)"
        >
          <XMarkIcon class="h-4 w-4" />
        </button>
      </div>
    </div>

    <form class="flex items-center gap-2" @submit.prevent="sendActivity">
      <textarea
        v-model="message"
        class="flex-1 min-h-10 max-h-32 bg-gray-100 dark:bg-gray-700 border-none rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 resize-none"
        placeholder="Escribe un mensaje..."
        rows="1"
        @keydown.enter.exact.prevent="sendActivity"
      />

      <label class="cursor-pointer p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700">
        <PaperClipIcon class="h-5 w-5 text-gray-500 dark:text-gray-400" />
        <input type="file" multiple class="hidden" @change="handleFileSelect" />
      </label>

      <button
        type="submit"
        :disabled="!canSubmit || isSubmitting"
        class="p-2 rounded-full text-white bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 disabled:cursor-not-allowed"
      >
        <PaperAirplaneIcon class="h-5 w-5" />
      </button>
    </form>
  </div>
</template>
