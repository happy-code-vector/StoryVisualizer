'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { ArrowLeft, CheckCircle2, Loader2, XCircle, Play, Eye, RefreshCw, Edit, Sparkles } from 'lucide-react'
import { PromptEnhancer } from './prompt-enhancer'

interface GenerationProgressProps {
  story: string
  settings: any
  scenes?: any[]
  context?: any
  isGenerating: boolean
  setIsGenerating: (generating: boolean) => void
  setVideoUrl: (url: string | null) => void
  onComplete: () => void
  onBack: () => void
  cachedSegments: any[]
  setCachedSegments: (segments: any[]) => void
  lastSettings: any
  setLastSettings: (settings: any) => void
}

interface Segment {
  id: number
  prompt: string
  status: 'pending' | 'generating' | 'completed' | 'failed'
  videoUrl?: string
  error?: string
  sceneId?: number
  sceneIndex?: number
  sceneTitle?: string
  segmentInScene?: number
  totalInScene?: number
}

export function GenerationProgress({
  story,
  settings,
  scenes,
  context,
  isGenerating,
  setIsGenerating,
  setVideoUrl,
  onComplete,
  onBack,
  cachedSegments,
  setCachedSegments,
  lastSettings,
  setLastSettings
}: GenerationProgressProps) {
  const [segments, setSegments] = useState<Segment[]>([])
  const [currentSegment, setCurrentSegment] = useState(0)
  const [stitchingVideo, setStitchingVideo] = useState(false)
  const [previewSegment, setPreviewSegment] = useState<Segment | null>(null)
  const [editingSegment, setEditingSegment] = useState<Segment | null>(null)
  const [editedPrompt, setEditedPrompt] = useState('')
  const [enhancerOpen, setEnhancerOpen] = useState(false)
  const [enhancingSegment, setEnhancingSegment] = useState<Segment | null>(null)
  const [isPreparingSegments, setIsPreparingSegments] = useState(false)

  // Check if settings have changed
  const settingsChanged = () => {
    if (!lastSettings) return true
    return JSON.stringify(settings) !== JSON.stringify(lastSettings)
  }

  useEffect(() => {
    // Use cached segments if settings haven't changed
    if (cachedSegments.length > 0 && !settingsChanged()) {
      setSegments(cachedSegments)
    } else if (!isGenerating && segments.length === 0) {
      initializeSegments()
    }
  }, [])

  const initializeSegments = async () => {
    setIsPreparingSegments(true)
    try {
      const response = await fetch('/api/video-generator/prepare-segments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ story, settings, scenes, context })
      })

      const data = await response.json()
      const newSegments = data.segments.map((segment: any, index: number) => {
        // Handle both old format (string) and new format (object with scene info)
        if (typeof segment === 'string') {
          return {
            id: index,
            prompt: segment,
            status: 'pending' as const
          }
        } else {
          return {
            id: index,
            prompt: segment.prompt,
            status: 'pending' as const,
            sceneId: segment.sceneId,
            sceneIndex: segment.sceneIndex,
            sceneTitle: segment.sceneTitle,
            segmentInScene: segment.segmentInScene,
            totalInScene: segment.totalInScene
          }
        }
      })

      setSegments(newSegments)
      setCachedSegments(newSegments)
      setLastSettings(settings)
    } catch (error) {
      console.error('Failed to prepare segments:', error)
    } finally {
      setIsPreparingSegments(false)
    }
  }

  const generateSegment = async (index: number, prompt: string) => {
    setSegments(prev => {
      const updated = prev.map((seg, idx) =>
        idx === index ? { ...seg, status: 'generating' as const, error: undefined } : seg
      )
      setCachedSegments(updated)
      return updated
    })

    try {
      const response = await fetch('/api/video-generator/generate-segment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt,
          settings,
          segmentIndex: index
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Generation failed')
      }

      setSegments(prev => {
        const updated = prev.map((seg, idx) =>
          idx === index ? { ...seg, status: 'completed' as const, videoUrl: data.videoUrl } : seg
        )
        setCachedSegments(updated)
        return updated
      })
    } catch (error: any) {
      setSegments(prev => {
        const updated = prev.map((seg, idx) =>
          idx === index ? { ...seg, status: 'failed' as const, error: error.message || 'Generation failed' } : seg
        )
        setCachedSegments(updated)
        return updated
      })
    }
  }

  const startGeneration = async () => {
    setIsGenerating(true)

    for (let i = 0; i < segments.length; i++) {
      setCurrentSegment(i)
      await generateSegment(i, segments[i].prompt)
    }

    setIsGenerating(false)
  }

  const retrySegment = async (index: number) => {
    await generateSegment(index, segments[index].prompt)
  }

  const handleEditSegment = (segment: Segment) => {
    setEditingSegment(segment)
    setEditedPrompt(segment.prompt)
  }

  const saveEditedPrompt = async () => {
    if (!editingSegment) return

    // Update the prompt
    setSegments(prev => {
      const updated = prev.map(seg =>
        seg.id === editingSegment.id ? { ...seg, prompt: editedPrompt } : seg
      )
      setCachedSegments(updated)
      return updated
    })

    // Regenerate with new prompt
    await generateSegment(editingSegment.id, editedPrompt)
    setEditingSegment(null)
  }

  const stitchVideos = async () => {
    setStitchingVideo(true)

    try {
      const completedSegments = segments.filter(s => s.status === 'completed')

      if (completedSegments.length === 0) {
        throw new Error('No completed segments to stitch')
      }

      const response = await fetch('/api/video-generator/stitch-videos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          segments: completedSegments,
          settings
        })
      })

      const data = await response.json()
      setVideoUrl(data.videoUrl)
      setStitchingVideo(false)
      onComplete()
    } catch (error) {
      console.error('Failed to stitch videos:', error)
      setStitchingVideo(false)
    }
  }

  const completedCount = segments.filter(s => s.status === 'completed').length
  const progress = segments.length > 0 ? (completedCount / segments.length) * 100 : 0
  const canStitch = completedCount > 0 && !isGenerating

  // Group segments by scene
  const segmentsByScene = segments.reduce((acc, segment) => {
    const sceneKey = segment.sceneIndex !== undefined ? segment.sceneIndex : -1
    if (!acc[sceneKey]) {
      acc[sceneKey] = []
    }
    acc[sceneKey].push(segment)
    return acc
  }, {} as Record<number, Segment[]>)

  const sceneKeys = Object.keys(segmentsByScene).map(Number).sort((a, b) => a - b)

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 space-y-3">
            <div className="flex items-center justify-between">
              <CardTitle>Generated Segments</CardTitle>
              {!isGenerating && !stitchingVideo && segments.length > 0 && completedCount === 0 && (
                <Button onClick={startGeneration} size="lg">
                  <Play className="mr-2 h-5 w-5" />
                  Start Video Generation
                </Button>
              )}
            </div>

            {isPreparingSegments ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                <span>Analyzing story and preparing video segments...</span>
              </div>
            ) : (
              <>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  {(stitchingVideo || isGenerating) && (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  )}
                  <span>
                    {stitchingVideo
                      ? 'Stitching video segments together...'
                      : isGenerating
                        ? `Generating segment ${currentSegment + 1} of ${segments.length}`
                        : completedCount === 0
                          ? 'Ready to start generation'
                          : `${completedCount} segment${completedCount > 1 ? 's' : ''} completed`}
                  </span>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Overall Progress</span>
                    <span>{completedCount} / {segments.length} segments</span>
                  </div>
                  <Progress value={progress} className="h-3" />
                </div>
              </>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {isPreparingSegments ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <>
            {canStitch && (
              <Button onClick={stitchVideos} className="w-full" size="lg" disabled={stitchingVideo}>
                {stitchingVideo ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Stitching...
                  </>
                ) : (
                  <>
                    <Play className="mr-2 h-5 w-5" />
                    Stitch Videos ({completedCount} segments)
                  </>
                )}
              </Button>
            )}

            <ScrollArea className="h-[calc(100vh-21rem)]">
              <div className="space-y-6 pr-4">
                {sceneKeys.map((sceneKey) => {
                  const sceneSegments = segmentsByScene[sceneKey]
                  const firstSegment = sceneSegments[0]
                  const sceneCompleted = sceneSegments.filter(s => s.status === 'completed').length
                  const sceneTotal = sceneSegments.length

                  return (
                    <div key={sceneKey} className="space-y-3">
                      <div className="flex items-center justify-between px-1">
                        <div className="flex items-center gap-3">
                          <h3 className="font-semibold text-lg">
                            {firstSegment.sceneTitle || `Scene ${sceneKey + 1}`}
                          </h3>
                          <span className="text-sm text-muted-foreground">
                            {sceneCompleted} / {sceneTotal} segments
                          </span>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
                        {sceneSegments.map((segment) => (
                          <div
                            key={segment.id}
                            className="flex flex-col p-4 rounded-lg border bg-card space-y-3"
                          >
                            <div className="flex items-start gap-3">
                              <div className="mt-0.5">
                                {segment.status === 'completed' && (
                                  <CheckCircle2 className="h-5 w-5 text-green-500" />
                                )}
                                {segment.status === 'generating' && (
                                  <Loader2 className="h-5 w-5 animate-spin text-blue-500" />
                                )}
                                {segment.status === 'failed' && (
                                  <XCircle className="h-5 w-5 text-red-500" />
                                )}
                                {segment.status === 'pending' && (
                                  <div className="h-5 w-5 rounded-full border-2" />
                                )}
                              </div>

                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <div className="font-medium">Segment {segment.id + 1}</div>
                                  {segment.segmentInScene && segment.totalInScene && (
                                    <span className="text-xs px-2 py-1 rounded-full bg-primary/10 text-primary">
                                      {segment.segmentInScene}/{segment.totalInScene}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>

                            <p className="text-sm text-muted-foreground line-clamp-2">
                              {segment.prompt}
                            </p>

                            {segment.videoUrl && (
                              <div className="aspect-video bg-black rounded-md overflow-hidden">
                                <video
                                  src={segment.videoUrl}
                                  controls
                                  className="w-full h-full"
                                />
                              </div>
                            )}

                            {segment.error && (
                              <p className="text-sm text-red-500">{segment.error}</p>
                            )}

                            <div className="flex flex-wrap gap-2">
                              {segment.videoUrl && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => setPreviewSegment(segment)}
                                >
                                  <Eye className="mr-2 h-4 w-4" />
                                  Preview
                                </Button>
                              )}

                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleEditSegment(segment)}
                                disabled={segment.status === 'generating'}
                              >
                                <Edit className="mr-2 h-4 w-4" />
                                Edit
                              </Button>

                              {(segment.status === 'failed' || segment.status === 'completed') && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => retrySegment(segment.id)}
                                >
                                  <RefreshCw className="mr-2 h-4 w-4" />
                                  Retry
                                </Button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )
                })}
              </div>
            </ScrollArea>
          </>
        )}
      </CardContent>

      {/* Preview Dialog */}
      <Dialog open={!!previewSegment} onOpenChange={() => setPreviewSegment(null)}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Segment {previewSegment ? previewSegment.id + 1 : ''} Preview</DialogTitle>
            <DialogDescription>
              {previewSegment?.prompt}
            </DialogDescription>
          </DialogHeader>
          {previewSegment?.videoUrl && (
            <div className="aspect-video bg-black rounded-lg overflow-hidden">
              <video
                src={previewSegment.videoUrl}
                controls
                autoPlay
                className="w-full h-full"
              />
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Dialog - Hidden when enhancer is open */}
      <Dialog open={!!editingSegment && !enhancerOpen} onOpenChange={() => setEditingSegment(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Segment {editingSegment ? editingSegment.id + 1 : ''}</DialogTitle>
            <DialogDescription>
              Modify the prompt and regenerate the video segment
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium">Prompt</label>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setEnhancingSegment(editingSegment)
                    setEnhancerOpen(true)
                  }}
                  className="h-7 gap-1.5"
                >
                  <Sparkles className="h-3.5 w-3.5" />
                  Enhance with AI
                </Button>
              </div>
              <Textarea
                value={editedPrompt}
                onChange={(e) => setEditedPrompt(e.target.value)}
                rows={6}
                placeholder="Enter video prompt..."
              />
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setEditingSegment(null)}>
                Cancel
              </Button>
              <Button
                onClick={saveEditedPrompt}
                disabled={
                  editedPrompt.trim().length === 0 ||
                  (!!editingSegment?.videoUrl && editedPrompt === editingSegment?.prompt)
                }
              >
                <RefreshCw className="mr-2 h-4 w-4" />
                {editingSegment?.videoUrl ? 'Regenerate with New Prompt' : 'Generate with This Prompt'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Prompt Enhancer */}
      {enhancingSegment && enhancerOpen && (
        <PromptEnhancer
          open={enhancerOpen}
          onOpenChange={(open) => {
            setEnhancerOpen(open)
            if (!open) {
              setEnhancingSegment(null)
            }
          }}
          initialPrompt={editedPrompt}
          context={context}
          onApply={(enhancedPrompt) => {
            setEditedPrompt(enhancedPrompt)
            setEnhancingSegment(null)
            setEnhancerOpen(false)
          }}
        />
      )}
    </Card>
  )
}
