<template>
  <div class="min-h-screen bg-gray-50 dark:bg-gray-900">
    <!-- Header -->
    <div
      class="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-10"
    >
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <button
          class="inline-flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors mb-4"
          @click="$router.back()"
        >
          <ArrowLeftIcon class="w-5 h-5" />
          Volver
        </button>

        <div class="space-y-4">
          <h1 class="text-2xl font-bold text-gray-900 dark:text-white">
            Recomendaciones Personalizadas
          </h1>
          <div v-if="student" class="flex items-center">
            <StudentAvatar
              :first-name="student.nombre"
              :last-name="student.apellido"
              size="sm"
              class="mr-3"
            />
            <div>
              <h2 class="text-lg font-semibold text-gray-900 dark:text-white">
                {{ student.nombre }} {{ student.apellido }}
              </h2>
              <p class="text-sm text-gray-600 dark:text-gray-400">
                {{ student.instrumento }} • {{ student.clase }}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Content -->
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div v-if="loading" class="text-center py-12">
        <div
          class="animate-spin h-8 w-8 border-2 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"
        />
        <p>Generando recomendaciones personalizadas...</p>
      </div>

      <div v-else-if="error" class="text-center py-12">
        <ExclamationTriangleIcon class="w-12 h-12 text-red-500 mx-auto mb-4" />
        <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-2">
          Error al cargar las recomendaciones
        </h3>
        <p class="text-gray-600 dark:text-gray-400 mb-4">{{ error }}</p>
        <button
          class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          @click="refresh"
        >
          Reintentar
        </button>
      </div>

      <div v-else class="space-y-8">
        <!-- Quick Actions -->
        <div
          class="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6"
        >
          <h3
            class="flex items-center gap-2 text-lg font-semibold text-gray-900 dark:text-white mb-6"
          >
            <BoltIcon class="w-5 h-5" />
            Acciones Rápidas
          </h3>

          <div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <button
              class="flex flex-col items-center gap-2 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors text-gray-700 dark:text-gray-300"
              @click="scheduleFollowUp"
            >
              <CalendarIcon class="w-6 h-6" />
              <span>Programar Seguimiento</span>
            </button>

            <button
              class="flex flex-col items-center gap-2 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors text-gray-700 dark:text-gray-300"
              @click="sendToParents"
            >
              <EnvelopeIcon class="w-6 h-6" />
              <span>Notificar a Padres</span>
            </button>

            <button
              class="flex flex-col items-center gap-2 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors text-gray-700 dark:text-gray-300"
              @click="createStudyPlan"
            >
              <DocumentTextIcon class="w-6 h-6" />
              <span>Plan de Estudio</span>
            </button>

            <button
              class="flex flex-col items-center gap-2 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors text-gray-700 dark:text-gray-300"
              @click="viewResources"
            >
              <BookOpenIcon class="w-6 h-6" />
              <span>Recursos Adicionales</span>
            </button>
          </div>
        </div>

        <!-- Recommendations by Category -->
        <div class="space-y-6">
          <div
            v-for="category in recommendationCategories"
            :key="category.id"
            class="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden"
          >
            <div class="flex items-center gap-4 p-6 bg-gray-50 dark:bg-gray-700">
              <div
                class="flex-shrink-0 w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center text-blue-600 dark:text-blue-400"
              >
                <component :is="category.icon" class="w-6 h-6" />
              </div>
              <div class="flex-1">
                <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
                  {{ category.title }}
                </h3>
                <p class="text-gray-600 dark:text-gray-400">{{ category.description }}</p>
              </div>
              <div class="flex-shrink-0">
                <span
                  :class="[
                    'px-2 py-1 text-xs font-medium rounded-full',
                    category.priority === 'high'
                      ? 'bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300'
                      : category.priority === 'medium'
                        ? 'bg-yellow-100 dark:bg-yellow-900 text-yellow-700 dark:text-yellow-300'
                        : 'bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300',
                  ]"
                >
                  {{ getPriorityLabel(category.priority) }}
                </span>
              </div>
            </div>

            <div class="p-6 space-y-4">
              <div
                v-for="(recommendation, index) in category.recommendations"
                :key="index"
                class="border border-gray-200 dark:border-gray-600 rounded-lg p-4"
              >
                <div class="space-y-3 mb-4">
                  <h4 class="font-semibold text-gray-900 dark:text-white">
                    {{ recommendation.title }}
                  </h4>
                  <p class="text-gray-600 dark:text-gray-400">{{ recommendation.description }}</p>

                  <div v-if="recommendation.metrics" class="flex gap-4 text-sm">
                    <div
                      v-for="metric in recommendation.metrics"
                      :key="metric.label"
                      class="space-x-1"
                    >
                      <span class="text-gray-600 dark:text-gray-400">{{ metric.label }}:</span>
                      <span class="font-semibold text-gray-900 dark:text-white">{{
                        metric.value
                      }}</span>
                    </div>
                  </div>

                  <div
                    v-if="recommendation.timeline"
                    class="flex items-center gap-2 text-sm text-blue-600 dark:text-blue-400"
                  >
                    <ClockIcon class="w-4 h-4" />
                    <span>{{ recommendation.timeline }}</span>
                  </div>
                </div>

                <div class="flex gap-2">
                  <button
                    v-for="action in recommendation.actions"
                    :key="action.id"
                    :class="[
                      'flex items-center gap-2 px-3 py-2 text-sm rounded-lg transition-colors',
                      action.type === 'primary'
                        ? 'bg-blue-600 text-white hover:bg-blue-700'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600',
                    ]"
                    @click="executeAction(action, recommendation)"
                  >
                    <component :is="action.icon" class="w-4 h-4" />
                    {{ action.label }}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Progress Tracking -->
        <div
          class="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6"
        >
          <h3
            class="flex items-center gap-2 text-lg font-semibold text-gray-900 dark:text-white mb-6"
          >
            <ChartBarIcon class="w-5 h-5" />
            Seguimiento de Progreso
          </h3>

          <div class="space-y-6">
            <div v-for="item in progressItems" :key="item.id" class="space-y-3">
              <div class="flex items-center justify-between">
                <h4 class="font-semibold text-gray-900 dark:text-white">{{ item.title }}</h4>
                <span class="text-sm font-medium text-gray-600 dark:text-gray-400"
                  >{{ item.progress }}%</span
                >
              </div>

              <div class="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                <div
                  class="h-full transition-all duration-300"
                  :style="{
                    width: `${item.progress}%`,
                    backgroundColor: getProgressColor(item.progress),
                  }"
                />
              </div>

              <div class="space-y-1">
                <p class="text-sm text-gray-600 dark:text-gray-400">{{ item.description }}</p>
                <p class="text-sm font-medium text-blue-600 dark:text-blue-400">
                  Próximo paso: {{ item.nextStep }}
                </p>
              </div>
            </div>
          </div>
        </div>

        <!-- Goals and Milestones -->
        <div
          class="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6"
        >
          <h3
            class="flex items-center gap-2 text-lg font-semibold text-gray-900 dark:text-white mb-6"
          >
            <FlagIcon class="w-5 h-5" />
            Metas y Objetivos
          </h3>

          <div class="space-y-6">
            <div
              v-for="goal in goals"
              :key="goal.id"
              class="flex gap-4 p-4 border border-gray-200 dark:border-gray-600 rounded-lg"
            >
              <div class="flex-shrink-0">
                <component
                  :is="goal.completed ? CheckCircleIcon : ClockIcon"
                  :class="['w-6 h-6', goal.completed ? 'text-green-500' : 'text-yellow-500']"
                />
              </div>

              <div class="flex-1 space-y-3">
                <h4 class="font-semibold text-gray-900 dark:text-white">{{ goal.title }}</h4>
                <p class="text-gray-600 dark:text-gray-400">{{ goal.description }}</p>

                <div class="space-y-2">
                  <div
                    v-for="milestone in goal.milestones"
                    :key="milestone.id"
                    class="flex items-center gap-2"
                  >
                    <input
                      type="checkbox"
                      :checked="milestone.completed"
                      class="h-4 w-4 text-blue-600 rounded border-gray-300 dark:border-gray-600"
                      @change="toggleMilestone(goal.id, milestone.id)"
                    />
                    <span
                      :class="[
                        'text-sm text-gray-700 dark:text-gray-300',
                        milestone.completed ? 'line-through text-gray-500 dark:text-gray-400' : '',
                      ]"
                    >
                      {{ milestone.title }}
                    </span>
                  </div>
                </div>
              </div>

              <div class="flex-shrink-0 text-right">
                <span class="block text-xs text-gray-600 dark:text-gray-400">Meta:</span>
                <span class="block text-sm font-medium text-gray-900 dark:text-white">{{
                  formatDate(goal.deadline)
                }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import {
  ArrowLeftIcon,
  BoltIcon,
  CalendarIcon,
  EnvelopeIcon,
  DocumentTextIcon,
  BookOpenIcon,
  ChartBarIcon,
  FlagIcon,
  ClockIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  MusicalNoteIcon,
  UserGroupIcon,
  StarIcon,
  // TrendingUpIcon removed
} from '@heroicons/vue/24/outline';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { useStudentsStore } from '../../Students/store/students';
import { useStudentPerformance } from '../composables/useStudentPerformance';
import StudentAvatar from '../../Students/components/StudentAvatar.vue';

const route = useRoute();
const router = useRouter();
const studentsStore = useStudentsStore();

const studentId = route.params.id as string;
const student = computed(() => studentsStore.students.find((s) => s.id === studentId));

const { performanceData, loading, error, refresh } = useStudentPerformance(studentId);

// Mock data for demonstration
const recommendationCategories = ref([
  {
    id: 'attendance',
    title: 'Asistencia',
    description: 'Mejorar la regularidad en las clases',
    icon: CalendarIcon,
    priority: 'high',
    recommendations: [
      {
        title: 'Establecer rutina de asistencia',
        description:
          'Se recomienda crear un horario fijo para las clases de música y establecer recordatorios.',
        metrics: [
          { label: 'Asistencia actual', value: '75%' },
          { label: 'Meta', value: '90%' },
        ],
        timeline: 'Implementar en 2 semanas',
        actions: [
          { id: 'schedule', label: 'Crear Horario', type: 'primary', icon: CalendarIcon },
          {
            id: 'reminders',
            label: 'Configurar Recordatorios',
            type: 'secondary',
            icon: EnvelopeIcon,
          },
        ],
      },
    ],
  },
  {
    id: 'practice',
    title: 'Práctica Musical',
    description: 'Optimizar las sesiones de práctica',
    icon: MusicalNoteIcon,
    priority: 'medium',
    recommendations: [
      {
        title: 'Incrementar tiempo de práctica diaria',
        description: 'Aumentar gradualmente el tiempo de práctica de 15 a 30 minutos diarios.',
        metrics: [
          { label: 'Práctica actual', value: '15 min/día' },
          { label: 'Meta', value: '30 min/día' },
        ],
        timeline: 'Progreso gradual en 4 semanas',
        actions: [
          { id: 'plan', label: 'Crear Plan', type: 'primary', icon: DocumentTextIcon },
          { id: 'track', label: 'Seguir Progreso', type: 'secondary', icon: ChartBarIcon },
        ],
      },
    ],
  },
]);

const progressItems = ref([
  {
    id: 'attendance',
    title: 'Mejora en Asistencia',
    progress: 75,
    description: 'Ha asistido regularmente las últimas 3 semanas',
    nextStep: 'Mantener la constancia durante un mes completo',
  },
  {
    id: 'technique',
    title: 'Técnica Instrumental',
    progress: 60,
    description: 'Progreso notable en escalas y ejercicios básicos',
    nextStep: 'Practicar ejercicios de agilidad',
  },
]);

const goals = ref([
  {
    id: 'concert',
    title: 'Participar en Concierto de Fin de Año',
    description: 'Prepararse para la presentación del concierto anual',
    deadline: new Date('2024-12-15'),
    completed: false,
    milestones: [
      { id: 'piece1', title: 'Dominar primera pieza', completed: true },
      { id: 'piece2', title: 'Aprender segunda pieza', completed: false },
      { id: 'ensemble', title: 'Practicar con conjunto', completed: false },
      { id: 'performance', title: 'Ensayo general', completed: false },
    ],
  },
]);

const getPriorityLabel = (priority: string): string => {
  switch (priority) {
  case 'high':
    return 'Alta';
  case 'medium':
    return 'Media';
  case 'low':
    return 'Baja';
  default:
    return priority;
  }
};

const getProgressColor = (progress: number): string => {
  if (progress >= 80) return '#10b981'; // green-500
  if (progress >= 60) return '#f59e0b'; // amber-500
  if (progress >= 40) return '#f97316'; // orange-500
  return '#ef4444'; // red-500
};

const formatDate = (date: Date): string => {
  return format(date, 'dd MMMM yyyy', { locale: es });
};

// Action handlers
const scheduleFollowUp = () => {
  console.log('Programar seguimiento');
  // TODO: Implement follow-up scheduling
};

const sendToParents = () => {
  console.log('Enviar notificación a padres');
  // TODO: Implement parent notification
};

const createStudyPlan = () => {
  console.log('Crear plan de estudio');
  // TODO: Implement study plan creation
};

const viewResources = () => {
  console.log('Ver recursos adicionales');
  // TODO: Navigate to resources view
};

const executeAction = (action: any, recommendation: any) => {
  console.log('Ejecutar acción:', action, recommendation);
  // TODO: Implement action handlers
};

const toggleMilestone = (goalId: string, milestoneId: string) => {
  const goal = goals.value.find((g) => g.id === goalId);
  if (goal) {
    const milestone = goal.milestones.find((m) => m.id === milestoneId);
    if (milestone) {
      milestone.completed = !milestone.completed;
    }
  }
};

onMounted(() => {
  if (!student.value) {
    studentsStore.fetchStudents();
  }
});
</script>

<style scoped>
/* All @apply rules have been moved to the template's class attributes. */
/* Styles for dynamically bound classes or complex selectors can remain if not convertible to pure Tailwind utilities. */

/* Example: if getProgressColor was returning Tailwind class names, those would be applied directly.
   Since it returns hex codes for direct style binding, this is fine. */

/* Any remaining specific styles that are not covered by Tailwind utilities can go here.
   For instance, if there were custom animations or very specific layout tweaks not achievable
   with Tailwind's default set of utilities. */
</style>
