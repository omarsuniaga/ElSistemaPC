import { computed, ref } from 'vue';
import { useMontajeStore } from '../store/montaje';
import { EstadoCompass, TipoInstrumento } from '../types/montaje';

export function useMontajeAnalyticsMaestro() {
  const montajeStore = useMontajeStore();

  // Promedio general del montaje de la obra (ya calculado en el store)
  const promedioGeneralObra = computed(() => montajeStore.obraActual?.metadatos?.progresoPorcentaje || 0);

  // Áreas trabajadas por el maestro
  const areasTrabajadas = computed(() => {
    const trabajadas: {
      compas: number;
      estado: EstadoCompass;
      instrumento: TipoInstrumento;
    }[] = [];

    if (montajeStore.obraActual && montajeStore.estadosCompases.size > 0) {
      montajeStore.estadosCompases.forEach((estadoDetalle, compasNum) => {
        // Iterar sobre los instrumentos para ver cuáles han sido trabajados
        for (const instrumento in estadoDetalle.instrumentos) {
          const estadoInstrumento = estadoDetalle.instrumentos[instrumento as TipoInstrumento];
          if (
            estadoInstrumento === EstadoCompass.LOGRADO ||
            estadoInstrumento === EstadoCompass.DOMINADO ||
            estadoInstrumento === EstadoCompass.COMPLETADO
          ) {
            trabajadas.push({
              compas: compasNum,
              estado: estadoInstrumento,
              instrumento: instrumento as TipoInstrumento,
            });
          }
        }
      });
    }
    return trabajadas;
  });

  // Compases con dificultad
  const compasesConDificultad = computed(() => {
    const dificultades: {
      compas: number;
      instrumento: TipoInstrumento;
      observaciones: string[];
    }[] = [];

    if (montajeStore.obraActual && montajeStore.estadosCompases.size > 0) {
      montajeStore.estadosCompases.forEach((estadoDetalle, compasNum) => {
        for (const instrumento in estadoDetalle.instrumentos) {
          const estadoInstrumento = estadoDetalle.instrumentos[instrumento as TipoInstrumento];
          if (estadoInstrumento === EstadoCompass.CON_DIFICULTAD) {
            dificultades.push({
              compas: compasNum,
              instrumento: instrumento as TipoInstrumento,
              observaciones: estadoDetalle.observaciones,
            });
          }
        }
      });
    }
    return dificultades;
  });

  return {
    promedioGeneralObra,
    areasTrabajadas,
    compasesConDificultad,
  };
}