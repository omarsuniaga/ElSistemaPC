// Test de importación de isFirebaseReady
console.log('🧪 Probando importación de isFirebaseReady...');

try {
  // Importar la función
  import { isFirebaseReady, db, auth, storage } from '../src/firebase.js';
  
  console.log('✅ Importación exitosa!');
  
  // Probar la función
  setTimeout(() => {
    const isReady = isFirebaseReady();
    console.log('🔍 Firebase está listo:', isReady);
    console.log('📊 Estado de servicios:');
    console.log('  - db:', db ? '✅' : '❌');
    console.log('  - auth:', auth ? '✅' : '❌'); 
    console.log('  - storage:', storage ? '✅' : '❌');
  }, 1000);
  
} catch (error) {
  console.error('❌ Error de importación:', error);
}
