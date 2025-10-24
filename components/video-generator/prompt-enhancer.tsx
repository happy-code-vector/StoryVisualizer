'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Sparkles, Send, Loader2, User, Bot, Check } from 'lucide-react'

interface Message {
  role: 'user' | 'assistant'
  content: string
}

interface PromptEnhancerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  initialPrompt: string
  onApply: (enhancedPrompt: string) => void
  context?: any
}

export function PromptEnhancer({ open, onOpenChange, initialPrompt, onApply, context }: PromptEnhancerProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: `I'll help you enhance this prompt. You can ask me to:\n• Add more specific details\n• Change camera angles or movements\n• Adjust lighting or colors\n• Modify the mood or atmosphere\n• Ensure consistency with ${context?.timePeriod || 'the story'}\n\nWhat would you like to improve?`
    }
  ])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [currentPrompt, setCurrentPrompt] = useState(initialPrompt)

  const handleSend = async () => {
    if (!input.trim() || isLoading) return

    const userMessage = input.trim()
    setInput('')
    setMessages(prev => [...prev, { role: 'user', content: userMessage }])
    setIsLoading(true)

    try {
      const response = await fetch('/api/video-generator/enhance-prompt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentPrompt,
          userRequest: userMessage,
          context,
          conversationHistory: messages
        })
      })

      const data = await response.json()
      
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: data.explanation 
      }])
      setCurrentPrompt(data.enhancedPrompt)
    } catch (error) {
      console.error('Failed to enhance prompt:', error)
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: 'Sorry, I encountered an error. Please try again.' 
      }])
    } finally {
      setIsLoading(false)
    }
  }

  const handleApply = () => {
    onApply(currentPrompt)
    onOpenChange(false)
  }

  const handleReset = () => {
    setCurrentPrompt(initialPrompt)
    setMessages([{
      role: 'assistant',
      content: `Prompt reset to original. What would you like to change?`
    }])
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            AI Prompt Enhancer
          </DialogTitle>
          <DialogDescription>
            Chat with AI to refine and improve your video prompt
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 grid grid-cols-2 gap-4 min-h-0">
          {/* Chat Section */}
          <div className="flex flex-col border rounded-lg">
            <div className="p-3 border-b bg-muted/50">
              <h3 className="font-medium text-sm">Chat with AI</h3>
            </div>
            
            <ScrollArea className="flex-1 p-4">
              <div className="space-y-4">
                {messages.map((message, index) => (
                  <div
                    key={index}
                    className={`flex gap-3 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    {message.role === 'assistant' && (
                      <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <Bot className="h-4 w-4 text-primary" />
                      </div>
                    )}
                    <div
                      className={`rounded-lg px-4 py-2 max-w-[80%] ${
                        message.role === 'user'
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted'
                      }`}
                    >
                      <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                    </div>
                    {message.role === 'user' && (
                      <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                        <User className="h-4 w-4 text-primary-foreground" />
                      </div>
                    )}
                  </div>
                ))}
                {isLoading && (
                  <div className="flex gap-3 justify-start">
                    <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <Bot className="h-4 w-4 text-primary" />
                    </div>
                    <div className="rounded-lg px-4 py-2 bg-muted">
                      <Loader2 className="h-4 w-4 animate-spin" />
                    </div>
                  </div>
                )}
              </div>
            </ScrollArea>

            <div className="p-3 border-t">
              <div className="flex gap-2">
                <Textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault()
                      handleSend()
                    }
                  }}
                  placeholder="Ask AI to enhance the prompt..."
                  rows={2}
                  className="resize-none"
                />
                <Button
                  onClick={handleSend}
                  disabled={!input.trim() || isLoading}
                  size="icon"
                  className="h-auto"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>

          {/* Preview Section */}
          <div className="flex flex-col border rounded-lg">
            <div className="p-3 border-b bg-muted/50 flex items-center justify-between">
              <h3 className="font-medium text-sm">Enhanced Prompt</h3>
              <Button variant="ghost" size="sm" onClick={handleReset}>
                Reset
              </Button>
            </div>
            
            <ScrollArea className="flex-1 p-4">
              <div className="space-y-4">
                <div>
                  <div className="text-xs text-muted-foreground mb-2">Original:</div>
                  <div className="p-3 bg-muted/50 rounded text-sm">
                    {initialPrompt}
                  </div>
                </div>
                
                <div>
                  <div className="text-xs text-muted-foreground mb-2">Enhanced:</div>
                  <div className="p-3 bg-primary/5 border border-primary/20 rounded text-sm">
                    {currentPrompt}
                  </div>
                </div>

                {context && (
                  <div>
                    <div className="text-xs text-muted-foreground mb-2">Context:</div>
                    <div className="p-3 bg-muted/30 rounded text-xs space-y-1">
                      {context.timePeriod && <div>• Era: {context.timePeriod}</div>}
                      {context.location && <div>• Location: {context.location}</div>}
                    </div>
                  </div>
                )}
              </div>
            </ScrollArea>

            <div className="p-3 border-t">
              <Button onClick={handleApply} className="w-full" size="lg">
                <Check className="mr-2 h-4 w-4" />
                Apply Enhanced Prompt
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
