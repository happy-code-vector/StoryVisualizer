/**
 * Narrative Intelligence Engine
 * 
 * Core differentiator for Aurora Studio - analyzes story structure,
 * provides pacing recommendations, and generates narrative coaching suggestions.
 */

export interface Scene {
  id: number
  title: string
  description: string
  characters: string[]
  duration?: number
  setting?: string
  mood?: string
  imageUrl?: string
  videoUrl?: string
}

export interface StoryArc {
  acts: {
    act1: { start: number; end: number; scenes: number[]; description: string }
    act2: { start: number; end: number; scenes: number[]; description: string }
    act3: { start: number; end: number; scenes: number[]; description: string }
  }
  beats: {
    hook?: number
    incitingIncident?: number
    risingAction: number[]
    midpoint?: number
    crisis?: number
    climax?: number
    resolution?: number
  }
  pacing: {
    totalDuration: number
    sceneDistribution: { sceneId: number; suggestedDuration: number; beatType: string }[]
  }
}

export interface NarrativeCoachSuggestion {
  type: 'pacing' | 'tension' | 'character' | 'structure' | 'emotion'
  severity: 'info' | 'warning' | 'critical'
  sceneId?: number
  message: string
  suggestion: string
  actionable: boolean
}

export interface TensionCurve {
  sceneId: number
  tensionLevel: number // 0-10
  emotionalPeak: boolean
}

export class NarrativeEngine {
  /**
   * Analyze story structure and identify 3-act structure
   */
  async analyzeStoryArc(scenes: Scene[]): Promise<StoryArc> {
    const totalScenes = scenes.length
    
    // Basic 3-act structure heuristics
    // Act 1: ~25% (setup)
    // Act 2: ~50% (confrontation)
    // Act 3: ~25% (resolution)
    
    const act1End = Math.floor(totalScenes * 0.25)
    const act2End = Math.floor(totalScenes * 0.75)
    
    const act1Scenes = scenes.slice(0, act1End).map(s => s.id)
    const act2Scenes = scenes.slice(act1End, act2End).map(s => s.id)
    const act3Scenes = scenes.slice(act2End).map(s => s.id)
    
    // Identify key beats
    const hook = scenes[0]?.id
    const incitingIncident = scenes[Math.min(2, totalScenes - 1)]?.id
    const midpoint = scenes[Math.floor(totalScenes / 2)]?.id
    const crisis = scenes[Math.max(0, act2End - 1)]?.id
    const climax = scenes[Math.max(0, totalScenes - 2)]?.id
    const resolution = scenes[totalScenes - 1]?.id
    
    // Identify rising action scenes (between inciting incident and midpoint)
    const risingActionStart = Math.min(3, totalScenes - 1)
    const risingActionEnd = Math.floor(totalScenes / 2)
    const risingAction = scenes
      .slice(risingActionStart, risingActionEnd)
      .map(s => s.id)
    
    // Calculate scene durations based on pacing
    const sceneDistribution = await this.suggestSceneDurations(scenes)
    
    return {
      acts: {
        act1: {
          start: 0,
          end: act1End,
          scenes: act1Scenes,
          description: 'Setup - Introduce characters, world, and conflict'
        },
        act2: {
          start: act1End,
          end: act2End,
          scenes: act2Scenes,
          description: 'Confrontation - Rising tension, obstacles, character growth'
        },
        act3: {
          start: act2End,
          end: totalScenes,
          scenes: act3Scenes,
          description: 'Resolution - Climax and conclusion'
        }
      },
      beats: {
        hook,
        incitingIncident,
        risingAction,
        midpoint,
        crisis,
        climax,
        resolution
      },
      pacing: {
        totalDuration: sceneDistribution.reduce((sum, s) => sum + s.suggestedDuration, 0),
        sceneDistribution
      }
    }
  }

  /**
   * Calculate tension curve across all scenes
   */
  async calculateTensionCurve(scenes: Scene[]): Promise<TensionCurve[]> {
    const totalScenes = scenes.length
    const curve: TensionCurve[] = []
    
    scenes.forEach((scene, index) => {
      // Tension curve follows typical story arc
      // Low at start, builds through Act 2, peaks near climax, drops at resolution
      
      const position = index / totalScenes
      let tensionLevel: number
      
      if (position < 0.25) {
        // Act 1: Gradual rise from 2 to 5
        tensionLevel = 2 + (position / 0.25) * 3
      } else if (position < 0.75) {
        // Act 2: Rise from 5 to 9
        tensionLevel = 5 + ((position - 0.25) / 0.5) * 4
      } else {
        // Act 3: Peak at 10, then drop to 3
        const act3Position = (position - 0.75) / 0.25
        if (act3Position < 0.3) {
          tensionLevel = 9 + act3Position * 3.33 // Peak at 10
        } else {
          tensionLevel = 10 - ((act3Position - 0.3) / 0.7) * 7 // Drop to 3
        }
      }
      
      // Identify emotional peaks (top 20% of tension)
      const emotionalPeak = tensionLevel >= 8
      
      curve.push({
        sceneId: scene.id,
        tensionLevel: Math.round(tensionLevel),
        emotionalPeak
      })
    })
    
    return curve
  }

