import { defineStore } from 'pinia';
import { ref, computed } from 'vue';

export type Theme = 'light' | 'dark' | 'system';

export const useThemeStore = defineStore('theme', () => {
  // State
  const currentTheme = ref<Theme>('system');
  const systemPrefersDark = ref(false);

  // Getters
  const isDarkMode = computed(() => {
    if (currentTheme.value === 'system') {
      return systemPrefersDark.value;
    }
    return currentTheme.value === 'dark';
  });

  const themeIcon = computed(() => {
    return isDarkMode.value ? 'SunIcon' : 'MoonIcon';
  });

  // Actions
  const setTheme = (theme: Theme) => {
    currentTheme.value = theme;
    applyTheme();
    saveThemePreference();
  };

  const toggleTheme = () => {
    if (currentTheme.value === 'system') {
      setTheme('light');
    } else if (currentTheme.value === 'light') {
      setTheme('dark');
    } else {
      setTheme('system');
    }
  };

  const applyTheme = () => {
    const root = document.documentElement;
    
    if (isDarkMode.value) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  };

  const initializeTheme = () => {
    // Load saved preference
    const saved = localStorage.getItem('theme-preference');
    if (saved && ['light', 'dark', 'system'].includes(saved)) {
      currentTheme.value = saved as Theme;
    }

    // Set up system theme detection
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    systemPrefersDark.value = mediaQuery.matches;
    
    // Listen for system theme changes
    mediaQuery.addEventListener('change', (e) => {
      systemPrefersDark.value = e.matches;
      if (currentTheme.value === 'system') {
        applyTheme();
      }
    });

    // Apply initial theme
    applyTheme();
  };

  const saveThemePreference = () => {
    localStorage.setItem('theme-preference', currentTheme.value);
  };

  // Color palette utilities
  const getThemeColors = () => {
    return {
      primary: {
        50: isDarkMode.value ? '#eff6ff' : '#eff6ff',
        100: isDarkMode.value ? '#dbeafe' : '#dbeafe',
        200: isDarkMode.value ? '#bfdbfe' : '#bfdbfe',
        300: isDarkMode.value ? '#93c5fd' : '#93c5fd',
        400: isDarkMode.value ? '#60a5fa' : '#60a5fa',
        500: isDarkMode.value ? '#3b82f6' : '#3b82f6',
        600: isDarkMode.value ? '#2563eb' : '#2563eb',
        700: isDarkMode.value ? '#1d4ed8' : '#1d4ed8',
        800: isDarkMode.value ? '#1e40af' : '#1e40af',
        900: isDarkMode.value ? '#1e3a8a' : '#1e3a8a',
      },
      gray: {
        50: isDarkMode.value ? '#f9fafb' : '#f9fafb',
        100: isDarkMode.value ? '#f3f4f6' : '#f3f4f6',
        200: isDarkMode.value ? '#e5e7eb' : '#e5e7eb',
        300: isDarkMode.value ? '#d1d5db' : '#d1d5db',
        400: isDarkMode.value ? '#9ca3af' : '#9ca3af',
        500: isDarkMode.value ? '#6b7280' : '#6b7280',
        600: isDarkMode.value ? '#4b5563' : '#4b5563',
        700: isDarkMode.value ? '#374151' : '#374151',
        800: isDarkMode.value ? '#1f2937' : '#1f2937',
        900: isDarkMode.value ? '#111827' : '#111827',
      }
    };
  };

  const getContrastColor = (backgroundColor: string) => {
    // Simple contrast calculation
    const hex = backgroundColor.replace('#', '');
    const r = parseInt(hex.substr(0, 2), 16);
    const g = parseInt(hex.substr(2, 2), 16);
    const b = parseInt(hex.substr(4, 2), 16);
    const brightness = ((r * 299) + (g * 587) + (b * 114)) / 1000;
    return brightness > 128 ? '#000000' : '#ffffff';
  };

  // Reset function
  const $reset = () => {
    currentTheme.value = 'system';
    systemPrefersDark.value = false;
    localStorage.removeItem('theme-preference');
    applyTheme();
  };

  return {
    // State
    currentTheme,
    systemPrefersDark,
    
    // Getters
    isDarkMode,
    themeIcon,
    
    // Actions
    setTheme,
    toggleTheme,
    initializeTheme,
    getThemeColors,
    getContrastColor,
    
    // Reset
    $reset,
  };
});