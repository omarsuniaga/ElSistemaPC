<template>
  <div class="pb-20 activity-feed">
    <div v-for="(activity, index) in activities" :key="activity.id" class="mb-4">
      <!-- Date divider -->
      <div
v-if="index === 0 || formattedDate(activity.timestamp) !== formattedDate(activities[index-1].timestamp)" 
        "
        class="flex justify-center mb-3"
      >
        <div
          class="bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 text-xs px-3 py-1 rounded-full"
        >
          {{ formattedDate(activity.timestamp) }}
        </div>
      </div>

      <!-- Activity message -->
      <div
class="flex items-start gap-2" :class="{'justify-end': activity.user !== 'Sistema'}">
        <div
          v-if="activity.user === 'Sistema'"
          class="flex-shrink-0 h-8 w-8 rounded-full bg-gray-300 dark:bg-gray-700 flex items-center justify-center"
        >
          <component
            :is="showActivityIcon(activity.type)"
            class="h-5 w-5 text-gray-600 dark:text-gray-400"
          />
        </div>

        <div
          class="max-w-[85%] rounded-lg px-3 py-2"
          :class="{
            'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700':
              activity.user === 'Sistema',
            'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-100':
              activity.user !== 'Sistema',
            'border-l-4 border-l-amber-500': activity.important,
          }"
        >
          <div class="flex items-center gap-1">
            <span
              class="font-medium text-xs"
              :class="{
                'text-gray-600 dark:text-gray-400': activity.user === 'Sistema',
                'text-blue-900 dark:text-blue-300': activity.user !== 'Sistema',
              }"
            >
              {{ activity.user }}
            </span>
            <span class="text-xs text-gray-500 dark:text-gray-400">{{
              formattedTime(activity.timestamp)
            }}</span>
          </div>

          <!-- Activity content -->
          <p
            class="text-sm mt-1"
            :class="{
              'text-gray-800 dark:text-gray-200': activity.user === 'Sistema',
              'text-blue-800 dark:text-blue-100': activity.user !== 'Sistema',
            }"
          >
            {{ activity.content }}
          </p>

          <!-- Metadata display based on activity type -->
          <div v-if="activity.metadata" class="mt-2">
            <!-- Attendance metadata -->
            <div
v-if="activity.type === 'attendance' && activity.metadata.present !== undefined" 
              class="text-xs bg-gray-100 dark:bg-gray-700 rounded p-1.5 flex items-center"
            >
              <span class="text-green-600 dark:text-green-400 font-medium mr-2"
                >Presentes: {{ activity.metadata.present }}</span
              >
              <span class="text-red-600 dark:text-red-400 font-medium"
                >Ausentes: {{ activity.metadata.absent }}</span
              >
            </div>

            <!-- Evaluation metadata -->
            <div
v-if="activity.type === 'evaluation' && activity.metadata.score" 
              class="text-xs bg-gray-100 dark:bg-gray-700 rounded p-1.5"
            >
              <span class="font-medium">Calificación: {{ activity.metadata.score }}</span>
            </div>

            <!-- Task metadata -->
            <div
v-if="activity.type === 'task' && activity.metadata.dueDate" 
              class="text-xs bg-gray-100 dark:bg-gray-700 rounded p-1.5"
            >
              <span>Fecha de entrega: {{ formatDate(activity.metadata.dueDate) }}</span>
            </div>
          </div>

          <!-- Attachments -->
          <div
            v-if="activity.attachments && activity.attachments.length > 0"
            class="mt-2 space-y-1"
          >
            <div
v-for="file in activity.attachments" :key="file.id" 
              class="flex items-center text-xs p-1.5 bg-gray-100 dark:bg-gray-700 rounded hover:bg-gray-200 dark:hover:bg-gray-600 cursor-pointer transition-colors"
              @click="handleDownloadAttachment(file)"
            >
              <component
                :is="getFileIcon(file.type)"
                class="h-4 w-4 mr-2 text-gray-500 dark:text-gray-400"
              />
              <span class="flex-1 truncate">{{ file.name }}</span>
              <span class="text-gray-500">{{ file.size }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import {
  UserCircleIcon,
  ClipboardDocumentCheckIcon,
  BookOpenIcon,
  AcademicCapIcon,
  DocumentIcon,
  ChatBubbleLeftRightIcon,
  UserGroupIcon,
  ClockIcon,
  PhotoIcon,
  MicrophoneIcon,
  PaperClipIcon,
  XMarkIcon,
} from '@heroicons/vue/24/outline';

// Define proper types for the activities
interface Attachment {
  id: string
  name: string
  type: string
  size: string
  url: string
}

interface ActivityMetadata {
  present?: number
  absent?: number
  score?: number
  dueDate?: string
}

interface Activity {
  id: string
  type:
    | 'system'
    | 'attendance'
    | 'content'
    | 'evaluation'
    | 'task'
    | 'message'
    | 'student_added'
    | 'schedule_change'
    | 'student_action'
  user: string
  content: string
  timestamp: string
  metadata?: ActivityMetadata
  attachments?: Attachment[]
  important?: boolean
}

const props = defineProps({
  activities: {
    type: Array as () => Activity[],
    required: true,
    default: () => [],
  },
});

const emit = defineEmits(['download-attachment']);

// Helper functions
const formattedTime = (timestamp: string) => {
  const date = new Date(timestamp);
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

const formattedDate = (timestamp: string) => {
  const date = new Date(timestamp);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);

  if (date.toDateString() === today.toDateString()) {
    return 'Hoy';
  } else if (date.toDateString() === yesterday.toDateString()) {
    return 'Ayer';
  } else {
    return date.toLocaleDateString();
  }
};

// Add the missing formatDate function
const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('es-ES', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};

// Activity icon selection
const showActivityIcon = (type: Activity['type']) => {
  switch (type) {
  case 'system':
    return UserCircleIcon;
  case 'attendance':
    return ClipboardDocumentCheckIcon;
  case 'content':
    return BookOpenIcon;
  case 'evaluation':
    return AcademicCapIcon;
  case 'task':
    return DocumentIcon;
  case 'message':
    return ChatBubbleLeftRightIcon;
  case 'student_added':
    return UserGroupIcon;
  case 'schedule_change':
    return ClockIcon;
  case 'student_action':
    return UserCircleIcon;
  default:
    return UserCircleIcon;
  }
};

// File icon selection
const getFileIcon = (mimeType: string) => {
  if (mimeType.startsWith('image/')) {
    return PhotoIcon;
  } else if (mimeType.startsWith('audio/')) {
    return MicrophoneIcon;
  } else if (mimeType.startsWith('application/pdf')) {
    return DocumentIcon;
  } else {
    return PaperClipIcon;
  }
};

// Handle attachment download
const handleDownloadAttachment = (attachment: Attachment) => {
  emit('download-attachment', attachment);
};
</script>

<style scoped>
.activity-feed {
  scroll-behavior: smooth;
  max-height: 70vh;
  overflow-y: auto;
}
</style>