  /**
   * Generate narrative coaching suggestions
   */
  async generateCoachingSuggestions(
    scenes: Scene[],
    arc: StoryArc
  ): Promise<NarrativeCoachSuggestion[]> {
    const suggestions: NarrativeCoachSuggestion[] = []
    const totalScenes = scenes.length
    
    // Check for pacing issues
    if (totalScenes < 3) {
      suggestions.push({
        type: 'structure',
        severity: 'warning',
        message: 'Story is very short',
        suggestion: 'Consider adding more scenes to develop your narrative arc. Aim for at least 5-7 scenes for a complete story.',
        actionable: true
      })
    }
    
    if (totalScenes > 30) {
      suggestions.push({
        type: 'pacing',
        severity: 'info',
        message: 'Story has many scenes',
        suggestion: 'Consider breaking this into multiple episodes or tightening the narrative by combining similar scenes.',
        actionable: true
      })
    }
    
    // Check Act 2 length (should be ~50% of story)
    const act2Length = arc.acts.act2.scenes.length
    const act2Percentage = act2Length / totalScenes
    
    if (act2Percentage < 0.35) {
      suggestions.push({
        type: 'structure',
        severity: 'warning',
        message: 'Act 2 is too short',
        suggestion: 'Your confrontation/development section needs more depth. Add scenes that build tension and develop character relationships.',
        actionable: true
      })
    }
    
    if (act2Percentage > 0.65) {
      suggestions.push({
        type: 'pacing',
        severity: 'warning',
        message: 'Act 2 is too long',
        suggestion: 'Tighten Act 2 by removing redundant scenes or combining similar moments. The middle section is dragging.',
        actionable: true
      })
    }
    
    // Check for character distribution
    const characterAppearances = new Map<string, number>()
    scenes.forEach(scene => {
      scene.characters.forEach(char => {
        characterAppearances.set(char, (characterAppearances.get(char) || 0) + 1)
      })
    })
    
    // Warn about underutilized characters
    characterAppearances.forEach((count, character) => {
      if (count === 1 && totalScenes > 5) {
        suggestions.push({
          type: 'character',
          severity: 'info',
          message: `Character "${character}" appears in only one scene`,
          suggestion: `Consider developing ${character}'s role or removing them if they're not essential to the story.`,
          actionable: true
        })
      }
    })
    
    // Check for emotional peaks
    const tensionCurve = await this.calculateTensionCurve(scenes)
    const peakCount = tensionCurve.filter(t => t.emotionalPeak).length
    
    if (peakCount === 0) {
      suggestions.push({
        type: 'emotion',
        severity: 'critical',
        message: 'No emotional peaks detected',
        suggestion: 'Your story needs moments of high tension or emotion. Add conflict, stakes, or dramatic reveals.',
        actionable: true
      })
    }
    
    // Check pacing variety
    const durations = arc.pacing.sceneDistribution.map(s => s.suggestedDuration)
    const avgDuration = durations.reduce((a, b) => a + b, 0) / durations.length
    const variance = durations.every(d => Math.abs(d - avgDuration) < 2)
    
    if (variance && totalScenes > 5) {
      suggestions.push({
        type: 'pacing',
        severity: 'info',
        message: 'All scenes have similar duration',
        suggestion: 'Vary scene lengths for better pacing. Use shorter scenes for action/tension, longer scenes for emotional moments.',
        actionable: true
      })
    }
    
    return suggestions
  }

