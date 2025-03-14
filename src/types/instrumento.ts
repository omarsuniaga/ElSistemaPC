// types/instrument.ts

/**
 * Define los nombres válidos para las familias de instrumentos.
 * Se incluye uniones conocidas y se permite cualquier otro valor de tipo string.
 */
export type InstrumentFamilyName =
  | 'cuerdas'
  | 'maderas'
  | 'metales'
  | 'percusion'
  | 'coro'
  | string;

/**
 * Representa un instrumento individual.
 */
export interface Instrument {
  id?: string;       // Opcional si se usa para selección o creación.
  nombre: string;    // Nombre del instrumento.
  familia: InstrumentFamilyName; // Familia a la que pertenece.
}

/**
 * Representa un diccionario de opciones de instrumentos, agrupados por familia.
 * Ejemplo: { cuerdas: ['violín', 'viola'], percusion: ['batería', 'conga'] }
 */
export interface InstrumentOptions {
  [family: string]: string[];
}

/**
 * Define el estado para gestionar instrumentos en un store.
 */
export interface InstrumentState {
  familias: InstrumentOptions;
  loading: boolean;
  error: string | null;
}
