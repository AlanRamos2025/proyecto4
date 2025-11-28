import express from "express"
import dotenv from 'dotenv'
import cors from "cors"
import { sequelize } from './config/db.mjs'
import { userRoutes } from "./routes/user.mjs"
import { productRoutes } from "./routes/product.mjs"
import { cartRoutes } from "./routes/cart.mjs"
// Servir imágenes de productos desde la carpeta product_imagenes
import path from 'path'
import fs from 'fs'

const PORT = process.env.PORT ?? 3000
const app = express()

dotenv.config()

// Configuración CORS: permitir el frontend en desarrollo (5173 y 5174)
const allowedOrigins = [
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'http://localhost:5174',
  'http://127.0.0.1:5174'
]
// Si se define FRONT_URL en .env, añadirla también
if (process.env.FRONT_URL) allowedOrigins.push(process.env.FRONT_URL)

app.use(cors({
  origin: allowedOrigins,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true
}))
app.use(express.json())

const IMAGES_DIR = path.resolve(process.cwd(), 'product_imagenes')
// Asegurar que la carpeta exista
if (!fs.existsSync(IMAGES_DIR)) {
  try {
    fs.mkdirSync(IMAGES_DIR, { recursive: true })
    console.log('Carpeta product_imagenes creada en', IMAGES_DIR)
  } catch (err) {
    console.error('No se pudo crear la carpeta product_imagenes:', err.message)
  }
}

app.use('/images', express.static(IMAGES_DIR))

// Rutas de usuarios / autenticación
app.use("/api/auth", userRoutes)

// Rutas de productos
app.use("/api/products", productRoutes)
// Rutas de carrito
app.use('/api/cart', cartRoutes)

app.get('/', (req, res) => {
  res.json({ message: 'API backend funcionando. Rutas: /api/auth, /api/products' })
})

// Intentar sincronizar la BD pero no bloquear el servidor
app.listen(PORT, () => {
  console.log(`Servidor backend corriendo en http://localhost:${PORT}`)
  
  // Sincronizar BD de forma asíncrona sin bloquear el servidor
  sequelize.sync()
  .then(() => console.log('Base de datos sincronizada'))
  .catch((err) => console.error('Error sincronizando BD:', err.message))
})
