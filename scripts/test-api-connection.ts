/**
 * Test script to verify Guardian API connectivity
 * Run with: npx tsx scripts/test-api-connection.ts
 */

const GUARDIAN_API_URL = process.env.NEXT_PUBLIC_GUARDIAN_API_URL || 'https://aegis-guardian-production.up.railway.app';

interface HealthResponse {
  status: string;
  timestamp: string;
  uptime: number;
  responseTime: number;
  services: {
    database: { status: string };
    redis: { status: string };
  };
  version: string;
}

async function testHealthEndpoint() {
  console.log('🔍 Testing Guardian API Health Endpoint...');
  console.log(`📍 URL: ${GUARDIAN_API_URL}/api/health\n`);

  try {
    const response = await fetch(`${GUARDIAN_API_URL}/api/health`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Origin': 'https://aegis-vaults.xyz',
      },
    });

    console.log('📊 Response Status:', response.status, response.statusText);
    console.log('📋 Response Headers:');
    response.headers.forEach((value, key) => {
      if (key.toLowerCase().includes('cors') || key.toLowerCase().includes('access-control')) {
        console.log(`  ✓ ${key}: ${value}`);
      }
    });

    if (response.ok) {
      const data: HealthResponse = await response.json();
      console.log('\n✅ Health Check Successful!');
      console.log('📈 Service Status:', data.status);
      console.log('🗄️  Database:', data.services.database.status);
      console.log('⚡ Redis:', data.services.redis.status);
      console.log('⏱️  Response Time:', data.responseTime, 'ms');
      console.log('🚀 Uptime:', Math.floor(data.uptime), 'seconds');
      return true;
    } else {
      console.error('❌ Health check failed with status:', response.status);
      const text = await response.text();
      console.error('Response:', text);
      return false;
    }
  } catch (error) {
    console.error('❌ Error connecting to Guardian API:');
    console.error(error);
    return false;
  }
}

async function testVaultsEndpoint() {
  console.log('\n🔍 Testing Vaults API Endpoint...');
  console.log(`📍 URL: ${GUARDIAN_API_URL}/api/vaults\n`);

  try {
    const response = await fetch(`${GUARDIAN_API_URL}/api/vaults`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Origin': 'https://aegis-vaults.xyz',
      },
    });

    console.log('📊 Response Status:', response.status, response.statusText);

    if (response.ok) {
      const data = await response.json();
      console.log('✅ Vaults API Successful!');
      console.log('📦 Response:', JSON.stringify(data, null, 2));
      return true;
    } else {
      console.error('❌ Vaults API failed with status:', response.status);
      const text = await response.text();
      console.error('Response:', text);
      return false;
    }
  } catch (error) {
    console.error('❌ Error connecting to Vaults API:');
    console.error(error);
    return false;
  }
}

async function testTransactionsEndpoint() {
  console.log('\n🔍 Testing Transactions API Endpoint...');
  console.log(`📍 URL: ${GUARDIAN_API_URL}/api/transactions\n`);

  try {
    const response = await fetch(`${GUARDIAN_API_URL}/api/transactions`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Origin': 'https://aegis-vaults.xyz',
      },
    });

    console.log('📊 Response Status:', response.status, response.statusText);

    if (response.ok) {
      const data = await response.json();
      console.log('✅ Transactions API Successful!');
      console.log('📦 Response:', JSON.stringify(data, null, 2));
      return true;
    } else {
      console.error('❌ Transactions API failed with status:', response.status);
      const text = await response.text();
      console.error('Response:', text);
      return false;
    }
  } catch (error) {
    console.error('❌ Error connecting to Transactions API:');
    console.error(error);
    return false;
  }
}

async function testAnalyticsEndpoint() {
  console.log('\n🔍 Testing Analytics API Endpoint...');
  console.log(`📍 URL: ${GUARDIAN_API_URL}/api/analytics/global\n`);

  try {
    const response = await fetch(`${GUARDIAN_API_URL}/api/analytics/global`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Origin': 'https://aegis-vaults.xyz',
      },
    });

    console.log('📊 Response Status:', response.status, response.statusText);

    if (response.ok) {
      const data = await response.json();
      console.log('✅ Analytics API Successful!');
      console.log('📦 Response:', JSON.stringify(data, null, 2));
      return true;
    } else {
      console.error('❌ Analytics API failed with status:', response.status);
      const text = await response.text();
      console.error('Response:', text);
      return false;
    }
  } catch (error) {
    console.error('❌ Error connecting to Analytics API:');
    console.error(error);
    return false;
  }
}

async function main() {
  console.log('═══════════════════════════════════════════════════════════');
  console.log('   Aegis Guardian API Connection Test');
  console.log('═══════════════════════════════════════════════════════════\n');

  const results = {
    health: await testHealthEndpoint(),
    vaults: await testVaultsEndpoint(),
    transactions: await testTransactionsEndpoint(),
    analytics: await testAnalyticsEndpoint(),
  };

  console.log('\n═══════════════════════════════════════════════════════════');
  console.log('   Test Results Summary');
  console.log('═══════════════════════════════════════════════════════════');
  console.log('Health Endpoint:      ', results.health ? '✅ PASS' : '❌ FAIL');
  console.log('Vaults Endpoint:      ', results.vaults ? '✅ PASS' : '❌ FAIL');
  console.log('Transactions Endpoint:', results.transactions ? '✅ PASS' : '❌ FAIL');
  console.log('Analytics Endpoint:   ', results.analytics ? '✅ PASS' : '❌ FAIL');
  console.log('═══════════════════════════════════════════════════════════\n');

  const allPassed = Object.values(results).every(r => r);

  if (allPassed) {
    console.log('🎉 All API endpoints are working correctly!');
    console.log('✨ Frontend is ready to integrate with Guardian backend.\n');
    process.exit(0);
  } else {
    console.log('⚠️  Some API endpoints failed. Please check the logs above.\n');
    process.exit(1);
  }
}

main();
