<template>
  <div class="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50" @click="$emit('close')">
    <div class="relative top-10 mx-auto p-6 border max-w-2xl shadow-lg rounded-md bg-white dark:bg-gray-800" @click.stop>
      <!-- Header -->
      <div class="flex items-center justify-between mb-6">
        <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
          Detalles de Actividad
        </h3>
        <button
          @click="$emit('close')"
          class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors duration-200"
        >
          <XMarkIcon class="w-6 h-6" />
        </button>
      </div>

      <!-- Activity Info -->
      <div class="space-y-4">
        <!-- Basic Info -->
        <div class="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
          <div class="flex items-start space-x-4">
            <div class="p-2 rounded-lg" :class="getActivityIconBg(activity)">
              <component :is="getActivityIcon(activity)" class="w-6 h-6" :class="getActivityIconColor(activity)" />
            </div>
            
            <div class="flex-1">
              <h4 class="text-lg font-medium text-gray-900 dark:text-white mb-2">
                {{ activity.description }}
              </h4>
              
              <div class="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span class="text-gray-500 dark:text-gray-400">Usuario:</span>
                  <span class="ml-2 font-medium text-gray-900 dark:text-white">{{ activity.user }}</span>
                </div>
                <div>
                  <span class="text-gray-500 dark:text-gray-400">Entidad:</span>
                  <span class="ml-2 font-medium text-gray-900 dark:text-white capitalize">{{ activity.entity }}</span>
                </div>
                <div>
                  <span class="text-gray-500 dark:text-gray-400">Tipo:</span>
                  <span class="ml-2 inline-flex items-center px-2 py-1 rounded-full text-xs font-medium capitalize" :class="getTypeClasses(activity.type)">
                    {{ activity.type }}
                  </span>
                </div>
                <div>
                  <span class="text-gray-500 dark:text-gray-400">Fecha:</span>
                  <span class="ml-2 font-medium text-gray-900 dark:text-white">
                    {{ formatFullDate(activity.timestamp) }}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Priority -->
        <div v-if="activity.priority" class="flex items-center space-x-2">
          <span class="text-sm text-gray-500 dark:text-gray-400">Prioridad:</span>
          <span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium" :class="getPriorityClasses(activity.priority)">
            {{ getPriorityLabel(activity.priority) }}
          </span>
        </div>

        <!-- Metadata -->
        <div v-if="activity.metadata && Object.keys(activity.metadata).length > 0" class="space-y-2">
          <h5 class="text-sm font-medium text-gray-900 dark:text-white">Detalles Adicionales</h5>
          <div class="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
            <dl class="grid grid-cols-1 gap-3">
              <div v-for="(value, key) in activity.metadata" :key="key" class="flex justify-between">
                <dt class="text-sm text-gray-500 dark:text-gray-400 capitalize">
                  {{ formatKey(key) }}:
                </dt>
                <dd class="text-sm font-medium text-gray-900 dark:text-white text-right">
                  {{ formatValue(value) }}
                </dd>
              </div>
            </dl>
          </div>
        </div>

        <!-- Impact Analysis -->
        <div v-if="showImpactAnalysis" class="space-y-2">
          <h5 class="text-sm font-medium text-gray-900 dark:text-white">Análisis de Impacto</h5>
          <div class="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg p-4">
            <div class="flex items-start space-x-3">
              <InformationCircleIcon class="w-5 h-5 text-blue-500 mt-0.5" />
              <div class="text-sm text-blue-700 dark:text-blue-300">
                <p class="mb-2">Esta actividad {{ getImpactDescription(activity) }}</p>
                <ul class="list-disc list-inside space-y-1 text-xs">
                  <li v-for="impact in getImpactPoints(activity)" :key="impact">{{ impact }}</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        <!-- Related Activities -->
        <div v-if="relatedActivities && relatedActivities.length > 0" class="space-y-2">
          <h5 class="text-sm font-medium text-gray-900 dark:text-white">Actividades Relacionadas</h5>
          <div class="space-y-2">
            <div 
              v-for="related in relatedActivities" 
              :key="related.id"
              class="flex items-center space-x-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
            >
              <div class="w-2 h-2 rounded-full" :class="getActivityIconColor(related)"></div>
              <div class="flex-1">
                <p class="text-sm text-gray-900 dark:text-white">{{ related.description }}</p>
                <p class="text-xs text-gray-500 dark:text-gray-400">{{ formatTimeAgo(related.timestamp) }}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Actions -->
      <div class="mt-6 flex justify-end space-x-3">
        <button
          @click="$emit('close')"
          class="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors duration-200"
        >
          Cerrar
        </button>
        
        <button
          v-if="canRevert"
          @click="handleRevert"
          class="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-md transition-colors duration-200"
        >
          Revertir Acción
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import {
  XMarkIcon,
  InformationCircleIcon,
  UserPlusIcon,
  PencilIcon,
  TrashIcon,
  ArrowRightOnRectangleIcon,
  UserGroupIcon,
  CheckCircleIcon,
  BellIcon
} from '@heroicons/vue/24/outline'

interface Activity {
  id: string
  type: 'create' | 'update' | 'delete' | 'login' | 'assignment' | 'approval'
  entity: string
  description: string
  user: string
  timestamp: Date
  icon?: string
  color?: string
  priority?: 'low' | 'medium' | 'high'
  metadata?: any
}

