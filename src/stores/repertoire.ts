import { defineStore } from 'pinia';
import type {
  Repertoire,
  MusicalWork,
  PracticeNote,
  PracticeReminder,
  Measure,
  InstrumentSection,
} from '../types/repertoire';
import { INSTRUMENT_SECTIONS } from '../types/repertoire';

// Demo data
const demoRepertoires: Repertoire[] = [
  {
    id: 1,
    name: 'Classical Piano Repertoire',
    description: 'Essential classical piano pieces for students',
    tags: ['piano', 'classical', 'beginner'],
    category: 'Classical',
    works: [
      {
        id: 1,
        title: 'Moonlight Sonata - 1st Movement',
        composer: 'Ludwig van Beethoven',
        duration: '15:00',
        difficulty: 'intermediate',
        instruments: [
          {
            id: 1,
            name: 'Piano',
            measures: Array.from({ length: 24 }, (_, i) => ({
              id: i + 1,
              number: i + 1,
              progress: Math.floor(Math.random() * 100),
              difficulty: ['easy', 'medium', 'hard'][Math.floor(Math.random() * 3)] as
                | 'easy'
                | 'medium'
                | 'hard',
              notes: '',
              lastPracticed: new Date(
                Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000,
              ).toISOString(),
            })),
          },
        ],
        score: 'https://example.com/scores/moonlight_sonata.pdf',
        audio: 'https://example.com/audio/moonlight_sonata.mp3',
        progress: 75,
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-03-15T00:00:00Z',
      },
    ],
    progress: 75,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-03-15T00:00:00Z',
  },
];

