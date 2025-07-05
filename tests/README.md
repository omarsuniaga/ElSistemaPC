# Carpeta de Pruebas y Utilidades - Music Academy App

Esta carpeta contiene todos los archivos de prueba, debug, migración y utilidades utilizados durante el desarrollo de la aplicación Music Academy.

## Estructura de Archivos

### 🧪 Archivos de Prueba HTML

- `test-avatar.html` - Pruebas de sistema de avatares
- `test-invitations.html` - Pruebas de sistema de invitaciones
- `test-notifications-fixed.html` - Pruebas de notificaciones corregidas
- `test-pdf-generator.html` - Pruebas del generador de PDFs
- `test-superadmin-components.html` - Pruebas de componentes SuperAdmin
- `test-superadmin-datos-reales.html` - Pruebas de SuperAdmin con datos reales
- `test-unified-observations.html` - Pruebas del sistema unificado de observaciones
- `demo-pdf-generator.html` - Demo del generador de PDFs

### 🔧 Scripts de Debug y Utilidades

- `debug-notifications.js` - Debug del sistema de notificaciones
- `debug-notifications-browser.js` - Debug de notificaciones en navegador
- `debug-rbac.js` - Debug del sistema de roles y permisos
- `fix-rbac-browser.js` - Corrección de RBAC en navegador

### 📊 Scripts de Observaciones

- `analyze-observations.js` - Análisis de observaciones
- `firebase-observation-analyzer.js` - Analizador de observaciones en Firebase
- `firebase-observation-migrator.js` - Migrador de observaciones en Firebase
- `migrate-observations.js` - Script de migración de observaciones
- `migrate-observations-browser.js` - Migración de observaciones en navegador
- `migrate-observations-node.js` - Migración de observaciones en Node.js
- `quick-test-observations.js` - Pruebas rápidas de observaciones
- `test-attendance-observations-integration.js` - Pruebas de integración asistencia-observaciones
- `test-observation-management-system.js` - Pruebas del sistema de gestión de observaciones
- `test-unified-observations-system.js` - Pruebas del sistema unificado de observaciones

### 🔔 Scripts de Notificaciones

- `clean-problematic-notification.js` - Limpieza de notificaciones problemáticas
- `cleanup-invalid-notifications.js` - Limpieza de notificaciones inválidas
- `repair-notifications.js` - Reparación de notificaciones
- `test-notification-badge.js` - Pruebas del badge de notificaciones
- `test-notification-indicator.js` - Pruebas del indicador de notificaciones
- `test-notification-system.js` - Pruebas del sistema de notificaciones

### 🛠️ Utilidades y Scripts de Sistema

- `find-duplicate.ps1` - Script PowerShell para encontrar duplicados
- `install-migration-deps.sh` - Script de instalación de dependencias de migración

## Notas Importantes

- Estos archivos fueron movidos del directorio raíz para mantener el proyecto organizado
- Todos los archivos son funcionales y pueden ser utilizados para debugging y pruebas
- Los archivos HTML pueden abrirse directamente en el navegador
- Los archivos JavaScript pueden ejecutarse según su contexto (Node.js o navegador)

## Uso

Para ejecutar las pruebas HTML:

```bash
# Abrir en navegador
start test-[nombre-del-archivo].html
```

Para ejecutar scripts de Node.js:

```bash
node [nombre-del-archivo].js
```

Para scripts de navegador, inclúyelos en una página HTML o ejecuta en la consola del navegador.

---

**Última actualización:** 17 de junio de 2025
**Autor:** Sistema de desarrollo Music Academy App
