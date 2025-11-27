import { createContext, useState, useContext, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

export const AuthContext = createContext()

export function AuthProvider({ children }) {
  const [token, setToken] = useState(localStorage.getItem('token'))
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [hasUsers, setHasUsers] = useState(true) // Controlar si hay usuarios registrados en el sistema
  const navigate = useNavigate()

  const login = (token, userData) => {
    // Guardar token en localStorage y actualizar estado
    localStorage.setItem('token', token)
    setToken(token)
    setUser(userData)
  }

  const logout = () => {
    // Limpiar sesión y redirigir a inicio
    localStorage.removeItem('token')
    setToken(null)
    setUser(null)
    // Redirigir a la URL del frontend (por si se llama desde otros lugares)
    const frontUrl = import.meta.env.VITE_FRONT_URL || 'http://localhost:5174/'
    window.location.assign(frontUrl)
  }

  useEffect(() => {
    const checkInitialState = async () => {
      try {
        // Verificar si existen usuarios registrados en el sistema
        const usersRes = await fetch('http://localhost:3000/api/auth/has-users')
        const { hasUsers: existingUsers } = await usersRes.json()
        setHasUsers(existingUsers)

        // Si no hay usuarios y no estamos registrando, redirigir al registro
        if (!existingUsers && window.location.pathname !== '/register') {
          navigate('/register')
        }

        // Si existe token, verificar que sea válido en el backend
        if (token) {
          const res = await fetch('http://localhost:3000/api/auth/me', {
            headers: { 'Authorization': `Bearer ${token}` }
          })
          if (res.ok) {
            const data = await res.json()
            setUser(data)
          } else {
            logout()
          }
        }
      } catch (err) {
        console.error('Error al verificar estado inicial:', err)
        if (token) logout()
      } finally {
        setLoading(false)
      }
    }

    checkInitialState()
  }, [token])

  return (
    <AuthContext.Provider value={{ token, user, login, logout, loading, hasUsers }}>
      {!loading && children}
    </AuthContext.Provider>
  )
}