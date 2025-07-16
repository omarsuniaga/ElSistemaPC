import { ref } from 'vue';

export function useWhatsAppNotificacionesModal() {
  const isModalVisible = ref(false);

  const openModal = () => {
    isModalVisible.value = true;
  };

  const closeModal = () => {
    isModalVisible.value = false;
  };

  const handleMessagesSent = (result: { success: number; failed: number; messages: any[] }) => {
    console.log('📱 Mensajes enviados:', result);
    
    // Aquí puedes agregar lógica adicional como:
    // - Mostrar notificaciones toast
    // - Actualizar stores
    // - Registrar en analytics
    // - etc.
    
    if (result.success > 0) {
      console.log(`✅ ${result.success} mensajes enviados exitosamente`);
    }
    
    if (result.failed > 0) {
      console.log(`❌ ${result.failed} mensajes fallaron`);
    }
  };

  return {
    isModalVisible,
    openModal,
    closeModal,
    handleMessagesSent,
  };
}
