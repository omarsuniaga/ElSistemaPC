&lt;template> &lt;div class="connection-status" :class="[ `status-${state.connectionState}`, {
'has-pending': state.pendingChanges > 0 } ]" > &lt;div class="status-indicator"> &lt;div
class="indicator-dot">&lt;/div> &lt;span class="status-text">{{ statusText }}&lt;/span> &lt;/div>
&lt;div v-if="state.pendingChanges > 0" class="pending-changes"> {{ state.pendingChanges }} cambio{{
  state.pendingChanges !== 1 ? "s" : ""
}}
pendiente{{ state.pendingChanges !== 1 ? "s" : "" }}
&lt;button v-if="state.isOnline" @click="syncNow" class="sync-button" :disabled="isSyncing" >
{{ isSyncing ? "Sincronizando..." : "Sincronizar ahora" }}
&lt;/button> &lt;/div> &lt;transition name="fade"> &lt;div v-if="showToast" class="toast-message"
:class="toastType">
{{ toastMessage }}
&lt;/div> &lt;/transition> &lt;/div> &lt;/template> &lt;script setup lang="ts"> import { ref,
computed, onMounted, onUnmounted } from 'vue'; import { OfflineMode, OFFLINE_STATE_CHANGE } from
'../utils/offlineMode'; // Estado reactivo const state = ref(OfflineMode.getState()); const
showToast = ref(false); const toastMessage = ref(''); const toastType = ref('success'); const
isSyncing = ref(false); // Calcular texto de estado según el estado de conexión const statusText =
computed(() => { switch (state.value.connectionState) { case 'online': return 'Conectado'; case
'offline': return 'Desconectado'; case 'reconnecting': return 'Reconectando...'; default: return
'Desconocido'; } }); // Mostrar un mensaje toast temporal const showToastMessage = (message: string,
type: 'success' | 'error' = 'success') => { toastMessage.value = message; toastType.value = type;
showToast.value = true; // Ocultar después de 3 segundos setTimeout(() => { showToast.value = false;
}, 3000); }; // Forzar sincronización manual const syncNow = async () => { if (isSyncing.value)
return; isSyncing.value = true; try { const success = await OfflineMode.forceSyncAll(); if (success)
{ showToastMessage('Sincronización completada con éxito'); } else { showToastMessage('Error en la
sincronización', 'error'); } } catch (error) { console.error('Error en sincronización manual:',
error); showToastMessage('Error en la sincronización', 'error'); } finally { isSyncing.value =
false; } }; // Actualizar estado cuando cambie const handleStateChange = (event: CustomEvent) => {
state.value = event.detail; }; // Inicializar el componente onMounted(() => { // Inicializar el
sistema offline si aún no se ha hecho if (state.value.connectionState === 'offline' &&
navigator.onLine) { state.value = OfflineMode.getState(); } // Escuchar cambios de estado
window.addEventListener(OFFLINE_STATE_CHANGE, handleStateChange as EventListener); }); // Limpiar
escuchas cuando se desmonte onUnmounted(() => { window.removeEventListener(OFFLINE_STATE_CHANGE,
handleStateChange as EventListener); }); &lt;/script> &lt;style scoped> .connection-status {
position: fixed; bottom: 20px; right: 20px; padding: 10px 15px; border-radius: 8px;
background-color: white; box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1); z-index: 1000; font-size: 14px;
display: flex; flex-direction: column; gap: 8px; max-width: 300px; transition: all 0.3s ease; }
.status-indicator { display: flex; align-items: center; gap: 8px; } .indicator-dot { width: 10px;
height: 10px; border-radius: 50%; background-color: #ccc; } .status-online .indicator-dot {
background-color: #4caf50; } .status-offline .indicator-dot { background-color: #f44336; }
.status-reconnecting .indicator-dot { background-color: #ff9800; animation: blink 1s infinite; }
.status-text { font-weight: 500; } .has-pending { background-color: #fff8e1; } .pending-changes {
font-size: 12px; color: #555; display: flex; flex-direction: column; gap: 5px; } .sync-button {
padding: 4px 8px; background-color: #2196f3; color: white; border: none; border-radius: 4px; cursor:
pointer; font-size: 12px; transition: background-color 0.2s; } .sync-button:hover:not(:disabled) {
background-color: #1976d2; } .sync-button:disabled { background-color: #bbdefb; cursor: not-allowed;
} .toast-message { position: absolute; top: -40px; left: 0; right: 0; padding: 8px; border-radius:
4px; text-align: center; color: white; font-size: 12px; transition: all 0.3s ease; }
.toast-message.success { background-color: #43a047; } .toast-message.error { background-color:
#e53935; } .fade-enter-active, .fade-leave-active { transition: opacity 0.3s, transform 0.3s; }
.fade-enter-from, .fade-leave-to { opacity: 0; transform: translateY(-10px); } @keyframes blink {
0%, 100% { opacity: 1; } 50% { opacity: 0.5; } } &lt;/style>
