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

const navigationItems = [
  { name: "Story", href: "/story", icon: BookOpen },
  { name: "History", href: "/history", icon: History },
  { name: "Admin", href: "/admin", icon: Settings },
]

export function Navigation() {
  const pathname = usePathname()

  return (
    <nav className="border-b border-border/50 bg-background/95 backdrop-blur">
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
          </div>
        </div>
      </div>
    </nav>
  )
}