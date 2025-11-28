import express from 'express'
<<<<<<< HEAD
import nodemailer from 'nodemailer'
=======
>>>>>>> bf7f94b30ee0b846e594836f1669bed8531cc32e
import { verifyToken } from '../middleware/auth.mjs'
import { Product } from '../models/Product.mjs'
import { sequelize } from '../config/db.mjs'

export const cartRoutes = express.Router()

<<<<<<< HEAD
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
})

const userCarts = new Map()

function getCart(userId) {
  if (!userCarts.has(userId)) {
    userCarts.set(userId, [])
  }
  return userCarts.get(userId)
}

function findProductInCart(cart, productId) {
  return cart.find(item => String(item.id) === String(productId))
}

function removeProductFromCart(cart, productId) {
  const index = cart.findIndex(item => String(item.id) === String(productId))
  if (index >= 0) {
    cart.splice(index, 1)
  }
}

async function cleanInvalidProducts(cart, userId) {
  if (!cart || cart.length === 0) return cart

  const productIds = cart.map(item => item.id)
  const existingProducts = await Product.findAll({ 
    where: { id: productIds },
    attributes: ['id']
  })

  const validIds = new Set(existingProducts.map(p => p.id))
  const cleanedCart = cart.filter(item => validIds.has(item.id))

  if (cleanedCart.length !== cart.length) {
    userCarts.set(userId, cleanedCart)
  }

  return cleanedCart
}

function isValidQuantity(quantity) {
  const qty = Number(quantity)
  return !isNaN(qty) && qty > 0
}

