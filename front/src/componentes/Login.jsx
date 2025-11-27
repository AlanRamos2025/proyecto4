import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Form } from './Form'
import { Input } from "./Input"
import { Button } from "./Button"
import { toast } from 'react-toastify'
import { useStore } from '../store/useStore'

const Legend = () => {
  return <p className="text-black">No tiene cuenta? <Link to="/register" className="underline text-purple-600 hover:text-purple-300" >Registrate</Link></p>
}

const Login = () => {
  const { setUser } = useStore()
  const navigate = useNavigate()

  // Estados
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)

  // Funciones
  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {
      const body = {
        email,
        password
      }
      const url = `${import.meta.env.VITE_API_URL}/api/auth/login`
      const config = {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify(body)
      }

      const req = await fetch(url, config)
      const res = await req.json()

      if (!req.ok) {
        toast.error(res.message)
        return
      }

      // Guardar token (sin 'Bearer') y rol
      setUser({
        email,
        token: res.token,
        full_name: res.user?.fullName || email,
        role: res.user?.role || 'user'
      })
      toast.success("Sesión iniciada")
      // Redirigir a productos
      navigate('/private/productos')

    } catch (error) {
      toast.error("Error al iniciar sesión")
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Form title="Iniciar Sesión" Legend={Legend} onSubmit={handleSubmit}>
      <Input
        type="email"
        id="email"
        name="email"
        title="Email"
        placeholder="tu@email.com"
        value={email}
        onChange={(e) => { setEmail(e.target.value) }}
      />
      <Input
        type="password"
        id="password"
        name="password"
        placeholder="********"
        title="Contraseña"
        value={password}
        onChange={(e) => { setPassword(e.target.value) }}
      />
      <Button
        type='submit'
        value={loading ? "Iniciando..." : "Iniciar Sesión"}
        disabled={loading}
      />
    </Form>
  )
}

export default Login