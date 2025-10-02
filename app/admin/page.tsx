"use client"

import { useState, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Plus, Trash2, Check, X, Settings, Users, UserX, Ban, Star, Database, BookOpen, Calendar, Eye, Info } from "lucide-react"
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
        <TabsList className="grid w-full grid-cols-3">
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