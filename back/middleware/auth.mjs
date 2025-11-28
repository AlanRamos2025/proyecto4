import jwt from 'jsonwebtoken'
import dotenv from 'dotenv'

dotenv.config()

const SECRET = process.env.JWT_SECRET || 'changeme'

export const verifyToken = (req, res, next) => {
  const auth = req.headers.authorization

  if (!auth) {
    return res.json({ error: true, msg: 'No se proporcionó token de autenticación' })
  }

  const parts = auth.split(' ')
  if (parts.length !== 2) {
    return res.json({ error: true, msg: 'Formato de token incorrecto' })
  }

  const [scheme, token] = parts
  if (!/^Bearer$/i.test(scheme)) {
    return res.json({ error: true, msg: 'Token malformado' })
  }

  try {
    const payload = jwt.verify(token, SECRET)
    req.user = payload
    next()
  } catch (err) {
    return res.json({ error: true, msg: 'Token inválido o expirado' })
  }
}

export const requireRole = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.json({ error: true, msg: 'No autenticado' })
    }

    // Si el token no trae role, denegar
    const userRole = req.user.role
    if (!userRole || !roles.includes(userRole)) {
      return res.json({ error: true, msg: 'No tiene permisos para realizar esta acción' })
    }

    next()
  }
}
export const verifyTokenSilently = (req) => {
  try {
    const auth = req.headers.authorization
    if (!auth) return null

    const parts = auth.split(' ')
    if (parts.length !== 2) return null

    const [, token] = parts
    const payload = jwt.verify(token, SECRET)
    return payload
  } catch (err) {
    return null
  }
}
