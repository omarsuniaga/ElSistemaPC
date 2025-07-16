import { describe, it, expect, vi } from 'vitest';
import { useMaestroMontajeUI } from '../composables/useMaestroMontajeUI';
import type { Obra } from '../types';

// Explicitly mock 'vue' to ensure 'ref' is correctly provided
vi.mock('vue', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    ref: vi.fn((val) => ({ value: val })), // Simple mock for ref
  };
});

// Now, import ref from the mocked 'vue'
import { ref } from 'vue';

describe('useMaestroMontajeUI', () => {
  const mockObras = ref<Obra[]>([
    {
      id: '1',
      titulo: 'Sinfonía No. 5',
      compositor: 'Beethoven',
      repertorioId: 'rep1',
      totalCompases: 100,
      duracionEstimada: 10,
      instrumentosRequeridos: [],
      fechaCreacion: new Date(),
      metadatos: { progresoPorcentaje: 50 } as any,
      auditoria: {} as any,
      estado: 'en_progreso',
    },
    {
      id: '2',
      titulo: 'Concierto para Violín',
      compositor: 'Tchaikovsky',
      repertorioId: 'rep1',
      totalCompases: 200,
      duracionEstimada: 15,
      instrumentosRequeridos: [],
      fechaCreacion: new Date(),
      metadatos: { progresoPorcentaje: 0 } as any,
      auditoria: {} as any,
      estado: 'sin_trabajar',
    },
    {
      id: '3',
      titulo: 'Requiem',
      compositor: 'Mozart',
      repertorioId: 'rep2',
      totalCompases: 300,
      duracionEstimada: 20,
      instrumentosRequeridos: [],
      fechaCreacion: new Date(),
      metadatos: { progresoPorcentaje: 100 } as any,
      auditoria: {} as any,
      estado: 'completada',
    },
  ]);

  it('debería filtrar obras por término de búsqueda', () => {
    const { searchTerm, obrasFiltradas } = useMaestroMontajeUI(mockObras);
    searchTerm.value = 'sinfonía';
    expect(obrasFiltradas.value.length).toBe(1);
    expect(obrasFiltradas.value[0].titulo).toBe('Sinfonía No. 5');
  });

  it('debería filtrar obras por estado', () => {
    const { filtroEstado, obrasFiltradas } = useMaestroMontajeUI(mockObras);
    filtroEstado.value = 'completado';
    expect(obrasFiltradas.value.length).toBe(1);
    expect(obrasFiltradas.value[0].titulo).toBe('Requiem');
  });

  it('debería combinar filtros de búsqueda y estado', () => {
    const { searchTerm, filtroEstado, obrasFiltradas } = useMaestroMontajeUI(mockObras);
    searchTerm.value = 'concierto';
    filtroEstado.value = 'sin_trabajar';
    expect(obrasFiltradas.value.length).toBe(1);
    expect(obrasFiltradas.value[0].titulo).toBe('Concierto para Violín');
  });

  it('debería devolver todas las obras si no hay filtros', () => {
    const { searchTerm, filtroEstado, obrasFiltradas } = useMaestroMontajeUI(mockObras);
    searchTerm.value = '';
    filtroEstado.value = '';
    expect(obrasFiltradas.value.length).toBe(3);
  });

  it('debería formatear la fecha correctamente', () => {
    const { formatDate } = useMaestroMontajeUI(mockObras);
    const date = new Date(2025, 6, 11, 10, 30); // 11 de julio de 2025, 10:30
    expect(formatDate(date)).toMatch(/11 de jul\.?\s*\d{2}:\d{2}/); // Ajuste para diferentes formatos de navegador
  });

  it('debería devolver la clase de color de progreso correcta', () => {
    const { getProgresoColorClass } = useMaestroMontajeUI(mockObras);
    expect(getProgresoColorClass(90)).toBe('text-green-600 dark:text-green-400');
    expect(getProgresoColorClass(60)).toBe('text-yellow-600 dark:text-yellow-400');
    expect(getProgresoColorClass(30)).toBe('text-red-600 dark:text-red-400');
  });

  it('debería devolver la clase de barra de progreso correcta', () => {
    const { getProgresoBarClass } = useMaestroMontajeUI(mockObras);
    expect(getProgresoBarClass(90)).toBe('bg-green-500 dark:bg-green-400');
    expect(getProgresoBarClass(60)).toBe('bg-yellow-500 dark:bg-yellow-400');
    expect(getProgresoBarClass(30)).toBe('bg-red-500 dark:bg-red-400');
  });

  it('debería abrir y cerrar el modal de observaciones', () => {
    const { showModalObservaciones, obraSeleccionada, abrirModalObservaciones, cerrarModalObservaciones } = useMaestroMontajeUI(mockObras);
    const obra = mockObras.value[0];

    abrirModalObservaciones(obra);
    expect(showModalObservaciones.value).toBe(true);
    expect(obraSeleccionada.value).toEqual(obra);

    cerrarModalObservaciones();
    expect(showModalObservaciones.value).toBe(false);
    expect(obraSeleccionada.value).toBeNull();
  });

  it('debería abrir y cerrar el modal de evaluación', () => {
    const { showModalEvaluacion, obraSeleccionada, abrirModalEvaluacion, cerrarModalEvaluacion } = useMaestroMontajeUI(mockObras);
    const obra = mockObras.value[0];

    abrirModalEvaluacion(obra);
    expect(showModalEvaluacion.value).toBe(true);
    expect(obraSeleccionada.value).toEqual(obra);

    cerrarModalEvaluacion();
    expect(showModalEvaluacion.value).toBe(false);
    expect(obraSeleccionada.value).toBeNull();
  });

  it('debería registrar el filtro por instrumento en la consola', () => {
    const { instrumentoSeleccionado, filtrarPorInstrumento } = useMaestroMontajeUI(mockObras);
    const consoleSpy = vi.spyOn(console, 'log');

    instrumentoSeleccionado.value['1'] = 'VIOLIN_I';
    filtrarPorInstrumento('1');

    expect(consoleSpy).toHaveBeenCalledWith('Filtrando por instrumento:', { obraId: '1', instrumentoId: 'VIOLIN_I' });
    consoleSpy.mockRestore();
  });
});