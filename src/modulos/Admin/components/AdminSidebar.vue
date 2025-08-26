<template>
  <div class="admin-sidebar">
    <!-- Sidebar para pantallas grandes -->
    <div class="hidden lg:flex lg:w-64 lg:flex-col">
      <div class="flex min-h-0 flex-1 flex-col bg-gradient-to-b from-blue-800 to-blue-900 shadow-xl">
        <!-- Logo/Header -->
        <div class="flex h-16 flex-shrink-0 items-center px-4">
          <div class="flex items-center space-x-3">
            <div class="bg-white/10 p-2 rounded-lg">
              <AcademicCapIcon class="h-8 w-8 text-white" />
            </div>
            <div class="text-white">
              <h1 class="text-lg font-bold">Admin Panel</h1>
              <p class="text-xs text-blue-200">Academia Musical</p>
            </div>
          </div>
        </div>

        <!-- Navigation Menu -->
        <nav class="flex-1 px-3 py-6 space-y-1">
          <!-- Dashboard -->
          <router-link
            to="/admin/dashboard"
            :class="navigationItemClass('/admin/dashboard')"
          >
            <ChartBarIcon class="w-5 h-5" />
            <span>Dashboard</span>
            <span v-if="pendingTasksCount" class="notification-badge">
              {{ pendingTasksCount }}
            </span>
          </router-link>

          <!-- Gestión de Estudiantes -->
          <div class="nav-section">
            <h3 class="nav-section-title">Gestión Académica</h3>
            
            <router-link
              to="/admin/students"
              :class="navigationItemClass('/admin/students')"
            >
              <UserGroupIcon class="w-5 h-5" />
              <span>Estudiantes</span>
              <span v-if="studentsCount" class="count-badge">
                {{ studentsCount }}
              </span>
            </router-link>

            <router-link
              to="/admin/teachers"
              :class="navigationItemClass('/admin/teachers')"
            >
              <UserIcon class="w-5 h-5" />
              <span>Maestros</span>
              <span v-if="teachersCount" class="count-badge">
                {{ teachersCount }}
              </span>
            </router-link>

            <router-link
              to="/admin/classes"
              :class="navigationItemClass('/admin/classes')"
            >
              <BookOpenIcon class="w-5 h-5" />
              <span>Clases</span>
              <span v-if="classesCount" class="count-badge">
                {{ classesCount }}
              </span>
            </router-link>
          </div>

          <!-- Programación -->
          <div class="nav-section">
            <h3 class="nav-section-title">Programación</h3>
            
            <router-link
              to="/admin/schedules"
              :class="navigationItemClass('/admin/schedules')"
            >
              <CalendarIcon class="w-5 h-5" />
              <span>Horarios</span>
            </router-link>

            <router-link
              to="/admin/attendance-weekly"
              :class="navigationItemClass('/admin/attendance-weekly')"
            >
              <ClockIcon class="w-5 h-5" />
              <span>Asistencia</span>
            </router-link>
          </div>

          <!-- Reportes y Análisis -->
          <div class="nav-section">
            <h3 class="nav-section-title">Reportes</h3>
            
            <router-link
              to="/admin/reports"
              :class="navigationItemClass('/admin/reports')"
            >
              <DocumentChartBarIcon class="w-5 h-5" />
              <span>Reportes</span>
            </router-link>

            <router-link
              to="/admin/analytics"
              :class="navigationItemClass('/admin/analytics')"
            >
              <ChartPieIcon class="w-5 h-5" />
              <span>Analytics</span>
            </router-link>
          </div>

          <!-- Administración -->
          <div class="nav-section">
            <h3 class="nav-section-title">Sistema</h3>
            
            <router-link
              to="/admin/users"
              :class="navigationItemClass('/admin/users')"
            >
              <UsersIcon class="w-5 h-5" />
              <span>Usuarios</span>
            </router-link>

            <router-link
              to="/admin/permissions"
              :class="navigationItemClass('/admin/permissions')"
            >
              <ShieldCheckIcon class="w-5 h-5" />
              <span>Permisos</span>
            </router-link>

            <router-link
              to="/admin/system"
              :class="navigationItemClass('/admin/system')"
            >
              <CogIcon class="w-5 h-5" />
              <span>Configuración</span>
            </router-link>
          </div>
        </nav>

        <!-- User Info & Quick Actions -->
        <div class="flex-shrink-0 p-4 border-t border-blue-700">
          <div class="group block w-full">
            <div class="flex items-center space-x-3">
              <div class="relative">
                <img
                  class="h-9 w-9 rounded-full object-cover ring-2 ring-blue-300"
                  :src="userAvatar"
                  :alt="userName"
                />
                <div class="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full bg-green-400 border-2 border-blue-900"></div>
              </div>
              <div class="flex-1 min-w-0">
                <p class="text-sm font-medium text-white truncate">
                  {{ userName }}
                </p>
                <p class="text-xs text-blue-200 truncate">
                  {{ userRole }}
                </p>
              </div>
              <button
                @click="showUserMenu = !showUserMenu"
                class="text-blue-200 hover:text-white transition-colors p-1 rounded"
              >
                <EllipsisVerticalIcon class="w-5 h-5" />
              </button>
            </div>
            
            <!-- User dropdown menu -->
            <div v-show="showUserMenu" class="absolute bottom-16 left-4 right-4 bg-white rounded-lg shadow-lg py-2 z-50">
              <a href="#" class="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                <UserIcon class="w-4 h-4 inline mr-2" />
                Mi Perfil
              </a>
              <a href="#" class="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                <CogIcon class="w-4 h-4 inline mr-2" />
                Configuración
              </a>
              <hr class="my-2">
              <a href="#" class="block px-4 py-2 text-sm text-red-600 hover:bg-red-50" @click="logout">
                <ArrowRightOnRectangleIcon class="w-4 h-4 inline mr-2" />
                Cerrar Sesión
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Mobile sidebar overlay -->
    <div v-show="isMobileMenuOpen" class="lg:hidden">
      <div class="fixed inset-0 z-40 flex">
        <div class="fixed inset-0" @click="closeMobileMenu">
          <div class="absolute inset-0 bg-gray-600 opacity-75"></div>
        </div>

        <!-- Mobile sidebar content -->
        <div class="relative flex w-full max-w-xs flex-1 flex-col bg-gradient-to-b from-blue-800 to-blue-900">
          <div class="absolute top-0 right-0 -mr-12 pt-2">
            <button
              type="button"
              class="ml-1 flex h-10 w-10 items-center justify-center rounded-full focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
              @click="closeMobileMenu"
            >
              <XMarkIcon class="h-6 w-6 text-white" />
            </button>
          </div>

          <!-- Same navigation content as desktop -->
          <div class="flex h-16 flex-shrink-0 items-center px-4">
            <div class="flex items-center space-x-3">
              <div class="bg-white/10 p-2 rounded-lg">
                <AcademicCapIcon class="h-8 w-8 text-white" />
              </div>
              <div class="text-white">
                <h1 class="text-lg font-bold">Admin Panel</h1>
                <p class="text-xs text-blue-200">Academia Musical</p>
              </div>
            </div>
          </div>

          <!-- Mobile Navigation - same as desktop -->
          <nav class="flex-1 px-3 py-6 space-y-1">
            <!-- Copy the same navigation structure as desktop -->
            <router-link
              to="/admin/dashboard"
              :class="navigationItemClass('/admin/dashboard')"
              @click="closeMobileMenu"
            >
              <ChartBarIcon class="w-5 h-5" />
              <span>Dashboard</span>
            </router-link>

            <!-- Students Section -->
            <div class="nav-section">
              <h3 class="nav-section-title">Gestión Académica</h3>
              
              <router-link
                to="/admin/students"
                :class="navigationItemClass('/admin/students')"
                @click="closeMobileMenu"
              >
                <UserGroupIcon class="w-5 h-5" />
                <span>Estudiantes</span>
              </router-link>

              <router-link
                to="/admin/teachers"
                :class="navigationItemClass('/admin/teachers')"
                @click="closeMobileMenu"
              >
                <UserIcon class="w-5 h-5" />
                <span>Maestros</span>
              </router-link>

              <router-link
                to="/admin/classes"
                :class="navigationItemClass('/admin/classes')"
                @click="closeMobileMenu"
              >
                <BookOpenIcon class="w-5 h-5" />
                <span>Clases</span>
              </router-link>
            </div>
          </nav>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { useRoute } from 'vue-router';
