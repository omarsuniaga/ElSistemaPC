import { describe, it, expect, vi, beforeEach } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { useMaestroMontajeData } from '../composables/useMaestroMontajeData';
import { useMontajeStore } from '../store/montaje';
import { useAuthStore } from '@/stores/auth';

// Mock de las dependencias
vi.mock('../store/montaje', () => ({
  useMontajeStore: vi.fn(() => ({
    cargarObrasPorInstrumentoProfesor: vi.fn(() => Promise.resolve()),
    obras: [],
    estadosCompases: new Map(),
  })),
}));

vi.mock('@/stores/auth', () => ({
  useAuthStore: vi.fn(() => ({
    user: { uid: 'test-uid' },
  })),
}));

describe('useMaestroMontajeData', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    vi.clearAllMocks();
  });

  it('debería cargar los datos del maestro al montar el componente', async () => {
    const montajeStore = useMontajeStore();
    const authStore = useAuthStore();

    const { isLoadingData, errorData, loadMaestroData } = useMaestroMontajeData();

    expect(isLoadingData.value).toBe(true);
    expect(errorData.value).toBeNull();

    await loadMaestroData();

    expect(montajeStore.cargarObrasPorInstrumentoProfesor).toHaveBeenCalledWith('');
    expect(isLoadingData.value).toBe(false);
    expect(errorData.value).toBeNull();
  });

  it('debería establecer errorData si el usuario no está autenticado', async () => {
    vi.mocked(useAuthStore).mockReturnValue({
      user: null,
    } as any);

    const { isLoadingData, errorData, loadMaestroData } = useMaestroMontajeData();

    await loadMaestroData();

    expect(isLoadingData.value).toBe(false);
    expect(errorData.value).toBe('Usuario no autenticado para cargar datos del maestro.');
  });

  it('debería exponer los datos simulados correctamente', () => {
    const { maestroPlanSemanal, maestroObservacionesDirector, maestroActividadHoy, maestroProximasTareas } = useMaestroMontajeData();

    expect(maestroPlanSemanal.value).toBeDefined();
    expect(maestroObservacionesDirector.value).toBeDefined();
    expect(maestroActividadHoy.value).toBeDefined();
    expect(maestroProximasTareas.value).toBeDefined();
  });
});
