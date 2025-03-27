import { db } from '../../firebase'
import { collection, getDocs, doc, setDoc } from 'firebase/firestore'

async function migrateSchedules() {
  try {
    console.log('🚀 Iniciando migración de horarios...')
    
    // Obtener todas las clases
    const classesSnapshot = await getDocs(collection(db, 'CLASES'))
    const classes = classesSnapshot.docs.map(doc => ({
      id: doc.id,
      ...(doc.data() as { teacherId?: string; schedule?: any })
    }))
    
    // Obtener todos los profesores
    const teachersSnapshot = await getDocs(collection(db, 'MAESTROS'))
    const teachers = teachersSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }))
    
    console.log(`📚 Encontradas ${classes.length} clases y ${teachers.length} profesores`)
    
    // Crear colección de horarios
    for (const classItem of classes) {
      if (classItem.schedule) {
        const scheduleDoc = {
          classId: classItem.id,
          teacherId: classItem.teacherId,
          schedule: classItem.schedule,
          updatedAt: new Date(),
          createdAt: new Date()
        }
        
        await setDoc(
          doc(db, 'HORARIOS', `${classItem.id}`),
          scheduleDoc
        )
        
        console.log(`✅ Horario migrado para la clase ${classItem.id}`)
      }
    }
    
    console.log('🎉 Migración completada exitosamente!')
    process.exit(0)
  } catch (error) {
    console.error('❌ Error durante la migración:', error)
    process.exit(1)
  }
}

migrateSchedules()
