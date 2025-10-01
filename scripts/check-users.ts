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
    
    // Check for root users specifically
    const { data: rootUsers, error: rootError } = await supabase
      .from('users')
      .select('*')
      .eq('role', 'root');
    
    if (rootError) {
      throw new Error(rootError.message);
    }
    
    // Check for admin users
    const { data: adminUsers, error: adminError } = await supabase
      .from('users')
      .select('*')
      .eq('role', 'admin');
    
    if (adminError) {
      throw new Error(adminError.message);
    }
  } catch (error: any) {
    console.error('Error checking users:', error.message);
    process.exit(1);
  }
}

checkUsers();