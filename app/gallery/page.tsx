"use client"

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Play, Image, Video, Users, Calendar } from "lucide-react"

interface Story {
  id: number
  title: string
  story: string
  analysis: {
    characters: Array<{ name: string; mentions: number }>
    scenes: Array<{ 
      id: number
      title: string
      imageUrl?: string
      videoUrl?: string
      duration?: number
    }>
  }
  models: {
    characterModel: string | null
    sceneModel: string | null
    videoModel: string | null
  }
  createdAt: string
}

export default function GalleryPage() {
  const [stories, setStories] = useState<Story[]>([])
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    fetchStories()
  }, [])

  const fetchStories = async () => {
    try {
      const response = await fetch('/api/stories')
      const data = await response.json()
      setStories(data)
    } catch (error) {
      console.error('Error fetching stories:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const getStoryPreview = (story: string) => {
    const sentences = story.split('. ').slice(0, 2);
    return sentences.join('. ') + (sentences.length < story.split('. ').length ? '...' : '');
  }

  const getFirstVideoOrImage = (scenes: Story['analysis']['scenes']) => {
    // First try to find a scene with a video
    const sceneWithVideo = scenes.find(scene => scene.videoUrl)
    if (sceneWithVideo) {
      return { type: 'video', url: sceneWithVideo.videoUrl, scene: sceneWithVideo }
    }
    
    // Otherwise, find the first scene with an image
    const sceneWithImage = scenes.find(scene => scene.imageUrl)
    if (sceneWithImage) {
      return { type: 'image', url: sceneWithImage.imageUrl, scene: sceneWithImage }
    }
    
    return null
  }

  const viewStory = (id: number) => {
    router.push(`/story/${id}`)
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

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Animated Background Grid */}
      <div className="absolute inset-0 grid-pattern animate-grid opacity-30" />

      <div className="relative z-10 container mx-auto px-4 py-8">
        <div className="flex items-center gap-4 mb-8">
          <Button variant="outline" onClick={() => router.push('/')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <h1 className="text-4xl font-bold gradient-text flex items-center gap-2">
            <Image className="w-8 h-8 text-primary" />
            Story Gallery
          </h1>
        </div>

        {stories.length === 0 ? (
          <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
            <CardContent className="pt-6 text-center py-12">
              <Image className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">No Stories Yet</h3>
              <p className="text-muted-foreground mb-4">
                You haven't created any visual stories yet. Go create your first one!
              </p>
              <Button onClick={() => router.push('/story')}>
                Create Story
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {stories.map((story) => {
              const media = getFirstVideoOrImage(story.analysis.scenes)
              const hasVideo = story.analysis.scenes.some(scene => scene.videoUrl)
              
              return (
                <Card 
                  key={story.id} 
                  className="border-border/50 bg-card/50 backdrop-blur-sm hover:bg-card/70 transition-all duration-300 cursor-pointer group"
                  onClick={() => viewStory(story.id)}
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
                              alt={media.scene.title}
                              className="w-full h-full object-cover"
                            />
                            <div className="absolute top-2 right-2">
                              <Badge variant="secondary" className="bg-black/50 text-white">
                                <Image className="w-3 h-3 mr-1" />
                                Image
                              </Badge>
                            </div>
                          </div>
                        )}
                      </>
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-primary/10 to-accent/10 flex items-center justify-center">
                        <Image className="w-12 h-12 text-muted-foreground" />
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
                      {getStoryPreview(story.story)}
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
                          <Image className="w-3 h-3" />
                          {story.analysis.scenes.length}
                        </span>
                      </div>
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {formatDate(story.createdAt)}
                      </span>
                    </div>
                    
                    <div className="space-y-2">
                      {story.models.characterModel && (
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-muted-foreground">Character Model:</span>
                          <Badge variant="outline" className="text-xs">
                            {story.models.characterModel}
                          </Badge>
                        </div>
                      )}
                      {story.models.sceneModel && (
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-muted-foreground">Scene Model:</span>
                          <Badge variant="outline" className="text-xs">
                            {story.models.sceneModel}
                          </Badge>
                        </div>
                      )}
                      {story.models.videoModel && (
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-muted-foreground">Video Model:</span>
                          <Badge variant="outline" className="text-xs">
                            {story.models.videoModel}
                          </Badge>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}