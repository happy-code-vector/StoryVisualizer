"use client"

import { useState, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Plus, Save, Trash2, Check, X } from "lucide-react"
import { useAuth } from "@/contexts/AuthContext"
import { useRouter } from "next/navigation"
import { getCookie } from '@/lib/cookie-utils'

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

export default function ModelManagementPage() {
  const [models, setModels] = useState<Model[]>([])
  const [users, setUsers] = useState<User[]>([])
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
                          <span className="text-green-600">✓</span>
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
            )}
          </CardContent>
        </Card>

        {/* Users List */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>User Management</CardTitle>
            <CardDescription>Manage user accounts and verification status</CardDescription>
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
                    <TableHead>Verified</TableHead>
                    <TableHead>Created At</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium">{user.username}</TableCell>
                      <TableCell>
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          user.role === 'root' 
                            ? 'bg-purple-100 text-purple-800' 
                            : user.role === 'admin'
                            ? 'bg-blue-100 text-blue-800'
                            : user.role === 'paid'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {user.role}
                        </span>
                      </TableCell>
                      <TableCell>
                        {user.verified ? (
                          <span className="text-green-600 flex items-center">
                            <Check className="w-4 h-4 mr-1" /> Verified
                          </span>
                        ) : (
                          <span className="text-red-600 flex items-center">
                            <X className="w-4 h-4 mr-1" /> Pending
                          </span>
                        )}
                      </TableCell>
                      <TableCell>
                        {new Date(user.created_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-right">
                        {!user.verified && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleVerifyUser(user.id, user.username)}
                          >
                            <Check className="w-4 h-4 mr-1" />
                            Verify
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}