"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Sparkles, TrendingUp, AlertCircle } from 'lucide-react'
import { NarrativeCoach } from '@/components/NarrativeCoach'

interface Props {
  context: any
  scenes: any[]
}

export function AuroraInsights({ context, scenes }: Props) {
  if (!context?.storyArc) return null

  const { storyArc, narrativeSuggestions } = context

  return (
    <div className="space-y-4">
      {/* Story Structure */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Sparkles className="w-4 h-4" />
            Story Structure
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-3">
            <div className="text-center p-3 bg-blue-500/10 rounded-lg">
              <div className="text-2xl font-bold text-blue-500">
                {storyArc.acts?.act1?.scenes?.length || 0}
              </div>
              <div className="text-xs text-muted-foreground">Act 1: Setup</div>
            </div>
            <div className="text-center p-3 bg-orange-500/10 rounded-lg">
              <div className="text-2xl font-bold text-orange-500">
                {storyArc.acts?.act2?.scenes?.length || 0}
              </div>
              <div className="text-xs text-muted-foreground">Act 2: Conflict</div>
            </div>
            <div className="text-center p-3 bg-green-500/10 rounded-lg">
              <div className="text-2xl font-bold text-green-500">
                {storyArc.acts?.act3?.scenes?.length || 0}
              </div>
              <div className="text-xs text-muted-foreground">Act 3: Resolution</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tension Curve */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <TrendingUp className="w-4 h-4" />
            Tension Curve
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-1">
            {scenes.map((scene, i) => (
              <div key={i} className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground w-16">Scene {i + 1}</span>
                <div className="flex-1 h-4 bg-muted rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-blue-500 to-red-500"
                    style={{ width: `${(scene.tensionLevel || 5) * 10}%` }}
                  />
                </div>
                <span className="text-xs font-medium w-8">{scene.tensionLevel || 5}/10</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Narrative Suggestions */}
      {narrativeSuggestions && narrativeSuggestions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <AlertCircle className="w-4 h-4" />
              Narrative Coach
            </CardTitle>
            <CardDescription className="text-xs">
              AI-powered suggestions to improve your story
            </CardDescription>
          </CardHeader>
          <CardContent>
            <NarrativeCoach suggestions={narrativeSuggestions} />
          </CardContent>
        </Card>
      )}

      {/* Beat Types */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Scene Beats</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {scenes.map((scene, i) => (
              scene.beatType && scene.beatType !== 'scene' && (
                <Badge key={i} variant="outline" className="text-xs">
                  Scene {i + 1}: {scene.beatType.replace('_', ' ')}
                </Badge>
              )
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
