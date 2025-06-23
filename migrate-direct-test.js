const admin = require('firebase-admin');
const fs = require('fs');
const csv = require('csv-parser');

// Configurar Firebase Admin usando variables de entorno
const serviceAccount = {
  type: "service_account",
  project_id: process.env.VITE_APP_FIREBASE_PROJECT_ID,
  private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
  private_key: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  client_email: process.env.FIREBASE_CLIENT_EMAIL,
  client_id: process.env.FIREBASE_CLIENT_ID,
  auth_uri: "https://accounts.google.com/o/oauth2/auth",
  token_uri: "https://oauth2.googleapis.com/token",
  auth_provider_x509_cert_url: "https://www.googleapis.com/oauth2/v1/certs",
  client_x509_cert_url: process.env.FIREBASE_CLIENT_X509_CERT_URL
};

// Inicializar Firebase Admin
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: `https://${process.env.VITE_APP_FIREBASE_PROJECT_ID}-default-rtdb.firebaseio.com`
  });
}

const db = admin.firestore();

function normalizeString(str) {
  if (!str) return '';
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\w\s]/g, '')
    .trim();
}

function findBestMatch(searchName, students) {
  const normalizedSearch = normalizeString(searchName);
  const searchWords = normalizedSearch.split(' ').filter(word => word.length > 2);
  
  let bestMatch = null;
  let bestScore = 0;

  students.forEach(student => {
    const fullName = `${student.data.nombre || ''} ${student.data.apellido || ''}`.trim();
    const normalizedFullName = normalizeString(fullName);
    
    let score = 0;
    
    // Coincidencia exacta del nombre completo
    if (normalizedFullName === normalizedSearch) {
      score = 100;
    }
    // Coincidencia parcial - contar palabras que coinciden
    else {
      const studentWords = normalizedFullName.split(' ');
      searchWords.forEach(searchWord => {
        studentWords.forEach(studentWord => {
          if (searchWord === studentWord) {
            score += 20;
          } else if (searchWord.includes(studentWord) || studentWord.includes(searchWord)) {
            score += 10;
          }
        });
      });
    }
    
    if (score > bestScore && score > 30) {
      bestScore = score;
      bestMatch = { ...student, score };
    }
  });

  return bestMatch;
}

async function ejecutarMigracionDirecta() {
  try {
    console.log('🚀 INICIANDO MIGRACIÓN DIRECTA');
    console.log('==============================\n');

    // 1. Cargar todos los estudiantes de Firestore
    console.log('📥 Cargando estudiantes de Firestore...');
    const snapshot = await db.collection('ALUMNOS').get();
    const firestoreStudents = [];
    
    snapshot.forEach(doc => {
      firestoreStudents.push({
        id: doc.id,
        data: doc.data()
      });
    });
    
    console.log(`✅ Cargados ${firestoreStudents.length} estudiantes de Firestore\n`);

    // 2. Cargar estudiantes del CSV
    console.log('📥 Cargando estudiantes del CSV...');
    const csvStudents = [];
    const stream = fs.createReadStream('INTEGRANTES_EL_SISTEMA_PUNTA_CANA.csv')
      .pipe(csv());

    for await (const row of stream) {
      if (row.Nombre && row.Nombre.trim()) {
        csvStudents.push({
          nombre: row.Nombre.trim(),
          inscripcion: row.inscripcion?.trim(),
          nacimiento: row.nac?.trim(),
          instrumento: row.instrumento?.trim(),
          edad: parseInt(row.edad) || null,
          telefono: row.tlf?.trim(),
          instrumentoID: row.InstrumentoID?.trim()
        });
      }
    }
    
    console.log(`✅ Cargados ${csvStudents.length} estudiantes del CSV\n`);

    // 3. Procesar migración (solo primeros 10 para prueba)
    console.log('🔄 Procesando migración (primeros 10 estudiantes)...\n');
    
    let processed = 0;
    let updated = 0;
    let notFound = 0;

    for (const csvStudent of csvStudents.slice(0, 10)) {
      processed++;
      console.log(`\n--- Procesando ${processed}/10: ${csvStudent.nombre} ---`);
      
      // Buscar coincidencia
      const match = findBestMatch(csvStudent.nombre, firestoreStudents);
      
      if (match) {
        console.log(`✅ Coincidencia encontrada (score: ${match.score}):`);
        console.log(`   DB: ${match.data.nombre || ''} ${match.data.apellido || ''}`);
        
        // Preparar datos para actualizar
        const updateData = {
          updatedAt: admin.firestore.FieldValue.serverTimestamp()
        };
        
        // Solo actualizar campos que tienen valor en CSV
        if (csvStudent.instrumento) {
          updateData.instrumento = csvStudent.instrumento;
        }
        if (csvStudent.edad) {
          updateData.edad = csvStudent.edad;
        }
        if (csvStudent.telefono) {
          updateData.telefono = csvStudent.telefono;
        }
        if (csvStudent.inscripcion) {
          updateData.fechaInscripcion = csvStudent.inscripcion;
        }
        if (csvStudent.nacimiento) {
          updateData.fechaNacimiento = csvStudent.nacimiento;
        }
        if (csvStudent.instrumentoID) {
          updateData.instrumentoID = csvStudent.instrumentoID;
        }
        
        // Ejecutar actualización
        try {
          await db.collection('ALUMNOS').doc(match.id).update(updateData);
          updated++;
          
          console.log(`   ✅ ACTUALIZADO exitosamente`);
          console.log(`   📝 Campos actualizados: ${Object.keys(updateData).filter(k => k !== 'updatedAt').join(', ')}`);
          
        } catch (updateError) {
          console.log(`   ❌ Error actualizando: ${updateError.message}`);
        }
        
      } else {
        notFound++;
        console.log(`❌ NO encontrado en Firestore`);
      }
    }

    console.log('\n📊 RESUMEN DE MIGRACIÓN (PRUEBA):');
    console.log(`   Procesados: ${processed}`);
    console.log(`   Actualizados: ${updated}`);
    console.log(`   No encontrados: ${notFound}`);
    console.log(`   Tasa de éxito: ${((updated/processed)*100).toFixed(1)}%`);

    if (updated > 0) {
      console.log('\n✅ ¡MIGRACIÓN EXITOSA! Se actualizaron estudiantes.');
      console.log('🔧 Para migrar TODOS los estudiantes, ejecute:');
      console.log('   node migrate-all-students.js');
    } else {
      console.log('\n❌ MIGRACIÓN FALLÓ - No se actualizó ningún estudiante');
      console.log('🔧 Revisar configuración y conectividad');
    }

  } catch (error) {
    console.error('❌ Error en migración directa:', error);
  } finally {
    process.exit(0);
  }
}

ejecutarMigracionDirecta();
