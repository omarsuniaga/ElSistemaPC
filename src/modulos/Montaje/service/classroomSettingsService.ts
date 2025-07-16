import { db } from '../../../firebase'; // Asegúrate de que esta ruta sea correcta a tu instancia de Firestore
import { doc, getDoc, setDoc } from 'firebase/firestore';

interface ClassroomSettings {
  emailNotifications: boolean;
  defaultInstrument: string;
  maxStudentsPerClass: number;
  googleCalendarSync: boolean;
}

const COLLECTION_NAME = 'classroomSettings';

export const classroomSettingsService = {
  /**
   * Carga las configuraciones del aula para un usuario específico.
   * @param userId El ID del usuario.
   * @returns Las configuraciones del aula o null si no existen.
   */
  async getSettings(userId: string): Promise<ClassroomSettings | null> {
    try {
      const docRef = doc(db, COLLECTION_NAME, userId);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        return docSnap.data() as ClassroomSettings;
      } else {
        console.log("No se encontraron configuraciones para el usuario:", userId);
        return null;
      }
    } catch (error) {
      console.error("Error al cargar las configuraciones del aula:", error);
      throw error;
    }
  },

  /**
   * Guarda las configuraciones del aula para un usuario específico.
   * @param userId El ID del usuario.
   * @param settings Las configuraciones del aula a guardar.
   */
  async saveSettings(userId: string, settings: ClassroomSettings): Promise<void> {
    try {
      const docRef = doc(db, COLLECTION_NAME, userId);
      await setDoc(docRef, settings, { merge: true }); // merge: true para no sobrescribir otros campos si existen
      console.log("Configuraciones del aula guardadas exitosamente para el usuario:", userId);
    } catch (error) {
      console.error("Error al guardar las configuraciones del aula:", error);
      throw error;
    }
  },
};
