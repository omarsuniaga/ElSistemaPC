<template>
  <div
    v-if="hasPermission"
    class="management-card group relative overflow-hidden bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 transition-all duration-300 cursor-pointer"
    :class="cardClasses"
    @click="navigateToRoute"
  >
    <!-- Gradient Overlay -->
    <div
      class="absolute inset-0 opacity-0 group-hover:opacity-5 transition-opacity duration-300"
      :class="gradientClass"
    />

    <!-- Content -->
    <div class="relative p-4">
      <!-- Header -->
      <div class="flex items-center justify-between mb-3">
        <div class="flex items-center space-x-3">
          <div class="p-2 rounded-lg transition-colors duration-300" :class="iconBgClass">
            <component
              :is="iconComponent"
              class="w-5 h-5 transition-colors duration-300"
              :class="iconClass"
            />
          </div>
          <div>
            <h4
              class="font-medium text-gray-900 dark:text-white group-hover:text-opacity-90 transition-colors duration-300"
            >
              {{ title }}
            </h4>
          </div>
        </div>

        <!-- Count Badge -->
        <div v-if="count !== undefined" class="flex items-center space-x-2">
          <div
            class="px-2 py-1 text-xs font-medium rounded-full transition-colors duration-300"
            :class="badgeClass"
          >
            {{ formatCount(count) }}
          </div>
          <ArrowRightIcon
            class="w-4 h-4 text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300 transform group-hover:translate-x-1 transition-all duration-300"
          />
        </div>
      </div>

      <!-- Description -->
      <p
        class="text-sm text-gray-600 dark:text-gray-400 group-hover:text-opacity-80 transition-colors duration-300 mb-4"
      >
        {{ description }}
      </p>

      <!-- Quick Stats or Actions -->
      <div v-if="stats || quickActions" class="flex items-center justify-between">
        <!-- Quick Stats -->
        <div v-if="stats" class="flex items-center space-x-4">
          <div v-for="stat in stats" :key="stat.label" class="text-center">
            <div class="text-sm font-semibold" :class="statValueClass">{{ stat.value }}</div>
            <div class="text-xs text-gray-500 dark:text-gray-400">{{ stat.label }}</div>
          </div>
        </div>

        <!-- Quick Actions -->
        <div v-if="quickActions" class="flex items-center space-x-1">
          <button
            v-for="action in quickActions"
            :key="action.id"
            class="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200"
            :title="action.tooltip"
            @click.stop="handleQuickAction(action)"
          >
            <component :is="action.icon" class="w-4 h-4" />
          </button>
        </div>
      </div>

      <!-- Progress Bar (if provided) -->
      <div v-if="progress !== undefined" class="mt-3">
        <div
          class="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 mb-1"
        >
          <span>Progreso</span>
          <span>{{ progress }}%</span>
        </div>
        <div class="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
          <div
            class="h-1.5 rounded-full transition-all duration-500"
            :class="progressBarClass"
            :style="{width: `${progress}%`}"
          />
        </div>
      </div>
    </div>

    <!-- Loading Overlay -->
    <div
      v-if="loading"
      class="absolute inset-0 bg-white dark:bg-gray-800 bg-opacity-80 flex items-center justify-center"
    >
      <div
        class="animate-spin rounded-full h-5 w-5 border-2 border-gray-300 border-t-current"
        :class="iconClass"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import {computed} from "vue"
import {useRouter} from "vue-router"
import {useRBACStore} from "@/stores/rbacStore"
import {
  UsersIcon,
  UserIcon,
  AcademicCapIcon,
  CalendarDaysIcon,
  ArrowRightIcon,
  PlusIcon,
  PencilIcon,
  ChartBarIcon,
} from "@heroicons/vue/24/outline"

interface QuickAction {
  id: string
  icon: any
  tooltip: string
  action: string
}

interface Stat {
  label: string
  value: string | number
}

interface Props {
  title: string
  description: string
  icon: string
  route: string
  count?: number
  color?: "blue" | "green" | "purple" | "orange" | "red" | "yellow" | "indigo"
  permission?: {module: string; action: string}
  loading?: boolean
  stats?: Stat[]
  quickActions?: QuickAction[]
  progress?: number
}

const props = withDefaults(defineProps<Props>(), {
  color: "blue",
  loading: false,
})

const emit = defineEmits<{
  quickAction: [action: QuickAction]
}>()

const router = useRouter()
const rbacStore = useRBACStore()

// Icon mapping
const iconComponents = {
  UsersIcon,
  UserIcon,
  AcademicCapIcon,
  CalendarDaysIcon,
  PlusIcon,
  PencilIcon,
  ChartBarIcon,
}

// Computed properties
const hasPermission = computed(() => {
  if (!props.permission) return true
  return rbacStore.hasPermission(props.permission.module, props.permission.action)
})

const iconComponent = computed(
  () => iconComponents[props.icon as keyof typeof iconComponents] || UsersIcon
)

const cardClasses = computed(() => ({
  "transform hover:scale-102 hover:shadow-lg": true,
  "cursor-not-allowed opacity-50": props.loading,
}))

const gradientClass = computed(
  () => `bg-gradient-to-br from-${props.color}-500 to-${props.color}-600`
)

const iconBgClass = computed(
  () =>
    `bg-${props.color}-50 dark:bg-${props.color}-900/20 group-hover:bg-${props.color}-100 dark:group-hover:bg-${props.color}-900/30`
)

const iconClass = computed(() => `text-${props.color}-600 dark:text-${props.color}-400`)

const badgeClass = computed(
  () =>
    `bg-${props.color}-100 dark:bg-${props.color}-900/30 text-${props.color}-800 dark:text-${props.color}-200`
)

const statValueClass = computed(() => `text-${props.color}-600 dark:text-${props.color}-400`)

const progressBarClass = computed(() => `bg-${props.color}-500`)

// Methods
const navigateToRoute = async () => {
  if (props.loading || !hasPermission.value) return

  try {
    await router.push(props.route)
  } catch (error) {
    console.error("Navigation error:", error)
  }
}

const handleQuickAction = (action: QuickAction) => {
  emit("quickAction", action)
}

const formatCount = (count: number): string => {
  if (count >= 1000000) {
    return `${(count / 1000000).toFixed(1)}M`
  } else if (count >= 1000) {
    return `${(count / 1000).toFixed(1)}K`
  }
  return count.toString()
}
</script>

<style scoped>
.management-card {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.management-card:hover {
  transform: translateY(-1px) scale(1.02);
}

/* Solo estilos que no pueden ser manejados por Tailwind */
</style>
