"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { 
  BookOpen, 
  ImageIcon, 
  Sparkles, 
  Users, 
  ArrowRight,
  CheckCircle
} from "lucide-react"
import { useAuth } from "@/contexts/AuthContext"

export default function HomePage() {
  const { isAuthenticated, user } = useAuth()

  return (
    <div className="min-h-screen bg-background pt-16">{/* Add padding-top to account for fixed navigation */}

      {/* Hero Section */}
      <section className="py-20 px-4">
        <div className="container max-w-4xl mx-auto text-center">
          <div className="mb-8">
            <h1 className="text-4xl md:text-6xl font-bold mb-6 gradient-text">
              Transform Your Stories Into Visual Masterpieces
            </h1>
            <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              Bring your narratives to life with AI-powered character and scene generation. 
              Create stunning visual stories that captivate your audience.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href={isAuthenticated ? "/story" : "/login"}>
                <Button size="lg" className="text-lg px-8">
                  {isAuthenticated ? "Continue Creating" : "Start Creating"} <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
              </Link>
              {!isAuthenticated && (
                <Link href="/login">
                  <Button variant="outline" size="lg" className="text-lg px-8">
                    Sign In
                  </Button>
                </Link>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 px-4 bg-muted/30">
        <div className="container max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">
            Everything You Need to Visualize Stories
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            <Card>
              <CardHeader>
                <BookOpen className="w-12 h-12 text-primary mb-4" />
                <CardTitle>Story Analysis</CardTitle>
                <CardDescription>
                  Advanced AI analyzes your stories to extract characters, scenes, and key elements automatically.
                </CardDescription>
              </CardHeader>
            </Card>
            
            <Card>
              <CardHeader>
                <Users className="w-12 h-12 text-primary mb-4" />
                <CardTitle>Character Generation</CardTitle>
                <CardDescription>
                  Create stunning character images that match your story descriptions with state-of-the-art AI models.
                </CardDescription>
              </CardHeader>
            </Card>
            
            <Card>
              <CardHeader>
                <Sparkles className="w-12 h-12 text-primary mb-4" />
                <CardTitle>Scene Visualization</CardTitle>
                <CardDescription>
                  Transform scene descriptions into beautiful, atmospheric images that bring your world to life.
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-16 px-4">
        <div className="container max-w-4xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold mb-6">
                Why Choose StoryVisualizer?
              </h2>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-6 h-6 text-green-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold">AI-Powered Analysis</h3>
                    <p className="text-muted-foreground">Intelligent story parsing that understands context and relationships</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-6 h-6 text-green-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold">High-Quality Images</h3>
                    <p className="text-muted-foreground">Professional-grade visuals powered by cutting-edge AI models</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-6 h-6 text-green-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold">Easy to Use</h3>
                    <p className="text-muted-foreground">Simple interface that gets you from story to visuals in minutes</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-6 h-6 text-green-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold">Save & Organize</h3>
                    <p className="text-muted-foreground">Keep track of all your visual stories in one place</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="bg-gradient-to-br from-primary/10 to-secondary/10 rounded-lg p-8 text-center">
              <ImageIcon className="w-24 h-24 text-primary mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">Ready to Get Started?</h3>
              <p className="text-muted-foreground mb-6">
                Join thousands of creators who are already visualizing their stories
              </p>
              {!isAuthenticated && (
                <Link href="/login">
                  <Button size="lg">
                    Create Free Account
                  </Button>
                </Link>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/50 py-8 px-4">
        <div className="container max-w-4xl mx-auto text-center text-muted-foreground">
          <p>&copy; 2025 StoryVisualizer. Transform your stories into visual masterpieces.</p>
        </div>
      </footer>
    </div>
  )
}