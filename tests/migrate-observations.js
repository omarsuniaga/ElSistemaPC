// Script de migración y unificación de observaciones
// Recolecta observaciones de ASISTENCIAS, OBSERVACIONES y OBSERVACIONES_CLASE
// y las unifica en una estructura consistente

import { initializeApp } from 'firebase/app';
import { 
  getFirestore, 
  collection, 
  getDocs, 
  doc, 
  setDoc, 
  writeBatch,
  query,
  orderBy 
} from 'firebase/firestore';

// Configuración de Firebase (ajusta según tu configuración)
const firebaseConfig = {
  // Coloca aquí tu configuración de Firebase
  // O importa desde tu archivo de configuración existente
};

// Inicializar Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Estructura unificada para observaciones
interface UnifiedObservation {
  id: string;
  originalSource: 'ASISTENCIAS' | 'OBSERVACIONES' | 'OBSERVACIONES_CLASE';
  originalDocId?: string;
  
  // Campos principales
  classId: string;
  text: string;
  author: string;
  authorId: string;
  date: string;  // Formato YYYY-MM-DD
  fecha: string; // Formato YYYYMMDD para compatibilidad
  
  // Campos opcionales
  type?: 'general' | 'positive' | 'negative' | 'neutral';
  priority?: 'baja' | 'media' | 'alta';
  requiresFollowUp?: boolean;
  
  // Estudiantes etiquetados
  taggedStudents?: string[];
  studentId?: string;
  studentName?: string;
  
  // Contenido estructurado
  content?: {
    text?: string;
    images?: string[];
    attachments?: string[];
  };
  
  // Metadatos
  createdAt: Date;
  updatedAt: Date;
  timestamp?: number;
}

// Función para normalizar fechas
function normalizeDate(dateInput: any): { date: string; fecha: string } {
  let dateObj: Date;
  
  if (!dateInput) {
    dateObj = new Date();
  } else if (typeof dateInput === 'string') {
    if (/^\d{8}$/.test(dateInput)) {
      // Formato YYYYMMDD
      const year = dateInput.substring(0, 4);
      const month = dateInput.substring(4, 6);
      const day = dateInput.substring(6, 8);
      dateObj = new Date(`${year}-${month}-${day}`);
    } else if (/^\d{4}-\d{2}-\d{2}$/.test(dateInput)) {
      // Formato YYYY-MM-DD
      dateObj = new Date(dateInput);
    } else {
      dateObj = new Date(dateInput);
    }
  } else if (dateInput.toDate && typeof dateInput.toDate === 'function') {
    // Firebase Timestamp
    dateObj = dateInput.toDate();
  } else if (dateInput instanceof Date) {
    dateObj = dateInput;
  } else {
    dateObj = new Date();
  }
  
  const year = dateObj.getFullYear();
  const month = String(dateObj.getMonth() + 1).padStart(2, '0');
  const day = String(dateObj.getDate()).padStart(2, '0');
  
  return {
    date: `${year}-${month}-${day}`,
    fecha: `${year}${month}${day}`
  };
}

