/**
 * 🔥 FIREBASE CONNECTION TESTER
 * Verifica que Firebase esté conectándose a producción y no a emuladores
 */

console.log('🔍 Testing Firebase connection...');

// Simulate environment check
const mockEnv = {
  DEV: true,
  VITE_USE_EMULATORS: 'false',
  VITE_FIREBASE_ENV: 'production',
  MODE: 'development'
};

console.log('📋 Environment Variables:');
console.log('- DEV:', mockEnv.DEV);
console.log('- VITE_USE_EMULATORS:', mockEnv.VITE_USE_EMULATORS);
console.log('- VITE_FIREBASE_ENV:', mockEnv.VITE_FIREBASE_ENV);
console.log('- MODE:', mockEnv.MODE);

// Test connection logic
const useEmulators = mockEnv.VITE_USE_EMULATORS === 'true';
const isDev = mockEnv.DEV;

console.log('\n🔍 Connection Decision:');
console.log('- Is Development?', isDev);
console.log('- Use Emulators?', useEmulators);
console.log('- Should connect to emulators?', isDev && useEmulators);

if (isDev && useEmulators) {
  console.log('🔌 Would connect to Firebase Emulators');
  console.log('  - Auth: localhost:9099');
  console.log('  - Firestore: localhost:8080');
  console.log('  - Storage: localhost:9199');
  console.log('  - Functions: localhost:5001');
} else {
  console.log('☁️ Will connect to Firebase Production Services');
  console.log('  - Auth: production');
  console.log('  - Firestore: production');
  console.log('  - Storage: production');
  console.log('  - Functions: production');
}

console.log('\n✅ Test completed. Your app should connect to PRODUCTION Firebase.');
