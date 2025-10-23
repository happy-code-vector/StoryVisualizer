'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { ArrowLeft, CheckCircle2, Loader2, XCircle, Play, Eye, RefreshCw, Edit } from 'lucide-react'

interface GenerationProgressProps {
  story: string
  settings: any
  scenes?: any[]
  isGenerating: boolean
  setIsGenerating: (generating: boolean) => void
  setVideoUrl: (url: string | null) => void
  onComplete: () => void
  onBack: () => void
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
  isGenerating,
  setIsGenerating,
  setVideoUrl,
  onComplete,
  onBack
}: GenerationProgressProps) {
  const [segments, setSegments] = useState<Segment[]>([])
  const [currentSegment, setCurrentSegment] = useState(0)
  const [stitchingVideo, setStitchingVideo] = useState(false)
  const [previewSegment, setPreviewSegment] = useState<Segment | null>(null)
  const [editingSegment, setEditingSegment] = useState<Segment | null>(null)
  const [editedPrompt, setEditedPrompt] = useState('')

  useEffect(() => {
    if (!isGenerating && segments.length === 0) {
      initializeSegments()
    }
  }, [])

  const initializeSegments = async () => {
    try {
      const response = await fetch('/api/video-generator/prepare-segments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ story, settings, scenes })
      })

      const data = await response.json()
      setSegments(data.segments.map((segment: any, index: number) => {
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
      }))
    } catch (error) {
      console.error('Failed to prepare segments:', error)
    }
  }

  const generateSegment = async (index: number, prompt: string) => {
    setSegments(prev => prev.map((seg, idx) =>
      idx === index ? { ...seg, status: 'generating', error: undefined } : seg
    ))

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

      setSegments(prev => prev.map((seg, idx) =>
        idx === index ? { ...seg, status: 'completed', videoUrl: data.videoUrl } : seg
      ))
    } catch (error: any) {
      setSegments(prev => prev.map((seg, idx) =>
        idx === index ? { ...seg, status: 'failed', error: error.message || 'Generation failed' } : seg
      ))
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
    setSegments(prev => prev.map(seg =>
      seg.id === editingSegment.id ? { ...seg, prompt: editedPrompt } : seg
    ))

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

  return (
    <div className="grid gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Video Generation Progress</CardTitle>
          <CardDescription>
            {stitchingVideo
              ? 'Stitching video segments together...'
              : isGenerating
              ? `Generating segment ${currentSegment + 1} of ${segments.length}`
              : 'Ready to start generation'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Overall Progress</span>
              <span>{completedCount} / {segments.length} segments</span>
            </div>
            <Progress value={progress} className="h-3" />
          </div>

          <div className="flex gap-3">
            {!isGenerating && !stitchingVideo && segments.length > 0 && completedCount === 0 && (
              <Button onClick={startGeneration} className="flex-1" size="lg">
                <Play className="mr-2 h-5 w-5" />
                Start Video Generation
              </Button>
            )}

            {canStitch && (
              <Button onClick={stitchVideos} className="flex-1" size="lg" disabled={stitchingVideo}>
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
          </div>

          {isGenerating && (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="h-8 w-8 animate-spin mr-3" />
              <span className="text-lg">Generating segment {currentSegment + 1}...</span>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Generated Segments</CardTitle>
          <CardDescription>
            Preview, edit, and regenerate individual segments
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[500px]">
            <div className="space-y-4">
              {segments.map((segment, index) => (
                <div
                  key={segment.id}
                  className="flex gap-3 p-4 rounded-lg border bg-card"
                >
                  <div className="mt-1">
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

                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-2">
                      <div className="font-medium">Segment {index + 1}</div>
                      {segment.sceneTitle && (
                        <span className="text-xs px-2 py-1 rounded-full bg-primary/10 text-primary">
                          {segment.sceneTitle}
                          {segment.segmentInScene && segment.totalInScene && 
                            ` (${segment.segmentInScene}/${segment.totalInScene})`
                          }
                        </span>
                      )}
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

                    <div className="flex gap-2 pt-2">
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
                        Edit Prompt
                      </Button>

                      {(segment.status === 'failed' || segment.status === 'completed') && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => retrySegment(index)}
                          disabled={segment.status === 'generating'}
                        >
                          <RefreshCw className="mr-2 h-4 w-4" />
                          Regenerate
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      <div className="flex justify-between">
        <Button variant="outline" onClick={onBack} disabled={isGenerating || stitchingVideo}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
      </div>

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

      {/* Edit Dialog */}
      <Dialog open={!!editingSegment} onOpenChange={() => setEditingSegment(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Segment {editingSegment ? editingSegment.id + 1 : ''}</DialogTitle>
            <DialogDescription>
              Modify the prompt and regenerate the video segment
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Textarea
              value={editedPrompt}
              onChange={(e) => setEditedPrompt(e.target.value)}
              rows={6}
              placeholder="Enter video prompt..."
            />
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setEditingSegment(null)}>
                Cancel
              </Button>
              <Button onClick={saveEditedPrompt}>
                <RefreshCw className="mr-2 h-4 w-4" />
                Regenerate with New Prompt
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
