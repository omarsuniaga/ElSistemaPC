<!-- src/components/Navigation/DynamicNavigation.vue -->

<template>
  <nav class="dynamic-navigation">
    <!-- Loading State -->
    <div v-if="loading" class="flex justify-center py-4">
      <div class="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600" />
    </div>

    <!-- Navigation Items -->
    <div v-else-if="navigationItems.length > 0" class="navigation-items">
      <div v-for="item in navigationItems" :key="item.id" class="navigation-item">
        <router-link
          :to="item.path"
          :class="['nav-link', {active: isCurrentRoute(item.path)}]"
          @click="handleNavClick(item)"
        >
          <span class="nav-icon">{{ item.icon }}</span>
          <span class="nav-text">{{ item.name }}</span>
        </router-link>
      </div>
    </div>

    <!-- No Navigation Available -->
    <div v-else class="no-navigation">
      <p class="text-gray-500 text-sm">No hay navegación disponible</p>
    </div>
  </nav>
</template>

<script setup lang="ts">
import {computed, onMounted, watch} from "vue"
import {useRoute} from "vue-router"
import {useNavigation} from "@/services/navigation/navigationService"
import {useAuthStore} from "@/stores/auth"

const props = defineProps({
  orientation: {
    type: String,
    default: "vertical", // 'vertical' | 'horizontal'
    validator: (value: string) => ["vertical", "horizontal"].includes(value),
  },
  showIcons: {
    type: Boolean,
    default: true,
  },
  compact: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits(["nav-click"])

const route = useRoute()
const authStore = useAuthStore()
const {navigationItems, loading, loadNavigation} = useNavigation()

// Methods
const isCurrentRoute = (path: string): boolean => {
  return route.path === path || route.path.startsWith(path + "/")
}

const handleNavClick = (item: any) => {
  emit("nav-click", item)
}

// Watchers
watch(
  () => authStore.user,
  async (newUser, oldUser) => {
    // Recargar navegación cuando cambie el usuario o su rol
    if (newUser && (!oldUser || newUser.role !== oldUser.role)) {
      await loadNavigation()
    }
  },
  {immediate: true}
)

// Lifecycle
onMounted(async () => {
  if (authStore.user) {
    await loadNavigation()
  }
})
</script>

<style scoped>
.dynamic-navigation {
  @apply p-2;
}

.navigation-items {
  @apply space-y-1;
}

.navigation-item {
  @apply relative;
}

.nav-link {
  @apply flex items-center px-3 py-2 text-sm font-medium rounded-md transition-all duration-200;
  @apply text-gray-700 hover:bg-gray-100 hover:text-gray-900;
  @apply dark:text-gray-300 dark:hover:bg-gray-700 dark:hover:text-white;
}

.nav-link.active {
  @apply bg-blue-100 text-blue-700 border-r-2 border-blue-500;
  @apply dark:bg-blue-900 dark:text-blue-200;
}

.nav-icon {
  @apply text-lg mr-3 flex-shrink-0;
}

.nav-text {
  @apply truncate;
}

/* Horizontal orientation */
.dynamic-navigation.horizontal .navigation-items {
  @apply flex space-x-2 space-y-0;
}

.dynamic-navigation.horizontal .nav-link {
  @apply flex-col text-center px-2 py-1;
}

.dynamic-navigation.horizontal .nav-icon {
  @apply mr-0 mb-1;
}

/* Compact mode */
.dynamic-navigation.compact .nav-link {
  @apply px-2 py-1 text-xs;
}

.dynamic-navigation.compact .nav-icon {
  @apply text-base mr-2;
}

/* No icons mode */
.dynamic-navigation.no-icons .nav-icon {
  @apply hidden;
}

.dynamic-navigation.no-icons .nav-text {
  @apply ml-0;
}

.no-navigation {
  @apply text-center py-4;
}
</style>
