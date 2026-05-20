import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'

interface UserContextType {
  email: string | null
  setEmail: (email: string) => void
  logout: () => void
}

const UserContext = createContext<UserContextType | null>(null)

export function UserProvider({ children }: { children: ReactNode }) {
  const [email, setEmailState] = useState<string | null>(
    () => localStorage.getItem('fs_email'),
  )
  const navigate = useNavigate()
  const location = useLocation()

  const setEmail = (e: string) => {
    localStorage.setItem('fs_email', e)
    setEmailState(e)
  }

  const logout = () => {
    localStorage.removeItem('fs_email')
    setEmailState(null)
    navigate('/login')
  }

  useEffect(() => {
    if (!email && location.pathname !== '/login') {
      navigate('/login')
    }
  }, [email, location.pathname, navigate])

  return (
    <UserContext.Provider value={{ email, setEmail, logout }}>
      {children}
    </UserContext.Provider>
  )
}

export function useUser() {
  const ctx = useContext(UserContext)
  if (!ctx) throw new Error('useUser must be inside UserProvider')
  return ctx
}
