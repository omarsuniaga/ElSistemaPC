import { Firestore } from 'firebase-admin/firestore';
import type { ScheduleAssignment, TimeSlot } from '../../types/schedule';

interface MigrationResult {
  success: boolean;
  migratedCount: number;
  error?: string;
}

export async function migrateSchedules(db: Firestore): Promise<MigrationResult> {
  try {
    console.log('🔄 Iniciando migración de horarios...');
    
    // Get all classes from the CLASES collection
    const classesRef = db.collection('CLASES');
    const classesSnapshot = await classesRef.get();
    
    console.log(`📊 Total clases encontradas: ${classesSnapshot.size}`);
    
    let migratedCount = 0;
    
    // Log current state of each class
    classesSnapshot.docs.forEach(doc => {
      const classData = doc.data();
      console.log('\n🔍 Analizando clase:', {
        id: doc.id,
        name: classData.name,
        schedule: classData.schedule,
        startTime: classData.startTime,
        endTime: classData.endTime
      });
    });
    
    for (const doc of classesSnapshot.docs) {
      const classData = doc.data();
      
      // Check if the class has a schedule that needs migration
      if (classData.schedule && typeof classData.schedule === 'string') {
        // Parse the old schedule format and convert to new format
        const days = classData.schedule.toLowerCase()
          .split(',')
          .map(day => day.trim())
          .filter(day => day.length > 0);
        
        // Create new schedule format
        const newSchedule = {
          days,
          startTime: classData.startTime || '',
          endTime: classData.endTime || ''
        };
        
        // Update the class document with new schedule format
        await classesRef.doc(doc.id).update({
          schedule: newSchedule,
          updatedAt: new Date().toISOString()
        });
        
        migratedCount++;
        console.log(`✅ Migrado horario para clase: ${classData.name || doc.id}`);
      }
    }
    
    console.log(`\n📊 Migración completada. ${migratedCount} horarios migrados.`);
    
    return {
      success: true,
      migratedCount
    };
    
  } catch (error) {
    console.error('❌ Error durante la migración:', error);
    return {
      success: false,
      migratedCount: 0,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

function calculateDuration(startTime: string, endTime: string): number {
  const start = new Date(`2000-01-01 ${startTime}`);
  const end = new Date(`2000-01-01 ${endTime}`);
  return (end.getTime() - start.getTime()) / (1000 * 60); // duración en minutos
}