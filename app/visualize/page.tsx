"use client"

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Sparkles, Users, BookOpen, Download, History, ArrowLeft } from "lucide-react"
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

interface ProcessingState {
  step: string
  progress: number
  isProcessing: boolean
}

interface StoryAnalysis {
  title: string
  story: string
  analysis: {
    characters: Character[]
    scenes: Scene[]
  }
}

export default function VisualizePage() {
  const [storyAnalysis, setStoryAnalysis] = useState<StoryAnalysis | null>(null)
  const [characters, setCharacters] = useState<Character[]>([])
  const [scenes, setScenes] = useState<Scene[]>([])
  const [processing, setProcessing] = useState<ProcessingState>({
    step: "Preparing to generate images...",
    progress: 0,
    isProcessing: true,
  })
  const [isClient, setIsClient] = useState(false)
  const router = useRouter()

  useEffect(() => {
    setIsClient(true)
    
    const storedAnalysis = sessionStorage.getItem('storyAnalysis')
    if (storedAnalysis) {
      const analysis: StoryAnalysis = JSON.parse(storedAnalysis)
      setStoryAnalysis(analysis)
    } else {
      router.push('/story')
    }
  }, [])

  useEffect(() => {
    if (isClient && storyAnalysis) {
      const processedCharacters: Character[] = storyAnalysis.analysis.characters.map((char) => ({
        ...char,
        imageUrl: undefined, // Will be generated later
      }))

      const processedScenes: Scene[] = storyAnalysis.analysis.scenes.map((scene) => ({
        ...scene,
        analysis: scene,
        imageUrl: undefined, // Will be generated later
      }))

      setCharacters(processedCharacters)
      setScenes(processedScenes)
      
      // Generate images for characters and scenes
      generateImages(processedCharacters, processedScenes)
    }
  }, [isClient, storyAnalysis])

  const generateImages = async (characters: Character[], scenes: Scene[]) => {
    setProcessing({ step: "Generating character images...", progress: 10, isProcessing: true })
    
    const charactersWithImages = await Promise.all(
      characters.map(async (character, index) => {
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
          
          const progress = 10 + Math.floor((index + 1) / characters.length * 40)
          setProcessing({ 
            step: `Generating character images (${index + 1}/${characters.length})...`, 
            progress, 
            isProcessing: true 
          })
          
          return {
            ...character,
            imageUrl
          }
        } catch (error) {
          console.error(`[VisualizePage] Error generating image for character ${character.name}:`, error)
          return {
            ...character,
            imageUrl: `/placeholder.svg?height=400&width=400&text=${encodeURIComponent(character.name)}`
          }
        }
      })
    )

    setCharacters(charactersWithImages)
    setProcessing({ step: "Generating scene images...", progress: 50, isProcessing: true })
    
    const scenesWithImages = await Promise.all(
      scenes.map(async (scene, index) => {
        try {
          console.log(`[VisualizePage] Generating image for scene: ${scene.title}`)
          
          const characterImages = scene.characters
            .map(characterName => {
              const character = charactersWithImages.find(c => c.name === characterName);
              return character?.imageUrl ? character.imageUrl : null;
            })
            .filter(Boolean) as string[];
          
          const response = await fetch('/api/generate-scene-image', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              ...scene,
              characterImages // Pass character images to the scene generation
            }),
          })

          if (!response.ok) {
            const errorData = await response.json()
            throw new Error(errorData.error || 'Failed to generate scene image')
          }

          const { imageUrl } = await response.json()
          console.log(`[VisualizePage] Generated image for scene ${scene.title}:`, imageUrl)
          
          const progress = 50 + Math.floor((index + 1) / scenes.length * 40)
          setProcessing({ 
            step: `Generating scene images (${index + 1}/${scenes.length})...`, 
            progress, 
            isProcessing: true 
          })
          
          return {
            ...scene,
            imageUrl
          }
        } catch (error) {
          console.error(`[VisualizePage] Error generating image for scene ${scene.title}:`, error)
          return {
            ...scene,
            imageUrl: `/placeholder.svg?height=600&width=800&text=${encodeURIComponent(scene.setting)}`
          }
        }
      })
    )

    setScenes(scenesWithImages)
    
    setProcessing({ step: "Saving to database...", progress: 90, isProcessing: true })
    
    try {
      const response = await fetch('/api/save-story-analysis', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: storyAnalysis?.title || "Untitled Story",
          story: storyAnalysis?.story || "",
          analysis: {
            characters: charactersWithImages,
            scenes: scenesWithImages
          }
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to save story analysis')
      }
      
      const result = await response.json()
      console.log('[VisualizePage] Story analysis saved with ID:', result.id)
    } catch (error) {
      console.error('[VisualizePage] Error saving story analysis to database:', error)
    }
    
    setProcessing({ step: "Complete!", progress: 100, isProcessing: false })
    console.log("[VisualizePage] Image generation complete!")
  }

  const exportResults = () => {
    if (!storyAnalysis) return
    
    const results = {
      story: storyAnalysis.story.substring(0, 200) + "...",
      characters: characters.map((c) => ({
        name: c.name,
        description: c.description,
        mentions: c.mentions,
        attributes: c.attributes,
      })),
      scenes: scenes.map((s) => ({
        id: s.id,
        title: s.title,
        description: s.description,
        setting: s.setting,
        mood: s.mood,
        characters: s.characters,
      })),
    }

    const blob = new Blob([JSON.stringify(results, null, 2)], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "story-analysis.json"
    a.click()
    URL.revokeObjectURL(url)
  }

  if (!storyAnalysis) {
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

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Animated Background Grid */}
      <div className="absolute inset-0 grid-pattern animate-grid opacity-30" />

      <div className="relative z-10 container mx-auto px-4 py-8">
        {/* Header with Actions */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Button variant="outline" onClick={() => router.push('/story')} className="flex items-center gap-2">
              <ArrowLeft className="w-4 h-4" />
              New Story
            </Button>
            <h2 className="text-3xl font-bold gradient-text">
              {storyAnalysis.title || "Story Analysis"}
            </h2>
          </div>
          <div className="flex items-center gap-3">
            <Button 
              variant="outline" 
              onClick={() => router.push('/history')}
              className="flex items-center gap-2"
            >
              <History className="w-4 h-4" />
              History
            </Button>
            <Button 
              variant="outline" 
              onClick={exportResults} 
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

        {/* Results Display */}
        {!processing.isProcessing && characters.length > 0 && scenes.length > 0 && (
          <div>
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
                  <div className="text-2xl font-bold text-primary">{storyAnalysis.story.split(" ").length}</div>
                  <div className="text-sm text-muted-foreground">Words</div>
                </CardContent>
              </Card>
              <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
                <CardContent className="pt-4">
                  <div className="text-2xl font-bold text-accent">
                    {characters.reduce((sum, c) => sum + c.mentions, 0)}
                  </div>
                  <div className="text-sm text-muted-foreground">Total Mentions</div>
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
        )}
      </div>
    </div>
  )
}