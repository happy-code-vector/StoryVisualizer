"use client"

import { useState, useEffect } from "react"
import { Button } from "./ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card"
import { Progress } from "./ui/progress"
import { Sparkles, Users, BookOpen, Download, History, ArrowLeft } from "lucide-react"
import CharacterCard from "./CharacterCard"
import SceneCard from "./SceneCard"

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

interface ProcessingState {
  step: string
  progress: number
  isProcessing: boolean
}

export default function StoryVisualizationResults({
  storyTitle,
  characters: initialCharacters,
  scenes: initialScenes,
  onBack,
  onExport
}: {
  storyTitle: string
  characters: Character[]
  scenes: Scene[]
  onBack: () => void
  onExport: (characters: Character[], scenes: Scene[]) => void
}) {
  const [characters, setCharacters] = useState<Character[]>(initialCharacters)
  const [scenes, setScenes] = useState<Scene[]>(initialScenes)
  const [processing, setProcessing] = useState<ProcessingState>({
    step: "Generating character images...",
    progress: 40,
    isProcessing: true,
  })

  useEffect(() => {
    // Generate images when component mounts
    generateImages()
  }, [])

  const generateImages = async () => {
    setProcessing({ step: "Generating character images...", progress: 40, isProcessing: true })
    
    // Generate character images
    const charactersWithImages = await Promise.all(
      initialCharacters.map(async (character, index) => {
        try {
          const response = await fetch('/api/generate-character-image', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(character),
          })

          if (!response.ok) {
            const errorData = await response.json()
            throw new Error(errorData.error || 'Failed to generate character image')
          }

          const { imageUrl } = await response.json()
          
          // Update progress
          const progress = 40 + Math.floor((index + 1) / initialCharacters.length * 20)
          setProcessing({ 
            step: `Generating character images (${index + 1}/${initialCharacters.length})...`, 
            progress, 
            isProcessing: true 
          })
          
          return {
            ...character,
            imageUrl
          }
        } catch (error) {
          console.error(`Error generating image for character ${character.name}:`, error)
          return {
            ...character,
            imageUrl: `/placeholder.svg?height=400&width=400&text=${encodeURIComponent(character.name)}`
          }
        }
      })
    )

    setCharacters(charactersWithImages)
    setProcessing({ step: "Generating scene images...", progress: 60, isProcessing: true })
    
    // Generate scene images
    const scenesWithImages = await Promise.all(
      initialScenes.map(async (scene, index) => {
        try {
          const response = await fetch('/api/generate-scene-image', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(scene),
          })

          if (!response.ok) {
            const errorData = await response.json()
            throw new Error(errorData.error || 'Failed to generate scene image')
          }

          const { imageUrl } = await response.json()
          
          // Update progress
          const progress = 60 + Math.floor((index + 1) / initialScenes.length * 30)
          setProcessing({ 
            step: `Generating scene images (${index + 1}/${initialScenes.length})...`, 
            progress, 
            isProcessing: true 
          })
          
          return {
            ...scene,
            imageUrl
          }
        } catch (error) {
          console.error(`Error generating image for scene ${scene.title}:`, error)
          return {
            ...scene,
            imageUrl: `/placeholder.svg?height=600&width=800&text=${encodeURIComponent(scene.setting)}`
          }
        }
      })
    )

    setScenes(scenesWithImages)
    setProcessing({ step: "Complete!", progress: 100, isProcessing: false })
  }

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Animated Background Grid */}
      <div className="absolute inset-0 grid-pattern animate-grid opacity-30" />

      <div className="relative z-10 container mx-auto px-4 py-8">
        {/* Header with Actions */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Button variant="outline" onClick={onBack} className="flex items-center gap-2">
              <ArrowLeft className="w-4 h-4" />
              Back
            </Button>
            <h2 className="text-3xl font-bold gradient-text">
              {storyTitle || "Story Analysis"}
            </h2>
          </div>
          <div className="flex items-center gap-3">
            <Button 
              variant="outline" 
              onClick={() => window.location.href = '/history'}
              className="flex items-center gap-2"
            >
              <History className="w-4 h-4" />
              History
            </Button>
            <Button 
              variant="outline" 
              onClick={() => onExport(characters, scenes)} 
              className="flex items-center gap-2 bg-transparent"
              disabled={processing.isProcessing}
            >
              <Download className="w-4 h-4" />
              Export
            </Button>
          </div>
        </div>

        {/* Processing Status */}
        {processing.isProcessing && (
          <Card className="mb-8 border-primary/20 bg-primary/5">
            <CardContent className="pt-6">
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <Sparkles className="w-5 h-5 text-primary animate-spin" />
                  <span className="font-medium">{processing.step}</span>
                </div>
                <Progress value={processing.progress} className="h-2" />
                <p className="text-sm text-muted-foreground">
                  AI is generating visualizations for your story characters and scenes...
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Summary Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
            <CardContent className="pt-4">
              <div className="text-2xl font-bold text-primary">{characters.length}</div>
              <div className="text-sm text-muted-foreground">Characters</div>
            </CardContent>
          </Card>
          <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
            <CardContent className="pt-4">
              <div className="text-2xl font-bold text-accent">{scenes.length}</div>
              <div className="text-sm text-muted-foreground">Scenes</div>
            </CardContent>
          </Card>
          <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
            <CardContent className="pt-4">
              <div className="text-2xl font-bold text-primary">
                {characters.reduce((sum, c) => sum + c.mentions, 0)}
              </div>
              <div className="text-sm text-muted-foreground">Total Mentions</div>
            </CardContent>
          </Card>
          <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
            <CardContent className="pt-4">
              <div className="text-2xl font-bold text-accent">
                {scenes.length}
              </div>
              <div className="text-sm text-muted-foreground">Scenes</div>
            </CardContent>
          </Card>
        </div>

        {/* Characters Section */}
        <Card className="mb-8 border-border/50 bg-card/50 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5 text-accent" />
              Characters ({characters.length})
            </CardTitle>
            <CardDescription>AI-identified characters with extracted descriptions and attributes</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {characters.map((character, index) => (
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
              Scenes ({scenes.length})
            </CardTitle>
            <CardDescription>
              Story scenes with AI-analyzed settings, moods, and character interactions
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-8">
              {scenes.map((scene, index) => (
                <SceneCard key={scene.id} scene={scene} index={index} isLast={index === scenes.length - 1} />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}