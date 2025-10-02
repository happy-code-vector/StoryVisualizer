"use client"

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Sparkles, Users, BookOpen, Download, ArrowLeft, Play, Video, Image } from "lucide-react"
import CharacterCard from "@/components/CharacterCard"
import SceneCard from "@/components/SceneCard"

interface Character {
  name: string
  description: string
  imageUrl?: string
  mentions: number
  attributes: string[]
  relationships: string[]
  audioCues: string[]
}

interface Scene {
  id: number
  title: string
  description: string
  characters: string[]
  duration: number
  audioElements: string[]
  imageUrl?: string
  videoUrl?: string
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
  characterModel?: string
  sceneModel?: string
  videoModel?: string
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
  const [videoGenerationPrompts, setVideoGenerationPrompts] = useState<{[key: number]: boolean}>({})
  const [generatingVideo, setGeneratingVideo] = useState<{[key: number]: boolean}>({})
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

    let id = 0
    const charactersWithImages = await Promise.all(
      characters.map(async (character, index) => {
        try {
          const response = await fetch('/api/generate-character-image', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              character,
              modelName: storyAnalysis?.characterModel || 'nano-banana'
            }),
          })

          if (!response.ok) {
            const errorData = await response.json()
            throw new Error(errorData.error || 'Failed to generate character image')
          }

          const { imageUrl } = await response.json()

          const progress = 10 + Math.floor((id + 1) / characters.length * 40)
          setProcessing({
            step: `Generating character images (${id + 1}/${characters.length})...`,
            progress,
            isProcessing: true
          })
          id++

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

    id = 0
    const scenesWithImages = await Promise.all(
      scenes.map(async (scene, index) => {
        try {
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
              scene: {
                ...scene,
                characterImages // Pass character images to the scene generation
              },
              modelName: storyAnalysis?.sceneModel || 'flux-dev'
            }),
          })

          if (!response.ok) {
            const errorData = await response.json()
            throw new Error(errorData.error || 'Failed to generate scene image')
          }

          const { imageUrl } = await response.json()

          const progress = 50 + Math.floor((id + 1) / scenes.length * 40)
          setProcessing({
            step: `Generating scene images (${id + 1}/${scenes.length})...`,
            progress,
            isProcessing: true
          })
          id++

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

    // After generating all scene images, ask user about video generation
    setProcessing({ step: "Images generated! Ready for video generation.", progress: 90, isProcessing: false })
    
    // Show video generation prompts for each scene
    const prompts: {[key: number]: boolean} = {}
    scenesWithImages.forEach(scene => {
      prompts[scene.id] = true
    })
    setVideoGenerationPrompts(prompts)
  }

  const generateVideoForScene = async (scene: Scene) => {
    if (!scene.imageUrl || !storyAnalysis?.videoModel) return

    setGeneratingVideo(prev => ({ ...prev, [scene.id]: true }))
    
    try {
      const response = await fetch('/api/generate-scene-video', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          imageUrl: scene.imageUrl,
          scene: scene,
          modelName: storyAnalysis.videoModel
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to generate video')
      }

      const { videoUrl } = await response.json()
      
      // Update the scene with video URL
      setScenes(prev => prev.map(s => 
        s.id === scene.id ? { ...s, videoUrl } : s
      ))

      // Update in database if story is already saved
      try {
        await fetch('/api/update-story-images', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            sceneId: scene.id,
            videoUrl: videoUrl
          })
        })
      } catch (dbError) {
        console.error('Error updating video URL in database:', dbError)
      }

    } catch (error) {
      console.error(`Error generating video for scene ${scene.title}:`, error)
      alert(`Failed to generate video for ${scene.title}: ${error}`)
    } finally {
      setGeneratingVideo(prev => ({ ...prev, [scene.id]: false }))
      setVideoGenerationPrompts(prev => ({ ...prev, [scene.id]: false }))
    }
  }

  const skipVideoGeneration = (sceneId: number) => {
    setVideoGenerationPrompts(prev => ({ ...prev, [sceneId]: false }))
  }

  const saveStoryToDatabase = async () => {
    setProcessing({ step: "Saving to database...", progress: 95, isProcessing: true })

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
            characters: characters,
            scenes: scenes
          },
          models: {
            characterModel: storyAnalysis?.characterModel,
            sceneModel: storyAnalysis?.sceneModel,
            videoModel: storyAnalysis?.videoModel
          }
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to save story analysis')
      }

      const result = await response.json()
      setProcessing({ step: "Saved successfully!", progress: 100, isProcessing: false })
    } catch (error) {
      console.error('Error saving story analysis to database:', error)
      setProcessing({ step: "Error saving to database", progress: 100, isProcessing: false })
    }
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
              onClick={() => router.push('/gallery')}
              className="flex items-center gap-2"
            >
              <Image className="w-4 h-4" />
              Gallery
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
            <Button
              onClick={saveStoryToDatabase}
              className="flex items-center gap-2"
              disabled={processing.isProcessing}
            >
              <Download className="w-4 h-4" />
              Save to Database
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

        {/* Video Generation Prompts */}
        {Object.keys(videoGenerationPrompts).some(key => videoGenerationPrompts[parseInt(key)]) && (
          <Card className="mb-8 border-accent/20 bg-accent/5">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Video className="w-5 h-5 text-accent" />
                Video Generation Ready
              </CardTitle>
              <CardDescription>
                Would you like to generate videos for your scenes? This will create animated clips from the scene images.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {scenes.filter(scene => videoGenerationPrompts[scene.id]).map(scene => (
                  <div key={scene.id} className="flex items-center justify-between p-4 border border-border/50 rounded-lg">
                    <div className="flex-1">
                      <h4 className="font-medium">{scene.title}</h4>
                      <p className="text-sm text-muted-foreground mt-1">{scene.description.substring(0, 100)}...</p>
                      <p className="text-xs text-muted-foreground mt-1">Duration: {scene.duration || 5} seconds</p>
                    </div>
                    <div className="flex items-center gap-2 ml-4">
                      {generatingVideo[scene.id] ? (
                        <div className="flex items-center gap-2">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-accent"></div>
                          <span className="text-sm">Generating...</span>
                        </div>
                      ) : (
                        <>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => skipVideoGeneration(scene.id)}
                          >
                            Skip
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => generateVideoForScene(scene)}
                            className="flex items-center gap-1"
                          >
                            <Play className="w-3 h-3" />
                            Generate Video
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                ))}
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