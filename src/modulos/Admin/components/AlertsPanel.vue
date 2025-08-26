<template>
  <div v-if="alerts.length > 0" class="alerts-panel space-y-4">
    <h3 class="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
      <ExclamationTriangleIcon class="w-5 h-5 mr-2 text-yellow-600" />
      Alertas del Sistema
    </h3>
    
    <div class="space-y-3">
      <div
        v-for="alert in alerts"
        :key="alert.id"
        class="alert-card rounded-lg border p-4 transition-all duration-200 hover:shadow-md"
        :class="alertClasses(alert.type)"
      >
        <div class="flex items-start space-x-3">
          <!-- Alert Icon -->
          <div class="flex-shrink-0">
            <div :class="alertIconClasses(alert.type)" class="w-8 h-8 rounded-full flex items-center justify-center">
              <component :is="alertIcon(alert.type)" class="w-4 h-4" />
            </div>
          </div>

          <!-- Alert Content -->
          <div class="flex-1 min-w-0">
            <div class="flex items-start justify-between">
              <div class="flex-1">
                <h4 :class="alertTitleClasses(alert.type)" class="text-sm font-medium">
                  {{ alert.title }}
                </h4>
                <p :class="alertMessageClasses(alert.type)" class="text-sm mt-1">
                  {{ alert.message }}
                </p>
              </div>
              
              <!-- Dismiss Button -->
              <button
                @click="dismissAlert(alert.id)"
                class="flex-shrink-0 ml-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
              >
                <XMarkIcon class="w-4 h-4" />
              </button>
            </div>

            <!-- Action Button -->
            <div v-if="alert.action" class="mt-3">
              <button
                @click="handleAlertAction(alert)"
                :class="alertActionClasses(alert.type)"
                class="text-sm font-medium px-3 py-1 rounded-md transition-colors duration-200"
              >
                {{ alert.action }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useRouter } from 'vue-router';
import {
  ExclamationTriangleIcon,
  InformationCircleIcon,
  CheckCircleIcon,
  XCircleIcon,
  XMarkIcon,
} from '@heroicons/vue/24/outline';

interface Alert {
  id: number;
  type: 'info' | 'warning' | 'error' | 'success';
  title: string;
  message: string;
  action?: string;
  actionUrl?: string;
}

interface Props {
  alerts: Alert[];
}

const props = defineProps<Props>();
const router = useRouter();

const emit = defineEmits<{
  dismissAlert: [id: number];
}>();

// Alert styling functions
const alertClasses = (type: string) => {
  const classes = {
    info: 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800',
    warning: 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800',
    error: 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800',
    success: 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800',
  };
  return classes[type as keyof typeof classes] || classes.info;
};

const alertIconClasses = (type: string) => {
  const classes = {
    info: 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400',
    warning: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400',
    error: 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400',
    success: 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400',
  };
  return classes[type as keyof typeof classes] || classes.info;
};

const alertTitleClasses = (type: string) => {
  const classes = {
    info: 'text-blue-900 dark:text-blue-200',
    warning: 'text-yellow-900 dark:text-yellow-200',
    error: 'text-red-900 dark:text-red-200',
    success: 'text-green-900 dark:text-green-200',
  };
  return classes[type as keyof typeof classes] || classes.info;
};

const alertMessageClasses = (type: string) => {
  const classes = {
    info: 'text-blue-800 dark:text-blue-300',
    warning: 'text-yellow-800 dark:text-yellow-300',
    error: 'text-red-800 dark:text-red-300',
    success: 'text-green-800 dark:text-green-300',
  };
  return classes[type as keyof typeof classes] || classes.info;
};

const alertActionClasses = (type: string) => {
  const classes = {
    info: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 hover:bg-blue-200 dark:hover:bg-blue-900/50',
    warning: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300 hover:bg-yellow-200 dark:hover:bg-yellow-900/50',
    error: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 hover:bg-red-200 dark:hover:bg-red-900/50',
    success: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 hover:bg-green-200 dark:hover:bg-green-900/50',
  };
  return classes[type as keyof typeof classes] || classes.info;
};

const alertIcon = (type: string) => {
  const icons = {
    info: InformationCircleIcon,
    warning: ExclamationTriangleIcon,
    error: XCircleIcon,
    success: CheckCircleIcon,
  };
  return icons[type as keyof typeof icons] || InformationCircleIcon;
};

// Methods
const dismissAlert = (id: number) => {
  emit('dismissAlert', id);
};

const handleAlertAction = (alert: Alert) => {
  if (alert.actionUrl) {
    router.push(alert.actionUrl);
  }
  // Optionally dismiss the alert after action
  dismissAlert(alert.id);
};
</script>

<style scoped>
.alert-card {
  position: relative;
  overflow: hidden;
}

.alert-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 4px;
  height: 100%;
  background-color: currentColor;
  opacity: 0.3;
}

/* Pulse animation for high priority alerts */
.alert-card.bg-red-50::before {
  animation: pulse 2s infinite;
}

.dark .alert-card.bg-red-900\\/20::before {
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0%, 100% {
    opacity: 0.3;
  }
  50% {
    opacity: 0.7;
  }
}

/* Smooth transitions */
.alert-card {
  transition: all 0.2s ease;
}

.alert-card:hover {
  transform: translateY(-1px);
}
</style>