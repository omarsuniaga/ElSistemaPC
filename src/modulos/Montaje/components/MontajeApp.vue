<template>
  <ResponsiveLayout :title="currentProject?.name || 'Montaje'">
    <!-- Sidebar Navigation -->
    <template #sidebar>
      <nav class="p-4 space-y-2">
        <button
          :class="[
            'w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-colors',
            currentView === 'dashboard' 
              ? 'bg-blue-500 text-white' 
              : `${themeClasses.text.primary} ${themeClasses.hover}`
          ]"
          @click="goToDashboard"
        >
          <span class="text-xl">🏠</span>
          <span class="font-medium">Dashboard</span>
        </button>

        <div v-if="currentWork" class="space-y-1">
          <div :class="['px-3 py-2 text-sm font-medium', themeClasses.text.muted]">
            {{ currentWork.name }}
          </div>
          
          <button
            :class="[
              'w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-colors',
              currentView === 'work-detail' 
                ? 'bg-blue-500 text-white' 
                : `${themeClasses.text.primary} ${themeClasses.hover}`
            ]"
            @click="currentView = 'work-detail'"
          >
            <span class="text-lg">📊</span>
            <span>Vista General</span>
          </button>
          
          <button
            :class="[
              'w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-colors',
              currentView === 'evaluations' 
                ? 'bg-blue-500 text-white' 
                : `${themeClasses.text.primary} ${themeClasses.hover}`
            ]"
            @click="currentView = 'evaluations'"
          >
            <span class="text-lg">📋</span>
            <span>Evaluaciones</span>
          </button>
          
          <button
            :class="[
              'w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-colors',
              currentView === 'weekly-evaluations' 
                ? 'bg-blue-500 text-white' 
                : `${themeClasses.text.primary} ${themeClasses.hover}`
            ]"
            @click="currentView = 'weekly-evaluations'"
          >
            <span class="text-lg">📅</span>
            <span>Semanales</span>
          </button>
          
          <button
            :class="[
              'w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-colors',
              currentView === 'analytics' 
                ? 'bg-blue-500 text-white' 
                : `${themeClasses.text.primary} ${themeClasses.hover}`
            ]"
            @click="currentView = 'analytics'"
          >
            <span class="text-lg">📈</span>
            <span>Análisis</span>
          </button>
        </div>

        <!-- Tools Section -->
        <div class="pt-4 border-t border-gray-200 dark:border-gray-700">
          <div :class="['px-3 py-2 text-sm font-medium', themeClasses.text.muted]">
            Herramientas
          </div>
          
          <button
            :class="[
              'w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-colors',
              currentView === 'calendar' 
                ? 'bg-blue-500 text-white' 
                : `${themeClasses.text.primary} ${themeClasses.hover}`
            ]"
            @click="currentView = 'calendar'"
          >
            <span class="text-lg">📅</span>
            <span>Calendario</span>
          </button>
          
          <button
            :class="[
              'w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-colors',
              currentView === 'musical-tools' 
                ? 'bg-blue-500 text-white' 
                : `${themeClasses.text.primary} ${themeClasses.hover}`
            ]"
            @click="currentView = 'musical-tools'"
          >
            <span class="text-lg">🎼</span>
            <span>Herramientas</span>
          </button>
          
          <button
            v-if="hasPermission('users', 'read')"
            :class="[
              'w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-colors',
              currentView === 'users' 
                ? 'bg-blue-500 text-white' 
                : `${themeClasses.text.primary} ${themeClasses.hover}`
            ]"
            @click="currentView = 'users'"
          >
            <span class="text-lg">👥</span>
            <span>Usuarios</span>
          </button>
          
          <button
            v-if="hasPermission('settings', 'read')"
            :class="[
              'w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-colors',
              currentView === 'permissions' 
                ? 'bg-blue-500 text-white' 
                : `${themeClasses.text.primary} ${themeClasses.hover}`
            ]"
            @click="currentView = 'permissions'"
          >
            <span class="text-lg">🔐</span>
            <span>Permisos</span>
          </button>
        </div>
      </nav>
    </template>

    <!-- Header Actions -->
    <template #header-actions>
      <!-- Project Selector -->
      <div v-if="currentProject && !isMobile" class="flex items-center space-x-2">
        <span :class="['text-gray-400', themeClasses.text.muted]">|</span>
        <select
          :value="currentProject.id"
          :class="[
            'text-sm border-none bg-transparent font-medium focus:ring-0',
            themeClasses.text.primary
          ]"
          @change="selectProject($event.target.value)"
        >
          <option 
            v-for="project in projects" 
            :key="project.id" 
            :value="project.id"
          >
            {{ project.name }}
          </option>
        </select>
      </div>

      <!-- Project Stats -->
      <div v-if="projectStats && !isMobile" class="hidden lg:flex items-center space-x-4 text-sm">
        <div class="text-center">
          <div :class="['font-bold text-blue-600', textClasses.small]">{{ projectStats.totalWorks }}</div>
          <div :class="[themeClasses.text.muted, textClasses.small]">Obras</div>
        </div>
        <div class="text-center">
          <div :class="['font-bold text-green-600', textClasses.small]">{{ projectStats.totalMembers }}</div>
          <div :class="[themeClasses.text.muted, textClasses.small]">Miembros</div>
        </div>
        <div class="text-center">
          <div :class="['font-bold text-orange-600', textClasses.small]">{{ projectStats.daysRemaining }}</div>
          <div :class="[themeClasses.text.muted, textClasses.small]">Días</div>
        </div>
      </div>

      <!-- Notifications -->
      <MontajeNotifications />

      <!-- User info (from parent system) -->
      <div v-if="user" class="flex items-center space-x-2">
        <span :class="['text-sm', themeClasses.text.primary]">{{ user.name }}</span>
        <div class="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
          <span class="text-white text-sm font-medium">
            {{ user.name?.charAt(0) || 'U' }}
          </span>
        </div>
      </div>
    </template>

    <!-- Main Content -->
    <template #content>
      <!-- Dashboard -->
      <MontajeDashboard 
        v-if="currentView === 'dashboard'"
        @work-selected="onWorkSelected"
        @create-project="showCreateProject = true"
      />

      <!-- Work Detail View -->
      <WorkDetail 
        v-else-if="currentView === 'work-detail' && currentWork"
        :work="currentWork"
        @instrument-selected="onInstrumentSelected"
      />

      <!-- Instrument Detail View -->
      <InstrumentDetail 
        v-else-if="currentView === 'instrument-detail' && currentWork && selectedInstrument"
        :work="currentWork"
        :instrument="selectedInstrument"
        @back="currentView = 'work-detail'"
      />

      <!-- Evaluations View -->
      <EvaluationsView 
        v-else-if="currentView === 'evaluations' && currentWork"
        :work="currentWork"
      />

      <!-- Weekly Evaluations View -->
      <WeeklyEvaluationsView 
        v-else-if="currentView === 'weekly-evaluations' && currentWork"
        :work="currentWork"
      />

      <!-- Analytics View -->
      <AnalyticsView 
        v-else-if="currentView === 'analytics' && currentWork"
        :work="currentWork"
      />

      <!-- Calendar View -->
      <InteractiveCalendar 
        v-else-if="currentView === 'calendar'"
      />

      <!-- Musical Tools View -->
      <MusicalTools 
        v-else-if="currentView === 'musical-tools'"
      />

      <!-- Users Management View -->
      <UsersApp 
        v-else-if="currentView === 'users'"
      />

      <!-- Permissions View -->
      <PermissionsManager 
        v-else-if="currentView === 'permissions'"
      />
    </template>

    <!-- Create Project Modal -->
    <ResponsiveModal
      v-model="showCreateProject"
      title="🎼 Crear Nuevo Proyecto"
      size="lg"
    >
      <MontajeProjectModal
        @project-created="onProjectCreated"
        @close="showCreateProject = false"
      />
    </ResponsiveModal>
  </ResponsiveLayout>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useMontaje } from '../composables/useMontaje';
