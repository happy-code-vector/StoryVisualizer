"use client"

import { useState } from "react"
import { Card, CardContent } from "./ui/card"
import { Badge } from "./ui/badge"
import { Button } from "./ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "./ui/dialog"
import { Separator } from "./ui/separator"
import { Eye, MapPin, Clock, Users, Volume2, Play } from "lucide-react"

interface Scene {
  id: number
  title: string
  description: string
  characters: string[]
  duration: number
  audioElements: string[]
  imageUrl?: string
  beatType?: string
  tensionLevel?: number
  suggestedDuration?: number
}

interface SceneCardProps {
  scene: Scene
  index: number
  isLast: boolean
}

export default function SceneCard({ scene, index, isLast }: SceneCardProps) {
  const [imageLoaded, setImageLoaded] = useState(false)

  return (
    <div>
      <Card className="group hover:shadow-lg transition-all duration-300 border-border/50 bg-card/80 backdrop-blur-sm">
        <CardContent className="p-0">
          <div className="grid lg:grid-cols-2 gap-0">
            {/* Image Section */}
            <div className="relative aspect-video bg-gradient-to-br from-primary/10 to-accent/10">
              <img
                src={scene.imageUrl || "/placeholder.svg"}
                alt={scene.title}
                className={`w-full h-full object-cover transition-opacity duration-300 ${imageLoaded ? "opacity-100" : "opacity-0"
                  }`}
                onLoad={() => setImageLoaded(true)}
              />
              {!imageLoaded && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <MapPin className="w-8 h-8 text-muted-foreground animate-pulse" />
                </div>
              )}

              {/* Scene number overlay */}
              <div className="absolute top-4 left-4 flex gap-2">
                <Badge className="bg-black/80 text-white border-0 text-sm">
                  Scene {scene.id}
                </Badge>
                {scene.beatType && scene.beatType !== 'scene' && (
                  <Badge className="bg-accent/90 text-accent-foreground border-0 text-sm capitalize">
                    {scene.beatType.replace('_', ' ')}
                  </Badge>
                )}
              </div>

              {/* Tension level indicator */}
              {scene.tensionLevel !== undefined && (
                <div className="absolute top-4 right-4">
                  <Badge className="bg-black/80 text-white border-0 text-sm">
                    Tension: {scene.tensionLevel}/10
                  </Badge>
                </div>
              )}

              {/* View details overlay */}
              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                <Dialog>
                  <DialogTrigger asChild>
                    <Button variant="secondary" size="sm" className="bg-white/90 text-black hover:bg-white">
                      <Eye className="w-4 h-4 mr-2" />
                      View Full Scene
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle className="flex items-center gap-2 text-2xl">
                        <MapPin className="w-6 h-6" />
                        {scene.title}
                      </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-6">
                      <div className="aspect-video rounded-xl overflow-hidden bg-muted">
                        <img
                          src={scene.imageUrl || "/placeholder.svg"}
                          alt={scene.title}
                          className="w-full h-full object-cover"
                        />
                      </div>

                      <div className="grid md:grid-cols-2 gap-6">
                        <div className="space-y-4">
                          <div>
                            <h4 className="font-semibold mb-2 flex items-center gap-2 text-lg">
                              <MapPin className="w-5 h-5" />
                              Scene Description
                            </h4>
                            <p className="text-muted-foreground leading-relaxed text-base">
                              {scene.description}
                            </p>
                          </div>
                        </div>

                        <div className="space-y-4">
                          <div>
                            <h4 className="font-semibold mb-2 flex items-center gap-2 text-lg">
                              <Play className="w-5 h-5" />
                              Scene Details
                            </h4>
                            <div className="space-y-2">
                              <div className="flex items-center gap-2">
                                <Clock className="w-4 h-4 text-muted-foreground" />
                                <span className="text-base">Duration: {scene.duration}s</span>
                              </div>
                            </div>
                          </div>

                          {scene.characters.length > 0 && (
                            <div>
                              <h4 className="font-semibold mb-2 flex items-center gap-2 text-lg">
                                <Users className="w-5 h-5" />
                                Characters Present
                              </h4>
                              <div className="flex flex-wrap gap-2">
                                {scene.characters.map((char, i) => (
                                  <Badge key={i} variant="secondary" className="text-base px-2 py-1">
                                    {char}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          )}

                          {scene.audioElements && scene.audioElements.length > 0 && (
                            <div>
                              <h4 className="font-semibold mb-2 flex items-center gap-2 text-lg">
                                <Volume2 className="w-5 h-5" />
                                Audio Elements
                              </h4>
                              <div className="flex flex-wrap gap-2">
                                {scene.audioElements.map((audio: string, i: number) => (
                                  <Badge key={i} variant="outline" className="text-base px-2 py-1">
                                    {audio}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </div>

            {/* Content Section */}
            <div className="p-4 space-y-3">
              <div>
                <h3 className="text-base font-semibold mb-1 truncate">
                  {scene.title}
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed line-clamp-2">
                  {scene.description}
                </p>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge variant="secondary" className="flex items-center gap-1 text-xs px-2 py-0.5">
                    <Clock className="w-2.5 h-2.5" />
                    {scene.duration}s
                  </Badge>
                  {scene.audioElements && scene.audioElements.length > 0 && (
                    <Badge variant="outline" className="flex items-center gap-1 text-xs px-2 py-0.5">
                      <Volume2 className="w-2.5 h-2.5" />
                      {scene.audioElements.length} audio
                    </Badge>
                  )}
                </div>

                {scene.characters.length > 0 && (
                  <div>
                    <span className="text-xs font-medium flex items-center gap-1 mb-1">
                      <Users className="w-2.5 h-2.5" />
                      Characters:
                    </span>
                    <span className="text-xs text-muted-foreground">{scene.characters.join(", ")}</span>
                  </div>
                )}

                {scene.audioElements && scene.audioElements.length > 0 && (
                  <div>
                    <span className="text-xs font-medium flex items-center gap-1 mb-1">
                      <Volume2 className="w-2.5 h-2.5" />
                      Audio Elements:
                    </span>
                    <div className="flex flex-wrap gap-1">
                      {scene.audioElements.slice(0, 3).map((audio: string, i: number) => (
                        <Badge key={i} variant="outline" className="text-xs px-1.5 py-0.5">
                          {audio}
                        </Badge>
                      ))}
                      {scene.audioElements.length > 3 && (
                        <Badge variant="outline" className="text-xs px-1.5 py-0.5">
                          +{scene.audioElements.length - 3}
                        </Badge>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      {!isLast && <Separator className="my-8" />}
    </div>
  )
}