<template>
  <div class="admin-layout h-screen flex bg-gray-50 dark:bg-gray-900">
    <!-- Mobile menu overlay -->
    <div v-show="isMobileMenuOpen" class="fixed inset-0 z-40 lg:hidden">
      <div class="fixed inset-0" @click="closeMobileMenu">
        <div class="absolute inset-0 bg-gray-600 opacity-75"></div>
      </div>
    </div>

    <!-- Sidebar -->
    <AdminSidebar
      :is-mobile-menu-open="isMobileMenuOpen"
      @close-mobile-menu="closeMobileMenu"
      @logout="handleLogout"
    />

    <!-- Main content area -->
    <div class="flex-1 flex flex-col min-w-0 lg:ml-64">
      <!-- Top navigation bar -->
      <nav class="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700 lg:hidden">
        <div class="px-4 py-3">
          <div class="flex items-center justify-between">
            <!-- Mobile menu button -->
            <button
              type="button"
              class="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              @click="openMobileMenu"
            >
              <Bars3Icon class="h-6 w-6" />
            </button>

            <!-- Mobile logo/title -->
            <div class="flex items-center space-x-2">
              <AcademicCapIcon class="h-6 w-6 text-blue-600" />
              <span class="text-lg font-semibold text-gray-900 dark:text-white">Admin</span>
            </div>

            <!-- Mobile notifications -->
            <div class="flex items-center space-x-2">
              <NotificationCenter />
            </div>
          </div>
        </div>
      </nav>

      <!-- Desktop top bar -->
      <header class="hidden lg:block bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div class="px-6 py-4">
          <div class="flex items-center justify-between">
            <!-- Breadcrumb -->
            <div class="flex items-center space-x-4">
              <Breadcrumb :items="breadcrumbItems" />
            </div>

            <!-- Right side actions -->
            <div class="flex items-center space-x-4">
              <!-- Search (global) -->
              <div class="relative">
                <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <MagnifyingGlassIcon class="h-4 w-4 text-gray-400" />
                </div>
                <input
                  v-model="globalSearchQuery"
                  type="text"
                  placeholder="Búsqueda global..."
                  class="block w-80 pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md leading-5 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  @keyup.enter="handleGlobalSearch"
                />
              </div>

              <!-- Theme toggle -->
              <button
                @click="toggleTheme"
                class="p-2 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 rounded-md transition-colors"
              >
                <SunIcon v-if="isDarkMode" class="h-5 w-5" />
                <MoonIcon v-else class="h-5 w-5" />
              </button>

              <!-- Notifications -->
              <NotificationCenter />

              <!-- User menu -->
              <UserMenu />
            </div>
          </div>
        </div>
      </header>

      <!-- Page content -->
      <main class="flex-1 overflow-y-auto focus:outline-none">
        <div class="relative">
          <!-- Loading overlay -->
          <div v-if="isPageLoading" class="absolute inset-0 bg-white dark:bg-gray-900 bg-opacity-75 dark:bg-opacity-75 flex items-center justify-center z-50">
            <div class="flex flex-col items-center">
              <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <p class="mt-2 text-sm text-gray-600 dark:text-gray-400">Cargando...</p>
            </div>
          </div>

          <!-- Router view -->
          <router-view v-slot="{ Component, route }">
            <transition
              name="page"
              enter-active-class="transition ease-out duration-200"
              enter-from-class="opacity-0 translate-x-4"
              enter-to-class="opacity-100 translate-x-0"
              leave-active-class="transition ease-in duration-150"
              leave-from-class="opacity-100 translate-x-0"
              leave-to-class="opacity-0 -translate-x-4"
              mode="out-in"
            >
              <div :key="route.path">
                <component :is="Component" />
              </div>
            </transition>
          </router-view>
        </div>
      </main>

      <!-- Footer -->
      <footer class="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 px-6 py-3">
        <div class="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400">
          <div class="flex items-center space-x-4">
            <span>© 2025 Academia Musical</span>
            <span>v2.1.0</span>
          </div>
          <div class="flex items-center space-x-4">
            <button class="hover:text-gray-900 dark:hover:text-white transition-colors">
              Ayuda
            </button>
            <button class="hover:text-gray-900 dark:hover:text-white transition-colors">
              Soporte
            </button>
            <div class="flex items-center space-x-1">
              <div class="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span>Sistema activo</span>
            </div>
          </div>
        </div>
      </footer>
    </div>

    <!-- Global modals -->
    <GlobalModal v-if="showGlobalModal" @close="showGlobalModal = false" />
    
    <!-- Toast notifications -->
    <ToastNotifications />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { 
  Bars3Icon, 
  AcademicCapIcon, 
  MagnifyingGlassIcon, 
  SunIcon, 
  MoonIcon 
} from '@heroicons/vue/24/outline';

