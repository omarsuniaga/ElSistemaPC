# Firebase Firestore Indexes Required

## Módulo Montaje - Indices Requeridos

Para que el módulo Montaje funcione correctamente, se requieren los siguientes índices compuestos en Firestore:

### 1. Evaluaciones Continuas
```
Collection: montaje-evaluaciones
Fields: obraId (Ascending), tipo (Ascending), fecha (Descending)
```

### 2. Observaciones Pedagógicas (múltiples filtros)
```
Collection: montaje-observaciones
Fields: obraId (Ascending), fechaCreacion (Descending)
```

```
Collection: montaje-observaciones  
Fields: fraseId (Ascending), fechaCreacion (Descending)
```

```
Collection: montaje-observaciones
Fields: metadatos.resuelto (Ascending), fechaCreacion (Descending)
```

### 3. Obras por Repertorio
```
Collection: montaje-obras
Fields: repertorioId (Ascending), auditoria.activo (Ascending), auditoria.fechaCreacion (Descending)
```

## Cómo Crear los Índices

### Opción 1: Firebase Console
1. Ve a Firebase Console: https://console.firebase.google.com/
2. Selecciona tu proyecto: orquestapuntacana
3. Ve a Firestore Database > Indexes
4. Crea los índices compuestos listados arriba

### Opción 2: Firebase CLI
```bash
# Instalar Firebase CLI si no está instalado
npm install -g firebase-tools

# Inicializar Firestore en el proyecto
firebase init firestore

# Desplegar los índices
firebase deploy --only firestore:rules,firestore:indexes
```

### Opción 3: Configuración Automática
Los índices se crearán automáticamente cuando se ejecuten las consultas por primera vez en producción. Firebase mostrará enlaces para crear los índices faltantes.

## Estado Actual

✅ **Solucionado**: Query de notificaciones optimizado para evitar índice compuesto
⚠️ **Pendiente**: Otros queries podrían requerir índices en producción

## firestore.indexes.json

Agregar al archivo `firestore.indexes.json`:

```json
{
  "indexes": [
    {
      "collectionGroup": "montaje-evaluaciones",
      "queryScope": "COLLECTION",
      "fields": [
        {
          "fieldPath": "obraId",
          "order": "ASCENDING"
        },
        {
          "fieldPath": "tipo", 
          "order": "ASCENDING"
        },
        {
          "fieldPath": "fecha",
          "order": "DESCENDING"
        }
      ]
    },
    {
      "collectionGroup": "montaje-observaciones",
      "queryScope": "COLLECTION", 
      "fields": [
        {
          "fieldPath": "obraId",
          "order": "ASCENDING"
        },
        {
          "fieldPath": "fechaCreacion",
          "order": "DESCENDING"
        }
      ]
    },
    {
      "collectionGroup": "montaje-observaciones",
      "queryScope": "COLLECTION",
      "fields": [
        {
          "fieldPath": "fraseId", 
          "order": "ASCENDING"
        },
        {
          "fieldPath": "fechaCreacion",
          "order": "DESCENDING"
        }
      ]
    },
    {
      "collectionGroup": "montaje-observaciones",
      "queryScope": "COLLECTION",
      "fields": [
        {
          "fieldPath": "metadatos.resuelto",
          "order": "ASCENDING"
        },
        {
          "fieldPath": "fechaCreacion", 
          "order": "DESCENDING"
        }
      ]
    },
    {
      "collectionGroup": "montaje-obras",
      "queryScope": "COLLECTION",
      "fields": [
        {
          "fieldPath": "repertorioId",
          "order": "ASCENDING"
        },
        {
          "fieldPath": "auditoria.activo",
          "order": "ASCENDING"
        },
        {
          "fieldPath": "auditoria.fechaCreacion",
          "order": "DESCENDING"
        }
      ]
    }
  ]
}
```
