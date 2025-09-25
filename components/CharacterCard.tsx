"use client"

import { useState } from "react"
import { Card, CardContent } from "./ui/card"
import { Badge } from "./ui/badge"
import { Button } from "./ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "./ui/dialog"
import { Eye, User } from "lucide-react"

interface Character {
  name: string
  description: string
  imageUrl?: string
  mentions: number
  attributes: string[]
}

interface CharacterCardProps {
  character: Character
  index: number
}

export default function CharacterCard({ character, index }: CharacterCardProps) {
  const [imageLoaded, setImageLoaded] = useState(false)

  return (
    <Card className="group hover:shadow-lg transition-all duration-300 hover:scale-[1.02] border-border/50 bg-card/80 backdrop-blur-sm">
      <CardContent className="p-0">
        <div className="relative aspect-square rounded-t-xl overflow-hidden bg-gradient-to-br from-primary/10 to-accent/10">
          <img
            src={character.imageUrl || "/placeholder.svg"}
            alt={character.name}
            className={`w-full h-full object-cover transition-opacity duration-300 ${
              imageLoaded ? "opacity-100" : "opacity-0"
            }`}
            onLoad={() => setImageLoaded(true)}
          />
          {!imageLoaded && (
            <div className="absolute inset-0 flex items-center justify-center">
              <User className="w-12 h-12 text-muted-foreground animate-pulse" />
            </div>
          )}

          {/* Overlay with view button */}
          <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="secondary" size="sm" className="bg-white/90 text-black hover:bg-white">
                  <Eye className="w-4 h-4 mr-2" />
                  View Details
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <User className="w-5 h-5" />
                    {character.name}
                  </DialogTitle>
                </DialogHeader>
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="aspect-square rounded-xl overflow-hidden bg-muted">
                    <img
                      src={character.imageUrl || "/placeholder.svg"}
                      alt={character.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-semibold mb-2">Description</h4>
                      <p className="text-muted-foreground leading-relaxed">{character.description}</p>
                    </div>
                    <div>
                      <h4 className="font-semibold mb-2">Story Presence</h4>
                      <Badge variant="secondary">{character.mentions} mentions throughout the story</Badge>
                    </div>
                    {character.attributes.length > 0 && (
                      <div>
                        <h4 className="font-semibold mb-2">Attributes</h4>
                        <div className="flex flex-wrap gap-2">
                          {character.attributes.map((attr, i) => (
                            <Badge key={i} variant="outline">
                              {attr}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        <div className="p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-lg">{character.name}</h3>
            <Badge variant="secondary" className="text-xs">
              {character.mentions}x
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground leading-relaxed line-clamp-2">{character.description}</p>
          {character.attributes.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {character.attributes.slice(0, 2).map((attr, i) => (
                <Badge key={i} variant="outline" className="text-xs">
                  {attr}
                </Badge>
              ))}
              {character.attributes.length > 2 && (
                <Badge variant="outline" className="text-xs">
                  +{character.attributes.length - 2}
                </Badge>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
