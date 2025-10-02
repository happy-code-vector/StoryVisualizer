"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import { 
  BookOpen, 
  Users, 
  ImageIcon, 
  History, 
  Settings,
  Image
} from "lucide-react"
import { useAuth } from "@/contexts/AuthContext"

const navigationItems = [
  { name: "Home", href: "/home", icon: BookOpen },
  { name: "Story", href: "/story", icon: BookOpen },
  { name: "Gallery", href: "/gallery", icon: Image },
]

export function Navigation() {
  const pathname = usePathname()
  const { user, isAuthenticated, logout } = useAuth()

  const handleLogout = () => {
    logout()
  }

  // Determine if user is admin (must be authenticated, verified, and have admin role)
  const isAdmin = isAuthenticated && user && user.verified && (user.role === 'root' || user.role === 'admin')

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 border-b border-border/50 bg-background/95 backdrop-blur">
      <div className="container flex items-center justify-between h-16 px-4">
        <div className="flex items-center gap-8">
          <Link href="/home" className="flex items-center gap-2 font-bold text-xl">
            <ImageIcon className="w-6 h-6 text-primary" />
            <span>StoryVisualizer</span>
          </Link>
          
          <div className="hidden md:flex items-center gap-1">
            {navigationItems.map((item) => {
              const Icon = item.icon
              const isActive = pathname === item.href
              
              // Show Home for everyone, other items only for authenticated users
              if (item.href === '/home' || isAuthenticated) {
                return (
                  <Link key={item.href} href={item.href}>
                    <Button
                      variant={isActive ? "secondary" : "ghost"}
                      className="flex items-center gap-2"
                    >
                      <Icon className="w-4 h-4" />
                      {item.name}
                    </Button>
                  </Link>
                )
              }
              return null
            })}
            
            {isAdmin && (
              <Link href="/admin">
                <Button
                  variant={pathname === "/admin" || pathname === "/history" ? "secondary" : "ghost"}
                  className="flex items-center gap-2"
                >
                  <Settings className="w-4 h-4" />
                  Admin
                </Button>
              </Link>
            )}
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {isAuthenticated && user ? (
            <>
              <span className="text-sm hidden sm:inline">Welcome, {user.username}</span>
              {pathname === '/home' && (
                <Link href="/story">
                  <Button size="sm">Go to App</Button>
                </Link>
              )}
              <Button variant="outline" size="sm" onClick={handleLogout}>
                Logout
              </Button>
            </>
          ) : (
            pathname === '/home' && (
              <>
                <Link href="/login">
                  <Button variant="outline" size="sm">Sign In</Button>
                </Link>
                <Link href="/login">
                  <Button size="sm">Get Started</Button>
                </Link>
              </>
            )
          )}
        </div>
      </div>
    </nav>
  )
}