# Guía de migración de estudiantes desde CSV

## � Proceso completo y seguro (RECOMENDADO)

### Opción 1: Proceso automático seguro

```bash
npm run migrate:safe-process
```

Este comando ejecuta automáticamente:

1. ✅ **Backup** de la colección ALUMNOS
2. ✅ **Verificación** del archivo CSV
3. ✅ **Análisis** de coincidencias
4. ✅ **Recomendaciones** basadas en resultados
5. ✅ **NO modifica datos** (solo análisis)

### Opción 2: Proceso manual paso a paso

#### 1. **Crear backup (OBLIGATORIO)**

```bash
npm run backup:alumnos
```

#### 2. **Análisis detallado**

```bash
npm run migrate:analyze-csv
```

#### 3. **Migración real** (solo después del análisis)

```bash
npm run migrate:students-csv
```

## 📋 Comandos disponibles

| Comando                        | Descripción                         | Seguridad         |
| ------------------------------ | ----------------------------------- | ----------------- |
| `npm run migrate:safe-process` | Proceso completo seguro             | ✅ Solo análisis  |
| `npm run backup:alumnos`       | Crear backup de ALUMNOS             | ✅ Solo lectura   |
| `npm run backup:list`          | Listar backups disponibles          | ✅ Solo lectura   |
| `npm run migrate:analyze-csv`  | Análisis detallado CSV vs Firestore | ✅ Solo lectura   |
| `npm run migrate:students-csv` | Migración real de datos             | ⚠️ Modifica datos |

## 🔧 Configuración requerida

### Variables de entorno

Asegúrate de tener estas variables en tu `.env`:

```
VITE_APP_API_KEY=tu_api_key
VITE_APP_AUTH_DOMAIN=tu_auth_domain
VITE_APP_PROJECT_ID=tu_project_id
VITE_APP_STORAGE_BUCKET=tu_storage_bucket
VITE_APP_MESSAGING_SENDER_ID=tu_messaging_sender_id
VITE_APP_APP_ID=tu_app_id
```

### Archivo CSV

- ✅ El archivo CSV debe estar en la raíz del proyecto
- ✅ Nombre: `INTEGRANTES EL SISTEMA PUNTA CANA - Hoja 3.csv`

## 📊 Mapeo de campos

| CSV              | Firestore       | Acción                          |
| ---------------- | --------------- | ------------------------------- |
| `Nombre`         | `nombre`        | Actualizar nombre completo      |
| `inscripcion`    | `createdAt`     | Actualizar fecha de inscripción |
| `nac`            | `nac`           | Actualizar fecha de nacimiento  |
| `instrumento`    | `instrumento`   | Actualizar instrumento          |
| `edad`           | `edad`          | Actualizar edad                 |
| `tlf`            | `tlf`           | Actualizar teléfono             |
| `Preparatoria`   | `grupos[]`      | Agregar a grupos si TRUE        |
| `Teoria Musical` | `grupos[]`      | Agregar a grupos si TRUE        |
| `Coro`           | `grupos[]`      | Agregar a grupos si TRUE        |
| `Orquesta`       | `grupos[]`      | Agregar a grupos si TRUE        |
| `InstrumentoID`  | `instrumentoId` | Agregar ID de instrumento       |

## 🔍 Lógica de búsqueda

El script busca estudiantes en este orden:

1. **Coincidencia exacta** por nombre
2. **Coincidencia por instrumentoId** (si existe)
3. **Coincidencia parcial** por similitud de nombre (al menos 60%)

## 📁 Archivos generados

- `migration-analysis-report.json` - Reporte detallado del análisis
- Logs en consola con el progreso y resultados

## ⚠️ Consideraciones importantes

1. **SIEMPRE ejecuta el análisis primero**
2. **Revisa el reporte antes de la migración**
3. **Haz backup de tu base de datos**
4. **El script agrega un campo `updatedFromCSV: true`** para identificar registros actualizados
5. **Se agrega `lastUpdated`** con timestamp de la actualización

## 🚀 Ejecución segura

```bash
# 1. Análisis (seguro, no modifica datos)
npm run migrate:analyze-csv

# 2. Revisar reporte generado
# migration-analysis-report.json

# 3. Si todo está correcto, ejecutar migración
npm run migrate:students-csv
```
