import express from 'express'
import { Product } from '../models/Product.mjs'
import { verifyToken, requireRole } from '../middleware/auth.mjs'
import { sequelize } from '../config/db.mjs'
import multer from 'multer'
import fs from 'fs'
import path from 'path'
import { v4 as uuidv4 } from 'uuid'

// Directory to store images (project root / product_imagenes)
const IMAGES_DIR = path.resolve(process.cwd(), 'product_imagenes')

// Ensure directory exists
if (!fs.existsSync(IMAGES_DIR)) {
  fs.mkdirSync(IMAGES_DIR, { recursive: true })
}

// Multer in-memory storage
const storage = multer.memoryStorage()
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    if (!file.mimetype.startsWith('image/')) {
      return cb(new Error('Solo se permiten imágenes'))
    }
    cb(null, true)
  }
})

export const productRoutes = express.Router()

// GET - Obtener todos los productos (PÚBLICO - sin login)
productRoutes.get('/', async (req, res) => {
  try {
    const products = await Product.findAll()
    return res.json({
      error: false,
      data: products
    })
  } catch (err) {
    console.error(err)
    return res.status(500).json({
      error: true,
      msg: 'No se pudieron cargar los productos'
    })
  }
})

// GET - Obtener un producto por ID (PÚBLICO)
productRoutes.get('/:id', async (req, res) => {
  try {
    const product = await Product.findByPk(req.params.id)
    
    if (!product) {
      return res.status(404).json({
        error: true,
        msg: 'Producto no encontrado'
      })
    }

    return res.json({
      error: false,
      product
    })
  } catch (err) {
    console.error(err)
    return res.status(500).json({
      error: true,
      msg: 'Hubo un error en el servidor'
    })
  }
})

// POST - Crear producto (PROTEGIDO - requiere login)
productRoutes.post('/', verifyToken, requireRole('admin', 'employee'), upload.single('image'), async (req, res) => {
  const t = await sequelize.transaction()
  try {
    const { name, price, stock } = req.body

    if (!name || price == null || stock == null) {
      await t.rollback()
      return res.status(400).json({ error: true, msg: 'Todos los campos son obligatorios' })
    }

    if (!req.file) {
      await t.rollback()
      return res.status(400).json({ error: true, msg: 'Debe incluir una imagen para el producto' })
    }

    // Verificar si ya existe un producto con el mismo nombre
    const existingProduct = await Product.findOne({ where: { name }, transaction: t })
    if (existingProduct) {
      await t.rollback()
      return res.status(409).json({ error: true, msg: 'Ya existe un producto con ese nombre' })
    }

    // Verificar si la imagen ya existe comparando contenido binario
    const files = fs.readdirSync(IMAGES_DIR)
    for (const f of files) {
      const filePath = path.join(IMAGES_DIR, f)
      try {
        const existingFileBuffer = fs.readFileSync(filePath)
        if (req.file.buffer.equals(existingFileBuffer)) {
          await t.rollback()
          return res.status(409).json({ error: true, msg: 'La misma imagen ya existe en el servidor', filename: f })
        }
      } catch (err) {
        console.warn('No se pudo leer archivo para comparar:', f)
      }
    }

    // Guardar imagen
    const ext = path.extname(req.file.originalname) || '.jpg'
    const filename = `${uuidv4()}${ext}`
    const outPath = path.join(IMAGES_DIR, filename)
    fs.writeFileSync(outPath, req.file.buffer)

    // Crear producto con imagen
    const product = await Product.create({
      name,
      price: Number(price),
      stock: Number(stock),
      image: filename
    }, { transaction: t })

    await t.commit()
    return res.status(201).json({ error: false, msg: 'Producto creado exitosamente', product })
  } catch (err) {
    await t.rollback()
    console.error(err)
    return res.status(500).json({ error: true, msg: err.message })
  }
})

