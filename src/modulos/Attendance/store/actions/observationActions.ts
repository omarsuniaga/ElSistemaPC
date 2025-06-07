// Archivo para acciones relacionadas con observaciones de clase
import type { ClassObservation } from '../../types/attendance'; // Corrected import path
import { useAuthStore } from '../../../../stores/auth'; // Import auth store properly
import {
  updateObservationsFirebase, // Expects fecha, classId, observations
  addObservationToHistoryFirebase, // Expects classId, date, text, author; returns Promise<void>
  updateObservationInHistoryFirebase, // Expects observationId, text; returns Promise<void>
  getObservationsHistoryFirebase, // Expects classId, specificDate?; returns Promise<any[]>
  getAllObservationsFirebase, // Expects no arguments; returns Promise<ClassObservation[]>
} from '../../service/attendance'; // Corrected service path

export const observationActions = {
  async updateObservations(this: any, classId: string, date: string, observations: string): Promise<void> {
    this.isLoading = true;
    this.error = null;
    try {
      const authStore = useAuthStore(); 
      const teacherId = authStore.user?.uid; // Used for creating new doc if not exists, but service handles it
      if (!teacherId) {
        console.warn('No user ID found when updating observations. Using system default.');
      }

      // The service updateObservationsFirebase expects fecha, classId, observations.
      await updateObservationsFirebase(date, classId, observations);

      // Update local store optimistically or after confirmation
      let doc = this.attendanceDocuments.find((d: any) => d.fecha === date && d.classId === classId);
      if (doc) {
        // Update existing document in local store
        doc.data.observations = observations;
        const index = this.attendanceDocuments.findIndex((d: any) => d.id === doc.id);
        if (index !== -1) {
          this.attendanceDocuments[index] = { ...doc };
        }
        if (this.currentAttendanceDoc && this.currentAttendanceDoc.id === doc.id) {
          this.currentAttendanceDoc.data.observations = observations;
        }
      } else {
        // If the document wasn't found in local store, create a new one to add
        console.log('Creating local representation for non-existent attendance document');
        const newDoc = {
          id: `${date}_${classId}`, // This should match how IDs are created in the service
          fecha: date,
          classId: classId,
          teacherId: teacherId || 'system',
          data: {
            presentes: [],
            ausentes: [],
            tarde: [],
            justificacion: [],
            observations: observations
          }
        };
        
        // Add to local store
        this.attendanceDocuments.push(newDoc);
        
        // If this is the current selection, also set as currentAttendanceDoc
        if (this.selectedDate === date && this.selectedClass === classId) {
          this.currentAttendanceDoc = newDoc;
        }
      }

    } catch (error: any) {
      this.error = `Error al actualizar observaciones: ${error.message}`;
      console.error(this.error, error);
    } finally {
      this.isLoading = false;
    }
  },
  async addObservationToHistory(this: any, observation: Omit<ClassObservation, 'id' | 'createdAt'>): Promise<void> {
    this.isLoading = true;
    this.error = null;
    try {
      if (!observation.classId || !observation.fecha || !observation.content.text || !observation.author) {
        throw new Error('Datos de observación incompletos para agregar al historial.');
      }
      
      console.log(`Adding observation to history: ${observation.content.taggedStudents && observation.content.taggedStudents.length > 0 ? 'student-specific' : 'class-level'}`);
      
      // Service addObservationToHistoryFirebase returns Promise<void> and handles if obs exists (updates) or not (creates)
      await addObservationToHistoryFirebase(
        observation.classId,
        observation.fecha,
        observation.content.text,
        observation.author,
        observation.content.taggedStudents && observation.content.taggedStudents.length > 0 ? observation.content.taggedStudents[0] : undefined // Pass the first studentId if it exists for student-specific observations
      );
      
      // Optimistically add to local history or refresh. Since service doesn't return ID, create a temporary one or refresh.
      // For simplicity, we add it with a temporary ID. A robust solution might involve re-fetching or a more complex optimistic update.
      const tempId = `temp-${Date.now()}`;
      this.observationsHistory.push({ ...observation, id: tempId, createdAt: new Date() });
      console.log(`Observation added/updated in history. Local push with temp ID: ${tempId}`);

    } catch (error: any) {
      this.error = `Error al agregar observación al historial: ${error.message}`;
      console.error(this.error, error);
    } finally {
      this.isLoading = false;
    }
  },

  async updateObservationInHistory(this: any, observationId: string, updates: Partial<ClassObservation>): Promise<void> {
    this.isLoading = true;
    this.error = null;
    try {
      // The service updateObservationInHistoryFirebase expects observationId and text (string).
      // The `updates` param is Partial<ClassObservation>. We need to ensure `updates.text` is passed if that's the intent.
      if (typeof updates.content?.text !== 'string') {
        throw new Error('El texto para actualizar la observación debe ser un string.');
      }
      await updateObservationInHistoryFirebase(observationId, updates.content.text);
      const index = this.observationsHistory.findIndex((obs: ClassObservation) => obs.id === observationId);
      if (index !== -1) {
        // Update only the text, or more broadly if service supported more partial updates
        this.observationsHistory[index] = { ...this.observationsHistory[index], content: { ...this.observationsHistory[index].content, text: updates.content.text }, updatedAt: new Date() };
      }
    } catch (error: any) {
      this.error = `Error al actualizar observación en el historial: ${error.message}`;
      console.error(this.error, error);
    } finally {
      this.isLoading = false;
    }
  },

  async loadObservationsHistory(this: any, classId: string, date?: string): Promise<void> {
    this.isLoading = true;
    this.error = null;
    try {
      // Service getObservationsHistoryFirebase takes classId and an optional specificDate.
      const history = await getObservationsHistoryFirebase(classId, date || this.selectedDate); 
      this.observationsHistory = history;
    } catch (error: any) {
      this.error = `Error al cargar historial de observaciones: ${error.message}`;
      console.error(this.error, error);
    } finally {
      this.isLoading = false;
    }
  },
  async fetchAllObservationsForTeacher(this: any, teacherId?: string): Promise<ClassObservation[]> {
    this.isLoading = true;
    this.error = null;
    try {
      // Service getAllObservationsFirebase fetches all observations; 
      // Pass the teacherId parameter to filter observations for that specific teacher
      console.log(`Fetching observations for teacherId: ${teacherId || 'current user'}`);
      const observations = await getAllObservationsFirebase(teacherId);
      // Store in observationsHistory array for components to access
      this.observationsHistory = observations;
      return observations; 
    } catch (error: any) {
      this.error = `Error al obtener todas las observaciones: ${error.message}`;
      console.error(this.error, error);
      return [];
    } finally {
      this.isLoading = false;
    }
  },
};