export const useRepertoireStore = defineStore('repertoire', {
  state: () => ({
    repertoires: [] as Repertoire[],
    practiceNotes: [] as PracticeNote[],
    reminders: [] as PracticeReminder[],
    isLoading: false,
    error: null as string | null,
  }),

  getters: {
    getRepertoireById: (state) => {
      return (id: number) => state.repertoires.find((r) => r.id === id);
    },

    getWorkById: (state) => {
      return (repertoireId: number, workId: number) => {
        const repertoire = state.repertoires.find((r) => r.id === repertoireId);
        return repertoire?.works.find((w) => w.id === workId);
      };
    },

    getPracticeNotesByMeasure: (state) => {
      return (workId: number, measureId: number) => {
        return state.practiceNotes
          .filter((note) => note.workId === workId && note.measureId === measureId)
          .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      };
    },

    getUpcomingReminders: (state) => {
      const now = new Date();
      return state.reminders
        .filter((r) => !r.completed && new Date(r.date) > now)
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    },

    getInstrumentProgress: (state) => {
      return (workId: number, instrumentId: number, studentId?: string) => {
        for (const repertoire of state.repertoires) {
          const work = repertoire.works.find((w) => w.id === workId);
          if (work) {
            const instrument = work.instruments.find((i) => i.id === instrumentId);
            if (instrument) {
              if (studentId && instrument.studentProgress) {
                return instrument.studentProgress[studentId] || 0;
              }
              return (
                instrument.measures.reduce((sum, m) => sum + m.progress, 0) /
                instrument.measures.length
              );
            }
          }
        }
        return 0;
      };
    },

    getSectionProgress: (state) => {
      return (workId: number, sectionName: string) => {
        for (const repertoire of state.repertoires) {
          const work = repertoire.works.find((w) => w.id === workId);
          if (work) {
            const sectionInstruments = work.instruments.filter((i) => i.section === sectionName);
            if (sectionInstruments.length > 0) {
              return Math.round(
                sectionInstruments.reduce((sum, inst) => {
                  return (
                    sum +
                    inst.measures.reduce((mSum, m) => mSum + m.progress, 0) / inst.measures.length
                  );
                }, 0) / sectionInstruments.length,
              );
            }
          }
        }
        return 0;
      };
    },

    getStudentProgress: (state) => {
      return (workId: number, studentId: string) => {
        for (const repertoire of state.repertoires) {
          const work = repertoire.works.find((w) => w.id === workId);
          if (work && work.studentProgress?.[studentId] !== undefined) {
            return work.studentProgress[studentId];
          }
        }
        return 0;
      };
    },
  },

  actions: {
    async fetchRepertoires() {
      this.isLoading = true;
      this.error = null;

      try {
        await new Promise((resolve) => setTimeout(resolve, 500));
        this.repertoires = demoRepertoires;
        return this.repertoires;
      } catch (error) {
        console.error('Error fetching repertoires:', error);
        this.error = 'Error al cargar los repertorios';
        throw error;
      } finally {
        this.isLoading = false;
      }
    },

    async createRepertoire(data: Omit<Repertoire, 'id' | 'createdAt' | 'updatedAt'>) {
      this.isLoading = true;
      this.error = null;

      try {
        const newRepertoire: Repertoire = {
          ...data,
          id: Math.max(0, ...this.repertoires.map((r) => r.id)) + 1,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        this.repertoires.push(newRepertoire);
        return newRepertoire;
      } catch (error) {
        console.error('Error creating repertoire:', error);
        this.error = 'Error al crear el repertorio';
        throw error;
      } finally {
        this.isLoading = false;
      }
    },

    async updateMeasureProgress(
      repertoireId: number,
      workId: number,
      instrumentId: number,
      measureId: number,
      progress: number,
      studentId?: string,
    ) {
      const work = this.getWorkById(repertoireId, workId);
      if (!work) throw new Error('Work not found');

      const instrument = work.instruments.find((i) => i.id === instrumentId);
      if (!instrument) throw new Error('Instrument not found');

      const measure = instrument.measures.find((m) => m.id === measureId);
      if (!measure) throw new Error('Measure not found');

      if (studentId) {
        if (!measure.studentProgress) measure.studentProgress = {};
        measure.studentProgress[studentId] = Math.min(100, Math.max(0, progress));

        // Update student progress for the instrument
        if (!instrument.studentProgress) instrument.studentProgress = {};
        instrument.studentProgress[studentId] = Math.round(
          instrument.measures.reduce((sum, m) => sum + (m.studentProgress?.[studentId] || 0), 0) /
            instrument.measures.length,
        );

        // Update student progress for the work
        if (!work.studentProgress) work.studentProgress = {};
        work.studentProgress[studentId] = Math.round(
          work.instruments.reduce((sum, inst) => {
            return sum + (inst.studentProgress?.[studentId] || 0);
          }, 0) / work.instruments.length,
        );
      } else {
        // Update general progress
        measure.progress = Math.min(100, Math.max(0, progress));
      }

      measure.lastPracticed = new Date().toISOString();

      // Update section progress
      if (!work.sectionProgress) work.sectionProgress = {};
      const section = INSTRUMENT_SECTIONS.find((s) => s.name === instrument.section);
      if (section) {
        const sectionInstruments = work.instruments.filter((i) => i.section === section.name);
        work.sectionProgress[section.name] = Math.round(
          sectionInstruments.reduce((sum, inst) => {
            return (
              sum + inst.measures.reduce((mSum, m) => mSum + m.progress, 0) / inst.measures.length
            );
          }, 0) / sectionInstruments.length,
        );
      }

      // Update work progress
      work.progress = Math.round(
        Object.values(work.sectionProgress).reduce((sum, progress) => sum + progress, 0) /
          Object.keys(work.sectionProgress).length,
      );

      // Update repertoire progress
      const repertoire = this.repertoires.find((r) => r.id === repertoireId);
      if (repertoire) {
        repertoire.progress = Math.round(
          repertoire.works.reduce((sum, w) => sum + w.progress, 0) / repertoire.works.length,
        );
        repertoire.updatedAt = new Date().toISOString();
      }
    },

    async addPracticeNote(note: Omit<PracticeNote, 'id'>) {
      const newNote: PracticeNote = {
        ...note,
        id: Math.max(0, ...this.practiceNotes.map((n) => n.id)) + 1,
      };
      this.practiceNotes.push(newNote);
      return newNote;
    },

    async addReminder(reminder: Omit<PracticeReminder, 'id'>) {
      const newReminder: PracticeReminder = {
        ...reminder,
        id: Math.max(0, ...this.reminders.map((r) => r.id)) + 1,
      };
      this.reminders.push(newReminder);
      return newReminder;
    },

    async completeReminder(id: number) {
      const reminder = this.reminders.find((r) => r.id === id);
      if (reminder) {
        reminder.completed = true;
      }
    },

    async updateRepertoire(id: number, data: Partial<Repertoire>) {
      this.isLoading = true;
      this.error = null;

      try {
        const index = this.repertoires.findIndex((r) => r.id === id);
        if (index === -1) throw new Error('Repertorio no encontrado');

        this.repertoires[index] = {
          ...this.repertoires[index],
          ...data,
          updatedAt: new Date().toISOString(),
        };

        return this.repertoires[index];
      } catch (error) {
        console.error('Error updating repertoire:', error);
        this.error = 'Error al actualizar el repertorio';
        throw error;
      } finally {
        this.isLoading = false;
      }
    },

    async deleteRepertoire(id: number) {
      this.isLoading = true;
      this.error = null;

      try {
        const index = this.repertoires.findIndex((r) => r.id === id);
        if (index === -1) throw new Error('Repertorio no encontrado');

        this.repertoires.splice(index, 1);
      } catch (error) {
        console.error('Error deleting repertoire:', error);
        this.error = 'Error al eliminar el repertorio';
        throw error;
      } finally {
        this.isLoading = false;
      }
    },

    async addWork(repertoireId: number, data: Partial<MusicalWork>) {
      this.isLoading = true;
      this.error = null;

      try {
        const repertoire = this.repertoires.find((r) => r.id === repertoireId);
        if (!repertoire) throw new Error('Repertorio no encontrado');

        const newWork: MusicalWork = {
          ...data,
          id: Math.max(0, ...repertoire.works.map((w) => w.id)) + 1,
          progress: 0,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        } as MusicalWork;

        repertoire.works.push(newWork);
        repertoire.updatedAt = new Date().toISOString();

        return newWork;
      } catch (error) {
        console.error('Error adding work:', error);
        this.error = 'Error al añadir la obra';
        throw error;
      } finally {
        this.isLoading = false;
      }
    },

    async updateWork(repertoireId: number, workId: number, data: Partial<MusicalWork>) {
      this.isLoading = true;
      this.error = null;

      try {
        const repertoire = this.repertoires.find((r) => r.id === repertoireId);
        if (!repertoire) throw new Error('Repertorio no encontrado');

        const workIndex = repertoire.works.findIndex((w) => w.id === workId);
        if (workIndex === -1) throw new Error('Obra no encontrada');

        repertoire.works[workIndex] = {
          ...repertoire.works[workIndex],
          ...data,
          updatedAt: new Date().toISOString(),
        };

        repertoire.updatedAt = new Date().toISOString();

        return repertoire.works[workIndex];
      } catch (error) {
        console.error('Error updating work:', error);
        this.error = 'Error al actualizar la obra';
        throw error;
      } finally {
        this.isLoading = false;
      }
    },

    async deleteWork(repertoireId: number, workId: number) {
      this.isLoading = true;
      this.error = null;

      try {
        const repertoire = this.repertoires.find((r) => r.id === repertoireId);
        if (!repertoire) throw new Error('Repertorio no encontrado');

        const workIndex = repertoire.works.findIndex((w) => w.id === workId);
        if (workIndex === -1) throw new Error('Obra no encontrada');

        repertoire.works.splice(workIndex, 1);
        repertoire.updatedAt = new Date().toISOString();
      } catch (error) {
        console.error('Error deleting work:', error);
        this.error = 'Error al eliminar la obra';
        throw error;
      } finally {
        this.isLoading = false;
      }
    },
  },
});
