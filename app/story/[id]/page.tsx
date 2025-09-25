"use client"

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { ArrowLeft, Calendar, Users, BookOpen, Eye } from "lucide-react"
import CharacterCard from "@/components/CharacterCard"
import SceneCard from "@/components/SceneCard"

interface Character {
  name: string
  description: string
  imageUrl?: string
  mentions: number
  attributes: string[]
}

interface Scene {
  id: number
  title: string
  description: string
  characters: string[]
  setting: string
  mood: string
  imageUrl?: string
  analysis: any
}

interface Story {
  id: number
  title: string
  story: string
  analysis: {
    characters: Array<{
      name: string
      mentions: number
      description: string
      attributes: string[]
      relationships: string[]
    }>
    scenes: Array<{
      id: number
      title: string
      description: string
      setting: string
      timeOfDay: string
      mood: string
      keyActions: string[]
      characters: string[]
      objects: string[]
      emotions: string[]
    }>
  }
  createdAt: string
}

export default function StoryPage({ params }: { params: { id: string } }) {
  const [story, setStory] = useState<Story | null>(null)
  const [loading, setLoading] = useState(true)
  const [processedCharacters, setProcessedCharacters] = useState<Character[]>([])
  const [processedScenes, setProcessedScenes] = useState<Scene[]>([])
  const router = useRouter()

  useEffect(() => {
    fetchStory()
  }, [params.id])

  const fetchStory = async () => {
    try {
      const response = await fetch(`/api/stories?id=${params.id}`)
      const data = await response.json()
      
      if (data.error) {
        throw new Error(data.error)
      }
      
      setStory(data)
      
      // Process characters - use image URLs from the analysis
      const characters: Character[] = data.analysis.characters.map((char: any) => ({
        name: char.name,
        description: char.description,
        mentions: char.mentions,
        attributes: char.attributes,
        imageUrl: char.imageUrl || `/placeholder.svg?height=400&width=400&text=${encodeURIComponent(char.name)}`,
      }))
      
      // Process scenes - use image URLs from the analysis
      const scenes: Scene[] = data.analysis.scenes.map((scene: any) => ({
        id: scene.id,
        title: scene.title,
        description: scene.description,
        characters: scene.characters,
        setting: scene.setting,
        mood: scene.mood,
        analysis: scene,
        imageUrl: scene.imageUrl || `/placeholder.svg?height=600&width=800&text=${encodeURIComponent(scene.setting)}`,
      }))
      
      setProcessedCharacters(characters)
      setProcessedScenes(scenes)
    } catch (error) {
      console.error('Error fetching story:', error)
    } finally {
      setLoading(false)
    }
  }

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

  if (loading) {
    return (
      <div className="min-h-screen bg-background relative overflow-hidden">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        </div>
      </div>
    )
  }

  if (!story) {
    return (
      <div className="min-h-screen bg-background relative overflow-hidden">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center py-12">
            <h2 className="text-2xl font-bold mb-4">Story Not Found</h2>
            <p className="text-muted-foreground mb-6">The requested story analysis could not be found.</p>
            <Button onClick={() => router.push('/history')}>
              Back to History
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Button variant="outline" onClick={() => router.push('/history')}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to History
            </Button>
            <h1 className="text-3xl font-bold gradient-text">
              {story.title || "Untitled Story"}
            </h1>
          </div>
          <Badge variant="secondary" className="flex items-center gap-1">
            <Calendar className="w-3 h-3" />
            {formatDate(story.createdAt)}
          </Badge>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
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
                {processedCharacters.reduce((sum, c) => sum + c.mentions, 0)}
              </div>
              <div className="text-sm text-muted-foreground">Total Mentions</div>
            </CardContent>
          </Card>
        </div>

        {/* Story Content */}
        <Card className="mb-8 border-border/50 bg-card/50 backdrop-blur-sm">
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
        <Card className="mb-8 border-border/50 bg-card/50 backdrop-blur-sm">
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
                <SceneCard key={scene.id} scene={scene} index={index} isLast={index === processedScenes.length - 1} />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}