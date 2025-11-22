#!/usr/bin/env ts-node

/**
 * Check if songs table exists and is accessible
 */

import { config } from 'dotenv';
import { resolve } from 'path';
import { createClient } from '@supabase/supabase-js';
import { Database } from '../types_db';

// Load environment variables from .env.local
config({ path: resolve(process.cwd(), '.env.local') });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SECRET_KEY!;

async function checkSongsTable() {
  console.log('🔍 Checking songs table...\n');

  if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
    console.error('❌ Missing Supabase environment variables');
    return;
  }

  const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_SERVICE_KEY);

  // Try to query the table
  console.log('Attempting to query songs table...');
  const { data, error, count } = await supabase
    .from('songs')
    .select('*', { count: 'exact' })
    .limit(1);

  if (error) {
    console.error(`❌ Error querying songs table: ${error.message}`);
    console.error(`   Code: ${error.code}`);
    console.error(`   Details: ${error.details}`);
    console.error(`   Hint: ${error.hint}`);
    
    if (error.message.includes('schema cache')) {
      console.log('\n💡 This is a PostgREST schema cache issue.');
      console.log('   The table might exist but PostgREST needs to refresh its cache.');
      console.log('   Try:');
      console.log('   1. Go to Supabase Dashboard > Database > Tables');
      console.log('   2. Verify the "songs" table exists');
      console.log('   3. If it exists, try refreshing PostgREST cache');
      console.log('   4. Or create the table if it doesn\'t exist');
    }
  } else {
    console.log(`✅ Songs table is accessible!`);
    console.log(`   Current song count: ${count || 0}`);
    if (data && data.length > 0) {
      console.log(`   Sample song: ${data[0].title || 'N/A'}`);
    }
  }
}

checkSongsTable()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Error:', error);
    process.exit(1);
  });

