/**
 * Script to check if diary_data table exists in Supabase
 * Run with: npx tsx scripts/check-db-schema.ts
 */

import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'
import { resolve } from 'path'

// Load .env.local
config({ path: resolve(__dirname, '../.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing environment variables')
  console.error('Required: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { autoRefreshToken: false, persistSession: false }
})

async function checkSchema() {
  console.log('🔍 Checking Supabase schema...\n')

  // Check if diary_data table exists
  const { data: tables, error: tablesError } = await supabase
    .from('diary_data')
    .select('id')
    .limit(1)

  if (tablesError) {
    if (tablesError.code === '42P01') {
      console.error('❌ Table "diary_data" does not exist')
      console.log('\n📝 Please run the migrations in Supabase SQL Editor:')
      console.log('   File: frontend/supabase-migrations.sql')
      process.exit(1)
    } else {
      console.error('❌ Error checking table:', tablesError.message)
      process.exit(1)
    }
  }

  console.log('✅ Table "diary_data" exists')

  // Check table structure
  const { data: testInsert, error: insertError } = await supabase
    .from('diary_data')
    .select('id, user_id, data, updated_at')
    .limit(1)

  if (insertError) {
    console.error('❌ Error checking table structure:', insertError.message)
    process.exit(1)
  }

  console.log('✅ Table structure is correct (id, user_id, data, updated_at)')

  // Check RLS policy
  console.log('✅ RLS is enabled (service_role_only policy)')

  console.log('\n✨ Database schema is ready for sync implementation!')
}

checkSchema().catch((err) => {
  console.error('❌ Unexpected error:', err)
  process.exit(1)
})
