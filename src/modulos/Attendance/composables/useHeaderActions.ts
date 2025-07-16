/*
 * composables/useHeaderActions.ts — Control centralizado de acciones del header
 * Roles soportados: 'admin' | 'teacher'
 *
 * Admin: acceso completo (analytics, report, export, emergencyClass)
 * Teacher: solo analytics + report
 */

import { computed } from 'vue';
import { useModal } from './useModal';
import { useAuthStore } from '../../../stores/auth';

export type HeaderAction = 'analytics' | 'report' | 'export' | 'emergency'

interface Options {
  /** Rol del usuario actual */
  role: 'admin' | 'teacher'
}

export function useHeaderActions({ role }: Options) {
  const modal = useModal();
  const auth = useAuthStore();

  /* ------------------------------------------------- */
  /* Helpers para exponer a los componentes de UI      */
  /* ------------------------------------------------- */
  const canExport = computed(() => role === 'admin');
  const canCreateEmergency = computed(() => role === 'admin');

  function open(action: HeaderAction) {
    switch (action) {
    case 'analytics':
      modal.open('analytics');
      break;
    case 'report':
      modal.open('report');
      break;
    case 'export':
      if (canExport.value) modal.open('export');
      break;
    case 'emergency':
      if (canCreateEmergency.value) modal.open('emergency');
      break;
    }
  }

  return {
    /* reactive state */
    modalState: modal.state,

    /* permissions */
    canExport,
    canCreateEmergency,

    /* actions */
    open,

    /* info útil del usuario para el header */
    userName: computed(() => auth.user?.email || 'Usuario'),
  };
}
