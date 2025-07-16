import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { doc, getDoc, setDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { ref as storageRef, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { db, storage } from '@/firebase';

// Tipos para la configuración institucional
export interface InstitutionalConfig {
  id?: string
  title_institucional: string
  url_institucional: string
  created_at?: any
  updated_at?: any
  // Futuras configuraciones que se pueden agregar
  theme_color?: string
  contact_email?: string
  contact_phone?: string
  address?: string
  facebook_url?: string
  instagram_url?: string
  website_url?: string
}

const DEFAULT_CONFIG: InstitutionalConfig = {
  title_institucional: 'El Sistema Punta Cana',
  url_institucional: '',
};

const CONFIG_COLLECTION = 'CONFIGURACION';
const CONFIG_DOC_ID = 'app_config';

export const useInstitutionalConfigStore = defineStore('institutionalConfig', () => {
  // Estado
  const config = ref<InstitutionalConfig>({ ...DEFAULT_CONFIG });
  const isLoading = ref(false);
  const isUploading = ref(false);
  const error = ref<string | null>(null);

  // Computed
  const institutionalTitle = computed(() => config.value.title_institucional);
  const institutionalLogoUrl = computed(() => config.value.url_institucional);
  const hasLogo = computed(() => !!config.value.url_institucional);

  // Cargar configuración desde Firestore
  const loadConfig = async () => {
    isLoading.value = true;
    error.value = null;

    try {
      const configDocRef = doc(db, CONFIG_COLLECTION, CONFIG_DOC_ID);
      const docSnap = await getDoc(configDocRef);

      if (docSnap.exists()) {
        const docData = docSnap.data() as InstitutionalConfig;
        config.value = {
          id: docSnap.id,
          ...DEFAULT_CONFIG,
          ...docData,
        };
      } else {
        await createDefaultConfig();
      }
    } catch (err) {
      console.error('Error loading institutional config:', err);
      error.value = 'Error al cargar la configuración institucional';
      config.value = { ...DEFAULT_CONFIG };
    } finally {
      isLoading.value = false;
    }
  };

  // Crear configuración por defecto
  const createDefaultConfig = async () => {
    try {
      const configDocRef = doc(db, CONFIG_COLLECTION, CONFIG_DOC_ID);
      const newConfig: Omit<InstitutionalConfig, 'id'> = {
        ...DEFAULT_CONFIG,
        created_at: serverTimestamp(),
        updated_at: serverTimestamp(),
      };

      await setDoc(configDocRef, newConfig);

      config.value = {
        id: configDocRef.id,
        ...newConfig,
      };
    } catch (err) {
      console.error('Error creating default config:', err);
      throw err;
    }
  };

  // Actualizar título institucional
  const updateTitle = async (newTitle: string) => {
    try {
      const configDocRef = doc(db, CONFIG_COLLECTION, CONFIG_DOC_ID);
      await updateDoc(configDocRef, {
        title_institucional: newTitle,
        updated_at: serverTimestamp(),
      });
      config.value.title_institucional = newTitle;
      return true;
    } catch (err) {
      console.error('Error updating institutional title:', err);
      error.value = 'Error al actualizar el título institucional';
      return false;
    }
  };

  // Subir logo y actualizar URL
  const uploadLogo = async (file: File): Promise<boolean> => {
    isUploading.value = true;
    error.value = null;

    try {
      if (!file.type.startsWith('image/')) throw new Error('El archivo debe ser una imagen');
      if (file.size > 5 * 1024 * 1024)
        throw new Error('El archivo es demasiado grande. Máximo 5MB.');

      if (config.value.url_institucional) {
        await removeLogo();
      }

      const logoRef = storageRef(storage, `institutional/logo_${Date.now()}_${file.name}`);
      const snapshot = await uploadBytes(logoRef, file);
      const downloadURL = await getDownloadURL(snapshot.ref);

      const configDocRef = doc(db, CONFIG_COLLECTION, CONFIG_DOC_ID);
      await updateDoc(configDocRef, {
        url_institucional: downloadURL,
        updated_at: serverTimestamp(),
      });

      config.value.url_institucional = downloadURL;
      return true;
    } catch (err) {
      console.error('Error uploading logo:', err);
      error.value = err instanceof Error ? err.message : 'Error al subir el logo';
      return false;
    } finally {
      isUploading.value = false;
    }
  };

  // Remover logo
  const removeLogo = async (): Promise<boolean> => {
    if (!config.value.url_institucional) return true;

    try {
      const logoRef = storageRef(storage, config.value.url_institucional);
      await deleteObject(logoRef);

      const configDocRef = doc(db, CONFIG_COLLECTION, CONFIG_DOC_ID);
      await updateDoc(configDocRef, {
        url_institucional: '',
        updated_at: serverTimestamp(),
      });

      config.value.url_institucional = '';
      return true;
    } catch (err) {
      console.error('Error removing logo:', err);
      error.value = 'Error al eliminar el logo';
      return false;
    }
  };

  // Actualizar configuración completa
  const updateConfig = async (newConfig: Partial<InstitutionalConfig>): Promise<boolean> => {
    try {
      const configDocRef = doc(db, CONFIG_COLLECTION, CONFIG_DOC_ID);
      const updateData = { ...newConfig, updated_at: serverTimestamp() };

      await updateDoc(configDocRef, updateData);

      config.value = { ...config.value, ...newConfig };
      return true;
    } catch (err) {
      console.error('Error updating config:', err);
      error.value = 'Error al actualizar la configuración';
      return false;
    }
  };

  // Resetear configuración a valores por defecto
  const resetConfig = async (): Promise<boolean> => {
    try {
      if (config.value.url_institucional) {
        await removeLogo();
      }
      await updateConfig(DEFAULT_CONFIG);
      return true;
    } catch (err) {
      console.error('Error resetting config:', err);
      error.value = 'Error al resetear la configuración';
      return false;
    }
  };

  const clearError = () => {
    error.value = null;
  };

  return {
    // State
    config,
    isLoading,
    isUploading,
    error,
    // Computed
    institutionalTitle,
    institutionalLogoUrl,
    hasLogo,
    // Methods
    loadConfig,
    createDefaultConfig,
    updateTitle,
    uploadLogo,
    removeLogo,
    updateConfig,
    resetConfig,
    clearError,
  };
});
