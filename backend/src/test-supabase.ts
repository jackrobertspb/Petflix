import dotenv from 'dotenv';

// Set NODE_ENV for debug output
process.env.NODE_ENV = 'development';

// Try loading .env from backend directory
const result = dotenv.config({ path: './.env' });
if (result.error) {
  console.warn('Failed to load .env:', result.error.message);
} else {
  console.log('✅ .env file loaded');
  console.log('SUPABASE_URL present:', !!process.env.SUPABASE_URL);
}

import { supabase } from './config/supabase.js';

async function testConnection() {
  try {
    console.log('Testing Supabase connection...');
    
    // Test query - try to get a count from users table
    const { error } = await supabase
      .from('users')
      .select('id', { count: 'exact', head: true });
    
    if (error) {
      console.error('❌ Connection failed:', error.message);
      return false;
    }
    
    console.log('✅ Supabase connection successful!');
    console.log(`   Users table exists and is accessible`);
    return true;
  } catch (err) {
    console.error('❌ Connection error:', err);
    return false;
  }
}

testConnection().then((success) => {
  process.exit(success ? 0 : 1);
});

