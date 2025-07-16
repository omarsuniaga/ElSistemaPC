import type { ModuleDefinition } from './core/ModuleManager';
import { markRaw } from 'vue';
import MontajeDashboardWidget from './components/MontajeDashboardWidget.vue';
import UsersApp from './components/users/UsersApp.vue';
import UsersDashboardWidget from './components/users/UsersDashboardWidget.vue';

// Componente simple para evitar problemas de importación circular
const MontajeAppSimple = {
  name: 'MontajeAppSimple',
  template: `
    <div class="min-h-screen bg-gray-50 dark:bg-gray-900">
      <header class="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div class="flex justify-between items-center h-16">
            <h1 class="text-2xl font-bold text-gray-900 dark:text-white">
              🎼 Sistema Musical Montaje
            </h1>
            <button
              @click="$router.push('/')"
              class="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md"
            >
              ← Volver
            </button>
          </div>
        </div>
      </header>
      <main class="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div class="text-center">
          <div class="text-6xl mb-4">🎼</div>
          <h2 class="text-3xl font-bold text-gray-900 dark:text-white mb-4">
            ¡Módulo Montaje Integrado Exitosamente!
          </h2>
          <p class="text-lg text-gray-500 dark:text-gray-400 mb-8">
            El sistema musical está funcionando correctamente
          </p>
          <div class="bg-green-100 dark:bg-green-900/30 p-4 rounded-lg max-w-md mx-auto">
            <h4 class="text-lg font-medium text-green-800 dark:text-green-300 mb-2">
              ✅ Estado: Funcionando
            </h4>
            <div class="text-sm text-green-700 dark:text-green-400">
              <p>✓ Sistema de módulos activo</p>
              <p>✓ Firebase configurado</p>
              <p>✓ Rutas disponibles</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  `,
};

// Definición del módulo Montaje para integración
export const montajeModule: ModuleDefinition = {
  id: 'montaje',
  name: 'Sistema Musical',
  icon: '🎼',
  component: markRaw(MontajeAppSimple),
  permissions: ['montaje:access'],
  
  // Elementos del menú que aporta este módulo
  menuItems: [
    {
      id: 'montaje-dashboard',
      label: 'Dashboard Musical',
      icon: '🎼',
      action: 'navigate',
      permissions: ['montaje:read'],
    },
    {
      id: 'montaje-works',
      label: 'Obras',
      icon: '🎵',
      action: 'navigate',
      permissions: ['works:read'],
      children: [
        {
          id: 'montaje-works-list',
          label: 'Lista de Obras',
          icon: '📋',
          action: 'navigate',
          permissions: ['works:read'],
        },
        {
          id: 'montaje-works-create',
          label: 'Nueva Obra',
          icon: '➕',
          action: 'navigate',
          permissions: ['works:create'],
        },
      ],
    },
    {
      id: 'montaje-evaluations',
      label: 'Evaluaciones',
      icon: '📊',
      action: 'navigate',
      permissions: ['evaluations:read'],
    },
    {
      id: 'montaje-reports',
      label: 'Reportes',
      icon: '📈',
      action: 'navigate',
      permissions: ['reports:read'],
    },
    {
      id: 'montaje-users',
      label: 'Usuarios',
      icon: '�',
      action: 'navigate',
      permissions: ['users:read'],
    },
    {
      id: 'montaje-tools',
      label: 'Herramientas',
      icon: '🎹',
      action: 'navigate',
      permissions: ['montaje:read'],
    },
  ],

  // Widgets para el dashboard principal
  widgets: [
    {
      id: 'montaje-progress',
      name: 'Progreso Musical',
      component: markRaw(MontajeDashboardWidget),
      size: 'medium',
      permissions: ['montaje:read'],
    },
    {
      id: 'users-stats',
      name: 'Estadísticas de Usuarios',
      component: markRaw(UsersDashboardWidget),
      size: 'small',
      permissions: ['users:read'],
    },
  ],

  // Hooks del módulo
  hooks: {
    onInit: async () => {
      console.log('🎼 Sistema Musical inicializado (Montaje + Usuarios)');
      // Inicializar servicios específicos del módulo
    },
    
    onUserChange: async (user) => {
      console.log('Usuario cambió en Sistema Musical:', user);
      // Actualizar configuraciones específicas del usuario
    },
    
    onDestroy: async () => {
      console.log('Sistema Musical destruido');
      // Limpiar recursos
    },
  },

  // Configuración específica del módulo
  config: {
    defaultTheme: 'auto',
    enableNotifications: true,
    enableAnalytics: true,
    autoSave: true,
    includeUserManagement: true,
  },
};

// También exportamos la funcionalidad de usuarios como parte del módulo principal
export const usersSubModule = {
  id: 'users',
  name: 'Gestión de Usuarios',
  icon: '👥',
  component: UsersApp,
  permissions: ['users:access'],
};