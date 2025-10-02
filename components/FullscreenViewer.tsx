"use client"

import { useState, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { X, ChevronLeft, ChevronRight, Users, Play, Image as ImageIcon } from "lucide-react"

export interface ViewerItem {
  id: string
  type: 'character' | 'scene' | 'video'
  title: string
  imageUrl?: string
  videoUrl?: string
  description?: string
  metadata?: any
}

interface FullscreenViewerProps {
  isOpen: boolean
  onClose: () => void
  items: ViewerItem[]
  initialIndex: number
}

export default function FullscreenViewer({ isOpen, onClose, items, initialIndex }: FullscreenViewerProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex)

  useEffect(() => {
    setCurrentIndex(initialIndex)
  }, [initialIndex])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return
      
      switch (e.key) {
        case 'Escape':
          onClose()
          break
        case 'ArrowLeft':
          goToPrevious()
          break
        case 'ArrowRight':
          goToNext()
          break
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, currentIndex])

  const goToPrevious = () => {
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : items.length - 1))
  }

  const goToNext = () => {
    setCurrentIndex((prev) => (prev < items.length - 1 ? prev + 1 : 0))
  }

  if (!isOpen || items.length === 0) return null

  const currentItem = items[currentIndex]

  return (
    <div className="fixed inset-0 z-50 bg-black/95 backdrop-blur-sm">
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 z-10 bg-gradient-to-b from-black/50 to-transparent">
        <div className="flex items-center justify-between p-6">
          <div className="flex items-center gap-3">
            <Badge variant="secondary" className="bg-white/10 text-white">
              {currentItem.type === 'character' && <Users className="w-3 h-3 mr-1" />}
              {currentItem.type === 'scene' && <ImageIcon className="w-3 h-3 mr-1" />}
              {currentItem.type === 'video' && <Play className="w-3 h-3 mr-1" />}
              {currentItem.type.charAt(0).toUpperCase() + currentItem.type.slice(1)}
            </Badge>
            <h2 className="text-lg font-semibold text-white">{currentItem.title}</h2>
          </div>
          
          <div className="flex items-center gap-4">
            <span className="text-white/70 text-sm">
              {currentIndex + 1} of {items.length}
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="text-white hover:bg-white/20 h-8 w-8 p-0"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex items-center justify-center min-h-screen p-6 pt-20">
        <div className="relative max-w-7xl max-h-[80vh] w-full">
          {/* Navigation Buttons */}
          {items.length > 1 && (
            <>
              <Button
                variant="ghost"
                size="lg"
                onClick={goToPrevious}
                className="absolute left-4 top-1/2 -translate-y-1/2 z-10 bg-black/20 hover:bg-black/40 text-white rounded-full h-12 w-12 p-0"
              >
                <ChevronLeft className="w-6 h-6" />
              </Button>
              
              <Button
                variant="ghost"
                size="lg"
                onClick={goToNext}
                className="absolute right-4 top-1/2 -translate-y-1/2 z-10 bg-black/20 hover:bg-black/40 text-white rounded-full h-12 w-12 p-0"
              >
                <ChevronRight className="w-6 h-6" />
              </Button>
            </>
          )}

          {/* Media Display */}
          <div className="relative bg-black rounded-lg overflow-hidden shadow-2xl">
            {currentItem.type === 'video' && currentItem.videoUrl ? (
              <video
                src={currentItem.videoUrl}
                className="w-full h-auto max-h-[70vh] object-contain"
                controls
                autoPlay
                loop
                playsInline
              />
            ) : (
              <img
                src={currentItem.imageUrl || '/placeholder.svg'}
                alt={currentItem.title}
                className="w-full h-auto max-h-[70vh] object-contain"
              />
            )}
          </div>

          {/* Description */}
          {currentItem.description && (
            <div className="mt-4 bg-black/50 rounded-lg p-4">
              <p className="text-white/90 text-sm leading-relaxed">
                {currentItem.description}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Bottom Indicators */}
      {items.length > 1 && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2">
          <div className="flex items-center gap-2">
            {items.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentIndex(index)}
                className={`w-2 h-2 rounded-full transition-all ${
                  index === currentIndex 
                    ? 'bg-white' 
                    : 'bg-white/30 hover:bg-white/50'
                }`}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}