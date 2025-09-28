"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import { 
  BookOpen, 
  Users, 
  ImageIcon, 
  History, 
  Settings 
} from "lucide-react"
import { useAuth } from "@/hooks/useAuth"
import { useEffect, useState } from "react"

const navigationItems = [
  { name: "Story", href: "/story", icon: BookOpen },
  { name: "History", href: "/history", icon: History },
]

export function Navigation() {
  const pathname = usePathname()
  const { user, logout } = useAuth()
  const [isAdmin, setIsAdmin] = useState(false)

  useEffect(() => {
    if (user) {
      setIsAdmin(user.role === 'root' || user.role === 'admin')
    }
  }, [user])

  const handleLogout = () => {
    logout()
  }

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 border-b border-border/50 bg-background/95 backdrop-blur">
      <div className="container flex items-center justify-between h-16 px-4">
        <div className="flex items-center gap-8">
          <Link href="/story" className="flex items-center gap-2 font-bold text-xl">
            <ImageIcon className="w-6 h-6 text-primary" />
            <span>StoryVisualizer</span>
          </Link>
          
          <div className="hidden md:flex items-center gap-1">
            {navigationItems.map((item) => {
              const Icon = item.icon
              const isActive = pathname === item.href
              
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
            })}
            
            {isAdmin && (
              <Link href="/admin">
                <Button
                  variant={pathname === "/admin" ? "secondary" : "ghost"}
                  className="flex items-center gap-2"
                >
                  <Settings className="w-4 h-4" />
                  Admin
                </Button>
              </Link>
            )}
          </div>
        </div>
        
        {user && (
          <div className="flex items-center gap-2">
            <span className="text-sm hidden sm:inline">Welcome, {user.username}</span>
            <Button variant="outline" size="sm" onClick={handleLogout}>
              Logout
            </Button>
          </div>
        )}
      </div>
    </nav>
  )
}