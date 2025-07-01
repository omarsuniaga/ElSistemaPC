# WhatsApp Function - Estrategias de Activación

## 🚀 Estrategias para mantener activo WhatsApp

### 1. **Ping Automático desde Netlify**
```javascript
// En tu app de Netlify, agregar en main.js o App.vue
setInterval(async () => {
  try {
    await fetch('https://us-central1-orquestapuntacana.cloudfunctions.net/whatsappApi/status');
    console.log('📱 WhatsApp function pinged');
  } catch (error) {
    console.log('❌ WhatsApp function down, trying to wake up...');
    // Intentar inicializar
    await fetch('https://us-central1-orquestapuntacana.cloudfunctions.net/whatsappApi/init');
  }
}, 5 * 60 * 1000); // Cada 5 minutos
```

### 2. **Scheduled Function (Recomendado)**
```typescript
// En Firebase Functions
export const keepWhatsAppAlive = functions.pubsub
  .schedule('every 5 minutes')
  .onRun(async (context) => {
    console.log('🔄 Manteniendo WhatsApp activo...');
    
    // Verificar si WhatsApp está activo
    if (whatsappStatus === 'disconnected') {
      await initializeWhatsApp();
    }
    
    return null;
  });
```

### 3. **Webhook de Activación**
```typescript
// Webhook que puedes llamar desde Netlify deploy hooks
export const webhookActivate = functions.https.onRequest((req, res) => {
  corsHandler(req, res, async () => {
    if (req.method === 'POST' && req.body.trigger === 'netlify_deploy') {
      console.log('🌐 Activación desde Netlify deploy');
      await initializeWhatsApp();
      
      res.json({
        success: true,
        message: 'WhatsApp activado desde Netlify',
        status: whatsappStatus
      });
    } else {
      res.status(400).json({ error: 'Invalid webhook call' });
    }
  });
});
```

## 📱 Panel de Control en Frontend

### Botones de Control:
- **🟢 Inicializar**: Primera activación
- **🔄 Reiniciar**: Reinicio completo  
- **⏸️ Pausar**: Pausar temporalmente
- **📊 Estado**: Ver logs y estado actual
- **⚡ Ping**: Verificar si está vivo

### Auto-recuperación:
- Si detecta 404, intenta auto-inicializar
- Retry automático cada 30 segundos
- Notificaciones al administrador si falla

## 🔧 Comandos Útiles

### Verificar estado:
```bash
curl https://us-central1-orquestapuntacana.cloudfunctions.net/whatsappApi/status
```

### Inicializar manualmente:
```bash
curl -X POST https://us-central1-orquestapuntacana.cloudfunctions.net/whatsappApi/init
```

### Ver logs:
```bash
firebase functions:log --only whatsappApi
```
