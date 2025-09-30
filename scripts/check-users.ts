import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Initialize Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL || '',
  process.env.SUPABASE_API_KEY || ''
);

async function checkUsers() {
  try {
    // Get all users
    const { data, error } = await supabase
      .from('users')
      .select('*')
    
    if (error) {
      throw new Error(error.message);
    }
    
    console.log('Users in database:');
    console.log(JSON.stringify(data, null, 2));
    
    // Check for root users specifically
    const { data: rootUsers, error: rootError } = await supabase
      .from('users')
      .select('*')
      .eq('role', 'root');
    
    if (rootError) {
      throw new Error(rootError.message);
    }
    
    console.log('\nRoot users:');
    console.log(JSON.stringify(rootUsers, null, 2));
    
    // Check for admin users
    const { data: adminUsers, error: adminError } = await supabase
      .from('users')
      .select('*')
      .eq('role', 'admin');
    
    if (adminError) {
      throw new Error(adminError.message);
    }
    
    console.log('\nAdmin users:');
    console.log(JSON.stringify(adminUsers, null, 2));
  } catch (error: any) {
    console.error('Error checking users:', error.message);
    process.exit(1);
  }
}

checkUsers();