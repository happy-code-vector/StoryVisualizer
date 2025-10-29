import { createClient } from '@supabase/supabase-js'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'

// Initialize Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL || '',
  process.env.SUPABASE_API_KEY || ''
)

export type UserRole = 'root' | 'admin' | 'paid' | 'unpaid';

export interface User {
  id: number;
  username: string;
  role: UserRole;
  verified: boolean;
  created_at: string;
}

// JWT secret - in production, use a strong secret from environment variables
const JWT_SECRET = process.env.JWT_SECRET

if (!JWT_SECRET) {
  throw new Error('JWT_SECRET environment variable is required')
}

// Hash a password
export async function hashPassword(password: string): Promise<string> {
  const saltRounds = 10;
  return await bcrypt.hash(password, saltRounds);
}

// Verify a password
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return await bcrypt.compare(password, hash);
}

// Generate a JWT token
export function generateToken(user: { id: number; username: string; role: UserRole; verified: boolean }): string {
  return jwt.sign(
    { 
      id: user.id, 
      username: user.username, 
      role: user.role,
      verified: user.verified
    },
    JWT_SECRET,
    { expiresIn: '24h' }
  );
}

// Verify a JWT token
export function verifyToken(token: string): { id: number; username: string; role: UserRole; verified: boolean } | null {
  try {
    return jwt.verify(token, JWT_SECRET) as { id: number; username: string; role: UserRole; verified: boolean };
  } catch (error) {
    return null;
  }
}

// Get user by username
export async function getUserByUsername(username: string): Promise<User | null> {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('username', username)
      .single();
    
    if (error || !data) {
      return null;
    }
    
    return {
      id: data.id,
      username: data.username,
      role: data.role,
      verified: data.verified,
      created_at: data.created_at
    };
  } catch (error) {
    console.error('Error fetching user:', error);
    return null;
  }
}

// Get user by ID
export async function getUserById(id: number): Promise<User | null> {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error || !data) {
      return null;
    }
    
    return {
      id: data.id,
      username: data.username,
      role: data.role,
      verified: data.verified,
      created_at: data.created_at
    };
  } catch (error) {
    console.error('Error fetching user:', error);
    return null;
  }
}

// Create a new user
export async function createUser(username: string, password: string, role: UserRole = 'unpaid'): Promise<User | null> {
  try {
    // Check if user already exists
    const existingUser = await getUserByUsername(username);
    if (existingUser) {
      throw new Error('User already exists');
    }
    
    // Hash the password
    const passwordHash = await hashPassword(password);
    
    // Insert the new user
    const { data, error } = await supabase
      .from('users')
      .insert([
        {
          username,
          password_hash: passwordHash,
          role,
          verified: false // New users are not verified by default
        }
      ])
      .select()
      .single();
    
    if (error) {
      throw new Error(error.message);
    }
    
    return {
      id: data.id,
      username: data.username,
      role: data.role,
      verified: data.verified,
      created_at: data.created_at
    };
  } catch (error) {
    console.error('Error creating user:', error);
    return null;
  }
}

// Authenticate a user
export async function authenticateUser(username: string, password: string): Promise<{ user: User; token: string } | null> {
  try {
    // Get user by username
    const user = await getUserByUsername(username);
    if (!user) {
      return null;
    }
    
    // Check if user is verified
    if (!user.verified) {
      throw new Error('Account not verified. Please verify your account to log in.');
    }
    
    // Get the password hash from the database
    const { data, error } = await supabase
      .from('users')
      .select('password_hash')
      .eq('username', username)
      .single();
    
    if (error || !data) {
      return null;
    }
    
    // Verify password
    const isValid = await verifyPassword(password, data.password_hash);
    if (!isValid) {
      return null;
    }
    
    // Generate token
    const token = generateToken(user);
    
    return { user, token };
  } catch (error) {
    console.error('Error authenticating user:', error);
    return null;
  }
}

// Get the current user's role
export async function getCurrentUserRole(token: string): Promise<UserRole | null> {
  const decoded = verifyToken(token);
  if (!decoded) {
    return null;
  }
  
  const user = await getUserById(decoded.id);
  return user?.role || null;
}

// Check if user has admin access (root or admin roles)
export async function hasAdminAccess(token: string): Promise<boolean> {
  const role = await getCurrentUserRole(token);
  return role === 'root' || role === 'admin';
}

// Check if user is authenticated
export function isAuthenticated(token: string): boolean {
  return !!verifyToken(token);
}

// Get current user from token
export async function getCurrentUser(token: string): Promise<User | null> {
  const decoded = verifyToken(token);
  if (!decoded) {
    return null;
  }
  
  return await getUserById(decoded.id);
}

// Update user role (only root users can do this)
export async function updateUserRole(token: string, userId: number, newRole: UserRole): Promise<boolean> {
  try {
    const currentUserRole = await getCurrentUserRole(token);
    
    // Only root users can update roles
    if (currentUserRole !== 'root') {
      console.error('Only root users can update roles');
      return false;
    }
    
    const { error } = await supabase
      .from('users')
      .update({ role: newRole })
      .eq('id', userId);
    
    if (error) {
      console.error('Error updating user role:', error);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Error updating user role:', error);
    return false;
  }
}

// Verify a user's account (only root users can do this)
export async function verifyUser(token: string, userId: number): Promise<boolean> {
  try {
    const currentUserRole = await getCurrentUserRole(token);
    
    // Only root users can verify accounts
    if (currentUserRole !== 'root') {
      console.error('Only root users can verify accounts');
      return false;
    }
    
    const { error } = await supabase
      .from('users')
      .update({ verified: true })
      .eq('id', userId);
    
    if (error) {
      console.error('Error verifying user:', error);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Error verifying user:', error);
    return false;
  }
}