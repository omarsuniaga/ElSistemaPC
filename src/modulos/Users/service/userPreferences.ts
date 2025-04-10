import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../../../firebase';

/**
 * Guarda la preferencia de tema del usuario en Firestore
 * @param userId El ID del usuario
 * @param isDark Si el modo oscuro está activado
 */
export const saveThemePreference = async (userId: string, isDark: boolean): Promise<void> => {
  try {
    const userRef = doc(db, 'USERS', userId);
    await updateDoc(userRef, { isDark });
    console.log('Preferencia de tema guardada correctamente');
  } catch (error) {
    console.error('Error al guardar la preferencia de tema:', error);
    throw error;
  }
};

/**
 * Obtiene la preferencia de tema del usuario de Firestore
 * @param userId El ID del usuario
 * @returns La preferencia de modo oscuro del usuario o null si no está configurada
 */
export const getThemePreference = async (userId: string): Promise<boolean | null> => {
  try {
    const userRef = doc(db, 'USERS', userId);
    const userDoc = await getDoc(userRef);
    
    if (userDoc.exists() && userDoc.data().isDark !== undefined) {
      return userDoc.data().isDark;
    }
    
    return null; // No hay preferencia configurada
  } catch (error) {
    console.error('Error al obtener la preferencia de tema:', error);
    throw error;
  }
};