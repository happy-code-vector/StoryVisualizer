import { NextResponse } from 'next/server'
import { getModelsByType, getModelByName, addModel, deleteModelById, getAllModels } from '@/lib/supabase-service'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type') as 'character' | 'scene' | null
    
    if (type) {
      const models = await getModelsByType(type)
      if (!models) {
        return NextResponse.json({ error: 'Failed to fetch models' }, { status: 500 })
      }
      return NextResponse.json({ models })
    } else {
      // Return all models if no type specified
      const allModels = await getAllModels()
      if (!allModels) {
        return NextResponse.json({ error: 'Failed to fetch models' }, { status: 500 })
      }
      return NextResponse.json(allModels)
    }
  } catch (error: any) {
    console.error('Error fetching models:', error)
    return NextResponse.json({ error: error.message || 'Failed to fetch models' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    let { name, type, link, isDefault } = body
    
    // Validate required fields
    if (!name || !type || !link) {
      return NextResponse.json({ error: 'Name, type, and link are required' }, { status: 400 })
    }
    
    // Validate type
    if (type !== 'character' && type !== 'scene') {
      return NextResponse.json({ error: 'Type must be either "character" or "scene"' }, { status: 400 })
    }
    
    // Add the new model
    const newModel = await addModel(name, type, link, isDefault)
    
    if (newModel) {
      return NextResponse.json({ model: newModel }, { status: 201 })
    } else {
      return NextResponse.json({ error: 'Failed to create model' }, { status: 500 })
    }
  } catch (error: any) {
    console.error('Error creating model:', error)
    return NextResponse.json({ error: error.message || 'Failed to create model' }, { status: 500 })
  }
}

// Handle fetching a specific model by name
export async function PUT(request: Request) {
  try {
    const body = await request.json()
    const { name } = body
    
    if (!name) {
      return NextResponse.json({ error: 'Model name is required' }, { status: 400 })
    }
    
    const model = await getModelByName(name)
    if (!model) {
      return NextResponse.json({ error: 'Model not found' }, { status: 404 })
    }
    
    return NextResponse.json({ model })
  } catch (error: any) {
    console.error('Error fetching model:', error)
    return NextResponse.json({ error: error.message || 'Failed to fetch model' }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    
    if (!id) {
      return NextResponse.json({ error: 'Model ID is required' }, { status: 400 })
    }
    
    const deleted = await deleteModelById(parseInt(id))
    
    if (deleted) {
      return NextResponse.json({ message: 'Model deleted successfully' })
    } else {
      return NextResponse.json({ error: 'Failed to delete model' }, { status: 500 })
    }
  } catch (error: any) {
    console.error('Error deleting model:', error)
    return NextResponse.json({ error: error.message || 'Failed to delete model' }, { status: 500 })
  }
}