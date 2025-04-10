import { ref, computed, inject, provide, onMounted, watch } from 'vue';
import { getThemePreference, saveThemePreference } from '../modulos/Users/service/userPreferences';
import { useAuthStore } from '../stores/auth';

// Clave para inyección de dependencia
const ThemeSymbol = Symbol('theme');

// Tipo de datos para el contexto de tema
export interface ThemeContext {
  isDarkMode: Ref<boolean>;
  toggleDarkMode: () => Promise<void>;
}

/**
 * Componer el contexto del tema para la aplicación
 */
export function createThemeContext() {
  const isDarkMode = ref(false);
  const authStore = useAuthStore();

  // Aplicar tema al elemento body
  const applyTheme = (isDark: boolean) => {
    if (isDark) {
      document.documentElement.classList.add('dark');
      document.body.classList.add('dark-mode');
    } else {
      document.documentElement.classList.remove('dark');
      document.body.classList.remove('dark-mode');
    }
  };

  // Cambiar el modo oscuro/claro y guardar la preferencia
  const toggleDarkMode = async () => {
    isDarkMode.value = !isDarkMode.value;
    applyTheme(isDarkMode.value);

    // Guardar preferencia en Firestore si el usuario está autenticado
    if (authStore.user?.uid) {
      try {
        await saveThemePreference(authStore.user.uid, isDarkMode.value);
        console.log('Preferencia de tema actualizada');
      } catch (error) {
        console.error('Error al actualizar preferencia de tema:', error);
      }
    }
  };

  // Cargar preferencia cuando el usuario cambia
  watch(
    () => authStore.user?.uid,
    async (newUserId) => {
      if (newUserId) {
        try {
          const preference = await getThemePreference(newUserId);
          if (preference !== null) {
            isDarkMode.value = preference;
            applyTheme(preference);
          }
        } catch (error) {
          console.error('Error al cargar preferencia de tema:', error);
        }
      }
    },
    { immediate: true }
  );

  // Inicializar tema al montar la aplicación
  onMounted(async () => {
    if (authStore.user?.uid) {
      try {
        const preference = await getThemePreference(authStore.user.uid);
        if (preference !== null) {
          isDarkMode.value = preference;
          applyTheme(preference);
        }
      } catch (error) {
        console.error('Error al cargar preferencia de tema inicial:', error);
      }
    }
  });

  return {
    isDarkMode,
    toggleDarkMode
  };
}

/**
 * Proveer el contexto del tema para la aplicación
 */
export function provideTheme() {
  const theme = createThemeContext();
  provide(ThemeSymbol, theme);
  return theme;
}

/**
 * Usar el contexto del tema en componentes
 */
export function useTheme(): ThemeContext {
  const theme = inject(ThemeSymbol);
  if (!theme) {
    throw new Error('useTheme debe usarse dentro de un componente que tenga provideTheme');
  }
  return theme as ThemeContext;
}