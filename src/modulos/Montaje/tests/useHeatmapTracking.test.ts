import { describe, it, expect, beforeEach, vi, type Mock } from 'vitest';
import { ref } from 'vue';
import { useHeatmapTracking } from '../composables/useHeatmapTracking';
import { EstadoCompass, TipoInstrumento } from '../types';

// Mock de los stores y composables
vi.mock('@/composables/useFirestore', () => ({
  useFirestore: () => ({
    addDocument: vi.fn(),
    updateDocument: vi.fn(),
    runBatch: vi.fn().mockResolvedValue(true)
  })
}));

vi.mock('../store/montaje', () => ({
  useMontajeStore: () => ({
    getCompasInfo: vi.fn((obraId: string, compas: number, instrumento: string) => ({
      estado: EstadoCompass.SIN_TRABAJAR,
      observacion: '',
      seccion: 'A',
      alumnosIds: []
    })),
    setCompasesEstado: vi.fn(),
    getUserId: 'test-user-123',
    getCompasesHistorial: vi.fn().mockResolvedValue([]),
    restaurarCompasesEstado: vi.fn().mockResolvedValue(true)
  })
}));

describe('useHeatmapTracking', () => {
  let tracking: ReturnType<typeof useHeatmapTracking>;
  const obraId = 'obra-test-123';

  beforeEach(() => {
    vi.clearAllMocks();
    tracking = useHeatmapTracking(obraId);
  });

  describe('Selección de compases', () => {
    it('debe agregar un compás a la selección', () => {
      const compas = 5;
      const instrumento = TipoInstrumento.VIOLIN_I;

      tracking.agregarASeleccion(compas, instrumento);

      expect(tracking.compasesSeleccionados.value).toHaveLength(1);
      expect(tracking.compasesSeleccionados.value[0]).toMatchObject({
        obraId,
        numero: compas,
        instrumento,
        estado: EstadoCompass.SIN_TRABAJAR
      });

      // Verificar que está marcado como seleccionado
      const key = `${obraId}-${compas}-${instrumento}`;
      expect(tracking.seleccionado.value[key]).toBe(true);
    });

    it('debe eliminar un compás de la selección', () => {
      const compas = 5;
      const instrumento = TipoInstrumento.VIOLIN_I;

      // Primero agregar
      tracking.agregarASeleccion(compas, instrumento);
      expect(tracking.compasesSeleccionados.value).toHaveLength(1);

      // Luego eliminar
      tracking.eliminarDeSeleccion(compas, instrumento);
      expect(tracking.compasesSeleccionados.value).toHaveLength(0);

      const key = `${obraId}-${compas}-${instrumento}`;
      expect(tracking.seleccionado.value[key]).toBeUndefined();
    });

    it('debe limpiar toda la selección', () => {
      // Agregar varios compases
      tracking.agregarASeleccion(1, TipoInstrumento.VIOLIN_I);
      tracking.agregarASeleccion(2, TipoInstrumento.VIOLIN_II);
      tracking.agregarASeleccion(3, TipoInstrumento.VIOLA);

      expect(tracking.compasesSeleccionados.value).toHaveLength(3);

      // Limpiar selección
      tracking.limpiarSeleccion();

      expect(tracking.compasesSeleccionados.value).toHaveLength(0);
      expect(Object.keys(tracking.seleccionado.value)).toHaveLength(0);
    });

    it('no debe agregar duplicados', () => {
      const compas = 5;
      const instrumento = TipoInstrumento.VIOLIN_I;

      tracking.agregarASeleccion(compas, instrumento);
      tracking.agregarASeleccion(compas, instrumento); // Duplicado

      expect(tracking.compasesSeleccionados.value).toHaveLength(1);
    });
  });

  describe('Selección por arrastre (drag-select)', () => {
    it('debe iniciar drag selection correctamente', () => {
      const x = 100;
      const y = 150;

      tracking.iniciarDragSelection(x, y);

      expect(tracking.dragSelectionActive.value).toBe(true);
      expect(tracking.areaSeleccion.value).toEqual({
        inicio: { x, y },
        fin: { x, y }
      });
    });

    it('debe actualizar el área de selección durante el arrastre', () => {
      // Iniciar drag
      tracking.iniciarDragSelection(100, 150);

      // Actualizar posición
      tracking.actualizarDragSelection(200, 250);

      expect(tracking.areaSeleccion.value?.fin).toEqual({ x: 200, y: 250 });
    });

    it('debe seleccionar compases dentro del área de arrastre', () => {
      const compases = [
        { numero: 1, instrumento: TipoInstrumento.VIOLIN_I, x: 150, y: 200 },
        { numero: 2, instrumento: TipoInstrumento.VIOLIN_I, x: 250, y: 300 },
        { numero: 3, instrumento: TipoInstrumento.VIOLIN_II, x: 50, y: 100 } // Fuera del área
      ];

      // Iniciar drag selection
      tracking.iniciarDragSelection(100, 150);
      tracking.actualizarDragSelection(300, 350);

      // Finalizar selección
      tracking.finalizarDragSelection(compases);

      // Solo los compases 1 y 2 deben estar seleccionados (dentro del área)
      expect(tracking.compasesSeleccionados.value).toHaveLength(2);
      expect(tracking.compasesSeleccionados.value.some(c => c.numero === 1)).toBe(true);
      expect(tracking.compasesSeleccionados.value.some(c => c.numero === 2)).toBe(true);
      expect(tracking.compasesSeleccionados.value.some(c => c.numero === 3)).toBe(false);

      // Verificar que drag selection esté desactivado
      expect(tracking.dragSelectionActive.value).toBe(false);
      expect(tracking.areaSeleccion.value).toBeNull();
    });
  });

  describe('Cambio de estados', () => {
    it('debe cambiar el estado de los compases seleccionados', async () => {
      // Seleccionar algunos compases
      tracking.agregarASeleccion(1, TipoInstrumento.VIOLIN_I);
      tracking.agregarASeleccion(2, TipoInstrumento.VIOLIN_II);

      const nuevoEstado = EstadoCompass.LEIDO;
      const observacion = 'Observación de prueba';
      const alumnosIds = ['alumno-1', 'alumno-2'];

      // Cambiar estado
      const resultado = await tracking.cambiarEstadoSeleccionados(nuevoEstado, observacion, alumnosIds);

      expect(resultado).toHaveLength(2);
      expect(resultado?.[0].estado).toBe(nuevoEstado);
      expect(resultado?.[0].observacion).toBe(''); // No debe tener observación para estado LEIDO
      expect(resultado?.[0].alumnosIds).toEqual(alumnosIds);
    });

    it('debe incluir observación solo para estado CON_DIFICULTAD', async () => {
      tracking.agregarASeleccion(1, TipoInstrumento.VIOLIN_I);

      const observacion = 'Problemas con la afinación';

      // Cambiar a estado con dificultad
      const resultado = await tracking.cambiarEstadoSeleccionados(
        EstadoCompass.CON_DIFICULTAD, 
        observacion
      );

      expect(resultado?.[0].estado).toBe(EstadoCompass.CON_DIFICULTAD);
      expect(resultado?.[0].observacion).toBe(observacion);
    });

    it('no debe hacer nada si no hay compases seleccionados', async () => {
      // Sin seleccionar nada
      const resultado = await tracking.cambiarEstadoSeleccionados(EstadoCompass.LOGRADO);

      expect(resultado).toBeUndefined();
    });
  });

  describe('Historial de acciones', () => {
    it('debe registrar acciones en el historial', () => {
      tracking.agregarASeleccion(1, TipoInstrumento.VIOLIN_I);
      
      // Usar finalizarDragSelection para que registre la acción
      tracking.finalizarDragSelection([
        { numero: 1, instrumento: TipoInstrumento.VIOLIN_I, x: 100, y: 150 }
      ]);

      expect(tracking.historialAcciones.value).toHaveLength(1);
      expect(tracking.historialAcciones.value[0].tipo).toBe('seleccion');
    });

    it('debe limitar el historial a 20 acciones', () => {
      // Simular 25 acciones usando el método correcto
      for (let i = 0; i < 25; i++) {
        tracking.agregarASeleccion(i + 1, TipoInstrumento.VIOLIN_I);
        tracking.finalizarDragSelection([
          { numero: i + 1, instrumento: TipoInstrumento.VIOLIN_I, x: 100, y: 150 }
        ]);
      }

      expect(tracking.historialAcciones.value.length).toBeLessThanOrEqual(20);
    });
  });

  describe('Integración con obra reactiva', () => {
    it('debe funcionar con un ref reactivo para obraId', () => {
      const obraIdReactiva = ref('obra-reactiva-123');
      const trackingReactivo = useHeatmapTracking(obraIdReactiva);

      trackingReactivo.agregarASeleccion(1, TipoInstrumento.VIOLIN_I);

      expect(trackingReactivo.compasesSeleccionados.value[0].obraId).toBe('obra-reactiva-123');

      // Cambiar obra
      obraIdReactiva.value = 'obra-nueva-456';

      trackingReactivo.agregarASeleccion(2, TipoInstrumento.VIOLIN_II);

      expect(trackingReactivo.compasesSeleccionados.value[1].obraId).toBe('obra-nueva-456');
    });
  });

  describe('Manejo de errores', () => {
    it('debe manejar errores al cambiar estado de compases', async () => {
      // Configurar mock para que falle antes de cargar el composable
      vi.clearAllMocks();
      
      const mockFirestore = {
        runBatch: vi.fn().mockRejectedValue(new Error('Error de Firestore')),
        addDocument: vi.fn(),
        updateDocument: vi.fn()
      };
      
      vi.doMock('@/composables/useFirestore', () => ({
        useFirestore: () => mockFirestore
      }));

      // Crear nueva instancia del composable con el mock actualizado
      const { useHeatmapTracking } = await import('../composables/useHeatmapTracking');
      const trackingWithError = useHeatmapTracking('obra-test-error');

      trackingWithError.agregarASeleccion(1, TipoInstrumento.VIOLIN_I);

      await expect(
        trackingWithError.cambiarEstadoSeleccionados(EstadoCompass.LOGRADO)
      ).rejects.toThrow('Error de Firestore');
    });
  });
});
