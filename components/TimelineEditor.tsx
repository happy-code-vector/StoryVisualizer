"use client"

import { useState } from 'react'
import { DragDropContext, Droppable, Draggable, DropResult } from 'react-beautiful-dnd'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Slider } from '@/components/ui/slider'
import { GripVertical, Play, RotateCcw, Clock, Image as ImageIcon } from 'lucide-react'

interface Scene {
  id: number
  title: string
  description: string
  characters: string[]
  duration?: number
  suggestedDuration?: number
  beatType?: string
  tensionLevel?: number
  imageUrl?: string
  voiceUrl?: string
}

interface Props {
  scenes: Scene[]
  onReorder: (newScenes: Scene[]) => void
  onUpdateDuration: (sceneId: number, duration: number) => void
  onRegenerateScene: (sceneId: number) => void
}

export function TimelineEditor({ scenes, onReorder, onUpdateDuration, onRegenerateScene }: Props) {
  const [localScenes, setLocalScenes] = useState(scenes)
  const [selectedScene, setSelectedScene] = useState<number | null>(null)

  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return

    const items = Array.from(localScenes)
    const [reorderedItem] = items.splice(result.source.index, 1)
    items.splice(result.destination.index, 0, reorderedItem)

    setLocalScenes(items)
    onReorder(items)
  }

  const handleDurationChange = (sceneId: number, value: number[]) => {
    const newScenes = localScenes.map(scene =>
      scene.id === sceneId ? { ...scene, duration: value[0] } : scene
    )
    setLocalScenes(newScenes)
    onUpdateDuration(sceneId, value[0])
  }

  const totalDuration = localScenes.reduce((sum, scene) => sum + (scene.duration || scene.suggestedDuration || 5), 0)

  const getBeatColor = (beatType?: string) => {
    switch (beatType) {
      case 'hook': return 'bg-blue-500'
      case 'inciting_incident': return 'bg-purple-500'
      case 'rising_action': return 'bg-yellow-500'
      case 'midpoint': return 'bg-orange-500'
      case 'crisis': return 'bg-red-500'
      case 'climax': return 'bg-pink-500'
      case 'resolution': return 'bg-green-500'
      default: return 'bg-gray-500'
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Play className="w-5 h-5" />
            Timeline Editor
          </CardTitle>
          <div className="flex items-center gap-4">
            <Badge variant="outline" className="text-sm">
              <Clock className="w-3 h-3 mr-1" />
              {totalDuration}s total
            </Badge>
            <Badge variant="outline" className="text-sm">
              {localScenes.length} scenes
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <DragDropContext onDragEnd={handleDragEnd}>
          <Droppable droppableId="timeline">
            {(provided) => (
              <div
                {...provided.droppableProps}
                ref={provided.innerRef}
                className="space-y-3"
              >
                {localScenes.map((scene, index) => (
                  <Draggable key={scene.id} draggableId={scene.id.toString()} index={index}>
                    {(provided, snapshot) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        className={`border rounded-lg transition-all ${
                          snapshot.isDragging ? 'shadow-lg border-primary' : 'border-border'
                        } ${selectedScene === scene.id ? 'border-primary bg-primary/5' : ''}`}
                      >
                        <div className="p-4">
                          <div className="flex items-start gap-4">
                            {/* Drag Handle */}
                            <div
                              {...provided.dragHandleProps}
                              className="mt-1 cursor-grab active:cursor-grabbing"
                            >
                              <GripVertical className="w-5 h-5 text-muted-foreground" />
                            </div>

                            {/* Scene Preview */}
                            <div className="w-24 h-16 rounded overflow-hidden bg-muted flex-shrink-0">
                              {scene.imageUrl ? (
                                <img src={scene.imageUrl} alt={scene.title} className="w-full h-full object-cover" />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center">
                                  <ImageIcon className="w-6 h-6 text-muted-foreground" />
                                </div>
                              )}
                            </div>

                            {/* Scene Info */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-2">
                                <Badge variant="outline">Scene {index + 1}</Badge>
                                {scene.beatType && scene.beatType !== 'scene' && (
                                  <Badge className={`${getBeatColor(scene.beatType)} text-white text-xs`}>
                                    {scene.beatType.replace('_', ' ')}
                                  </Badge>
                                )}
                              </div>
                              <h4 className="font-semibold mb-1 truncate">{scene.title}</h4>
                              <p className="text-sm text-muted-foreground line-clamp-1">{scene.description}</p>

                              {/* Duration Slider */}
                              <div className="mt-3 space-y-2">
                                <div className="flex items-center justify-between text-xs">
                                  <span className="text-muted-foreground">Duration</span>
                                  <span className="font-medium">
                                    {scene.duration || scene.suggestedDuration || 5}s
                                  </span>
                                </div>
                                <Slider
                                  value={[scene.duration || scene.suggestedDuration || 5]}
                                  onValueChange={(value) => handleDurationChange(scene.id, value)}
                                  min={1}
                                  max={15}
                                  step={1}
                                  className="w-full"
                                />
                              </div>
                            </div>

                            {/* Actions */}
                            <div className="flex flex-col gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => setSelectedScene(scene.id)}
                              >
                                <Play className="w-3 h-3 mr-1" />
                                Preview
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => onRegenerateScene(scene.id)}
                              >
                                <RotateCcw className="w-3 h-3 mr-1" />
                                Regen
                              </Button>
                            </div>
                          </div>
                        </div>

                        {/* Timeline Bar */}
                        <div className="h-2 bg-muted">
                          <div
                            className={`h-full ${getBeatColor(scene.beatType)} transition-all`}
                            style={{
                              width: `${((scene.duration || scene.suggestedDuration || 5) / totalDuration) * 100}%`
                            }}
                          />
                        </div>
                      </div>
                    )}
                  </Draggable>
                ))}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        </DragDropContext>

        {/* Timeline Visualization */}
        <div className="mt-6 p-4 bg-muted/50 rounded-lg">
          <div className="text-sm font-medium mb-2">Timeline Overview</div>
          <div className="flex h-8 rounded overflow-hidden">
            {localScenes.map((scene, index) => (
              <div
                key={scene.id}
                className={`${getBeatColor(scene.beatType)} cursor-pointer hover:opacity-80 transition-opacity flex items-center justify-center text-white text-xs font-medium`}
                style={{
                  width: `${((scene.duration || scene.suggestedDuration || 5) / totalDuration) * 100}%`
                }}
                onClick={() => setSelectedScene(scene.id)}
                title={`${scene.title} (${scene.duration || scene.suggestedDuration || 5}s)`}
              >
                {index + 1}
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
