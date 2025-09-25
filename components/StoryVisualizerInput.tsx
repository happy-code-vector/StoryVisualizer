"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "./ui/button"
import { Textarea } from "./ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card"
import { Progress } from "./ui/progress"
import { Sparkles, BookOpen, Users, ImageIcon, Wand2, History } from "lucide-react"
import { analyzeStoryWithOpenAI } from "../lib/openai-service"

export default function StoryVisualizerInput() {
  const [story, setStory] = useState("")
  const [storyTitle, setStoryTitle] = useState("")
  const [processing, setProcessing] = useState(false)
  const [progress, setProgress] = useState(0)
  const router = useRouter()

  const processStory = async () => {
    if (!story.trim()) return

    setProcessing(true)
    setProgress(10)

    try {
      setProgress(30)
      console.log("[OpenAI] Starting story analysis...")
      const analysis = await analyzeStoryWithOpenAI(story, storyTitle || "Untitled Story")
      
      setProgress(40)
      console.log("[OpenAI] Analysis complete, navigating to visualize page...")
      
      // Navigate to the visualize page with the analysis result
      const payload = {
        title: storyTitle || "Untitled Story",
        story: story,
        analysis: analysis
      }
      
      // Store the payload in sessionStorage for retrieval on the visualize page
      sessionStorage.setItem('storyAnalysis', JSON.stringify(payload))
      
      // Navigate to the visualize page
      router.push('/visualize')
    } catch (error) {
      console.error("[OpenAI] Error analyzing story:", error)
      setProcessing(false)
    }
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
        <div className="max-w-4xl mx-auto">
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
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Story Title (Optional)</label>
                  <input
                    type="text"
                    placeholder="My Amazing Story"
                    value={storyTitle}
                    onChange={(e) => setStoryTitle(e.target.value)}
                    className="w-full px-3 py-2 border border-border/50 rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary/50"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">Story Content</label>
                  <Textarea
                    placeholder="Once upon a time, in a land far away..."
                    value={story}
                    onChange={(e) => setStory(e.target.value)}
                    className="min-h-[200px] text-base leading-relaxed resize-none border-border/50 focus:border-primary/50"
                  />
                </div>
              </div>
              <div className="flex items-center justify-between mt-4">
                <span className="text-sm text-muted-foreground">{story.length} characters</span>
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    onClick={() => router.push('/history')}
                    className="flex items-center gap-2"
                  >
                    <History className="w-4 h-4" />
                    History
                  </Button>
                  <Button
                    onClick={processStory}
                    disabled={!story.trim() || processing}
                    className="bg-primary hover:bg-primary/90 text-primary-foreground"
                  >
                    {processing ? (
                      <>
                        <Wand2 className="w-4 h-4 mr-2 animate-spin" />
                        Analyzing...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4 mr-2" />
                        Visualize Story
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Processing Status */}
          {processing && (
            <Card className="mb-8 border-primary/20 bg-primary/5">
              <CardContent className="pt-6">
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <Wand2 className="w-5 h-5 text-primary animate-spin" />
                    <span className="font-medium">Analyzing story with AI...</span>
                  </div>
                  <Progress value={progress} className="h-2" />
                  <p className="text-sm text-muted-foreground">
                    AI is analyzing your story structure and identifying characters and scenes...
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
      </div>
    </div>
  )
}