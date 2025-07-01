// Panel de Control WhatsApp para el Frontend
// Agregar esto al WhatsAppPanel.vue

const controlActions = [
  {
    id: 'init',
    title: 'Inicializar WhatsApp',
    description: 'Activar el servicio por primera vez',
    color: 'green',
    icon: 'PlayIcon',
    action: initializeWhatsApp
  },
  {
    id: 'restart',
    title: 'Reiniciar WhatsApp', 
    description: 'Reiniciar el servicio completamente',
    color: 'orange',
    icon: 'ArrowPathIcon',
    action: restartWhatsApp
  },
  {
    id: 'stop',
    title: 'Detener WhatsApp',
    description: 'Pausar el servicio temporalmente', 
    color: 'red',
    icon: 'StopIcon',
    action: stopWhatsApp
  }
];

const initializeWhatsApp = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/init`, {
      method: 'POST'
    });
    const result = await response.json();
    
    if (result.success) {
      // Mostrar notificación de éxito
      alert('✅ WhatsApp inicializado correctamente');
      await checkFunctionStatus(); // Actualizar estado
    } else {
      alert('❌ Error al inicializar WhatsApp');
    }
  } catch (error) {
    console.error('Error:', error);
    alert('❌ Error de conexión');
  }
};

const restartWhatsApp = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/restart`, {
      method: 'POST'
    });
    const result = await response.json();
    
    if (result.success) {
      alert('🔄 WhatsApp reiniciado correctamente');
      await checkFunctionStatus();
    } else {
      alert('❌ Error al reiniciar WhatsApp');
    }
  } catch (error) {
    console.error('Error:', error);
    alert('❌ Error de conexión');
  }
};
