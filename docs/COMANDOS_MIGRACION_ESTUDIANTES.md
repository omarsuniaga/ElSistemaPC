# 🎓 Sistema de Migración de Estudiantes - Comandos Disponibles

## 🚀 **PROCESO RECOMENDADO** (Automático y Seguro)

```bash
# Ejecuta: backup + análisis + recomendaciones
npm run migrate:safe-process
```

**¿Qué hace?**
- ✅ Crea backup automático de ALUMNOS
- ✅ Verifica el archivo CSV
- ✅ Analiza coincidencias entre CSV y Firestore
- ✅ Muestra estadísticas y recomendaciones
- ✅ **NO modifica ningún dato**

---

## 📊 **COMANDOS DE ANÁLISIS** (Solo lectura)

### Analizar colección actual
```bash
npm run analyze:alumnos
```
- Muestra estructura de datos actual
- Estadísticas de completitud
- Instrumentos y grupos existentes

### Análisis detallado CSV vs Firestore
```bash
npm run migrate:analyze-csv
```
- Coincidencias exactas y parciales
- Estudiantes sin coincidencias
- Genera reporte JSON detallado

---

## 🔒 **COMANDOS DE BACKUP** (Seguridad)

### Crear backup
```bash
npm run backup:alumnos
```
- Exporta toda la colección ALUMNOS
- Incluye metadatos y timestamps
- Guarda en directorio `/backups`

### Listar backups disponibles
```bash
npm run backup:list
```
- Muestra todos los backups creados
- Fechas y tamaños de archivos

---

## ⚠️ **COMANDO DE MIGRACIÓN** (Modifica datos)

### Ejecutar migración real
```bash
npm run migrate:students-csv
```

**IMPORTANTE:**
- ⚠️ **Solo ejecutar después del análisis**
- ⚠️ **Asegúrate de tener backup**
- ⚠️ **Revisa las recomendaciones primero**

---

## 📁 **Archivos requeridos**

### CSV de estudiantes
- **Ubicación:** `/INTEGRANTES_EL_SISTEMA_PUNTA_CANA.csv`
- **Formato:** Columnas separadas por comas
- **Campos:** contador,Nombre,inscripcion,nac,instrumento,edad,tlf,Preparatoria,Teoria Musical,Coro,Orquesta,InstrumentoID

### Variables de entorno (`.env`)
```
VITE_APP_API_KEY=tu_api_key
VITE_APP_AUTH_DOMAIN=tu_auth_domain
VITE_APP_PROJECT_ID=tu_project_id
VITE_APP_STORAGE_BUCKET=tu_storage_bucket
VITE_APP_MESSAGING_SENDER_ID=tu_messaging_sender_id
VITE_APP_APP_ID=tu_app_id
```

---

## 🎯 **Flujo de trabajo recomendado**

1. **Preparación**
   ```bash
   npm run analyze:alumnos          # Ver estado actual
   ```

2. **Análisis completo**
   ```bash
   npm run migrate:safe-process     # Backup + análisis
   ```

3. **Revisar resultados**
   - Porcentaje de coincidencias
   - Reporte detallado
   - Recomendaciones

4. **Migración (solo si todo está OK)**
   ```bash
   npm run migrate:students-csv     # Ejecutar migración
   ```

5. **Verificación post-migración**
   ```bash
   npm run analyze:alumnos          # Verificar cambios
   ```

---

## 🔧 **Troubleshooting**

### Error de conexión a Firebase
- Verificar variables de entorno
- Verificar permisos de Firestore
- Verificar conexión a internet

### CSV no encontrado
- Verificar que el archivo esté en la raíz del proyecto
- Verificar el nombre exacto del archivo

### Pocas coincidencias encontradas
- Revisar formato de nombres en CSV
- Verificar datos en Firestore
- Considerar limpieza manual de datos

---

## 📈 **Métricas de éxito**

- **>80% coincidencias:** ✅ Excelente, proceder
- **60-80% coincidencias:** 🔶 Aceptable, revisar no coincidentes
- **<60% coincidencias:** ⚠️ Revisar datos antes de continuar

---

## 🆘 **En caso de problemas**

1. **Restaurar desde backup**
   - Ubicar archivo en `/backups/`
   - Contactar administrador del sistema

2. **Logs de error**
   - Revisar salida de consola
   - Verificar configuración de Firebase

3. **Soporte**
   - Revisar documentación
   - Contactar desarrollador
