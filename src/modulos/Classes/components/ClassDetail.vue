<script setup lang="ts">
import { ref, computed, nextTick } from 'vue';
import { useClassesStore } from '../store/classes';
import ClassHeader from './ClassHeader.vue';
import ClassInfoTab from './ClassInfoTab.vue';
import ClassActivitiesTab from './ClassActivitiesTab.vue';
import ClassAttendanceTab from './ClassAttendanceTab.vue';
import ClassActivityInput from './ClassActivityInput.vue';
import ClassQuickActions from './ClassQuickActions.vue';
import type { ClassData } from '../types/class'; // Asumiendo que tienes esta interfaz

interface Activity {
  id: number;
  type: string;
  content: string;
  timestamp: number;
  user: string;
  metadata: any;
  attachments: any[];
}

const props = defineProps<{
  selectedClass: ClassData;
  isMobile?: boolean;
  showMobileDetail?: boolean;
}>();

const $emit = defineEmits<{
  (e: 'show-student-list'): void;
  (e: 'handle-edit'): void;
  (e: 'handle-delete'): void;
  (e: 'go-back'): void;
}>();

// Stores
const classesStore = useClassesStore();

// State
const activeSection = ref('info');
const activities = ref<Activity[]>([
  {
    id: 1,
    type: 'system',
    content: 'Clase creada',
    timestamp: new Date(props.selectedClass.createdAt || new Date()).getTime(),
    user: 'Sistema',
    metadata: null,
    attachments: []
  }
]);

// Definir ref para el feed de actividades (usado en ClassActivitiesTab)
const activityFeedRef = ref<HTMLElement | null>(null);

// Computed
const formattedSchedule = computed(() => {
  const schedule = props.selectedClass.schedule || { days: [], startTime: '', endTime: '' };
  const daysArray = Array.isArray(schedule.days) ? schedule.days : (typeof schedule.days === 'string' ? [schedule.days] : []);
  const days = daysArray.length > 0
    ? daysArray.map(d => typeof d === 'string' ? d.substring(0, 3) : '').join(', ')
    : 'Sin días asignados';
  return `${days} • ${schedule.startTime || '--:--'} - ${schedule.endTime || '--:--'}`;
});

const studentCount = computed(() => {
  return props.selectedClass.studentIds?.length || 0;
});

// Métodos
const handleSetActiveSection = (section: string) => {
  activeSection.value = section;
};

const handleAddActivity = async (activity: Partial<Activity>) => {
  const newActivity: Activity = {
    id: Date.now(),
    type: activity.type || 'system',
    content: activity.content || getDefaultContent(activity.type),
    timestamp: Date.now(),
    user: 'Profesor',
    metadata: getActivityMetadata(activity),
    attachments: activity.attachments || []
  };

  activities.value.push(newActivity);

  await nextTick();
  if (activityFeedRef.value) {
    activityFeedRef.value.scrollTop = activityFeedRef.value.scrollHeight;
  }
};

const getDefaultContent = (type?: string) => {
  switch (type) {
    case 'attendance': return 'Nueva toma de asistencia';
    case 'content': return 'Nuevo contenido agregado';
    case 'evaluation': return 'Nueva evaluación registrada';
    case 'task': return 'Nueva tarea asignada';
    default: return 'Actividad registrada';
  }
};

const getActivityMetadata = (activity: Partial<Activity>) => {
  switch (activity.type) {
    case 'attendance':
      return { date: Date.now(), pending: true };
    case 'content':
      return { title: activity.content || 'Sin título', date: Date.now() };
    case 'evaluation':
      return { title: activity.content || 'Sin título', date: Date.now(), pending: true };
    case 'task':
      return { title: activity.content || 'Sin título', dueDate: Date.now() + 7 * 86400000, status: 'assigned' };
    case 'schedule_change':
      return { oldSchedule: props.selectedClass.schedule, date: Date.now() };
    default:
      return null;
  }
};

const handleSaveChanges = async (updatedClass: ClassData) => {
  try {
    await classesStore.updateClass(updatedClass);
    handleAddActivity({
      type: 'class_update',
      content: 'Detalles de la clase actualizados',
    metadata: {
            timestamp: Date.now(),
            updatedFields: Object.keys(updatedClass).filter(key =>
              JSON.stringify(updatedClass[key as keyof ClassData]) !== JSON.stringify(props.selectedClass[key as keyof ClassData])
            )
          }
        });
  } catch (error) {
    console.error('Error updating class:', error);
    throw error;
  }
};

const handleStartEditing = () => {
  activeSection.value = 'info';
};

const handleStartActivity = (type: string) => {
  if (type === 'attendance') {
    activeSection.value = 'attendance';
  } else {
    handleAddActivity({ type });
  }
};
</script>

<template>
  <div class="flex flex-col h-full bg-gray-100 dark:bg-gray-800 relative">
    <!-- Header -->
    <ClassHeader
      :selected-class="selectedClass"
      :is-mobile="isMobile"
      :formatted-schedule="formattedSchedule"
      :active-section="activeSection"
      @go-back="$emit('go-back')"
      @handle-edit="$emit('handle-edit')"
      @handle-delete="$emit('handle-delete')"
      @show-student-list="$emit('show-student-list')"
      @set-active-section="handleSetActiveSection"
    />

    <!-- Área de Contenido -->
    <div class="flex-1 overflow-y-auto p-4 bg-gray-100 dark:bg-gray-900">
      <!-- Info Tab -->
      <ClassInfoTab
        v-if="activeSection === 'info'"
        :selected-class="selectedClass"
        :student-count="studentCount"
        :formatted-schedule="formattedSchedule"
        @handle-manage-students="$emit('show-student-list')"
        @save-changes="handleSaveChanges"
      />

      <!-- Activities Tab -->
      <ClassActivitiesTab
        v-if="activeSection === 'activities'"
        :activities="activities"
        ref="activityFeedRef"
      />

      <!-- Attendance Tab -->
      <ClassAttendanceTab
        v-if="activeSection === 'attendance'"
        @take-attendance="date => handleAddActivity({ type: 'attendance', metadata: { date } })"
      />
    </div>

    <!-- Input de Actividades y Acciones Rápidas -->
    <ClassActivityInput
      @add-activity="handleAddActivity"
      @start-editing="handleStartEditing"
    />
    <ClassQuickActions
      @start-activity="handleStartActivity"
      @start-editing="handleStartEditing"
    />
  </div>
</template>

<style scoped>
.activity-feed {
  scroll-behavior: smooth;
}
</style>
