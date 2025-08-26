<template>
  <div class="admin-dashboard min-h-screen bg-gray-50 dark:bg-gray-900">
    <!-- Mobile menu button -->
    <div class="lg:hidden">
      <div class="flex items-center justify-between bg-white dark:bg-gray-800 px-4 py-3 border-b">
        <h1 class="text-xl font-semibold text-gray-900 dark:text-white">Admin Panel</h1>
        <button
          type="button"
          class="text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
          @click="isMobileMenuOpen = true"
        >
          <Bars3Icon class="h-6 w-6" />
        </button>
      </div>
    </div>

    <!-- Layout with sidebar -->
    <div class="flex">
      <!-- Sidebar -->
      <AdminSidebar
        :is-mobile-menu-open="isMobileMenuOpen"
        @close-mobile-menu="isMobileMenuOpen = false"
        @logout="handleLogout"
      />

      <!-- Main content -->
      <div class="flex-1 lg:ml-64">
        <!-- Header -->
        <header class="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
          <div class="px-4 sm:px-6 lg:px-8 py-6">
            <div class="flex items-center justify-between">
              <div>
                <h1 class="text-2xl font-bold text-gray-900 dark:text-white">
                  Dashboard Administrativo
                </h1>
                <p class="mt-1 text-sm text-gray-600 dark:text-gray-400">
                  Resumen general de la academia
                </p>
              </div>
              
              <!-- Quick actions -->
              <div class="flex items-center space-x-3">
                <button
                  class="inline-flex items-center px-3 py-2 border border-gray-300 dark:border-gray-600 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  @click="refreshData"
                  :disabled="isLoading"
                >
                  <ArrowPathIcon :class="['w-4 h-4 mr-2', { 'animate-spin': isLoading }]" />
                  Actualizar
                </button>
                
                <button
                  class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  @click="showCreateQuickAccess = true"
                >
                  <PlusIcon class="w-4 h-4 mr-2" />
                  Crear
                </button>
              </div>
            </div>
          </div>
        </header>

        <!-- Dashboard content -->
        <main class="p-4 sm:p-6 lg:p-8">
          <!-- Key Metrics Cards -->
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <!-- Students Card -->
            <MetricCard
              title="Estudiantes"
              :value="metrics.students.total"
              :change="metrics.students.change"
              :trend="metrics.students.trend"
              color="blue"
              icon="users"
              :loading="isLoading"
            >
              <template #details>
                <div class="text-xs text-gray-600 dark:text-gray-400 space-y-1">
                  <div>Activos: {{ metrics.students.active }}</div>
                  <div>Nuevos este mes: {{ metrics.students.newThisMonth }}</div>
                </div>
              </template>
            </MetricCard>

            <!-- Teachers Card -->
            <MetricCard
              title="Maestros"
              :value="metrics.teachers.total"
              :change="metrics.teachers.change"
              :trend="metrics.teachers.trend"
              color="green"
              icon="user"
              :loading="isLoading"
            >
              <template #details>
                <div class="text-xs text-gray-600 dark:text-gray-400 space-y-1">
                  <div>Activos: {{ metrics.teachers.active }}</div>
                  <div>Con clases: {{ metrics.teachers.withClasses }}</div>
                </div>
              </template>
            </MetricCard>

            <!-- Classes Card -->
            <MetricCard
              title="Clases"
              :value="metrics.classes.total"
              :change="metrics.classes.change"
              :trend="metrics.classes.trend"
              color="purple"
              icon="book"
              :loading="isLoading"
            >
              <template #details>
                <div class="text-xs text-gray-600 dark:text-gray-400 space-y-1">
                  <div>En curso: {{ metrics.classes.active }}</div>
                  <div>Esta semana: {{ metrics.classes.thisWeek }}</div>
                </div>
              </template>
            </MetricCard>

            <!-- Revenue Card -->
            <MetricCard
              title="Ingresos Mensuales"
              :value="`$${metrics.revenue.total.toLocaleString()}`"
              :change="metrics.revenue.change"
              :trend="metrics.revenue.trend"
              color="yellow"
              icon="currency"
              :loading="isLoading"
            >
              <template #details>
                <div class="text-xs text-gray-600 dark:text-gray-400 space-y-1">
                  <div>Pagos este mes: {{ metrics.revenue.paymentsCount }}</div>
                  <div>Pendientes: ${{ metrics.revenue.pending.toLocaleString() }}</div>
                </div>
              </template>
            </MetricCard>
          </div>

          <!-- Charts and Analytics Row -->
          <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            <!-- Enrollment Chart -->
            <div class="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <div class="flex items-center justify-between mb-6">
                <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
                  Inscripciones por Mes
                </h3>
                <button class="text-blue-600 hover:text-blue-700 text-sm font-medium">
                  Ver detalles
                </button>
              </div>
              <div class="h-64 flex items-center justify-center text-gray-500 dark:text-gray-400">
                <ChartBarIcon class="h-16 w-16 mb-2" />
                <div>Gráfico de inscripciones</div>
              </div>
            </div>

            <!-- Attendance Overview -->
            <div class="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <div class="flex items-center justify-between mb-6">
                <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
                  Resumen de Asistencia
                </h3>
                <button class="text-blue-600 hover:text-blue-700 text-sm font-medium">
                  Ver reportes
                </button>
              </div>
              <div class="space-y-4">
                <!-- Attendance rate -->
                <div>
                  <div class="flex justify-between text-sm mb-2">
                    <span class="text-gray-600 dark:text-gray-400">Tasa de Asistencia</span>
                    <span class="font-medium text-gray-900 dark:text-white">85%</span>
                  </div>
                  <div class="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div class="bg-green-600 h-2 rounded-full" style="width: 85%"></div>
                  </div>
                </div>
                
                <!-- Quick stats -->
                <div class="grid grid-cols-2 gap-4 pt-4">
                  <div class="text-center">
                    <div class="text-2xl font-bold text-green-600">156</div>
                    <div class="text-xs text-gray-600 dark:text-gray-400">Clases completadas</div>
                  </div>
                  <div class="text-center">
                    <div class="text-2xl font-bold text-yellow-600">28</div>
                    <div class="text-xs text-gray-600 dark:text-gray-400">Ausencias</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Quick Access and Recent Activity -->
          <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <!-- Quick Actions -->
            <div class="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Acciones Rápidas
              </h3>
              <div class="space-y-3">
                <QuickActionButton
                  icon="user-plus"
                  title="Nuevo Estudiante"
                  description="Registrar nuevo estudiante"
                  @click="navigateTo('/admin/students/new')"
                />
                <QuickActionButton
                  icon="user-group"
                  title="Nueva Clase"
                  description="Crear clase o sesión"
                  @click="navigateTo('/admin/classes/new')"
                />
                <QuickActionButton
                  icon="calendar"
                  title="Programar Horario"
                  description="Gestionar horarios"
                  @click="navigateTo('/admin/schedules/new')"
                />
                <QuickActionButton
                  icon="document"
                  title="Generar Reporte"
                  description="Crear reporte personalizado"
                  @click="navigateTo('/admin/reports')"
                />
              </div>
            </div>

            <!-- Recent Activity -->
            <div class="lg:col-span-2 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <div class="flex items-center justify-between mb-4">
                <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
                  Actividad Reciente
                </h3>
                <button class="text-blue-600 hover:text-blue-700 text-sm font-medium">
                  Ver todo
                </button>
              </div>
              <div class="space-y-4">
                <ActivityItem
                  v-for="activity in recentActivities"
                  :key="activity.id"
                  :activity="activity"
                />
                <div v-if="isLoading" class="text-center py-4">
                  <div class="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
                </div>
              </div>
            </div>
          </div>

          <!-- Alerts and Notifications -->
          <div class="mt-8">
            <AlertsPanel :alerts="systemAlerts" />
          </div>
        </main>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import {
  Bars3Icon,
  PlusIcon,
  ArrowPathIcon,
  ChartBarIcon,
} from '@heroicons/vue/24/outline';

