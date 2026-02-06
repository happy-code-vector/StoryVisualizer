"use client"

import { useState, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { Plus, Trash2, Check, X, Settings, Users, UserX, Ban, Star, Database, BookOpen, Calendar, Eye, Info, Image, Video, Upload, Sparkles, Download, Loader2, RefreshCw, AlertCircle, Copy } from "lucide-react"
import { useAuth } from "@/contexts/AuthContext"
import { useRouter } from "next/navigation"
import { getCookie } from '@/lib/cookie-utils'
import AdminStoryDetails from "@/components/AdminStoryDetails"

interface Model {
  id: number
  name: string
  type: 'character' | 'scene'
  link: string
  isDefault: boolean
}

interface User {
  id: number
  username: string
  role: string
  verified: boolean
  created_at: string
}

interface Story {
  id: number
  title: string
  story: string
  analysis: {
    characters: Array<{ name: string; mentions: number }>
    scenes: Array<{ id: number; title: string; videoUrl?: string }>
  }
  models: {
    characterModel: string | null
    sceneModel: string | null
    videoModel: string | null
  }
  createdAt: string
}

export default function AdminDashboard() {
  const [models, setModels] = useState<Model[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [stories, setStories] = useState<Story[]>([])
  const [storiesLoading, setStoriesLoading] = useState(true)
  const [stats, setStats] = useState({
    totalStories: 0,
    totalCharacters: 0,
    totalScenes: 0,
    storiesWithVideos: 0
  })
  const [selectedStory, setSelectedStory] = useState<Story | null>(null)
  const [storyDetailsOpen, setStoryDetailsOpen] = useState(false)
  const [newModel, setNewModel] = useState({
    name: '',
    type: 'character' as 'character' | 'scene',
    link: '',
    isDefault: false
  })
  const [loading, setLoading] = useState(true)
  const [usersLoading, setUsersLoading] = useState(true)
  const [accessDenied, setAccessDenied] = useState(false)
  const { user, isAuthenticated } = useAuth()
  const router = useRouter()
  const [isTokenVerified, setIsTokenVerified] = useState(false)

  // Test generation states
  const [testTab, setTestTab] = useState<'image' | 'video' | 'gallery'>('image')
  const [imagePrompt, setImagePrompt] = useState('')
  const [imageModelType, setImageModelType] = useState<'character' | 'scene'>('scene')
  const [imageModelName, setImageModelName] = useState('')
  const [isGeneratingImage, setIsGeneratingImage] = useState(false)
  const [generatedImage, setGeneratedImage] = useState<string | null>(null)
  const [imageError, setImageError] = useState<string | null>(null)

  const [videoPrompt, setVideoPrompt] = useState('')
  const [videoDuration, setVideoDuration] = useState<string>('5')
  const [videoAspectRatio, setVideoAspectRatio] = useState<string>('16:9')
  const [generateAudio, setGenerateAudio] = useState<boolean>(false)
  const [referenceImageUrlInput, setReferenceImageUrlInput] = useState('')
  const [referenceImageUrls, setReferenceImageUrls] = useState<string[]>([])
  const [isGeneratingVideo, setIsGeneratingVideo] = useState(false)
  const [videoError, setVideoError] = useState<string | null>(null)

  // Test gallery states
  const [testResults, setTestResults] = useState<any[]>([])
  const [testResultsLoading, setTestResultsLoading] = useState(false)

  // Check if user has admin access
  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login?returnTo=/admin')
      return
    }
    
    // Wait for user data to load
    if (!user) {
      return
    }
    
    // Check if user is verified
    if (!user.verified) {
      // Redirect unverified users to home page with a message
      router.push('/?error=unverified')
      return
    }
    
    // Check if user has admin access
    if (user.role !== 'root' && user.role !== 'admin') {
      setAccessDenied(true)
    }
  }, [isAuthenticated, user, router])

  // Set token as verified once user is loaded and authenticated
  useEffect(() => {
    if (isAuthenticated && user) {
      setIsTokenVerified(true)
    }
  }, [isAuthenticated, user])

  // Fetch models from API
  useEffect(() => {
    const fetchModels = async () => {
      // Check if user is authenticated, verified, and has admin access
      if (!isAuthenticated || !user || !user.verified || (user.role !== 'root' && user.role !== 'admin')) {
        return
      }
      
      try {
        const token = getCookie('authToken')
        const response = await fetch('/api/models', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })
        const data = await response.json()
        
        if (data.characterModels && data.sceneModels) {
          const allModels = [...data.characterModels, ...data.sceneModels]
          setModels(allModels)
        } else if (data.models) {
          setModels(data.models)
        }
      } catch (error) {
        // Silently handle errors to avoid exposing sensitive information
      } finally {
        setLoading(false)
      }
    }

    fetchModels()
  }, [isAuthenticated, user])

  // Fetch users from API
  useEffect(() => {
    const fetchUsers = async () => {
      // Check if user is authenticated, verified, and has admin access
      if (!isAuthenticated || !user || !user.verified || (user.role !== 'root' && user.role !== 'admin')) {
        return
      }
      
      try {
        const token = getCookie('authToken')
        const response = await fetch('/api/users', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })
        const data = await response.json()
        
        if (data.users) {
          setUsers(data.users)
        }
      } catch (error) {
        // Silently handle errors to avoid exposing sensitive information
      } finally {
        setUsersLoading(false)
      }
    }

    fetchUsers()
  }, [isAuthenticated, user])

  // Fetch stories from API
  useEffect(() => {
    const fetchStories = async () => {
      // Check if user is authenticated, verified, and has admin access
      if (!isAuthenticated || !user || !user.verified || (user.role !== 'root' && user.role !== 'admin')) {
        return
      }
      
      try {
        const token = getCookie('authToken')
        const response = await fetch('/api/stories', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })
        const data = await response.json()
        setStories(data)
        
        // Calculate statistics
        const totalCharacters = data.reduce((sum: number, story: Story) => sum + story.analysis.characters.length, 0)
        const totalScenes = data.reduce((sum: number, story: Story) => sum + story.analysis.scenes.length, 0)
        const storiesWithVideos = data.filter((story: Story) => 
          story.analysis.scenes.some(scene => scene.videoUrl)
        ).length
        
        setStats({
          totalStories: data.length,
          totalCharacters,
          totalScenes,
          storiesWithVideos
        })
      } catch (error) {
        console.error('Error fetching stories:', error)
      } finally {
        setStoriesLoading(false)
      }
    }

    fetchStories()
  }, [isAuthenticated, user])

  const handleAddModel = async () => {
    if (!newModel.name || !newModel.link) {
      alert('Please fill in all required fields')
      return
    }

    try {
      const token = getCookie('authToken')
      const response = await fetch('/api/models', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(newModel),
      })

      if (response.ok) {
        const { model } = await response.json()
        setModels([...models, model])
        setNewModel({
          name: '',
          type: 'character',
          link: '',
          isDefault: false
        })
      } else {
        const error = await response.json()
        alert(`Error adding model: ${error.error}`)
      }
    } catch (error) {
      alert('Error adding model')
    }
  }

  const handleDeleteModel = async (id: number, name: string) => {
    if (!confirm(`Are you sure you want to delete the model "${name}"?`)) {
      return
    }

    try {
      const token = getCookie('authToken')
      const response = await fetch(`/api/models?id=${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        setModels(models.filter(model => model.id !== id))
      } else {
        const error = await response.json()
        alert(`Error deleting model: ${error.error}`)
      }
    } catch (error) {
      alert('Error deleting model')
    }
  }

  const handleVerifyUser = async (userId: number, username: string) => {
    if (!confirm(`Are you sure you want to verify user "${username}"?`)) {
      return
    }

    try {
      const token = getCookie('authToken')
      const response = await fetch('/api/auth/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ token, userId }),
      })

      if (response.ok) {
        // Update the user's verified status in the state
        setUsers(users.map(user => 
          user.id === userId ? { ...user, verified: true } : user
        ))
      } else {
        const error = await response.json()
        alert(`Error verifying user: ${error.error}`)
      }
    } catch (error) {
      alert('Error verifying user')
    }
  }

  const handleDisableUser = async (userId: number, username: string) => {
    if (!confirm(`Are you sure you want to disable user "${username}"?`)) {
      return
    }

    try {
      const token = getCookie('authToken')
      const response = await fetch('/api/users/disable', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ userId }),
      })

      if (response.ok) {
        // Update the user's verified status to false (disabled)
        setUsers(users.map(user => 
          user.id === userId ? { ...user, verified: false } : user
        ))
      } else {
        const error = await response.json()
        alert(`Error disabling user: ${error.error}`)
      }
    } catch (error) {
      alert('Error disabling user')
    }
  }

  const handleDeleteUser = async (userId: number, username: string) => {
    if (!confirm(`Are you sure you want to permanently delete user "${username}"? This action cannot be undone.`)) {
      return
    }

    try {
      const token = getCookie('authToken')
      const response = await fetch('/api/users/delete', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ userId }),
      })

      if (response.ok) {
        // Remove the user from the state
        setUsers(users.filter(user => user.id !== userId))
      } else {
        const error = await response.json()
        alert(`Error deleting user: ${error.error}`)
      }
    } catch (error) {
      alert('Error deleting user')
    }
  }

  const handleRoleChange = async (userId: number, username: string, newRole: string) => {
    if (!confirm(`Are you sure you want to change ${username}'s role to ${newRole}?`)) {
      return
    }

    try {
      const token = getCookie('authToken')
      const response = await fetch('/api/users/role', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ userId, role: newRole }),
      })

      if (response.ok) {
        // Update the user's role in the state
        setUsers(users.map(user => 
          user.id === userId ? { ...user, role: newRole } : user
        ))
      } else {
        const error = await response.json()
        alert(`Error changing user role: ${error.error}`)
      }
    } catch (error) {
      alert('Error changing user role')
    }
  }

  const handleDeleteStory = async (id: number, title: string) => {
    if (!confirm(`Are you sure you want to delete the story "${title}"?`)) {
      return
    }

    try {
      const token = getCookie('authToken')
      const response = await fetch(`/api/stories/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      
      if (response.ok) {
        // Remove the story from the local state
        const newStories = stories.filter(story => story.id !== id)
        setStories(newStories)
        
        // Recalculate stats
        const totalCharacters = newStories.reduce((sum: number, story: Story) => sum + story.analysis.characters.length, 0)
        const totalScenes = newStories.reduce((sum: number, story: Story) => sum + story.analysis.scenes.length, 0)
        const storiesWithVideos = newStories.filter((story: Story) => 
          story.analysis.scenes.some(scene => scene.videoUrl)
        ).length
        
        setStats({
          totalStories: newStories.length,
          totalCharacters,
          totalScenes,
          storiesWithVideos
        })
      } else {
        const error = await response.json()
        alert(`Failed to delete story: ${error.error || 'Unknown error'}`)
      }
    } catch (error) {
      console.error('Error deleting story:', error)
      alert('Error deleting story')
    }
  }

  const handleDeleteAllStories = async () => {
    if (!confirm('Are you sure you want to delete ALL stories? This action cannot be undone.')) {
      return
    }

    try {
      const token = getCookie('authToken')
      const response = await fetch('/api/stories/delete-all', {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      
      if (response.ok) {
        // Clear the local state
        setStories([])
        setStats({
          totalStories: 0,
          totalCharacters: 0,
          totalScenes: 0,
          storiesWithVideos: 0
        })
      } else {
        const error = await response.json()
        alert(`Failed to delete all stories: ${error.error || 'Unknown error'}`)
      }
    } catch (error) {
      console.error('Error deleting all stories:', error)
      alert('Error deleting all stories')
    }
  }

  const viewStory = (story: Story) => {
    setSelectedStory(story)
    setStoryDetailsOpen(true)
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

  const getStoryPreview = (story: string) => {
    const sentences = story.split('. ').slice(0, 2);
    return sentences.join('. ') + (sentences.length < story.split('. ').length ? '...' : '');
  }

  // Handle image generation
  const handleImageGeneration = async () => {
    if (!imagePrompt.trim() || !imageModelName) {
      setImageError('Please provide a prompt and select a model')
      return
    }

    setIsGeneratingImage(true)
    setImageError(null)
    setGeneratedImage(null)

    try {
      const token = getCookie('authToken')

      // Use the new test API for image generation
      const response = await fetch('/api/admin/test/generate-image', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          prompt: imagePrompt,
          modelName: imageModelName,
          type: imageModelType
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Image generation failed')
      }

      setGeneratedImage(data.imageUrl)
    } catch (error: any) {
      setImageError(error.message || 'Failed to generate image')
    } finally {
      setIsGeneratingImage(false)
    }
  }

  // Handle video generation (using Kling O3 Pro model)
  const handleVideoGeneration = async () => {
    if (!videoPrompt.trim()) {
      setVideoError('Please provide a prompt')
      return
    }

    setIsGeneratingVideo(true)
    setVideoError(null)

    try {
      const token = getCookie('authToken')

      // Submit the video generation job
      const response = await fetch('/api/admin/test/generate-video', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          prompt: videoPrompt,
          referenceImageUrls: referenceImageUrls.length > 0 ? referenceImageUrls : undefined,
          duration: parseInt(videoDuration),
          aspectRatio: videoAspectRatio,
          generateAudio
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to submit video generation job')
      }

      // Refresh the test results to show the new queued item
      await fetchTestResults()

    } catch (error: any) {
      setVideoError(error.message || 'Failed to submit video generation job')
    } finally {
      setIsGeneratingVideo(false)
    }
  }

  // Add reference image URL
  const addReferenceImageUrl = () => {
    if (referenceImageUrlInput.trim() && !referenceImageUrls.includes(referenceImageUrlInput.trim())) {
      setReferenceImageUrls([...referenceImageUrls, referenceImageUrlInput.trim()])
      setReferenceImageUrlInput('')
    }
  }

  // Remove reference image URL
  const removeReferenceImageUrl = (index: number) => {
    setReferenceImageUrls(referenceImageUrls.filter((_, i) => i !== index))
  }

  // Handle Enter key in URL input
  const handleUrlInputKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      addReferenceImageUrl()
    }
  }

  // Fetch test results
  const fetchTestResults = async () => {
    setTestResultsLoading(true)
    try {
      const token = getCookie('authToken')
      const response = await fetch('/api/admin/test/results', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        console.log('[Admin Gallery] Received data:', data)
        const results = Array.isArray(data.results) ? data.results : []
        console.log('[Admin Gallery] Setting test results:', results.length, 'items')
        setTestResults(results)
      } else {
        // If response is not ok, set to empty array
        console.error('[Admin Gallery] Response not OK:', response.status, response.statusText)
        setTestResults([])
      }
    } catch (error) {
      console.error('Error fetching test results:', error)
      setTestResults([])
    } finally {
      setTestResultsLoading(false)
    }
  }

  // Fetch test results when test tab changes
  useEffect(() => {
    if (testTab && isAuthenticated && user?.verified) {
      fetchTestResults()
    }
  }, [testTab])

  // Toggle image selection from gallery (directly adds/removes from reference images)
  const toggleImageSelection = (url: string) => {
    if (referenceImageUrls.includes(url)) {
      // Remove from reference images
      setReferenceImageUrls(referenceImageUrls.filter(u => u !== url))
    } else {
      // Add to reference images
      setReferenceImageUrls([...referenceImageUrls, url])
    }
  }

  // Filter out root users and current user from the display
  const filteredUsers = users.filter(u => u.role !== 'root' && u.id !== user?.id)
  
  // Check if current user is root (can change roles)
  const isRootUser = user?.role === 'root'

  // Show access denied if user doesn't have admin access
  if (accessDenied) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="max-w-md mx-auto">
          <CardHeader>
            <CardTitle>Access Denied</CardTitle>
          </CardHeader>
          <CardContent>
            <p>You don't have permission to access this page.</p>
            <Button className="mt-4" onClick={() => router.push('/')}>Go Home</Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Show loading state while checking permissions
  if (loading || !isAuthenticated || !user || !isTokenVerified) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </div>
    )
  }

  // Check if user is verified
  if (!user.verified) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="max-w-md mx-auto">
          <CardHeader>
            <CardTitle>Account Not Verified</CardTitle>
          </CardHeader>
          <CardContent>
            <p>Your account has not been verified yet. Please contact an administrator.</p>
            <Button className="mt-4" onClick={() => router.push('/')}>Go Home</Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Check if user has admin access
  if (user.role !== 'root' && user.role !== 'admin') {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="max-w-md mx-auto">
          <CardHeader>
            <CardTitle>Access Denied</CardTitle>
          </CardHeader>
          <CardContent>
            <p>You don't have permission to access this page.</p>
            <Button className="mt-4" onClick={() => router.push('/')}>Go Home</Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold">Admin Dashboard</h1>
      </div>

      <Tabs defaultValue="models" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="models" className="flex items-center gap-2">
            <Settings className="w-4 h-4" />
            Model Management
          </TabsTrigger>
          <TabsTrigger value="users" className="flex items-center gap-2">
            <Users className="w-4 h-4" />
            User Management
          </TabsTrigger>
          <TabsTrigger value="stories" className="flex items-center gap-2">
            <Database className="w-4 h-4" />
            Story Management
          </TabsTrigger>
          <TabsTrigger value="test" className="flex items-center gap-2">
            <Sparkles className="w-4 h-4" />
            Test Generation
          </TabsTrigger>
        </TabsList>

        <TabsContent value="models" className="mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Add New Model Form */}
            <Card>
              <CardHeader>
                <CardTitle>Add New Model</CardTitle>
                <CardDescription>Add a new AI model for character or scene generation</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="modelName">Model Name</Label>
                  <Input
                    id="modelName"
                    value={newModel.name}
                    onChange={(e) => setNewModel({ ...newModel, name: e.target.value })}
                    placeholder="Enter model name"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="modelType">Model Type</Label>
                  <Select value={newModel.type} onValueChange={(value: 'character' | 'scene') => setNewModel({ ...newModel, type: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select model type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="character">Character Generation</SelectItem>
                      <SelectItem value="scene">Scene Generation</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="modelLink">API Link</Label>
                  <Input
                    id="modelLink"
                    value={newModel.link}
                    onChange={(e) => setNewModel({ ...newModel, link: e.target.value })}
                    placeholder="Enter API endpoint URL"
                  />
                </div>
                
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="isDefault"
                    checked={newModel.isDefault}
                    onChange={(e) => setNewModel({ ...newModel, isDefault: e.target.checked })}
                    className="h-4 w-4"
                  />
                  <Label htmlFor="isDefault">Set as default model</Label>
                </div>
                
                <Button onClick={handleAddModel} className="w-full">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Model
                </Button>
              </CardContent>
            </Card>

            {/* Models List */}
            <Card>
              <CardHeader>
                <CardTitle>Existing Models</CardTitle>
                <CardDescription>Manage available AI models for story visualization</CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="flex items-center justify-center h-32">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                  </div>
                ) : (
                  <div className="max-h-96 overflow-y-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Name</TableHead>
                          <TableHead>Type</TableHead>
                          <TableHead>Default</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {models.map((model) => (
                          <TableRow key={model.id}>
                            <TableCell className="font-medium">{model.name}</TableCell>
                            <TableCell>
                              <span className={`px-2 py-1 rounded-full text-xs ${
                                model.type === 'character' 
                                  ? 'bg-blue-100 text-blue-800' 
                                  : 'bg-green-100 text-green-800'
                              }`}>
                                {model.type}
                              </span>
                            </TableCell>
                            <TableCell>
                              {model.isDefault ? (
                                <span className="flex items-center gap-1 text-amber-600">
                                  <Star className="w-4 h-4 fill-current" />
                                  <span className="text-xs font-medium">Default</span>
                                </span>
                              ) : (
                                <span className="text-gray-400">-</span>
                              )}
                            </TableCell>
                            <TableCell className="text-right">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleDeleteModel(model.id, model.name)}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="users" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>User Management</CardTitle>
              <CardDescription>
                {isRootUser 
                  ? "Manage user accounts, roles, and verification status (Root privileges)" 
                  : "Manage user accounts and verification status (Admin privileges)"
                }
              </CardDescription>
            </CardHeader>
            <CardContent>
              {usersLoading ? (
                <div className="flex items-center justify-center h-32">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Username</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Created At</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredUsers.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell className="font-medium">{user.username}</TableCell>
                        <TableCell>
                          {isRootUser ? (
                            <Select 
                              value={user.role} 
                              onValueChange={(newRole) => handleRoleChange(user.id, user.username, newRole)}
                            >
                              <SelectTrigger className="w-32">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="admin">Admin</SelectItem>
                                <SelectItem value="paid">Paid</SelectItem>
                                <SelectItem value="unpaid">Unpaid</SelectItem>
                              </SelectContent>
                            </Select>
                          ) : (
                            <span className={`px-2 py-1 rounded-full text-xs ${
                              user.role === 'admin'
                                ? 'bg-blue-100 text-blue-800'
                                : user.role === 'paid'
                                ? 'bg-green-100 text-green-800'
                                : 'bg-gray-100 text-gray-800'
                            }`}>
                              {user.role}
                            </span>
                          )}
                        </TableCell>
                        <TableCell>
                          {user.verified ? (
                            <span className="text-green-600 flex items-center">
                              <Check className="w-4 h-4 mr-1" /> Active
                            </span>
                          ) : (
                            <span className="text-red-600 flex items-center">
                              <X className="w-4 h-4 mr-1" /> Disabled
                            </span>
                          )}
                        </TableCell>
                        <TableCell>
                          {new Date(user.created_at).toLocaleDateString()}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center gap-2 justify-end">
                            {user.verified ? (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleDisableUser(user.id, user.username)}
                              >
                                <Ban className="w-4 h-4 mr-1" />
                                Disable
                              </Button>
                            ) : (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleVerifyUser(user.id, user.username)}
                              >
                                <Check className="w-4 h-4 mr-1" />
                                Enable
                              </Button>
                            )}
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => handleDeleteUser(user.id, user.username)}
                            >
                              <UserX className="w-4 h-4 mr-1" />
                              Delete
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="stories" className="mt-6">
          {/* Admin Statistics */}
          {!storiesLoading && stories.length > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
                <CardContent className="pt-4">
                  <div className="text-2xl font-bold text-primary">{stats.totalStories}</div>
                  <div className="text-sm text-muted-foreground">Total Stories</div>
                </CardContent>
              </Card>
              <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
                <CardContent className="pt-4">
                  <div className="text-2xl font-bold text-accent">{stats.totalCharacters}</div>
                  <div className="text-sm text-muted-foreground">Total Characters</div>
                </CardContent>
              </Card>
              <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
                <CardContent className="pt-4">
                  <div className="text-2xl font-bold text-primary">{stats.totalScenes}</div>
                  <div className="text-sm text-muted-foreground">Total Scenes</div>
                </CardContent>
              </Card>
              <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
                <CardContent className="pt-4">
                  <div className="text-2xl font-bold text-accent">{stats.storiesWithVideos}</div>
                  <div className="text-sm text-muted-foreground">Stories with Videos</div>
                </CardContent>
              </Card>
            </div>
          )}

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Story Management</CardTitle>
                  <CardDescription>
                    Manage all user stories, view details, and delete content as needed
                  </CardDescription>
                </div>
                {!storiesLoading && stories.length > 0 && (
                  <Button
                    variant="destructive"
                    onClick={handleDeleteAllStories}
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete All Stories
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {storiesLoading ? (
                <div className="flex items-center justify-center h-32">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : stories.length === 0 ? (
                <div className="text-center py-12">
                  <Database className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-xl font-semibold mb-2">No Stories Found</h3>
                  <p className="text-muted-foreground mb-4">
                    No stories have been created yet. Users can create stories from the main application.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {stories.map((story) => (
                    <div key={story.id} className="border border-border/50 rounded-lg p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <h3 className="text-lg font-semibold truncate">{story.title}</h3>
                          <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                            {getStoryPreview(story.story)}
                          </p>
                          <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <Users className="w-3 h-3" />
                              <span>{story.analysis.characters.length} characters</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <BookOpen className="w-3 h-3" />
                              <span>{story.analysis.scenes.length} scenes</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              <span>{formatDate(story.createdAt)}</span>
                            </div>
                            {story.analysis.scenes.some(scene => scene.videoUrl) && (
                              <div className="flex items-center gap-1 text-accent">
                                <Database className="w-3 h-3" />
                                <span>Has videos</span>
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2 ml-4">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => viewStory(story)}
                          >
                            <Info className="w-4 h-4 mr-1" />
                            Details
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleDeleteStory(story.id, story.title)}
                          >
                            <Trash2 className="w-4 h-4 mr-1" />
                            Delete
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="test" className="mt-6">
          <Tabs value={testTab} onValueChange={(v) => setTestTab(v as 'image' | 'video' | 'gallery')} className="w-full">
            <TabsList className="grid w-full grid-cols-3 max-w-md">
              <TabsTrigger value="image" className="flex items-center gap-2">
                <Image className="w-4 h-4" />
                Image Generation
              </TabsTrigger>
              <TabsTrigger value="video" className="flex items-center gap-2">
                <Video className="w-4 h-4" />
                Video Generation
              </TabsTrigger>
              <TabsTrigger value="gallery" className="flex items-center gap-2">
                <Database className="w-4 h-4" />
                Gallery
              </TabsTrigger>
            </TabsList>

            {/* Image Generation Test */}
            <TabsContent value="image" className="mt-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Input Section */}
                <Card>
                  <CardHeader>
                    <CardTitle>Generate Image</CardTitle>
                    <CardDescription>Test image generation with different models and prompts</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="imageModelType">Image Type</Label>
                      <Select
                        value={imageModelType}
                        onValueChange={(value: 'character' | 'scene') => {
                          setImageModelType(value)
                          // Update model name when type changes
                          const characterModels = models.filter(m => m.type === 'character')
                          const sceneModels = models.filter(m => m.type === 'scene')
                          const availableModels = value === 'character' ? characterModels : sceneModels
                          const defaultModel = availableModels.find(m => m.isDefault) || availableModels[0]
                          if (defaultModel) setImageModelName(defaultModel.name)
                        }}
                      >
                        <SelectTrigger id="imageModelType">
                          <SelectValue placeholder="Select image type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="scene">Scene Image</SelectItem>
                          <SelectItem value="character">Character Portrait</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="imageModel">Model</Label>
                      <Select
                        value={imageModelName}
                        onValueChange={setImageModelName}
                      >
                        <SelectTrigger id="imageModel">
                          <SelectValue placeholder="Select a model" />
                        </SelectTrigger>
                        <SelectContent>
                          {(imageModelType === 'character'
                            ? models.filter(m => m.type === 'character')
                            : models.filter(m => m.type === 'scene')
                          ).map((model) => (
                            <SelectItem key={model.id} value={model.name}>
                              {model.name} {model.isDefault && '(Default)'}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="imagePrompt">Prompt</Label>
                      <Textarea
                        id="imagePrompt"
                        placeholder="Describe what you want to generate..."
                        value={imagePrompt}
                        onChange={(e) => setImagePrompt(e.target.value)}
                        rows={5}
                        className="resize-none"
                      />
                    </div>

                    {imageError && (
                      <div className="p-3 rounded-md bg-destructive/10 text-destructive text-sm">
                        {imageError}
                      </div>
                    )}

                    <Button
                      onClick={handleImageGeneration}
                      disabled={isGeneratingImage || !imagePrompt.trim()}
                      className="w-full"
                    >
                      {isGeneratingImage ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Generating...
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-4 h-4 mr-2" />
                          Generate Image
                        </>
                      )}
                    </Button>
                  </CardContent>
                </Card>

                {/* Result Section */}
                <Card>
                  <CardHeader>
                    <CardTitle>Result</CardTitle>
                    <CardDescription>Generated image will appear here</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {isGeneratingImage ? (
                      <div className="aspect-square flex items-center justify-center border rounded-lg bg-muted">
                        <div className="text-center">
                          <Loader2 className="w-12 h-12 mx-auto mb-4 animate-spin text-primary" />
                          <p className="text-sm text-muted-foreground">Generating image...</p>
                        </div>
                      </div>
                    ) : generatedImage ? (
                      <div className="space-y-4">
                        <div className="aspect-square border rounded-lg overflow-hidden">
                          <img
                            src={generatedImage}
                            alt="Generated image"
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            className="flex-1"
                            onClick={() => {
                              const link = document.createElement('a')
                              link.href = generatedImage
                              link.download = `generated-image-${Date.now()}.png`
                              link.click()
                            }}
                          >
                            <Download className="w-4 h-4 mr-2" />
                            Download
                          </Button>
                          <Button
                            variant="outline"
                            onClick={() => setGeneratedImage(null)}
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="aspect-square flex items-center justify-center border rounded-lg bg-muted">
                        <div className="text-center text-muted-foreground">
                          <Image className="w-12 h-12 mx-auto mb-4 opacity-50" />
                          <p>No image generated yet</p>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Video Generation Test */}
            <TabsContent value="video" className="mt-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Input Section */}
                <Card>
                  <CardHeader>
                    <CardTitle>Generate Video</CardTitle>
                    <CardDescription>Test video generation using Kling O3 Pro model (supports text-to-video and image-to-video)</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="videoPrompt">Prompt</Label>
                      <Textarea
                        id="videoPrompt"
                        placeholder="Describe the video you want to generate..."
                        value={videoPrompt}
                        onChange={(e) => setVideoPrompt(e.target.value)}
                        rows={4}
                        className="resize-none"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="videoDuration">Duration (seconds)</Label>
                        <Select value={videoDuration} onValueChange={setVideoDuration}>
                          <SelectTrigger id="videoDuration">
                            <SelectValue placeholder="Select duration" />
                          </SelectTrigger>
                          <SelectContent>
                            {Array.from({ length: 13 }, (_, i) => i + 3).map((duration) => (
                              <SelectItem key={duration} value={duration.toString()}>
                                {duration} seconds
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="videoAspectRatio">Aspect Ratio</Label>
                        <Select value={videoAspectRatio} onValueChange={setVideoAspectRatio}>
                          <SelectTrigger id="videoAspectRatio">
                            <SelectValue placeholder="Select aspect ratio" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="16:9">16:9 (Landscape)</SelectItem>
                            <SelectItem value="9:16">9:16 (Portrait)</SelectItem>
                            <SelectItem value="1:1">1:1 (Square)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="generateAudio"
                        checked={generateAudio}
                        onCheckedChange={(checked) => setGenerateAudio(checked as boolean)}
                      />
                      <Label htmlFor="generateAudio" className="cursor-pointer">
                        Generate Audio (supports Chinese and English voice output)
                      </Label>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="referenceImageUrl">Reference Image URLs (Optional)</Label>
                      <p className="text-xs text-muted-foreground">
                        Enter one or more image URLs to use image-to-video mode. Leave empty for text-to-video mode.
                      </p>
                      <div className="flex gap-2">
                        <Input
                          id="referenceImageUrl"
                          type="url"
                          placeholder="https://example.com/image.jpg"
                          value={referenceImageUrlInput}
                          onChange={(e) => setReferenceImageUrlInput(e.target.value)}
                          onKeyDown={handleUrlInputKeyDown}
                        />
                        <Button
                          type="button"
                          variant="outline"
                          onClick={addReferenceImageUrl}
                          disabled={!referenceImageUrlInput.trim()}
                        >
                          <Upload className="w-4 h-4" />
                        </Button>
                      </div>

                      {referenceImageUrls.length > 0 && (
                        <div className="space-y-3 mt-3">
                          <p className="text-xs text-muted-foreground">
                            {referenceImageUrls.length} reference image{referenceImageUrls.length > 1 ? 's' : ''} added:
                          </p>
                          <div className="grid grid-cols-3 gap-2">
                            {referenceImageUrls.map((url, index) => (
                              <div key={index} className="relative group">
                                <img
                                  src={url}
                                  alt={`Reference ${index + 1}`}
                                  className="w-full h-24 object-cover rounded"
                                  onError={(e) => {
                                    (e.target as HTMLImageElement).src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="100" height="100"%3E%3Crect width="100" height="100" fill="%23ccc"/%3E%3Ctext x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" fill="%23666" font-size="12"%3EInvalid%3C/text%3E%3C/svg%3E'
                                  }}
                                />
                                <Button
                                  variant="destructive"
                                  size="sm"
                                  onClick={() => removeReferenceImageUrl(index)}
                                  className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                  <X className="w-3 h-3" />
                                </Button>
                              </div>
                            ))}
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setReferenceImageUrls([])}
                            className="w-full"
                          >
                            <X className="w-4 h-4 mr-2" />
                            Remove All
                          </Button>
                        </div>
                      )}
                    </div>

                    {/* Test Gallery Section */}
                    {Array.isArray(testResults) && testResults.filter(r => r.type === 'image').length > 0 && (
                      <div className="space-y-2">
                        <Label>Test Gallery (Click to add/remove reference images)</Label>
                        <p className="text-xs text-muted-foreground">
                          Click images to add them as reference images for video generation
                        </p>
                        <div className="grid grid-cols-4 gap-2 max-h-48 overflow-y-auto p-2 border rounded-lg">
                          {testResults.filter(r => r.type === 'image').map((result) => (
                            <div
                              key={result.id}
                              onClick={() => toggleImageSelection(result.url)}
                              className={`relative cursor-pointer rounded-lg overflow-hidden border-2 transition-all ${
                                referenceImageUrls.includes(result.url)
                                  ? 'border-primary ring-2 ring-primary/50'
                                  : 'border-transparent hover:border-muted-foreground'
                              }`}
                            >
                              <img
                                src={result.url}
                                alt={result.prompt || 'Test result'}
                                className="w-full h-20 object-cover"
                              />
                              {referenceImageUrls.includes(result.url) && (
                                <div className="absolute top-1 right-1 bg-primary text-primary-foreground rounded-full p-1">
                                  <Check className="w-3 h-3" />
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {videoError && (
                      <div className="p-3 rounded-md bg-destructive/10 text-destructive text-sm">
                        {videoError}
                      </div>
                    )}

                    <Button
                      onClick={handleVideoGeneration}
                      disabled={isGeneratingVideo || !videoPrompt.trim()}
                      className="w-full"
                    >
                      {isGeneratingVideo ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Generating...
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-4 h-4 mr-2" />
                          Generate Video
                        </>
                      )}
                    </Button>
                  </CardContent>
                </Card>

                {/* Queue Section */}
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle>Queue</CardTitle>
                        <CardDescription>
                          All video generation requests ({Array.isArray(testResults.filter((r: any) => r.type === 'video')) ? testResults.filter((r: any) => r.type === 'video').length : 0} items)
                        </CardDescription>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => fetchTestResults()}
                      >
                        <RefreshCw className="w-4 h-4 mr-2" />
                        Refresh
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {testResults.filter((r: any) => r.type === 'video').length === 0 ? (
                      <div className="aspect-video flex items-center justify-center border rounded-lg bg-muted">
                        <div className="text-center text-muted-foreground">
                          <Video className="w-12 h-12 mx-auto mb-4 opacity-50" />
                          <p>No video requests yet</p>
                          <p className="text-xs mt-2">Generate your first video above</p>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-3 max-h-[600px] overflow-y-auto">
                        {testResults
                          .filter((r: any) => r.type === 'video')
                          .sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
                          .map((result: any) => (
                            <div key={result.id} className="border rounded-lg p-4 space-y-3">
                              <div className="flex items-start justify-between">
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 mb-1">
                                    <span className="text-sm font-medium truncate">
                                      {result.prompt || 'No prompt'}
                                    </span>
                                    <Badge variant={
                                      result.status === 'completed' ? 'default' :
                                      result.status === 'processing' ? 'secondary' :
                                      result.status === 'failed' ? 'destructive' : 'outline'
                                    }>
                                      {result.status === 'completed' ? 'Completed' :
                                       result.status === 'processing' ? 'Processing' :
                                       result.status === 'failed' ? 'Failed' : 'Pending'}
                                    </Badge>
                                  </div>
                                  <div className="text-xs text-muted-foreground space-y-1">
                                    <p>Model: {result.model || 'Unknown'}</p>
                                    <p>Created: {new Date(result.created_at).toLocaleString()}</p>
                                    {result.request_id && (
                                      <p className="font-mono text-xs">ID: {result.request_id.slice(0, 12)}...</p>
                                    )}
                                  </div>
                                  {result.error_message && (
                                    <p className="text-xs text-destructive mt-2">{result.error_message}</p>
                                  )}
                                </div>
                              </div>

                              {/* Video player or status */}
                              {result.status === 'completed' && result.url ? (
                                <div className="aspect-video rounded-lg overflow-hidden bg-black">
                                  <video
                                    src={result.url}
                                    controls
                                    className="w-full h-full"
                                  />
                                </div>
                              ) : result.status === 'pending' || result.status === 'processing' ? (
                                <div className="aspect-video rounded-lg bg-muted flex items-center justify-center">
                                  <div className="text-center">
                                    <Loader2 className="w-8 h-8 mx-auto mb-2 animate-spin text-primary" />
                                    <p className="text-sm text-muted-foreground">
                                      {result.status === 'pending' ? 'Queued for generation...' : 'Processing...'}
                                    </p>
                                    <p className="text-xs text-muted-foreground mt-1">This may take 1-2 minutes</p>
                                  </div>
                                </div>
                              ) : result.status === 'failed' ? (
                                <div className="aspect-video rounded-lg bg-muted flex items-center justify-center">
                                  <div className="text-center text-destructive">
                                    <AlertCircle className="w-8 h-8 mx-auto mb-2" />
                                    <p className="text-sm">Generation failed</p>
                                    <p className="text-xs text-muted-foreground mt-1">{result.error_message || 'Unknown error'}</p>
                                  </div>
                                </div>
                              ) : null}

                              {/* Actions */}
                              {result.status === 'completed' && result.url && (
                                <div className="flex gap-2">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="flex-1"
                                    onClick={() => {
                                      const link = document.createElement('a')
                                      link.href = result.url
                                      link.download = `video-${result.id}-${Date.now()}.mp4`
                                      link.click()
                                    }}
                                  >
                                    <Download className="w-4 h-4 mr-2" />
                                    Download
                                  </Button>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => {
                                      navigator.clipboard.writeText(result.url)
                                    }}
                                  >
                                    <Copy className="w-4 h-4" />
                                  </Button>
                                </div>
                              )}
                            </div>
                          ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Test Gallery */}
            <TabsContent value="gallery" className="mt-6">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Test Results Gallery</CardTitle>
                      <CardDescription>
                        View all your test generations ({Array.isArray(testResults) ? testResults.length : 0} items)
                      </CardDescription>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={fetchTestResults}
                      disabled={testResultsLoading}
                    >
                      Refresh
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {testResultsLoading ? (
                    <div className="flex items-center justify-center h-64">
                      <Loader2 className="w-8 h-8 animate-spin text-primary" />
                    </div>
                  ) : !Array.isArray(testResults) || testResults.length === 0 ? (
                    <div className="text-center py-12">
                      <Database className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                      <h3 className="text-xl font-semibold mb-2">No Test Results Yet</h3>
                      <p className="text-muted-foreground">
                        Generate images or videos to see them here
                      </p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                      {testResults.map((result) => (
                        <div key={result.id} className="group relative">
                          <div className="aspect-square border rounded-lg overflow-hidden bg-muted">
                            {result.type === 'image' ? (
                              <img
                                src={result.url}
                                alt={result.prompt || 'Test result'}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <video
                                src={result.url}
                                controls
                                className="w-full h-full"
                              />
                            )}
                          </div>
                          <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => {
                                if (confirm('Delete this test result?')) {
                                  fetch('/api/admin/test/results?id=' + result.id, {
                                    method: 'DELETE',
                                    headers: { 'Authorization': `Bearer ${getCookie('authToken')}` }
                                  }).then(() => fetchTestResults())
                                }
                              }}
                            >
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          </div>
                          <div className="mt-2">
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              <span className={`px-2 py-0.5 rounded-full ${
                                result.type === 'image'
                                  ? 'bg-blue-100 text-blue-800'
                                  : 'bg-purple-100 text-purple-800'
                              }`}>
                                {result.type === 'image' ? 'Image' : 'Video'}
                              </span>
                              <span>{new Date(result.created_at).toLocaleDateString()}</span>
                            </div>
                            {result.prompt && (
                              <p className="text-xs text-muted-foreground truncate mt-1">
                                {result.prompt}
                              </p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </TabsContent>
      </Tabs>
      
      {/* Admin Story Details Modal */}
      {selectedStory && (
        <AdminStoryDetails
          story={selectedStory}
          isOpen={storyDetailsOpen}
          onClose={() => {
            setStoryDetailsOpen(false)
            setSelectedStory(null)
          }}
          onDelete={handleDeleteStory}
        />
      )}
    </div>
  )
}