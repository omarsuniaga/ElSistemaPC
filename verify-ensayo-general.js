/**
 * 🔍 VERIFICACIÓN COMPLETA DE ENSAYO GENERAL
 * Para entender exactamente cómo están guardados los días
 */

import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs } from 'firebase/firestore';

// Configuración Firebase
const firebaseConfig = {
  apiKey: 'AIzaSyABBRlIV63EqwEH0YhtePTwqkCtqv6_CmY',
  authDomain: 'musicacademymanager.firebaseapp.com',
  projectId: 'musicacademymanager',
  storageBucket: 'musicacademymanager.appspot.com',
  messagingSenderId: '754252734445',
  appId: '1:754252734445:web:d73dd2cc0f4b1c4b74e5ba',
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function verifyEnsayoGeneral() {
  try {
    console.log('🔍 BUSCANDO ENSAYO GENERAL EN FIRESTORE...\n');
    
    const classesRef = collection(db, 'classes');
    const snapshot = await getDocs(classesRef);
    
    let ensayoGeneral = null;
    
    snapshot.forEach((doc) => {
      const data = doc.data();
      if (data.name && data.name.toLowerCase().includes('ensayo general')) {
        ensayoGeneral = { id: doc.id, ...data };
      }
    });
    
    if (!ensayoGeneral) {
      console.log('❌ NO SE ENCONTRÓ ENSAYO GENERAL');
      return;
    }
    
    console.log('✅ ENSAYO GENERAL ENCONTRADO:');
    console.log('📋 ID:', ensayoGeneral.id);
    console.log('📋 Nombre:', ensayoGeneral.name);
    console.log('📋 Estructura completa:', JSON.stringify(ensayoGeneral, null, 2));
    
    console.log('\n🗓️ ANÁLISIS DE HORARIOS:');
    
    if (ensayoGeneral.schedule) {
      console.log('📅 Schedule encontrado:', JSON.stringify(ensayoGeneral.schedule, null, 2));
      
      if (ensayoGeneral.schedule.slots && Array.isArray(ensayoGeneral.schedule.slots)) {
        console.log(`\n🎯 SLOTS ENCONTRADOS: ${ensayoGeneral.schedule.slots.length}`);
        
        ensayoGeneral.schedule.slots.forEach((slot, index) => {
          console.log(`\n   Slot ${index + 1}:`);
          console.log(`   📅 Día: "${slot.day}"`);
          console.log(`   ⏰ Hora: ${slot.startTime} - ${slot.endTime}`);
          
          // Análisis del día
          const dia = slot.day;
          console.log(`   🔍 Análisis del día "${dia}":`);
          
          // Mapeo LUNES=0 (nuestro sistema corregido)
          const mapeoLunes0 = {
            'lunes': 0,
            'martes': 1,
            'miércoles': 2,
            'jueves': 3,
            'viernes': 4,
            'sábado': 5,
            'domingo': 6,
          };
          
          // Mapeo DOMINGO=0 (JavaScript estándar)
          const mapeoDomingo0 = {
            'domingo': 0,
            'lunes': 1,
            'martes': 2,
            'miércoles': 3,
            'jueves': 4,
            'viernes': 5,
            'sábado': 6,
          };
          
          const diaLower = dia.toLowerCase();
          console.log(`   📊 En formato LUNES=0: ${mapeoLunes0[diaLower] ?? 'NO ENCONTRADO'}`);
          console.log(`   📊 En formato DOMINGO=0: ${mapeoDomingo0[diaLower] ?? 'NO ENCONTRADO'}`);
        });
      } else if (ensayoGeneral.schedule.day) {
        console.log('\n📅 Formato legacy con día directo:');
        console.log(`   Día: "${ensayoGeneral.schedule.day}"`);
      } else {
        console.log('\n❌ ESTRUCTURA DE SCHEDULE NO RECONOCIDA');
      }
    } else {
      console.log('\n❌ NO HAY SCHEDULE DEFINIDO');
    }
    
    console.log('\n🎯 RESUMEN:');
    console.log('• Los días están guardados como strings en español');
    console.log('• martes = 1 en LUNES=0, 2 en DOMINGO=0');
    console.log('• jueves = 3 en LUNES=0, 4 en DOMINGO=0');  
    console.log('• sábado = 5 en LUNES=0, 6 en DOMINGO=0');
    console.log('• domingo = 6 en LUNES=0, 0 en DOMINGO=0');
    
    console.log('\n🚨 PROBLEMA IDENTIFICADO:');
    console.log('Si el domingo aparece en la fecha 2025-07-06 (que es domingo),');
    console.log('y Ensayo General tiene días martes/jueves/sábado,');
    console.log('entonces hay un error en la conversión o comparación.');
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

verifyEnsayoGeneral();
