/*
 * composables/useToast.ts — Sistema de notificaciones Toast mejorado para maestros
 */

import {reactive, readonly} from "vue"

export interface ToastMessage {
  id: number
  title: string
  description?: string
  type: "success" | "error" | "info" | "warning"
  timeout?: number
  visible?: boolean
}

let _id = 0

function createToastStore() {
  const list = reactive<ToastMessage[]>([])

  function push(
    title: string,
    description?: string,
    type: ToastMessage["type"] = "info",
    timeout = 4000
  ) {
    const id = ++_id
    const toast: ToastMessage = {
      id,
      title,
      description,
      type,
      timeout,
      visible: true,
    }

    list.push(toast)

    if (timeout) {
      setTimeout(() => remove(id), timeout)
    }

    return id
  }

  function success(title: string, description?: string, timeout?: number) {
    return push(title, description, "success", timeout)
  }

  function error(title: string, description?: string, timeout?: number) {
    return push(title, description, "error", timeout)
  }

  function info(title: string, description?: string, timeout?: number) {
    return push(title, description, "info", timeout)
  }

  function warning(title: string, description?: string, timeout?: number) {
    return push(title, description, "warning", timeout)
  }

  function remove(id: number) {
    const idx = list.findIndex((t) => t.id === id)
    if (idx !== -1) {
      // Marcar como no visible para animación de salida
      list[idx].visible = false
      // Remover después de la animación
      setTimeout(() => {
        const newIdx = list.findIndex((t) => t.id === id)
        if (newIdx !== -1) list.splice(newIdx, 1)
      }, 300)
    }
  }

  function clear() {
    list.forEach((toast) => (toast.visible = false))
    setTimeout(() => {
      list.splice(0, list.length)
    }, 300)
  }

  return {
    list: readonly(list),
    push,
    success,
    error,
    info,
    warning,
    remove,
    clear,
  }
}

// Export singleton to share across app
export const useToast = createToastStore
