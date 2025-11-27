import jwt from 'jsonwebtoken'
import dotenv from 'dotenv'

dotenv.config()

const SECRET = process.env.JWT_SECRET || 'changeme'

export const verifyToken = (req, res, next) => {
  const auth = req.headers.authorization

  if (!auth) {
    return res.status(401).json({ message: 'No se proporcionó token de autenticación' })
  }

  const parts = auth.split(' ')
  if (parts.length !== 2) {
    return res.status(401).json({ message: 'Formato de token incorrecto' })
  }

  const [scheme, token] = parts
  if (!/^Bearer$/i.test(scheme)) {
    return res.status(401).json({ message: 'Token malformado' })
  }

  try {
    const payload = jwt.verify(token, SECRET)
    req.user = payload
    next()
  } catch (err) {
    return res.status(401).json({ message: 'Token inválido o expirado' })
  }
}

export const requireRole = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: 'No autenticado' })
    }

    // Si el token no trae role, denegar
    const userRole = req.user.role
    if (!userRole || !roles.includes(userRole)) {
      return res.status(403).json({ message: 'No tiene permisos para realizar esta acción' })
    }

    next()
  }
}