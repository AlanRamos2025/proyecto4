import { Router } from "express"
import { User } from '../models/User.mjs'
import bcrypt from "bcryptjs"
import jwt from 'jsonwebtoken'
import { verifyToken, requireRole } from '../middleware/auth.mjs'

export const userRoutes = Router()
userRoutes.get("/users", verifyToken, async (req, res) => {
  try {
    const users = await User.findAll({
      attributes: { exclude: ['hash', 'activateToken'] }
    })
    
    res.json({
      error: false,
      users
    })
  } catch (error) {
    res.status(500).json({
      error: true,
      msg: "Error al obtener usuarios"
    })
  }
})

userRoutes.post("/register", async (req, res) => {
  try {
    const { fullName, email, password, confirmPassword } = req.body
    const existing = await User.findOne({ where: { email } })
    if (existing) {
      return res.json({ error: true, msg: 'El email ya está en uso' })
    }
    
    if (password !== confirmPassword) {
      return res.status(403).json({
        error: true,
        msg: "Las contraseñas no coinciden"
      })
    }
    
    const salt = await bcrypt.genSalt(10)
    const hash = await bcrypt.hash(password, salt)
    const activateToken = "123"
    const usersCount = await User.count()
    const role = usersCount === 0 ? 'admin' : 'user'

    const user = new User({
      fullName,
      email,
      hash,
      activateToken,
      role
    })

    await user.save()
    const successMsg = role === 'admin' ? 'Admin creado exitosamente' : 'Usuario creado exitosamente'

    res.json({
      error: false,
      msg: successMsg
    })

  } catch (err) {
    res.status(400).json({
      error: true,
      msg: err.message
    })
  }
})

userRoutes.post('/users/employee', verifyToken, requireRole('admin'), async (req, res) => {
  try {
    const { fullName, email, password, confirmPassword } = req.body

    if (!fullName || !email || !password || !confirmPassword) {
      return res.status(400).json({ error: true, msg: 'Faltan campos obligatorios' })
    }

    if (password !== confirmPassword) {
      return res.status(403).json({ error: true, msg: 'Las contraseñas no coinciden' })
    }

    const existing = await User.findOne({ where: { email } })
    if (existing) {
      return res.status(409).json({ error: true, msg: 'El email ya está en uso' })
    }

    const salt = await bcrypt.genSalt(10)
    const hash = await bcrypt.hash(password, salt)

    const employee = new User({ fullName, email, hash, activateToken: '123', role: 'employee' })
    await employee.save()

    return res.json({ error: false, msg: 'Empleado cargado exitosamente', employee: { id: employee.id, fullName: employee.fullName, email: employee.email, role: employee.role } })
  } catch (err) {
    return res.status(500).json({ error: true, msg: err.message })
  }
})

userRoutes.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body

    const user = await User.findOne({
      where: { email }
    })

    if (!user) {
      return res.json({
        error: true,
        msg: "El usuario no existe"
      })
    }

    const checkPasswd = await bcrypt.compare(password, user.hash)

    if (!checkPasswd) {
      return res.json({
        error: true,
        msg: "Contraseña incorrecta"
      })
    }

    const payload = {
      email: email,
      id: user.id,
      role: user.role
    }

    const secret = process.env.JWT_SECRET || 'changeme'
    const token = jwt.sign(payload, secret)

    res.json({
      error: false,
      token,
      user: {
        fullName: user.fullName,
        email: user.email,
        role: user.role
      }
    })
    
  } catch (error) {
    res.status(500).json({
      error: true,
      msg: "Hubo un error al iniciar sesión"
    })
  }
})

userRoutes.get("/verify-token", verifyToken, (req, res) => {
  return res.json({ error: false, user: req.user })
})
