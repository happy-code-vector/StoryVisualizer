"use client"

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Storyboard from "@/components/Storyboard"

interface Character {
  name: string
  description: string
  imageUrl?: string
  mentions: number
  attributes: string[]
  relationships: string[]
  audioCues?: string[]
}

interface Scene {
  id: number
  title: string
  description: string
  characters: string[]
  duration?: number
  audioElements?: string[]
  imageUrl?: string
  videoUrl?: string
}

interface Story {
  id: number
  title: string
  story: string
  analysis: {
    characters: Character[]
    scenes: Scene[]
  }
  createdAt: string
}

export default function StoryPage({ params }: { params: { id: string } }) {
  const [story, setStory] = useState<Story | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    fetchStory()
  }, [params.id])

  const fetchStory = async () => {
    try {
      const response = await fetch(`/api/stories?id=${params.id}`)
      const data = await response.json()
      
      if (data.error) {
        throw new Error(data.error)
      }
      
      setStory(data)
    } catch (error) {
      console.error('Error fetching story:', error)
    } finally {
      setLoading(false)
    }
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

  if (!story) {
    return (
      <div className="min-h-screen bg-background relative overflow-hidden">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center py-12">
            <h2 className="text-2xl font-bold mb-4">Story Not Found</h2>
            <p className="text-muted-foreground mb-6">The requested story analysis could not be found.</p>
            <Button onClick={() => router.push('/gallery')}>
              Back to Gallery
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <Storyboard 
      title={story.title || "Untitled Story"}
      characters={story.analysis.characters}
      scenes={story.analysis.scenes}
    />
  )
}