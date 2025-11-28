import { useState } from 'react'
import { Form } from './Form'
import { Input } from './Input'
import { Button } from './Button'
import { toast } from 'react-toastify'
import { useStore } from '../store/useStore'
import { useNavigate } from 'react-router-dom'

const EmployeeForm = () => {
  const { user } = useStore()
  const navigate = useNavigate()

  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)

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

    try {
      const url = `${import.meta.env.VITE_API_URL}/api/auth/users/employee`
      const body = { fullName, email, password, confirmPassword }

      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user.token}`
        },
        body: JSON.stringify(body)
      })

      const data = await res.json()

      if (!res.ok) {
        toast.error(data.msg || 'Error al crear empleado')
        setLoading(false)
        return
      }

      toast.success('Empleado creado correctamente')
      navigate('/private/productos')
    } catch (err) {
      console.error(err)
      toast.error('Error al conectar con el servidor')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Form title="Crear Empleado" onSubmit={handleSubmit}>
      <Input name="Fullname" type="text" id="fullname" title="Nombre completo" placeholder="Nombre Apellido" value={fullName} onChange={(e) => setFullName(e.target.value)} />
      <Input name="email" type="email" id="email" title="Correo" placeholder="empleado@ejemplo.com" value={email} onChange={(e) => setEmail(e.target.value)} />
      <Input name="password" type="password" id="password" title="Contraseña" placeholder="********" value={password} onChange={(e) => setPassword(e.target.value)} />
      <Input name="confirmPassword" type="password" id="confirmPassword" title="Confirmar contraseña" placeholder="********" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
      <Button type="submit" value={loading ? 'Creando...' : 'Crear Empleado'} disabled={loading} />
    </Form>
  )
}

export default EmployeeForm
