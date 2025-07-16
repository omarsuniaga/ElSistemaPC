// Script Node.js para migración de observaciones
// Ejecutar con: node migrate-observations-node.js

import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, doc, setDoc, writeBatch } from 'firebase/firestore';

// Importar configuración de Firebase desde tu proyecto
// Ajusta la ruta según tu estructura
const firebaseConfig = {
  apiKey: process.env.VITE_APP_API_KEY,
  authDomain: process.env.VITE_APP_AUTH_DOMAIN,
  projectId: process.env.VITE_APP_PROJECT_ID,
  storageBucket: process.env.VITE_APP_STORAGE_BUCKET,
  messagingSenderId: process.env.VITE_APP_MESSAGING_SENDER_ID,
  appId: process.env.VITE_APP_APP_ID,
};

// Inicializar Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Estructura unificada para observaciones
const UNIFIED_COLLECTION = 'OBSERVACIONES_UNIFICADAS';

class ObservationsMigrator {
  constructor() {
    this.stats = {
      asistencias: 0,
      observaciones: 0,
      observacionesClase: 0,
      migrated: 0,
      errors: 0,
      duplicates: 0,
    };
    this.allObservations = [];
  }

  // Función para normalizar fechas
  normalizeDate(dateInput) {
    if (!dateInput) {
      const now = new Date();
      return {
        date: now.toISOString().split('T')[0],
        fecha: now.toISOString().split('T')[0].replace(/-/g, ''),
      };
    }

    let dateStr = '';
    if (typeof dateInput === 'string') {
      if (/^\d{8}$/.test(dateInput)) {
        // YYYYMMDD -> YYYY-MM-DD
        dateStr = `${dateInput.substring(0, 4)}-${dateInput.substring(4, 6)}-${dateInput.substring(6, 8)}`;
      } else if (/^\d{4}-\d{2}-\d{2}$/.test(dateInput)) {
        dateStr = dateInput;
      } else {
        dateStr = new Date(dateInput).toISOString().split('T')[0];
      }
    } else if (dateInput.toDate) {
      // Firebase Timestamp
      dateStr = dateInput.toDate().toISOString().split('T')[0];
    } else {
      dateStr = new Date(dateInput).toISOString().split('T')[0];
    }

    return {
      date: dateStr,
      fecha: dateStr.replace(/-/g, ''),
    };
  }

  // Generar ID único
  generateId(prefix = 'obs') {
    return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Procesar observaciones de ASISTENCIAS
  async processAsistencias() {
    console.log('📥 Procesando ASISTENCIAS...');

    try {
      const snapshot = await getDocs(collection(db, 'ASISTENCIAS'));

      snapshot.forEach((docSnapshot) => {
        const data = docSnapshot.data();
        const observaciones = data.data?.observación || data.data?.observations || [];

        if (Array.isArray(observaciones) && observaciones.length > 0) {
          observaciones.forEach((obs, index) => {
            try {
              const normalizedDates = this.normalizeDate(obs.fecha || obs.date || data.fecha);

              const unifiedObs = {
                id: obs.id || this.generateId('asist'),
                source: 'ASISTENCIAS',
                originalDocId: docSnapshot.id,

                // Campos principales
                classId: obs.classId || data.classId || '',
                text: obs.text || obs.observacion || obs.content?.text || '',
                author: obs.author || obs.authorName || 'Sistema',
                authorId: obs.authorId || data.teacherId || data.uid || '',
                ...normalizedDates,

                // Metadatos
                type: obs.type || 'general',
                priority: obs.priority || 'media',
                requiresFollowUp: obs.requiresFollowUp || false,

                // Estudiantes
                taggedStudents: obs.taggedStudents || [],
                studentId: obs.studentId,
                studentName: obs.studentName,

                // Contenido
                content: {
                  text: obs.text || obs.observacion || '',
                  images: obs.images || [],
                  attachments: obs.attachments || [],
                },

                // Timestamps
                createdAt: obs.createdAt || new Date(),
                updatedAt: obs.updatedAt || new Date(),
                migratedAt: new Date(),
              };

              this.allObservations.push(unifiedObs);
              this.stats.asistencias++;
            } catch (error) {
              console.error(`❌ Error procesando observación ${index} de ${docSnapshot.id}:`, error);
              this.stats.errors++;
            }
          });
        }
      });

      console.log(`✅ ${this.stats.asistencias} observaciones de ASISTENCIAS procesadas`);
    } catch (error) {
      console.error('❌ Error procesando ASISTENCIAS:', error);
      this.stats.errors++;
    }
  }

  // Procesar observaciones de OBSERVACIONES
  async processObservaciones() {
    console.log('📥 Procesando OBSERVACIONES...');

    try {
      const snapshot = await getDocs(collection(db, 'OBSERVACIONES'));

      snapshot.forEach((docSnapshot) => {
        try {
          const data = docSnapshot.data();
          const normalizedDates = this.normalizeDate(data.fecha || data.date);

          const unifiedObs = {
            id: docSnapshot.id,
            source: 'OBSERVACIONES',
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
              attachments: data.content?.attachments || [],
            },

            createdAt: data.createdAt || new Date(),
            updatedAt: data.updatedAt || new Date(),
            migratedAt: new Date(),
          };

          this.allObservations.push(unifiedObs);
          this.stats.observaciones++;
        } catch (error) {
          console.error(`❌ Error procesando observación ${docSnapshot.id}:`, error);
          this.stats.errors++;
        }
      });

      console.log(`✅ ${this.stats.observaciones} observaciones de OBSERVACIONES procesadas`);
    } catch (error) {
      console.error('❌ Error procesando OBSERVACIONES:', error);
      this.stats.errors++;
    }
  }

