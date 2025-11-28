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
  
  const imagePath = path.join(IMAGES_DIR, filename)
  try {
    if (fs.existsSync(imagePath)) {
      fs.unlinkSync(imagePath)
    }
  } catch (err) {
    console.warn('No se pudo borrar la imagen:', filename, err)
  }
}

function validateProductData(name, price, stock) {
  if (!name || price == null || stock == null) {
    return { valid: false, msg: 'Todos los campos son obligatorios' }
  }
  return { valid: true }
}
async function checkDuplicateName(name, excludeId = null, transaction) {
  const where = { name }

  if (excludeId) {
    where.id = { [sequelize.Sequelize.Op.ne]: excludeId }
  }
  
  const existing = await Product.findOne({ where, transaction })
  return existing !== null
}

productRoutes.get('/', async (req, res) => {
  try {
    const products = await Product.findAll()
    return res.json({
      error: false,
      data: products
    })
  } catch (err) {
    console.error('Error al cargar productos:', err)
    return res.json({ 
      error: true, 
      msg: 'No se pudieron cargar los productos' 
    })
  }
})

productRoutes.get('/:id', async (req, res) => {
  try {
    const product = await Product.findByPk(req.params.id)
    
    if (!product) {
      return res.json({ 
        error: true, 
        msg: 'Producto no encontrado' 
      })
    }

    return res.json({
      error: false,
      product
    })
  } catch (err) {
    console.error('Error al obtener producto:', err)
    return res.json({ 
      error: true, 
      msg: 'Hubo un error en el servidor' 
    })
  }
})

productRoutes.post(
  '/', 
  verifyToken, 
  requireRole('admin', 'employee'), 
  upload.single('image'), 
  async (req, res) => {
    const transaction = await sequelize.transaction()
    
    try {
      const { name, price, stock } = req.body

      const validation = validateProductData(name, price, stock)
      if (!validation.valid) {
        await transaction.rollback()
        return res.json({ error: true, msg: validation.msg })
      }

      if (!req.file) {
        await transaction.rollback()
        return res.json({ 
          error: true, 
          msg: 'Debe incluir una imagen para el producto' 
        })
      }

      const isDuplicate = await checkDuplicateName(name, null, transaction)
      if (isDuplicate) {
        await transaction.rollback()
        return res.json({ 
          error: true, 
          msg: 'Ya existe un producto con ese nombre' 
        })
      }

      const filename = saveImage(req.file.buffer, req.file.originalname)
      const product = await Product.create({
        name,
        price: Number(price),
        stock: Number(stock),
        image: filename
      }, { transaction })

      await transaction.commit()
      
      return res.status(201).json({ 
        error: false, 
        msg: 'Producto creado exitosamente', 
        product 
      })
      
    } catch (err) {
      await transaction.rollback()
      console.error('Error al crear producto:', err)
      return res.json({ 
        error: true, 
        msg: 'Ocurrió un error al crear el producto' 
      })
    }
  }
)

productRoutes.put(
  '/:id', 
  verifyToken, 
  requireRole('admin', 'employee'), 
  upload.single('image'), 
  async (req, res) => {
    const transaction = await sequelize.transaction()
    
    try {
      const product = await Product.findByPk(req.params.id, { transaction })

      if (!product) {
        await transaction.rollback()
        return res.json({ 
          error: true, 
          msg: 'No se puede actualizar, el producto no existe' 
        })
      }

      const { name, price, stock } = req.body

      if (name && name !== product.name) {
        const isDuplicate = await checkDuplicateName(name, req.params.id, transaction)
        if (isDuplicate) {
          await transaction.rollback()
          return res.json({ 
            error: true, 
            msg: 'Ya existe un producto con ese nombre' 
          })
        }
      }

      if (req.file) {
        const oldImage = product.image
        const newFilename = saveImage(req.file.buffer, req.file.originalname)

        product.image = newFilename

        if (oldImage) {
          deleteImageIfExists(oldImage)
        }
      }

      if (name !== undefined) product.name = name
      if (price !== undefined) product.price = Number(price)
      if (stock !== undefined) product.stock = Number(stock)

      await product.save({ transaction })
      await transaction.commit()

      return res.json({ 
        error: false, 
        msg: 'Producto actualizado exitosamente', 
        product 
      })
      
    } catch (err) {
      await transaction.rollback()
      console.error('Error al actualizar producto:', err)
      return res.json({ 
        error: true, 
        msg: 'Ocurrió un error al actualizar el producto' 
      })
    }
  }
)

productRoutes.delete(
  '/:id', 
  verifyToken, 
  requireRole('admin', 'employee'), 
  async (req, res) => {
    const transaction = await sequelize.transaction()
    
    try {
      const product = await Product.findByPk(req.params.id, { transaction })
      
      if (!product) {
        await transaction.rollback()
        return res.json({ 
          error: true, 
          msg: 'Producto no encontrado' 
        })
      }

      const imageName = product.image

      await product.destroy({ transaction })

      if (imageName) {
        deleteImageIfExists(imageName)
      }
      
      await transaction.commit()

      return res.json({
        error: false,
        msg: 'Producto eliminado exitosamente'
      })
      
    } catch (err) {
      await transaction.rollback()
      console.error('Error al eliminar producto:', err)
      return res.json({ 
        error: true, 
        msg: 'Ocurrió un error al eliminar el producto' 
      })
    }
  }
)