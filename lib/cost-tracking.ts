/**
 * Cost Tracking Service
 * 
 * Tracks rendering costs, estimates expenses, and enforces usage quotas
 * to maintain 40-50% gross margin target.
 */

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

export interface CostEstimate {
  characterImages: number
  sceneImages: number
  videos: number
  voice: number
  subtitles: number
  total: number
  renderMinutes: number
}

export interface UsageQuota {
  allowed: boolean
  minutesRemaining: number
  minutesUsed: number
  monthlyLimit: number
  overageRate: number
  tier: string
}

export interface RenderJobCost {
  jobId: number
  userId: number
  jobType: string
  costUsd: number
  renderMinutes: number
  timestamp: Date
}

/**
 * Cost constants (based on Aurora PRD economics)
 * Target: ~$10 COGS per 60-min video
 */
export const COST_CONSTANTS = {
  // Image generation (batch pricing)
  IMAGE_COST_PER_UNIT: 0.02, // $0.02 per image (batch Nano Banana / SeaDream)
  
  // Video generation
  VIDEO_COST_PER_SECOND: 0.05, // $0.05 per second (~$3 per minute)
  
  // Voice synthesis
  VOICE_COST_PER_1K_CHARS: 0.30, // ElevenLabs pricing
  VOICE_COST_PER_1K_CHARS_BUDGET: 0.016, // Azure Speech pricing
  
  // Subtitles (Whisper API)
  SUBTITLE_COST_PER_MINUTE: 0.006, // $0.006 per minute
  
  // OpenAI analysis
  OPENAI_COST_PER_1K_TOKENS: 0.002, // GPT-4 pricing
  
  // Estimated tokens per story analysis
  STORY_ANALYSIS_TOKENS: 2000, // ~2K tokens for analysis
  
  // Render minutes conversion
  SECONDS_PER_RENDER_MINUTE: 60
}

/**
 * Subscription tier limits (from Aurora PRD)
 */
export const SUBSCRIPTION_TIERS = {
  free: {
    monthlyMinutes: 0,
    overageRate: 0.25,
    price: 0
  },
  starter: {
    monthlyMinutes: 180, // ~3 videos @ 60 min each
    overageRate: 0.25,
    price: 49
  },
  creator: {
    monthlyMinutes: 360, // ~6 videos
    overageRate: 0.22,
    price: 99
  },
  pro: {
    monthlyMinutes: 1000, // ~16 videos
    overageRate: 0.20,
    price: 249
  },
  studio: {
    monthlyMinutes: 2400, // ~40 videos
    overageRate: 0.18,
    price: 499
  },
  enterprise: {
    monthlyMinutes: 6000, // 100+ videos
    overageRate: 0.15,
    price: 999
  }
}

export class CostTracker {
  /**
   * Estimate costs before generation
   */
  async estimateCosts(
    numCharacters: number,
    numScenes: number,
    generateVideos: boolean = false,
    generateVoice: boolean = false,
    avgSceneDuration: number = 5,
    usePremiun VoiceProvider: boolean = false
  ): Promise<CostEstimate> {
    // Character images
    const characterImagesCost = numCharacters * COST_CONSTANTS.IMAGE_COST_PER_UNIT
    
    // Scene images
    const sceneImagesCost = numScenes * COST_CONSTANTS.IMAGE_COST_PER_UNIT
    
    // Videos (if requested)
    const videosCost = generateVideos
      ? numScenes * avgSceneDuration * COST_CONSTANTS.VIDEO_COST_PER_SECOND
      : 0
    
    // Voice synthesis (if requested)
    // Estimate ~100 words per scene, ~5 chars per word = 500 chars per scene
    const voiceCostPerChar = usePremiumVoiceProvider
      ? COST_CONSTANTS.VOICE_COST_PER_1K_CHARS
      : COST_CONSTANTS.VOICE_COST_PER_1K_CHARS_BUDGET
    
    const voiceCost = generateVoice
      ? numScenes * 500 * (voiceCostPerChar / 1000)
      : 0
    
    // Subtitles (if voice is generated)
    const subtitlesCost = generateVoice
      ? numScenes * (avgSceneDuration / 60) * COST_CONSTANTS.SUBTITLE_COST_PER_MINUTE
      : 0
    
    // Story analysis (OpenAI)
    const analysisCost = (COST_CONSTANTS.STORY_ANALYSIS_TOKENS / 1000) * COST_CONSTANTS.OPENAI_COST_PER_1K_TOKENS
    
    const total = characterImagesCost + sceneImagesCost + videosCost + voiceCost + subtitlesCost + analysisCost
    
    // Calculate render minutes (for quota tracking)
    const totalDurationSeconds = numScenes * avgSceneDuration
    const renderMinutes = totalDurationSeconds / COST_CONSTANTS.SECONDS_PER_RENDER_MINUTE
    
    return {
      characterImages: characterImagesCost,
      sceneImages: sceneImagesCost,
      videos: videosCost,
      voice: voiceCost,
      subtitles: subtitlesCost,
      total: parseFloat(total.toFixed(4)),
      renderMinutes: parseFloat(renderMinutes.toFixed(2))
    }
  }

