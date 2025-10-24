'use client'

import { useState, useEffect } from 'react'
import { IdeaInput } from '@/components/video-generator/idea-input'
import { StoryEditor } from '@/components/video-generator/story-editor'
import { VideoSettings } from '@/components/video-generator/video-settings'
import { GenerationProgress } from '@/components/video-generator/generation-progress'
import { VideoPreview } from '@/components/video-generator/video-preview'
import { Button } from '@/components/ui/button'
import { Lightbulb, FileText, Settings, Play, Eye, Check, ArrowLeft } from 'lucide-react'
import { cn } from '@/lib/utils'

const steps = [
  { id: 'idea', label: 'Idea', icon: Lightbulb, description: 'Start with your concept' },
  { id: 'story', label: 'Story', icon: FileText, description: 'Edit scenes' },
  { id: 'settings', label: 'Settings', icon: Settings, description: 'Configure video' },
  { id: 'generate', label: 'Generate', icon: Play, description: 'Create videos' },
  { id: 'preview', label: 'Preview', icon: Eye, description: 'View & download' },
]

const STORAGE_KEY = 'video-generator-state'

export default function VideoGeneratorPage() {
  const [activeStep, setActiveStep] = useState('idea')
  const [idea, setIdea] = useState('')
  const [story, setStory] = useState('')
  const [scenes, setScenes] = useState<any[]>([])
  const [context, setContext] = useState<any>(null)
  const [settings, setSettings] = useState({
    duration: 2,
    segmentLength: 5,
    style: 'cinematic',
    aspectRatio: '16:9',
    fps: 24,
    transitions: true
  })
  const [isGenerating, setIsGenerating] = useState(false)
  const [videoUrl, setVideoUrl] = useState<string | null>(null)
  const [cachedSegments, setCachedSegments] = useState<any[]>([])
  const [lastSettings, setLastSettings] = useState<any>(null)
  const [isLoaded, setIsLoaded] = useState(false)

  // Load state from localStorage on mount
  useEffect(() => {
    const savedState = localStorage.getItem(STORAGE_KEY)
    if (savedState) {
      try {
        const parsed = JSON.parse(savedState)
        setActiveStep(parsed.activeStep || 'idea')
        setIdea(parsed.idea || '')
        setStory(parsed.story || '')
        setScenes(parsed.scenes || [])
        setContext(parsed.context || null)
        setSettings(parsed.settings || settings)
        setVideoUrl(parsed.videoUrl || null)
        setCachedSegments(parsed.cachedSegments || [])
        setLastSettings(parsed.lastSettings || null)
      } catch (error) {
        console.error('Failed to load saved state:', error)
      }
    }
    setIsLoaded(true)
  }, [])

  // Save state to localStorage whenever it changes
  useEffect(() => {
    if (!isLoaded) return // Don't save until initial load is complete

    const stateToSave = {
      activeStep,
      idea,
      story,
      scenes,
      context,
      settings,
      videoUrl,
      cachedSegments,
      lastSettings,
      timestamp: Date.now()
    }

    localStorage.setItem(STORAGE_KEY, JSON.stringify(stateToSave))
  }, [activeStep, idea, story, scenes, context, settings, videoUrl, cachedSegments, lastSettings, isLoaded])

  const getStepStatus = (stepId: string) => {
    const stepIndex = steps.findIndex(s => s.id === stepId)
    const activeIndex = steps.findIndex(s => s.id === activeStep)

    if (stepIndex < activeIndex) return 'completed'
    if (stepIndex === activeIndex) return 'active'
    return 'upcoming'
  }

  const canAccessStep = (stepId: string) => {
    if (stepId === 'idea') return true
    if (stepId === 'story') return !!(story || idea)
    if (stepId === 'settings') return !!story
    if (stepId === 'generate') return !!story
    if (stepId === 'preview') return !!videoUrl
    return false
  }

  return (
    <div className="flex h-[calc(100vh-4rem)] overflow-hidden bg-background">
      {/* Left Sidebar - Vertical Stepper */}
      <div className="w-80 border-r bg-card flex flex-col">
        <div className="p-6 border-b">
          <h1 className="text-2xl font-bold mb-1">Video Generator</h1>
          <p className="text-sm text-muted-foreground">
            AI-powered video creation
          </p>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          <div className="space-y-2">
            {steps.map((step, index) => {
              const status = getStepStatus(step.id)
              const canAccess = canAccessStep(step.id)
              const Icon = step.icon

              return (
                <button
                  key={step.id}
                  onClick={() => canAccess && setActiveStep(step.id)}
                  disabled={!canAccess}
                  className={cn(
                    "w-full text-left p-4 rounded-lg transition-all duration-200",
                    "flex items-start gap-4 group relative",
                    status === 'active' && "bg-primary text-primary-foreground shadow-lg",
                    status === 'completed' && "bg-primary/10 hover:bg-primary/20",
                    status === 'upcoming' && !canAccess && "opacity-50 cursor-not-allowed",
                    status === 'upcoming' && canAccess && "hover:bg-muted",
                  )}
                >
                  {/* Step Number/Icon */}
                  <div className={cn(
                    "flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center",
                    "transition-all duration-200",
                    status === 'active' && "bg-primary-foreground text-primary",
                    status === 'completed' && "bg-primary text-primary-foreground",
                    status === 'upcoming' && "bg-muted text-muted-foreground",
                  )}>
                    {status === 'completed' ? (
                      <Check className="h-5 w-5" />
                    ) : (
                      <Icon className="h-5 w-5" />
                    )}
                  </div>

                  {/* Step Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-medium opacity-70">
                        Step {index + 1}
                      </span>
                    </div>
                    <div className="font-semibold mb-1">{step.label}</div>
                    <div className={cn(
                      "text-xs",
                      status === 'active' ? "opacity-90" : "opacity-60"
                    )}>
                      {step.description}
                    </div>
                  </div>

                  {/* Connector Line */}
                  {index < steps.length - 1 && (
                    <div className={cn(
                      "absolute left-[2.5rem] top-[4.5rem] w-0.5 h-6",
                      status === 'completed' ? "bg-primary" : "bg-border"
                    )} />
                  )}
                </button>
              )
            })}
          </div>
        </div>

        <div className="p-6 border-t text-xs text-muted-foreground space-y-3">
          <div className="space-y-1">
            <div>💡 Click steps to navigate</div>
            <div>✨ AI-powered generation</div>
            <div>💾 Auto-saved locally</div>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="w-full text-xs"
            onClick={() => {
              if (confirm('Clear all project data? This cannot be undone.')) {
                localStorage.removeItem(STORAGE_KEY)
                window.location.reload()
              }
            }}
          >
            Clear Project
          </Button>
        </div>
      </div>

      {/* Right Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="flex-1 overflow-y-auto">
          <div className="h-full">
            {activeStep === 'idea' && (
              <div className="h-full overflow-y-auto">
                <div className="max-w-6xl mx-auto p-8">
                  <IdeaInput
                    idea={idea}
                    setIdea={setIdea}
                    story={story}
                    setStory={setStory}
                    onNext={() => setActiveStep('story')}
                  />
                </div>
              </div>
            )}

            {activeStep === 'story' && (
              <div className="h-full overflow-y-auto">
                <div className="max-w-7xl mx-auto p-8 space-y-6">
                  <Button variant="outline" onClick={() => setActiveStep('idea')}>
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back
                  </Button>
                  <StoryEditor
                    story={story}
                    setStory={setStory}
                    scenes={scenes}
                    setScenes={setScenes}
                    context={context}
                    setContext={setContext}
                    onNext={() => {
                      const totalDuration = scenes.reduce((sum, scene) => sum + scene.duration, 0)
                      setSettings(prev => ({ ...prev, duration: Math.ceil(totalDuration / 60) }))
                      setActiveStep('settings')
                    }}
                    onBack={() => setActiveStep('idea')}
                  />
                </div>
              </div>
            )}

            {activeStep === 'settings' && (
              <div className="h-full overflow-y-auto">
                <div className="max-w-6xl mx-auto p-8 space-y-6">
                  <Button variant="outline" onClick={() => setActiveStep('story')}>
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back
                  </Button>
                  <VideoSettings
                    settings={settings}
                    setSettings={setSettings}
                    story={story}
                    onNext={() => setActiveStep('generate')}
                    onBack={() => setActiveStep('story')}
                  />
                </div>
              </div>
            )}

            {activeStep === 'generate' && (
              <div className="h-full overflow-y-auto">
                <div className="max-w-7xl mx-auto p-8 space-y-6">
                  <GenerationProgress
                    story={story}
                    settings={settings}
                    scenes={scenes}
                    context={context}
                    isGenerating={isGenerating}
                    setIsGenerating={setIsGenerating}
                    setVideoUrl={setVideoUrl}
                    onComplete={() => setActiveStep('preview')}
                    onBack={() => setActiveStep('settings')}
                    cachedSegments={cachedSegments}
                    setCachedSegments={setCachedSegments}
                    lastSettings={lastSettings}
                    setLastSettings={setLastSettings}
                  />
                </div>
              </div>
            )}

            {activeStep === 'preview' && (
              <div className="h-full overflow-y-auto">
                <div className="max-w-6xl mx-auto p-8 space-y-6">
                  <Button variant="outline" onClick={() => setActiveStep('generate')}>
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back
                  </Button>
                  <VideoPreview
                    videoUrl={videoUrl}
                    story={story}
                    settings={settings}
                    onBack={() => setActiveStep('generate')}
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
