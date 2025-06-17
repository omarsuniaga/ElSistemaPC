import { ref, computed, onMounted, watch } from 'vue'

export type ThemeMode = 'light' | 'dark' | 'auto'

const THEME_STORAGE_KEY = 'music-academy-theme'

// Estado reactivo global del tema
const currentTheme = ref<ThemeMode>('auto')
const isDarkMode = ref(false)

export function useTheme() {  // Detectar preferencia del sistema
  const getSystemTheme = (): 'light' | 'dark' => {
    if (typeof window === 'undefined') return 'light'
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
  }

  // Aplicar tema al HTML
  const applyTheme = (theme: 'light' | 'dark') => {
    if (typeof document === 'undefined') return
    
    const html = document.documentElement
    const body = document.body
    
    if (theme === 'dark') {
      html.classList.add('dark')
      body.classList.add('dark')
      html.setAttribute('data-theme', 'dark')
      isDarkMode.value = true
    } else {
      html.classList.remove('dark')
      body.classList.remove('dark')
      html.setAttribute('data-theme', 'light')
      isDarkMode.value = false
    }
    
    // Forzar recálculo de estilos
    html.style.colorScheme = theme
  }

  // Actualizar tema basado en la configuración actual
  const updateTheme = () => {
    if (currentTheme.value === 'auto') {
      applyTheme(getSystemTheme())
    } else {
      applyTheme(currentTheme.value)
    }
  }

  // Cambiar tema
  const setTheme = (theme: ThemeMode) => {
    currentTheme.value = theme
    localStorage.setItem(THEME_STORAGE_KEY, theme)
    updateTheme()
  }

  // Alternar entre claro y oscuro
  const toggleTheme = () => {
    if (currentTheme.value === 'auto') {
      // Si está en auto, cambiar al opuesto del sistema
      const systemTheme = getSystemTheme()
      setTheme(systemTheme === 'dark' ? 'light' : 'dark')
    } else {
      // Si está manual, alternar
      setTheme(currentTheme.value === 'dark' ? 'light' : 'dark')
    }
  }
  // Inicializar tema
  const initTheme = () => {
    if (typeof window === 'undefined' || typeof localStorage === 'undefined') return
    
    // Cargar tema guardado
    const savedTheme = localStorage.getItem(THEME_STORAGE_KEY) as ThemeMode
    if (savedTheme && ['light', 'dark', 'auto'].includes(savedTheme)) {
      currentTheme.value = savedTheme
    }

    // Aplicar tema inicial
    updateTheme()

    // Escuchar cambios en la preferencia del sistema
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    const handleSystemThemeChange = () => {
      if (currentTheme.value === 'auto') {
        updateTheme()
      }
    }

    mediaQuery.addEventListener('change', handleSystemThemeChange)

    // Limpiar listener al desmontar
    return () => {
      mediaQuery.removeEventListener('change', handleSystemThemeChange)
    }
  }

  // Computed para obtener el tema efectivo
  const effectiveTheme = computed(() => {
    if (currentTheme.value === 'auto') {
      return getSystemTheme()
    }
    return currentTheme.value
  })

  // Computed para determinar si es modo oscuro
  const isCurrentlyDark = computed(() => {
    return effectiveTheme.value === 'dark'
  })

  // Clase CSS para el tema actual
  const themeClass = computed(() => {
    return isCurrentlyDark.value ? 'dark' : 'light'
  })
  // Obtener colores CSS actuales
  const getThemeColor = (cssVar: string): string => {
    if (typeof document === 'undefined') return ''
    return getComputedStyle(document.documentElement).getPropertyValue(cssVar).trim()
  }

  // Helpers para colores comunes
  const colors = computed(() => ({
    primary: getThemeColor('--color-primary'),
    secondary: getThemeColor('--color-secondary'),
    accent: getThemeColor('--color-accent'),
    background: getThemeColor('--color-background'),
    surface: getThemeColor('--color-surface'),
    textPrimary: getThemeColor('--color-text-primary'),
    textSecondary: getThemeColor('--color-text-secondary'),
    border: getThemeColor('--color-border'),
    success: getThemeColor('--color-success'),
    warning: getThemeColor('--color-warning'),
    error: getThemeColor('--color-error'),
    info: getThemeColor('--color-info')
  }))

  return {
    // Estado
    currentTheme,
    isDarkMode,
    effectiveTheme,
    isCurrentlyDark,
    themeClass,
    colors,

    // Métodos
    setTheme,
    toggleTheme,
    initTheme,
    getThemeColor,

    // Constantes
    THEME_MODES: ['light', 'dark', 'auto'] as const
  }
}

// Hook para usar en componentes
export function useThemeSetup() {
  const theme = useTheme()
  
  onMounted(() => {
    const cleanup = theme.initTheme()
    
    // Limpiar al desmontar el componente
    return cleanup
  })

  return theme
}

// Función para configurar el tema globalmente
export function setupGlobalTheme() {
  const theme = useTheme()
  theme.initTheme()
  return theme
}
