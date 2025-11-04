import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

interface StoryArc {
  acts: {
    act1: { scenes: number[]; description: string }
    act2: { scenes: number[]; description: string }
    act3: { scenes: number[]; description: string }
  }
  beats: {
    hook?: number
    incitingIncident?: number
    risingAction: number[]
    midpoint?: number
    crisis?: number
    climax?: number
    resolution?: number
  }
  pacing: {
    totalDuration: number
    sceneDistribution: Array<{ sceneId: number; suggestedDuration: number; beatType: string }>
  }
}

interface TensionCurve {
  sceneId: number
  tensionLevel: number
  emotionalPeak: boolean
}

interface Props {
  storyArc: StoryArc
  tensionCurve: TensionCurve[]
  totalScenes: number
}

export function StoryArcVisualization({ storyArc, tensionCurve, totalScenes }: Props) {
  const maxTension = 10

  return (
    <div className="space-y-6">
      {/* 3-Act Structure */}
      <Card>
        <CardHeader>
          <CardTitle>Story Structure</CardTitle>
          <CardDescription>Your story follows a classic 3-act structure</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Act 1: Setup</span>
                <Badge variant="outline">{storyArc.acts.act1.scenes.length} scenes</Badge>
              </div>
              <div className="h-2 bg-primary/20 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-primary rounded-full" 
                  style={{ width: `${(storyArc.acts.act1.scenes.length / totalScenes) * 100}%` }}
                />
              </div>
              <p className="text-xs text-muted-foreground">{storyArc.acts.act1.description}</p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Act 2: Confrontation</span>
                <Badge variant="outline">{storyArc.acts.act2.scenes.length} scenes</Badge>
              </div>
              <div className="h-2 bg-accent/20 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-accent rounded-full" 
                  style={{ width: `${(storyArc.acts.act2.scenes.length / totalScenes) * 100}%` }}
                />
              </div>
              <p className="text-xs text-muted-foreground">{storyArc.acts.act2.description}</p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Act 3: Resolution</span>
                <Badge variant="outline">{storyArc.acts.act3.scenes.length} scenes</Badge>
              </div>
              <div className="h-2 bg-primary/20 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-primary rounded-full" 
                  style={{ width: `${(storyArc.acts.act3.scenes.length / totalScenes) * 100}%` }}
                />
              </div>
              <p className="text-xs text-muted-foreground">{storyArc.acts.act3.description}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tension Curve */}
      <Card>
        <CardHeader>
          <CardTitle>Tension Curve</CardTitle>
          <CardDescription>Emotional intensity throughout your story</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {tensionCurve.map((point, index) => (
              <div key={point.sceneId} className="flex items-center gap-3">
                <span className="text-xs text-muted-foreground w-16">Scene {index + 1}</span>
                <div className="flex-1 h-6 bg-muted rounded-full overflow-hidden relative">
                  <div 
                    className={`h-full rounded-full transition-all ${
                      point.emotionalPeak ? 'bg-gradient-to-r from-orange-500 to-red-500' : 'bg-primary'
                    }`}
                    style={{ width: `${(point.tensionLevel / maxTension) * 100}%` }}
                  />
                  {point.emotionalPeak && (
                    <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs font-bold text-white">
                      🔥 PEAK
                    </span>
                  )}
                </div>
                <span className="text-xs font-medium w-8 text-right">{point.tensionLevel}/10</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Key Beats */}
      <Card>
        <CardHeader>
          <CardTitle>Narrative Beats</CardTitle>
          <CardDescription>Key moments in your story</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {storyArc.beats.hook && (
              <div className="p-3 border rounded-lg">
                <div className="text-xs text-muted-foreground">Hook</div>
                <div className="text-sm font-medium">Scene {tensionCurve.findIndex(t => t.sceneId === storyArc.beats.hook) + 1}</div>
              </div>
            )}
            {storyArc.beats.incitingIncident && (
              <div className="p-3 border rounded-lg">
                <div className="text-xs text-muted-foreground">Inciting Incident</div>
                <div className="text-sm font-medium">Scene {tensionCurve.findIndex(t => t.sceneId === storyArc.beats.incitingIncident) + 1}</div>
              </div>
            )}
            {storyArc.beats.midpoint && (
              <div className="p-3 border rounded-lg">
                <div className="text-xs text-muted-foreground">Midpoint</div>
                <div className="text-sm font-medium">Scene {tensionCurve.findIndex(t => t.sceneId === storyArc.beats.midpoint) + 1}</div>
              </div>
            )}
            {storyArc.beats.climax && (
              <div className="p-3 border rounded-lg">
                <div className="text-xs text-muted-foreground">Climax</div>
                <div className="text-sm font-medium">Scene {tensionCurve.findIndex(t => t.sceneId === storyArc.beats.climax) + 1}</div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Pacing Info */}
      <Card>
        <CardHeader>
          <CardTitle>Pacing</CardTitle>
          <CardDescription>Recommended scene durations</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <div className="text-2xl font-bold">{storyArc.pacing.totalDuration}s</div>
              <div className="text-sm text-muted-foreground">Total Duration</div>
            </div>
            <div>
              <div className="text-2xl font-bold">{Math.round(storyArc.pacing.totalDuration / totalScenes)}s</div>
              <div className="text-sm text-muted-foreground">Avg per Scene</div>
            </div>
            <div>
              <div className="text-2xl font-bold">{totalScenes}</div>
              <div className="text-sm text-muted-foreground">Total Scenes</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
