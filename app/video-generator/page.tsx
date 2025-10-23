'use client'

import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { IdeaInput } from '@/components/video-generator/idea-input'
import { StoryEditor } from '@/components/video-generator/story-editor'
import { VideoSettings } from '@/components/video-generator/video-settings'
import { GenerationProgress } from '@/components/video-generator/generation-progress'
import { VideoPreview } from '@/components/video-generator/video-preview'

export default function VideoGeneratorPage() {
  const [activeTab, setActiveTab] = useState('idea')
  const [idea, setIdea] = useState('')
  const [story, setStory] = useState('')
  const [settings, setSettings] = useState({
    duration: 20,
    segmentLength: 8,
    style: 'cinematic',
    aspectRatio: '16:9',
    fps: 24,
    transitions: true
  })
  const [isGenerating, setIsGenerating] = useState(false)
  const [videoUrl, setVideoUrl] = useState<string | null>(null)

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">Video Generator</h1>
        <p className="text-muted-foreground">
          Transform your ideas into full-length videos with AI
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="idea">1. Idea</TabsTrigger>
          <TabsTrigger value="story" disabled={!story && !idea}>2. Story</TabsTrigger>
          <TabsTrigger value="settings" disabled={!story}>3. Settings</TabsTrigger>
          <TabsTrigger value="generate" disabled={!story}>4. Generate</TabsTrigger>
          <TabsTrigger value="preview" disabled={!videoUrl}>5. Preview</TabsTrigger>
        </TabsList>

        <TabsContent value="idea">
          <IdeaInput
            idea={idea}
            setIdea={setIdea}
            story={story}
            setStory={setStory}
            onNext={() => setActiveTab('story')}
          />
        </TabsContent>

        <TabsContent value="story">
          <StoryEditor
            story={story}
            setStory={setStory}
            onNext={() => setActiveTab('settings')}
            onBack={() => setActiveTab('idea')}
          />
        </TabsContent>

        <TabsContent value="settings">
          <VideoSettings
            settings={settings}
            setSettings={setSettings}
            story={story}
            onNext={() => setActiveTab('generate')}
            onBack={() => setActiveTab('story')}
          />
        </TabsContent>

        <TabsContent value="generate">
          <GenerationProgress
            story={story}
            settings={settings}
            isGenerating={isGenerating}
            setIsGenerating={setIsGenerating}
            setVideoUrl={setVideoUrl}
            onComplete={() => setActiveTab('preview')}
            onBack={() => setActiveTab('settings')}
          />
        </TabsContent>

        <TabsContent value="preview">
          <VideoPreview
            videoUrl={videoUrl}
            story={story}
            settings={settings}
            onBack={() => setActiveTab('generate')}
          />
        </TabsContent>
      </Tabs>
    </div>
  )
}
