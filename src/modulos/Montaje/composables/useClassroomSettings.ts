import { ref, onMounted } from 'vue';
import { classroomSettingsService } from '../service/classroomSettingsService';
import { useAuthStore } from '../../../stores/auth';

interface ClassroomSettings {
  emailNotifications: boolean;
  defaultInstrument: string;
  maxStudentsPerClass: number;
  googleCalendarSync: boolean;
}

export function useClassroomSettings() {
  const authStore = useAuthStore();
  const userId = authStore.user?.uid; // Obtener el ID del usuario autenticado

  const settings = ref<ClassroomSettings>({
    emailNotifications: true,
    defaultInstrument: '',
    maxStudentsPerClass: 10,
    googleCalendarSync: false,
  });

  const isLoading = ref(true);
  const error = ref<string | null>(null);

  const loadSettings = async () => {
    if (!userId) {
      error.value = 'Usuario no autenticado.';
      isLoading.value = false;
      return;
    }
    isLoading.value = true;
    error.value = null;
    try {
      const loadedSettings = await classroomSettingsService.getSettings(userId);
      if (loadedSettings) {
        settings.value = loadedSettings;
      }
    } catch (err) {
      error.value = 'Error al cargar la configuración: ' + (err as Error).message;
      console.error(err);
    } finally {
      isLoading.value = false;
    }
  };

  const saveSettings = async () => {
    if (!userId) {
      error.value = 'Usuario no autenticado.';
      return;
    }
    error.value = null;
    try {
      await classroomSettingsService.saveSettings(userId, settings.value);
      alert('Configuración guardada exitosamente!');
    } catch (err) {
      error.value = 'Error al guardar la configuración: ' + (err as Error).message;
      console.error(err);
    }
  };

  onMounted(() => {
    loadSettings();
  });

  return {
    settings,
    isLoading,
    error,
    saveSettings,
    loadSettings,
  };
}
