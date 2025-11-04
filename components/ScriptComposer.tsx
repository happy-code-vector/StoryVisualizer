"use client"

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Sparkles, Wand2, Zap, TrendingUp, AlertCircle } from 'lucide-react'
import { NarrativeCoach } from './NarrativeCoach'

interface Scene {
  id: number
  title: string
  description: string
  characters: string[]
  beatType?: string
  tensionLevel?: number
  suggestedDuration?: number
}

interface StoryArc {
  acts: {
    act1: { scenes: number[] }
    act2: { scenes: number[] }
    act3: { scenes: number[] }
  }
  beats: any
  pacing: {
    totalDuration: number
    sceneDistribution: any[]
  }
}

interface Props {
  initialStory: string
  scenes: Scene[]
  storyArc?: StoryArc
  narrativeSuggestions?: any[]
  onRevise: (action: string, sceneId?: number) => void
  onAnalyze: () => void
}

export function ScriptComposer({ 
  initialStory, 
  scenes, 
  storyArc, 
  narrativeSuggestions,
  onRevise,
  onAnalyze 
}: Props) {
  const [story, setStory] = useState(initialStory)
  const [selectedScene, setSelectedScene] = useState<number | null>(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)

  const quickRevisions = [
    { 
      label: 'Tighten Act 2', 
      action: 'tighten_act2',
      icon: Zap,
      description: 'Reduce redundancy in the middle section'
    },
    { 
      label: 'Raise Stakes', 
      action: 'raise_stakes',
      icon: TrendingUp,
      description: 'Increase tension and conflict'
    },
    { 
      label: 'More Emotional', 
      action: 'more_emotional',
      icon: Sparkles,
      description: 'Add emotional depth to key scenes'
    },
    { 
      label: 'Shorten Exposition', 
      action: 'shorten_exposition',
      icon: Wand2,
      description: 'Make the setup more concise'
    }
  ]

  const handleQuickRevision = async (action: string) => {
    setIsAnalyzing(true)
    await onRevise(action)
    setIsAnalyzing(false)
  }

  const getBeatColor = (beatType?: string) => {
    switch (beatType) {
      case 'hook': return 'bg-blue-500'
      case 'inciting_incident': return 'bg-purple-500'
      case 'rising_action': return 'bg-yellow-500'
      case 'midpoint': return 'bg-orange-500'
      case 'crisis': return 'bg-red-500'
      case 'climax': return 'bg-pink-500'
      case 'resolution': return 'bg-green-500'
      default: return 'bg-gray-500'
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            Script Composer
          </CardTitle>
          <CardDescription>
            Edit your story with AI-powered narrative guidance
          </CardDescription>
        </CardHeader>
      </Card>

      <Tabs defaultValue="edit" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="edit">Edit Story</TabsTrigger>
          <TabsTrigger value="scenes">Scene Breakdown</TabsTrigger>
          <TabsTrigger value="revisions">Quick Revisions</TabsTrigger>
        </TabsList>

        {/* Edit Tab */}
        <TabsContent value="edit" className="space-y-4">
          <Card>
            <CardContent className="pt-6">
              <Textarea
                value={story}
                onChange={(e) => setStory(e.target.value)}
                placeholder="Enter your story here..."
                className="min-h-[400px] font-mono text-sm"
              />
              <div className="flex items-center justify-between mt-4">
                <div className="text-sm text-muted-foreground">
                  {story.split(' ').length} words • {story.length} characters
                </div>
                <Button onClick={onAnalyze} disabled={isAnalyzing}>
                  {isAnalyzing ? (
                    <>
                      <Sparkles className="w-4 h-4 mr-2 animate-spin" />
                      Analyzing...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 mr-2" />
                      Re-analyze Story
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Narrative Coach */}
          {narrativeSuggestions && narrativeSuggestions.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 text-accent" />
                  Narrative Coach
                </CardTitle>
                <CardDescription>
                  AI-powered suggestions to improve your story
                </CardDescription>
              </CardHeader>
              <CardContent>
                <NarrativeCoach suggestions={narrativeSuggestions} />
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Scenes Tab */}
        <TabsContent value="scenes" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Scene Breakdown</CardTitle>
              <CardDescription>
                {scenes.length} scenes • {storyArc?.pacing.totalDuration || 0}s total duration
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {scenes.map((scene, index) => (
                  <div
                    key={scene.id}
                    className={`p-4 border rounded-lg cursor-pointer transition-all ${
                      selectedScene === scene.id 
                        ? 'border-primary bg-primary/5' 
                        : 'hover:border-primary/50'
                    }`}
                    onClick={() => setSelectedScene(scene.id)}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge variant="outline">Scene {index + 1}</Badge>
                          {scene.beatType && scene.beatType !== 'scene' && (
                            <Badge className={`${getBeatColor(scene.beatType)} text-white`}>
                              {scene.beatType.replace('_', ' ')}
                            </Badge>
                          )}
                          {scene.tensionLevel !== undefined && (
                            <Badge variant="secondary">
                              Tension: {scene.tensionLevel}/10
                            </Badge>
                          )}
                        </div>
                        <h4 className="font-semibold mb-1">{scene.title}</h4>
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {scene.description}
                        </p>
                        <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                          <span>{scene.characters.length} characters</span>
                          <span>•</span>
                          <span>{scene.suggestedDuration || 5}s duration</span>
                        </div>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleQuickRevision(`edit_scene_${scene.id}`)
                        }}
                      >
                        <Wand2 className="w-3 h-3 mr-1" />
                        Edit
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Quick Revisions Tab */}
        <TabsContent value="revisions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Quick Revisions</CardTitle>
              <CardDescription>
                One-click improvements powered by AI
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {quickRevisions.map((revision) => {
                  const Icon = revision.icon
                  return (
                    <Card
                      key={revision.action}
                      className="cursor-pointer hover:border-primary transition-all"
                      onClick={() => handleQuickRevision(revision.action)}
                    >
                      <CardContent className="pt-6">
                        <div className="flex items-start gap-3">
                          <div className="p-2 rounded-lg bg-primary/10">
                            <Icon className="w-5 h-5 text-primary" />
                          </div>
                          <div className="flex-1">
                            <h4 className="font-semibold mb-1">{revision.label}</h4>
                            <p className="text-sm text-muted-foreground">
                              {revision.description}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            </CardContent>
          </Card>

          {/* Act-Specific Revisions */}
          {storyArc && (
            <Card>
              <CardHeader>
                <CardTitle>Act-Specific Revisions</CardTitle>
                <CardDescription>
                  Target specific parts of your story structure
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <Button
                    variant="outline"
                    className="w-full justify-start"
                    onClick={() => handleQuickRevision('enhance_act1')}
                    disabled={isAnalyzing}
                  >
                    <Sparkles className="w-4 h-4 mr-2" />
                    Enhance Act 1 Setup ({storyArc.acts.act1.scenes.length} scenes)
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full justify-start"
                    onClick={() => handleQuickRevision('tighten_act2')}
                    disabled={isAnalyzing}
                  >
                    <Zap className="w-4 h-4 mr-2" />
                    Tighten Act 2 ({storyArc.acts.act2.scenes.length} scenes)
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full justify-start"
                    onClick={() => handleQuickRevision('strengthen_act3')}
                    disabled={isAnalyzing}
                  >
                    <TrendingUp className="w-4 h-4 mr-2" />
                    Strengthen Act 3 Resolution ({storyArc.acts.act3.scenes.length} scenes)
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
