"use client"

import { useState } from "react"
import { Card, CardContent } from "./ui/card"
import { Badge } from "./ui/badge"
import { Button } from "./ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "./ui/dialog"
import { Separator } from "./ui/separator"
import { Eye, MapPin, Clock, Palette, Users, Zap } from "lucide-react"

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
            <div className="relative aspect-video lg:aspect-square bg-gradient-to-br from-primary/10 to-accent/10">
              <img
                src={scene.imageUrl || "/placeholder.svg"}
                alt={scene.title}
                className={`w-full h-full object-cover transition-opacity duration-300 ${
                  imageLoaded ? "opacity-100" : "opacity-0"
                }`}
                onLoad={() => setImageLoaded(true)}
              />
              {!imageLoaded && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <MapPin className="w-8 h-8 text-muted-foreground animate-pulse" />
                </div>
              )}

              {/* Scene number overlay */}
              <div className="absolute top-4 left-4">
                <Badge className="bg-black/80 text-white border-0">Scene {scene.id}</Badge>
              </div>

              {/* View details overlay */}
              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                <Dialog>
                  <DialogTrigger asChild>
                    <Button variant="secondary" size="sm" className="bg-white/90 text-black hover:bg-white">
                      <Eye className="w-4 h-4 mr-2" />
                      View Full Scene
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle className="flex items-center gap-2">
                        <MapPin className="w-5 h-5" />
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
                            <h4 className="font-semibold mb-2 flex items-center gap-2">
                              <MapPin className="w-4 h-4" />
                              Setting & Atmosphere
                            </h4>
                            <p className="text-muted-foreground leading-relaxed">{scene.description}</p>
                          </div>

                          {scene.analysis?.atmosphere && (
                            <div>
                              <h4 className="font-semibold mb-2">Full Description</h4>
                              <p className="text-sm text-muted-foreground leading-relaxed">
                                {scene.analysis.atmosphere}
                              </p>
                            </div>
                          )}
                        </div>

                        <div className="space-y-4">
                          <div>
                            <h4 className="font-semibold mb-2 flex items-center gap-2">
                              <Palette className="w-4 h-4" />
                              Scene Details
                            </h4>
                            <div className="space-y-2">
                              <div className="flex items-center gap-2">
                                <MapPin className="w-3 h-3 text-muted-foreground" />
                                <span className="text-sm">{scene.setting}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <Palette className="w-3 h-3 text-muted-foreground" />
                                <span className="text-sm">{scene.mood}</span>
                              </div>
                              {scene.analysis?.timeOfDay && scene.analysis.timeOfDay !== "unspecified time" && (
                                <div className="flex items-center gap-2">
                                  <Clock className="w-3 h-3 text-muted-foreground" />
                                  <span className="text-sm">{scene.analysis.timeOfDay}</span>
                                </div>
                              )}
                            </div>
                          </div>

                          {scene.characters.length > 0 && (
                            <div>
                              <h4 className="font-semibold mb-2 flex items-center gap-2">
                                <Users className="w-4 h-4" />
                                Characters Present
                              </h4>
                              <div className="flex flex-wrap gap-2">
                                {scene.characters.map((char, i) => (
                                  <Badge key={i} variant="secondary">
                                    {char}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          )}

                          {scene.analysis?.keyActions && scene.analysis.keyActions.length > 0 && (
                            <div>
                              <h4 className="font-semibold mb-2 flex items-center gap-2">
                                <Zap className="w-4 h-4" />
                                Key Actions
                              </h4>
                              <div className="flex flex-wrap gap-2">
                                {scene.analysis.keyActions.map((action: string, i: number) => (
                                  <Badge key={i} variant="outline" className="text-xs">
                                    {action}
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
            <div className="p-6 space-y-4">
              <div>
                <h3 className="text-xl font-semibold mb-2">{scene.title}</h3>
                <p className="text-muted-foreground leading-relaxed line-clamp-3">{scene.description}</p>
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge variant="secondary" className="flex items-center gap-1">
                    <MapPin className="w-3 h-3" />
                    {scene.setting}
                  </Badge>
                  <Badge variant="outline" className="flex items-center gap-1">
                    <Palette className="w-3 h-3" />
                    {scene.mood}
                  </Badge>
                  {scene.analysis?.timeOfDay && scene.analysis.timeOfDay !== "unspecified time" && (
                    <Badge variant="outline" className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {scene.analysis.timeOfDay}
                    </Badge>
                  )}
                </div>

                {scene.characters.length > 0 && (
                  <div>
                    <span className="text-sm font-medium flex items-center gap-1 mb-1">
                      <Users className="w-3 h-3" />
                      Characters:
                    </span>
                    <span className="text-sm text-muted-foreground">{scene.characters.join(", ")}</span>
                  </div>
                )}

                {scene.analysis?.keyActions && scene.analysis.keyActions.length > 0 && (
                  <div>
                    <span className="text-sm font-medium flex items-center gap-1 mb-1">
                      <Zap className="w-3 h-3" />
                      Key Actions:
                    </span>
                    <div className="flex flex-wrap gap-1">
                      {scene.analysis.keyActions.slice(0, 3).map((action: string, i: number) => (
                        <Badge key={i} variant="outline" className="text-xs">
                          {action}
                        </Badge>
                      ))}
                      {scene.analysis.keyActions.length > 3 && (
                        <Badge variant="outline" className="text-xs">
                          +{scene.analysis.keyActions.length - 3}
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