  // Procesar observaciones de OBSERVACIONES_CLASE
  async processObservacionesClase() {
    console.log('📥 Procesando OBSERVACIONES_CLASE...');

    try {
      const snapshot = await getDocs(collection(db, 'OBSERVACIONES_CLASE'));

      snapshot.forEach((docSnapshot) => {
        try {
          const data = docSnapshot.data();
          const normalizedDates = this.normalizeDate(data.date);

          const unifiedObs = {
            id: data.id || docSnapshot.id,
            source: 'OBSERVACIONES_CLASE',
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
              text: data.text || '',
            },

            createdAt: data.createdAt || new Date(),
            updatedAt: new Date(),
            timestamp: data.timestamp,
            migratedAt: new Date(),
          };

          this.allObservations.push(unifiedObs);
          this.stats.observacionesClase++;
        } catch (error) {
          console.error(`❌ Error procesando observación clase ${docSnapshot.id}:`, error);
          this.stats.errors++;
        }
      });

      console.log(
        `✅ ${this.stats.observacionesClase} observaciones de OBSERVACIONES_CLASE procesadas`,
      );
    } catch (error) {
      console.error('❌ Error procesando OBSERVACIONES_CLASE:', error);
      this.stats.errors++;
    }
  }

  // Eliminar duplicados
  deduplicateObservations() {
    console.log('🧹 Eliminando duplicados...');

    const seen = new Set();
    const deduplicated = [];

    for (const obs of this.allObservations) {
      const key = `${obs.classId}_${obs.text}_${obs.date}_${obs.authorId}`;

      if (seen.has(key)) {
        this.stats.duplicates++;
      } else {
        seen.add(key);
        deduplicated.push(obs);
      }
    }

    this.allObservations = deduplicated;
    console.log(`✅ ${this.stats.duplicates} duplicados eliminados`);
  }

  // Migrar a colección unificada
  async migrateToFirestore() {
    console.log(`💾 Migrando ${this.allObservations.length} observaciones...`);

    const batchSize = 500;
    let processed = 0;

    while (processed < this.allObservations.length) {
      const batch = writeBatch(db);
      const batchItems = this.allObservations.slice(processed, processed + batchSize);

      for (const obs of batchItems) {
        const docRef = doc(db, UNIFIED_COLLECTION, obs.id);
        batch.set(docRef, obs);
      }

      await batch.commit();
      processed += batchItems.length;
      this.stats.migrated += batchItems.length;

      console.log(`📦 Migradas ${processed}/${this.allObservations.length} observaciones`);
    }

    console.log('✅ Migración a Firestore completada');
  }

  // Generar reporte final
  generateReport() {
    console.log('\n📊 REPORTE DE MIGRACIÓN');
    console.log('================================');
    console.log(`🗃️  ASISTENCIAS:          ${this.stats.asistencias}`);
    console.log(`📝 OBSERVACIONES:         ${this.stats.observaciones}`);
    console.log(`🏫 OBSERVACIONES_CLASE:   ${this.stats.observacionesClase}`);
    console.log(`🔄 Duplicados eliminados: ${this.stats.duplicates}`);
    console.log(`❌ Errores:               ${this.stats.errors}`);
    console.log(`✅ Migradas exitosamente: ${this.stats.migrated}`);
    console.log(`📂 Colección destino:     ${UNIFIED_COLLECTION}`);
    console.log('================================');

    if (this.allObservations.length > 0) {
      console.log('\n📋 EJEMPLOS:');
      this.allObservations.slice(0, 2).forEach((obs, i) => {
        console.log(`\n${i + 1}. ${obs.id}`);
        console.log(`   📁 ${obs.source}`);
        console.log(`   🏫 Clase: ${obs.classId}`);
        console.log(`   📝 ${obs.text.substring(0, 60)}...`);
        console.log(`   👤 ${obs.author} (${obs.date})`);
      });
    }
  }

  // Ejecutar migración completa
  async run() {
    console.log('🚀 INICIANDO MIGRACIÓN DE OBSERVACIONES');
    console.log('=========================================\n');

    try {
      await this.processAsistencias();
      await this.processObservaciones();
      await this.processObservacionesClase();

      this.deduplicateObservations();
      await this.migrateToFirestore();

      this.generateReport();

      console.log('\n🎉 ¡MIGRACIÓN COMPLETADA EXITOSAMENTE!');
    } catch (error) {
      console.error('\n❌ ERROR DURANTE LA MIGRACIÓN:', error);
    }
  }
}

// Función principal
async function main() {
  const migrator = new ObservationsMigrator();
  await migrator.run();
}

// Ejecutar
main().catch(console.error);
