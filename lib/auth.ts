export interface User {
  id: string
  email: string
  name: string
  role: "student" | "admin"
  createdAt: string
}

export interface AuthState {
  user: User | null
  isAuthenticated: boolean
}

class AuthService {
  private storageKey = "medical-app-auth"

  getUser(): User | null {
    if (typeof window === "undefined") return null

    const stored = localStorage.getItem(this.storageKey)
    if (!stored) return null

    try {
      return JSON.parse(stored)
    } catch {
      return null
    }
  }

  setUser(user: User): void {
    if (typeof window === "undefined") return
    localStorage.setItem(this.storageKey, JSON.stringify(user))
  }

  removeUser(): void {
    if (typeof window === "undefined") return
    localStorage.removeItem(this.storageKey)
  }

  async login(email: string, password: string): Promise<{ success: boolean; user?: User; error?: string }> {
    // Simulate API call delay
    await new Promise((resolve) => setTimeout(resolve, 1000))

    // Get stored users
    const users = this.getStoredUsers()
    const user = users.find((u) => u.email === email)

    if (!user) {
      return { success: false, error: "User not found" }
    }

    // In a real app, you'd verify the password hash
    // For demo purposes, we'll accept any password
    this.setUser(user)
    return { success: true, user }
  }

  async register(
    name: string,
    email: string,
    password: string,
  ): Promise<{ success: boolean; user?: User; error?: string }> {
    // Simulate API call delay
    await new Promise((resolve) => setTimeout(resolve, 1000))

    const users = this.getStoredUsers()

    if (users.find((u) => u.email === email)) {
      return { success: false, error: "User already exists" }
    }

    const newUser: User = {
      id: crypto.randomUUID(),
      email,
      name,
      role: "student",
      createdAt: new Date().toISOString(),
    }

    users.push(newUser)
    this.setStoredUsers(users)
    this.setUser(newUser)

    return { success: true, user: newUser }
  }

  logout(): void {
    this.removeUser()
  }

  private getStoredUsers(): User[] {
    if (typeof window === "undefined") return []

    const stored = localStorage.getItem("medical-app-users")
    if (!stored) return []

    try {
      return JSON.parse(stored)
    } catch {
      return []
    }
  }

  private setStoredUsers(users: User[]): void {
    if (typeof window === "undefined") return
    localStorage.setItem("medical-app-users", JSON.stringify(users))
  }
}

export const authService = new AuthService()
