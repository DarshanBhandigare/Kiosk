import { createContext, useContext, useEffect, useState } from 'react'
import { firebaseAuth } from '../services/firebase'

export const AuthContext = createContext<{ user: any | null }>({ user: null })

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<any | null>(null)
  useEffect(() => {
    const unsub = firebaseAuth.onAuthStateChanged(async (u) => {
      if (u) {
        const token = await u.getIdToken()
        localStorage.setItem('medikiosk_token', token)
        localStorage.setItem('medikiosk_user', JSON.stringify({
          uid: u.uid,
          email: u.email,
          displayName: u.displayName,
        }))
        setUser({
          uid: u.uid,
          email: u.email,
          displayName: u.displayName,
        })
      } else {
        localStorage.removeItem('medikiosk_token')
        localStorage.removeItem('medikiosk_user')
        setUser(null)
      }
    })
    return () => unsub()
  }, [])
  return <AuthContext.Provider value={{ user }}>{children}</AuthContext.Provider>
}

export const useAuth = () => useContext(AuthContext)