inde
<template>
  <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
    <div
      class="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-3xl w-full mx-4 max-h-[90vh] overflow-y-auto"
    >
      <div class="p-6 border-b border-gray-200 dark:border-gray-700">
        <div class="flex items-center justify-between">
          <h2 class="text-2xl font-bold text-gray-900 dark:text-white flex items-center">
            <SwatchIcon class="w-6 h-6 mr-2 text-purple-500" />
            Gestión de Temas y Colores
          </h2>
          <button
            @click="$emit('close')"
            class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <XMarkIcon class="w-6 h-6" />
          </button>
        </div>
        <p class="text-gray-600 dark:text-gray-400 mt-2">
          Configurar temas del sistema y paleta de colores global
        </p>
      </div>

      <div class="p-6 space-y-8">
        <!-- Theme Mode Selection -->
        <div>
          <h3 class="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center">
            <SunIcon class="w-5 h-5 mr-2 text-yellow-500" />
            Modo de Tema
          </h3>
          <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
            <label
              v-for="mode in themeModes"
              :key="mode.value"
              class="relative flex cursor-pointer rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 p-4 shadow-sm focus:outline-none"
              :class="{'ring-2 ring-purple-500 border-purple-500': currentTheme === mode.value}"
            >
              <input
                type="radio"
                :value="mode.value"
                v-model="currentTheme"
                @change="handleThemeChange"
                class="sr-only"
              />
              <div class="flex items-center space-x-3">
                <component :is="mode.icon" class="w-6 h-6" :class="mode.iconColor" />
                <div>
                  <div class="text-sm font-medium text-gray-900 dark:text-white">
                    {{ mode.label }}
                  </div>
                  <div class="text-xs text-gray-500 dark:text-gray-400">
                    {{ mode.description }}
                  </div>
                </div>
              </div>
            </label>
          </div>
        </div>

        <!-- Color Palette Customization -->
        <div>
          <h3 class="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center">
            <SwatchIcon class="w-5 h-5 mr-2 text-blue-500" />
            Paleta de Colores Personalizada
          </h3>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <!-- Primary Colors -->
            <div>
              <h4 class="font-medium text-gray-900 dark:text-white mb-3">Colores Primarios</h4>
              <div class="space-y-3">
                <div
                  v-for="color in primaryColors"
                  :key="color.key"
                  class="flex items-center justify-between p-3 border border-gray-200 dark:border-gray-600 rounded-lg"
                >
                  <div class="flex items-center space-x-3">
                    <div
                      class="w-8 h-8 rounded-full border-2 border-gray-300 dark:border-gray-600"
                      :style="{backgroundColor: color.value}"
                    ></div>
                    <div>
                      <div class="text-sm font-medium text-gray-900 dark:text-white">
                        {{ color.label }}
                      </div>
                      <div class="text-xs text-gray-500 dark:text-gray-400">
                        {{ color.value }}
                      </div>
                    </div>
                  </div>
                  <input
                    type="color"
                    :value="color.value"
                    @input="updateColor(color.key, $event.target.value)"
                    class="w-10 h-10 rounded border border-gray-300 dark:border-gray-600 cursor-pointer"
                  />
                </div>
              </div>
            </div>

            <!-- System Colors -->
            <div>
              <h4 class="font-medium text-gray-900 dark:text-white mb-3">Colores del Sistema</h4>
              <div class="space-y-3">
                <div
                  v-for="color in systemColors"
                  :key="color.key"
                  class="flex items-center justify-between p-3 border border-gray-200 dark:border-gray-600 rounded-lg"
                >
                  <div class="flex items-center space-x-3">
                    <div
                      class="w-8 h-8 rounded-full border-2 border-gray-300 dark:border-gray-600"
                      :style="{backgroundColor: color.value}"
                    ></div>
                    <div>
                      <div class="text-sm font-medium text-gray-900 dark:text-white">
                        {{ color.label }}
                      </div>
                      <div class="text-xs text-gray-500 dark:text-gray-400">
                        {{ color.value }}
                      </div>
                    </div>
                  </div>
                  <input
                    type="color"
                    :value="color.value"
                    @input="updateColor(color.key, $event.target.value)"
                    class="w-10 h-10 rounded border border-gray-300 dark:border-gray-600 cursor-pointer"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Preview Section -->
        <div>
          <h3 class="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center">
            <EyeIcon class="w-5 h-5 mr-2 text-green-500" />
            Vista Previa
          </h3>

          <div class="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 space-y-4">
            <!-- Button Preview -->
            <div class="flex items-center space-x-3">
              <button
                class="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors"
              >
                Primario
              </button>
              <button
                class="px-4 py-2 bg-secondary-600 hover:bg-secondary-700 text-white rounded-lg transition-colors"
              >
                Secundario
              </button>
              <button
                class="px-4 py-2 bg-accent-600 hover:bg-accent-700 text-white rounded-lg transition-colors"
              >
                Acento
              </button>
            </div>

            <!-- Alert Preview -->
            <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div class="p-3 bg-success-100 border border-success-200 text-success-800 rounded-lg">
                <strong>Éxito:</strong> Operación completada
              </div>
              <div class="p-3 bg-warning-100 border border-warning-200 text-warning-800 rounded-lg">
                <strong>Advertencia:</strong> Revisar configuración
              </div>
              <div class="p-3 bg-error-100 border border-error-200 text-error-800 rounded-lg">
                <strong>Error:</strong> Operación fallida
              </div>
              <div class="p-3 bg-info-100 border border-info-200 text-info-800 rounded-lg">
                <strong>Info:</strong> Nueva actualización
              </div>
            </div>
          </div>
        </div>

        <!-- Preset Themes -->
        <div>
          <h3 class="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center">
            <PaintBrushIcon class="w-5 h-5 mr-2 text-orange-500" />
            Temas Predefinidos
          </h3>

          <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button
              v-for="preset in presetThemes"
              :key="preset.name"
              @click="applyPreset(preset)"
              class="p-4 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-left"
            >
              <div class="flex items-center space-x-3 mb-2">
                <div class="flex space-x-1">
                  <div
                    v-for="color in preset.colors"
                    :key="color"
                    class="w-4 h-4 rounded-full"
                    :style="{backgroundColor: color}"
                  ></div>
                </div>
                <span class="font-medium text-gray-900 dark:text-white">{{ preset.name }}</span>
              </div>
              <p class="text-sm text-gray-500 dark:text-gray-400">{{ preset.description }}</p>
            </button>
          </div>
        </div>

        <!-- Action Buttons -->
        <div
          class="flex items-center justify-between pt-6 border-t border-gray-200 dark:border-gray-700"
        >
          <div class="flex items-center space-x-3">
            <button
              @click="resetToDefault"
              class="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              Restablecer
            </button>
            <button
              @click="exportTheme"
              class="px-4 py-2 bg-blue-100 hover:bg-blue-200 dark:bg-blue-900 dark:hover:bg-blue-800 text-blue-700 dark:text-blue-300 rounded-lg transition-colors"
            >
              Exportar
            </button>
          </div>

          <div class="flex items-center space-x-3">
            <button
              @click="$emit('close')"
              class="px-6 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              Cancelar
            </button>
            <button
              @click="saveTheme"
              class="px-6 py-2 bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-lg hover:from-purple-600 hover:to-purple-700 transition-all"
            >
              Guardar Cambios
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import {
  XMarkIcon,
  SwatchIcon,
  SunIcon,
  MoonIcon,
  ComputerDesktopIcon,
  EyeIcon,
  PaintBrushIcon
} from '@heroicons/vue/24/outline'
import { useTheme } from '@/composables/useTheme'

