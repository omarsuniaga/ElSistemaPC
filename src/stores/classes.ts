import { defineStore } from 'pinia';
import {
  fetchClassesFromDB,
  addClassToDB,
  updateClassInDB,
  deleteClassFromDB,
} from '../services/classesService';
import { getEmergencyClassByIdFirebase } from '../modulos/Attendance/service/emergencyClass';

interface Clase {
  id: string
  nombre: string
  teacherId: string // Maestro titular (mantenemos compatibilidad)
  maestros?: {
    titular: string
    colaboradores: string[]
  }
  horario: {
    dia: string
    horaInicio: string
    horaFin: string
  }
  alumnos: string[]
  contenido?: string
  temas?: Array<{
    id: string
    titulo: string
    descripcion?: string
  }>
}

export const useClassesStore = defineStore('classes', {
  state: () => ({
    classes: [] as Clase[],
    loading: false,
    error: null as string | null,
  }),

  getters: {
    getClassById: (state) => (id: string) => {
      return state.classes.find((clase) => clase.id === id);
    },

    getClassesByTeacher: (state) => (teacherId: string) => {
      return state.classes.filter((clase) => {
        // Compatibilidad con estructura antigua y nueva de maestros
        if (clase.maestros) {
          return clase.maestros.titular === teacherId || clase.maestros.colaboradores.includes(teacherId);
        }
        return clase.teacherId === teacherId;
      });
    },
  },

  actions: {
    /**
     * Encuentra la próxima clase para un profesor basado en la fecha y hora actual.
     * NOTA: Esta lógica asume que `clase.horario.dia` es un string como "Lunes", "Martes", etc.
     * y necesita ser mapeado a un número de día de la semana.
     */
    findNextUpcomingClassForTeacher(teacherId: string): Clase | null {
      const teacherClasses = this.getClassesByTeacher(teacherId);
      if (!teacherClasses.length) return null;

      const now = new Date();
      const currentDay = now.getDay(); // Domingo: 0, Lunes: 1, ..., Sábado: 6
      const currentTime = now.getHours() * 60 + now.getMinutes(); // Tiempo actual en minutos

      // Mapeo de días de la semana en español a número (asumiendo que Domingo es 0)
      const dayMap: { [key: string]: number } = {
        domingo: 0,
        lunes: 1,
        martes: 2,
        miércoles: 3,
        jueves: 4,
        viernes: 5,
        sábado: 6,
      };

      let closestClass: { clase: Clase; timeDiff: number; date: Date } | null = null;

      // Buscar en los próximos 7 días
      for (let i = 0; i < 7; i++) {
        const targetDay = (currentDay + i) % 7;

        for (const clase of teacherClasses) {
          // Añadir guarda para asegurar que la clase tiene un horario definido
          if (clase.horario && clase.horario.dia) {
            const classDay = dayMap[clase.horario.dia.toLowerCase()];
            if (classDay === targetDay) {
              const [hours, minutes] = clase.horario.horaInicio.split(':').map(Number);
              const classTime = hours * 60 + minutes;

              // Si es hoy, solo considerar clases que no han pasado
              if (i === 0 && classTime < currentTime) {
                continue;
              }

              const targetDate = new Date(now);
              targetDate.setDate(now.getDate() + i);
              
              const timeDiff = (i * 24 * 60) + (classTime - currentTime);

              if (!closestClass || timeDiff < closestClass.timeDiff) {
                closestClass = { clase, timeDiff, date: targetDate };
              }
            }
          }
        }
        // Si encontramos una clase en el primer día posible, no necesitamos seguir buscando
        if (closestClass) break;
      }

      return closestClass ? { ...closestClass.clase, date: closestClass.date.toISOString().split('T')[0] } as Clase & { date: string } : null;
    },
    async fetchClasses() {
      this.loading = true;
      this.error = null;
      try {
        this.classes = await fetchClassesFromDB() as Clase[];
        return this.classes;
      } catch (error: any) {
        console.error('Error fetching classes:', error);
        this.error = error.message;
        throw error;
      } finally {
        this.loading = false;
      }
    },

    async addClass(classData: Omit<Clase, 'id'>) {
      this.loading = true;
      this.error = null;
      try {
        const newClass = await addClassToDB(classData);
        this.classes.push(newClass as Clase);
        return newClass;
      } catch (error: any) {
        console.error('Error adding class:', error);
        this.error = error.message;
        throw error;
      } finally {
        this.loading = false;
      }
    },

    async updateClass(id: string, updates: Partial<Clase>) {
      this.loading = true;
      this.error = null;
      try {
        await updateClassInDB(id, updates);
        const index = this.classes.findIndex((c) => c.id === id);
        if (index !== -1) {
          this.classes[index] = { ...this.classes[index], ...updates };
        }
      } catch (error: any) {
        console.error('Error updating class:', error);
        this.error = error.message;
        throw error;
      } finally {
        this.loading = false;
      }
    },

    async deleteClass(id: string) {
      this.loading = true;
      this.error = null;
      try {
        await deleteClassFromDB(id);
        this.classes = this.classes.filter((c) => c.id !== id);
      } catch (error: any) {
        console.error('Error deleting class:', error);
        this.error = error.message;
        throw error;
      } finally {
        this.loading = false;
      }
    },

    // Métodos para manejar temas
    async addTopic(classId: string, topic: {titulo: string; descripcion?: string}) {
      const clase = this.getClassById(classId);
      if (!clase) throw new Error('Clase no encontrada');

      const newTopic = {
        id: Date.now().toString(),
        ...topic,
      };

      const temas = clase.temas || [];
      await this.updateClass(classId, {
        temas: [...temas, newTopic],
      });

      return newTopic;
    },

    async updateTopic(
      classId: string,
      topicId: string,
      updates: {titulo?: string; descripcion?: string},
    ) {
      const clase = this.getClassById(classId);
      if (!clase) throw new Error('Clase no encontrada');

      const temas = clase.temas || [];
      const index = temas.findIndex((t) => t.id === topicId);
      if (index === -1) throw new Error('Tema no encontrado');

      temas[index] = {
        ...temas[index],
        ...updates,
      };

      await this.updateClass(classId, { temas });
    },

    async deleteTopic(classId: string, topicId: string) {
      const clase = this.getClassById(classId);
      if (!clase) throw new Error('Clase no encontrada');

      const temas = clase.temas || [];
      await this.updateClass(classId, {
        temas: temas.filter((t) => t.id !== topicId),
      });
    },

    // Método para buscar una clase que incluye clases emergentes
    async findClassById(id: string) {
      // Primero buscar en clases regulares
      const regularClass = this.getClassById(id);
      if (regularClass) {
        return regularClass;
      }

      // Si no se encuentra en clases regulares, buscar en clases emergentes
      try {
        const emergencyClass = await getEmergencyClassByIdFirebase(id);
        if (emergencyClass) {
          // Convertir la clase emergente al formato esperado por el store
          return {
            id: emergencyClass.id,
            nombre: emergencyClass.className || 'Clase de Emergencia',
            teacherId: emergencyClass.teacherId,
            horario: {
              dia: 'Emergencia',
              horaInicio: emergencyClass.startTime || '00:00',
              horaFin: emergencyClass.endTime || '23:59',
            },
            alumnos: emergencyClass.selectedStudents || [],
            contenido: `Clase emergente: ${emergencyClass.reason || 'Sin razón especificada'}`,
            isEmergencyClass: true,
          } as Clase & {isEmergencyClass: boolean};
        }
      } catch (error) {
        console.error(`Error buscando clase emergente ${id}:`, error);
      }

      return null;
    },
  },
});