import {
  AcademicCapIcon,
  ChartBarIcon,
  UserGroupIcon,
  UserIcon,
  BookOpenIcon,
  CalendarIcon,
  ClockIcon,
  DocumentChartBarIcon,
  ChartPieIcon,
  UsersIcon,
  ShieldCheckIcon,
  CogIcon,
  EllipsisVerticalIcon,
  ArrowRightOnRectangleIcon,
  XMarkIcon,
} from '@heroicons/vue/24/outline';

// Props
interface Props {
  isMobileMenuOpen?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  isMobileMenuOpen: false,
});

// Emits
const emit = defineEmits<{
  closeMobileMenu: [];
  logout: [];
}>();

// State
const route = useRoute();
const showUserMenu = ref(false);

// Mock data - replace with real stores
const pendingTasksCount = ref(5);
const studentsCount = ref(250);
const teachersCount = ref(18);
const classesCount = ref(45);
const userName = ref('Admin Usuario');
const userRole = ref('Super Administrador');
const userAvatar = ref('https://ui-avatars.com/api/?name=Admin+Usuario&background=3b82f6&color=fff');

// Computed
const isActive = (path: string): boolean => {
  return route.path.startsWith(path);
};

const navigationItemClass = (path: string) => {
  const baseClasses = 'nav-item group flex items-center space-x-3 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-200';
  const activeClasses = 'bg-blue-700 text-white shadow-lg ring-1 ring-white/20';
  const inactiveClasses = 'text-blue-100 hover:bg-blue-700/50 hover:text-white';
  
  return `${baseClasses} ${isActive(path) ? activeClasses : inactiveClasses}`;
};

