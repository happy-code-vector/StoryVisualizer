import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { DollarSign, Clock, Image, Video, Mic } from 'lucide-react'

interface CostEstimate {
  characterImages: number
  sceneImages: number
  videos: number
  voice: number
  subtitles: number
  total: number
  renderMinutes: number
}

interface Props {
  estimate: CostEstimate
  includeVideos?: boolean
  includeVoice?: boolean
}

export function CostEstimateCard({ estimate, includeVideos = false, includeVoice = false }: Props) {
  return (
    <Card className="border-primary/20 bg-primary/5">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <DollarSign className="w-5 h-5" />
          Cost Estimate
        </CardTitle>
        <CardDescription>
          Estimated cost for generating this story
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Total Cost */}
        <div className="flex items-center justify-between p-4 bg-background rounded-lg border-2 border-primary">
          <div>
            <div className="text-3xl font-bold">${estimate.total.toFixed(2)}</div>
            <div className="text-sm text-muted-foreground">Total Cost</div>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold">{estimate.renderMinutes.toFixed(1)} min</div>
            <div className="text-sm text-muted-foreground">Render Time</div>
          </div>
        </div>

        {/* Breakdown */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <Image className="w-4 h-4 text-muted-foreground" />
              <span>Character Images</span>
            </div>
            <span className="font-medium">${estimate.characterImages.toFixed(2)}</span>
          </div>

          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <Image className="w-4 h-4 text-muted-foreground" />
              <span>Scene Images</span>
            </div>
            <span className="font-medium">${estimate.sceneImages.toFixed(2)}</span>
          </div>

          {includeVideos && estimate.videos > 0 && (
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <Video className="w-4 h-4 text-muted-foreground" />
                <span>Videos</span>
                <Badge variant="secondary" className="text-xs">Optional</Badge>
              </div>
              <span className="font-medium">${estimate.videos.toFixed(2)}</span>
            </div>
          )}

          {includeVoice && estimate.voice > 0 && (
            <>
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <Mic className="w-4 h-4 text-muted-foreground" />
                  <span>Voice Synthesis</span>
                  <Badge variant="secondary" className="text-xs">Optional</Badge>
                </div>
                <span className="font-medium">${estimate.voice.toFixed(2)}</span>
              </div>

              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-muted-foreground" />
                  <span>Subtitles</span>
                </div>
                <span className="font-medium">${estimate.subtitles.toFixed(2)}</span>
              </div>
            </>
          )}
        </div>

        {/* Info */}
        <div className="text-xs text-muted-foreground pt-2 border-t">
          💡 Costs are estimated. Actual costs may vary based on generation complexity.
        </div>
      </CardContent>
    </Card>
  )
}