// Función para generar ID único
function generateObservationId(): string {
  return `obs_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

class ObservationMigrator {
  private unifiedObservations: UnifiedObservation[] = [];
  private stats = {
    asistencias: 0,
    observaciones: 0,
    observacionesClase: 0,
    duplicates: 0,
    errors: 0
  };

  // Recoger observaciones de ASISTENCIAS.data.observación
  async collectFromAsistencias(): Promise<void> {
    console.log('🔍 Recolectando observaciones de ASISTENCIAS...');
    
    try {
      const querySnapshot = await getDocs(collection(db, 'ASISTENCIAS'));
      
      querySnapshot.forEach((docSnapshot) => {
        const data = docSnapshot.data();
        const observaciones = data.data?.observación || data.data?.observations || [];
        
        if (Array.isArray(observaciones) && observaciones.length > 0) {
          observaciones.forEach((obs: any, index: number) => {
            try {
              const normalizedDates = normalizeDate(obs.fecha || obs.date || data.fecha);
              
              const unifiedObs: UnifiedObservation = {
                id: obs.id || generateObservationId(),
                originalSource: 'ASISTENCIAS',
                originalDocId: docSnapshot.id,
                
                classId: obs.classId || data.classId || '',
                text: obs.text || obs.observacion || obs.content?.text || '',
                author: obs.author || obs.authorName || 'Sistema',
                authorId: obs.authorId || data.teacherId || data.uid || '',
                ...normalizedDates,
                
                type: obs.type || 'general',
                priority: obs.priority || 'media',
                requiresFollowUp: obs.requiresFollowUp || false,
                
                taggedStudents: obs.taggedStudents || [],
                studentId: obs.studentId,
                studentName: obs.studentName,
                
                content: {
                  text: obs.text || obs.observacion || '',
                  images: obs.images || [],
                  attachments: obs.attachments || []
                },
                
                createdAt: obs.createdAt?.toDate ? obs.createdAt.toDate() : new Date(obs.createdAt || Date.now()),
                updatedAt: obs.updatedAt?.toDate ? obs.updatedAt.toDate() : new Date(obs.updatedAt || Date.now()),
                timestamp: obs.timestamp || Date.now()
              };
              
              this.unifiedObservations.push(unifiedObs);
              this.stats.asistencias++;
              
            } catch (error) {
              console.error(`Error procesando observación de ASISTENCIAS ${docSnapshot.id}[${index}]:`, error);
              this.stats.errors++;
            }
          });
        }
      });
      
      console.log(`✅ Recolectadas ${this.stats.asistencias} observaciones de ASISTENCIAS`);
      
    } catch (error) {
      console.error('❌ Error recolectando de ASISTENCIAS:', error);
    }
  }

  // Recoger observaciones de OBSERVACIONES
  async collectFromObservaciones(): Promise<void> {
    console.log('🔍 Recolectando observaciones de OBSERVACIONES...');
    
    try {
      const querySnapshot = await getDocs(collection(db, 'OBSERVACIONES'));
      
      querySnapshot.forEach((docSnapshot) => {
        try {
          const data = docSnapshot.data();
          const normalizedDates = normalizeDate(data.fecha || data.date);
          
          const unifiedObs: UnifiedObservation = {
            id: docSnapshot.id,
            originalSource: 'OBSERVACIONES',
            originalDocId: docSnapshot.id,
            
            classId: data.classId || '',
            text: data.text || '',
            author: data.author || 'Sistema',
            authorId: data.authorId || '',
            ...normalizedDates,
            
            type: data.type || 'general',
            priority: data.priority || 'media',
            requiresFollowUp: data.requiresFollowUp || false,
            
            taggedStudents: data.taggedStudents || [],
            
            content: {
              text: data.text || '',
              images: data.content?.images || [],
              attachments: data.content?.attachments || []
            },
            
            createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date(data.createdAt || Date.now()),
            updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate() : new Date(data.updatedAt || Date.now())
          };
          
          this.unifiedObservations.push(unifiedObs);
          this.stats.observaciones++;
          
        } catch (error) {
          console.error(`Error procesando observación de OBSERVACIONES ${docSnapshot.id}:`, error);
          this.stats.errors++;
        }
      });
      
      console.log(`✅ Recolectadas ${this.stats.observaciones} observaciones de OBSERVACIONES`);
      
    } catch (error) {
      console.error('❌ Error recolectando de OBSERVACIONES:', error);
    }
  }

  // Recoger observaciones de OBSERVACIONES_CLASE
  async collectFromObservacionesClase(): Promise<void> {
    console.log('🔍 Recolectando observaciones de OBSERVACIONES_CLASE...');
    
    try {
      const querySnapshot = await getDocs(collection(db, 'OBSERVACIONES_CLASE'));
      
      querySnapshot.forEach((docSnapshot) => {
        try {
          const data = docSnapshot.data();
          const normalizedDates = normalizeDate(data.date);
          
          const unifiedObs: UnifiedObservation = {
            id: data.id || docSnapshot.id,
            originalSource: 'OBSERVACIONES_CLASE',
            originalDocId: docSnapshot.id,
            
            classId: data.classId || '',
            text: data.text || '',
            author: data.author || 'Sistema',
            authorId: data.authorId || '',
            ...normalizedDates,
            
            type: 'general',
            priority: 'media',
            requiresFollowUp: false,
            
            content: {
              text: data.text || ''
            },
            
            createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date(data.createdAt || Date.now()),
            updatedAt: new Date(),
            timestamp: data.timestamp || Date.now()
          };
          
          this.unifiedObservations.push(unifiedObs);
          this.stats.observacionesClase++;
          
        } catch (error) {
          console.error(`Error procesando observación de OBSERVACIONES_CLASE ${docSnapshot.id}:`, error);
          this.stats.errors++;
        }
      });
      
      console.log(`✅ Recolectadas ${this.stats.observacionesClase} observaciones de OBSERVACIONES_CLASE`);
      
    } catch (error) {
      console.error('❌ Error recolectando de OBSERVACIONES_CLASE:', error);
    }
  }

  // Depurar duplicados
  deduplicateObservations(): void {
    console.log('🧹 Eliminando duplicados...');
    
    const seen = new Set<string>();
    const deduplicated: UnifiedObservation[] = [];
    
    for (const obs of this.unifiedObservations) {
      // Crear una clave única basada en contenido principal
      const key = `${obs.classId}_${obs.text}_${obs.date}_${obs.authorId}`;
      
      if (seen.has(key)) {
        this.stats.duplicates++;
        console.log(`🔄 Duplicado encontrado: ${obs.id} (${obs.originalSource})`);
      } else {
        seen.add(key);
        deduplicated.push(obs);
      }
    }
    
    this.unifiedObservations = deduplicated;
    console.log(`✅ Eliminados ${this.stats.duplicates} duplicados`);
  }

  // Migrar a nueva colección OBSERVACIONES_UNIFICADAS
  async migrateToUnifiedCollection(): Promise<void> {
    console.log('🚀 Migrando a colección OBSERVACIONES_UNIFICADAS...');
    
    const batch = writeBatch(db);
    let batchCount = 0;
    const batchSize = 500; // Límite de Firestore
    
    for (const obs of this.unifiedObservations) {
      const docRef = doc(db, 'OBSERVACIONES_UNIFICADAS', obs.id);
      batch.set(docRef, obs);
      batchCount++;
      
      // Ejecutar batch cuando llegue al límite
      if (batchCount >= batchSize) {
        await batch.commit();
        console.log(`📦 Batch de ${batchCount} observaciones migradas`);
        batchCount = 0;
      }
    }
    
    // Ejecutar el último batch si hay documentos pendientes
    if (batchCount > 0) {
      await batch.commit();
      console.log(`📦 Último batch de ${batchCount} observaciones migradas`);
    }
    
    console.log('✅ Migración completada');
  }

  // Generar reporte
  generateReport(): void {
    console.log('\n📊 REPORTE DE MIGRACIÓN');
    console.log('================================');
    console.log(`🗃️  ASISTENCIAS:        ${this.stats.asistencias} observaciones`);
    console.log(`📝 OBSERVACIONES:       ${this.stats.observaciones} observaciones`);
    console.log(`🏫 OBSERVACIONES_CLASE: ${this.stats.observacionesClase} observaciones`);
    console.log(`🔄 Duplicados:          ${this.stats.duplicates} eliminados`);
    console.log(`❌ Errores:             ${this.stats.errors} errores`);
    console.log(`✅ Total migrado:       ${this.unifiedObservations.length} observaciones`);
    console.log('================================\n');
    
    // Mostrar algunas observaciones de ejemplo
    if (this.unifiedObservations.length > 0) {
      console.log('📋 EJEMPLOS DE OBSERVACIONES UNIFICADAS:');
      this.unifiedObservations.slice(0, 3).forEach((obs, index) => {
        console.log(`\n${index + 1}. ID: ${obs.id}`);
        console.log(`   Fuente: ${obs.originalSource}`);
        console.log(`   Clase: ${obs.classId}`);
        console.log(`   Texto: ${obs.text.substring(0, 100)}...`);
        console.log(`   Autor: ${obs.author}`);
        console.log(`   Fecha: ${obs.date}`);
        console.log(`   Tipo: ${obs.type}`);
      });
    }
  }

  // Ejecutar migración completa
  async runMigration(): Promise<void> {
    console.log('🚀 INICIANDO MIGRACIÓN DE OBSERVACIONES');
    console.log('=========================================\n');
    
    try {
      // Recolectar de todas las fuentes
      await this.collectFromAsistencias();
      await this.collectFromObservaciones();
      await this.collectFromObservacionesClase();
      
      // Depurar duplicados
      this.deduplicateObservations();
      
      // Migrar a nueva colección
      await this.migrateToUnifiedCollection();
      
      // Generar reporte
      this.generateReport();
      
      console.log('🎉 ¡MIGRACIÓN COMPLETADA EXITOSAMENTE!');
      
    } catch (error) {
      console.error('❌ Error durante la migración:', error);
    }
  }
}

// Función principal
async function main() {
  const migrator = new ObservationMigrator();
  await migrator.runMigration();
}

// Ejecutar si es llamado directamente
if (require.main === module) {
  main().catch(console.error);
}

export { ObservationMigrator, UnifiedObservation };
