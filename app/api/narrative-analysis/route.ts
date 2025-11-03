/**
 * Narrative Analysis API
 * 
 * Analyzes story structure, provides pacing recommendations,
 * and generates narrative coaching suggestions.
 */

import { NextRequest, NextResponse } from 'next/server'
import { narrativeEngine, Scene } from '@/lib/narrative-engine'

export async function POST(request: NextRequest) {
  try {
    const { scenes, action } = await request.json()
    
    if (!scenes || !Array.isArray(scenes)) {
      return NextResponse.json(
        { error: 'Invalid request: scenes array required' },
        { status: 400 }
      )
    }
    
    // Validate scenes have required fields
    const validScenes: Scene[] = scenes.map((scene: any) => ({
      id: scene.id || 0,
      title: scene.title || '',
      description: scene.description || '',
      characters: scene.characters || [],
      duration: scene.duration,
      setting: scene.setting,
      mood: scene.mood,
      imageUrl: scene.imageUrl,
      videoUrl: scene.videoUrl
    }))
    
    // Perform requested analysis
    switch (action) {
      case 'analyze_arc': {
        const arc = await narrativeEngine.analyzeStoryArc(validScenes)
        return NextResponse.json({ arc })
      }
      
      case 'tension_curve': {
        const tensionCurve = await narrativeEngine.calculateTensionCurve(validScenes)
        return NextResponse.json({ tensionCurve })
      }
      
      case 'coaching': {
        const arc = await narrativeEngine.analyzeStoryArc(validScenes)
        const suggestions = await narrativeEngine.generateCoachingSuggestions(validScenes, arc)
        return NextResponse.json({ suggestions })
      }
      
      case 'scene_durations': {
        const durations = await narrativeEngine.suggestSceneDurations(validScenes)
        return NextResponse.json({ durations })
      }
      
      case 'emotional_peaks': {
        const peaks = await narrativeEngine.detectEmotionalPeaks(validScenes)
        return NextResponse.json({ peaks })
      }
      
      case 'completeness': {
        const completeness = await narrativeEngine.analyzeStoryCompleteness(validScenes)
        return NextResponse.json({ completeness })
      }
      
      case 'full_analysis': {
        // Perform complete analysis
        const arc = await narrativeEngine.analyzeStoryArc(validScenes)
        const tensionCurve = await narrativeEngine.calculateTensionCurve(validScenes)
        const suggestions = await narrativeEngine.generateCoachingSuggestions(validScenes, arc)
        const emotionalPeaks = await narrativeEngine.detectEmotionalPeaks(validScenes)
        const completeness = await narrativeEngine.analyzeStoryCompleteness(validScenes)
        
        return NextResponse.json({
          arc,
          tensionCurve,
          suggestions,
          emotionalPeaks,
          completeness
        })
      }
      
      default:
        return NextResponse.json(
          { error: 'Invalid action. Use: analyze_arc, tension_curve, coaching, scene_durations, emotional_peaks, completeness, or full_analysis' },
          { status: 400 }
        )
    }
  } catch (error: any) {
    console.error('[NarrativeAnalysis] Error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to analyze narrative' },
      { status: 500 }
    )
  }
}

// GET endpoint for testing
export async function GET(request: NextRequest) {
  return NextResponse.json({
    message: 'Narrative Analysis API',
    endpoints: {
      POST: {
        description: 'Analyze story narrative structure',
        body: {
          scenes: 'Array of scene objects',
          action: 'analyze_arc | tension_curve | coaching | scene_durations | emotional_peaks | completeness | full_analysis'
        }
      }
    },
    example: {
      scenes: [
        {
          id: 1,
          title: 'Opening Scene',
          description: 'Hero discovers mysterious artifact',
          characters: ['Hero', 'Mentor'],
          duration: 5
        }
      ],
      action: 'full_analysis'
    }
  })
}
