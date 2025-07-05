# Manual de Correcciones de Imports

Este archivo contiene las correcciones manuales recomendadas.

## 1. src\modulos\Montaje\tests\useHeatmapTracking.test.ts

### ../composables/useHeatmapTracking

**Estrategia recomendada:** static
**Razón:** Mejor rendimiento inicial

**Acción:** Eliminar o comentar imports dinámicos en líneas 253

```typescript
// Cambiar: const module = await import('../composables/useHeatmapTracking')
// Por: import { ... } from '../composables/useHeatmapTracking'
```

## 2. src\modulos\Classes\service\classes.ts

### firebase/firestore

**Estrategia recomendada:** static
**Razón:** Mejor rendimiento inicial

**Acción:** Eliminar o comentar imports dinámicos en líneas 725

```typescript
// Cambiar: const module = await import('firebase/firestore')
// Por: import { ... } from 'firebase/firestore'
```