// Components
import AdminSidebar from '../components/AdminSidebar.vue';
import MetricCard from '../components/MetricCard.vue';
import QuickActionButton from '../components/QuickActionButton.vue';
import ActivityItem from '../components/ActivityItem.vue';
import AlertsPanel from '../components/AlertsPanel.vue';

// Stores
import { useAdminStudentsStore } from '../store/adminStudents';
import { useAdminTeachersStore } from '../store/teachers';
import { useClassesStore } from '../../Classes/store/classes';

// Router
const router = useRouter();

// State
const isMobileMenuOpen = ref(false);
const isLoading = ref(false);
const showCreateQuickAccess = ref(false);

// Stores
const studentsStore = useAdminStudentsStore();
const teachersStore = useAdminTeachersStore();
const classesStore = useClassesStore();

// Mock data for demonstration
const metrics = ref({
  students: {
    total: 245,
    active: 230,
    newThisMonth: 12,
    change: 8.2,
    trend: 'up'
  },
  teachers: {
    total: 18,
    active: 16,
    withClasses: 14,
    change: 5.5,
    trend: 'up'
  },
  classes: {
    total: 48,
    active: 45,
    thisWeek: 32,
    change: 12.3,
    trend: 'up'
  },
  revenue: {
    total: 45800,
    pending: 8200,
    paymentsCount: 124,
    change: 15.7,
    trend: 'up'
  }
});

