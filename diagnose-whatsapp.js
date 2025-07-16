// Script de diagnóstico para WhatsApp Functions
console.log('🔍 Diagnóstico de WhatsApp Functions');

const API_BASE_URL = 'https://us-central1-orquestapuntacana.cloudfunctions.net/whatsappApi';

async function testEndpoints() {
  const endpoints = ['/status', '/qr'];

  for (const endpoint of endpoints) {
    const url = `${API_BASE_URL}${endpoint}`;
    console.log(`\n📡 Probando: ${url}`);

    try {
      const response = await fetch(url);
      console.log(`   Status: ${response.status} ${response.statusText}`);
      console.log('   Headers:', Object.fromEntries(response.headers));

      if (response.ok) {
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          const data = await response.json();
          console.log('   Data:', data);
        } else {
          console.log(`   Content-Type: ${contentType}`);
        }
      }
    } catch (error) {
      console.error('   ❌ Error:', error.message);
    }
  }
}

// Si ejecutas en browser
if (typeof window !== 'undefined') {
  window.testWhatsAppAPI = testEndpoints;
  console.log('💡 En consola del browser ejecuta: testWhatsAppAPI()');
} else {
  // Si ejecutas en Node.js
  testEndpoints();
}
