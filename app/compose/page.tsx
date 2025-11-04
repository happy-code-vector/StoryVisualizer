"use client"

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ScriptComposer } from '@/components/ScriptComposer'
import { Button } from '@/components/ui/button'
import { ArrowLeft, ArrowRight } from 'lucide-react'

export default function ComposePage() {
  const router = useRouter()
  const [storyData, setStoryData] = useState<any>(null)
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
    const stored = sessionStorage.getItem('storyAnalysis')
    if (stored) {
      setStoryData(JSON.parse(stored))
    } else {
      router.push('/story')
    }
  }, [router])

  const handleRevise = async (action: string, sceneId?: number) => {
    console.log('Revision requested:', action, sceneId)
    // TODO: Implement revision logic with OpenAI
    // For now, just show a message
    alert(`Revision "${action}" will be implemented in the next update!`)
  }

  const handleAnalyze = async () => {
    // Re-analyze the story
    router.push('/story')
  }

  const handleContinue = () => {
    router.push('/visualize')
  }

  if (!isClient || !storyData) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0 grid-pattern animate-grid opacity-30" />

      <div className="relative z-10 container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Button 
              variant="outline" 
              onClick={() => router.push('/story')}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Story
            </Button>
            <h1 className="text-3xl font-bold gradient-text">
              {storyData.title || 'Compose Your Story'}
            </h1>
          </div>
          <Button onClick={handleContinue} className="flex items-center gap-2">
            Continue to Visualize
            <ArrowRight className="w-4 h-4" />
          </Button>
        </div>

        {/* Script Composer */}
        <ScriptComposer
          initialStory={storyData.story || ''}
          scenes={storyData.analysis?.scenes || []}
          storyArc={storyData.storyArc}
          narrativeSuggestions={storyData.narrativeSuggestions}
          onRevise={handleRevise}
          onAnalyze={handleAnalyze}
        />
      </div>
    </div>
  )
}
