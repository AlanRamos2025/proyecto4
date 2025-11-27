import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { useStore } from '../store/useStore'
import Nav from './Nav'

const Public = () => {
  const { user, setUser } = useStore()
  const navigate = useNavigate()
  const location = useLocation()
  const [isVerifying, setIsVerifying] = useState(true)

  useEffect(() => {
    async function verifyUser() {
      // Si estamos en rutas de autenticación, no verificar token
      if (location.pathname === '/login' || location.pathname === '/register') {
        setIsVerifying(false)
        return
      }

      if (!user?.token) {
        setUser({
          full_name: null,
          token: null,
          email: null,
          role: null
        })
        setIsVerifying(false)
        return
      }

      try {
        const url = `${import.meta.env.VITE_API_URL}/api/auth/verify-token`
        const config = {
          method: "GET",
          headers: {
            'content-type': "application/json",
            'authorization': `Bearer ${user.token}`
          }
        }

        const req = await fetch(url, config)

        if (!req.ok) {
          setUser({
            full_name: null,
            token: null,
            email: null,
            role: null
          })
          setIsVerifying(false)
          return
        }
        
        const res = await req.json()

        if (res.error) {
          setUser({
            full_name: null,
            token: null,
            email: null,
            role: null
          })
          setIsVerifying(false)
          return
        }
        // Token válido, actualizar datos del usuario si vienen en la respuesta
        if (res.user && res.user.fullName) {
          setUser((prevUser) => ({
            ...prevUser,
            full_name: res.user.fullName,
            role: res.user.role || prevUser.role
          }))
        }
        
        // Token válido, permitir acceso a la página pública
        setIsVerifying(false)
      } catch (error) {
        setUser({
          full_name: null,
          token: null,
          email: null,
          role: null
        })
        setIsVerifying(false)
      }
    }

    verifyUser()
  }, [user?.token, navigate, setUser, location.pathname])

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-black relative overflow-hidden">
      <div className="absolute top-20 left-10 w-72 h-72 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse"></div>
      <div className="absolute bottom-20 right-10 w-96 h-96 bg-indigo-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse" style={{ animationDelay: '1s' }}></div>
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-pink-500 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-pulse" style={{ animationDelay: '2s' }}></div>

      {/* Contenedor principal */}
      <div className="relative z-10 w-full">
        {/* Navegación */}
        <Nav />
        {/* Header con logo */}
        <div className="text-center pt-8 pb-6 space-y-2">
          <h1 className="text-5xl font-bold text-white tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-400">
            Stock Manager
          </h1>
          <p className="text-purple-300 text-sm font-medium">
            Sistema de Gestión de Productos
          </p>
        </div>

        {/* Contenido */}
        {isVerifying ? (
          <div className="flex items-center justify-center min-h-[60vh]">
            <div className="bg-white/10 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 p-12 text-center max-w-md mx-4">
              <div className="flex flex-col items-center space-y-4">
                <div className="relative">
                  <div className="w-16 h-16 border-4 border-purple-200/30 border-t-purple-500 rounded-full animate-spin"></div>
                  <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-10 h-10 border-4 border-pink-200/30 border-t-pink-500 rounded-full animate-spin" style={{ animationDirection: 'reverse', animationDuration: '1s' }}></div>
                </div>
                <div className="space-y-1">
                  <p className="text-white font-semibold text-lg">Verificando sesión</p>
                  <p className="text-purple-200 text-sm">Por favor espera un momento...</p>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="w-full">
            <Outlet />
          </div>
        )}
      </div>
    </div>
  )
}

export default Public