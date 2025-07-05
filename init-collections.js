// Script para verificar y crear colecciones necesarias para el sistema de notificaciones
// Ejecutar este script una vez para inicializar las colecciones requeridas

import { db, isFirebaseReady } from '../src/firebase.js'
import { 
  collection, 
  getDocs, 
  addDoc, 
  serverTimestamp,
  query,
  limit 
} from 'firebase/firestore'

// Colecciones requeridas
const REQUIRED_COLLECTIONS = [
  {
    name: 'admin_notifications',
    description: 'Notificaciones para administradores',
    sampleDoc: {
      type: 'system_init',
      title: '🔧 Sistema Inicializado',
      message: 'Las notificaciones han sido configuradas correctamente',
      timestamp: new Date(),
      read: false,
      urgency: 'low'
    }
  },
  {
    name: 'ASISTENCIAS',
    description: 'Registros de asistencia de estudiantes',
    sampleDoc: {
      classId: 'sample_class',
      teacherId: 'sample_teacher',
      fecha: new Date().toISOString().split('T')[0],
      data: {
        presentes: [],
        ausentes: [],
        tarde: [],
        justificacion: []
      },
      createdAt: new Date()
    }
  },
  {
    name: 'CLASES',
    description: 'Información de las clases',
    sampleDoc: {
      id: 'sample_class',
      name: 'Clase de Ejemplo',
      className: 'Clase de Ejemplo',
      studentIds: [],
      teacherId: 'sample_teacher',
      schedule: 'Horario pendiente'
    }
  },
  {
    name: 'users',
    description: 'Información de usuarios (maestros, estudiantes, etc.)',
    sampleDoc: {
      uid: 'sample_teacher',
      firstName: 'Maestro',
      lastName: 'Ejemplo',
      email: 'maestro@ejemplo.com',
      role: 'Teacher',
      active: true
    }
  }
]

async function checkAndCreateCollections() {
  console.log('🔍 Verificando colecciones de Firebase...')
  
  if (!isFirebaseReady()) {
    console.error('❌ Firebase no está listo. Verifica la configuración.')
    return
  }

  for (const collectionInfo of REQUIRED_COLLECTIONS) {
    try {
      console.log(`\n📁 Verificando colección: ${collectionInfo.name}`)
      
      // Intentar leer la colección
      const collectionRef = collection(db, collectionInfo.name)
      const snapshot = await getDocs(query(collectionRef, limit(1)))
      
      if (snapshot.empty) {
        console.log(`⚠️  Colección '${collectionInfo.name}' está vacía o no existe`)
        console.log(`📝 Creando documento de ejemplo...`)
        
        // Crear documento de ejemplo
        await addDoc(collectionRef, {
          ...collectionInfo.sampleDoc,
          _isSystemGenerated: true,
          _description: `Documento generado automáticamente para ${collectionInfo.description}`,
          _createdAt: serverTimestamp()
        })
        
        console.log(`✅ Documento de ejemplo creado en '${collectionInfo.name}'`)
      } else {
        console.log(`✅ Colección '${collectionInfo.name}' existe y tiene datos`)
      }
      
    } catch (error) {
      console.error(`❌ Error verificando colección '${collectionInfo.name}':`, error)
    }
  }
  
  console.log('\n🎉 Verificación completada!')
  console.log('💡 Ahora puedes reiniciar la aplicación para probar el sistema de notificaciones')
}

// Ejecutar verificación cuando se carga el script
if (typeof window !== 'undefined') {
  // En el navegador
  setTimeout(() => {
    checkAndCreateCollections()
  }, 2000) // Esperar a que Firebase se inicialice
} else {
  // En Node.js (si se ejecuta desde terminal)
  checkAndCreateCollections()
}

export { checkAndCreateCollections }
