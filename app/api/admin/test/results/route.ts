import { NextRequest, NextResponse } from 'next/server'
import { getAllTestResults, deleteTestResult, deleteAllTestResults } from '@/lib/test-results-db'

// GET /api/admin/test/results - Fetch all test results
export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const authHeader = request.headers.get('authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Fetch all test results, most recent first, limited to 100
    const results = getAllTestResults(100)

    return NextResponse.json({
      success: true,
      results
    })

  } catch (error: any) {
    console.error('[TestResults] Error fetching results:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch test results' },
      { status: 500 }
    )
  }
}

// DELETE /api/admin/test/results - Delete all test results
export async function DELETE(request: NextRequest) {
  try {
    // Check authentication
    const authHeader = request.headers.get('authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (id) {
      // Delete specific result
      deleteTestResult(parseInt(id))
      return NextResponse.json({
        success: true,
        message: 'Test result deleted'
      })
    } else {
      // Delete all results
      deleteAllTestResults()
      return NextResponse.json({
        success: true,
        message: 'All test results deleted'
      })
    }

  } catch (error: any) {
    console.error('[TestResults] Error deleting results:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to delete test results' },
      { status: 500 }
    )
  }
}
