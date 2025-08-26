<template>
  <div
    class="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 dark:from-gray-900 dark:to-gray-800"
  >
    <!-- Hero Header -->
    <div class="bg-white dark:bg-gray-800 shadow-lg border-b border-gray-200 dark:border-gray-700">
      <div class="px-4 sm:px-6 py-6 sm:py-8">
        <div class="max-w-7xl mx-auto">
          <div
            class="flex flex-col md:flex-row items-start md:items-center justify-between space-y-4 md:space-y-0"
          >
            <div class="flex items-center space-x-3 sm:space-x-4">
              <div class="bg-gradient-to-r from-blue-500 to-purple-600 p-2 sm:p-3 rounded-xl">
                <CogIcon class="w-6 h-6 sm:w-8 sm:h-8 text-white" />
              </div>
              <div>
                <h1
                  class="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent"
                >
                  Panel de Administración
                </h1>
                <p class="text-sm sm:text-base text-gray-600 dark:text-gray-400 mt-1">
                  Sistema de gestión académica avanzado
                </p>
                <p class="text-xs sm:text-sm text-gray-500 dark:text-gray-500">
                  {{ currentDate }}
                </p>
              </div>
            </div>

            <!-- Super Stats with Notifications -->
            <div
              class="w-full md:w-auto flex flex-col sm:flex-row items-stretch sm:items-center space-y-3 sm:space-y-0 sm:space-x-3 md:space-x-4"
            >
              <!-- Real-time Notifications Bell -->
              <div class="relative self-end sm:self-center notifications-container">
                <button
                  class="relative p-2 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white transition-colors"
                  :class="{'text-red-500 hover:text-red-600': unreadCount > 0}"
                  @click="toggleNotifications"
                >
                  <BellIcon class="w-6 h-6" />
                  <span
                    v-if="unreadCount > 0"
                    class="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center animate-pulse"
                  >
                    {{ unreadCount > 9 ? "9+" : unreadCount }}
                  </span>
                </button>

                <!-- Notifications Dropdown -->
                <div
                  v-if="showNotifications"
                  class="absolute right-0 mt-2 w-80 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-50 max-h-96 overflow-y-auto"
                >
                  <div class="p-4 border-b border-gray-200 dark:border-gray-700">
                    <div class="flex items-center justify-between">
                      <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
                        Notificaciones
                      </h3>
                      <button
                        v-if="unreadCount > 0"
                        class="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                        @click="markAllAsRead"
                      >
                        Marcar todo como leído
                      </button>
                    </div>
                  </div>

                  <div class="max-h-64 overflow-y-auto">
                    <div
                      v-if="recentNotifications.length === 0"
                      class="p-4 text-center text-gray-500 dark:text-gray-400"
                    >
                      No hay notificaciones recientes
                    </div>

                    <div
                      v-for="notification in recentNotifications"
                      :key="notification.id"
                      class="p-4 border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50"
                    >
                      <div class="flex items-start justify-between">
                        <div class="flex-1">
                          <div class="flex items-center space-x-2">
                            <div
                              class="w-2 h-2 rounded-full"
                              :class="{
                                'bg-red-500': notification.type === 'error',
                                'bg-yellow-500': notification.type === 'warning',
                                'bg-blue-500': notification.type === 'info',
                                'bg-green-500': notification.type === 'success',
                              }"
                            />
                            <h4 class="text-sm font-medium text-gray-900 dark:text-white">
                              {{ notification.title }}
                            </h4>
                            <span
                              v-if="!notification.read"
                              class="w-2 h-2 bg-blue-500 rounded-full"
                            />
                          </div>
                          <p class="text-sm text-gray-600 dark:text-gray-400 mt-1">
                            {{ notification.message }}
                          </p>
                          <p class="text-xs text-gray-500 dark:text-gray-500 mt-1">
                            {{ formatTimeAgo(notification.timestamp) }}
                          </p>
                        </div>
                        <button
                          class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 ml-2"
                          @click="dismissNotification(notification.id)"
                        >
                          <XMarkIcon class="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>

                  <div class="p-4 border-t border-gray-200 dark:border-gray-700">
                    <button
                      class="w-full text-center text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 font-medium"
                      @click="goToNotifications"
                    >
                      Ver todas las notificaciones
                    </button>
                  </div>
                </div>
              </div>
              <!-- Stats Grid -->
              <div
                class="w-full grid grid-cols-2 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3"
              >
                <div
                  class="bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg p-3 sm:p-4 text-white text-center"
                >
                  <div class="text-xl sm:text-2xl font-bold">{{ stats.totalStudents }}</div>
                  <div class="text-xs opacity-90">Estudiantes</div>
                </div>
                <div
                  class="bg-gradient-to-r from-green-500 to-green-600 rounded-lg p-3 sm:p-4 text-white text-center"
                >
                  <div class="text-xl sm:text-2xl font-bold">{{ stats.totalTeachers }}</div>
                  <div class="text-xs opacity-90">Maestros</div>
                </div>
                <div
                  class="bg-gradient-to-r from-purple-500 to-purple-600 rounded-lg p-3 sm:p-4 text-white text-center"
                >
                  <div class="text-xl sm:text-2xl font-bold">{{ stats.totalClasses }}</div>
                  <div class="text-xs opacity-90">Clases</div>
                </div>
                <div
                  class="bg-gradient-to-r from-orange-500 to-orange-600 rounded-lg p-3 sm:p-4 text-white text-center"
                >
                  <div class="text-xl sm:text-2xl font-bold">{{ stats.activeUsers }}</div>
                  <div class="text-xs opacity-90">Usuarios Activos</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Critical Alerts Banner -->
    <div
      v-if="criticalNotifications.length > 0"
      class="bg-red-50 dark:bg-red-900/20 border-b border-red-200 dark:border-red-800"
    >
      <div class="max-w-7xl mx-auto px-6 py-4">
        <div class="flex items-center justify-between">
          <div class="flex items-center space-x-3">
            <ExclamationTriangleIcon class="w-6 h-6 text-red-600 dark:text-red-400" />
            <div>
              <h3 class="text-sm font-semibold text-red-800 dark:text-red-200">
                Alertas Críticas ({{ criticalNotifications.length }})
              </h3>
              <p class="text-sm text-red-700 dark:text-red-300">
                {{ criticalNotifications[0]?.message || "Requieren atención inmediata" }}
              </p>
            </div>
          </div>
          <button
            class="text-sm font-medium text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 underline"
            @click="showNotifications = true"
          >
            Ver Detalles
          </button>
        </div>
      </div>
    </div>

    <!-- Main Dashboard -->
    <div class="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
      <!-- Super Actions Row -->
      <section class="mb-8">
        <div
          class="flex flex-col sm:flex-row sm:items-center justify-between mb-4 sm:mb-6 space-y-2 sm:space-y-0"
        >
          <h2 class="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">Acciones</h2>
          <div class="flex items-center space-x-2">
            <span class="text-xs sm:text-sm text-gray-500 dark:text-gray-400">Modo Admin</span>
            <div class="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
          </div>
        </div>

        <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 sm:gap-4">
          <!-- Super Action Cards -->
          <SuperActionCard
            title="Nuevo Usuario"
            description="Crear cualquier tipo de usuario"
            icon="UserPlusIcon"
            gradient="from-blue-500 to-blue-600"
            @click="handleCreateUser"
          />

          <SuperActionCard
            title="Vista Global"
            description="Ver todo el sistema"
            icon="GlobeAltIcon"
            gradient="from-purple-500 to-purple-600"
            @click="handleGlobalView"
          />

          <SuperActionCard
            title="Reportes Pro"
            description="Análisis avanzado"
            icon="ChartBarIcon"
            gradient="from-green-500 to-green-600"
            @click="handleAdvancedReports"
          />

          <SuperActionCard
            title="Reporte Semanal"
            description="Asistencias y WhatsApp"
            icon="CalendarDaysIcon"
            gradient="from-blue-500 to-indigo-600"
            @click="handleWeeklyReport"
          />

          <SuperActionCard
            title="Config Sistema"
            description="Configuraciones avanzadas"
            icon="CogIcon"
            gradient="from-orange-500 to-orange-600"
            @click="handleSystemConfig"
          />

          <SuperActionCard
            title="Temas & Colores"
            description="Personalizar apariencia"
            icon="SwatchIcon"
            gradient="from-pink-500 to-pink-600"
            @click="handleThemeManager"
          />

          <SuperActionCard
            title="PDFs Alumnos"
            description="Reportes y listados"
            icon="DocumentTextIcon"
            gradient="from-emerald-500 to-emerald-600"
            @click="handlePDFGenerator"
          />

          <SuperActionCard
            title="WhatsApp"
            description="Gestión de comunicaciones"
            icon="ChatBubbleLeftRightIcon"
            gradient="from-green-500 to-green-600"
            @click="handleWhatsAppPanel"
          />

          <SuperActionCard
            title="Reporte Asistencias"
            description="Ver reporte completo"
            icon="DocumentChartBarIcon"
            gradient="from-indigo-500 to-indigo-600"
            @click="handleAttendanceReport"
          />
        </div>
      </section>

      <!-- Enhanced Dashboard Button -->
      <div class="hidden lg:flex">
        <RouterLink
          to="/admin/enhanced"
          class="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white px-6 py-3 rounded-lg font-medium transition-all duration-200 flex items-center space-x-2 shadow-lg hover:shadow-xl transform hover:scale-105"
        >
          <CogIcon class="w-5 h-5" />
          <span>Panel Integral</span>
          <ChevronRightIcon class="w-4 h-4" />
        </RouterLink>
      </div>
      <div class="hidden lg:flex">
        <RouterLink
          to="/admin/Daily"
          class="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white px-6 py-3 rounded-lg font-medium transition-all duration-200 flex items-center space-x-2 shadow-lg hover:shadow-xl transform hover:scale-105"
        >
          <CogIcon class="w-5 h-5" />
          <span>Panel Integral</span>
          <ChevronRightIcon class="w-4 h-4" />
        </RouterLink>
      </div>

      <!-- Main Content Grid -->
      <div class="grid grid-cols-1 lg:grid-cols-4 gap-4 sm:gap-6">
        <!-- Left Column - Primary Management -->
        <div class="lg:col-span-3 space-y-4 sm:space-y-6">
          <!-- Gestión Principal -->
          <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-4 sm:p-6">
            <div
              class="flex flex-col sm:flex-row sm:items-center justify-between mb-4 sm:mb-6 space-y-2 sm:space-y-0"
            >
              <h3 class="text-xl font-bold text-gray-900 dark:text-white flex items-center">
                <UsersIcon class="w-6 h-6 mr-2 text-blue-500" />
                Gestión Principal
              </h3>
              
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              <ManagementSuperCard
                title="Estudiantes"
                description="Gestionar todos los estudiantes"
                icon="UsersIcon"
                :count="stats.totalStudents"
                :recent="stats.recentStudents"
                color="blue"
                route="/admin/students"
                @action="handleStudentsAction"
              >
                <template #extra-actions>
                  <button
                    class="mt-2 w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white px-3 py-1.5 rounded-md text-xs font-medium hover:from-blue-600 hover:to-purple-700 transition-all duration-200 shadow-sm"
                    @click="$router.push('/students')"
                  >
                    🚀 Gestión Avanzada
                  </button>
                </template>
              </ManagementSuperCard>

              <ManagementSuperCard
                title="Maestros"
                description="Gestionar maestros y permisos"
                icon="UserIcon"
                :count="stats.totalTeachers"
                :recent="stats.recentTeachers"
                color="green"
                route="/admin/teachers"
                @action="handleTeachersAction"
              />

              <ManagementSuperCard
                title="Clases"
                description="Gestionar clases activas"
                icon="AcademicCapIcon"
                :count="stats.totalClasses"
                :recent="stats.recentClasses"
                color="purple"
                route="/admin/classes"
                @action="handleClassesAction"
              />
            </div>
          </div>
          <!-- Daily Monitoring Section -->
          <ReporteAsistenciaDiaria />

          <!-- Analytics Dashboard -->
          <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
            <div class="flex items-center justify-between mb-6">
              <h3 class="text-xl font-bold text-gray-900 dark:text-white flex items-center">
                <ChartBarIcon class="w-6 h-6 mr-2 text-green-500" />
                Análisis en Tiempo Real
              </h3>
              <div class="flex items-center space-x-2">
                <div class="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                <span class="text-sm text-green-600 dark:text-green-400">En vivo</span>
              </div>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
              <AnalyticsCard
                title="Asistencia Hoy"
                :value="attendancePercentage"
                :trend="attendanceTrend"
                icon="ClipboardDocumentCheckIcon"
                color="green"
                :data="attendanceData"
              />

              <AnalyticsCard
                title="Clases Activas"
                :value="activeClassesCount.toString()"
                :trend="classesTrend"
                icon="AcademicCapIcon"
                color="blue"
                :data="classesData"
              />

              <AnalyticsCard
                title="Observaciones"
                :value="currentObservations.toString()"
                :trend="observationsTrend"
                icon="ExclamationTriangleIcon"
                color="orange"
                :data="observationsData"
              />

              <AnalyticsCard
                title="Rendimiento"
                :value="performancePercentage"
                :trend="performanceTrend"
                icon="TrophyIcon"
                color="purple"
                :data="performanceData"
              />
            </div>
          </div>

          <!-- Actividad Reciente -->
          <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-4 sm:p-6">
            <div
              class="flex flex-col sm:flex-row sm:items-center justify-between mb-4 sm:mb-6 space-y-2 sm:space-y-0"
            >
              <h3
                class="text-lg sm:text-xl font-bold text-gray-900 dark:text-white flex items-center"
              >
                <ClockIcon class="w-5 h-5 sm:w-6 sm:h-6 mr-2 text-purple-500" />
                Actividad Reciente
              </h3>
              <RouterLink
                to="/admin/activity"
                class="text-purple-600 hover:text-purple-700 text-sm font-medium"
              >
                Ver Historial Completo
              </RouterLink>
            </div>
            <RecentActivityFeed :activities="recentActivities" />
          </div>
        </div>

        <!-- Right Column - Quick Access & Alerts -->
        <div class="space-y-4 sm:space-y-6">
          <!-- System Status -->
          <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-4 sm:p-6">
            <h3
              class="text-base sm:text-lg font-bold text-gray-900 dark:text-white mb-3 sm:mb-4 flex items-center"
            >
              <ServerIcon class="w-4 h-4 sm:w-5 sm:h-5 mr-2 text-green-500" />
              Estado del Sistema
            </h3>
            <div class="bg-green-100 dark:bg-green-900/30 rounded-lg p-4">
              <div class="flex items-center">
                <div class="w-3 h-3 bg-green-500 rounded-full mr-2 animate-pulse" />
                <span class="text-green-700 dark:text-green-300 font-medium"
                  >Sistema Operativo</span
                >
              </div>
              <p class="text-sm text-green-600 dark:text-green-400 mt-1">
                Todos los servicios funcionando correctamente
              </p>
            </div>
          </div>

          <!-- Alerts -->
          <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-4 sm:p-6">
            <h3
              class="text-base sm:text-lg font-bold text-gray-900 dark:text-white mb-3 sm:mb-4 flex items-center"
            >
              <ExclamationTriangleIcon class="w-4 h-4 sm:w-5 sm:h-5 mr-2 text-red-500" />
              Alertas Importantes
            </h3>
            <AlertsList :alerts="systemAlerts" @dismiss="handleDismissAlert" />
          </div>

          <!-- Quick Actions -->
          <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-4 sm:p-6">
            <h3
              class="text-base sm:text-lg font-bold text-gray-900 dark:text-white mb-3 sm:mb-4 flex items-center"
            >
              <BoltIcon class="w-4 h-4 sm:w-5 sm:h-5 mr-2 text-yellow-500" />
              Acciones Rápidas
            </h3>
            <div class="space-y-3">
              <QuickAccessButton
                title="Crear Clase Urgente"
                icon="PlusCircleIcon"
                color="red"
                @click="handleUrgentClass"
              />
              <QuickAccessButton
                title="Mensaje Global"
                icon="MegaphoneIcon"
                color="blue"
                @click="handleGlobalMessage"
              />
              <QuickAccessButton
                title="Exportar Datos"
                icon="ArrowDownTrayIcon"
                color="green"
                @click="handleExportData"
              />
              <QuickAccessButton
                title="Configurar Notificaciones"
                icon="BellIcon"
                color="purple"
                @click="handleNotificationConfig"
              />
              <QuickAccessButton
                title="Asistencia Semanal Interactiva"
                icon="TableCellsIcon"
                color="indigo"
                @click="handleWeeklyAttendance"
              />
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Modals -->
    <CreateUserModal
      v-if="showCreateUserModal"
      @close="showCreateUserModal = false"
      @created="handleUserCreated"
    />

    <GlobalViewModal v-if="showGlobalViewModal" @close="showGlobalViewModal = false" />

    <SystemConfigModal
      v-if="showSystemConfigModal"
      @close="showSystemConfigModal = false"
      @updated="handleSystemConfigUpdated"
    />

    <PDFGeneratorModal
      v-if="showPDFGeneratorModal"
      @close="showPDFGeneratorModal = false"
      @generate="handlePDFGeneration"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { useRouter } from 'vue-router';
