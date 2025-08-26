import { ref, computed, onMounted } from 'vue';

export type ThemeMode = 'light' | 'dark' | 'auto';

const THEME_STORAGE_KEY = 'music-academy-theme';

// Estado reactivo global del tema, exportado para ser accesible
export const currentTheme = ref<ThemeMode>('auto');
export const isDarkMode = ref(false);

/**
 * Composable principal para la gestión de la lógica del tema.
 * Esta función es autocontenida y no depende de provide/inject.
 * Devuelve un conjunto de herramientas para manipular y reaccionar a los cambios de tema.
 */
export function useTheme() {
  // Detecta la preferencia de tema del sistema operativo
  const getSystemTheme = (): 'light' | 'dark' => {
    if (typeof window === 'undefined') return 'light';
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  };

  // Aplica el tema (claro u oscuro) al DOM
  const applyTheme = (theme: 'light' | 'dark') => {
    if (typeof document === 'undefined') return;

    const html = document.documentElement;
    if (theme === 'dark') {
      html.classList.add('dark');
      html.setAttribute('data-theme', 'dark');
      isDarkMode.value = true;
    } else {
      html.classList.remove('dark');
      html.setAttribute('data-theme', 'light');
      isDarkMode.value = false;
    }
    html.style.colorScheme = theme;
  };

  // Actualiza el tema visual basado en la configuración actual
  const updateTheme = () => {
    if (currentTheme.value === 'auto') {
      applyTheme(getSystemTheme());
    } else {
      applyTheme(currentTheme.value);
    }
  };

  // Cambia el tema actual y lo guarda en localStorage
  const setTheme = (theme: ThemeMode) => {
    currentTheme.value = theme;
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(THEME_STORAGE_KEY, theme);
    }
    updateTheme();
  };

  // Alterna entre el tema claro y oscuro
  const toggleTheme = () => {
    const newTheme = isDarkMode.value ? 'light' : 'dark';
    setTheme(newTheme);
  };

  // Inicializa el tema al cargar la aplicación
  const initTheme = () => {
    if (typeof localStorage === 'undefined') return () => {};

    const savedTheme = localStorage.getItem(THEME_STORAGE_KEY) as ThemeMode;
    if (savedTheme && ['light', 'dark', 'auto'].includes(savedTheme)) {
      currentTheme.value = savedTheme;
    }

    updateTheme();

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleSystemThemeChange = () => {
      if (currentTheme.value === 'auto') {
        updateTheme();
      }
    };

    mediaQuery.addEventListener('change', handleSystemThemeChange);

    // Devuelve una función de limpieza para eliminar el listener
    return () => {
      mediaQuery.removeEventListener('change', handleSystemThemeChange);
    };
  };

  // Propiedad computada que devuelve el tema efectivo ('light' o 'dark')
  const effectiveTheme = computed(() => {
    return currentTheme.value === 'auto' ? getSystemTheme() : currentTheme.value;
  });

  // Propiedad computada para saber si el modo oscuro está activo
  const isCurrentlyDark = computed(() => effectiveTheme.value === 'dark');

  // Propiedad computada para obtener la clase CSS del tema
  const themeClass = computed(() => (isCurrentlyDark.value ? 'dark' : 'light'));

  // Hook que se ejecuta cuando el componente que usa este composable se monta
  onMounted(() => {
    const cleanup = initTheme();
    // Vue se encargará de llamar a esta función de limpieza al desmontar el componente
  });

  return {
    currentTheme,
    isDarkMode,
    effectiveTheme,
    isCurrentlyDark,
    themeClass,
    setTheme,
    toggleTheme,
    initTheme,
    THEME_MODES: ['light', 'dark', 'auto'] as const,
  };
}
