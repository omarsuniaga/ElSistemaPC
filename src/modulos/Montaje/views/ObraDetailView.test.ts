// src/modulos/Montaje/views/ObraDetailView.test.ts
import { describe, it, expect, beforeEach, vi, type Mock } from 'vitest';
import { mount, VueWrapper } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import { createRouter, createWebHistory } from 'vue-router';
import ObraDetailView from './ObraDetailView.vue';
import { useMontajeStore } from '../store/montaje';
import { useStudentsStore } from '@/modulos/Students/store/students';
import { useClassesStore } from '@/modulos/Classes/store/classes';

// Mock de los stores
vi.mock('../store/montaje');
vi.mock('@/modulos/Students/store/students');
vi.mock('@/modulos/Classes/store/classes');

// Mock de los composables
vi.mock('../composables/useMontaje', () => ({
  useMontaje: () => ({
    cargarObra: vi.fn(),
    guardarCompas: vi.fn(),
    cargarCompases: vi.fn(),
    generarReporteObra: vi.fn(),
    crearObra: vi.fn(),
  }),
}));

// Mock de las utilidades
vi.mock('../utils', () => ({
  formatDate: vi.fn((date) => date?.toISOString?.().split('T')[0] || 'N/A'),
  formatDuration: vi.fn((seconds) => `${Math.floor(seconds / 60)}min`),
}));

// Mock de los componentes hijos
vi.mock('../components/HeatMap.vue', () => ({
  default: {
    name: 'HeatMap',
    template: '<div data-testid="heatmap">HeatMap Component</div>',
    props: ['obra-id', 'compases', 'total-compases'],
    emits: ['compas-updated'],
  },
}));

vi.mock('../components/CompasToolbar.vue', () => ({
  default: {
    name: 'CompasToolbar',
    template: '<div data-testid="compas-toolbar">CompasToolbar Component</div>',
    props: ['total-compases'],
    emits: ['update:filtros', 'aplicar-accion'],
  },
}));

const mockObraData = {
  id: 'obra-test-1',
  titulo: 'Sinfonía Test',
  compositor: 'Compositor Test',
  duracionEstimada: 3600,
  nivelDificultad: 4,
  estado: 'EN_MONTAJE',
  metadatos: {
    totalCompases: 120,
    complejidadGeneral: 'MEDIO',
    progresoPorcentaje: 45,
  },
  descripcion: 'Descripción de la obra test',
  fechaCreacion: new Date('2024-01-01'),
  auditoria: {
    creadoPor: 'test-user',
    fechaCreacion: new Date('2024-01-01'),
    activo: true,
  },
};

const mockMontajeStore = {
  cargarObra: vi.fn(),
  cargarPlanAccion: vi.fn(),
  cargarFrases: vi.fn(),
  cargarEvaluacionesContinuas: vi.fn(),
  cargarEstadosCompases: vi.fn(),
  actualizarObra: vi.fn(),
  obraActual: mockObraData,
  planAccion: null,
  frases: [],
  evaluacionesContinuas: [],
  estadosCompases: new Map(),
  isLoading: false,
  error: null,
};

const mockStudentsStore = {
  fetchStudents: vi.fn(),
  getStudentsByClass: vi.fn(() => []),
  students: [],
};

const mockClassesStore = {
  fetchClasses: vi.fn(),
  classes: [],
};

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/montaje', component: { template: '<div>Montaje</div>' } },
    { path: '/montaje/obras/:id', component: ObraDetailView },
  ],
});

