"use client"

import { useState, useEffect, createContext, useContext, type ReactNode } from "react"
import { type User, authService } from "@/lib/auth"

interface AuthContextType {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>
  register: (name: string, email: string, password: string) => Promise<{ success: boolean; error?: string }>
  logout: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const storedUser = authService.getUser()
    setUser(storedUser)
    setIsLoading(false)
  }, [])

  const login = async (email: string, password: string) => {
    setIsLoading(true)
    const result = await authService.login(email, password)
    if (result.success && result.user) {
      setUser(result.user)
    }
    setIsLoading(false)
    return { success: result.success, error: result.error }
  }

  const register = async (name: string, email: string, password: string) => {
    setIsLoading(true)
    const result = await authService.register(name, email, password)
    if (result.success && result.user) {
      setUser(result.user)
    }
    setIsLoading(false)
    return { success: result.success, error: result.error }
  }

  const logout = () => {
    authService.logout()
    setUser(null)
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        register,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
