"use client"

import { useState, useEffect } from 'react'
import Link from "next/link"
import { useRouter } from 'next/navigation'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { 
  BookOpen, 
  ImageIcon, 
  Sparkles, 
  Users, 
  ArrowRight,
  CheckCircle,
  Play,
  Calendar,
  Eye,
  Video
} from "lucide-react"
import { useAuth } from "@/contexts/AuthContext"

interface RecentStory {
  id: number
  title: string
  story: string
  analysis: {
    characters: Array<{ name: string }>
    scenes: Array<{ 
      id: number
      title: string
      imageUrl?: string
      videoUrl?: string
    }>
  }
  models: {
    characterModel: string | null
    sceneModel: string | null
    videoModel: string | null
  }
  createdAt: string
}

export default function HomePage() {
  const { isAuthenticated, user } = useAuth()
  const [recentStories, setRecentStories] = useState<RecentStory[]>([])
  const [storiesLoading, setStoriesLoading] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const fetchRecentStories = async () => {
      setStoriesLoading(true)
      try {
        const response = await fetch('/api/stories/recent?limit=3')
        const data = await response.json()
        setRecentStories(data.stories || [])
      } catch (error) {
        console.error('Error fetching recent stories:', error)
      } finally {
        setStoriesLoading(false)
      }
    }

    fetchRecentStories()
  }, [])

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const getFirstMedia = (scenes: RecentStory['analysis']['scenes']) => {
    // First try to find a scene with a video
    const sceneWithVideo = scenes.find(scene => scene.videoUrl)
    if (sceneWithVideo) {
      return { type: 'video', url: sceneWithVideo.videoUrl }
    }
    
    // Otherwise, find the first scene with an image
    const sceneWithImage = scenes.find(scene => scene.imageUrl)
    if (sceneWithImage) {
      return { type: 'image', url: sceneWithImage.imageUrl }
    }
    
    return null
  }

  return (
    <div className="min-h-screen bg-background pt-16">{/* Add padding-top to account for fixed navigation */}

      {/* Hero Section */}
      <section className="py-20 px-4">
        <div className="container max-w-4xl mx-auto text-center">
          <div className="mb-8">
            <h1 className="text-4xl md:text-6xl font-bold mb-6 gradient-text">
              Transform Your Stories Into Visual Masterpieces
            </h1>
            <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              Bring your narratives to life with AI-powered character and scene generation. 
              Create stunning visual stories that captivate your audience.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href={isAuthenticated ? "/story" : "/login"}>
                <Button size="lg" className="text-lg px-8">
                  {isAuthenticated ? "Continue Creating" : "Start Creating"} <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
              </Link>
              {!isAuthenticated && (
                <Link href="/login">
                  <Button variant="outline" size="lg" className="text-lg px-8">
                    Sign In
                  </Button>
                </Link>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 px-4 bg-muted/30">
        <div className="container max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">
            Everything You Need to Visualize Stories
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            <Card>
              <CardHeader>
                <BookOpen className="w-12 h-12 text-primary mb-4" />
                <CardTitle>Story Analysis</CardTitle>
                <CardDescription>
                  Advanced AI analyzes your stories to extract characters, scenes, and key elements automatically.
                </CardDescription>
              </CardHeader>
            </Card>
            
            <Card>
              <CardHeader>
                <Users className="w-12 h-12 text-primary mb-4" />
                <CardTitle>Character Generation</CardTitle>
                <CardDescription>
                  Create stunning character images that match your story descriptions with state-of-the-art AI models.
                </CardDescription>
              </CardHeader>
            </Card>
            
            <Card>
              <CardHeader>
                <Sparkles className="w-12 h-12 text-primary mb-4" />
                <CardTitle>Scene Visualization</CardTitle>
                <CardDescription>
                  Transform scene descriptions into beautiful, atmospheric images that bring your world to life.
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </section>

      {/* Recent Stories Section */}
      {recentStories.length > 0 && (
        <section className="py-16 px-4">
          <div className="container max-w-6xl mx-auto">
            <div className="flex items-center justify-between mb-12">
              <h2 className="text-3xl font-bold">
                Recent Stories
              </h2>
              {isAuthenticated && (
                <Button variant="outline" onClick={() => router.push('/gallery')}>
                  View All Stories
                  <ArrowRight className="ml-2 w-4 h-4" />
                </Button>
              )}
            </div>
            
            {storiesLoading ? (
              <div className="flex items-center justify-center h-32">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : (
              <div className="grid md:grid-cols-3 gap-6">
                {recentStories.map((story) => {
                  const media = getFirstMedia(story.analysis.scenes)
                  const hasVideo = story.analysis.scenes.some(scene => scene.videoUrl)
                  
                  return (
                    <Card 
                      key={story.id} 
                      className="border-border/50 bg-card/50 backdrop-blur-sm hover:bg-card/70 transition-all duration-300 cursor-pointer group"
                      onClick={() => isAuthenticated ? router.push(`/story/${story.id}`) : router.push('/login')}
                    >
                      <div className="relative aspect-video bg-muted/20 rounded-t-lg overflow-hidden">
                        {media ? (
                          <>
                            {media.type === 'video' ? (
                              <div className="relative w-full h-full">
                                <video
                                  src={media.url}
                                  className="w-full h-full object-cover"
                                  autoPlay
                                  muted
                                  loop
                                  playsInline
                                />
                                <div className="absolute top-2 right-2">
                                  <Badge variant="secondary" className="bg-black/50 text-white">
                                    <Video className="w-3 h-3 mr-1" />
                                    Video
                                  </Badge>
                                </div>
                                <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-colors flex items-center justify-center">
                                  <Play className="w-12 h-12 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                                </div>
                              </div>
                            ) : (
                              <div className="relative w-full h-full">
                                <img
                                  src={media.url}
                                  alt={story.title}
                                  className="w-full h-full object-cover"
                                />
                                <div className="absolute top-2 right-2">
                                  <Badge variant="secondary" className="bg-black/50 text-white">
                                    <ImageIcon className="w-3 h-3 mr-1" />
                                    Image
                                  </Badge>
                                </div>
                              </div>
                            )}
                          </>
                        ) : (
                          <div className="w-full h-full bg-gradient-to-br from-primary/10 to-accent/10 flex items-center justify-center">
                            <BookOpen className="w-12 h-12 text-muted-foreground" />
                          </div>
                        )}
                        
                        {/* Video count badge */}
                        {hasVideo && (
                          <div className="absolute bottom-2 left-2">
                            <Badge className="bg-accent text-accent-foreground">
                              <Video className="w-3 h-3 mr-1" />
                              {story.analysis.scenes.filter(s => s.videoUrl).length} Videos
                            </Badge>
                          </div>
                        )}
                      </div>

                      <CardHeader className="pb-3">
                        <CardTitle className="text-lg line-clamp-1">{story.title}</CardTitle>
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {story.story}
                        </p>
                      </CardHeader>
                      
                      <CardContent className="pt-0">
                        <div className="flex items-center justify-between text-xs text-muted-foreground mb-3">
                          <div className="flex items-center gap-3">
                            <span className="flex items-center gap-1">
                              <Users className="w-3 h-3" />
                              {story.analysis.characters.length}
                            </span>
                            <span className="flex items-center gap-1">
                              <BookOpen className="w-3 h-3" />
                              {story.analysis.scenes.length}
                            </span>
                          </div>
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {formatDate(story.createdAt)}
                          </span>
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <div className="text-xs text-muted-foreground">
                            {story.models.characterModel && (
                              <span>Character: {story.models.characterModel}</span>
                            )}
                          </div>
                          <Button size="sm" variant="ghost" className="text-xs h-auto p-1">
                            <Eye className="w-3 h-3 mr-1" />
                            View
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            )}
          </div>
        </section>
      )}

      {/* Benefits Section */}
      <section className="py-16 px-4">
        <div className="container max-w-4xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold mb-6">
                Why Choose StoryVisualizer?
              </h2>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-6 h-6 text-green-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold">AI-Powered Analysis</h3>
                    <p className="text-muted-foreground">Intelligent story parsing that understands context and relationships</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-6 h-6 text-green-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold">High-Quality Images</h3>
                    <p className="text-muted-foreground">Professional-grade visuals powered by cutting-edge AI models</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-6 h-6 text-green-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold">Easy to Use</h3>
                    <p className="text-muted-foreground">Simple interface that gets you from story to visuals in minutes</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-6 h-6 text-green-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold">Save & Organize</h3>
                    <p className="text-muted-foreground">Keep track of all your visual stories in one place</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="bg-gradient-to-br from-primary/10 to-secondary/10 rounded-lg p-8 text-center">
              <ImageIcon className="w-24 h-24 text-primary mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">Ready to Get Started?</h3>
              <p className="text-muted-foreground mb-6">
                Join thousands of creators who are already visualizing their stories
              </p>
              {!isAuthenticated && (
                <Link href="/login">
                  <Button size="lg">
                    Create Free Account
                  </Button>
                </Link>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/50 py-8 px-4">
        <div className="container max-w-4xl mx-auto text-center text-muted-foreground">
          <p>&copy; 2025 StoryVisualizer. Transform your stories into visual masterpieces.</p>
        </div>
      </footer>
    </div>
  )
}