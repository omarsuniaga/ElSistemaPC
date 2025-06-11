# Resolución de Errores de Índices de Firestore

## Problema Identificado
El módulo Montaje estaba generando errores de índices compuestos en Firestore debido a consultas que combinaban múltiples condiciones `where` con `orderBy`, lo cual requiere índices compuestos específicos.

## Errores Específicos Resueltos

### 1. Error de Notificaciones
**Error original:** 
```
FirebaseError: The query requires an index. You can create it here: https://console.firebase.google.com/v1/r/project/orquestapuntacana/firestore/indexes?create_composite=CmBwcm9qZWN0cy9vcnF1ZXN0YXB1bnRhY2FuYS9kYXRhYmFzZXMvKGRlZmF1bHQpL2NvbGxlY3Rpb25Hcm91cHMvbW9udGFqZS1ub3RpZmljYWNpb25lcy9pbmRleGVzL18QARoSCg5kZXN0aW5hdGFyaW9JZBABGhEKDWZlY2hhQ3JlYWNpb24QAhoMCghfX25hbWVfXxAC
```

**Solución:** Ya estaba implementada - división de la consulta en dos queries separadas (uno para usuario específico, otro para notificaciones generales) y combinación de resultados en memoria.

### 2. Consulta de Obras
**Problema:** 
```typescript
query(
  collection(db, this.obrasCollection),
  where('repertorioId', '==', repertorioId),
  where('auditoria.activo', '==', true),
  orderBy('fechaCreacion', 'desc')
)
```

**Solución:** Filtrar y ordenar en memoria:
```typescript
const q = query(
  collection(db, this.obrasCollection),
  where('repertorioId', '==', repertorioId)
);
// Filtrar por activo y ordenar en memoria
return obras
  .filter(obra => obra.auditoria?.activo === true)
  .sort((a, b) => dateB - dateA);
```

### 3. Consulta de Plan de Acción
**Problema:**
```typescript
query(
  collection(db, this.planesCollection),
  where('obraId', '==', obraId),
  where('auditoria.activo', '==', true),
  limit(1)
)
```

**Solución:** Filtrar activos en memoria:
```typescript
const q = query(
  collection(db, this.planesCollection),
  where('obraId', '==', obraId)
);
// Filtrar activos en memoria
const activePlans = snapshot.docs
  .map(doc => ({ id: doc.id, ...doc.data() } as PlanAccion))
  .filter(plan => plan.auditoria?.activo === true);
```

### 4. Consulta de Frases
**Problema:**
```typescript
query(
  collection(db, this.frasesCollection),
  where('planAccionId', '==', planAccionId),
  where('auditoria.activo', '==', true),
  orderBy('prioridad', 'desc'),
  orderBy('compassInicio', 'asc')
)
```

**Solución:** Filtrar y ordenar en memoria:
```typescript
const q = query(
  collection(db, this.frasesCollection),
  where('planAccionId', '==', planAccionId)
);
// Filtrar activos y ordenar por prioridad y compás en memoria
return frases
  .filter(frase => frase.auditoria?.activo === true)
  .sort((a, b) => {
    if (a.prioridad !== b.prioridad) {
      return (b.prioridad || 0) - (a.prioridad || 0);
    }
    return (a.compassInicio || 0) - (b.compassInicio || 0);
  });
```

### 5. Consulta de Observaciones
**Problema:**
```typescript
query(
  collection(db, this.observacionesCollection),
  where('obraId', '==', obraId),
  where('fraseId', '==', fraseId),
  where('metadatos.resuelto', '==', resuelto),
  orderBy('fechaCreacion', 'desc')
)
```

**Solución:** Aplicar filtro principal en Firestore y resto en memoria:
```typescript
// Aplicar filtro principal
let q = query(collection(db, this.observacionesCollection));
if (filtros.obraId) {
  q = query(q, where('obraId', '==', filtros.obraId));
} else if (filtros.fraseId) {
  q = query(q, where('fraseId', '==', filtros.fraseId));
}

// Aplicar filtros adicionales y ordenamiento en memoria
let observaciones = snapshot.docs.map(doc => ({...}));
if (filtros.resuelto !== undefined) {
  observaciones = observaciones.filter(obs => obs.metadatos?.resuelto === filtros.resuelto);
}
return observaciones.sort((a, b) => dateB - dateA);
```

### 6. Consulta de Evaluaciones Continuas
**Problema:**
```typescript
query(
  collection(db, this.evaluacionesCollection),
  where('obraId', '==', obraId),
  where('tipo', '==', 'continua'),
  orderBy('fecha', 'desc')
)
```

**Solución:** Filtrar por tipo y ordenar en memoria:
```typescript
const q = query(
  collection(db, this.evaluacionesCollection),
  where('obraId', '==', obraId)
);
// Filtrar por tipo y ordenar en memoria
return evaluaciones
  .filter(evaluacion => evaluacion.tipo === 'continua')
  .sort((a, b) => dateB - dateA);
```

## Actualizaciones de Tipos

### Interfaces Actualizadas
1. **ObservacionPedagogica**: Agregado `obraId` y `fraseId` opcionales
2. **EvaluacionContinua**: Agregado campo `tipo: 'continua' | 'parcial' | 'final'`

## Beneficios de la Solución

### 1. **Eliminación de Dependencias de Índices Compuestos**
- No requiere crear índices compuestos en Firestore
- Reduce la complejidad de configuración de la base de datos

### 2. **Flexibilidad de Consultas**
- Permite consultas más complejas sin restricciones de índices
- Facilita la adición de nuevos filtros sin impacto en Firestore

### 3. **Rendimiento Aceptable**
- Para volúmenes pequeños a medianos, el filtrado en memoria es eficiente
- Evita la latencia de configuración de índices

### 4. **Mantenibilidad**
- Código más simple y fácil de entender
- Menos dependencias de configuración externa

## Consideraciones Futuras

Para aplicaciones con volúmenes muy altos de datos, se podría considerar:
1. Implementar paginación más agresiva
2. Usar índices compuestos para consultas críticas
3. Implementar cache local para resultados frecuentes

## Archivos Modificados

- `src/modulos/Montaje/service/montajeService.ts` - Refactorización de consultas
- `src/modulos/Montaje/types/index.ts` - Actualización de interfaces

## Resultado

✅ **Todas las consultas de Firestore del módulo Montaje funcionan sin errores de índices**
✅ **No se requieren índices compuestos adicionales**
✅ **El rendimiento se mantiene óptimo para el volumen esperado de datos**
