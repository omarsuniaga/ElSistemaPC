# 📊 CUESTIONARIO PARA INTEGRACIÓN DE PROYECTO COMO MÓDULO

## 🔍 Información del Proyecto Fuente

### Estructura Básica
- [ ] ¿Cómo se llama el proyecto que quieres integrar?
- [ ] ¿Qué funcionalidad principal tiene?
- [ ] ¿Está usando Vue 3 + TypeScript como este proyecto?
- [ ] ¿Usa Pinia para state management?

### Dependencias
- [ ] ¿Qué dependencias específicas usa que no estén en este proyecto?
- [ ] ¿Usa alguna librería de UI diferente a las que ya tienes?
- [ ] ¿Tiene configuraciones específicas de build?

### Estructura de Archivos
- [ ] ¿Cuántos componentes principales tiene?
- [ ] ¿Tiene stores/state management propio?
- [ ] ¿Tiene rutas específicas?
- [ ] ¿Usa algún servicio o API específica?

### Assets y Recursos
- [ ] ¿Tiene imágenes, iconos o assets específicos?
- [ ] ¿Tiene estilos CSS/SCSS propios?
- [ ] ¿Usa alguna fuente o tema específico?

## 📁 ESTRUCTURA RECOMENDADA PARA EL MÓDULO

```
src/modulos/[NombreDelModulo]/
├── components/           # Componentes del proyecto original
│   ├── [ComponentePrincipal].vue
│   ├── [SubComponentes]/
│   └── index.ts         # Exportaciones
├── views/               # Vistas principales (ex-pages)
│   ├── [VistaPrincipal].vue
│   └── index.ts
├── store/              # Estado (ex-stores)
│   ├── [moduloStore].ts
│   └── index.ts
├── services/           # Servicios y APIs
│   ├── [moduloService].ts
│   └── index.ts
├── composables/        # Lógica reutilizable
│   ├── use[Modulo].ts
│   └── index.ts
├── types/              # Tipos TypeScript
│   ├── [modulo].types.ts
│   └── index.ts
├── assets/             # Assets específicos del módulo
│   ├── images/
│   ├── icons/
│   └── styles/
├── router/             # Rutas del módulo
│   └── index.ts
└── README.md           # Documentación del módulo
```

## 🚀 PLAN DE MIGRACIÓN PROPUESTO

### Fase 1: Preparación
1. Crear estructura de carpetas del módulo
2. Identificar dependencias nuevas
3. Mapear componentes y funcionalidades

### Fase 2: Migración de Código
1. Mover componentes manteniendo funcionalidad
2. Adaptar stores a la estructura actual
3. Integrar rutas al router principal

### Fase 3: Integración
1. Actualizar dependencias en package.json principal
2. Configurar assets y estilos
3. Probar funcionalidad completa

### Fase 4: Optimización
1. Eliminar código duplicado
2. Refactorizar para usar servicios compartidos
3. Documentar integración

## ❓ PREGUNTAS ESPECÍFICAS

Para darte la mejor estrategia, necesito que me proporciones:

1. **El nombre y propósito del proyecto**
2. **La estructura de archivos actual** (un tree o lista)
3. **Las dependencias del package.json**
4. **Capturas de pantalla o descripción de la funcionalidad**

¿Puedes compartir esta información?
