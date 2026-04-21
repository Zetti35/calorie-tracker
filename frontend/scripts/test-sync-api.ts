/**
 * Script to test /api/sync endpoints locally
 * Run with: npx tsx scripts/test-sync-api.ts
 * 
 * Note: This requires the dev server to be running (npm run dev)
 */

import { config } from 'dotenv'
import { resolve } from 'path'

// Load .env.local
config({ path: resolve(__dirname, '../.env.local') })

const API_BASE = 'http://localhost:3000'

// Mock Telegram initData (you'll need to replace this with real initData from Telegram WebApp)
const MOCK_INIT_DATA = process.env.TEST_TELEGRAM_INIT_DATA || ''

if (!MOCK_INIT_DATA) {
  console.error('❌ Missing TEST_TELEGRAM_INIT_DATA environment variable')
  console.log('\n📝 To test the API, you need real Telegram initData:')
  console.log('   1. Open your Telegram Mini App')
  console.log('   2. In browser console, run: window.Telegram.WebApp.initData')
  console.log('   3. Copy the output and add to .env.local:')
  console.log('      TEST_TELEGRAM_INIT_DATA="query_id=...&user=...&hash=..."')
  process.exit(1)
}

async function testSyncAPI() {
  console.log('🧪 Testing /api/sync endpoints...\n')

  // Test data
  const testData = {
    entries: [
      {
        id: 'test-1',
        food: { name: 'Яблоко', calories: 52, protein: 0.3, fat: 0.2, carbs: 14 },
        grams: 100,
        timestamp: new Date().toISOString(),
      },
    ],
    water: { [new Date().toISOString().slice(0, 10)]: 500 },
    training: { selectedLevel: null, selectedGoal: null, completedDays: [], completedSets: {} },
    reminders: { enabled: false, times: [] },
    customFoods: [],
    favorites: [],
    recentFoods: ['Яблоко'],
    nutritionPlan: null,
    userProfile: null,
    calcHistory: [],
  }

  try {
    // Test POST /api/sync
    console.log('📤 Testing POST /api/sync...')
    const postResponse = await fetch(`${API_BASE}/api/sync`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-telegram-init-data': MOCK_INIT_DATA,
      },
      body: JSON.stringify({ data: testData }),
    })

    if (!postResponse.ok) {
      const error = await postResponse.json()
      console.error(`❌ POST failed (${postResponse.status}):`, error)
      process.exit(1)
    }

    const postResult = await postResponse.json()
    console.log('✅ POST successful:', postResult)

    // Wait a bit
    await new Promise((resolve) => setTimeout(resolve, 500))

    // Test GET /api/sync
    console.log('\n📥 Testing GET /api/sync...')
    const getResponse = await fetch(`${API_BASE}/api/sync`, {
      method: 'GET',
      headers: {
        'x-telegram-init-data': MOCK_INIT_DATA,
      },
    })

    if (!getResponse.ok) {
      const error = await getResponse.json()
      console.error(`❌ GET failed (${getResponse.status}):`, error)
      process.exit(1)
    }

    const getResult = await getResponse.json()
    console.log('✅ GET successful')
    console.log('   Data entries:', getResult.data?.entries?.length || 0)
    console.log('   Updated at:', getResult.updated_at)

    // Verify data matches
    if (JSON.stringify(getResult.data.entries) === JSON.stringify(testData.entries)) {
      console.log('✅ Data integrity verified')
    } else {
      console.error('❌ Data mismatch!')
      process.exit(1)
    }

    console.log('\n✨ All API tests passed!')
  } catch (error) {
    console.error('❌ Test error:', error)
    process.exit(1)
  }
}

testSyncAPI()
