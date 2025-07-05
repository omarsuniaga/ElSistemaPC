<template>
  <div class="bg-white dark:bg-gray-800 rounded-lg shadow p-4 sm:p-6">
    <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-4">Acciones Rápidas</h3>
    <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
      <router-link
        v-for="action in actions"
        :key="action.name"
        :to="action.route"
        class="group flex flex-col items-center justify-center p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-700/50 transition-colors duration-200 relative"
      >
        <div class="flex-shrink-0 bg-blue-500 rounded-lg p-3 mb-3">
          <component :is="action.icon" class="h-6 w-6 text-white" />
        </div>
        <p class="font-medium text-gray-900 dark:text-white text-center">{{ action.name }}</p>
        <p class="text-xs text-gray-500 dark:text-gray-400 text-center">{{ action.description }}</p>
        <div class="absolute top-2 right-2 group">
          <QuestionMarkCircleIcon class="h-4 w-4 text-gray-400 dark:text-gray-500 cursor-pointer" />
          <div
            class="absolute top-full right-0 mt-2 w-48 bg-gray-700 text-white text-xs rounded py-1 px-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none z-10"
          >
            {{ action.tooltip }}
          </div>
        </div>
      </router-link>
    </div>
  </div>
</template>

<script setup lang="ts">
import {
  UsersIcon,
  CalendarIcon,
  DocumentChartBarIcon,
  ChatBubbleBottomCenterTextIcon,
  CogIcon,
  ShieldCheckIcon,
} from "@heroicons/vue/24/outline"
import {QuestionMarkCircleIcon} from "@heroicons/vue/24/solid"

defineOptions({name: "QuickActionsPanel"})

const actions = [
  {
    name: "Gestionar Estudiantes",
    description: "Ver, crear y editar perfiles",
    icon: UsersIcon,
    route: "/admin/students",
    tooltip:
      "Accede a la gestión completa de estudiantes: añadir nuevos, editar existentes y ver detalles.",
  },
  {
    name: "Ver Horario General",
    description: "Calendario de todas las clases",
    icon: CalendarIcon,
    route: "/admin/schedules",
    tooltip: "Visualiza el horario consolidado de todas las clases y maestros de la academia.",
  },
  {
    name: "Centro de Reportes",
    description: "Generar PDFs y análisis",
    icon: DocumentChartBarIcon,
    route: "/admin/reports",
    tooltip:
      "Genera reportes detallados de asistencia, rendimiento y otros datos operativos en formatos PDF y Excel.",
  },
  {
    name: "Configurar WhatsApp",
    description: "Conexión y plantillas",
    icon: ChatBubbleBottomCenterTextIcon,
    route: "/admin/whatsapp",
    tooltip:
      "Administra la conexión de WhatsApp y personaliza las plantillas de mensajes para las notificaciones automáticas.",
  },
  {
    name: "Permisos y Roles",
    description: "Administrar acceso (RBAC)",
    icon: ShieldCheckIcon,
    route: "/admin/permissions",
    tooltip:
      "Define y gestiona los roles de usuario y sus permisos de acceso a las diferentes secciones de la aplicación.",
  },
  {
    name: "Ajustes del Sistema",
    description: "Configuraciones generales",
    icon: CogIcon,
    route: "/admin/system",
    tooltip:
      "Accede a las configuraciones generales de la aplicación, como el nombre de la academia, datos de contacto, etc.",
  },
]
</script>
