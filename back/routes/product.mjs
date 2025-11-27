import express from 'express'
import { Product } from '../models/Product.mjs'
import { verifyToken, requireRole } from '../middleware/auth.mjs'
import { sequelize } from '../config/db.mjs'
import multer from 'multer'
import fs from 'fs'
import path from 'path'
import { v4 as uuidv4 } from 'uuid'

const IMAGES_DIR = path.resolve(process.cwd(), 'product_imagenes')

if (!fs.existsSync(IMAGES_DIR)) {
  fs.mkdirSync(IMAGES_DIR, { recursive: true })
}
const storage = multer.memoryStorage()
const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    if (!file.mimetype.startsWith('image/')) {
      return cb(new Error('Solo se permiten imágenes'))
    }
    cb(null, true)
  }
})

export const productRoutes = express.Router()

function saveImage(buffer, originalName) {
  const ext = path.extname(originalName) || '.jpg'
  const filename = `${uuidv4()}${ext}`
  const outPath = path.join(IMAGES_DIR, filename)
  fs.writeFileSync(outPath, buffer)
  return filename
}

function deleteImageIfExists(filename) {
  if (!filename) return
  const p = path.join(IMAGES_DIR, filename)
  try {
    if (fs.existsSync(p)) fs.unlinkSync(p)
  } catch (err) {
    console.warn('No se pudo borrar la imagen antigua:', p, err)
  }
}

function buildTicketCSV(items, prodMap) {
  const rows = [['cantidad', 'nombre', 'precio_unitario', 'subtotal']]
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

  const csvLines = rows.map(r => r.map(field => {
    const needsQuotes = /[,"]/.test(field)
    if (needsQuotes) return `"${String(field).replace(/"/g, '""')}"`
    return String(field)
  }).join(','))

  const csvContent = csvLines.join('\r\n')
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
  const filename = `ticket-${timestamp}.csv`
  return { csvContent, filename }
}

//Obtener todos los productos
productRoutes.get('/', async (req, res) => {
  try {
    const products = await Product.findAll()
    return res.json({
      error: false,
      data: products
    })
  } catch (err) {
    console.error(err)
    return res.json({ error: true, msg: 'No se pudieron cargar los productos' })
  }
})

//Obtener un producto por ID
productRoutes.get('/:id', async (req, res) => {
  try {
    const product = await Product.findByPk(req.params.id)
    
    if (!product) {
      return res.json({ error: true, msg: 'Producto no encontrado' })
    }

    return res.json({
      error: false,
      product
    })
  } catch (err) {
    console.error(err)
    return res.json({ error: true, msg: 'Hubo un error en el servidor' })
  }
})

// Crear producto
productRoutes.post('/', verifyToken, requireRole('admin', 'employee'), upload.single('image'), async (req, res) => {
  const t = await sequelize.transaction()
  try {
    const { name, price, stock } = req.body

    if (!name || price == null || stock == null) {
      await t.rollback()
      return res.json({ error: true, msg: 'Todos los campos son obligatorios' })
    }

    if (!req.file) {
      await t.rollback()
      return res.json({ error: true, msg: 'Debe incluir una imagen para el producto' })
    }

    // Verificar si ya existe un producto con el mismo nombre
    const existingProduct = await Product.findOne({ where: { name }, transaction: t })
    if (existingProduct) {
      await t.rollback()
      return res.json({ error: true, msg: 'Ya existe un producto con ese nombre' })
    }

    // Verificar duplicado y guardar imagen
    const dup = findDuplicateImage(req.file.buffer)
    let filename
    if (dup) {
      filename = dup
    } else {
      filename = saveImage(req.file.buffer, req.file.originalname)
    }

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
    return res.json({ error: true, msg: err.message })
  }
})

// PUT - Actualizar producto (PROTEGIDO - requiere login)
productRoutes.put('/:id', verifyToken, requireRole('admin', 'employee'), upload.single('image'), async (req, res) => {
  const t = await sequelize.transaction()
  try {
    const product = await Product.findByPk(req.params.id, { transaction: t })

    if (!product) {
      await t.rollback()
      return res.json({ error: true, msg: 'No se puede actualizar, el producto no existe' })
    }

    const { name, price, stock } = req.body

    // Si se está actualizando el nombre, verificar que no exista otro producto con ese nombre
    if (name && name !== product.name) {
      const existingProduct = await Product.findOne({ where: { name }, transaction: t })
      if (existingProduct) {
        await t.rollback()
        return res.json({ error: true, msg: 'Ya existe un producto con ese nombre' })
      }
    }

    // Manejo opcional de imagen en la misma petición
    if (req.file) {
      const dup = findDuplicateImage(req.file.buffer)

      if (dup) {
        // Si hay una imagen idéntica ya en el servidor:
        // - si el producto ya la tenía, no hacer nada
        // - si el producto tenía otra imagen distinta, borrar la anterior y reutilizar la existente
        if (!product.image || product.image !== dup) {
          if (product.image && product.image !== dup) deleteImageIfExists(product.image)
          product.image = dup
        }
      } else {
        // No existe duplicado: guardar nueva imagen y borrar la anterior si aplica
        const newFilename = saveImage(req.file.buffer, req.file.originalname)
        if (product.image && product.image !== newFilename) deleteImageIfExists(product.image)
        product.image = newFilename
      }
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
    return res.json({ error: true, msg: 'Ocurrió un error al actualizar' })
  }
})

// Eliminar producto
productRoutes.delete('/:id', verifyToken, requireRole('admin', 'employee'), async (req, res) => {
  try {
    const product = await Product.findByPk(req.params.id)
    
    if (!product) {
      return res.json({ error: true, msg: 'Producto no encontrado' })
    }
    
    await product.destroy()

    return res.json({
      error: false,
      msg: 'Producto eliminado exitosamente'
    })
  } catch (err) {
    console.error(err)
    return res.json({ error: true, msg: 'Ocurrió un error al eliminar' })
  }
})