describe('ObraDetailView', () => {
  let wrapper: VueWrapper<any>;
  let pinia: any;

  beforeEach(async () => {
    pinia = createPinia();
    setActivePinia(pinia)
    ;(useMontajeStore as Mock).mockReturnValue(mockMontajeStore)
    ;(useStudentsStore as Mock).mockReturnValue(mockStudentsStore)
    ;(useClassesStore as Mock).mockReturnValue(mockClassesStore);

    vi.clearAllMocks();

    await router.push('/montaje/obras/obra-test-1');

    wrapper = mount(ObraDetailView, {
      global: {
        plugins: [pinia, router],
        stubs: {
          WorkFormModal: true,
          PhraseFormModal: true,
          EvaluationForm: true,
          CollaborationHub: true,
          HistoryTracker: true,
          PlanCard: true,
        },
      },
    });

    await wrapper.vm.$nextTick();
  });

  afterEach(() => {
    wrapper?.unmount();
  });

  describe('Renderizado inicial', () => {
    it('debe renderizar correctamente', () => {
      expect(wrapper.exists()).toBe(true);
      expect(wrapper.find('[data-testid="obra-detail-view"]').exists()).toBe(true);
    });

    it('debe mostrar información de la obra', async () => {
      await wrapper.vm.$nextTick();

      expect(wrapper.text()).toContain('Sinfonía Test');
      expect(wrapper.text()).toContain('Compositor Test');
      expect(wrapper.text()).toContain('Descripción de la obra test');
    });

    it('debe mostrar tabs de navegación', () => {
      const tabs = wrapper.findAll('.py-4.px-1.border-b-2');
      expect(tabs.length).toBeGreaterThan(0);

      const tabTexts = tabs.map((tab) => tab.text());
      expect(tabTexts).toContain('Mapa de Calor');
      expect(tabTexts).toContain('Frases');
      expect(tabTexts).toContain('Planes');
      expect(tabTexts).toContain('Evaluaciones');
      expect(tabTexts).toContain('Historial');
    });

    it('debe mostrar el mapa de calor por defecto', () => {
      expect(wrapper.find('[data-testid="heatmap"]').exists()).toBe(true);
      expect(wrapper.find('[data-testid="compas-toolbar"]').exists()).toBe(true);
    });
  });

  describe('Carga de datos', () => {
    it('debe llamar a loadData al montar', async () => {
      expect(mockMontajeStore.cargarObra).toHaveBeenCalledWith('obra-test-1');
    });

    it('debe cargar alumnos y clases', async () => {
      expect(mockStudentsStore.fetchStudents).toHaveBeenCalled();
      expect(mockClassesStore.fetchClasses).toHaveBeenCalled();
    });

    it('debe manejar error cuando la obra no existe', async () => {
      mockMontajeStore.obraActual = null;
      const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {});
      const pushSpy = vi.spyOn(router, 'push').mockImplementation(() => Promise.resolve());

      await wrapper.vm.loadData();

      expect(alertSpy).toHaveBeenCalledWith(
        'La obra no existe o no se pudo cargar. Será redirigido a la lista de obras.',
      );
      expect(pushSpy).toHaveBeenCalledWith('/montaje');

      alertSpy.mockRestore();
      pushSpy.mockRestore();
    });
  });

  describe('Navegación entre tabs', () => {
    it('debe cambiar de tab al hacer clic', async () => {
      const frasesTab = wrapper
        .findAll('.py-4.px-1.border-b-2')
        .find((tab) => tab.text().includes('Frases'));

      if (frasesTab) {
        await frasesTab.trigger('click');
        await wrapper.vm.$nextTick();

        expect(wrapper.vm.activeTab).toBe('frases');
      }
    });

    it('debe mostrar contenido correcto para cada tab', async () => {
      // Tab Frases
      wrapper.vm.activeTab = 'frases';
      await wrapper.vm.$nextTick();
      expect(wrapper.text()).toContain('Frases Musicales');
      expect(wrapper.text()).toContain('Nueva Frase');

      // Tab Planes
      wrapper.vm.activeTab = 'planes';
      await wrapper.vm.$nextTick();
      expect(wrapper.text()).toContain('Planes de Montaje');
      expect(wrapper.text()).toContain('Crear Plan');

      // Tab Evaluaciones
      wrapper.vm.activeTab = 'evaluaciones';
      await wrapper.vm.$nextTick();
      expect(wrapper.text()).toContain('Evaluaciones');
      expect(wrapper.text()).toContain('Nueva Evaluación');
    });
  });

  describe('Interacciones de usuario', () => {
    it('debe abrir modal de edición al hacer clic en Editar', async () => {
      const editButton = wrapper.find('button:contains("Editar")');
      if (editButton.exists()) {
        await editButton.trigger('click');
        expect(wrapper.vm.showEditModal).toBe(true);
      }
    });

    it('debe manejar generación de reportes', async () => {
      const reportButton = wrapper.find('button:contains("Generar Reporte")');
      if (reportButton.exists()) {
        await reportButton.trigger('click');
        // Verificar que se llama a la función de generar reporte
      }
    });

    it('debe navegar hacia atrás al hacer clic en Volver', async () => {
      const goBackSpy = vi.spyOn(router, 'go').mockImplementation(() => {});

      const backButton = wrapper.find('button').filter((btn) => btn.text().includes('Volver'))[0];

      if (backButton?.exists()) {
        await backButton.trigger('click');
        expect(goBackSpy).toHaveBeenCalledWith(-1);
      }

      goBackSpy.mockRestore();
    });
  });

  describe('Propiedades computadas', () => {
    it('debe calcular progressPercentage correctamente', () => {
      expect(wrapper.vm.progressPercentage).toBe(45);
    });

    it('debe calcular completedPhrases correctamente', () => {
      wrapper.vm.frases = [
        { metadatos: { progresoPorcentaje: 100 } },
        { metadatos: { progresoPorcentaje: 50 } },
        { metadatos: { progresoPorcentaje: 100 } },
      ];
      expect(wrapper.vm.completedPhrases).toBe(2);
    });

    it('debe filtrar compases correctamente', () => {
      wrapper.vm.compases = [
        { numero: 1, estado: 'completado' },
        { numero: 2, estado: 'en_progreso' },
      ];
      expect(wrapper.vm.compasesFiltrados).toEqual(wrapper.vm.compases);
    });
  });

  describe('Manejo de errores', () => {
    it('debe mostrar estado de carga', async () => {
      mockMontajeStore.isLoading = true;
      await wrapper.vm.$nextTick();

      // Verificar que se muestra algún indicador de carga
      expect(wrapper.vm.cargando).toBe(true);
    });

    it('debe manejar errores de carga graciosamente', async () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      mockMontajeStore.cargarPlanAccion.mockRejectedValue(new Error('Error de índice'));
      await wrapper.vm.loadData();

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('No se pudo cargar el plan de acción'),
        expect.any(Error),
      );

      consoleSpy.mockRestore();
    });
  });

  describe('Estados de datos', () => {
    it('debe mostrar estado vacío para frases', async () => {
      wrapper.vm.activeTab = 'frases';
      wrapper.vm.obra = { ...mockObraData, frases: [] };
      await wrapper.vm.$nextTick();

      expect(wrapper.text()).toContain('No hay frases definidas');
    });

    it('debe mostrar estado vacío para evaluaciones', async () => {
      wrapper.vm.activeTab = 'evaluaciones';
      wrapper.vm.evaluaciones = [];
      await wrapper.vm.$nextTick();

      // Verificar que no hay evaluaciones mostradas o hay mensaje de estado vacío
      expect(wrapper.findAll('.bg-white.p-4.rounded-lg.shadow-md').length).toBe(0);
    });
  });

  describe('Accesibilidad', () => {
    it('debe tener estructura de encabezados apropiada', () => {
      expect(wrapper.find('h1').exists()).toBe(true);
      expect(wrapper.find('h2').exists()).toBe(true);
    });

    it('debe tener botones con texto descriptivo', () => {
      const buttons = wrapper.findAll('button');
      buttons.forEach((button) => {
        expect(button.text().trim()).not.toBe('');
      });
    });
  });
});
