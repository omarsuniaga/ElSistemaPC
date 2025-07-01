import {ref} from "vue"

export interface Toast {
  id: string
  title: string
  description?: string
  variant?: "default" | "destructive" | "success"
  duration?: number
}

const toasts = ref<Toast[]>([])

export function useToast() {
  const toast = (props: Omit<Toast, "id">) => {
    const id = Math.random().toString(36).substring(2, 9)
    const duration = props.duration || 5000

    const newToast: Toast = {
      id,
      title: props.title,
      description: props.description,
      variant: props.variant || "default",
    }

    toasts.value.push(newToast)

    // Auto-close toast after duration
    setTimeout(() => {
      dismiss(id)
    }, duration)

    // Also log the toast to the console for development purposes
    console.log(
      `Toast [${props.variant || "default"}]: ${props.title}${props.description ? ` - ${props.description}` : ""}`
    )

    return id
  }

  const dismiss = (id: string) => {
    toasts.value = toasts.value.filter((t) => t.id !== id)
  }

  return {
    toast,
    dismiss,
    toasts,
  }
}
