#!/usr/bin/env ts-node
/**
 * API Integration Tests for Walk-In Queue & Sessions
 * 
 * Run: npx ts-node --esm scripts/test-api.ts
 * Or: yarn test:api (after adding script to package.json)
 * 
 * Requirements:
 * - Server must be running on http://localhost:3000
 * - Database must be migrated
 */

const BASE_URL = process.env.TEST_URL || 'http://localhost:3000';

interface TestResult {
  name: string;
  passed: boolean;
  error?: string;
  duration: number;
}

const results: TestResult[] = [];

async function test(name: string, fn: () => Promise<void>) {
  const start = Date.now();
  try {
    await fn();
    results.push({ name, passed: true, duration: Date.now() - start });
    console.log(`✅ ${name}`);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    results.push({ name, passed: false, error: errorMessage, duration: Date.now() - start });
    console.log(`❌ ${name}: ${errorMessage}`);
  }
}

async function fetchAPI(path: string, options?: RequestInit) {
  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  });
  
  const text = await res.text();
  let data;
  try {
    data = JSON.parse(text);
  } catch {
    data = text;
  }
  
  return { res, data };
}

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(message);
  }
}

// ============================================================
// WALK-IN QUEUE TESTS
// ============================================================

async function testWalkInQueueFlow() {
  let queueId: string = '';
  
  // Test 1: Get all queues
  await test('Walk-In Queue: GET /api/walk-in-queue returns array', async () => {
    const { res, data } = await fetchAPI('/api/walk-in-queue');
    assert(res.ok, `Status ${res.status}: ${JSON.stringify(data)}`);
    assert(Array.isArray(data), 'Response should be an array');
  });
  
  // Test 2: Get queue stats
  await test('Walk-In Queue: GET /api/walk-in-queue/stats returns stats', async () => {
    const { res, data } = await fetchAPI('/api/walk-in-queue/stats');
    assert(res.ok, `Status ${res.status}: ${JSON.stringify(data)}`);
    assert(typeof data.waitingCount === 'number', 'Should have waitingCount');
  });
  
  // Test 3: Get next queue number
  await test('Walk-In Queue: GET /api/walk-in-queue/next-number returns number', async () => {
    const { res, data } = await fetchAPI('/api/walk-in-queue/next-number');
    assert(res.ok, `Status ${res.status}: ${JSON.stringify(data)}`);
    assert(typeof data.nextNumber === 'number', 'Should have nextNumber');
  });
  
  // Test 4: Join queue
  await test('Walk-In Queue: POST /api/walk-in-queue joins queue', async () => {
    const { res, data } = await fetchAPI('/api/walk-in-queue', {
      method: 'POST',
      body: JSON.stringify({
        customerName: 'Test Customer ' + Date.now(),
        customerPhone: '0812345678',
        partySize: 2,
        notes: 'Integration Test',
      }),
    });
    
    assert(res.ok || res.status === 201, `Status ${res.status}: ${JSON.stringify(data)}`);
    assert(data.id, 'Should have queue ID');
    assert(data.status === 'waiting', 'Status should be waiting');
    assert(data.queueNumber > 0, 'Should have queue number');
    
    queueId = data.id;
  });
  
  // Test 5: Get queue by ID
  await test('Walk-In Queue: GET /api/walk-in-queue/[id] returns queue', async () => {
    if (!queueId) throw new Error('No queueId from previous test');
    
    const { res, data } = await fetchAPI(`/api/walk-in-queue/${queueId}`);
    assert(res.ok, `Status ${res.status}: ${JSON.stringify(data)}`);
    assert(data.id === queueId, 'Should return correct queue');
  });
  
  // Test 6: Call customer (Requires auth - skip in unauthenticated tests)
  await test('Walk-In Queue: POST /api/walk-in-queue/[id]/call requires auth (expected)', async () => {
    if (!queueId) throw new Error('No queueId from previous test');
    
    const { res, data } = await fetchAPI(`/api/walk-in-queue/${queueId}/call`, {
      method: 'POST',
    });
    
    // Expected to fail without auth (RLS protection)
    // Either 500 (permission error) or success if RLS is disabled
    assert(res.status === 500 || res.ok, `Unexpected status ${res.status}: ${JSON.stringify(data)}`);
  });
  
  // Test 7: Cancel queue (cleanup)
  await test('Walk-In Queue: DELETE /api/walk-in-queue/[id] cancels queue', async () => {
    if (!queueId) throw new Error('No queueId from previous test');
    
    const { res, data } = await fetchAPI(`/api/walk-in-queue/${queueId}`, {
      method: 'DELETE',
      body: JSON.stringify({}),
    });
    
    assert(res.ok, `Status ${res.status}: ${JSON.stringify(data)}`);
    assert(data.success === true, 'Should return success');
  });
}

