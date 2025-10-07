"use client"

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Users, Image as ImageIcon, Play, Video, ArrowLeft } from "lucide-react"
import { useRouter } from 'next/navigation'
import FullscreenViewer, { ViewerItem } from './FullscreenViewer'

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
  imageUrl?: string
  videoUrl?: string
}

interface StoryboardProps {
  title: string
  characters: Character[]
  scenes: Scene[]
}

export default function Storyboard({ title, characters, scenes }: StoryboardProps) {
  const [viewerOpen, setViewerOpen] = useState(false)
  const [viewerItems, setViewerItems] = useState<ViewerItem[]>([])
  const [initialIndex, setInitialIndex] = useState(0)
  const router = useRouter()

  const openFullscreenViewer = (type: 'character' | 'scene' | 'video', items: any[], clickedIndex: number) => {
    let viewerData: ViewerItem[] = []

    if (type === 'character') {
      viewerData = items.map((character, index) => ({
        id: `character-${index}`,
        type: 'character' as const,
        title: character.name,
        imageUrl: character.imageUrl,
        description: character.description,
        metadata: character
      }))
    } else if (type === 'scene') {
      viewerData = items.map((scene, index) => ({
        id: `scene-${scene.id}`,
        type: 'scene' as const,
        title: scene.title,
        imageUrl: scene.imageUrl,
        description: scene.description,
        metadata: scene
      }))
    } else if (type === 'video') {
      viewerData = items.map((scene, index) => ({
        id: `video-${scene.id}`,
        type: 'video' as const,
        title: scene.title,
        videoUrl: scene.videoUrl,
        imageUrl: scene.imageUrl, // fallback
        description: scene.description,
        metadata: scene
      }))
    }

    setViewerItems(viewerData)
    setInitialIndex(clickedIndex)
    setViewerOpen(true)
  }

  const scenesWithVideos = scenes.filter(scene => scene.videoUrl)

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border/50 bg-background/95 backdrop-blur sticky top-16 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => router.back()}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            <h1 className="text-2xl md:text-3xl font-bold gradient-text">{title}</h1>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Characters Section */}
        {characters.length > 0 && (
          <section className="mb-12">
            <div className="flex items-center gap-2 mb-6">
              <Users className="w-6 h-6 text-primary" />
              <h2 className="text-2xl font-bold">Characters</h2>
              <Badge variant="secondary">{characters.length}</Badge>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {characters.map((character, index) => (
                <Card 
                  key={character.name}
                  className="cursor-pointer hover:shadow-lg transition-all duration-300 border-border/50 bg-card/50 backdrop-blur-sm hover:bg-card/70"
                  onClick={() => openFullscreenViewer('character', characters, index)}
                >
                  <div className="aspect-square relative bg-muted/20 overflow-hidden rounded-t-lg">
                    {character.imageUrl ? (
                      <img
                        src={character.imageUrl}
                        alt={character.name}
                        className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-primary/10 to-accent/10 flex items-center justify-center">
                        <Users className="w-12 h-12 text-muted-foreground" />
                      </div>
                    )}
                  </div>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg text-center line-clamp-1">{character.name}</CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <p className="text-sm text-muted-foreground text-center line-clamp-2">
                      {character.description}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>
        )}

        {/* Scenes Section */}
        {scenes.length > 0 && (
          <section className="mb-12">
            <div className="flex items-center gap-2 mb-6">
              <ImageIcon className="w-6 h-6 text-primary" />
              <h2 className="text-2xl font-bold">Scenes</h2>
              <Badge variant="secondary">{scenes.length}</Badge>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {scenes.map((scene, index) => (
                <Card 
                  key={scene.id}
                  className="cursor-pointer hover:shadow-lg transition-all duration-300 border-border/50 bg-card/50 backdrop-blur-sm hover:bg-card/70"
                  onClick={() => openFullscreenViewer('scene', scenes, index)}
                >
                  <div className="aspect-video relative bg-muted/20 overflow-hidden rounded-t-lg">
                    {scene.imageUrl ? (
                      <img
                        src={scene.imageUrl}
                        alt={scene.title}
                        className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-primary/10 to-accent/10 flex items-center justify-center">
                        <ImageIcon className="w-12 h-12 text-muted-foreground" />
                      </div>
                    )}
                    
                    {scene.videoUrl && (
                      <div className="absolute top-2 right-2">
                        <Badge className="bg-accent text-accent-foreground">
                          <Video className="w-3 h-3 mr-1" />
                          Video
                        </Badge>
                      </div>
                    )}
                  </div>
                  
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg line-clamp-1">{scene.title}</CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <p className="text-sm text-muted-foreground line-clamp-3">
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
          </section>
        )}

        {/* Videos Section */}
        {scenesWithVideos.length > 0 && (
          <section className="mb-12">
            <div className="flex items-center gap-2 mb-6">
              <Play className="w-6 h-6 text-accent" />
              <h2 className="text-2xl font-bold">Video Clips</h2>
              <Badge variant="secondary">{scenesWithVideos.length}</Badge>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {scenesWithVideos.map((scene, index) => (
                <Card 
                  key={`video-${scene.id}`}
                  className="cursor-pointer hover:shadow-lg transition-all duration-300 border-border/50 bg-card/50 backdrop-blur-sm hover:bg-card/70"
                  onClick={() => openFullscreenViewer('video', scenesWithVideos, index)}
                >
                  <div className="aspect-video relative bg-black overflow-hidden rounded-t-lg group">
                    <video
                      src={scene.videoUrl}
                      className="w-full h-full object-cover"
                      muted
                      loop
                      playsInline
                      onMouseEnter={(e) => e.currentTarget.play()}
                      onMouseLeave={(e) => e.currentTarget.pause()}
                    />
                    <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-colors flex items-center justify-center">
                      <Play className="w-12 h-12 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
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
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>
        )}

        {/* Empty State */}
        {characters.length === 0 && scenes.length === 0 && (
          <div className="text-center py-12">
            <ImageIcon className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">No Visual Content</h3>
            <p className="text-muted-foreground">
              This story doesn't have any generated characters or scenes yet.
            </p>
          </div>
        )}
      </div>

      {/* Fullscreen Viewer */}
      <FullscreenViewer
        isOpen={viewerOpen}
        onClose={() => setViewerOpen(false)}
        items={viewerItems}
        initialIndex={initialIndex}
      />
    </div>
  )
}