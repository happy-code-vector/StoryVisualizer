/**
 * Cost Estimation API
 * 
 * Estimates rendering costs before generation and checks user quotas.
 */

import { NextRequest, NextResponse } from 'next/server'
import { costTracker, estimateStoryCost, SUBSCRIPTION_TIERS } from '@/lib/cost-tracking'

export async function POST(request: NextRequest) {
  try {
    const { 
      numCharacters, 
      numScenes, 
      includeVideos = false,
      includeVoice = false,
      avgSceneDuration = 5,
      premiumVoice = false,
      userId
    } = await request.json()
    
    if (!numCharacters || !numScenes) {
      return NextResponse.json(
        { error: 'Invalid request: numCharacters and numScenes required' },
        { status: 400 }
      )
    }
    
    // Estimate costs
    const estimate = await estimateStoryCost(numCharacters, numScenes, {
      includeVideos,
      includeVoice,
      avgSceneDuration,
      premiumVoice
    })
    
    // Check user quota if userId provided
    let quota = null
    if (userId) {
      quota = await costTracker.checkQuota(userId)
    }
    
    return NextResponse.json({
      estimate,
      quota,
      breakdown: {
        characterImages: {
          count: numCharacters,
          costPerUnit: 0.02,
          total: estimate.characterImages
        },
        sceneImages: {
          count: numScenes,
          costPerUnit: 0.02,
          total: estimate.sceneImages
        },
        videos: includeVideos ? {
          count: numScenes,
          durationPerScene: avgSceneDuration,
          costPerSecond: 0.05,
          total: estimate.videos
        } : null,
        voice: includeVoice ? {
          count: numScenes,
          provider: premiumVoice ? 'ElevenLabs' : 'Azure Speech',
          total: estimate.voice
        } : null,
        subtitles: includeVoice ? {
          total: estimate.subtitles
        } : null
      },
      renderMinutes: estimate.renderMinutes,
      canAfford: quota ? quota.minutesRemaining >= estimate.renderMinutes : null
    })
  } catch (error: any) {
    console.error('[CostEstimate] Error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to estimate costs' },
      { status: 500 }
    )
  }
}

// GET endpoint - return pricing tiers
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const userId = searchParams.get('userId')
  
  try {
    let currentQuota = null
    let usageStats = null
    
    if (userId) {
      currentQuota = await costTracker.checkQuota(parseInt(userId))
      usageStats = await costTracker.getUserUsageStats(parseInt(userId), 30)
    }
    
    // Calculate margin analysis for each tier
    const tierAnalysis = Object.entries(SUBSCRIPTION_TIERS).map(([tier, data]) => ({
      tier,
      ...data,
      marginAnalysis: costTracker.getMarginAnalysis(tier as keyof typeof SUBSCRIPTION_TIERS)
    }))
    
    return NextResponse.json({
      tiers: tierAnalysis,
      currentQuota,
      usageStats,
      costConstants: {
        imagePerUnit: 0.02,
        videoPerSecond: 0.05,
        voicePerMinute: {
          premium: 0.30,
          standard: 0.016
        },
        subtitlesPerMinute: 0.006
      }
    })
  } catch (error: any) {
    console.error('[CostEstimate] Error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to get pricing info' },
      { status: 500 }
    )
  }
}
