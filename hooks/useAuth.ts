import { useState, useEffect } from 'react'
import { getCookie, setCookie, removeCookie } from '@/lib/cookie-utils'

interface User {
  id: number
  username: string
  role: string
  verified: boolean
}

export function useAuth() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const token = getCookie('authToken')
        
        if (!token) {
          setIsAuthenticated(false)
          setUser(null)
          setLoading(false)
          return
        }

        const res = await fetch('/api/auth', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })

        if (res.ok) {
          const data = await res.json()
          setIsAuthenticated(true)
          setUser(data.user)
        } else {
          setIsAuthenticated(false)
          setUser(null)
          // Remove invalid token
          removeCookie('authToken')
        }
      } catch (error) {
        setIsAuthenticated(false)
        setUser(null)
      } finally {
        setLoading(false)
      }
    }

    checkAuth()
  }, [])

  const login = async (username: string, password: string) => {
    try {
      const response = await fetch('/api/auth/signin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      })

      const data = await response.json()

      if (response.ok) {
        // Store token in cookies
        setCookie('authToken', data.token, 1) // 1 day
        setIsAuthenticated(true)
        setUser(data.user)
        return { success: true }
      } else {
        return { success: false, error: data.error }
      }
    } catch (error) {
      return { success: false, error: 'An unexpected error occurred' }
    }
  }

  const logout = async () => {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
      })
    } catch (error) {
      // Silently handle logout errors
    } finally {
      // Remove token from cookies
      removeCookie('authToken')
      setIsAuthenticated(false)
      setUser(null)
    }
  }

  return { isAuthenticated, user, loading, login, logout }
}