// Methods
const closeMobileMenu = () => {
  emit('closeMobileMenu');
};

const logout = () => {
  emit('logout');
};

// Close user menu when clicking outside
const handleClickOutside = (event: Event) => {
  const target = event.target as HTMLElement;
  if (!target.closest('.group')) {
    showUserMenu.value = false;
  }
};

onMounted(() => {
  document.addEventListener('click', handleClickOutside);
});

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside);
});
</script>

<style scoped>
.admin-sidebar {
  @apply fixed inset-y-0 left-0 z-50;
}

.nav-section {
  @apply mt-6;
}

.nav-section-title {
  @apply text-xs font-semibold text-blue-300 uppercase tracking-wider px-3 mb-2;
}

.nav-item {
  @apply relative;
}

.nav-item::before {
  content: '';
  @apply absolute left-0 top-0 h-full w-1 bg-white rounded-r-full opacity-0 transition-opacity duration-200;
}

.nav-item.bg-blue-700::before {
  @apply opacity-100;
}

.notification-badge {
  @apply absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-bold;
}

.count-badge {
  @apply bg-blue-600 text-blue-100 text-xs rounded-full px-2 py-1 ml-auto;
}

/* Animations */
.nav-item {
  @apply transform transition-transform duration-200;
}

.nav-item:hover {
  @apply scale-[1.02];
}

.nav-item:active {
  @apply scale-[0.98];
}

/* Custom scrollbar */
.admin-sidebar nav::-webkit-scrollbar {
  width: 4px;
}

.admin-sidebar nav::-webkit-scrollbar-track {
  background: rgba(255, 255, 255, 0.1);
}

.admin-sidebar nav::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.3);
  border-radius: 2px;
}

.admin-sidebar nav::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 255, 255, 0.5);
}

/* Smooth transitions */
* {
  transition-property: background-color, border-color, color, fill, stroke, opacity, box-shadow, transform;
  transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
}
</style>