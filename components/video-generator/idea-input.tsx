'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Loader2, Sparkles, FileText, Lightbulb, Clock } from 'lucide-react'
import { Label } from '@/components/ui/label'
import { Slider } from '@/components/ui/slider'
import { Badge } from '@/components/ui/badge'

interface IdeaInputProps {
  idea: string
  setIdea: (idea: string) => void
  story: string
  setStory: (story: string) => void
  onNext: () => void
}

const DURATION_PRESETS = [
  { value: 1, label: '1 min', description: 'Quick clip' },
  { value: 2, label: '2 min', description: 'Short video' },
  { value: 3, label: '3 min', description: 'Standard' },
  { value: 5, label: '5 min', description: 'Extended' },
  { value: 10, label: '10 min', description: 'Long form' },
]

export function IdeaInput({ idea, setIdea, story, setStory, onNext }: IdeaInputProps) {
  const [isGenerating, setIsGenerating] = useState(false)
  const [selectedOption, setSelectedOption] = useState<'idea' | 'story' | null>(null)
  const [targetDuration, setTargetDuration] = useState(2) // Default 2 minutes

  const generateStory = async () => {
    if (!idea.trim()) return

    setIsGenerating(true)
    try {
      const response = await fetch('/api/video-generator/generate-story', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          idea,
          targetDuration // Pass target duration to AI
        })
      })

      const data = await response.json()
      setStory(data.story)
    } catch (error) {
      console.error('Failed to generate story:', error)
    } finally {
      setIsGenerating(false)
    }
  }

  const handleNext = () => {
    if (story) {
      onNext()
    } else if (idea) {
      generateStory()
    }
  }

  const handleOptionSelect = (option: 'idea' | 'story') => {
    setSelectedOption(option)
    // Clear the other field when switching
    if (option === 'idea') {
      setStory('')
    } else {
      setIdea('')
    }
  }

  return (
    <div className="space-y-6">
      {!selectedOption ? (
        <div className="space-y-6">
          <div className="text-center space-y-2">
            <h2 className="text-2xl font-bold">How would you like to start?</h2>
            <p className="text-muted-foreground">Choose one option to begin creating your video</p>
          </div>

          <div className="grid gap-6 md:grid-cols-2 max-w-4xl mx-auto">
            <Card
              className="cursor-pointer hover:border-primary transition-colors"
              onClick={() => handleOptionSelect('idea')}
            >
              <CardHeader className="text-center">
                <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
                  <Lightbulb className="h-8 w-8 text-primary" />
                </div>
                <CardTitle>Start with an Idea</CardTitle>
                <CardDescription>
                  Have a concept? Let AI generate a complete story for you
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="text-sm space-y-2 text-muted-foreground">
                  <li>✓ Quick and easy</li>
                  <li>✓ AI creates the narrative</li>
                  <li>✓ Perfect for brainstorming</li>
                </ul>
                <Button className="w-full mt-4" size="lg">
                  Choose This Option
                </Button>
              </CardContent>
            </Card>

            <Card
              className="cursor-pointer hover:border-primary transition-colors"
              onClick={() => handleOptionSelect('story')}
            >
              <CardHeader className="text-center">
                <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
                  <FileText className="h-8 w-8 text-primary" />
                </div>
                <CardTitle>Use Your Own Story</CardTitle>
                <CardDescription>
                  Already have a complete story? Paste it directly
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="text-sm space-y-2 text-muted-foreground">
                  <li>✓ Full control</li>
                  <li>✓ Use existing content</li>
                  <li>✓ Skip AI generation</li>
                </ul>
                <Button className="w-full mt-4" size="lg">
                  Choose This Option
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      ) : selectedOption === 'idea' ? (
        <div className="max-w-3xl mx-auto space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold">Enter Your Idea</h2>
              <p className="text-muted-foreground">Describe your video concept</p>
            </div>
            <Button variant="ghost" onClick={() => setSelectedOption(null)}>
              Change Option
            </Button>
          </div>

          <Card>
            <CardContent className="pt-6 space-y-6">
              <div className="space-y-2">
                <Label htmlFor="idea">Video Idea</Label>
                <Textarea
                  id="idea"
                  placeholder="Example: A documentary about the journey of a coffee bean from farm to cup, showing the entire process..."
                  value={idea}
                  onChange={(e) => setIdea(e.target.value)}
                  rows={8}
                  className="resize-none"
                  autoFocus
                />
              </div>

              {/* Duration Selection */}
              <div className="space-y-4 p-4 bg-muted/50 rounded-lg border-2 border-primary/20">
                <div className="flex items-center gap-2">
                  <Clock className="w-5 h-5 text-primary" />
                  <Label className="text-base font-semibold">Target Video Duration</Label>
                  <Badge variant="secondary" className="ml-auto">
                    {targetDuration} {targetDuration === 1 ? 'minute' : 'minutes'}
                  </Badge>
                </div>
                
                <p className="text-sm text-muted-foreground">
                  Choose how long you want your final video to be. AI will generate appropriate content.
                </p>

                {/* Quick Presets */}
                <div className="flex flex-wrap gap-2">
                  {DURATION_PRESETS.map((preset) => (
                    <Button
                      key={preset.value}
                      variant={targetDuration === preset.value ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setTargetDuration(preset.value)}
                      className="flex-1 min-w-[100px]"
                    >
                      <div className="text-center">
                        <div className="font-semibold">{preset.label}</div>
                        <div className="text-xs opacity-70">{preset.description}</div>
                      </div>
                    </Button>
                  ))}
                </div>

                {/* Custom Slider */}
                <div className="space-y-2">
                  <Label className="text-sm">Custom Duration</Label>
                  <Slider
                    value={[targetDuration]}
                    onValueChange={(value) => setTargetDuration(value[0])}
                    min={1}
                    max={15}
                    step={1}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>1 min</span>
                    <span>15 min</span>
                  </div>
                </div>
              </div>

              <Button
                onClick={generateStory}
                disabled={!idea.trim() || isGenerating}
                className="w-full"
                size="lg"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generating {targetDuration}-Minute Story...
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-2 h-4 w-4" />
                    Generate {targetDuration}-Minute Story
                  </>
                )}
              </Button>

              {story && (
                <div className="space-y-2 pt-4 border-t">
                  <Label htmlFor="generated-story">Generated Story</Label>
                  <Textarea
                    id="generated-story"
                    value={story}
                    onChange={(e) => setStory(e.target.value)}
                    rows={12}
                    className="resize-none"
                  />
                  <Button onClick={onNext} className="w-full" size="lg">
                    Continue to Story Editor
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      ) : (
        <div className="max-w-3xl mx-auto space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold">Enter Your Story</h2>
              <p className="text-muted-foreground">Paste your complete story script</p>
            </div>
            <Button variant="ghost" onClick={() => setSelectedOption(null)}>
              Change Option
            </Button>
          </div>

          <Card>
            <CardContent className="pt-6 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="story">Story Script</Label>
                <Textarea
                  id="story"
                  placeholder="Paste your complete story here..."
                  value={story}
                  onChange={(e) => setStory(e.target.value)}
                  rows={16}
                  className="resize-none"
                  autoFocus
                />
              </div>

              <Button
                onClick={onNext}
                disabled={!story.trim()}
                className="w-full"
                size="lg"
              >
                Continue to Story Editor
              </Button>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
