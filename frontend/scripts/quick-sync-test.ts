/**
 * Quick sync test - checks if sync is working
 * Run with: npx tsx scripts/quick-sync-test.ts
 */

import { config } from 'dotenv'
import { resolve } from 'path'
import { createClient } from '@supabase/supabase-js'

config({ path: resolve(__dirname, '../.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

async function quickTest() {
  console.log('🧪 Quick Sync Test\n')

  const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: { autoRefreshToken: false, persistSession: false }
  })

  // 1. Check if diary_data table exists
  console.log('1️⃣ Checking diary_data table...')
  const { data: tables, error: tableError } = await supabase
    .from('diary_data')
    .select('id')
    .limit(1)

  if (tableError && tableError.code === '42P01') {
    console.error('❌ Table diary_data does not exist!')
    console.log('   Run migrations in Supabase SQL Editor')
    return
  }

  console.log('✅ Table exists\n')

  // 2. Check if any users have synced data
  console.log('2️⃣ Checking synced data...')
  const { data: syncedData, error: dataError } = await supabase
    .from('diary_data')
    .select('user_id, updated_at')
    .limit(5)

  if (dataError) {
    console.error('❌ Error fetching data:', dataError.message)
    return
  }

  if (!syncedData || syncedData.length === 0) {
    console.log('⚠️  No synced data yet')
    console.log('   This is normal if you haven\'t used the app yet\n')
  } else {
    console.log(`✅ Found ${syncedData.length} synced user(s)`)
    syncedData.forEach((row, i) => {
      console.log(`   ${i + 1}. User: ${row.user_id.slice(0, 8)}... | Last sync: ${row.updated_at}`)
    })
    console.log()
  }

  // 3. Instructions
  console.log('📝 To test sync:')
  console.log('   1. Open http://localhost:3000 in browser')
  console.log('   2. Open DevTools Console (F12)')
  console.log('   3. Add an entry to diary')
  console.log('   4. Wait 2 seconds')
  console.log('   5. Check console for: [syncToServer] Success')
  console.log('   6. Check indicator in top-right: ✓ (green)')
  console.log('   7. Run this script again to see synced data\n')

  console.log('✨ Test complete!')
}

quickTest().catch(console.error)
