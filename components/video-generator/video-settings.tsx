'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Slider } from '@/components/ui/slider'
import { Switch } from '@/components/ui/switch'
import { ArrowLeft, ArrowRight } from 'lucide-react'

interface VideoSettingsProps {
  settings: {
    duration: number
    segmentLength: number
    style: string
    aspectRatio: string
    fps: number
    transitions: boolean
  }
  setSettings: (settings: any) => void
  story: string
  onNext: () => void
  onBack: () => void
}

export function VideoSettings({ settings, setSettings, story, onNext, onBack }: VideoSettingsProps) {
  const updateSetting = (key: string, value: any) => {
    setSettings({ ...settings, [key]: value })
  }

  // Calculate actual segments and cost
  const totalSeconds = settings.duration * 60
  const estimatedSegments = Math.ceil(totalSeconds / settings.segmentLength)
  
  // Aurora cost calculation
  // Each segment: 1 image generation ($0.02) + video generation ($0.05/sec)
  const imageGenerationCost = estimatedSegments * 0.02 // $0.02 per image
  const videoGenerationCost = totalSeconds * 0.05 // $0.05 per second
  const estimatedCost = imageGenerationCost + videoGenerationCost

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Video Configuration</CardTitle>
          <CardDescription>
            Configure your video generation settings
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2 p-3 bg-muted/50 rounded-lg">
            <Label className="text-sm text-muted-foreground">Target Duration (set in Step 1)</Label>
            <div className="text-2xl font-bold">{settings.duration} {settings.duration === 1 ? 'minute' : 'minutes'}</div>
            <p className="text-xs text-muted-foreground">
              Duration was set when you generated your story. To change it, go back to Step 1.
            </p>
          </div>

          <div className="space-y-2">
            <Label>Segment Length (seconds)</Label>
            <Select
              value={settings.segmentLength.toString()}
              onValueChange={(value) => updateSetting('segmentLength', parseInt(value))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="5">5 seconds</SelectItem>
                <SelectItem value="10">10 seconds</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Visual Style</Label>
            <Select
              value={settings.style}
              onValueChange={(value) => updateSetting('style', value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="cinematic">Cinematic</SelectItem>
                <SelectItem value="documentary">Documentary</SelectItem>
                <SelectItem value="animated">Animated</SelectItem>
                <SelectItem value="realistic">Realistic</SelectItem>
                <SelectItem value="artistic">Artistic</SelectItem>
                <SelectItem value="vintage">Vintage</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Aspect Ratio</Label>
            <Select
              value={settings.aspectRatio}
              onValueChange={(value) => updateSetting('aspectRatio', value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="16:9">16:9 (Landscape)</SelectItem>
                <SelectItem value="9:16">9:16 (Portrait)</SelectItem>
                <SelectItem value="1:1">1:1 (Square)</SelectItem>
                <SelectItem value="21:9">21:9 (Ultrawide)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Frame Rate (FPS)</Label>
            <Select
              value={settings.fps.toString()}
              onValueChange={(value) => updateSetting('fps', parseInt(value))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="24">24 FPS (Cinematic)</SelectItem>
                <SelectItem value="30">30 FPS (Standard)</SelectItem>
                <SelectItem value="60">60 FPS (Smooth)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="transitions">Enable Transitions</Label>
            <Switch
              id="transitions"
              checked={settings.transitions}
              onCheckedChange={(checked) => updateSetting('transitions', checked)}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Generation Summary</CardTitle>
          <CardDescription>
            Review your video configuration
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <div className="flex justify-between py-2 border-b">
              <span className="text-muted-foreground">Total Duration</span>
              <span className="font-medium">{settings.duration} minutes</span>
            </div>
            <div className="flex justify-between py-2 border-b">
              <span className="text-muted-foreground">Segments</span>
              <span className="font-medium">{estimatedSegments} clips</span>
            </div>
            <div className="flex justify-between py-2 border-b">
              <span className="text-muted-foreground">Segment Length</span>
              <span className="font-medium">{settings.segmentLength}s each</span>
            </div>
            <div className="flex justify-between py-2 border-b">
              <span className="text-muted-foreground">Style</span>
              <span className="font-medium capitalize">{settings.style}</span>
            </div>
            <div className="flex justify-between py-2 border-b">
              <span className="text-muted-foreground">Aspect Ratio</span>
              <span className="font-medium">{settings.aspectRatio}</span>
            </div>
            <div className="flex justify-between py-2 border-b">
              <span className="text-muted-foreground">Frame Rate</span>
              <span className="font-medium">{settings.fps} FPS</span>
            </div>
            <div className="flex justify-between py-2 border-b">
              <span className="text-muted-foreground">Transitions</span>
              <span className="font-medium">{settings.transitions ? 'Enabled' : 'Disabled'}</span>
            </div>
            <div className="flex justify-between py-3 border-t-2 mt-4">
              <span className="font-semibold">Estimated Cost</span>
              <span className="font-bold text-lg">${estimatedCost.toFixed(2)}</span>
            </div>
            
            {/* Cost Breakdown */}
            <div className="text-xs text-muted-foreground space-y-1 pt-2">
              <div className="flex justify-between">
                <span>• Image generation ({estimatedSegments} images)</span>
                <span>${imageGenerationCost.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>• Video generation ({totalSeconds}s @ $0.05/s)</span>
                <span>${videoGenerationCost.toFixed(2)}</span>
              </div>
            </div>
          </div>

          <div className="bg-muted p-4 rounded-lg space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Estimated Time:</span>
              <span className="font-medium">{Math.ceil(estimatedSegments * 0.5)} minutes</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Render Minutes:</span>
              <span className="font-medium">{(totalSeconds / 60).toFixed(1)} min</span>
            </div>
            <p className="text-xs text-muted-foreground pt-2">
              You can monitor progress in the next step.
            </p>
          </div>

          <div className="flex gap-3 pt-4">
            <Button onClick={onNext}>
              Start Generation
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
