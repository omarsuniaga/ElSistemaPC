
import { provide, inject, InjectionKey } from 'vue';
import { useTheme } from './useTheme';

// Definimos una interfaz para el contexto que queremos proveer.
// Esto asegura que el tipo de 'theme' sea consistente.
interface ThemeContext {
  theme: ReturnType<typeof useTheme>;
}

// Creamos un InjectionKey único para nuestro contexto de tema.
// Usar un Symbol previene colisiones con otras claves de inyección.
export const ThemeSymbol: InjectionKey<ThemeContext> = Symbol('ThemeContext');

/**
 * Provee el contexto del tema a los componentes descendientes.
 * Debe ser llamado en un componente ancestro, como App.vue.
 * @returns El objeto de tema que se ha proveído.
 */
export function provideTheme() {
  // Obtenemos la instancia del tema usando nuestro composable principal.
  const theme = useTheme();
  
  // Proveemos el objeto 'theme' usando el Symbol que definimos.
  // Ahora, cualquier componente hijo puede inyectar este contexto.
  provide(ThemeSymbol, { theme });
  
  // Devolvemos el tema para que el componente que lo provee también pueda usarlo.
  return theme;
}

/**
 * Inyecta y consume el contexto del tema.
 * Lanza un error si se usa fuera de un componente que ha llamado a provideTheme.
 * @returns El objeto de tema proveído por un ancestro.
 */
export function useThemeContext() {
  // Intentamos inyectar el contexto usando nuestro Symbol.
  const context = inject(ThemeSymbol);
  
  // Si el contexto no se encuentra, significa que no hay un proveedor en el árbol de ancestros.
  // Lanzamos un error claro para facilitar la depuración.
  if (!context) {
    throw new Error('useThemeContext debe usarse dentro de un componente que tenga provideTheme');
  }
  
  // Devolvemos el objeto de tema del contexto.
  return context.theme;
}
