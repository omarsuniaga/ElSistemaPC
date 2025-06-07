# Music Academy App

Aplicación para la gestión de una academia de música.

## Características

- Gestión de asistencia
- Observaciones de clase
- Justificaciones de ausencia
- Gestión de estudiantes
- Gestión de clases
- Gestión de profesores

## Requisitos

- Node.js 16.x o superior
- npm 7.x o superior
- Firebase account

## Configuración

1. Clona el repositorio:
```bash
git clone https://github.com/your-username/music-academy-app.git
cd music-academy-app
```

2. Instala las dependencias:
```bash
npm install
```

3. Configura las variables de entorno:
   - Copia el archivo `.env.example` a `.env`
   - Actualiza las variables con tus credenciales de Firebase

4. Inicia el servidor de desarrollo:
```bash
npm run dev
```

## Estructura del Proyecto

```
src/
  ├── modulos/
  │   ├── Attendance/
  │   │   ├── components/
  │   │   ├── services/
  │   │   ├── store/
  │   │   └── types/
  │   ├── Classes/
  │   ├── Students/
  │   └── Teachers/
  ├── stores/
  ├── firebase/
  └── App.vue
```

## Características de Asistencia

### Observaciones de Clase
- Tipos de observaciones: general, comportamiento, logro, contenido, dinámica
- Formato enriquecido con viñetas, estudiantes etiquetados, obras y dinámicas
- Prioridad y seguimiento
- Notificaciones a profesores

### Justificaciones
- Límite de tiempo de 48 horas
- Documentos de respaldo
- Estados: pendiente, aprobada, rechazada
- Seguimiento de aprobaciones

## Contribución

1. Fork el repositorio
2. Crea una rama para tu feature (`git checkout -b feature/amazing-feature`)
3. Commit tus cambios (`git commit -m 'Add some amazing feature'`)
4. Push a la rama (`git push origin feature/amazing-feature`)
5. Abre un Pull Request

## Licencia

Este proyecto está bajo la Licencia MIT - ver el archivo [LICENSE](LICENSE) para más detalles.
