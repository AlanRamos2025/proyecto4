import { useStore } from '../store/useStore'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'react-toastify'

const Cart = () => {
  const { user, cart, removeFromCart, updateQuantity, clearCart } = useStore()
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000'

  const total = cart.reduce((s, i) => s + (i.price * i.quantity), 0)

  const handlePay = async () => {
    if (!user?.token) {
      toast.error('Debe iniciar sesión para pagar')
      navigate('/login')
      return
    }

    if (cart.length === 0) {
      toast.error('El carrito está vacío')
      return
    }

    setLoading(true)

    try {
      const items = cart.map(i => ({ id: i.id, quantity: i.quantity }))
      const res = await fetch(`${API_BASE_URL}/api/cart/checkout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user.token}`
        },
        body: JSON.stringify({ items })
      })

      const contentType = res.headers.get('content-type') || ''
      if (res.ok && contentType.includes('text/csv')) {
        const blob = await res.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        // intentar obtener el filename del header Content-Disposition
        const disp = res.headers.get('content-disposition') || ''
        let filename = 'ticket.csv'
        const match = disp.match(/filename="?([^";]+)"?/) 
        if (match && match[1]) filename = match[1]
        a.href = url
        a.download = filename
        document.body.appendChild(a)
        a.click()
        a.remove()
        window.URL.revokeObjectURL(url)

        toast.success('Compra exitosa — ticket descargado')
        clearCart()
        navigate('/private/productos')
        setTimeout(() => window.location.reload(), 600)
        return
      }

      // Si no es CSV, asumimos JSON con mensaje
      const data = await res.json()
      if (!res.ok) {
        toast.error(data.msg || 'Error en el pago')
        return
      }

      toast.success(data.msg || 'Compra exitosa')
      clearCart()
      navigate('/private/productos')
      setTimeout(() => window.location.reload(), 600)
    } catch (err) {
      console.error(err)
      toast.error('Error al procesar el pago')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <h2 className="text-2xl font-bold text-white mb-4">Carrito</h2>
      {cart.length === 0 ? (
        <div className="bg-white/5 p-6 rounded">No hay productos en el carrito</div>
      ) : (
        <div className="bg-white/5 p-6 rounded space-y-4">
          {cart.map(item => (
            <div key={item.id} className="flex justify-between items-center">
              <div>
                <div className="text-white font-semibold">{item.name}</div>
                <div className="text-sm text-gray-300">${item.price}</div>
              </div>
              <div className="flex items-center gap-2">
                <input type="number" min="1" value={item.quantity} onChange={(e) => updateQuantity(item.id, Math.max(1, Number(e.target.value)))} className="w-20 px-2 py-1 rounded bg-white/10 text-white" />
                <button onClick={() => removeFromCart(item.id)} className="px-3 py-1 bg-red-600 text-white rounded">Quitar</button>
              </div>
            </div>
          ))}

          <div className="flex justify-between items-center pt-4 border-t border-white/10">
            <div className="text-white font-bold">Total: ${total}</div>
            <div className="flex gap-2">
              <button onClick={() => clearCart()} className="px-4 py-2 bg-gray-600 text-white rounded">Vaciar</button>
              <button onClick={handlePay} disabled={loading} className="px-4 py-2 bg-green-600 text-white rounded">{loading ? 'Procesando...' : 'Pagar'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Cart
