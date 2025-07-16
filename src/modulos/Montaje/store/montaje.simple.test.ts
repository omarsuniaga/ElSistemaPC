// src/modulos/Montaje/store/montaje.simple.test.ts
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';

// Mock de Firebase
vi.mock('@/firebase', () => ({
  db: {},
  auth: {},
}));

// Mock del servicio
vi.mock('../service/montajeService', () => ({
  montajeService: {
    obtenerObra: vi.fn(),
    obtenerPlanAccion: vi.fn(),
    crearObra: vi.fn(),
    actualizarObra: vi.fn(),
  },
}));

// Mock del auth store
vi.mock('@/stores/auth', () => ({
  useAuthStore: () => ({
    user: { uid: 'test-user', email: 'test@example.com' },
  }),
}));

describe('Montaje Store - Tests Básicos', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    vi.clearAllMocks();
  });

  it('debe importar el store correctamente', async () => {
    const { useMontajeStore } = await import('./montaje');
    expect(useMontajeStore).toBeDefined();
    expect(typeof useMontajeStore).toBe('function');
  });

  it('debe crear una instancia del store', async () => {
    const { useMontajeStore } = await import('./montaje');
    const store = useMontajeStore();

    expect(store).toBeDefined();
    expect(store.obras).toBeDefined();
    expect(store.isLoading).toBeDefined();
    expect(store.error).toBeDefined();
  });

  it('debe tener el estado inicial correcto', async () => {
    const { useMontajeStore } = await import('./montaje');
    const store = useMontajeStore();

    expect(Array.isArray(store.obras)).toBe(true);
    expect(store.obras.length).toBe(0);
    expect(store.obraActual).toBeNull();
    expect(store.planAccion).toBeNull();
    expect(store.isLoading).toBe(false);
    expect(store.error).toBeNull();
  });

  it('debe tener las funciones principales definidas', async () => {
    const { useMontajeStore } = await import('./montaje');
    const store = useMontajeStore();

    expect(typeof store.cargarObra).toBe('function');
    expect(typeof store.cargarPlanAccion).toBe('function');
    expect(typeof store.crearObra).toBe('function');
    expect(typeof store.actualizarObra).toBe('function');
    expect(typeof store.limpiarEstado).toBe('function');
  });

  it('debe poder limpiar el estado', async () => {
    const { useMontajeStore } = await import('./montaje');
    const store = useMontajeStore();

    // Ejecutar limpiarEstado
    store.limpiarEstado();

    // Verificar que el estado se limpió
    expect(store.obras.length).toBe(0);
    expect(store.obraActual).toBeNull();
    expect(store.planAccion).toBeNull();
    expect(store.error).toBeNull();
    expect(store.isLoading).toBe(false);
  });

  it('debe tener getters computados definidos', async () => {
    const { useMontajeStore } = await import('./montaje');
    const store = useMontajeStore();

    expect(typeof store.frasesActuales).toBe('object'); // computed returns object
    expect(typeof store.frasesCompletadas).toBe('object');
    expect(typeof store.progresoGeneral).toBe('object');
  });
});
