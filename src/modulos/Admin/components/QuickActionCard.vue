<template>
  <div
    v-if="hasPermission"
    class="quick-action-card group relative overflow-hidden bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 transition-all duration-300 cursor-pointer shadow-sm hover:shadow-lg"
    :class="cardClasses"
    @click="handleClick"
  >
    <!-- Gradient Background -->
    <div
      class="absolute inset-0 opacity-0 group-hover:opacity-5 transition-opacity duration-300"
      :class="gradientClass"
    />

    <!-- Content -->
    <div class="relative p-6">
      <!-- Icon -->
      <div class="flex items-center justify-between mb-4">
        <div class="p-3 rounded-lg transition-colors duration-300" :class="iconBgClass">
          <component
            :is="iconComponent"
            class="w-6 h-6 transition-colors duration-300"
            :class="iconClass"
          />
        </div>

        <!-- Action Indicator -->
        <div
          class="w-2 h-2 rounded-full transition-all duration-300 opacity-0 group-hover:opacity-100"
          :class="indicatorClass"
        />
      </div>

      <!-- Text Content -->
      <div>
        <h3
          class="font-semibold text-gray-900 dark:text-white mb-2 group-hover:text-opacity-90 transition-colors duration-300"
        >
          {{ title }}
        </h3>
        <p
          class="text-sm text-gray-600 dark:text-gray-400 group-hover:text-opacity-80 transition-colors duration-300"
        >
          {{ description }}
        </p>
      </div>

      <!-- Hover Arrow -->
      <div
        class="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transform translate-x-2 group-hover:translate-x-0 transition-all duration-300"
      >
        <ArrowRightIcon class="w-4 h-4" :class="iconClass" />
      </div>
    </div>

    <!-- Loading State -->
    <div
      v-if="loading"
      class="absolute inset-0 bg-white dark:bg-gray-800 bg-opacity-80 flex items-center justify-center"
    >
      <div
        class="animate-spin rounded-full h-6 w-6 border-2 border-gray-300 border-t-current"
        :class="iconClass"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import {computed, ref} from "vue"
import {useRBACStore} from "@/stores/rbacStore"
import {
  UserPlusIcon,
  AcademicCapIcon,
  UserGroupIcon,
  CalendarIcon,
  CogIcon,
  ChartBarIcon,
  ArrowRightIcon,
} from "@heroicons/vue/24/outline"

interface Props {
  title: string
  description: string
  icon: string
  color?: "blue" | "green" | "purple" | "orange" | "red" | "yellow" | "indigo"
  permission?: {module: string; action: string}
  loading?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  color: "blue",
  loading: false,
})

const emit = defineEmits<{
  click: []
}>()

const rbacStore = useRBACStore()

// Icon mapping
const iconComponents = {
  UserPlusIcon,
  AcademicCapIcon,
  UserGroupIcon,
  CalendarIcon,
  CogIcon,
  ChartBarIcon,
}

// Computed properties
const hasPermission = computed(() => {
  if (!props.permission) return true
  return rbacStore.hasPermission(props.permission.module, props.permission.action)
})

const iconComponent = computed(
  () => iconComponents[props.icon as keyof typeof iconComponents] || CogIcon
)

const cardClasses = computed(() => ({
  [`hover:border-${props.color}-200 dark:hover:border-${props.color}-600`]: true,
  "transform hover:scale-105": true,
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

const indicatorClass = computed(() => `bg-${props.color}-500`)

// Methods
const handleClick = () => {
  if (props.loading || !hasPermission.value) return
  emit("click")
}
</script>

<style scoped>
.quick-action-card {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.quick-action-card:hover {
  transform: translateY(-2px) scale(1.02);
}

/* Solo estilos que no pueden ser manejados por Tailwind */

.dark .group:hover .bg-red-900\/30 {
  background-color: rgb(153 27 27 / 0.3);
}
.dark .group:hover .bg-yellow-900\/30 {
  background-color: rgb(133 77 14 / 0.3);
}
.dark .group:hover .bg-indigo-900\/30 {
  background-color: rgb(55 48 163 / 0.3);
}
</style>
