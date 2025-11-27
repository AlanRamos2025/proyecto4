import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Public from './componentes/Public'
import Private from './componentes/Private'
import Login from './componentes/Login'
import Register from './componentes/Register'
import Listproducts from './componentes/Listproducts'
import Formproducts from './componentes/Formproducts'
import EmployeeForm from './componentes/EmployeeForm'
import Cart from './componentes/Cart'
import { ToastContainer } from "react-toastify"
import "react-toastify/dist/ReactToastify.css"

const App = () => {
  return (
    <BrowserRouter>
      <Routes>
        {/* Rutas públicas (sin autenticación requerida) */}
        <Route path="/" element={<Public />}>
          <Route index element={<Listproducts />} />
          <Route path="register" element={<Register />} />
          <Route path="login" element={<Login />} />
        </Route>

 
        <Route path="/private" element={<Private />}>
 
          {/* Rutas protegidas (requieren autenticación) */}
          <Route path="productos" element={<Listproducts />} />
          <Route path="productos/nuevo" element={<Formproducts />} />
          <Route path="productos/editar/:id" element={<Formproducts />} />
          <Route path="empleados/nuevo" element={<EmployeeForm />} />
          <Route path="cart" element={<Cart />} />
        </Route>

        {/* Página 404 - No encontrado */}
        <Route path="*" element={
          <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-black flex items-center justify-center">
            <h1 className="text-white text-4xl font-bold">404 - Página no encontrada</h1>
          </div>
        } />
      </Routes>
      <ToastContainer 
        position="top-right"
        autoClose={3000}
        theme="dark"
      />
    </BrowserRouter>
  )
}

export default App