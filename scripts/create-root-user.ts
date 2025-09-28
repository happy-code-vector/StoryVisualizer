import { createClient } from '@supabase/supabase-js'
import bcrypt from 'bcryptjs'
import dotenv from 'dotenv'

// Load environment variables
dotenv.config()

// Initialize Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL || '',
  process.env.SUPABASE_API_KEY || ''
)

async function createRootUser() {
  const username = process.argv[2]
  const password = process.argv[3]
  
  if (!username || !password) {
    console.error('Usage: npm run create-root-user <username> <password>')
    process.exit(1)
  }
  
  try {
    // Hash the password
    const saltRounds = 10
    const passwordHash = await bcrypt.hash(password, saltRounds)
    
    // Insert the root user
    const { data, error } = await supabase
      .from('users')
      .insert([
        {
          username,
          password_hash: passwordHash,
          role: 'root',
          verified: true // Root users are automatically verified
        }
      ])
      .select()
    
    if (error) {
      throw new Error(error.message)
    }
    
    console.log(`Root user ${username} created successfully with ID: ${data[0].id}`)
  } catch (error: any) {
    console.error('Error creating root user:', error.message)
    process.exit(1)
  }
}

createRootUser()