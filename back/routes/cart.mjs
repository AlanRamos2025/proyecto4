import express from 'express'
import { verifyToken } from '../middleware/auth.mjs'
import { Product } from '../models/Product.mjs'
import { sequelize } from '../config/db.mjs'

export const cartRoutes = express.Router()

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