// PUT - Actualizar producto (PROTEGIDO - requiere login)
productRoutes.put('/:id', verifyToken, requireRole('admin', 'employee'), upload.single('image'), async (req, res) => {
  const t = await sequelize.transaction()
  try {
    const product = await Product.findByPk(req.params.id, { transaction: t })

    if (!product) {
      await t.rollback()
      return res.status(404).json({ error: true, msg: 'No se puede actualizar, el producto no existe' })
    }

    const { name, price, stock } = req.body

    // Si se está actualizando el nombre, verificar que no exista otro producto con ese nombre
    if (name && name !== product.name) {
      const existingProduct = await Product.findOne({ where: { name }, transaction: t })
      if (existingProduct) {
        await t.rollback()
        return res.status(409).json({ error: true, msg: 'Ya existe un producto con ese nombre' })
      }
    }

    // Manejo opcional de imagen en la misma petición
    if (req.file) {
      // Verificar si la imagen ya existe comparando contenido binario
      const files = fs.readdirSync(IMAGES_DIR)
      let imageExists = false
      let existingFilename = null

      for (const f of files) {
        const filePath = path.join(IMAGES_DIR, f)
        try {
          const existingFileBuffer = fs.readFileSync(filePath)
          if (req.file.buffer.equals(existingFileBuffer)) {
            // Si la imagen coincidente pertenece al mismo producto, permitir
            if (product.image && f === product.image) {
              // Misma imagen, no hay que cambiar nada
              imageExists = false
              break
            }
            imageExists = true
            existingFilename = f
            break
          }
        } catch (err) {
          console.warn('No se pudo leer archivo para comparar:', f)
        }
      }

      if (imageExists) {
        await t.rollback()
        return res.status(409).json({ error: true, msg: 'La misma imagen ya existe en el servidor', filename: existingFilename })
      }

      // Guardar nueva imagen
      const ext = path.extname(req.file.originalname) || '.jpg'
      const filename = `${uuidv4()}${ext}`
      const outPath = path.join(IMAGES_DIR, filename)
      fs.writeFileSync(outPath, req.file.buffer)

      // Borrar imagen anterior si existía y es distinta
      if (product.image && product.image !== filename) {
        const oldPath = path.join(IMAGES_DIR, product.image)
        try {
          if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath)
        } catch (err) {
          console.warn('No se pudo borrar la imagen antigua:', oldPath, err)
        }
      }

      product.image = filename
    }

    // Actualizar campos
    product.name = name ?? product.name
    product.price = price ?? product.price
    product.stock = stock ?? product.stock

    await product.save({ transaction: t })

    await t.commit()
    return res.json({ error: false, msg: 'Producto actualizado exitosamente', product })
  } catch (err) {
    await t.rollback()
    console.error(err)
    return res.status(500).json({ error: true, msg: 'Ocurrió un error al actualizar' })
  }
})

// DELETE - Eliminar producto (PROTEGIDO - requiere login)
productRoutes.delete('/:id', verifyToken, requireRole('admin', 'employee'), async (req, res) => {
  try {
    const product = await Product.findByPk(req.params.id)
    
    if (!product) {
      return res.status(404).json({
        error: true,
        msg: 'Producto no encontrado'
      })
    }
    
    await product.destroy()

    return res.json({
      error: false,
      msg: 'Producto eliminado exitosamente'
    })
  } catch (err) {
    console.error(err)
    return res.status(500).json({
      error: true,
      msg: 'Ocurrió un error al eliminar'
    })
  }
})

// POST - Checkout: disminuir stock según items en carrito (PROTEGIDO - requiere login)
productRoutes.post('/checkout', verifyToken, async (req, res) => {
  const items = req.body.items

  if (!items || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: true, msg: 'Carrito vacío' })
  }

  const t = await sequelize.transaction()
  try {
    // Obtener productos implicados
    const ids = items.map(i => i.id)
    const products = await Product.findAll({ where: { id: ids }, transaction: t })

    // Mapear productos por id
    const prodMap = new Map()
    products.forEach(p => prodMap.set(p.id, p))

    // Verificar stock
    for (const it of items) {
      const p = prodMap.get(it.id)
      if (!p) {
        await t.rollback()
        return res.status(404).json({ error: true, msg: `Producto con id ${it.id} no encontrado` })
      }
      const qty = Number(it.quantity) || 0
      if (qty <= 0) {
        await t.rollback()
        return res.status(400).json({ error: true, msg: `Cantidad inválida para producto ${p.name}` })
      }
      if (p.stock < qty) {
        await t.rollback()
        return res.status(400).json({ error: true, msg: `Stock insuficiente para ${p.name}` })
      }
    }

    // Restar stock
    for (const it of items) {
      const p = prodMap.get(it.id)
      const qty = Number(it.quantity)
      p.stock = p.stock - qty
      await p.save({ transaction: t })
    }

    await t.commit()

    // Generar CSV de ticket: cantidad, nombre, precio_unitario, subtotal
    try {
      const rows = []
      rows.push(['cantidad', 'nombre', 'precio_unitario', 'subtotal'])
      let total = 0
      for (const it of items) {
        const p = prodMap.get(it.id)
        const qty = Number(it.quantity)
        const unit = Number(p.price)
        const subtotal = unit * qty
        total += subtotal
        rows.push([String(qty), p.name.replace(/"/g, '""'), unit.toFixed(2), subtotal.toFixed(2)])
      }
      rows.push(['', 'TOTAL', '', total.toFixed(2)])

      // Construir CSV como texto, escapando comillas si es necesario
      const csvLines = rows.map(r => r.map(field => {
        // Si el campo contiene comas o comillas, encerrar en comillas
        const needsQuotes = /[,\"]/g.test(field)
        if (needsQuotes) return `"${String(field).replace(/"/g, '""')}"`
        return String(field)
      }).join(','))

      const csvContent = csvLines.join('\r\n')
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
      const filename = `ticket-${timestamp}.csv`

      res.setHeader('Content-Type', 'text/csv; charset=utf-8')
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`)
      return res.send(csvContent)
    } catch (csvErr) {
      console.error('Error generando CSV:', csvErr)
      return res.json({ error: false, msg: 'Compra realizada con éxito' })
    }
  } catch (err) {
    await t.rollback()
    console.error(err)
    return res.status(500).json({ error: true, msg: 'Error al procesar compra' })
  }
})