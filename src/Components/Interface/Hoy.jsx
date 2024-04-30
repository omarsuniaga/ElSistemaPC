const obtenerFechaActual = () => {
    const fecha = new Date();
    const opciones = { month: 'long', day: 'numeric' };
    const formatoLocal = new Intl.DateTimeFormat('es-ES', opciones).format(fecha);
    return `Hoy ${formatoLocal}`;
  };
  
  export default function MostrarFecha() {
    const fechaActual = obtenerFechaActual(); // "Hoy 27 de abril"
  
    return (
      <Text>{fechaActual}</Text>
    );
  }
  