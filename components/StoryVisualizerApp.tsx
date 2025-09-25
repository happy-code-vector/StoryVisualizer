"use client"

import { useState } from "react"
import { Button } from "./ui/button"
import { Textarea } from "./ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card"
import { Progress } from "./ui/progress"
import { Sparkles, BookOpen, Users, ImageIcon, Wand2, Download } from "lucide-react"
import { TextProcessor } from "../lib/text-processor"
import { CharacterExtractor } from "../lib/character-extractor"
import { SceneAnalyzer } from "../lib/scene-analyzer"
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

export default function StoryVisualizerApp() {
  const [story, setStory] = useState("")
  const [characters, setCharacters] = useState<Character[]>([])
  const [scenes, setScenes] = useState<Scene[]>([])
  const [processing, setProcessing] = useState<ProcessingState>({
    step: "",
    progress: 0,
    isProcessing: false,
  })

  const processStory = async () => {
    if (!story.trim()) return

    setProcessing({ step: "Analyzing text structure...", progress: 10, isProcessing: true })
    await new Promise((resolve) => setTimeout(resolve, 800))

    console.log("[v0] Starting text preprocessing...")
    const preprocessedText = TextProcessor.preprocessText(story)

    setProcessing({ step: "Identifying characters...", progress: 30, isProcessing: true })
    await new Promise((resolve) => setTimeout(resolve, 1000))

    console.log("[v0] Extracting characters...")
    const extractedCharacters = CharacterExtractor.extractCharacters(preprocessedText)
    console.log(
      "[v0] Found characters:",
      extractedCharacters.map((c) => c.name),
    )

    const processedCharacters: Character[] = extractedCharacters.map((char) => ({
      name: char.name,
      description: CharacterExtractor.generateCharacterDescription(char),
      mentions: char.mentions,
      attributes: char.attributes,
      imageUrl: `/placeholder.svg?height=400&width=400&query=${encodeURIComponent(
        `${char.name} - ${CharacterExtractor.generateCharacterDescription(char)}`,
      )}`,
    }))

    setProcessing({ step: "Breaking down scenes...", progress: 50, isProcessing: true })
    await new Promise((resolve) => setTimeout(resolve, 1000))

    console.log("[v0] Extracting scenes...")
    const extractedScenes = TextProcessor.extractScenes(preprocessedText)
    console.log("[v0] Found scenes:", extractedScenes.length)

    setProcessing({ step: "Analyzing scene details...", progress: 70, isProcessing: true })
    await new Promise((resolve) => setTimeout(resolve, 1000))

    const characterNames = processedCharacters.map((c) => c.name)
    const processedScenes: Scene[] = extractedScenes.map((scene) => {
      const analysis = SceneAnalyzer.analyzeScene(scene.content, characterNames)
      console.log(`[v0] Scene ${scene.id} analysis:`, analysis)

      return {
        id: scene.id,
        title: scene.title,
        description: analysis.atmosphere || scene.content.substring(0, 200) + "...",
        characters: analysis.characters,
        setting: analysis.setting,
        mood: analysis.mood,
        analysis,
        imageUrl: `/placeholder.svg?height=600&width=800&query=${encodeURIComponent(
          SceneAnalyzer.generateScenePrompt(analysis),
        )}`,
      }
    })

    setProcessing({ step: "Generating visualizations...", progress: 90, isProcessing: true })
    await new Promise((resolve) => setTimeout(resolve, 1000))

    console.log("[v0] Processing complete!")
    setCharacters(processedCharacters)
    setScenes(processedScenes)
    setProcessing({ step: "Complete!", progress: 100, isProcessing: false })
  }

  const resetApp = () => {
    setStory("")
    setCharacters([])
    setScenes([])
    setProcessing({ step: "", progress: 0, isProcessing: false })
  }

  const exportResults = () => {
    const results = {
      story: story.substring(0, 200) + "...",
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

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Animated Background Grid */}
      <div className="absolute inset-0 grid-pattern animate-grid opacity-30" />

      {/* Floating Elements */}
      <div className="absolute top-20 left-10 w-4 h-4 bg-primary/20 rounded-full floating-animation" />
      <div
        className="absolute top-40 right-20 w-6 h-6 bg-accent/20 rounded-full floating-animation"
        style={{ animationDelay: "2s" }}
      />
      <div
        className="absolute bottom-40 left-20 w-3 h-3 bg-primary/30 rounded-full floating-animation"
        style={{ animationDelay: "4s" }}
      />

      <div className="relative z-10 container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="p-3 bg-primary/10 rounded-2xl pulse-glow">
              <Sparkles className="w-8 h-8 text-primary" />
            </div>
            <h1 className="text-5xl font-bold gradient-text">Story Visualizer AI</h1>
          </div>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Transform your stories into stunning visual narratives with AI-powered character and scene generation
          </p>
        </div>

        {/* Main Content */}
        {!characters.length && !scenes.length ? (
          <div className="max-w-4xl mx-auto">
            {/* Story Input */}
            <Card className="mb-8 border-border/50 bg-card/50 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-primary" />
                  Enter Your Story
                </CardTitle>
                <CardDescription>
                  Paste your story text below and let AI analyze characters, scenes, and create visualizations
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Textarea
                  placeholder="Once upon a time, in a land far away..."
                  value={story}
                  onChange={(e) => setStory(e.target.value)}
                  className="min-h-[200px] text-base leading-relaxed resize-none border-border/50 focus:border-primary/50"
                />
                <div className="flex items-center justify-between mt-4">
                  <span className="text-sm text-muted-foreground">{story.length} characters</span>
                  <Button
                    onClick={processStory}
                    disabled={!story.trim() || processing.isProcessing}
                    className="bg-primary hover:bg-primary/90 text-primary-foreground"
                  >
                    {processing.isProcessing ? (
                      <>
                        <Wand2 className="w-4 h-4 mr-2 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4 mr-2" />
                        Visualize Story
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Processing Status */}
            {processing.isProcessing && (
              <Card className="border-primary/20 bg-primary/5">
                <CardContent className="pt-6">
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <Wand2 className="w-5 h-5 text-primary animate-spin" />
                      <span className="font-medium">{processing.step}</span>
                    </div>
                    <Progress value={processing.progress} className="h-2" />
                    <p className="text-sm text-muted-foreground">
                      AI is analyzing your story structure, identifying characters, and preparing visualizations...
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Features Preview */}
            <div className="grid md:grid-cols-3 gap-6 mt-12">
              <Card className="border-border/50 bg-card/30 backdrop-blur-sm hover:bg-card/50 transition-colors">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3 mb-3">
                    <Users className="w-6 h-6 text-accent" />
                    <h3 className="font-semibold">Character Analysis</h3>
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    AI identifies characters and extracts detailed descriptions for accurate visual generation
                  </p>
                </CardContent>
              </Card>

              <Card className="border-border/50 bg-card/30 backdrop-blur-sm hover:bg-card/50 transition-colors">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3 mb-3">
                    <BookOpen className="w-6 h-6 text-primary" />
                    <h3 className="font-semibold">Scene Breakdown</h3>
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Advanced NLP segments your story into distinct scenes with setting and mood analysis
                  </p>
                </CardContent>
              </Card>

              <Card className="border-border/50 bg-card/30 backdrop-blur-sm hover:bg-card/50 transition-colors">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3 mb-3">
                    <ImageIcon className="w-6 h-6 text-accent" />
                    <h3 className="font-semibold">Visual Generation</h3>
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    High-quality character portraits and scene illustrations bring your story to life
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        ) : (
          /* Results Display */
          <div className="max-w-6xl mx-auto">
            {/* Header with Actions */}
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-3xl font-bold gradient-text">Story Analysis Complete</h2>
              <div className="flex items-center gap-3">
                <Button variant="outline" onClick={exportResults} className="flex items-center gap-2 bg-transparent">
                  <Download className="w-4 h-4" />
                  Export
                </Button>
                <Button variant="outline" onClick={resetApp}>
                  New Story
                </Button>
              </div>
            </div>

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
                  <div className="text-2xl font-bold text-primary">{story.split(" ").length}</div>
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