const recentActivities = ref([
  {
    id: 1,
    type: 'student_registered',
    title: 'Nuevo estudiante registrado',
    description: 'Ana García se inscribió en Piano Intermedio',
    timestamp: new Date(Date.now() - 1000 * 60 * 30),
    icon: 'user-plus',
    color: 'green'
  },
  {
    id: 2,
    type: 'class_completed',
    title: 'Clase completada',
    description: 'Guitarra Principiantes - Grupo A finalizada',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2),
    icon: 'check',
    color: 'blue'
  },
  {
    id: 3,
    type: 'payment_received',
    title: 'Pago recibido',
    description: 'Carlos López - Mensualidad Octubre',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 4),
    icon: 'currency',
    color: 'yellow'
  },
  {
    id: 4,
    type: 'teacher_assigned',
    title: 'Maestro asignado',
    description: 'Mtra. Elena asignada a Violín Avanzado',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 6),
    icon: 'user-check',
    color: 'purple'
  }
]);

const systemAlerts = ref([
  {
    id: 1,
    type: 'warning',
    title: 'Clases con baja asistencia',
    message: '3 clases tienen menos del 70% de asistencia este mes',
    action: 'Revisar clases',
    actionUrl: '/admin/classes?filter=low-attendance'
  },
  {
    id: 2,
    type: 'info',
    title: 'Pagos pendientes',
    message: '15 estudiantes tienen pagos pendientes',
    action: 'Ver reportes',
    actionUrl: '/admin/reports/payments'
  }
]);

// Methods
const refreshData = async () => {
  isLoading.value = true;
  try {
    await Promise.all([
      studentsStore.loadStudents(),
      teachersStore.loadTeachers(),
      classesStore.fetchClasses()
    ]);
  } catch (error) {
    console.error('Error loading dashboard data:', error);
  } finally {
    isLoading.value = false;
  }
};

const navigateTo = (path: string) => {
  router.push(path);
};

const handleLogout = () => {
  // Handle logout logic
  console.log('Logout requested');
};

// Lifecycle
onMounted(() => {
  refreshData();
});
</script>

<style scoped>
.admin-dashboard {
  min-height: 100vh;
}

/* Custom animations */
@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: .5;
  }
}

.animate-pulse {
  animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}

/* Responsive adjustments */
@media (max-width: 1024px) {
  .grid.lg\\:grid-cols-4 {
    @apply grid-cols-2;
  }
}

@media (max-width: 768px) {
  .grid.grid-cols-2 {
    @apply grid-cols-1;
  }
}

/* Loading states */
.loading-shimmer {
  background: linear-gradient(90deg, #f3f4f6 25%, transparent 50%, #f3f4f6 75%);
  background-size: 200% 100%;
  animation: shimmer 2s infinite;
}

.dark .loading-shimmer {
  background: linear-gradient(90deg, #374151 25%, transparent 50%, #374151 75%);
  background-size: 200% 100%;
}

@keyframes shimmer {
  0% {
    background-position: 200% 0;
  }
  100% {
    background-position: -200% 0;
  }
}

/* Hover effects */
.hover-lift {
  transition: transform 0.2s ease-in-out;
}

.hover-lift:hover {
  transform: translateY(-2px);
}
</style>