import { useTheme } from '../composables/useTheme';
import { useResponsive } from '../composables/useResponsive';

// Components
import ResponsiveLayout from './ResponsiveLayout.vue';
import ResponsiveModal from './ResponsiveModal.vue';
import MontajeDashboard from './MontajeDashboard.vue';
import MontajeNotifications from './MontajeNotifications.vue';
import MontajeProjectModal from './MontajeProjectModal.vue';
import WorkDetail from '../views/WorkDetail.vue';
import InstrumentDetail from '../views/InstrumentDetail.vue';
import EvaluationsView from '../views/EvaluationsView.vue';
import WeeklyEvaluationsView from '../views/WeeklyEvaluationsView.vue';
import AnalyticsView from '../views/AnalyticsView.vue';
import InteractiveCalendar from './InteractiveCalendar.vue';
import MusicalTools from './MusicalTools.vue';
import PermissionsManager from './PermissionsManager.vue';
import UsersApp from './users/UsersApp.vue';

import type { MusicalWork, Instrument } from '../types';

// Props - Recibe el usuario del sistema principal
interface Props {
  user?: {
    id: string
    name: string
    email: string
    role: string
    permissions?: string[]
  }
  initialProject?: string
}

const props = withDefaults(defineProps<Props>(), {
  user: undefined,
  initialProject: undefined,
});

type ViewType = 'dashboard' | 'work-detail' | 'instrument-detail' | 'evaluations' | 'weekly-evaluations' | 'analytics' | 'calendar' | 'musical-tools' | 'users' | 'permissions'

const { currentProject, projects, projectStats, loadProjects, selectProject } = useMontaje();
const { themeClasses } = useTheme();
const { isMobile, textClasses } = useResponsive();

const currentView = ref<ViewType>('dashboard');
const currentWork = ref<MusicalWork | null>(null);
const selectedInstrument = ref<Instrument | null>(null);
const showCreateProject = ref(false);

// Función para verificar permisos
const hasPermission = (resource: string, action: string): boolean => {
  if (!props.user?.permissions) return true; // Si no hay permisos definidos, permitir todo
  return props.user.permissions.includes(`${resource}:${action}`) ||
         props.user.permissions.includes(`${resource}:*`) ||
         props.user.permissions.includes('*:*');
};

const onWorkSelected = (work: MusicalWork) => {
  currentWork.value = work;
  currentView.value = 'work-detail';
  selectedInstrument.value = null;
};

const onInstrumentSelected = (instrument: Instrument) => {
  selectedInstrument.value = instrument;
  currentView.value = 'instrument-detail';
};

const goToDashboard = () => {
  currentView.value = 'dashboard';
  currentWork.value = null;
  selectedInstrument.value = null;
};

const onProjectCreated = (project: any) => {
  showCreateProject.value = false;
  selectProject(project.id);
};

onMounted(async () => {
  await loadProjects();
  
  // Si se proporciona un proyecto inicial, seleccionarlo
  if (props.initialProject) {
    selectProject(props.initialProject);
  }
});
</script>