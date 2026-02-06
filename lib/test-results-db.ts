import { createClient } from '@supabase/supabase-js'

// Initialize Supabase client for server-side use
const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseKey = process.env.SUPABASE_API_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables for test-results-db')
}

export const supabase = createClient(supabaseUrl, supabaseKey)

export interface TestResult {
  id?: number
  type: 'image' | 'video'
  url: string
  prompt?: string
  model?: string
  created_at?: string
}

export async function createTestResult(result: Omit<TestResult, 'id' | 'created_at'>): Promise<number | null> {
  try {
    const { data, error } = await supabase
      .from('test_results')
      .insert([
        {
          type: result.type,
          url: result.url,
          prompt: result.prompt || null,
          model: result.model || null
        }
      ])
      .select()

    if (error) {
      console.error('[TestResultsDB] Error creating test result:', error)
      return null
    }

    return data[0]?.id || null
  } catch (error) {
    console.error('[TestResultsDB] Error creating test result:', error)
    return null
  }
}

export async function getAllTestResults(limit?: number): Promise<TestResult[]> {
  try {
    let query = supabase
      .from('test_results')
      .select('*')
      .order('created_at', { ascending: false })

    if (limit) {
      query = query.limit(limit)
    }

    const { data, error } = await query

    if (error) {
      console.error('[TestResultsDB] Error fetching test results:', error)
      return []
    }

    console.log('[TestResultsDB] Fetched test results:', data?.length || 0, 'items')
    return data || []
  } catch (error) {
    console.error('[TestResultsDB] Error fetching test results:', error)
    return []
  }
}

export async function getTestResultsByType(type: 'image' | 'video', limit?: number): Promise<TestResult[]> {
  try {
    let query = supabase
      .from('test_results')
      .select('*')
      .eq('type', type)
      .order('created_at', { ascending: false })

    if (limit) {
      query = query.limit(limit)
    }

    const { data, error } = await query

    if (error) {
      console.error('[TestResultsDB] Error fetching test results by type:', error)
      return []
    }

    return data || []
  } catch (error) {
    console.error('[TestResultsDB] Error fetching test results by type:', error)
    return []
  }
}

export async function deleteTestResult(id: number): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('test_results')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('[TestResultsDB] Error deleting test result:', error)
      return false
    }

    return true
  } catch (error) {
    console.error('[TestResultsDB] Error deleting test result:', error)
    return false
  }
}

export async function deleteAllTestResults(): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('test_results')
      .delete()

    if (error) {
      console.error('[TestResultsDB] Error deleting all test results:', error)
      return false
    }

    return true
  } catch (error) {
    console.error('[TestResultsDB] Error deleting all test results:', error)
    return false
  }
}

export default supabase
