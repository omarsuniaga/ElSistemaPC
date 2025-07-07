import { ref, computed, watch } from 'vue'

export type Theme = 'light' | 'dark' | 'auto'

interface ThemeConfig {
  theme: Theme
  systemPreference: 'light' | 'dark'
  customColors?: {
    primary?: string
    secondary?: string
    accent?: string
  }
}

const themeConfig = ref<ThemeConfig>({
  theme: 'auto',
  systemPreference: 'light',
  customColors: {}
})

export function useTheme() {
  // Save theme preference to localStorage
  const saveThemePreference = () => {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('montaje_theme_config', JSON.stringify(themeConfig.value))
    }
  }

  // Load theme preference from localStorage
  const loadThemePreference = () => {
    if (typeof localStorage !== 'undefined') {
      const saved = localStorage.getItem('montaje_theme_config')
      if (saved) {
        try {
          const parsed = JSON.parse(saved)
          themeConfig.value = { ...themeConfig.value, ...parsed }
        } catch (error) {
          console.warn('Error loading theme preference:', error)
        }
      }
    }
  }

  // Detect system preference
  const detectSystemPreference = (): 'light' | 'dark' => {
    if (typeof window !== 'undefined') {
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
    }
    return 'light'
  }

  // Initialize system preference
  themeConfig.value.systemPreference = detectSystemPreference()

  // Listen for system preference changes
  if (typeof window !== 'undefined') {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    mediaQuery.addEventListener('change', (e) => {
      themeConfig.value.systemPreference = e.matches ? 'dark' : 'light'
    })
  }

  // Computed current theme
  const currentTheme = computed(() => {
    if (themeConfig.value.theme === 'auto') {
      return themeConfig.value.systemPreference
    }
    return themeConfig.value.theme
  })

  // Apply theme to document
  const applyTheme = (theme: 'light' | 'dark') => {
    if (typeof document !== 'undefined') {
      const root = document.documentElement
      
      if (theme === 'dark') {
        root.classList.add('dark')
        root.classList.remove('light')
      } else {
        root.classList.add('light')
        root.classList.remove('dark')
      }

      // Apply custom colors if any
      if (themeConfig.value.customColors) {
        Object.entries(themeConfig.value.customColors).forEach(([key, value]) => {
          if (value) {
            root.style.setProperty(`--color-${key}`, value)
          }
        })
      }
    }
  }

  // Watch for theme changes
  watch(currentTheme, (newTheme) => {
    applyTheme(newTheme)
    saveThemePreference()
  }, { immediate: true })

  // Set theme
  const setTheme = (theme: Theme) => {
    themeConfig.value.theme = theme
  }

  // Set custom colors
  const setCustomColors = (colors: ThemeConfig['customColors']) => {
    themeConfig.value.customColors = { ...themeConfig.value.customColors, ...colors }
    applyTheme(currentTheme.value)
    saveThemePreference()
  }

  // Toggle between light and dark
  const toggleTheme = () => {
    if (themeConfig.value.theme === 'auto') {
      setTheme('light')
    } else if (themeConfig.value.theme === 'light') {
      setTheme('dark')
    } else {
      setTheme('auto')
    }
  }

  // Get theme icon
  const getThemeIcon = computed(() => {
    switch (themeConfig.value.theme) {
      case 'light': return '☀️'
      case 'dark': return '🌙'
      case 'auto': return '🔄'
      default: return '🔄'
    }
  })

  // Get theme label
  const getThemeLabel = computed(() => {
    switch (themeConfig.value.theme) {
      case 'light': return 'Claro'
      case 'dark': return 'Oscuro'
      case 'auto': return 'Automático'
      default: return 'Automático'
    }
  })

  // CSS classes for current theme
  const themeClasses = computed(() => {
    const base = currentTheme.value === 'dark' ? 'dark' : 'light'
    return {
      base,
      background: currentTheme.value === 'dark' ? 'bg-gray-900' : 'bg-gray-50',
      surface: currentTheme.value === 'dark' ? 'bg-gray-800' : 'bg-white',
      text: {
        primary: currentTheme.value === 'dark' ? 'text-white' : 'text-gray-900',
        secondary: currentTheme.value === 'dark' ? 'text-gray-300' : 'text-gray-600',
        muted: currentTheme.value === 'dark' ? 'text-gray-400' : 'text-gray-500'
      },
      border: currentTheme.value === 'dark' ? 'border-gray-700' : 'border-gray-200',
      hover: currentTheme.value === 'dark' ? 'hover:bg-gray-700' : 'hover:bg-gray-50'
    }
  })

  // Initialize
  loadThemePreference()

  return {
    theme: computed(() => themeConfig.value.theme),
    currentTheme,
    systemPreference: computed(() => themeConfig.value.systemPreference),
    customColors: computed(() => themeConfig.value.customColors),
    themeClasses,
    getThemeIcon,
    getThemeLabel,
    setTheme,
    setCustomColors,
    toggleTheme,
    loadThemePreference,
    saveThemePreference
  }
}