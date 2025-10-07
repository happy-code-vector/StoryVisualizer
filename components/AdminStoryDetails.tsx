"use client"

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { 
  ArrowLeft, 
  Calendar, 
  Users, 
  BookOpen, 
  Eye, 
  Download, 
  Settings,
  Play,
  Video,
  Trash2
} from "lucide-react"
import CharacterCard from "./CharacterCard"
import SceneCard from "./SceneCard"

interface Character {
  name: string
  description: string
  imageUrl?: string
  mentions: number
  attributes: string[]
  briefIntro: string
}

interface Scene {
  id: number
  title: string
  description: string
  characters: string[]
  duration?: number
  audioElements?: string[]
  imageUrl?: string
  videoUrl?: string
  // Legacy fields for compatibility
  setting?: string
  mood?: string
  timeOfDay?: string
  keyActions?: string[]
  objects?: string[]
  emotions?: string[]
}

interface Story {
  id: number
  title: string
  story: string
  analysis: {
    characters: Character[]
    scenes: Scene[]
  }
  models: {
    characterModel: string | null
    sceneModel: string | null
    videoModel: string | null
  }
  createdAt: string
}

interface AdminStoryDetailsProps {
  story: Story
  isOpen: boolean
  onClose: () => void
  onDelete: (id: number, title: string) => void
}

