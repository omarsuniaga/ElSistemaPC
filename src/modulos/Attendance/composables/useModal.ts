/*
 * composables/useModal.ts — Gestión ligera y reactiva de modales
 * Uso: const { state, open, close, toggle, isOpen } = useModal()
 *
 * state es un objeto reactivo <modalName, boolean> que puedes pasar directo
 * a tus componentes.
 */
import { reactive } from 'vue'

export function useModal() {
  // state: { [modalName: string]: boolean }
  const state = reactive<Record<string, boolean>>({})

  /* -------- helpers públicos -------- */
  function open(name: string) {
    state[name] = true
  }

  function close(name: string) {
    state[name] = false
  }

  function toggle(name: string) {
    state[name] = !state[name]
  }

  function isOpen(name: string): boolean {
    return !!state[name]
  }

  /* Opcional: cerrar todos (para navegar limpio) */
  function closeAll() {
    Object.keys(state).forEach((k) => (state[k] = false))
  }

  return {
    state,
    open,
    close,
    toggle,
    isOpen,
    closeAll,
  }
}
