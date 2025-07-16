<template>
  <div
    class="sticky bottom-10 bg-gray-100 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 p-3"
  >
    <!-- Attached files preview -->
    <div v-if="attachedFiles.length > 0" class="mb-2 px-4">
      <div
v-for="file in attachedFiles" :key="file.id" 
        class="inline-flex items-center bg-gray-200 dark:bg-gray-700 rounded-full px-3 py-1 text-xs mr-2 mb-1"
      >
        <component
:is="file.type.startsWith('image/') ? PhotoIcon : file.type.startsWith('audio/') ? MicrophoneIcon : DocumentIcon" 
          "
          class="h-3.5 w-3.5 mr-1 text-gray-600 dark:text-gray-300"
        />
        <span class="truncate max-w-[120px]">{{ file.name }}</span>
        <button class="ml-1 text-gray-500 hover:text-gray-700" @click="removeAttachedFile(file.id)">
          <XMarkIcon class="h-3.5 w-3.5" />
        </button>
      </div>
    </div>

    <div class="bg-white dark:bg-gray-800 rounded-full px-4 py-2 flex items-center gap-2 shadow-sm">
      <!-- Plus menu button with dropdown -->
      <div class="relative">
        <button
          class="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
          @click="toggleActivityOptions"
        >
          <PlusCircleIcon class="h-6 w-6" />
        </button>

        <!-- Activity options dropdown -->
        <div
v-if="showActivityOptions" 
          class="absolute bottom-full left-0 mb-2 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-1 w-48 z-10"
        >
          <button
            class="w-full text-left px-3 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center"
            @click="addActivity('schedule_change')"
          >
            <ClockIcon class="h-4 w-4 mr-2 text-gray-500 dark:text-gray-400" />
            Cambio de horario
          </button>
          <button
            class="w-full text-left px-3 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center"
            @click="addActivity('student_action')"
          >
            <UserGroupIcon class="h-4 w-4 mr-2 text-gray-500 dark:text-gray-400" />
            Gestión de alumnos
          </button>
          <hr class="my-1 border-gray-200 dark:border-gray-700" />
          <button
            class="w-full text-left px-3 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center"
            @click="$emit('start-editing')"
          >
            <PencilIcon class="h-4 w-4 mr-2 text-gray-500 dark:text-gray-400" />
            Editar información
          </button>
        </div>
      </div>

      <input
        v-model="activityInput"
        type="text"
        placeholder="Escribe una nota..."
        class="flex-1 bg-transparent border-none focus:ring-0 text-gray-800 dark:text-gray-200 placeholder-gray-500 dark:placeholder-gray-400"
        @keyup.enter="addActivity('message')"
      />

      <!-- Attachment button with dropdown -->
      <div class="relative">
        <button
          class="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
          title="Adjuntar archivo"
          @click="toggleAttachOptions"
        >
          <PaperClipIcon class="h-6 w-6" />
        </button>

        <!-- File upload options dropdown -->
        <div
v-if="showAttachOptions" 
          class="absolute bottom-full right-0 mb-2 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-1 w-48 z-10"
        >
          <button
            class="w-full text-left px-3 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center"
            @click="triggerFileInput('document')"
          >
            <DocumentIcon class="h-4 w-4 mr-2 text-gray-500 dark:text-gray-400" />
            Documento
          </button>
          <button
            class="w-full text-left px-3 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center"
            @click="triggerFileInput('photo')"
          >
            <PhotoIcon class="h-4 w-4 mr-2 text-gray-500 dark:text-gray-400" />
            Imagen
          </button>
          <button
            class="w-full text-left px-3 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center"
            @click="triggerFileInput('audio')"
          >
            <MicrophoneIcon class="h-4 w-4 mr-2 text-gray-500 dark:text-gray-400" />
            Audio
          </button>
        </div>
      </div>

      <!-- Hidden file input -->
      <input ref="fileInputRef" type="file" class="hidden" multiple @change="handleFileUpload" />

      <button
        :disabled="!activityInput.trim() && attachedFiles.length === 0"
        :class="
          activityInput.trim() || attachedFiles.length > 0
            ? 'text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300'
            : 'text-gray-400 dark:text-gray-600'
        "
        title="Enviar mensaje"
        @click="addActivity('message')"
      >
        <ChatBubbleLeftRightIcon class="h-6 w-6" />
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import {
  PlusCircleIcon,
  ClockIcon,
  UserGroupIcon,
  PencilIcon,
  ChatBubbleLeftRightIcon,
  PaperClipIcon,
  DocumentIcon,
  PhotoIcon,
  MicrophoneIcon,
  XMarkIcon,
} from '@heroicons/vue/24/outline';

const props = defineProps({
  isEditing: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits(['add-activity', 'start-editing', 'attach-file']);

// Estado local
const activityInput = ref('');
const attachedFiles = ref([]);
const showAttachOptions = ref(false);
const showActivityOptions = ref(false);
const fileInputRef = ref(null);

// Methods
const toggleAttachOptions = () => {
  showAttachOptions.value = !showAttachOptions.value;
  if (showAttachOptions.value) {
    showActivityOptions.value = false;
  }
};

const toggleActivityOptions = () => {
  showActivityOptions.value = !showActivityOptions.value;
  if (showActivityOptions.value) {
    showAttachOptions.value = false;
  }
};

const triggerFileInput = (type) => {
  if (fileInputRef.value) {
    fileInputRef.value.setAttribute('data-file-type', type);
    fileInputRef.value.click();
  }
};

const handleFileUpload = (event) => {
  const files = event.target.files;
  if (!files.length) return;

  const fileType = event.target.getAttribute('data-file-type') || 'generic';

  Array.from(files).forEach((file) => {
    const fileInfo = {
      id: Date.now() + Math.random().toString(36).substr(2, 9),
      name: file.name,
      type: file.type,
      size: formatFileSize(file.size),
      file,
      uploadType: fileType,
    };

    attachedFiles.value.push(fileInfo);
  });

  // Reset file input
  if (fileInputRef.value) {
    fileInputRef.value.value = '';
  }

  showAttachOptions.value = false;
};

const removeAttachedFile = (fileId) => {
  attachedFiles.value = attachedFiles.value.filter((file) => file.id !== fileId);
};

const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

const addActivity = (type = 'message') => {
  if (!activityInput.value.trim() && attachedFiles.value.length === 0 && type === 'message') {
    return;
  }

  emit('add-activity', {
    type,
    content: activityInput.value.trim(),
    attachments: [...attachedFiles.value],
  });

  // Clear input and files
  activityInput.value = '';
  attachedFiles.value = [];
  showActivityOptions.value = false;
  showAttachOptions.value = false;
};
</script>
