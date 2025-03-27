<script setup lang="ts">
import { ref } from 'vue';
import { 
  UserGroupIcon, 
  EllipsisVerticalIcon, 
  PencilIcon, 
  TrashIcon, 
  ClipboardDocumentCheckIcon,
  BookOpenIcon,
  AcademicCapIcon,
  ArrowLeftIcon,
  ClockIcon,
  ChatBubbleLeftRightIcon
} from '@heroicons/vue/24/outline';

const props = defineProps({
  selectedClass: {
    type: Object,
    required: true
  },
  isMobile: {
    type: Boolean,
    default: false
  },
  formattedSchedule: {
    type: String,
    required: true
  },
  activeSection: {
    type: String,
    required: true
  }
});

const emit = defineEmits(['go-back', 'toggle-menu', 'set-active-section']);

const menuOpen = ref(false);

const toggleMenu = () => {
  menuOpen.value = !menuOpen.value;
  emit('toggle-menu');
};
</script>

<template>
  <div class="sticky top-0 z-10 bg-blue-600 dark:bg-blue-900 text-white shadow-md">
    <!-- Mobile Header -->
    <div v-if="isMobile" class="px-4 py-3 flex items-center gap-2">
      <button 
        @click="$emit('go-back')" 
        class="text-white"
      >
        <ArrowLeftIcon class="h-6 w-6" />
      </button>
      <div class="flex items-center flex-1 min-w-0">
        <div class="h-10 w-10 rounded-full bg-blue-700 dark:bg-blue-800 flex items-center justify-center text-lg font-bold mr-3">
          {{ selectedClass.name && selectedClass.name.substring(0, 1).toUpperCase() || '?' }}
        </div>
        <div>
          <h1 class="text-base font-semibold truncate">{{ selectedClass.name || 'Sin nombre' }}</h1>
          <p class="text-xs text-blue-100">{{ formattedSchedule }}</p>
        </div>
      </div>
      <div class="relative">
        <button 
          @click="toggleMenu"
          class="p-1 rounded-full hover:bg-blue-700 dark:hover:bg-blue-800"
        >
          <EllipsisVerticalIcon class="h-6 w-6" />
        </button>
      </div>
    </div>

    <!-- Desktop Header -->
    <div v-else class="px-6 py-4 flex items-center">
      <div class="flex items-center flex-1 min-w-0">
        <div class="h-12 w-12 rounded-full bg-blue-700 dark:bg-blue-800 flex items-center justify-center text-xl font-bold mr-4">
          {{ selectedClass.name && selectedClass.name.substring(0, 1).toUpperCase() || '?' }}
        </div>
        <div>
          <h1 class="text-xl font-semibold">{{ selectedClass.name || 'Sin nombre' }}</h1>
          <div class="flex items-center text-sm text-blue-100">
            <ClockIcon class="h-4 w-4 mr-1" />
            <span>{{ formattedSchedule }}</span>
          </div>
        </div>
      </div>
      <div class="flex items-center gap-4">
        <button class="p-2 rounded-full hover:bg-blue-700 dark:hover:bg-blue-800">
          <UserGroupIcon class="h-6 w-6" />
          <span class="sr-only">Ver estudiantes</span>
        </button>
        <div class="relative">
          <button 
            @click="toggleMenu"
            class="p-2 rounded-full hover:bg-blue-700 dark:hover:bg-blue-800"
          >
            <EllipsisVerticalIcon class="h-6 w-6" />
          </button>
        </div>
      </div>
    </div>

    <!-- Navigation tabs -->
    <div class="flex border-t border-blue-500 dark:border-blue-800">
        <button 
        class="flex-1 py-2 text-sm font-medium text-center flex justify-center items-center gap-1"
        :class="activeSection === 'attendance' ? 'text-white border-b-2 border-white' : 'text-blue-200 hover:text-white'"
        @click="$emit('set-active-section', 'attendance')"
        >
            <ClipboardDocumentCheckIcon class="h-4 w-4" />
            <span>Asistencia</span>
        </button>
        <button 
        class="flex-1 py-2 text-sm font-medium text-center flex justify-center items-center gap-1"
        :class="activeSection === 'activities' ? 'text-white border-b-2 border-white' : 'text-blue-200 hover:text-white'"
        @click="$emit('set-active-section', 'activities')"
        >
        <ChatBubbleLeftRightIcon class="h-4 w-4" />
        <span>Actividades</span>
    </button>
    <button 
      class="flex-1 py-2 text-sm font-medium text-center flex justify-center items-center gap-1"
      :class="activeSection === 'info' ? 'text-white border-b-2 border-white' : 'text-blue-200 hover:text-white'"
      @click="$emit('set-active-section', 'info')"
    >
      <UserGroupIcon class="h-4 w-4" />
      <span>Info</span>
    </button>
    </div>
  </div>
</template>