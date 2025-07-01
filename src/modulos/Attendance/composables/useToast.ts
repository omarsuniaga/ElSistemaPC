/*
 * composables/useToast.ts — Sistema minimal de notificaciones tipo Toast
 *
 * Uso básico:
 *  const toast = useToast()
 *  toast.success('Guardado!')
 *  toast.error('Algo falló')
 *
 * En tu componente raíz (o layout) mapea toast.list y muestra los mensajes.
 */

import {reactive, readonly} from "vue"

export interface ToastMessage {
  id: number
  text: string
  type: "success" | "error" | "info" | "warning"
  timeout?: number
}

let _id = 0

function createStore() {
  const list = reactive<ToastMessage[]>([])

  function push(text: string, type: ToastMessage["type"] = "info", timeout = 3000) {
    const id = ++_id
    list.push({id, text, type, timeout})

    if (timeout) {
      setTimeout(() => remove(id), timeout)
    }
  }

  function success(text: string, timeout?: number) {
    push(text, "success", timeout)
  }
  function error(text: string, timeout?: number) {
    push(text, "error", timeout)
  }
  function info(text: string, timeout?: number) {
    push(text, "info", timeout)
  }
  function warning(text: string, timeout?: number) {
    push(text, "warning", timeout)
  }

  function remove(id: number) {
    const idx = list.findIndex((t) => t.id === id)
    if (idx !== -1) list.splice(idx, 1)
  }
  function clear() {
    list.splice(0, list.length)
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

// export singleton to share across app
export const useToast = createStore