  /**
   * Track actual render job cost
   */
  async trackRenderJob(
    userId: number,
    renderJobId: number,
    jobType: string,
    costUsd: number,
    renderMinutes: number,
    storyId?: number
  ): Promise<void> {
    try {
      // Insert into usage_tracking table
      const { error: trackingError } = await supabase
        .from('usage_tracking')
        .insert({
          user_id: userId,
          render_job_id: renderJobId,
          story_id: storyId,
          render_minutes: renderMinutes,
          cost_usd: costUsd,
          job_type: jobType,
          timestamp: new Date().toISOString()
        })
      
      if (trackingError) {
        console.error('[CostTracker] Error tracking usage:', trackingError)
        throw trackingError
      }
      
      // Update subscription minutes_used
      const { error: subError } = await supabase.rpc('increment_minutes_used', {
        p_user_id: userId,
        p_minutes: renderMinutes
      })
      
      if (subError) {
        // If RPC doesn't exist, update directly
        const { data: subscription } = await supabase
          .from('subscriptions')
          .select('minutes_used')
          .eq('user_id', userId)
          .single()
        
        if (subscription) {
          await supabase
            .from('subscriptions')
            .update({ minutes_used: (subscription.minutes_used || 0) + renderMinutes })
            .eq('user_id', userId)
        }
      }
      
      console.log(`[CostTracker] Tracked ${renderMinutes} minutes ($${costUsd}) for user ${userId}`)
    } catch (error) {
      console.error('[CostTracker] Failed to track render job:', error)
      // Don't throw - tracking failure shouldn't block rendering
    }
  }

  /**
   * Check if user has quota remaining
   */
  async checkQuota(userId: number): Promise<UsageQuota> {
    try {
      const { data: subscription, error } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', userId)
        .single()
      
      if (error || !subscription) {
        // No subscription found - return free tier limits
        return {
          allowed: false,
          minutesRemaining: 0,
          minutesUsed: 0,
          monthlyLimit: 0,
          overageRate: SUBSCRIPTION_TIERS.free.overageRate,
          tier: 'free'
        }
      }
      
      const minutesUsed = subscription.minutes_used || 0
      const monthlyLimit = subscription.monthly_minutes_limit || 0
      const minutesRemaining = Math.max(0, monthlyLimit - minutesUsed)
      
      // Allow if within quota OR if overage is enabled (always allow with overage charges)
      const allowed = minutesRemaining > 0 || subscription.status === 'active'
      
      return {
        allowed,
        minutesRemaining,
        minutesUsed,
        monthlyLimit,
        overageRate: subscription.overage_rate || 0.25,
        tier: subscription.tier
      }
    } catch (error) {
      console.error('[CostTracker] Error checking quota:', error)
      // On error, deny access
      return {
        allowed: false,
        minutesRemaining: 0,
        minutesUsed: 0,
        monthlyLimit: 0,
        overageRate: 0.25,
        tier: 'unknown'
      }
    }
  }

  /**
   * Calculate overage charges for current period
   */
  async calculateOverage(userId: number): Promise<number> {
    try {
      const quota = await this.checkQuota(userId)
      
      if (quota.minutesUsed <= quota.monthlyLimit) {
        return 0 // No overage
      }
      
      const overageMinutes = quota.minutesUsed - quota.monthlyLimit
      const overageCharges = overageMinutes * quota.overageRate
      
      return parseFloat(overageCharges.toFixed(2))
    } catch (error) {
      console.error('[CostTracker] Error calculating overage:', error)
      return 0
    }
  }