  /**
   * Suggest scene durations based on narrative position and content
   */
  async suggestSceneDurations(scenes: Scene[]): Promise<Array<{
    sceneId: number
    suggestedDuration: number
    beatType: string
  }>> {
    const totalScenes = scenes.length
    
    // Calculate beats without recursion
    const act1End = Math.floor(totalScenes * 0.25)
    const act2End = Math.floor(totalScenes * 0.75)
    
    const hook = scenes[0]?.id
    const incitingIncident = scenes[Math.min(2, totalScenes - 1)]?.id
    const midpoint = scenes[Math.floor(totalScenes / 2)]?.id
    const crisis = scenes[Math.max(0, act2End - 1)]?.id
    const climax = scenes[Math.max(0, totalScenes - 2)]?.id
    const resolution = scenes[totalScenes - 1]?.id
    
    const risingActionStart = Math.min(3, totalScenes - 1)
    const risingActionEnd = Math.floor(totalScenes / 2)
    const risingAction = scenes.slice(risingActionStart, risingActionEnd).map(s => s.id)
    
    return scenes.map((scene, index) => {
      const position = index / totalScenes
      let suggestedDuration = 5 // Default 5 seconds
      let beatType = 'scene'
      
      // Determine beat type
      if (scene.id === hook) {
        beatType = 'hook'
        suggestedDuration = 3 // Quick hook
      } else if (scene.id === incitingIncident) {
        beatType = 'inciting_incident'
        suggestedDuration = 6
      } else if (risingAction.includes(scene.id)) {
        beatType = 'rising_action'
        suggestedDuration = 5
      } else if (scene.id === midpoint) {
        beatType = 'midpoint'
        suggestedDuration = 7 // Important turning point
      } else if (scene.id === crisis) {
        beatType = 'crisis'
        suggestedDuration = 6
      } else if (scene.id === climax) {
        beatType = 'climax'
        suggestedDuration = 8 // Longest scene - climax needs time
      } else if (scene.id === resolution) {
        beatType = 'resolution'
        suggestedDuration = 5
      }
      
      // Adjust based on description length (more content = more time)
      const descriptionLength = scene.description?.length || 0
      if (descriptionLength > 200) {
        suggestedDuration += 2
      } else if (descriptionLength > 400) {
        suggestedDuration += 4
      }
      
      // Adjust based on character count (more characters = more time)
      if (scene.characters.length > 2) {
        suggestedDuration += 1
      }
      
      return {
        sceneId: scene.id,
        suggestedDuration: Math.min(suggestedDuration, 15), // Cap at 15 seconds
        beatType
      }
    })
  }

  /**
   * Detect emotional peaks for thumbnail generation
   */
  async detectEmotionalPeaks(scenes: Scene[]): Promise<number[]> {
    const tensionCurve = await this.calculateTensionCurve(scenes)
    return tensionCurve
      .filter(t => t.emotionalPeak)
      .map(t => t.sceneId)
  }

  /**
   * Get beat type for a scene based on its position in the story
   */
  getBeatType(sceneIndex: number, totalScenes: number): string {
    const position = sceneIndex / totalScenes
    
    if (sceneIndex === 0) return 'hook'
    if (sceneIndex <= 2) return 'inciting_incident'
    if (position < 0.25) return 'setup'
    if (position < 0.5) return 'rising_action'
    if (Math.abs(position - 0.5) < 0.05) return 'midpoint'
    if (position < 0.75) return 'rising_action'
    if (position < 0.85) return 'crisis'
    if (sceneIndex === totalScenes - 2) return 'climax'
    if (sceneIndex === totalScenes - 1) return 'resolution'
    
    return 'scene'
  }

  /**
   * Analyze if story needs more development in specific areas
   */
  async analyzeStoryCompleteness(scenes: Scene[]): Promise<{
    hasHook: boolean
    hasConflict: boolean
    hasResolution: boolean
    characterDevelopment: 'weak' | 'moderate' | 'strong'
    overallScore: number
  }> {
    const arc = await this.analyzeStoryArc(scenes)
    
    const hasHook = !!arc.beats.hook
    const hasConflict = arc.beats.risingAction.length > 0
    const hasResolution = !!arc.beats.resolution
    
    // Analyze character development
    const characterAppearances = new Map<string, number>()
    scenes.forEach(scene => {
      scene.characters.forEach(char => {
        characterAppearances.set(char, (characterAppearances.get(char) || 0) + 1)
      })
    })
    
    const avgAppearances = Array.from(characterAppearances.values())
      .reduce((a, b) => a + b, 0) / characterAppearances.size
    
    let characterDevelopment: 'weak' | 'moderate' | 'strong'
    if (avgAppearances < 2) {
      characterDevelopment = 'weak'
    } else if (avgAppearances < 4) {
      characterDevelopment = 'moderate'
    } else {
      characterDevelopment = 'strong'
    }
    
    // Calculate overall score (0-100)
    let score = 0
    if (hasHook) score += 20
    if (hasConflict) score += 30
    if (hasResolution) score += 20
    if (characterDevelopment === 'strong') score += 30
    else if (characterDevelopment === 'moderate') score += 15
    
    return {
      hasHook,
      hasConflict,
      hasResolution,
      characterDevelopment,
      overallScore: score
    }
  }
}

// Export singleton instance
export const narrativeEngine = new NarrativeEngine()
