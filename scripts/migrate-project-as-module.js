#!/usr/bin/env node

/**
 * 🔧 MODULE MIGRATION TOOL
 * Herramienta para migrar un proyecto Vue completo como módulo
 */

import fs from 'fs/promises';
import path from 'path';

class ProjectModuleMigrator {
  constructor(sourceProjectPath, targetModuleName, musicAcademyPath) {
    this.sourceProjectPath = sourceProjectPath;
    this.targetModuleName = targetModuleName;
    this.musicAcademyPath = musicAcademyPath;
    this.targetModulePath = path.join(musicAcademyPath, 'src', 'modulos', targetModuleName);
  }

  /**
   * 📊 Analizar el proyecto fuente
   */
  async analyzeSourceProject() {
    console.log('🔍 Analizando proyecto fuente...');
    
    const analysis = {
      structure: {},
      dependencies: {},
      components: [],
      stores: [],
      routes: [],
      assets: [],
      styles: [],
    };

    try {
      // Analizar package.json
      const packageJsonPath = path.join(this.sourceProjectPath, 'package.json');
      const packageJson = JSON.parse(await fs.readFile(packageJsonPath, 'utf8'));
      analysis.dependencies = {
        dependencies: packageJson.dependencies || {},
        devDependencies: packageJson.devDependencies || {},
      };

      // Analizar estructura de carpetas
      analysis.structure = await this.analyzeDirectory(this.sourceProjectPath);

      // Buscar componentes Vue
      analysis.components = await this.findVueFiles(path.join(this.sourceProjectPath, 'src'));

      // Buscar stores
      analysis.stores = await this.findStoreFiles(this.sourceProjectPath);

      // Buscar archivos de rutas
      analysis.routes = await this.findRouteFiles(this.sourceProjectPath);

      console.log('✅ Análisis completado');
      return analysis;

    } catch (error) {
      console.error('❌ Error analizando proyecto:', error);
      throw error;
    }
  }

  /**
   * 📁 Crear estructura del módulo
   */
  async createModuleStructure() {
    console.log('📁 Creando estructura del módulo...');

    const folders = [
      'components',
      'views', 
      'store',
      'services',
      'composables',
      'types',
      'assets/images',
      'assets/icons', 
      'assets/styles',
      'router',
    ];

    for (const folder of folders) {
      const folderPath = path.join(this.targetModulePath, folder);
      await fs.mkdir(folderPath, { recursive: true });
      console.log(`✅ Creada carpeta: ${folder}`);
    }
  }

  /**
   * 🔄 Migrar componentes
   */
  async migrateComponents(sourceComponents) {
    console.log('🔄 Migrando componentes...');

    for (const component of sourceComponents) {
      if (this.shouldMigrateComponent(component)) {
        await this.migrateVueFile(component, 'components');
      }
    }
  }

  /**
   * 🏪 Migrar stores
   */
  async migrateStores(sourceStores) {
    console.log('🏪 Migrando stores...');

    for (const store of sourceStores) {
      await this.migrateStoreFile(store);
    }
  }

  /**
   * 🎨 Migrar assets
   */
  async migrateAssets() {
    console.log('🎨 Migrando assets...');

    const assetsSource = path.join(this.sourceProjectPath, 'src', 'assets');
    const assetsTarget = path.join(this.targetModulePath, 'assets');

    try {
      await this.copyDirectory(assetsSource, assetsTarget);
      console.log('✅ Assets migrados');
    } catch (error) {
      console.warn('⚠️ No se encontraron assets o error al migrar:', error.message);
    }
  }

  /**
   * 🛣️ Generar archivo de rutas del módulo
   */
  async generateModuleRoutes(analysis) {
    console.log('🛣️ Generando rutas del módulo...');

    const routeContent = `
import { RouteRecordRaw } from 'vue-router'

export const ${this.targetModuleName}Routes: RouteRecordRaw[] = [
  {
    path: '/${this.targetModuleName.toLowerCase()}',
    name: '${this.targetModuleName}',
    component: () => import('../views/MainView.vue'),
    meta: {
      requiresAuth: true,
      title: '${this.targetModuleName}'
    },
    children: [
      // Agregar sub-rutas aquí
    ]
  }
]
`;

    const routePath = path.join(this.targetModulePath, 'router', 'index.ts');
    await fs.writeFile(routePath, routeContent);
    console.log('✅ Archivo de rutas generado');
  }