export default function AdminStoryDetails({ story, isOpen, onClose, onDelete }: AdminStoryDetailsProps) {
  const [processedCharacters, setProcessedCharacters] = useState<Character[]>(() => {
    return story.analysis.characters.map((char) => ({
      ...char,
      imageUrl: char.imageUrl || `/placeholder.svg?height=400&width=400&text=${encodeURIComponent(char.name)}`,
    }))
  })

  const [processedScenes, setProcessedScenes] = useState<Scene[]>(() => {
    return story.analysis.scenes.map((scene) => ({
      ...scene,
      // Convert new scene format to legacy format for SceneCard compatibility
      setting: scene.description || scene.setting || '',
      mood: scene.mood || 'neutral',
      timeOfDay: scene.timeOfDay || 'unknown',
      keyActions: scene.keyActions || [],
      objects: scene.objects || [],
      emotions: scene.emotions || [],
      analysis: scene, // Pass the full scene data
      imageUrl: scene.imageUrl || `/placeholder.svg?height=600&width=800&text=${encodeURIComponent(scene.title || 'Scene')}`,
    }))
  })

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getStoryPreview = (story: string) => {
    const sentences = story.split('. ').slice(0, 2);
    return sentences.join('. ') + (sentences.length < story.split('. ').length ? '...' : '');
  }

  const exportStory = () => {
    const results = {
      story: story.story,
      title: story.title,
      characters: processedCharacters.map((c) => ({
        name: c.name,
        description: c.description,
        mentions: c.mentions,
        attributes: c.attributes,
        briefIntro: c.briefIntro
      })),
      scenes: processedScenes.map((s) => ({
        id: s.id,
        title: s.title,
        description: s.description,
        characters: s.characters,
        duration: s.duration,
        audioElements: s.audioElements,
        setting: s.setting,
        mood: s.mood,
        timeOfDay: s.timeOfDay,
        keyActions: s.keyActions,
        objects: s.objects,
        emotions: s.emotions
      })),
      models: story.models,
      createdAt: story.createdAt
    }

    const blob = new Blob([JSON.stringify(results, null, 2)], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `${story.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}-analysis.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  const scenesWithVideos = processedScenes.filter(scene => scene.videoUrl)

  if (!isOpen) return null

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-7xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <DialogTitle className="text-2xl gradient-text">
                {story.title || "Untitled Story"}
              </DialogTitle>
              <Badge variant="secondary" className="flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                {formatDate(story.createdAt)}
              </Badge>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                onClick={exportStory}
                className="flex items-center gap-2"
              >
                <Download className="w-4 h-4" />
                Export
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => onDelete(story.id, story.title)}
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto">
          <div className="space-y-6 p-1">
            {/* Summary Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
                <CardContent className="pt-4">
                  <div className="text-2xl font-bold text-primary">{processedCharacters.length}</div>
                  <div className="text-sm text-muted-foreground">Characters</div>
                </CardContent>
              </Card>
              <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
                <CardContent className="pt-4">
                  <div className="text-2xl font-bold text-accent">{processedScenes.length}</div>
                  <div className="text-sm text-muted-foreground">Scenes</div>
                </CardContent>
              </Card>
              <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
                <CardContent className="pt-4">
                  <div className="text-2xl font-bold text-primary">{story.story.split(" ").length}</div>
                  <div className="text-sm text-muted-foreground">Words</div>
                </CardContent>
              </Card>
              <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
                <CardContent className="pt-4">
                  <div className="text-2xl font-bold text-accent">
                    {scenesWithVideos.length}
                  </div>
                  <div className="text-sm text-muted-foreground">Videos</div>
                </CardContent>
              </Card>
            </div>

            {/* Models Information */}
            <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="w-5 h-5 text-primary" />
                  AI Models Used
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Character Model</label>
                    <div className="mt-1">
                      <Badge variant="outline">{story.models.characterModel || 'Not specified'}</Badge>
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Scene Model</label>
                    <div className="mt-1">
                      <Badge variant="outline">{story.models.sceneModel || 'Not specified'}</Badge>
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Video Model</label>
                    <div className="mt-1">
                      <Badge variant="outline">{story.models.videoModel || 'Not specified'}</Badge>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Story Content */}
            <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-primary" />
                  Original Story
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="prose max-w-none">
                  <p className="text-muted-foreground whitespace-pre-wrap line-clamp-3">
                    {getStoryPreview(story.story)}
                  </p>
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button variant="outline" className="mt-4">
                        <Eye className="w-4 h-4 mr-2" />
                        View Full Story
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                      <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                          <BookOpen className="w-5 h-5 text-primary" />
                          {story.title || "Untitled Story"}
                        </DialogTitle>
                      </DialogHeader>
                      <div className="prose max-w-none">
                        <p className="text-muted-foreground whitespace-pre-wrap">{story.story}</p>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardContent>
            </Card>

            {/* Characters Section */}
            <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5 text-accent" />
                  Characters ({processedCharacters.length})
                </CardTitle>
                <CardDescription>AI-identified characters with extracted descriptions and attributes</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {processedCharacters.map((character, index) => (
                    <CharacterCard key={index} character={character} index={index} />
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Scenes Section */}
            <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-primary" />
                  Scenes ({processedScenes.length})
                </CardTitle>
                <CardDescription>
                  Story scenes with AI-analyzed settings, moods, and character interactions
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-8">
                  {processedScenes.map((scene, index) => (
                    <SceneCard 
                      key={scene.id} 
                      scene={scene} 
                      index={index} 
                      isLast={index === processedScenes.length - 1} 
                    />
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Videos Section */}
            {scenesWithVideos.length > 0 && (
              <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Play className="w-5 h-5 text-accent" />
                    Video Clips ({scenesWithVideos.length})
                  </CardTitle>
                  <CardDescription>
                    Generated video clips for story scenes
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {scenesWithVideos.map((scene) => (
                      <Card key={`video-${scene.id}`} className="border-border/50">
                        <div className="aspect-video relative bg-black overflow-hidden rounded-t-lg">
                          <video
                            src={scene.videoUrl}
                            className="w-full h-full object-cover"
                            controls
                            playsInline
                          />
                          <div className="absolute top-2 right-2">
                            <Badge className="bg-accent text-accent-foreground">
                              <Video className="w-3 h-3 mr-1" />
                              {scene.duration || 5}s
                            </Badge>
                          </div>
                        </div>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-lg line-clamp-1">{scene.title}</CardTitle>
                        </CardHeader>
                        <CardContent className="pt-0">
                          <p className="text-sm text-muted-foreground line-clamp-2">
                            {scene.description}
                          </p>
                          {scene.characters.length > 0 && (
                            <div className="mt-3 flex flex-wrap gap-1">
                              {scene.characters.slice(0, 3).map((characterName, i) => (
                                <Badge key={i} variant="outline" className="text-xs">
                                  {characterName}
                                </Badge>
                              ))}
                              {scene.characters.length > 3 && (
                                <Badge variant="outline" className="text-xs">
                                  +{scene.characters.length - 3} more
                                </Badge>
                              )}
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}