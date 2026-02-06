import { NextRequest, NextResponse } from 'next/server'
import { getRequestStatus } from '@/lib/video-request-store'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const requestId = searchParams.get('requestId')

    if (!requestId) {
      return NextResponse.json(
        { error: 'RequestId is required' },
        { status: 400 }
      )
    }

    const status = getRequestStatus(requestId)

    if (!status) {
      return NextResponse.json(
        { error: 'Request not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      ...status
    })

  } catch (error: any) {
    console.error('[VideoStatus] Error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch video status' },
      { status: 500 }
    )
  }
}
