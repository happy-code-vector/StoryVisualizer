'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Download, Share2, ArrowLeft } from 'lucide-react'

interface VideoPreviewProps {
  videoUrl: string | null
  story: string
  settings: any
  onBack: () => void
}

export function VideoPreview({ videoUrl, story, settings, onBack }: VideoPreviewProps) {
  const handleDownload = () => {
    if (videoUrl) {
      const a = document.createElement('a')
      a.href = videoUrl
      a.download = `generated-video-${Date.now()}.mp4`
      a.click()
    }
  }

  const handleShare = async () => {
    if (navigator.share && videoUrl) {
      try {
        await navigator.share({
          title: 'My Generated Video',
          text: 'Check out this AI-generated video!',
          url: videoUrl
        })
      } catch (error) {
        console.error('Share failed:', error)
      }
    }
  }

  return (
    <div className="grid gap-6 md:grid-cols-3">
      <Card className="md:col-span-2">
        <CardHeader>
          <CardTitle>Your Generated Video</CardTitle>
          <CardDescription>
            Video successfully generated and ready to download
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {videoUrl ? (
            <div className="aspect-video bg-black rounded-lg overflow-hidden">
              <video
                src={videoUrl}
                controls
                className="w-full h-full"
              >
                Your browser does not support the video tag.
              </video>
            </div>
          ) : (
            <div className="aspect-video bg-muted rounded-lg flex items-center justify-center">
              <p className="text-muted-foreground">No video available</p>
            </div>
          )}

          <div className="flex gap-3">
            <Button onClick={handleDownload} className="flex-1" size="lg">
              <Download className="mr-2 h-5 w-5" />
              Download Video
            </Button>
            <Button onClick={handleShare} variant="outline" size="lg">
              <Share2 className="mr-2 h-5 w-5" />
              Share
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Video Details</CardTitle>
          <CardDescription>
            Generation settings and information
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-2">
            <div className="flex justify-between py-2 border-b">
              <span className="text-sm text-muted-foreground">Duration</span>
              <span className="text-sm font-medium">{settings.duration} min</span>
            </div>
            <div className="flex justify-between py-2 border-b">
              <span className="text-sm text-muted-foreground">Style</span>
              <span className="text-sm font-medium capitalize">{settings.style}</span>
            </div>
            <div className="flex justify-between py-2 border-b">
              <span className="text-sm text-muted-foreground">Aspect Ratio</span>
              <span className="text-sm font-medium">{settings.aspectRatio}</span>
            </div>
            <div className="flex justify-between py-2 border-b">
              <span className="text-sm text-muted-foreground">Frame Rate</span>
              <span className="text-sm font-medium">{settings.fps} FPS</span>
            </div>
            <div className="flex justify-between py-2 border-b">
              <span className="text-sm text-muted-foreground">Segments</span>
              <span className="text-sm font-medium">
                {Math.ceil((settings.duration * 60) / settings.segmentLength)}
              </span>
            </div>
          </div>

          <Button variant="outline" onClick={onBack} className="w-full">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Generate Another Video
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