  /**
   * Get usage statistics for a user
   */
  async getUserUsageStats(userId: number, periodDays: number = 30): Promise<{
    totalMinutes: number
    totalCost: number
    jobCount: number
    byType: Record<string, { minutes: number; cost: number; count: number }>
  }> {
    try {
      const startDate = new Date()
      startDate.setDate(startDate.getDate() - periodDays)
      
      const { data: usage, error } = await supabase
        .from('usage_tracking')
        .select('*')
        .eq('user_id', userId)
        .gte('timestamp', startDate.toISOString())
      
      if (error || !usage) {
        return {
          totalMinutes: 0,
          totalCost: 0,
          jobCount: 0,
          byType: {}
        }
      }
      
      const totalMinutes = usage.reduce((sum, u) => sum + (u.render_minutes || 0), 0)
      const totalCost = usage.reduce((sum, u) => sum + (u.cost_usd || 0), 0)
      const jobCount = usage.length
      
      // Group by job type
      const byType: Record<string, { minutes: number; cost: number; count: number }> = {}
      usage.forEach(u => {
        const type = u.job_type || 'unknown'
        if (!byType[type]) {
          byType[type] = { minutes: 0, cost: 0, count: 0 }
        }
        byType[type].minutes += u.render_minutes || 0
        byType[type].cost += u.cost_usd || 0
        byType[type].count += 1
      })
      
      return {
        totalMinutes: parseFloat(totalMinutes.toFixed(2)),
        totalCost: parseFloat(totalCost.toFixed(4)),
        jobCount,
        byType
      }
    } catch (error) {
      console.error('[CostTracker] Error getting usage stats:', error)
      return {
        totalMinutes: 0,
        totalCost: 0,
        jobCount: 0,
        byType: {}
      }
    }
  }

  /**
   * Calculate gross margin for a given revenue and cost
   */
  calculateMargin(revenue: number, costs: number): number {
    if (revenue === 0) return 0
    const margin = ((revenue - costs) / revenue) * 100
    return parseFloat(margin.toFixed(2))
  }

  /**
   * Get target margin analysis for subscription tier
   */
  getMarginAnalysis(tier: keyof typeof SUBSCRIPTION_TIERS): {
    monthlyRevenue: number
    estimatedCOGS: number
    grossMargin: number
    targetMargin: number
    meetsTarget: boolean
  } {
    const tierData = SUBSCRIPTION_TIERS[tier]
    const monthlyRevenue = tierData.price
    
    // Estimate COGS: ~$10 per 60 minutes of video
    const estimatedCOGS = (tierData.monthlyMinutes / 60) * 10
    
    const grossMargin = this.calculateMargin(monthlyRevenue, estimatedCOGS)
    const targetMargin = 42 // 42% target from PRD
    const meetsTarget = grossMargin >= targetMargin
    
    return {
      monthlyRevenue,
      estimatedCOGS: parseFloat(estimatedCOGS.toFixed(2)),
      grossMargin,
      targetMargin,
      meetsTarget
    }
  }

  /**
   * Create or update user subscription
   */
  async createSubscription(
    userId: number,
    tier: keyof typeof SUBSCRIPTION_TIERS,
    stripeCustomerId?: string,
    stripeSubscriptionId?: string
  ): Promise<void> {
    try {
      const tierData = SUBSCRIPTION_TIERS[tier]
      const now = new Date()
      const periodEnd = new Date(now)
      periodEnd.setMonth(periodEnd.getMonth() + 1)
      
      const { error } = await supabase
        .from('subscriptions')
        .upsert({
          user_id: userId,
          tier,
          status: 'active',
          monthly_minutes_limit: tierData.monthlyMinutes,
          minutes_used: 0,
          overage_rate: tierData.overageRate,
          stripe_customer_id: stripeCustomerId,
          stripe_subscription_id: stripeSubscriptionId,
          current_period_start: now.toISOString(),
          current_period_end: periodEnd.toISOString(),
          updated_at: now.toISOString()
        }, {
          onConflict: 'user_id'
        })
      
      if (error) {
        console.error('[CostTracker] Error creating subscription:', error)
        throw error
      }
      
      console.log(`[CostTracker] Created ${tier} subscription for user ${userId}`)
    } catch (error) {
      console.error('[CostTracker] Failed to create subscription:', error)
      throw error
    }
  }
}

// Export singleton instance
export const costTracker = new CostTracker()

// Export helper function for quick cost estimation
export async function estimateStoryCost(
  numCharacters: number,
  numScenes: number,
  options: {
    includeVideos?: boolean
    includeVoice?: boolean
    avgSceneDuration?: number
    premiumVoice?: boolean
  } = {}
): Promise<CostEstimate> {
  const tracker = new CostTracker()
  return tracker.estimateCosts(
    numCharacters,
    numScenes,
    options.includeVideos ?? false,
    options.includeVoice ?? false,
    options.avgSceneDuration ?? 5,
    options.premiumVoice ?? false
  )
}