import {
  CogIcon,
  UsersIcon,
  UserIcon,
  UserPlusIcon,
  AcademicCapIcon,
  ChartBarIcon,
  ClockIcon,
  CpuChipIcon,
  ExclamationTriangleIcon,
  BoltIcon,
  BellIcon,
  BellAlertIcon,
  EyeIcon,
  GlobeAltIcon,
  CloudArrowUpIcon,
  ClipboardDocumentCheckIcon,
  TrophyIcon,
  PlusCircleIcon,
  MegaphoneIcon,
  ArrowDownTrayIcon,
  SwatchIcon,
  DocumentTextIcon,
  XMarkIcon,
  ChevronRightIcon,
  ServerIcon,
  ChatBubbleLeftRightIcon,
  CalendarDaysIcon,
} from '@heroicons/vue/24/outline';

// Components
import SuperActionCard from '../components/SuperActionCard.vue';
import ManagementSuperCard from '../components/ManagementSuperCard.vue';
import AnalyticsCard from '../components/AnalyticsCard.vue';
import RecentActivityFeed from '../components/RecentActivityFeed.vue';
import QuickAccessButton from '../components/QuickAccessButton.vue';
import AlertsList from '../components/AlertsList.vue';
import CreateUserModal from '../components/CreateUserModal.vue';
import GlobalViewModal from '../components/GlobalViewModal.vue';
import SystemConfigModal from '../components/SystemConfigModal.vue';
import PDFGeneratorModal from '../components/PDFGeneratorModal.vue';