  /**
   * 📝 Generar archivo README del módulo
   */
  async generateModuleReadme() {
    const readmeContent = `
# ${this.targetModuleName} Module

## 📋 Descripción
Módulo migrado desde proyecto independiente.

## 🏗️ Estructura
\`\`\`
${this.targetModuleName}/
├── components/     # Componentes reutilizables
├── views/         # Vistas principales
├── store/         # Estado del módulo
├── services/      # Servicios y APIs
├── types/         # Tipos TypeScript
└── router/        # Configuración de rutas
\`\`\`

## 🚀 Uso
\`\`\`typescript
// Importar componentes
import { MainComponent } from '@/modulos/${this.targetModuleName}/components'

// Usar store
import { use${this.targetModuleName}Store } from '@/modulos/${this.targetModuleName}/store'
\`\`\`

## 📦 Dependencias Añadidas
Ver las dependencias específicas que se agregaron al package.json principal.

## 🔧 Configuración
Instrucciones de configuración específica si es necesaria.
`;

    const readmePath = path.join(this.targetModulePath, 'README.md');
    await fs.writeFile(readmePath, readmeContent);
  }

  /**
   * 🔧 Funciones auxiliares
   */
  async analyzeDirectory(dirPath, depth = 0) {
    if (depth > 3) return null; // Evitar recursión infinita
    
    const items = await fs.readdir(dirPath);
    const structure = {};

    for (const item of items) {
      if (item.startsWith('.')) continue; // Ignorar archivos ocultos
      
      const itemPath = path.join(dirPath, item);
      const stat = await fs.stat(itemPath);
      
      if (stat.isDirectory()) {
        structure[item] = await this.analyzeDirectory(itemPath, depth + 1);
      } else {
        structure[item] = 'file';
      }
    }

    return structure;
  }

  async findVueFiles(dirPath) {
    const vueFiles = [];
    
    try {
      const files = await fs.readdir(dirPath, { recursive: true });
      
      for (const file of files) {
        if (file.endsWith('.vue')) {
          vueFiles.push(path.join(dirPath, file));
        }
      }
    } catch (error) {
      console.warn('⚠️ Error buscando archivos Vue:', error.message);
    }

    return vueFiles;
  }

  shouldMigrateComponent(componentPath) {
    const excludedFiles = ['App.vue', 'main.ts', 'main.js'];
    const fileName = path.basename(componentPath);
    return !excludedFiles.includes(fileName);
  }

  async migrateVueFile(sourceFile, targetFolder) {
    const fileName = path.basename(sourceFile);
    const targetPath = path.join(this.targetModulePath, targetFolder, fileName);
    
    // Leer archivo fuente
    let content = await fs.readFile(sourceFile, 'utf8');
    
    // Adaptar imports (esto necesitaría ser más sofisticado)
    content = this.adaptImports(content);
    
    // Escribir archivo adaptado
    await fs.writeFile(targetPath, content);
    console.log(`✅ Migrado: ${fileName}`);
  }

  adaptImports(content) {
    // Adaptar rutas de import para la nueva estructura
    content = content.replace(/from ['"]@\/components/g, 'from \'@/modulos/' + this.targetModuleName + '/components');
    content = content.replace(/from ['"]@\/stores/g, 'from \'@/modulos/' + this.targetModuleName + '/store');
    // Añadir más adaptaciones según necesidad
    
    return content;
  }

  async copyDirectory(source, target) {
    await fs.mkdir(target, { recursive: true });
    const files = await fs.readdir(source);

    for (const file of files) {
      const sourcePath = path.join(source, file);
      const targetPath = path.join(target, file);
      const stat = await fs.stat(sourcePath);

      if (stat.isDirectory()) {
        await this.copyDirectory(sourcePath, targetPath);
      } else {
        await fs.copyFile(sourcePath, targetPath);
      }
    }
  }

  /**
   * 🚀 Ejecutar migración completa
   */
  async migrate() {
    console.log(`🚀 Iniciando migración de proyecto a módulo: ${this.targetModuleName}`);

    try {
      // 1. Analizar proyecto fuente
      const analysis = await this.analyzeSourceProject();
      
      // 2. Crear estructura del módulo
      await this.createModuleStructure();
      
      // 3. Migrar componentes
      await this.migrateComponents(analysis.components);
      
      // 4. Migrar stores
      await this.migrateStores(analysis.stores);
      
      // 5. Migrar assets
      await this.migrateAssets();
      
      // 6. Generar rutas
      await this.generateModuleRoutes(analysis);
      
      // 7. Generar documentación
      await this.generateModuleReadme();
      
      console.log('✅ Migración completada exitosamente!');
      console.log('📋 Próximos pasos:');
      console.log('  1. Revisar y adaptar imports en los archivos migrados');
      console.log('  2. Agregar las rutas del módulo al router principal');
      console.log('  3. Instalar dependencias nuevas si es necesario');
      console.log('  4. Probar funcionalidad del módulo');

      return analysis;
      
    } catch (error) {
      console.error('❌ Error durante la migración:', error);
      throw error;
    }
  }
}

// Exportar para uso programático
export { ProjectModuleMigrator };

// Función de utilidad para uso directo
export async function migrateProjectAsModule(sourceProjectPath, targetModuleName, musicAcademyPath) {
  const migrator = new ProjectModuleMigrator(sourceProjectPath, targetModuleName, musicAcademyPath);
  return await migrator.migrate();
}
