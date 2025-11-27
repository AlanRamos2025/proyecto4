import { Link, useNavigate } from 'react-router-dom'
import { useStore } from '../store/useStore'
import { LogOut, User, LogIn, Package } from 'lucide-react'

const Nav = () => {
  const { user, setUser } = useStore()
  const navigate = useNavigate()

  const handleLogout = () => {
    // Marcar que se está en proceso de logout para evitar redirecciones en Private.jsx
    localStorage.setItem('isLoggingOut', 'true')
    
    // Limpiar el estado del usuario en localStorage (Zustand persiste aquí)
    localStorage.removeItem('token_login_web')
    
    // Limpiar también el estado en memoria
    setUser({
      full_name: null,
      token: null,
      email: null,
      role: null
    })
    
    // Redirigir inmediatamente con window.location.assign
    // Esto causa una recarga completa de la página y evita que Private.jsx navegue a /login
    // porque ya no habrá token en localStorage
    const frontUrl = import.meta.env.VITE_FRONT_URL || 'http://localhost:5174/'
    window.location.assign(frontUrl)
  }

  return (
    <nav className="bg-white/10 backdrop-blur-xl border-b border-white/20 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo y nombre de la aplicación */}
          <Link 
            to="/" 
            className="flex items-center gap-2 text-white font-bold text-xl hover:text-purple-300 transition-colors"
          >
            <Package className="w-6 h-6" />
            Stock Manager
          </Link>

          {/* Botones de navegación y autenticación */}
          <div className="flex items-center gap-3">
            {user && user.token ? (
              <>
                {/* Bienvenida para usuario autenticado */}
                <div className="hidden sm:flex items-center gap-2 text-purple-200 text-sm">
                  <User className="w-4 h-4" />
                  <span>{user.full_name || user.email}</span>
                </div>
                
                <Link
                  to="/private/productos"
                  className="px-4 py-2 text-white hover:text-purple-300 transition-colors font-medium"
                >
                  Productos
                </Link>

                {user.role === 'admin' && (
                  <Link
                    to="/private/empleados/nuevo"
                    className="px-4 py-2 text-white hover:text-purple-300 transition-colors font-medium"
                  >
                    Crear Empleado
                  </Link>
                )}

                <Link
                  to="/private/cart"
                  className="px-4 py-2 text-white hover:text-purple-300 transition-colors font-medium"
                >
                  Carrito
                </Link>

                <button
                  onClick={handleLogout}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-all flex items-center gap-2 font-medium"
                >
                  <LogOut className="w-4 h-4" />
                  Salir
                </button>
              </>
            ) : (
              <>
                {/* Enlaces para usuario no autenticado */}
                <Link
                  to="/login"
                  className="px-4 py-2 text-white hover:text-purple-300 transition-colors font-medium flex items-center gap-2"
                >
                  <LogIn className="w-4 h-4" />
                  Iniciar Sesión
                </Link>

                <Link
                  to="/register"
                  className="px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:shadow-lg hover:shadow-purple-500/50 transition-all font-medium"
                >
                  Registrarse
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  )
}

export default Nav