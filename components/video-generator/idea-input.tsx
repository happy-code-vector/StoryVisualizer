'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Loader2, Sparkles } from 'lucide-react'
import { Label } from '@/components/ui/label'

interface IdeaInputProps {
  idea: string
  setIdea: (idea: string) => void
  story: string
  setStory: (story: string) => void
  onNext: () => void
}

export function IdeaInput({ idea, setIdea, story, setStory, onNext }: IdeaInputProps) {
  const [isGenerating, setIsGenerating] = useState(false)

  const generateStory = async () => {
    if (!idea.trim()) return

    setIsGenerating(true)
    try {
      const response = await fetch('/api/video-generator/generate-story', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idea })
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

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Your Idea</CardTitle>
          <CardDescription>
            Describe your video concept or provide a complete story
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="idea">Idea or Story</Label>
            <Textarea
              id="idea"
              placeholder="Example: A documentary about the journey of a coffee bean from farm to cup, showing the entire process..."
              value={idea}
              onChange={(e) => setIdea(e.target.value)}
              rows={12}
              className="resize-none"
            />
          </div>

          <div className="flex gap-2">
            <Button
              onClick={generateStory}
              disabled={!idea.trim() || isGenerating}
              className="flex-1"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating Story...
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 h-4 w-4" />
                  Generate Story from Idea
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Generated Story</CardTitle>
          <CardDescription>
            AI-generated story ready for video production
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="story">Story Script</Label>
            <Textarea
              id="story"
              placeholder="Your generated story will appear here..."
              value={story}
              onChange={(e) => setStory(e.target.value)}
              rows={12}
              className="resize-none"
            />
          </div>

          <Button
            onClick={onNext}
            disabled={!story.trim()}
            className="w-full"
          >
            Continue to Story Editor
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
