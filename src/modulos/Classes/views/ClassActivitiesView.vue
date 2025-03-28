<script setup lang="ts">
import { ref, onMounted, nextTick } from 'vue';
import ClassActivitiesTab from '../components/ClassActivitiesTab.vue';
import ClassActivitySender from '../components/ClassActivitySender.vue';

interface Attachment {
  id: string;
  name: string;
  type: string;
  size: string;
  url?: string;
  file?: File;
}

interface ActivityMetadata {
  present?: number;
  absent?: number;
  score?: number;
  dueDate?: string;
}

interface Activity {
  id: string;
  type: 'system' | 'attendance' | 'content' | 'evaluation' | 'task' | 'message' | 'student_added' | 'schedule_change' | 'student_action';
  user: string;
  content: string;
  timestamp: string;
  metadata?: ActivityMetadata;
  attachments?: Attachment[];
  important?: boolean;
}

// Sample data - in a real app, this would come from an API
const activities = ref<Activity[]>([
  {
    id: '1',
    type: 'system',
    user: 'Sistema',
    content: 'Bienvenidos a la clase de Piano - Nivel Intermedio',
    timestamp: '2023-10-20T09:00:00Z'
  },
  {
    id: '2',
    type: 'attendance',
    user: 'Sistema',
    content: 'El profesor ha tomado asistencia',
    timestamp: '2023-10-20T09:15:00Z',
    metadata: {
      present: 18,
      absent: 2
    }
  },
  {
    id: '3',
    type: 'content',
    user: 'Sistema',
    content: 'Se ha compartido el material de la clase: "Técnicas avanzadas de interpretación"',
    timestamp: '2023-10-20T09:30:00Z',
    attachments: [
      {
        id: 'att1',
        name: 'técnicas_piano_avanzadas.pdf',
        type: 'application/pdf',
        size: '2.4 MB',
        url: '/assets/documents/técnicas_piano_avanzadas.pdf'
      }
    ],
    important: true
  },
  {
    id: '4',
    type: 'message',
    user: 'Prof. García',
    content: 'Por favor practicar los ejercicios de las páginas 15-20 para la próxima clase.',
    timestamp: '2023-10-20T10:45:00Z'
  }
]);

const sendActivity = async (activityData: { content: string, attachments: Attachment[], timestamp: string }) => {
  // Prepare attachment data
  const processedAttachments = activityData.attachments.map(att => ({
    id: att.id,
    name: att.name,
    type: att.type,
    size: att.size,
    url: URL.createObjectURL(att.file!) // In a real app, you'd upload to a server
  }));
  
  // Create new activity
  const newActivity: Activity = {
    id: Date.now().toString(),
    type: 'message',
    user: 'Tú', // In a real app, this would be the authenticated user's name
    content: activityData.content,
    timestamp: activityData.timestamp,
    attachments: processedAttachments.length > 0 ? processedAttachments : undefined
  };
  
  // Add to activities list
  activities.value.push(newActivity);
  
  // Scroll to bottom on next tick
  await nextTick();
  const activityFeed = document.querySelector('.activity-feed');
  if (activityFeed) {
    activityFeed.scrollTop = activityFeed.scrollHeight;
  }
};

const handleDownloadAttachment = (attachment: Attachment) => {
  // In a real app, you would handle the download here
  if (attachment.url) {
    window.open(attachment.url, '_blank');
  }
};

onMounted(async () => {
  // Scroll to bottom on mount
  await nextTick();
  const activityFeed = document.querySelector('.activity-feed');
  if (activityFeed) {
    activityFeed.scrollTop = activityFeed.scrollHeight;
  }
});
</script>

<template>
  <div class="h-full flex flex-col bg-gray-50 dark:bg-gray-900">
    <div class="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
      <h2 class="text-lg font-semibold">Actividades de la Clase</h2>
      <div class="text-sm text-gray-500">Piano - Nivel Intermedio</div>
    </div>
    
    <div class="flex-1 overflow-hidden flex flex-col">
      <div class="flex-1 overflow-y-auto p-4">
        <ClassActivitiesTab 
          :activities="activities" 
          @download-attachment="handleDownloadAttachment"
        />
      </div>
      
      <ClassActivitySender @send-activity="sendActivity" />
    </div>
  </div>
</template>