interface Props {
  activity: Activity
  relatedActivities?: Activity[]
  showImpactAnalysis?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  showImpactAnalysis: true
})

const emit = defineEmits<{
  close: []
  revert: [activity: Activity]
}>()

// Icon mapping
const activityIcons = {
  create: UserPlusIcon,
  update: PencilIcon,
  delete: TrashIcon,
  login: ArrowRightOnRectangleIcon,
  assignment: UserGroupIcon,
  approval: CheckCircleIcon,
  default: BellIcon
}

// Computed
const canRevert = computed(() => {
  // Only certain activities can be reverted
  return ['create', 'update', 'delete', 'assignment'].includes(props.activity.type) &&
         props.activity.entity !== 'login'
})

// Methods
const getActivityIcon = (activity: Activity) => {
  return activityIcons[activity.type] || activityIcons.default
}

const getActivityIconBg = (activity: Activity) => {
  const colorMap = {
    create: 'bg-green-100 dark:bg-green-900/20',
    update: 'bg-blue-100 dark:bg-blue-900/20',
    delete: 'bg-red-100 dark:bg-red-900/20',
    login: 'bg-purple-100 dark:bg-purple-900/20',
    assignment: 'bg-orange-100 dark:bg-orange-900/20',
    approval: 'bg-green-100 dark:bg-green-900/20',
    default: 'bg-gray-100 dark:bg-gray-700'
  }
  
  return colorMap[activity.type] || colorMap.default
}

const getActivityIconColor = (activity: Activity) => {
  const colorMap = {
    create: 'text-green-600 dark:text-green-400',
    update: 'text-blue-600 dark:text-blue-400',
    delete: 'text-red-600 dark:text-red-400',
    login: 'text-purple-600 dark:text-purple-400',
    assignment: 'text-orange-600 dark:text-orange-400',
    approval: 'text-green-600 dark:text-green-400',
    default: 'text-gray-600 dark:text-gray-400'
  }
  
  return colorMap[activity.type] || colorMap.default
}

const getTypeClasses = (type: string) => {
  const classMap = {
    create: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
    update: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
    delete: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
    login: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300',
    assignment: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300',
    approval: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
  }
  
  return classMap[type as keyof typeof classMap] || 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
}

const getPriorityClasses = (priority: string) => {
  const classMap = {
    low: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
    medium: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
    high: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
  }
  
  return classMap[priority as keyof typeof classMap] || 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
}

const getPriorityLabel = (priority: string) => {
  const labelMap = {
    low: 'Baja',
    medium: 'Media',
    high: 'Alta'
  }
  
  return labelMap[priority as keyof typeof labelMap] || 'Normal'
}

const formatFullDate = (date: Date): string => {
  return new Intl.DateTimeFormat('es-ES', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  }).format(date)
}

const formatTimeAgo = (timestamp: Date): string => {
  const now = new Date()
  const diffInSeconds = Math.floor((now.getTime() - timestamp.getTime()) / 1000)
  
  if (diffInSeconds < 60) {
    return 'Ahora'
  } else if (diffInSeconds < 3600) {
    const minutes = Math.floor(diffInSeconds / 60)
    return `${minutes}m`
  } else if (diffInSeconds < 86400) {
    const hours = Math.floor(diffInSeconds / 3600)
    return `${hours}h`
  } else {
    const days = Math.floor(diffInSeconds / 86400)
    return `${days}d`
  }
}

const formatKey = (key: string): string => {
  return key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())
}

const formatValue = (value: any): string => {
  if (value === null || value === undefined) return 'N/A'
  if (typeof value === 'boolean') return value ? 'Sí' : 'No'
  if (typeof value === 'object') return JSON.stringify(value, null, 2)
  return String(value)
}

const getImpactDescription = (activity: Activity): string => {
  const descriptions = {
    create: 'ha creado un nuevo elemento en el sistema',
    update: 'ha modificado información existente',
    delete: 'ha eliminado información del sistema',
    login: 'ha iniciado sesión en el sistema',
    assignment: 'ha realizado una asignación',
    approval: 'ha procesado una aprobación'
  }
  
  return descriptions[activity.type] || 'ha realizado una acción en el sistema'
}

const getImpactPoints = (activity: Activity): string[] => {
  const impactMap = {
    create: [
      'Se ha añadido nuevo contenido',
      'Puede afectar reportes y estadísticas',
      'Los usuarios autorizados tendrán acceso'
    ],
    update: [
      'La información ha sido modificada',
      'Los cambios son visibles inmediatamente',
      'Puede afectar funcionalidades relacionadas'
    ],
    delete: [
      'La información ha sido eliminada permanentemente',
      'Las referencias pueden verse afectadas',
      'Se recomienda verificar integridad de datos'
    ],
    assignment: [
      'Se ha creado una nueva relación',
      'Los permisos pueden haber cambiado',
      'Verificar accesos y funcionalidades'
    ]
  }
  
  return impactMap[activity.type as keyof typeof impactMap] || ['Actividad registrada en el sistema']
}

const handleRevert = () => {
  emit('revert', props.activity)
}
</script>
