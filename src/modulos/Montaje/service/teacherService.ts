// src/modulos/Montaje/service/teacherService.ts
import { db } from '@/firebase';
import { collection, query, where, getDocs, getDoc, doc } from 'firebase/firestore';
import { TipoInstrumento } from '../types';

class TeacherService {
  /**
   * Obtiene los instrumentos asignados a un profesor, combinando
   * tanto sus especialidades registradas en su perfil como
   * los instrumentos de las clases que imparte.
   * 
   * @param userId ID del profesor
   * @returns Array de instrumentos (TipoInstrumento[])
   */
  async getUserInstruments(userId: string): Promise<TipoInstrumento[]> {
    try {
      const instruments = new Set<TipoInstrumento>();
      
      // 1. Obtener especialidades del perfil del usuario
      const userDoc = await getDoc(doc(db, 'USERS', userId));
      if (userDoc.exists()) {
        const userData = userDoc.data();
        
        // Añadir especialidades si existen
        if (userData.specialties && Array.isArray(userData.specialties)) {
          userData.specialties.forEach((specialty: string) => {
            if (Object.values(TipoInstrumento).includes(specialty as TipoInstrumento)) {
              instruments.add(specialty as TipoInstrumento);
            }
          });
        }
        
        // También verificar el campo instruments por compatibilidad
        if (userData.instruments && Array.isArray(userData.instruments)) {
          userData.instruments.forEach((instrument: string) => {
            if (Object.values(TipoInstrumento).includes(instrument as TipoInstrumento)) {
              instruments.add(instrument as TipoInstrumento);
            }
          });
        }
      }
      
      // 2. Obtener clases del profesor y sus instrumentos
      const classesQuery = query(
        collection(db, 'CLASES'),
        where('teacherId', '==', userId),
      );
      
      const classesSnapshot = await getDocs(classesQuery);
      classesSnapshot.forEach(doc => {
        const classData = doc.data();
        if (classData.instrument && Object.values(TipoInstrumento).includes(classData.instrument)) {
          instruments.add(classData.instrument as TipoInstrumento);
        }
      });
      
      return Array.from(instruments);
    } catch (error) {
      console.error('Error obteniendo instrumentos del profesor:', error);
      return [];
    }
  }
  
  /**
   * Verifica si un profesor tiene asignado un instrumento específico,
   * ya sea en sus especialidades o en sus clases.
   * 
   * @param userId ID del profesor
   * @param instrument Instrumento a verificar
   * @returns true si el profesor tiene asignado el instrumento
   */
  async hasInstrumentAssigned(userId: string, instrument: TipoInstrumento): Promise<boolean> {
    const instruments = await this.getUserInstruments(userId);
    return instruments.includes(instrument);
  }
}

export const teacherService = new TeacherService();
