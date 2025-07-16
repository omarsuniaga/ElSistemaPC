// src/config/modules.ts - Configuración centralizada de módulos
import { montajeModule } from '../modulos/Montaje/integration';
import type { ModuleDefinition } from '../modulos/Montaje/core/ModuleManager';

export interface ProjectModuleConfig {
  modules: ModuleDefinition[]
  globalConfig: {
    theme: 'light' | 'dark' | 'auto'
    language: string
    timezone: string
    firebase: {
      collections: {
        users: string
        projects: string
        evaluations: string
        works: string
        sessions: string
      }
    }
  }
}

export const projectConfig: ProjectModuleConfig = {
  modules: [
    montajeModule, // ✅ Registrar módulo de montaje
  ],
  globalConfig: {
    theme: 'auto',
    language: 'es',
    timezone: 'America/Mexico_City',
    firebase: {
      collections: {
        users: 'montaje_users', // Colección de usuarios musicales
        projects: 'montaje_projects', // Proyectos/orquestas
        evaluations: 'montaje_evaluations', // Evaluaciones
        works: 'montaje_works', // Obras musicales
        sessions: 'montaje_sessions', // Sesiones de ensayo
      },
    },
  },
};

// Función para inicializar todos los módulos del proyecto
export const initializeProjectModules = (moduleManager: any, user: any) => {
  try {
    // Registrar módulos
    projectConfig.modules.forEach((module) => {
      console.log(`🎼 Registrando módulo: ${module.name}`);
      moduleManager.registerModule(module);
    });

    // Configurar usuario
    if (user) {
      moduleManager.setUser(user);
    }

    // Aplicar configuración global
    moduleManager.setGlobalConfig(projectConfig.globalConfig);

    console.log(
      '🎼 Proyecto musical inicializado con módulos:',
      projectConfig.modules.map((m) => m.name),
    );

    return true;
  } catch (error) {
    console.error('❌ Error inicializando módulos:', error);
    return false;
  }
};

export default projectConfig;
