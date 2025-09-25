"use client"

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { History as HistoryIcon, BookOpen, Users, Calendar, ArrowLeft } from "lucide-react"

interface Story {
  id: number
  title: string
  story: string
  analysis: {
    characters: Array<{ name: string; mentions: number }>
    scenes: Array<{ id: number; title: string }>
  }
  createdAt: string
}

export default function HistoryPage() {
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
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
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
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Button variant="outline" onClick={() => router.push('/')}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            <h1 className="text-3xl font-bold gradient-text flex items-center gap-2">
              <HistoryIcon className="w-8 h-8 text-primary" />
              Analysis History
            </h1>
          </div>
        </div>

        {stories.length === 0 ? (
          <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
            <CardContent className="pt-6 text-center py-12">
              <HistoryIcon className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">No Analysis History</h3>
              <p className="text-muted-foreground mb-4">
                You haven't analyzed any stories yet. Go to the main page to get started!
              </p>
              <Button onClick={() => router.push('/')}>
                Analyze a Story
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6">
            {stories.map((story) => (
              <Card 
                key={story.id} 
                className="border-border/50 bg-card/50 backdrop-blur-sm hover:bg-card/70 transition-colors cursor-pointer"
                onClick={() => viewStory(story.id)}
              >
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <BookOpen className="w-5 h-5 text-primary" />
                      {story.title || "Untitled Story"}
                    </CardTitle>
                    <Badge variant="secondary">
                      <Calendar className="w-3 h-3 mr-1" />
                      {formatDate(story.createdAt)}
                    </Badge>
                  </div>
                  <CardDescription className="line-clamp-2">
                    {story.story.substring(0, 150)}...
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-4">
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4 text-accent" />
                      <span className="text-sm">
                        {story.analysis.characters?.length || 0} characters
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <BookOpen className="w-4 h-4 text-primary" />
                      <span className="text-sm">
                        {story.analysis.scenes?.length || 0} scenes
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">
                        {story.analysis.characters?.reduce((sum, c) => sum + c.mentions, 0) || 0} total mentions
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}