// Components
import AdminSidebar from '../components/AdminSidebar.vue';
import NotificationCenter from '../components/NotificationCenter.vue';
import Breadcrumb from '../components/ui/Breadcrumb.vue';
import UserMenu from '../components/ui/UserMenu.vue';
import GlobalModal from '../components/ui/GlobalModal.vue';
import ToastNotifications from '../components/ui/ToastNotifications.vue';

// Stores
import { useAuthStore } from '../../../stores/auth';
import { useThemeStore } from '../../../stores/theme';
import { useNotificationsStore } from '../store/notifications';

// Composables
import { useBreadcrumb } from '../composables/useBreadcrumb';
import { useGlobalSearch } from '../composables/useGlobalSearch';

const route = useRoute();
const router = useRouter();
const authStore = useAuthStore();
const themeStore = useThemeStore();
const notificationsStore = useNotificationsStore();

// State
const isMobileMenuOpen = ref(false);
const isPageLoading = ref(false);
const showGlobalModal = ref(false);
const globalSearchQuery = ref('');

// Composables
const { breadcrumbItems } = useBreadcrumb();
const { performGlobalSearch } = useGlobalSearch();

// Computed
const isDarkMode = computed(() => themeStore.isDarkMode);

// Methods
const openMobileMenu = () => {
  isMobileMenuOpen.value = true;
};

const closeMobileMenu = () => {
  isMobileMenuOpen.value = false;
};

const toggleTheme = () => {
  themeStore.toggleTheme();
};

const handleLogout = async () => {
  try {
    await authStore.logout();
    router.push('/login');
  } catch (error) {
    console.error('Error during logout:', error);
  }
};

const handleGlobalSearch = async () => {
  if (globalSearchQuery.value.trim()) {
    await performGlobalSearch(globalSearchQuery.value);
  }
};

// Loading states management
const handleRouteChange = () => {
  isPageLoading.value = true;
  setTimeout(() => {
    isPageLoading.value = false;
  }, 300);
};

// Watch route changes
watch(() => route.path, () => {
  closeMobileMenu();
  handleRouteChange();
});

// Initialize notifications
onMounted(async () => {
  try {
    await notificationsStore.loadNotifications();
  } catch (error) {
    console.error('Error loading notifications:', error);
  }
});

// Handle keyboard shortcuts
const handleKeyboardShortcuts = (event: KeyboardEvent) => {
  // Global search shortcut (Ctrl/Cmd + K)
  if ((event.ctrlKey || event.metaKey) && event.key === 'k') {
    event.preventDefault();
    const searchInput = document.querySelector('input[placeholder="Búsqueda global..."]') as HTMLInputElement;
    searchInput?.focus();
  }
  
  // Toggle sidebar on mobile (Ctrl/Cmd + B)
  if ((event.ctrlKey || event.metaKey) && event.key === 'b') {
    event.preventDefault();
    if (window.innerWidth < 1024) {
      isMobileMenuOpen.value = !isMobileMenuOpen.value;
    }
  }
};

onMounted(() => {
  document.addEventListener('keydown', handleKeyboardShortcuts);
});
</script>

<style scoped>
.admin-layout {
  font-family: 'Inter', system-ui, -apple-system, sans-serif;
}

/* Page transitions */
.page-enter-active,
.page-leave-active {
  transition: all 0.2s ease;
}

.page-enter-from {
  opacity: 0;
  transform: translateX(16px);
}

.page-leave-to {
  opacity: 0;
  transform: translateX(-16px);
}

/* Scrollbar styling */
main::-webkit-scrollbar {
  width: 6px;
}

main::-webkit-scrollbar-track {
  background: #f3f4f6;
}

.dark main::-webkit-scrollbar-track {
  background: #374151;
}

main::-webkit-scrollbar-thumb {
  background: #d1d5db;
  border-radius: 3px;
}

.dark main::-webkit-scrollbar-thumb {
  background: #4b5563;
}

main::-webkit-scrollbar-thumb:hover {
  background: #9ca3af;
}

.dark main::-webkit-scrollbar-thumb:hover {
  background: #6b7280;
}

/* Loading overlay */
.loading-overlay {
  backdrop-filter: blur(2px);
}

/* Mobile optimizations */
@media (max-width: 1024px) {
  .admin-layout {
    overflow-x: hidden;
  }
}

/* Focus management for accessibility */
.admin-layout:focus-within {
  outline: none;
}

/* Animation for mobile menu */
@media (max-width: 1024px) {
  .sidebar-transition-enter-active,
  .sidebar-transition-leave-active {
    transition: transform 0.3s ease;
  }
  
  .sidebar-transition-enter-from,
  .sidebar-transition-leave-to {
    transform: translateX(-100%);
  }
}

/* High contrast mode support */
@media (prefers-contrast: high) {
  .admin-layout {
    --tw-border-opacity: 1;
  }
}

/* Reduced motion support */
@media (prefers-reduced-motion: reduce) {
  .page-enter-active,
  .page-leave-active,
  * {
    transition: none !important;
    animation: none !important;
  }
}
</style>