const emit = defineEmits<{
  close: []
  updated: [theme: any]
}>()

const { currentTheme, setTheme } = useTheme()

const themeModes = [
  {
    value: 'light',
    label: 'Claro',
    description: 'Tema claro siempre',
    icon: SunIcon,
    iconColor: 'text-yellow-500'
  },
  {
    value: 'dark',
    label: 'Oscuro',
    description: 'Tema oscuro siempre',
    icon: MoonIcon,
    iconColor: 'text-blue-500'
  },
  {
    value: 'auto',
    label: 'Automático',
    description: 'Según el sistema',
    icon: ComputerDesktopIcon,
    iconColor: 'text-gray-500'
  }
]

const primaryColors = ref([
  { key: 'primary', label: 'Primario', value: '#3b82f6' },
  { key: 'secondary', label: 'Secundario', value: '#6b7280' },
  { key: 'accent', label: 'Acento', value: '#8b5cf6' }
])

const systemColors = ref([
  { key: 'success', label: 'Éxito', value: '#10b981' },
  { key: 'warning', label: 'Advertencia', value: '#f59e0b' },
  { key: 'error', label: 'Error', value: '#ef4444' },
  { key: 'info', label: 'Información', value: '#3b82f6' }
])

const presetThemes = [
  {
    name: 'Default',
    description: 'Tema por defecto del sistema',
    colors: ['#3b82f6', '#6b7280', '#8b5cf6', '#10b981']
  },
  {
    name: 'Ocean',
    description: 'Tonos azules y verdes',
    colors: ['#0ea5e9', '#06b6d4', '#10b981', '#3b82f6']
  },
  {
    name: 'Forest',
    description: 'Tonos verdes naturales',
    colors: ['#059669', '#10b981', '#34d399', '#6ee7b7']
  },
  {
    name: 'Sunset',
    description: 'Tonos cálidos naranjas',
    colors: ['#f97316', '#fb923c', '#fbbf24', '#fcd34d']
  },
  {
    name: 'Purple',
    description: 'Tonos morados elegantes',
    colors: ['#7c3aed', '#8b5cf6', '#a78bfa', '#c4b5fd']
  },
  {
    name: 'Rose',
    description: 'Tonos rosas suaves',
    colors: ['#e11d48', '#f43f5e', '#fb7185', '#fda4af']
  }
]

