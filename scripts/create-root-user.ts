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
  try {
    const username = 'admin'
    const password = 'admin123'
    const role = 'root'
    
    // Check if user already exists
    const { data: existingUser, error: fetchError } = await supabase
      .from('users')
      .select('*')
      .eq('username', username)
      .single()
    
    if (existingUser) {
      console.log('Root user already exists:')
      console.log('Username:', existingUser.username)
      console.log('Role:', existingUser.role)
      return
    }
    
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
          role
        }
      ])
      .select()
      .single()
    
    if (error) {
      console.error('Error creating root user:', error)
      return
    }
    
    console.log('Root user created successfully:')
    console.log('Username:', data.username)
    console.log('Password:', password)
    console.log('Role:', data.role)
  } catch (error) {
    console.error('Error creating root user:', error)
  }
}

createRootUser()