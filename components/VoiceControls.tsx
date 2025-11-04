"use client"

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Mic, Play, Download, Loader2 } from 'lucide-react'

interface VoicePreset {
  id: string
  name: string
  description: string
  style: string
  provider: string
}

interface Scene {
  id: number
  title: string
  description: string
  voiceUrl?: string
}

interface Props {
  scenes: Scene[]
  onGenerateVoice: (sceneId: number, presetId: string) => Promise<void>
  onGenerateAllVoices: (presetId: string) => Promise<void>
}

const VOICE_PRESETS: VoicePreset[] = [
  { id: 'cinematic-male', name: 'Cinematic Male', description: 'Deep, dramatic voice', style: 'cinematic', provider: 'azure' },
  { id: 'cinematic-female', name: 'Cinematic Female', description: 'Elegant, powerful voice', style: 'cinematic', provider: 'azure' },
  { id: 'friendly-male', name: 'Friendly Male', description: 'Warm, approachable voice', style: 'friendly', provider: 'azure' },
  { id: 'friendly-female', name: 'Friendly Female', description: 'Cheerful, engaging voice', style: 'friendly', provider: 'azure' },
  { id: 'documentary-male', name: 'Documentary Male', description: 'Authoritative, clear voice', style: 'documentary', provider: 'azure' },
  { id: 'documentary-female', name: 'Documentary Female', description: 'Professional, informative voice', style: 'documentary', provider: 'azure' },
]

export function VoiceControls({ scenes, onGenerateVoice, onGenerateAllVoices }: Props) {
  const [selectedPreset, setSelectedPreset] = useState(VOICE_PRESETS[0].id)
  const [generatingAll, setGeneratingAll] = useState(false)
  const [generatingScene, setGeneratingScene] = useState<number | null>(null)

  const handleGenerateAll = async () => {
    setGeneratingAll(true)
    try {
      await onGenerateAllVoices(selectedPreset)
    } finally {
      setGeneratingAll(false)
    }
  }

  const handleGenerateScene = async (sceneId: number) => {
    setGeneratingScene(sceneId)
    try {
      await onGenerateVoice(sceneId, selectedPreset)
    } finally {
      setGeneratingScene(null)
    }
  }

  const scenesWithVoice = scenes.filter(s => s.voiceUrl).length
  const selectedPresetData = VOICE_PRESETS.find(p => p.id === selectedPreset)

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Mic className="w-5 h-5" />
          Voice Synthesis
        </CardTitle>
        <CardDescription>
          Add AI-generated voice-overs to your scenes
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Voice Preset Selection */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Voice Preset</label>
          <Select value={selectedPreset} onValueChange={setSelectedPreset}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {VOICE_PRESETS.map(preset => (
                <SelectItem key={preset.id} value={preset.id}>
                  <div className="flex items-center gap-2">
                    <span>{preset.name}</span>
                    <Badge variant="outline" className="text-xs">{preset.style}</Badge>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {selectedPresetData && (
            <p className="text-xs text-muted-foreground">{selectedPresetData.description}</p>
          )}
        </div>

        {/* Generate All Button */}
        <Button 
          onClick={handleGenerateAll} 
          disabled={generatingAll}
          className="w-full"
        >
          {generatingAll ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Generating Voice for All Scenes...
            </>
          ) : (
            <>
              <Mic className="w-4 h-4 mr-2" />
              Generate Voice for All Scenes
            </>
          )}
        </Button>

        {/* Progress */}
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Progress</span>
          <Badge variant="secondary">
            {scenesWithVoice} / {scenes.length} scenes
          </Badge>
        </div>

        {/* Scene List */}
        <div className="space-y-2 max-h-[400px] overflow-y-auto">
          {scenes.map((scene, index) => (
            <div key={scene.id} className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <Badge variant="outline" className="text-xs">Scene {index + 1}</Badge>
                  {scene.voiceUrl && (
                    <Badge className="bg-green-500 text-white text-xs">
                      <Mic className="w-3 h-3 mr-1" />
                      Voice Ready
                    </Badge>
                  )}
                </div>
                <p className="text-sm font-medium truncate">{scene.title}</p>
              </div>
              <div className="flex items-center gap-2">
                {scene.voiceUrl ? (
                  <>
                    <Button size="sm" variant="outline">
                      <Play className="w-3 h-3 mr-1" />
                      Play
                    </Button>
                    <Button size="sm" variant="outline">
                      <Download className="w-3 h-3" />
                    </Button>
                  </>
                ) : (
                  <Button 
                    size="sm" 
                    onClick={() => handleGenerateScene(scene.id)}
                    disabled={generatingScene === scene.id}
                  >
                    {generatingScene === scene.id ? (
                      <Loader2 className="w-3 h-3 animate-spin" />
                    ) : (
                      <>
                        <Mic className="w-3 h-3 mr-1" />
                        Generate
                      </>
                    )}
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Info */}
        <div className="text-xs text-muted-foreground p-3 bg-muted/50 rounded-lg">
          💡 Voice synthesis uses Azure Speech Services. Each scene generates a natural-sounding voice-over based on the scene description.
        </div>
      </CardContent>
    </Card>
  )
}