const handleThemeChange = () => {
  setTheme(currentTheme.value)
}

const updateColor = (colorKey: string, newValue: string) => {
  // Update the color in the respective array
  const primaryColor = primaryColors.value.find(c => c.key === colorKey)
  if (primaryColor) {
    primaryColor.value = newValue
  }

  const systemColor = systemColors.value.find(c => c.key === colorKey)
  if (systemColor) {
    systemColor.value = newValue
  }

  // Apply the color to CSS custom properties
  document.documentElement.style.setProperty(`--color-${colorKey}`, newValue)

  // Generate variations (lighter/darker shades)
  const variations = generateColorVariations(newValue)
  variations.forEach((variation, index) => {
    const shade = (index + 1) * 100
    document.documentElement.style.setProperty(`--color-${colorKey}-${shade}`, variation)
  })
}

const generateColorVariations = (baseColor: string): string[] => {
  // Simple color variation generator
  // In a real implementation, you might want to use a proper color manipulation library
  const variations = []
  const r = parseInt(baseColor.slice(1, 3), 16)
  const g = parseInt(baseColor.slice(3, 5), 16)
  const b = parseInt(baseColor.slice(5, 7), 16)

  for (let i = 1; i <= 9; i++) {
    const factor = i <= 5 ? 1 + (i * 0.1) : 1 - ((i - 5) * 0.15)
    const newR = Math.min(255, Math.max(0, Math.round(r * factor)))
    const newG = Math.min(255, Math.max(0, Math.round(g * factor)))
    const newB = Math.min(255, Math.max(0, Math.round(b * factor)))

    variations.push(`#${newR.toString(16).padStart(2, '0')}${newG.toString(16).padStart(2, '0')}${newB.toString(16).padStart(2, '0')}`)
  }

  return variations
}

const applyPreset = (preset: any) => {
  const colorKeys = ['primary', 'secondary', 'accent', 'success']
  preset.colors.forEach((color: string, index: number) => {
    if (colorKeys[index]) {
      updateColor(colorKeys[index], color)
    }
  })
}

const resetToDefault = () => {
  primaryColors.value = [
    { key: 'primary', label: 'Primario', value: '#3b82f6' },
    { key: 'secondary', label: 'Secundario', value: '#6b7280' },
    { key: 'accent', label: 'Acento', value: '#8b5cf6' }
  ]

  systemColors.value = [
    { key: 'success', label: 'Éxito', value: '#10b981' },
    { key: 'warning', label: 'Advertencia', value: '#f59e0b' },
    { key: 'error', label: 'Error', value: '#ef4444' },
    { key: 'info', label: 'Información', value: '#3b82f6' }
  ]

  // Apply default colors
  [...primaryColors.value, ...systemColors.value].forEach(color => {
    updateColor(color.key, color.value)
  })
}

const exportTheme = () => {
  const themeConfig = {
    mode: currentTheme.value,
    colors: {
      ...Object.fromEntries(primaryColors.value.map(c => [c.key, c.value])),
      ...Object.fromEntries(systemColors.value.map(c => [c.key, c.value]))
    }
  }

  const blob = new Blob([JSON.stringify(themeConfig, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'music-academy-theme.json'
  a.click()
  URL.revokeObjectURL(url)
}

const saveTheme = () => {
  const themeConfig = {
    mode: currentTheme.value,
    colors: {
      ...Object.fromEntries(primaryColors.value.map(c => [c.key, c.value])),
      ...Object.fromEntries(systemColors.value.map(c => [c.key, c.value]))
    }
  }

  // Save to localStorage
  localStorage.setItem('music-academy-custom-theme', JSON.stringify(themeConfig))

  emit('updated', themeConfig)
  emit('close')
}

onMounted(() => {
  // Load saved custom theme if exists
  const savedTheme = localStorage.getItem('music-academy-custom-theme')
  if (savedTheme) {
    const theme = JSON.parse(savedTheme)
    if (theme.colors) {
      Object.entries(theme.colors).forEach(([key, value]) => {
        updateColor(key, value as string)
      })
    }
  }
})
</script>
