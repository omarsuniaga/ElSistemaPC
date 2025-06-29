/**
 * Test script to verify emergency class integration in AttendanceView
 * Run this in browser console when on AttendanceView with emergency class
 */

console.log('🧪 Testing Emergency Class UI Integration...');

// Test emergency class ID
const emergencyClassId = '3sf0mBLxcam45CbTgmvK';

// Helper function to wait for Vue updates
const waitForVue = () => new Promise(resolve => setTimeout(resolve, 100));

async function testEmergencyClassUI() {
  console.log('📊 Testing emergency class UI integration...');
  
  try {
    // Test 1: Check if app instance exists
    console.log('1. Checking Vue app instance...');
    const app = window.__VUE_APP_INSTANCE__ || document.querySelector('#app').__vueParentComponent;
    if (!app) {
      console.error('❌ Vue app instance not found');
      return;
    }
    console.log('✅ Vue app instance found');
    
    // Test 2: Check attendance store
    console.log('2. Checking attendance store...');
    const attendanceStore = app?.appContext?.app?.config?.globalProperties?.$attendanceStore;
    if (!attendanceStore) {
      console.error('❌ Attendance store not accessible from global properties');
      console.log('💡 Trying alternative access methods...');
      
      // Try accessing through Pinia
      if (window.pinia) {
        console.log('📦 Pinia found, checking stores...');
        console.log('Available stores:', Object.keys(window.pinia.state.value));
      }
      return;
    }
    console.log('✅ Attendance store accessible');
    
    // Test 3: Test emergency class detection
    console.log('3. Testing emergency class detection...');
    const isEmergency = await attendanceStore.isEmergencyClass(emergencyClassId);
    console.log(`Is ${emergencyClassId} an emergency class?`, isEmergency);
    
    if (isEmergency) {
      // Test 4: Get emergency class info
      console.log('4. Getting emergency class info...');
      const emergencyInfo = await attendanceStore.getClassInfo(emergencyClassId);
      console.log('Emergency class info:', emergencyInfo);
      
      // Test 5: Get emergency class students
      console.log('5. Getting emergency class students...');
      const students = await attendanceStore.getEmergencyClassStudents(emergencyClassId);
      console.log('Emergency class students:', students);
    }
    
    // Test 6: Check UI elements
    console.log('6. Checking UI elements...');
    const classNameElement = document.querySelector('[data-testid="selected-class-name"]') || 
                            document.querySelector('.class-name') ||
                            document.querySelector('h2, h3, h4');
    
    if (classNameElement) {
      console.log('📋 Class name element:', classNameElement.textContent);
    } else {
      console.log('⚠️ Class name element not found');
    }
    
    // Test 7: Check for loading states
    const loadingElements = document.querySelectorAll('[class*="loading"], [class*="spinner"]');
    console.log('🔄 Loading elements found:', loadingElements.length);
    
    console.log('✅ Emergency class UI test completed');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    console.error('Error details:', {
      message: error.message,
      stack: error.stack
    });
  }
}

// Test navigation to emergency class
async function testNavigationToEmergencyClass() {
  console.log('🧭 Testing navigation to emergency class...');
  
  try {
    // Get current date in YYYYMMDD format
    const today = new Date();
    const dateStr = today.getFullYear() + 
                   String(today.getMonth() + 1).padStart(2, '0') + 
                   String(today.getDate()).padStart(2, '0');
    
    const emergencyUrl = `/attendance/${dateStr}/${emergencyClassId}`;
    console.log('🔗 Emergency class URL:', emergencyUrl);
    
    // Check if we're already on the emergency class page
    if (window.location.pathname.includes(emergencyClassId)) {
      console.log('✅ Already on emergency class page');
      await testEmergencyClassUI();
    } else {
      console.log('📍 Navigating to emergency class...');
      window.history.pushState({}, '', emergencyUrl);
      
      // Trigger route change event
      window.dispatchEvent(new PopStateEvent('popstate'));
      
      // Wait for navigation
      await waitForVue();
      await testEmergencyClassUI();
    }
    
  } catch (error) {
    console.error('❌ Navigation test failed:', error);
  }
}

// Test Firebase connection
async function testFirebaseConnection() {
  console.log('🔥 Testing Firebase connection...');
  
  try {
    if (window.firebase && window.firebase.firestore) {
      const db = window.firebase.firestore();
      
      // Test EMERGENCY_CLASSES collection access
      const emergencyRef = db.collection('EMERGENCY_CLASSES').doc(emergencyClassId);
      const doc = await emergencyRef.get();
      
      if (doc.exists) {
        console.log('✅ Emergency class document found in Firebase');
        console.log('📄 Document data:', doc.data());
      } else {
        console.log('❌ Emergency class document not found');
      }
    } else {
      console.log('⚠️ Firebase not available in window object');
    }
  } catch (error) {
    console.error('❌ Firebase test failed:', error);
  }
}

// Run all tests
async function runAllTests() {
  console.log('🚀 Starting comprehensive emergency class tests...');
  console.log('='.repeat(50));
  
  await testFirebaseConnection();
  console.log('-'.repeat(30));
  
  await testNavigationToEmergencyClass();
  console.log('-'.repeat(30));
  
  console.log('🏁 All tests completed');
  console.log('='.repeat(50));
}

// Export functions for manual testing
window.emergencyClassTests = {
  runAll: runAllTests,
  testUI: testEmergencyClassUI,
  testNavigation: testNavigationToEmergencyClass,
  testFirebase: testFirebaseConnection
};

console.log('🔧 Emergency class test functions loaded:');
console.log('- emergencyClassTests.runAll()');
console.log('- emergencyClassTests.testUI()');
console.log('- emergencyClassTests.testNavigation()');
console.log('- emergencyClassTests.testFirebase()');

// Auto-run if we're already on an emergency class page
if (window.location.pathname.includes(emergencyClassId)) {
  console.log('🎯 Emergency class detected in URL, running tests...');
  runAllTests();
}
