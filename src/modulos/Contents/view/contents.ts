import { defineStore } from 'pinia';
import type { Content, ContentTheme, ContentIndicator } from '../types';

// Demo data
const demoContents: Content[] = [
  {
    id: 1,
    title: 'Teoría Musical Básica',
    description: 'Fundamentos de la teoría musical para principiantes',
    level: 'Principiante',
    class: 'Piano - Nivel 1',
    objectives: [
      'Comprender los conceptos básicos de notación musical',
      'Identificar las notas en el pentagrama',
    ],
    prerequisites: ['Ninguno'],
    duration: '4 semanas',
    themes: [
      {
        id: 1,
        title: 'Notación Musical',
        description: 'Fundamentos de la escritura musical',
        weight: 40,
        indicators: [
          {
            id: 1,
            name: 'Lectura de notas',
            description: 'Capacidad para leer notas en el pentagrama',
            weight: 60,
          },
          {
            id: 2,
            name: 'Escritura musical',
            description: 'Habilidad para escribir notación musical',
            weight: 40,
          },
        ],
      },
      {
        id: 2,
        title: 'Ritmo y Tempo',
        description: 'Comprensión del ritmo y tempo musical',
        weight: 60,
        indicators: [
          {
            id: 3,
            name: 'Identificación de patrones rítmicos',
            description: 'Capacidad para reconocer patrones rítmicos básicos',
            weight: 50,
          },
          {
            id: 4,
            name: 'Ejecución rítmica',
            description: 'Habilidad para ejecutar ritmos correctamente',
            weight: 50,
          },
        ],
      },
    ],
    indicators: [],
    materials: [
      {
        type: 'document',
        url: 'https://example.com/teoria-musical.pdf',
        title: 'Guía de Teoría Musical',
        description: 'Manual completo de teoría musical básica',
      },
    ],
    evaluationCriteria: [
      'Participación activa en clase',
      'Completitud de ejercicios prácticos',
      'Examen teórico final',
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

export const useContentsStore = defineStore('contents', {
  state: () => ({
    contents: demoContents as Content[],
    isLoading: false,
    error: null as string | null,
  }),

  getters: {
    getContentsByClass: (state) => {
      return (className: string) => state.contents.filter((content) => content.class === className);
    },
    getThemesByContent: (state) => {
      return (contentId: number) => {
        const content = state.contents.find((c) => c.id === contentId);
        return content?.themes || [];
      };
    },
    getIndicatorsByTheme: (state) => {
      return (contentId: number, themeId: number) => {
        const content = state.contents.find((c) => c.id === contentId);
        const theme = content?.themes.find((t) => t.id === themeId);
        return theme?.indicators || [];
      };
    },
  },

  actions: {
    async fetchContents() {
      this.isLoading = true;
      this.error = null;
      try {
        await new Promise((resolve) => setTimeout(resolve, 500));
        return this.contents;
      } catch (error) {
        console.error('Error fetching contents:', error);
        this.error = 'Error al cargar los contenidos';
        throw error;
      } finally {
        this.isLoading = false;
      }
    },

    async deleteContent(contentId: number) {
      this.isLoading = true;
      this.error = null;
      try {
        await new Promise((resolve) => setTimeout(resolve, 500));
        this.contents = this.contents.filter((content) => content.id !== contentId);
      } catch (error) {
        console.error('Error deleting content:', error);
        this.error = 'Error al eliminar el contenido';
        throw error;
      } finally {
        this.isLoading = false;
      }
    },
    async addContent(content: Omit<Content, 'id' | 'createdAt' | 'updatedAt'>) {
      this.isLoading = true;
      this.error = null;
      try {
        await new Promise((resolve) => setTimeout(resolve, 500));
        const newContent: Content = {
          ...content,
          id: this.contents.length + 1,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        this.contents.push(newContent);
        return newContent;
      } catch (error) {
        console.error('Error adding content:', error);
        this.error = 'Error al añadir el contenido';
        throw error;
      } finally {
        this.isLoading = false;
      }
    },
    async updateContent(
      contentId: number,
      content: Partial<Omit<Content, 'id' | 'createdAt' | 'updatedAt'>>,
    ) {
      this.isLoading = true;
      this.error = null;
      try {
        await new Promise((resolve) => setTimeout(resolve, 500));
        const index = this.contents.findIndex((c) => c.id === contentId);
        if (index !== -1) {
          this.contents[index] = {
            ...this.contents[index],
            ...content,
            updatedAt: new Date().toISOString(),
          };
        }
      } catch (error) {
        console.error('Error updating content:', error);
        this.error = 'Error al actualizar el contenido';
        throw error;
      } finally {
        this.isLoading = false;
      }
    },

    async addTheme(contentId: number, theme: Omit<ContentTheme, 'id' | 'indicators'>) {
      this.isLoading = true;
      this.error = null;
      try {
        await new Promise((resolve) => setTimeout(resolve, 500));
        const content = this.contents.find((c) => c.id === contentId);
        if (content) {
          const newTheme: ContentTheme = {
            ...theme,
            id: content.themes.length + 1,
            indicators: [],
          };
          content.themes.push(newTheme);
        }
      } catch (error) {
        console.error('Error adding theme:', error);
        this.error = 'Error al añadir el tema';
        throw error;
      } finally {
        this.isLoading = false;
      }
    },

    async updateThemeWeight(contentId: number, themeId: number, weight: number) {
      const content = this.contents.find((c) => c.id === contentId);
      const theme = content?.themes.find((t) => t.id === themeId);
      if (theme) {
        theme.weight = weight;
      }
    },

    async updateIndicatorWeight(
      contentId: number,
      themeId: number,
      indicatorId: number,
      weight: number,
    ) {
      const content = this.contents.find((c) => c.id === contentId);
      const theme = content?.themes.find((t) => t.id === themeId);
      const indicator = theme?.indicators.find((i) => i.id === indicatorId);
      if (indicator) {
        indicator.weight = weight;
      }
    },
  },
});
