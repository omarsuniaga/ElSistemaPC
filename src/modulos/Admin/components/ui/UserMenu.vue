<template>
  <div class="user-menu relative" ref="userMenuRef">
    <!-- User menu button -->
    <button
      @click="toggleMenu"
      class="flex items-center space-x-2 p-2 text-sm rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
    >
      <img
        class="h-8 w-8 rounded-full object-cover"
        :src="userAvatar"
        :alt="userName"
      />
      <div class="hidden lg:block text-left">
        <div class="text-sm font-medium text-gray-900 dark:text-white">{{ userName }}</div>
        <div class="text-xs text-gray-500 dark:text-gray-400">{{ userRole }}</div>
      </div>
      <ChevronDownIcon class="hidden lg:block h-4 w-4 text-gray-400" />
    </button>

    <!-- Dropdown menu -->
    <Transition
      enter-active-class="transition ease-out duration-100"
      enter-from-class="transform opacity-0 scale-95"
      enter-to-class="transform opacity-100 scale-100"
      leave-active-class="transition ease-in duration-75"
      leave-from-class="transform opacity-100 scale-100"
      leave-to-class="transform opacity-0 scale-95"
    >
      <div
        v-show="isOpen"
        class="absolute right-0 mt-2 w-56 rounded-md shadow-lg bg-white dark:bg-gray-700 ring-1 ring-black ring-opacity-5 divide-y divide-gray-100 dark:divide-gray-600 focus:outline-none z-50"
      >
        <!-- User info section -->
        <div class="px-4 py-3">
          <p class="text-sm font-medium text-gray-900 dark:text-white">{{ userName }}</p>
          <p class="text-sm text-gray-500 dark:text-gray-400 truncate">{{ userEmail }}</p>
          <div class="mt-1">
            <span class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400">
              {{ userRole }}
            </span>
          </div>
        </div>

        <!-- Menu items -->
        <div class="py-1">
          <router-link
            to="/admin/profile"
            class="group flex items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
            @click="closeMenu"
          >
            <UserIcon class="mr-3 h-4 w-4 text-gray-400 group-hover:text-gray-500 dark:group-hover:text-gray-300" />
            Mi Perfil
          </router-link>

          <router-link
            to="/admin/settings"
            class="group flex items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
            @click="closeMenu"
          >
            <CogIcon class="mr-3 h-4 w-4 text-gray-400 group-hover:text-gray-500 dark:group-hover:text-gray-300" />
            Configuración
          </router-link>

          <router-link
            to="/admin/notifications"
            class="group flex items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
            @click="closeMenu"
          >
            <BellIcon class="mr-3 h-4 w-4 text-gray-400 group-hover:text-gray-500 dark:group-hover:text-gray-300" />
            Notificaciones
            <span v-if="unreadNotifications > 0" class="ml-auto inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white bg-red-600 rounded-full">
              {{ unreadNotifications }}
            </span>
          </router-link>
        </div>

        <!-- Activity section -->
        <div class="py-1">
          <div class="px-4 py-2">
            <div class="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider font-medium mb-2">
              Actividad
            </div>
            <div class="space-y-1">
              <div class="text-xs text-gray-600 dark:text-gray-300">
                Última sesión: {{ lastLoginFormatted }}
              </div>
              <div class="text-xs text-gray-600 dark:text-gray-300">
                Sesiones activas: {{ activeSessions }}
              </div>
            </div>
          </div>
        </div>

        <!-- Theme toggle -->
        <div class="py-1">
          <button
            @click="toggleTheme"
            class="group flex items-center w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
          >
            <SunIcon v-if="isDarkMode" class="mr-3 h-4 w-4 text-gray-400 group-hover:text-gray-500 dark:group-hover:text-gray-300" />
            <MoonIcon v-else class="mr-3 h-4 w-4 text-gray-400 group-hover:text-gray-500 dark:group-hover:text-gray-300" />
            {{ isDarkMode ? 'Modo Claro' : 'Modo Oscuro' }}
          </button>
        </div>

        <!-- Sign out -->
        <div class="py-1">
          <button
            @click="handleLogout"
            class="group flex items-center w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
          >
            <ArrowRightOnRectangleIcon class="mr-3 h-4 w-4 text-gray-400 group-hover:text-red-500" />
            Cerrar Sesión
          </button>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue';
import {
  ChevronDownIcon,
  UserIcon,
  CogIcon,
  BellIcon,
  SunIcon,
  MoonIcon,
  ArrowRightOnRectangleIcon,
} from '@heroicons/vue/24/outline';

// Stores (mock for now)
import { useAuthStore } from '../../../../stores/auth';
import { useThemeStore } from '../../../../stores/theme';
import { useNotificationsStore } from '../../store/notifications';

const authStore = useAuthStore();
const themeStore = useThemeStore();
const notificationsStore = useNotificationsStore();

// State
const isOpen = ref(false);
const userMenuRef = ref<HTMLElement>();

// Mock user data (replace with real store data)
const userName = computed(() => authStore.user?.name || 'Usuario Admin');
const userEmail = computed(() => authStore.user?.email || 'admin@academia.com');
const userRole = computed(() => authStore.user?.role || 'Super Admin');
const userAvatar = computed(() => 
  authStore.user?.avatar || 
  `https://ui-avatars.com/api/?name=${userName.value}&background=3b82f6&color=fff`
);

// Theme
const isDarkMode = computed(() => themeStore.isDarkMode);

// Notifications
const unreadNotifications = computed(() => notificationsStore.unreadCount);

// Activity data (mock)
const lastLoginFormatted = computed(() => {
  const lastLogin = authStore.user?.lastLogin || new Date();
  return new Intl.DateTimeFormat('es-ES', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit'
  }).format(lastLogin);
});

const activeSessions = computed(() => authStore.user?.activeSessions || 1);

// Methods
const toggleMenu = () => {
  isOpen.value = !isOpen.value;
};

const closeMenu = () => {
  isOpen.value = false;
};

const toggleTheme = () => {
  themeStore.toggleTheme();
  closeMenu();
};

const handleLogout = async () => {
  try {
    await authStore.logout();
    closeMenu();
    // Navigation will be handled by the parent component
  } catch (error) {
    console.error('Error during logout:', error);
  }
};

// Click outside to close
const handleClickOutside = (event: Event) => {
  if (userMenuRef.value && !userMenuRef.value.contains(event.target as Node)) {
    closeMenu();
  }
};

// Lifecycle
onMounted(() => {
  document.addEventListener('click', handleClickOutside);
});

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside);
});
</script>

<style scoped>
.user-menu {
  position: relative;
}

/* Smooth transitions */
button {
  transition: all 0.2s ease;
}

/* Focus styles for accessibility */
button:focus {
  outline: none;
}

/* Dropdown shadow enhancement */
.user-menu div[class*="shadow-lg"] {
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
}

.dark .user-menu div[class*="shadow-lg"] {
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.3), 0 4px 6px -2px rgba(0, 0, 0, 0.2);
}

/* Avatar hover effect */
img:hover {
  transform: scale(1.05);
  transition: transform 0.2s ease;
}

/* Menu item hover effects */
.group:hover {
  transform: translateX(2px);
}

/* Badge animation */
.bg-red-600 {
  animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}

@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: .8;
  }
}

/* Responsive adjustments */
@media (max-width: 1024px) {
  .user-menu div[class*="w-56"] {
    width: 14rem;
    right: 0;
    left: auto;
  }
}
</style>