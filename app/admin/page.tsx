"use client"

import { useState, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Plus, Save, Trash2 } from "lucide-react"

interface Model {
  id: number
  name: string
  type: 'character' | 'scene'
  link: string
  isDefault: boolean
}

export default function ModelManagementPage() {
  const [models, setModels] = useState<Model[]>([])
  const [newModel, setNewModel] = useState({
    name: '',
    type: 'character' as 'character' | 'scene',
    link: '',
    isDefault: false
  })
  const [loading, setLoading] = useState(true)

  // Fetch models from API
  useEffect(() => {
    const fetchModels = async () => {
      try {
        const response = await fetch('/api/models')
        const data = await response.json()
        
        if (data.characterModels && data.sceneModels) {
          const allModels = [...data.characterModels, ...data.sceneModels]
          setModels(allModels)
        } else if (data.models) {
          setModels(data.models)
        }
      } catch (error) {
        console.error('Error fetching models:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchModels()
  }, [])

  const handleAddModel = async () => {
    if (!newModel.name || !newModel.link) {
      alert('Please fill in all required fields')
      return
    }

    try {
      const response = await fetch('/api/models', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
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
      console.error('Error adding model:', error)
      alert('Error adding model')
    }
  }

  const handleDeleteModel = async (id: number, name: string) => {
    if (!confirm(`Are you sure you want to delete the model "${name}"?`)) {
      return
    }

    try {
      const response = await fetch(`/api/models?id=${id}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        setModels(models.filter(model => model.id !== id))
      } else {
        const error = await response.json()
        alert(`Error deleting model: ${error.error}`)
      }
    } catch (error) {
      console.error('Error deleting model:', error)
      alert('Error deleting model')
    }
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold">Model Management</h1>
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
      </div>
    </div>
  )
}