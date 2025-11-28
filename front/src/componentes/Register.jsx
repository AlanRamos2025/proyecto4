import { useState } from 'react'
import { Form } from './Form'
import { Input } from './Input'
import { Button } from "./Button"
import { Link } from 'react-router-dom'
import { useNavigate } from 'react-router-dom'
import { toast } from "react-toastify"

const Legend = () => {
  return <p>¿Ya tienes cuenta? <Link to="/login" className='underline text-purple-600'>Inicia sesión</Link></p>
}


const Register = () => {
  const [fullName, setFullName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      if (!fullName || !email || !password || !confirmPassword) {
        toast.error('Complete todos los campos')
        setLoading(false)
        return
      }

      if (password !== confirmPassword) {
        toast.error('Las contraseñas no coinciden')
        setLoading(false)
        return
      }

      if (password.length < 6) {
        toast.error('La contraseña debe tener al menos 6 caracteres')
        setLoading(false)
        return
      }

      const url = `${import.meta.env.VITE_API_URL}/api/auth/register`
      const body = {
        fullName,
        email,
        password,
        confirmPassword
      }

      const req = await fetch(url, {
        method: "POST",
        headers: {
          "content-type": "application/json"
        },
        body: JSON.stringify(body)
      })

      const res = await req.json()

      if (!req.ok) {
        toast.error(res.message || 'Error en el registro')
        return
      }

      toast.success(res.message || 'Usuario creado')
      setFullName("")
      setEmail("")
      setPassword("")
      setConfirmPassword("")
      navigate('/login')

    } catch {
    }
    finally {
      setLoading(false)
    }
  }

  const navigate = useNavigate()



  return (
    <Form title="Registrarse" Legend={Legend} onSubmit={handleSubmit}>
      <Input
        name="Fullname"
        type="text"
        id="fullname"
        title="Nombre completo"
        placeholder="Tu Nombre"
        value={fullName}
        onChange={(e) => setFullName(e.target.value)}
      />
      <Input
        name="email"
        type="email"
        title="Correo"
        placeholder="tu@correo.com"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />
      <Input
        type="password"
        name="Password"
        title="Contrasena"
        placeholder="********"
        value={password}
        id="password"
        onChange={(e) => setPassword(e.target.value)}
      />
      <Input
        type="password"
        id="confirmPassword"
        name="confirmPassword"
        title="Confirmar Contrasena"
        placeholder="********"
        value={confirmPassword}
        onChange={(e) => setConfirmPassword(e.target.value)}
      />
      <Button type='submit' value={`${loading ? "Cargando..." : "Registrase"}`} />
    </Form>)
}


export default Register