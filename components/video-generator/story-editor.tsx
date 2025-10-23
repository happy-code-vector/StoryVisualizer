'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { ArrowLeft, ArrowRight, Loader2 } from 'lucide-react'

interface Scene {
  id: number
  text: string
  duration: number
  visualPrompt: string
}

interface StoryEditorProps {
  story: string
  setStory: (story: string) => void
  scenes: Scene[]
  setScenes: (scenes: Scene[]) => void
  onNext: () => void
  onBack: () => void
}

export function StoryEditor({ story, setStory, scenes, setScenes, onNext, onBack }: StoryEditorProps) {
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [selectedScene, setSelectedScene] = useState<number | null>(null)

  useEffect(() => {
    if (story && scenes.length === 0) {
      analyzeStory()
    }
  }, [story])

  const analyzeStory = async () => {
    setIsAnalyzing(true)
    try {
      const response = await fetch('/api/video-generator/analyze-story', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ story })
      })

      const data = await response.json()
      setScenes(data.scenes)
      if (data.scenes.length > 0) {
        setSelectedScene(0)
      }
    } catch (error) {
      console.error('Failed to analyze story:', error)
    } finally {
      setIsAnalyzing(false)
    }
  }

  const updateScene = (id: number, field: keyof Scene, value: string | number) => {
    setScenes(scenes.map(scene =>
      scene.id === id ? { ...scene, [field]: value } : scene
    ))
  }

  const totalDuration = scenes.reduce((sum, scene) => sum + scene.duration, 0)

  return (
    <div className="grid gap-6 md:grid-cols-3">
      <Card className="md:col-span-1">
        <CardHeader>
          <CardTitle>Scenes ({scenes.length})</CardTitle>
          <CardDescription>
            Total duration: {Math.floor(totalDuration / 60)}:{(totalDuration % 60).toString().padStart(2, '0')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isAnalyzing ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : (
            <ScrollArea className="h-[500px]">
              <div className="space-y-2">
                {scenes.map((scene, index) => (
                  <div key={scene.id}>
                    <Button
                      variant={selectedScene === index ? 'default' : 'ghost'}
                      className="w-full justify-start text-left"
                      onClick={() => setSelectedScene(index)}
                    >
                      <div className="flex-1 truncate">
                        <div className="font-medium">Scene {index + 1}</div>
                        <div className="text-xs opacity-70">{scene.duration}s</div>
                      </div>
                    </Button>
                    {index < scenes.length - 1 && <Separator className="my-2" />}
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>

      <Card className="md:col-span-2">
        <CardHeader>
          <CardTitle>
            {selectedScene !== null ? `Scene ${selectedScene + 1}` : 'Select a Scene'}
          </CardTitle>
          <CardDescription>
            Edit scene content and visual prompts
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {selectedScene !== null && scenes[selectedScene] && (
            <>
              <div className="space-y-2">
                <Label>Scene Text</Label>
                <Textarea
                  value={scenes[selectedScene].text}
                  onChange={(e) => updateScene(scenes[selectedScene].id, 'text', e.target.value)}
                  rows={6}
                />
              </div>

              <div className="space-y-2">
                <Label>Visual Prompt</Label>
                <Textarea
                  value={scenes[selectedScene].visualPrompt}
                  onChange={(e) => updateScene(scenes[selectedScene].id, 'visualPrompt', e.target.value)}
                  rows={4}
                  placeholder="Describe what should be shown visually in this scene..."
                />
              </div>

              <div className="space-y-2">
                <Label>Duration (seconds)</Label>
                <input
                  type="number"
                  value={scenes[selectedScene].duration}
                  onChange={(e) => updateScene(scenes[selectedScene].id, 'duration', parseInt(e.target.value))}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  min="1"
                  max="30"
                />
              </div>
            </>
          )}

          <div className="flex justify-between pt-4">
            <Button variant="outline" onClick={onBack}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
            <Button onClick={onNext} disabled={scenes.length === 0}>
              Continue to Settings
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
