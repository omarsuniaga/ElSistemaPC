// Composable para el modal de gestión de mensajes WhatsApp de inasistencias
import {ref} from "vue"

export function useWhatsAppInasistenciasModal() {
  const isModalVisible = ref(false)

  const openModal = () => {
    isModalVisible.value = true
  }

  const closeModal = () => {
    isModalVisible.value = false
  }

  const handleMessagesSent = (result: {success: number; failed: number; messages: any[]}) => {
    console.log("Mensajes enviados:", result)
    // Aquí puedes agregar lógica adicional como mostrar notificaciones, actualizar datos, etc.
  }

  return {
    isModalVisible,
    openModal,
    closeModal,
    handleMessagesSent,
  }
}
