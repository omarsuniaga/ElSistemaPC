<template>
  <div class="relative">
    <button
      @click="showThemeMenu = !showThemeMenu"
      :class="[
        'p-2 rounded-lg transition-colors',
        themeClasses.hover,
        themeClasses.text.secondary
      ]"
      :title="`Tema: ${getThemeLabel}`"
    >
      <span class="text-xl">{{ getThemeIcon }}</span>
    </button>

    <!-- Theme Menu -->
    <div 
      v-if="showThemeMenu"
      :class="[
        'absolute right-0 mt-2 w-64 rounded-lg shadow-lg border z-50',
        themeClasses.surface,
        themeClasses.border
      ]"
    >
      <div :class="['p-4 border-b', themeClasses.border]">
        <h3 :class="['font-semibold', themeClasses.text.primary]">
          Configuración de Tema
        </h3>
      </div>

      <div class="p-4 space-y-4">
        <!-- Theme Selection -->
        <div>
          <label :class="['block text-sm font-medium mb-2', themeClasses.text.primary]">
            Modo de Tema
          </label>
          <div class="space-y-2">
            <label 
              v-for="option in themeOptions"
              :key="option.value"
              class="flex items-center gap-3 cursor-pointer"
            >
              <input
                :value="option.value"
                :checked="theme === option.value"
                @change="setTheme(option.value)"
                type="radio"
                name="theme"
                class="text-blue-600 focus:ring-blue-500"
              >
              <span class="text-lg">{{ option.icon }}</span>
              <div>
                <div :class="['text-sm font-medium', themeClasses.text.primary]">
                  {{ option.label }}
                </div>
                <div :class="['text-xs', themeClasses.text.muted]">
                  {{ option.description }}
                </div>
              </div>
            </label>
          </div>
        </div>

        <!-- System Preference Info -->
        <div v-if="theme === 'auto'" :class="['p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20']">
          <div class="flex items-center gap-2">
            <span class="text-blue-500">ℹ️</span>
            <span :class="['text-sm', themeClasses.text.secondary]">
              Sistema: {{ systemPreference === 'dark' ? 'Oscuro' : 'Claro' }}
            </span>
          </div>
        </div>

        <!-- Custom Colors -->
        <div>
          <label :class="['block text-sm font-medium mb-2', themeClasses.text.primary]">
            Colores Personalizados
          </label>
          <div class="grid grid-cols-3 gap-2">
            <div>
              <label :class="['block text-xs mb-1', themeClasses.text.muted]">
                Primario
              </label>
              <input
                :value="customColors?.primary || '#3B82F6'"
                @input="updateCustomColor('primary', $event.target.value)"
                type="color"
                class="w-full h-8 rounded border border-gray-300 dark:border-gray-600"
              >
            </div>
            <div>
              <label :class="['block text-xs mb-1', themeClasses.text.muted]">
                Secundario
              </label>
              <input
                :value="customColors?.secondary || '#10B981'"
                @input="updateCustomColor('secondary', $event.target.value)"
                type="color"
                class="w-full h-8 rounded border border-gray-300 dark:border-gray-600"
              >
            </div>
            <div>
              <label :class="['block text-xs mb-1', themeClasses.text.muted]">
                Acento
              </label>
              <input
                :value="customColors?.accent || '#8B5CF6'"
                @input="updateCustomColor('accent', $event.target.value)"
                type="color"
                class="w-full h-8 rounded border border-gray-300 dark:border-gray-600"
              >
            </div>
          </div>
        </div>

        <!-- Reset Button -->
        <button
          @click="resetCustomColors"
          :class="[
            'w-full px-3 py-2 text-sm rounded-lg border transition-colors',
            themeClasses.border,
            themeClasses.text.secondary,
            themeClasses.hover
          ]"
        >
          Restablecer Colores
        </button>
      </div>
    </div>

    <!-- Overlay -->
    <div 
      v-if="showThemeMenu"
      @click="showThemeMenu = false"
      class="fixed inset-0 z-40"
    ></div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useTheme } from '../composables/useTheme'

const { 
  theme, 
  currentTheme, 
  systemPreference, 
  customColors,
  themeClasses,
  getThemeIcon,
  getThemeLabel,
  setTheme,
  setCustomColors,
  toggleTheme
} = useTheme()

const showThemeMenu = ref(false)

const themeOptions = [
  {
    value: 'auto',
    icon: '🔄',
    label: 'Automático',
    description: 'Sigue la configuración del sistema'
  },
  {
    value: 'light',
    icon: '☀️',
    label: 'Claro',
    description: 'Tema claro siempre'
  },
  {
    value: 'dark',
    icon: '🌙',
    label: 'Oscuro',
    description: 'Tema oscuro siempre'
  }
]

const updateCustomColor = (colorKey: string, value: string) => {
  setCustomColors({ [colorKey]: value })
}

const resetCustomColors = () => {
  setCustomColors({
    primary: '#3B82F6',
    secondary: '#10B981',
    accent: '#8B5CF6'
  })
}
</script>