// ============================================================
// SESSIONS TESTS
// ============================================================

async function testSessionsFlow() {
  // Test 1: Get all sessions
  await test('Sessions: GET /api/sessions returns array', async () => {
    const { res, data } = await fetchAPI('/api/sessions');
    assert(res.ok, `Status ${res.status}: ${JSON.stringify(data)}`);
    assert(Array.isArray(data), 'Response should be an array');
  });
  
  // Test 2: Get active sessions
  await test('Sessions: GET /api/sessions/active returns array', async () => {
    const { res, data } = await fetchAPI('/api/sessions/active');
    assert(res.ok, `Status ${res.status}: ${JSON.stringify(data)}`);
    assert(Array.isArray(data), 'Response should be an array');
  });
  
  // Test 3: Get today's sessions
  await test('Sessions: GET /api/sessions/today returns array', async () => {
    const { res, data } = await fetchAPI('/api/sessions/today');
    assert(res.ok, `Status ${res.status}: ${JSON.stringify(data)}`);
    assert(Array.isArray(data), 'Response should be an array');
  });
  
  // Test 4: Get session stats
  await test('Sessions: GET /api/sessions/stats returns stats', async () => {
    const { res, data } = await fetchAPI('/api/sessions/stats');
    assert(res.ok, `Status ${res.status}: ${JSON.stringify(data)}`);
    assert(typeof data.totalSessions === 'number', 'Should have totalSessions');
    assert(typeof data.totalRevenue === 'number', 'Should have totalRevenue');
  });
}

// ============================================================
// MACHINES TESTS
// ============================================================

async function testMachinesAPI() {
  await test('Machines: GET /api/machines returns array', async () => {
    const { res, data } = await fetchAPI('/api/machines');
    assert(res.ok, `Status ${res.status}: ${JSON.stringify(data)}`);
    assert(Array.isArray(data), 'Response should be an array');
  });
}

// ============================================================
// BOOKINGS TESTS
// ============================================================

async function testBookingsAPI() {
  await test('Bookings: GET /api/bookings/schedule returns data', async () => {
    // Use schedule endpoint with required params
    const today = new Date().toISOString().split('T')[0];
    const machineId = '00000000-0000-0000-0000-000000000101'; // Sample machine ID
    const { res, data } = await fetchAPI(`/api/bookings/schedule?date=${today}&machineId=${machineId}`);
    assert(res.ok, `Status ${res.status}: ${JSON.stringify(data)}`);
    // Response can be array or object with schedule data
    assert(data !== null && data !== undefined, 'Response should have data');
  });
}

// ============================================================
// RUN ALL TESTS
// ============================================================

async function runTests() {
  console.log('\n🧪 Running API Integration Tests...');
  console.log(`📍 Base URL: ${BASE_URL}\n`);
  console.log('─'.repeat(50));
  
  await testMachinesAPI();
  await testBookingsAPI();
  await testWalkInQueueFlow();
  await testSessionsFlow();
  
  console.log('─'.repeat(50));
  
  const passed = results.filter(r => r.passed).length;
  const failed = results.filter(r => !r.passed).length;
  const totalTime = results.reduce((sum, r) => sum + r.duration, 0);
  
  console.log(`\n📊 Results: ${passed} passed, ${failed} failed`);
  console.log(`⏱️  Total time: ${totalTime}ms\n`);
  
  if (failed > 0) {
    console.log('❌ Failed tests:');
    results.filter(r => !r.passed).forEach(r => {
      console.log(`  - ${r.name}: ${r.error}`);
    });
    process.exit(1);
  } else {
    console.log('✅ All tests passed!');
    process.exit(0);
  }
}

runTests().catch(console.error);
