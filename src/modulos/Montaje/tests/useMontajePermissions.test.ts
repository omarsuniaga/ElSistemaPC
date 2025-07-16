import { describe, it, expect, vi, beforeEach } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { useMontajePermissions } from '../composables/useMontajePermissions';
import { useAuthStore } from '@/stores/auth';

// Mock de useAuthStore
vi.mock('@/stores/auth', () => ({
  useAuthStore: vi.fn(() => ({
    user: null,
    isDirector: false,
    isSuperusuario: false,
    isTeacher: false,
  })),
}));

describe('useMontajePermissions', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    vi.clearAllMocks();
  });

  it('debería otorgar todos los permisos si el usuario es Director', () => {
    vi.mocked(useAuthStore).mockReturnValue({
      user: { uid: 'dir1', role: 'Director' },
      isDirector: true,
      isSuperusuario: false,
      isTeacher: false,
    } as any);

    const { hasPermission, canReadWorks, canCreateEvaluations } = useMontajePermissions();

    expect(hasPermission('works', 'read')).toBe(true);
    expect(hasPermission('evaluations', 'create')).toBe(true);
    expect(canReadWorks.value).toBe(true);
    expect(canCreateEvaluations.value).toBe(true);
  });

  it('debería otorgar todos los permisos si el usuario es Superusuario', () => {
    vi.mocked(useAuthStore).mockReturnValue({
      user: { uid: 'super1', role: 'Superusuario' },
      isDirector: false,
      isSuperusuario: true,
      isTeacher: false,
    } as any);

    const { hasPermission, canReadReports, canUpdateWorkProgress } = useMontajePermissions();

    expect(hasPermission('reports', 'read')).toBe(true);
    expect(hasPermission('works', 'update')).toBe(true);
    expect(canReadReports.value).toBe(true);
    expect(canUpdateWorkProgress.value).toBe(true);
  });

  it('debería otorgar permisos específicos para el rol de Maestro', () => {
    vi.mocked(useAuthStore).mockReturnValue({
      user: { uid: 'teacher1', role: 'Maestro', userRoles: [] }, // userRoles puede ser vacío si no hay permisos granulares
      isDirector: false,
      isSuperusuario: false,
      isTeacher: true,
    } as any);

    const { hasPermission, canReadWorks, canCreateEvaluations, canUpdateWorkProgress, canReadReports } = useMontajePermissions();

    expect(hasPermission('works', 'read')).toBe(true);
    expect(canReadWorks.value).toBe(true);

    expect(hasPermission('evaluations', 'create')).toBe(true);
    expect(canCreateEvaluations.value).toBe(true);

    expect(hasPermission('evaluations', 'update')).toBe(true);

    expect(hasPermission('evaluations', 'read')).toBe(true);

    expect(hasPermission('reports', 'read')).toBe(true);
    expect(canReadReports.value).toBe(true);

    expect(hasPermission('members', 'read')).toBe(true);

    expect(hasPermission('settings', 'read')).toBe(true);

    expect(hasPermission('works', 'update')).toBe(true);
    expect(canUpdateWorkProgress.value).toBe(true);

    // Permisos que un maestro NO debería tener por defecto
    expect(hasPermission('works', 'delete')).toBe(false);
    expect(hasPermission('members', 'create')).toBe(false);
  });

  it('debería denegar permisos si el usuario no está autenticado', () => {
    vi.mocked(useAuthStore).mockReturnValue({
      user: null,
      isDirector: false,
      isSuperusuario: false,
      isTeacher: false,
    } as any);

    const { hasPermission, canReadWorks } = useMontajePermissions();

    expect(hasPermission('works', 'read')).toBe(false);
    expect(canReadWorks.value).toBe(false);
  });

  it('debería denegar permisos si el rol no tiene permisos definidos', () => {
    vi.mocked(useAuthStore).mockReturnValue({
      user: { uid: 'other', role: 'OtherRole' },
      isDirector: false,
      isSuperusuario: false,
      isTeacher: false,
    } as any);

    const { hasPermission } = useMontajePermissions();

    expect(hasPermission('works', 'read')).toBe(false);
  });
});