// Stores
import { useAdminStudentsStore } from '../store/adminStudents';
import { useAdminTeachersStore } from '../store/teachers';
import { useClassesStore } from '../../Classes/store/classes';
import { useAuthStore } from '../../../stores/auth';
import { useTheme } from '../../../composables/useTheme';
import { useRealTimeNotifications } from '../composables/useRealTimeNotifications';
import ReporteAsistenciaDiaria from '../../Attendance/views/ReporteAsistenciaDiaria.vue';

// Setup
const router = useRouter();
const authStore = useAuthStore();
const studentsStore = useAdminStudentsStore();
const teachersStore = useAdminTeachersStore();
const classesStore = useClassesStore();
const { isDarkMode, toggleTheme: switchTheme } = useTheme();

// Real-time notifications setup
const {
  notifications,
  criticalNotifications,
  recentNotifications,
  unreadCount,
  markAsRead,
  dismissNotification,
} = useRealTimeNotifications();

// State
const showCreateUserModal = ref(false);
const showGlobalViewModal = ref(false);
const showSystemConfigModal = ref(false);
const showPDFGeneratorModal = ref(false);
const showNotifications = ref(false);

// Computed
const currentDate = computed(() => {
  return new Date().toLocaleDateString('es-ES', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
});

const stats = computed(() => {
  const studentStats = studentsStore.studentStats;
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const recentStudents = studentsStore.students.filter(
    (student) => new Date(student.enrollmentDate) >= startOfMonth,
  ).length;

  const recentTeachers = teachersStore.teachers.filter(
    (teacher) => new Date(teacher.createdAt || new Date()) >= startOfMonth,
  ).length;

  const recentClasses = classesStore.classes.filter(
    (classItem) => new Date(classItem.createdAt || new Date()) >= startOfMonth,
  ).length;

  const activeUsers = studentStats.active + teachersStore.activeTeachers;

  return {
    totalStudents: studentStats.total,
    totalTeachers: teachersStore.totalTeachers,
    totalClasses: classesStore.classes.length,
    activeUsers,
    recentStudents,
    recentTeachers,
    recentClasses,
  };
});

// Analytics computed properties
const activeClassesCount = computed(() => {
  return classesStore.classes.filter((c) => c.status === 'active').length;
});

const attendancePercentage = computed(() => {
  const totalStudents = studentsStore.studentStats.total;
  const activeStudents = studentsStore.studentStats.active;
  if (totalStudents === 0) return '0%';
  return `${Math.floor((activeStudents / totalStudents) * 100)}%`;
});

const attendanceTrend = computed(() => {
  // TODO: Calcular tendencia real comparando con semana/mes anterior
  // Requerirá datos históricos de asistencia
  return '+0%'; // Neutro hasta tener datos reales
});

const classesTrend = computed(() => {
  const newClassesThisMonth = stats.value.recentClasses;
  return newClassesThisMonth > 0 ? `+${newClassesThisMonth}` : '0';
});

const observationsTrend = computed(() => {
  // TODO: Calcular tendencia real de observaciones
  return '+0'; // Neutro hasta tener datos reales
});

const performanceTrend = computed(() => {
  // TODO: Calcular tendencia real de rendimiento académico
  return '+0%'; // Neutro hasta tener datos reales
});

const currentObservations = computed(() => {
  // TODO: Obtener el número real de observaciones activas o pendientes del store de observaciones
  // Por ahora, se mantiene un valor estimado o se retorna 0 si no hay datos.
  const totalStudents = studentsStore.studentStats.total;
  return Math.floor(totalStudents * 0.03); // Mantener estimación hasta tener datos reales
});

const performancePercentage = computed(() => {
  // TODO: Obtener el porcentaje de rendimiento real del sistema o de los estudiantes
  return 'N/A'; // Valor neutro hasta tener datos reales
});

// Analytics data - Preparado para datos reales de los stores
const attendanceData = computed(() => {
  // TODO: Implementar studentsStore.getAttendanceHistoryData() para datos reales
  // Por ahora retornamos array vacío hasta que los stores expongan datos históricos
  return [];
});

const classesData = computed(() => {
  // TODO: Implementar classesStore.getClassesHistoryData() para datos reales
  // Por ahora retornamos array vacío hasta que los stores expongan datos históricos
  return [];
});

const observationsData = computed(() => {
  // TODO: Implementar observationsStore.getObservationsHistoryData() para datos reales
  // Por ahora retornamos array vacío hasta que los stores expongan datos históricos
  return [];
});

const performanceData = computed(() => {
  // TODO: Implementar performanceStore.getPerformanceHistoryData() para datos reales
  // Por ahora retornamos array vacío hasta que los stores expongan datos históricos
  return [];
});

// Recent activities
const recentActivities = computed(() => {
  // TODO: Obtener actividades recientes reales del sistema (ej. de un store de actividades o logs)
  return [];
});

// System alerts - ahora se obtienen directamente de criticalNotifications
const systemAlerts = computed(() => {
  // Usar las notificaciones críticas reales del sistema
  return criticalNotifications.value
    .map((notification) => ({
      id: notification.id,
      type: notification.type as 'warning' | 'info' | 'error' | 'success',
      title: notification.title,
      description: notification.message,
      time: formatTimeAgo(notification.timestamp),
    }))
    .slice(0, 3);
});

// Methods
const loadData = async () => {
  try {
    await Promise.all([
      studentsStore.loadStudents(),
      teachersStore.loadTeachers(),
      classesStore.fetchClasses(),
    ]);

    console.log('Datos cargados exitosamente:', {
      students: studentsStore.studentStats.total,
      teachers: teachersStore.totalTeachers,
      classes: classesStore.classes.length,
    });
  } catch (error) {
    console.error('Error loading data:', error);
  }
};

// Super Action Handlers
const handleCreateUser = () => {
  showCreateUserModal.value = true;
};

const handleGlobalView = () => {
  showGlobalViewModal.value = true;
};

const handleAdvancedReports = () => {
  router.push('/admin/reports/advanced');
};

const handleSystemConfig = () => {
  showSystemConfigModal.value = true;
};

const handleThemeManager = () => {
  switchTheme();
};

const handlePDFGenerator = () => {
  showPDFGeneratorModal.value = true;
};

const handleWhatsAppPanel = () => {
  router.push('/admin/whatsapp');
};

// Management Action Handlers
const handleStudentsAction = (action: string) => {
  switch (action) {
  case 'view':
    router.push('/admin/students');
    break;
  case 'create':
    router.push('/admin/students/create');
    break;
  case 'export':
    console.log('Export students');
    break;
  }
};

const handleTeachersAction = (action: string) => {
  switch (action) {
  case 'view':
    router.push('/admin/teachers');
    break;
  case 'create':
    router.push('/admin/teachers/create');
    break;
  case 'permissions':
    router.push('/admin/permissions');
    break;
  }
};

const handleClassesAction = (action: string) => {
  switch (action) {
  case 'view':
    router.push('/admin/classes');
    break;
  case 'create':
    router.push('/admin/classes/create');
    break;
  case 'schedule':
    router.push('/admin/schedules');
    break;
  }
};

// Quick Access Handlers
const handleUrgentClass = () => {
  router.push('/admin/classes/create?urgent=true');
};

const handleGlobalMessage = () => {
  console.log('Send global message');
};

const handleExportData = () => {
  console.log('Export data');
};

const handleNotificationConfig = () => {
  router.push('/admin/notifications/config');
};

const handleWeeklyAttendance = () => {
  router.push('/admin/attendance-weekly');
};

const handleWeeklyReport = () => {
  router.push('/attendance/reports/weekly');
};

// Other Handlers
const handleDismissAlert = (alertId: string | number) => {
  console.log('Alert dismissed:', alertId);
};

const handleUserCreated = (user: any) => {
  console.log('User created:', user);
  loadData();
};

const handleSystemConfigUpdated = (config: any) => {
  console.log('System config updated:', config);
};

const handlePDFGeneration = (options: any) => {
  console.log('Generando PDF con opciones:', options);
};

// Manejador para el botón de reporte de asistencias
const handleAttendanceReport = () => {
  // Navegar a la ruta del componente de reporte de asistencias
  router.push('/attendance/report');
};

// Notification Methods
const toggleNotifications = () => {
  showNotifications.value = !showNotifications.value;
};

const markAllAsRead = async () => {
  try {
    await Promise.all(recentNotifications.value.filter((n) => !n.read).map((n) => markAsRead(n.id)));
  } catch (error) {
    console.error('Error marking notifications as read:', error);
  }
};

const goToNotifications = () => {
  showNotifications.value = false;
  router.push('/admin/notifications');
};

const formatTimeAgo = (timestamp: any) => {
  const now = new Date();
  const time = timestamp?.toDate ? timestamp.toDate() : new Date(timestamp);
  const diff = now.getTime() - time.getTime();

  const minutes = Math.floor(diff / (1000 * 60));
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));

  if (minutes < 1) return 'Ahora mismo';
  if (minutes < 60) return `${minutes} min`;
  if (hours < 24) return `${hours} h`;
  return `${days} días`;
};

// Close notifications when clicking outside
const handleClickOutside = (event: Event) => {
  const target = event.target as Element;
  if (showNotifications.value && !target.closest('.notifications-container')) {
    showNotifications.value = false;
  }
};

// Lifecycle
onMounted(async () => {
  await loadData();
  // Ya no necesitamos generar notificaciones demo - usamos las reales del sistema
  document.addEventListener('click', handleClickOutside);
});

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside);
});
</script>

<style scoped>
/* Additional custom styles */
.animate-pulse {
  animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}

@keyframes pulse {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}

.notifications-container {
  position: relative;
}
</style>
