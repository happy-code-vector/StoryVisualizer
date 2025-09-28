import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

// Load environment variables
dotenv.config()

// Initialize Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL || '',
  process.env.SUPABASE_API_KEY || ''
)

async function verifyUser() {
  const username = process.argv[2]
  
  if (!username) {
    console.error('Usage: npm run verify-user <username>')
    process.exit(1)
  }
  
  try {
    // Update the user's verified status
    const { data, error } = await supabase
      .from('users')
      .update({ verified: true })
      .eq('username', username)
      .select()
    
    if (error) {
      throw new Error(error.message)
    }
    
    if (data.length === 0) {
      console.log(`No user found with username: ${username}`)
      process.exit(1)
    }
    
    console.log(`User ${username} verified successfully`)
  } catch (error: any) {
    console.error('Error verifying user:', error.message)
    process.exit(1)
  }
}

verifyUser()