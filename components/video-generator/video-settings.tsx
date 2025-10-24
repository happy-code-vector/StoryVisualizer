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

  const estimatedSegments = Math.ceil((settings.duration * 60) / settings.segmentLength)
  const estimatedCost = estimatedSegments * 0.05 // Example cost per segment

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
          <div className="space-y-2">
            <Label>Target Duration (minutes)</Label>
            <div className="flex items-center gap-4">
              <Slider
                value={[settings.duration]}
                onValueChange={([value]) => updateSetting('duration', value)}
                min={1}
                max={60}
                step={1}
                className="flex-1"
              />
              <span className="w-12 text-right font-medium">{settings.duration}m</span>
            </div>
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
          </div>

          <div className="bg-muted p-4 rounded-lg">
            <p className="text-sm text-muted-foreground">
              Generation will take approximately {Math.ceil(estimatedSegments * 0.5)} minutes.
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
