import { ref, onMounted } from 'vue';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../../../firebase/config';

export function usePDFLogo() {
  const institutionalConfig = ref<any>(null);
  const isLoading = ref(false);
  const error = ref<string | null>(null);

  const loadInstitutionalConfig = async () => {
    isLoading.value = true;
    error.value = null;

    try {
      const configDoc = doc(db, 'institutional_config', 'main');
      const configSnapshot = await getDoc(configDoc);

      if (configSnapshot.exists()) {
        institutionalConfig.value = configSnapshot.data();
      } else {
        // Crear configuración por defecto
        const defaultConfig = {
          institutionName: 'El Sistema PC',
          logoUrl: null,
          address: 'Dirección de la institución',
          phone: 'Teléfono de contacto',
          email: 'email@institucion.com',
          website: 'www.institucion.com',
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        await setDoc(configDoc, defaultConfig);
        institutionalConfig.value = defaultConfig;
      }
    } catch (err) {
      console.error('Error cargando configuración institucional:', err);
      error.value = 'Error al cargar la configuración institucional';
    } finally {
      isLoading.value = false;
    }
  };

  const uploadLogo = async (file: File): Promise<string | null> => {
    if (!file) return null;

    try {
      isLoading.value = true;
      error.value = null;

      // Crear referencia única para el logo
      const logoRef = storageRef(storage, `logos/${Date.now()}_${file.name}`);

      // Subir archivo
      const snapshot = await uploadBytes(logoRef, file);

      // Obtener URL de descarga
      const downloadURL = await getDownloadURL(snapshot.ref);

      // Actualizar configuración institucional
      if (institutionalConfig.value) {
        const configDoc = doc(db, 'institutional_config', 'main');
        await setDoc(
          configDoc,
          {
            ...institutionalConfig.value,
            logoUrl: downloadURL,
            updatedAt: new Date(),
          },
          { merge: true },
        );

        institutionalConfig.value.logoUrl = downloadURL;
      }

      return downloadURL;
    } catch (err) {
      console.error('Error subiendo logo:', err);
      error.value = 'Error al subir el logo';
      return null;
    } finally {
      isLoading.value = false;
    }
  };

  const removeLogo = async () => {
    try {
      isLoading.value = true;
      error.value = null;

      if (institutionalConfig.value) {
        const configDoc = doc(db, 'institutional_config', 'main');
        await setDoc(
          configDoc,
          {
            ...institutionalConfig.value,
            logoUrl: null,
            updatedAt: new Date(),
          },
          { merge: true },
        );

        institutionalConfig.value.logoUrl = null;
      }
    } catch (err) {
      console.error('Error removiendo logo:', err);
      error.value = 'Error al remover el logo';
    } finally {
      isLoading.value = false;
    }
  };

  const updateInstitutionalInfo = async (updates: Partial<any>) => {
    try {
      isLoading.value = true;
      error.value = null;

      if (institutionalConfig.value) {
        const configDoc = doc(db, 'institutional_config', 'main');
        await setDoc(
          configDoc,
          {
            ...institutionalConfig.value,
            ...updates,
            updatedAt: new Date(),
          },
          { merge: true },
        );

        institutionalConfig.value = {
          ...institutionalConfig.value,
          ...updates,
        };
      }
    } catch (err) {
      console.error('Error actualizando información institucional:', err);
      error.value = 'Error al actualizar la información institucional';
    } finally {
      isLoading.value = false;
    }
  };

  const convertImageToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const validateImageFile = (file: File): boolean => {
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'];
    const maxSize = 5 * 1024 * 1024; // 5MB

    if (!validTypes.includes(file.type)) {
      error.value = 'Solo se permiten archivos de imagen (JPEG, PNG, GIF)';
      return false;
    }

    if (file.size > maxSize) {
      error.value = 'El archivo es demasiado grande. Máximo 5MB';
      return false;
    }

    return true;
  };

  onMounted(() => {
    loadInstitutionalConfig();
  });

  return {
    institutionalConfig,
    isLoading,
    error,
    loadInstitutionalConfig,
    uploadLogo,
    removeLogo,
    updateInstitutionalInfo,
    convertImageToBase64,
    validateImageFile,
  };
}