function generateTicketCSV(cart, productsMap) {
  const rows = [['cantidad', 'nombre', 'precio_unitario', 'subtotal']]
  let total = 0

  for (const item of cart) {
    const product = productsMap.get(item.id)
    const quantity = Number(item.quantity)
    const unitPrice = Number(product.price)
    const subtotal = unitPrice * quantity
    
    total += subtotal

    rows.push([
      String(quantity),
      product.name.replace(/"/g, '""'),
      unitPrice.toFixed(2),
      subtotal.toFixed(2)
    ])
  }

  rows.push(['', 'TOTAL', '', total.toFixed(2)])

  const csvLines = rows.map(row => 
    row.map(field => {
      const needsQuotes = /[,"]/.test(field)
      if (needsQuotes) {
        return `"${String(field).replace(/"/g, '""')}"`
      }
      return String(field)
    }).join(',')
  )

  return csvLines.join('\r\n')
}

function generateFilename() {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
  return `ticket-${timestamp}.csv`
}

function generateEmailHTML(user, cart, productsMap) {
  let total = 0
  
  const itemsHTML = cart.map(item => {
    const product = productsMap.get(item.id)
    const quantity = Number(item.quantity)
    const unitPrice = Number(product.price)
    const subtotal = unitPrice * quantity
    total += subtotal

    return `
      <tr>
        <td style="padding: 12px; border-bottom: 1px solid #e5e7eb;">${product.name}</td>
        <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: center;">${quantity}</td>
        <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: right;">$${unitPrice.toFixed(2)}</td>
        <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: right; font-weight: 600;">$${subtotal.toFixed(2)}</td>
      </tr>
    `
  }).join('')

  return `
    <!DOCTYPE html>
    <html lang="es">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Confirmación de Compra</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f3f4f6;">
      <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 20px; text-align: center;">
          <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 700;">🎉 ¡Compra Exitosa!</h1>
          <p style="margin: 10px 0 0; color: #e0e7ff; font-size: 16px;">Gracias por tu compra</p>
        </div>
        <div style="padding: 40px 30px;">
          <p style="margin: 0 0 20px; color: #374151; font-size: 16px; line-height: 1.5;">
            Hola <strong>${user.name || user.email}</strong>,
          </p>
          <p style="margin: 0 0 30px; color: #6b7280; font-size: 15px; line-height: 1.5;">
            Tu compra ha sido procesada exitosamente. A continuación encontrarás el detalle de tu pedido:
          </p>
          <div style="overflow-x: auto; margin-bottom: 30px;">
            <table style="width: 100%; border-collapse: collapse; background-color: #ffffff; border: 1px solid #e5e7eb; border-radius: 8px;">
              <thead>
                <tr style="background-color: #f9fafb;">
                  <th style="padding: 12px; text-align: left; font-weight: 600; color: #374151; border-bottom: 2px solid #e5e7eb;">Producto</th>
                  <th style="padding: 12px; text-align: center; font-weight: 600; color: #374151; border-bottom: 2px solid #e5e7eb;">Cant.</th>
                  <th style="padding: 12px; text-align: right; font-weight: 600; color: #374151; border-bottom: 2px solid #e5e7eb;">Precio</th>
                  <th style="padding: 12px; text-align: right; font-weight: 600; color: #374151; border-bottom: 2px solid #e5e7eb;">Subtotal</th>
                </tr>
              </thead>
              <tbody>${itemsHTML}</tbody>
            </table>
          </div>
          <div style="background-color: #f9fafb; padding: 20px; border-radius: 8px; margin-bottom: 30px;">
            <div style="display: flex; justify-content: space-between; align-items: center;">
              <span style="font-size: 18px; font-weight: 700; color: #374151;">Total:</span>
              <span style="font-size: 24px; font-weight: 700; color: #667eea;">$${total.toFixed(2)}</span>
            </div>
          </div>
          <div style="background-color: #eff6ff; border-left: 4px solid #3b82f6; padding: 16px; margin-bottom: 30px; border-radius: 4px;">
            <p style="margin: 0; color: #1e40af; font-size: 14px; line-height: 1.5;">
              <strong>📄 Ticket de compra:</strong> Se ha descargado automáticamente en tu navegador.
            </p>
          </div>
          <p style="margin: 0 0 10px; color: #6b7280; font-size: 14px; line-height: 1.5;">
            Si tienes alguna pregunta o necesitas ayuda, no dudes en contactarnos.
          </p>
          <p style="margin: 0; color: #6b7280; font-size: 14px; line-height: 1.5;">¡Gracias por confiar en nosotros! 💙</p>
        </div>
        <div style="background-color: #f9fafb; padding: 30px; text-align: center; border-top: 1px solid #e5e7eb;">
          <p style="margin: 0 0 10px; color: #9ca3af; font-size: 12px;">Este es un correo automático, por favor no respondas a este mensaje.</p>
          <p style="margin: 0; color: #9ca3af; font-size: 12px;">© ${new Date().getFullYear()} Tu Empresa. Todos los derechos reservados.</p>
        </div>
      </div>
    </body>
    </html>
  `
}

async function sendPurchaseEmail(user, cart, productsMap) {
  try {
    const mailOptions = {
      from: `"Tu Tienda" <${process.env.EMAIL_USER}>`,
      to: user.email,
      subject: '🎉 Confirmación de Compra - Ticket de Compra',
      html: generateEmailHTML(user, cart, productsMap)
    }

    await transporter.sendMail(mailOptions)
    return { success: true }
  } catch (error) {
    console.error('Error al enviar email:', error)
    return { success: false, error }
  }
}

// ============ RUTAS ============

cartRoutes.get('/', verifyToken, async (req, res) => {
  const userId = req.user?.id
  
  if (!userId) {
    return res.json({ error: true, msg: 'No autenticado' })
  }

  try {
    const cart = getCart(userId)
    const cleanedCart = await cleanInvalidProducts(cart, userId)
    
    return res.json({ error: false, cart: cleanedCart })
  } catch (error) {
    console.error('Error al obtener carrito:', error)
    return res.json({ error: true, msg: 'Error al cargar el carrito' })
  }
})

cartRoutes.post('/', verifyToken, async (req, res) => {
  const userId = req.user?.id
  
  if (!userId) {
    return res.json({ error: true, msg: 'No autenticado' })
  }

  const { id, quantity } = req.body
  
  if (!id) {
    return res.json({ error: true, msg: 'Falta id de producto' })
  }

  try {
    const product = await Product.findByPk(id)
    
    if (!product) {
      return res.json({ 
        error: true, 
        msg: 'El producto no existe o fue eliminado' 
      })
    }

    const qty = Number(quantity) || 1
    
    if (product.stock < qty) {
      return res.json({ 
        error: true, 
        msg: `Stock insuficiente. Disponible: ${product.stock}` 
      })
    }

    const cart = getCart(userId)
    const existingItem = findProductInCart(cart, id)

    if (existingItem) {
      const newTotal = existingItem.quantity + qty
      if (product.stock < newTotal) {
        return res.json({ 
          error: true, 
          msg: `Stock insuficiente. Ya tienes ${existingItem.quantity} en el carrito. Disponible: ${product.stock}` 
        })
      }
      existingItem.quantity += qty
    } else {
      cart.push({ id, quantity: qty })
    }

    return res.json({ error: false, cart })
  } catch (error) {
    console.error('Error al agregar producto:', error)
    return res.json({ error: true, msg: 'Error al agregar el producto' })
  }
})

cartRoutes.put('/:productId', verifyToken, async (req, res) => {
  const userId = req.user?.id
  
  if (!userId) {
    return res.json({ error: true, msg: 'No autenticado' })
  }

  const productId = req.params.productId
  const quantity = Number(req.body.quantity)

  if (isNaN(quantity) || quantity < 0) {
    return res.json({ error: true, msg: 'Cantidad inválida' })
  }

  try {
    const cart = getCart(userId)
    const existingItem = findProductInCart(cart, productId)

    if (!existingItem) {
      return res.json({ error: true, msg: 'Producto no está en el carrito' })
    }

    if (quantity === 0) {
      removeProductFromCart(cart, productId)
      return res.json({ error: false, cart })
    }

    const product = await Product.findByPk(productId)
    
    if (!product) {
      removeProductFromCart(cart, productId)
      return res.json({ 
        error: true, 
        msg: 'El producto fue eliminado',
        cart 
      })
    }

    if (product.stock < quantity) {
      return res.json({ 
        error: true, 
        msg: `Stock insuficiente. Disponible: ${product.stock}` 
      })
    }

    existingItem.quantity = quantity
    return res.json({ error: false, cart })
    
  } catch (error) {
    console.error('Error al actualizar cantidad:', error)
    return res.json({ error: true, msg: 'Error al actualizar la cantidad' })
  }
})

cartRoutes.delete('/:productId', verifyToken, (req, res) => {
  const userId = req.user?.id
  
  if (!userId) {
    return res.json({ error: true, msg: 'No autenticado' })
  }

  const productId = req.params.productId
  const cart = getCart(userId)
  
  removeProductFromCart(cart, productId)

  return res.json({ error: false, cart })
})

cartRoutes.post('/checkout', verifyToken, async (req, res) => {
  const userId = req.user?.id
  
  if (!userId) {
    return res.json({ error: true, msg: 'No autenticado' })
  }
  const { items } = req.body
  
  if (!items || !Array.isArray(items) || items.length === 0) {
    return res.json({ error: true, msg: 'Carrito vacío' })
  }
  let cart = items.map(item => ({
    id: item.id,
    quantity: item.quantity
  }))

  const transaction = await sequelize.transaction()

  try {
    cart = await cleanInvalidProducts(cart, userId)

    if (cart.length === 0) {
      await transaction.rollback()
      return res.json({ 
        error: true, 
        msg: 'Los productos del carrito ya no están disponibles' 
      })
    }

    const productIds = cart.map(item => item.id)
    const products = await Product.findAll({ 
      where: { id: productIds }, 
      transaction 
    })

    const productsMap = new Map()
    products.forEach(product => productsMap.set(product.id, product))

    const unavailableProducts = []
    
    for (const item of cart) {
      const product = productsMap.get(item.id)
      
      if (!product) {
        unavailableProducts.push(`ID ${item.id}`)
        continue
      }

      const quantity = Number(item.quantity)
      if (!isValidQuantity(quantity)) {
        await transaction.rollback()
        return res.json({ 
          error: true, 
          msg: `Cantidad inválida para producto ${product.name}` 
        })
      }

      if (product.stock < quantity) {
        await transaction.rollback()
        return res.json({ 
          error: true, 
          msg: `Stock insuficiente para ${product.name}. Disponible: ${product.stock}` 
        })
      }
    }

    if (unavailableProducts.length > 0) {
      await transaction.rollback()
      return res.json({ 
        error: true, 
        msg: `Algunos productos ya no están disponibles: ${unavailableProducts.join(', ')}` 
      })
    }

    for (const item of cart) {
      const product = productsMap.get(item.id)
      const quantity = Number(item.quantity)
      
      product.stock -= quantity
      await product.save({ transaction })
    }

    await transaction.commit()
    const user = req.user
    
    if (user.email) {
      sendPurchaseEmail(user, cart, productsMap).catch(err => {
        console.error('Error al enviar email:', err)
      })
    }

    try {
      const csvContent = generateTicketCSV(cart, productsMap)
      const filename = generateFilename()
      res.setHeader('Content-Type', 'text/csv; charset=utf-8')
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`)
      return res.send(csvContent)
      
    } catch (csvError) {
      console.error('Error generando CSV:', csvError)
      return res.json({ 
        error: false, 
        msg: 'Compra realizada con éxito, pero hubo un error al generar el ticket' 
      })
    }

  } catch (error) {
    await transaction.rollback()
    console.error('Error al procesar compra:', error)
    return res.json({ 
      error: true, 
      msg: 'Error al procesar la compra' 
    })
  }
})
=======
// Simple store en memoria
const carts = new Map()

function getUserCart(userId) {
  if (!carts.has(userId)) carts.set(userId, [])
  return carts.get(userId)
}

// obtener carrito del usuario autenticado
cartRoutes.get('/', verifyToken, (req, res) => {
  const userId = req.user?.id
  if (!userId) return res.json({ error: true, msg: 'No autenticado' })
  const cart = getUserCart(userId)
  return res.json({ error: false, cart })
})

// agregar producto 
cartRoutes.post('/', verifyToken, (req, res) => {
  const userId = req.user?.id
  if (!userId) return res.json({ error: true, msg: 'No autenticado' })

  const { id, quantity } = req.body
  if (!id) return res.json({ error: true, msg: 'Falta id de producto' })
  const qty = Number(quantity) || 1

  const cart = getUserCart(userId)
  const existing = cart.find(i => i.id === id)
  if (existing) {
    existing.quantity = existing.quantity + qty
  } else {
    cart.push({ id, quantity: qty })
  }

  return res.json({ error: false, cart })
})

// PUT /:productId - actualizar cantidad
cartRoutes.put('/:productId', verifyToken, (req, res) => {
  const userId = req.user?.id
  if (!userId) return res.json({ error: true, msg: 'No autenticado' })

  const productId = req.params.productId
  const qty = Number(req.body.quantity)
  if (isNaN(qty) || qty < 0) return res.json({ error: true, msg: 'Cantidad inválida' })

  const cart = getUserCart(userId)
  const existing = cart.find(i => String(i.id) === String(productId))
  if (!existing) return res.json({ error: true, msg: 'Producto no en el carrito' })

  if (qty === 0) {
    // eliminar
    const idx = cart.findIndex(i => String(i.id) === String(productId))
    if (idx >= 0) cart.splice(idx, 1)
  } else {
    existing.quantity = qty
  }

  return res.json({ error: false, cart })
})

// DELETE /:productId - remover
cartRoutes.delete('/:productId', verifyToken, (req, res) => {
  const userId = req.user?.id
  if (!userId) return res.json({ error: true, msg: 'No autenticado' })

  const productId = req.params.productId
  const cart = getUserCart(userId)
  const idx = cart.findIndex(i => String(i.id) === String(productId))
  if (idx >= 0) cart.splice(idx, 1)

  return res.json({ error: false, cart })
})

//usar el carrito del usuario para procesar la compra
cartRoutes.post('/checkout', verifyToken, async (req, res) => {
  const userId = req.user?.id
  if (!userId) return res.json({ error: true, msg: 'No autenticado' })

  const cart = getUserCart(userId)
  if (!cart || cart.length === 0) return res.json({ error: true, msg: 'Carrito vacío' })

  const t = await sequelize.transaction()
  try {
    const ids = cart.map(i => i.id)
    const products = await Product.findAll({ where: { id: ids }, transaction: t })
    const prodMap = new Map()
    products.forEach(p => prodMap.set(p.id, p))

    // verificar stock
    for (const it of cart) {
      const p = prodMap.get(it.id)
      if (!p) {
        await t.rollback()
        return res.json({ error: true, msg: `Producto con id ${it.id} no encontrado` })
      }
      const qty = Number(it.quantity) || 0
      if (qty <= 0) {
        await t.rollback()
        return res.json({ error: true, msg: `Cantidad inválida para producto ${p.name}` })
      }
      if (p.stock < qty) {
        await t.rollback()
        return res.json({ error: true, msg: `Stock insuficiente para ${p.name}` })
      }
    }

    // restar stock
    for (const it of cart) {
      const p = prodMap.get(it.id)
      const qty = Number(it.quantity)
      p.stock = p.stock - qty
      await p.save({ transaction: t })
    }

    await t.commit()

    // generar CSV
    try {
      const rows = []
      rows.push(['cantidad', 'nombre', 'precio_unitario', 'subtotal'])
      let total = 0
      for (const it of cart) {
        const p = prodMap.get(it.id)
        const qty = Number(it.quantity)
        const unit = Number(p.price)
        const subtotal = unit * qty
        total += subtotal
        rows.push([String(qty), p.name.replace(/"/g, '""'), unit.toFixed(2), subtotal.toFixed(2)])
      }
      rows.push(['', 'TOTAL', '', total.toFixed(2)])

      const csvLines = rows.map(r => r.map(field => {
        const needsQuotes = /[,\"]/.test(field)
        if (needsQuotes) return `"${String(field).replace(/"/g, '""')}"`
        return String(field)
      }).join(','))

      const csvContent = csvLines.join('\r\n')
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
      const filename = `ticket-${timestamp}.csv`

      // limpiar carrito del usuario
      carts.set(userId, [])

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
    return res.json({ error: true, msg: 'Error al procesar compra' })
  }
})
>>>>>>> bf7f94b30ee0b846e594836f1669bed8531cc32e
