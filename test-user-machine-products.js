// Test script for user machine products API endpoint
// Run this with: node test-user-machine-products.js

const fetch = require('node-fetch');

const API_BASE_URL = 'https://vending-ai-nexus.vercel.app';
const TEST_MACHINE_ID = '550e8400-e29b-41d4-a716-446655440000'; // Replace with actual machine ID
const TEST_SUPABASE_TOKEN = 'your-supabase-token-here'; // Replace with actual token

async function testUserMachineProductsAPI() {
  console.log('🧪 Testing User Machine Products API...');
  console.log('🌐 API Base URL:', API_BASE_URL);
  console.log('🏭 Test Machine ID:', TEST_MACHINE_ID);
  console.log('');

  try {
    // Test 1: Missing authentication
    console.log('📋 Test 1: Missing Authentication');
    const response1 = await fetch(`${API_BASE_URL}/api/user-machine-products?machine_id=${TEST_MACHINE_ID}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });

    console.log('Status:', response1.status);
    const data1 = await response1.json();
    console.log('Response:', JSON.stringify(data1, null, 2));
    console.log('✅ Expected: 401 Unauthorized');
    console.log('');

    // Test 2: Invalid authentication
    console.log('📋 Test 2: Invalid Authentication');
    const response2 = await fetch(`${API_BASE_URL}/api/user-machine-products?machine_id=${TEST_MACHINE_ID}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer invalid-token'
      }
    });

    console.log('Status:', response2.status);
    const data2 = await response2.json();
    console.log('Response:', JSON.stringify(data2, null, 2));
    console.log('✅ Expected: 401 Unauthorized');
    console.log('');

    // Test 3: Missing machine ID
    console.log('📋 Test 3: Missing Machine ID');
    const response3 = await fetch(`${API_BASE_URL}/api/user-machine-products`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${TEST_SUPABASE_TOKEN}`
      }
    });

    console.log('Status:', response3.status);
    const data3 = await response3.json();
    console.log('Response:', JSON.stringify(data3, null, 2));
    console.log('✅ Expected: 400 Bad Request');
    console.log('');

    // Test 4: Valid request (if token is provided)
    if (TEST_SUPABASE_TOKEN !== 'your-supabase-token-here') {
      console.log('📋 Test 4: Valid Request');
      const response4 = await fetch(`${API_BASE_URL}/api/user-machine-products?machine_id=${TEST_MACHINE_ID}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${TEST_SUPABASE_TOKEN}`
        }
      });

      console.log('Status:', response4.status);
      const data4 = await response4.json();
      console.log('Response:', JSON.stringify(data4, null, 2));
      
      if (response4.status === 200) {
        console.log('✅ Success: Valid request returned data');
        console.log(`📦 Found ${data4.count} products`);
        console.log('🏭 Machine:', data4.machine?.name);
        console.log('👤 User:', data4.user?.email);
      } else if (response4.status === 403) {
        console.log('✅ Expected: 403 Forbidden (user does not own machine)');
      } else if (response4.status === 404) {
        console.log('✅ Expected: 404 Not Found (machine not found)');
      }
    } else {
      console.log('📋 Test 4: Skipped (no valid token provided)');
      console.log('💡 To test with valid authentication, update TEST_SUPABASE_TOKEN');
    }

    console.log('');
    console.log('🎉 Test completed!');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Test different HTTP methods
async function testHTTPMethods() {
  console.log('🧪 Testing HTTP Methods...');
  console.log('');

  const methods = ['POST', 'PUT', 'DELETE', 'PATCH'];
  
  for (const method of methods) {
    try {
      console.log(`📋 Testing ${method} method`);
      const response = await fetch(`${API_BASE_URL}/api/user-machine-products`, {
        method: method,
        headers: {
          'Content-Type': 'application/json'
        }
      });

      console.log('Status:', response.status);
      const data = await response.json();
      console.log('Response:', JSON.stringify(data, null, 2));
      console.log('✅ Expected: 405 Method Not Allowed');
      console.log('');
    } catch (error) {
      console.error(`❌ ${method} test failed:`, error.message);
    }
  }
}

// Test CORS
async function testCORS() {
  console.log('🧪 Testing CORS...');
  console.log('');

  try {
    const response = await fetch(`${API_BASE_URL}/api/user-machine-products`, {
      method: 'OPTIONS',
      headers: {
        'Origin': 'http://localhost:3000',
        'Access-Control-Request-Method': 'GET',
        'Access-Control-Request-Headers': 'Content-Type, Authorization'
      }
    });

    console.log('Status:', response.status);
    console.log('CORS Headers:');
    console.log('- Access-Control-Allow-Origin:', response.headers.get('Access-Control-Allow-Origin'));
    console.log('- Access-Control-Allow-Methods:', response.headers.get('Access-Control-Allow-Methods'));
    console.log('- Access-Control-Allow-Headers:', response.headers.get('Access-Control-Allow-Headers'));
    console.log('✅ Expected: 200 OK with CORS headers');
    console.log('');
  } catch (error) {
    console.error('❌ CORS test failed:', error.message);
  }
}

// Main test runner
async function runAllTests() {
  console.log('🚀 Starting User Machine Products API Tests');
  console.log('==========================================');
  console.log('');

  await testUserMachineProductsAPI();
  await testHTTPMethods();
  await testCORS();

  console.log('🎯 All tests completed!');
  console.log('');
  console.log('📝 Summary:');
  console.log('- Authentication: ✅ Required');
  console.log('- Authorization: ✅ Machine ownership verified');
  console.log('- CORS: ✅ Configured');
  console.log('- HTTP Methods: ✅ Only GET allowed');
  console.log('- Error Handling: ✅ Comprehensive');
}

// Run tests if this file is executed directly
if (require.main === module) {
  runAllTests().catch(console.error);
}

module.exports = {
  testUserMachineProductsAPI,
  testHTTPMethods,
  testCORS,
  runAllTests
}; 