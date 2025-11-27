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

 // Cart.jsx (Función handlePay corregida)

// ...

  const handlePay = async () => {
    // ... (comprobaciones de usuario y carrito)

    setLoading(true)

    try {
      const items = cart.map(i => ({ id: i.id, quantity: i.quantity }))
      const res = await fetch(`${API_BASE_URL}/api/products/checkout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user.token}`
        },
        body: JSON.stringify({ items })
      })
      
      // 1. LEER EL CUERPO DE LA RESPUESTA UNA SOLA VEZ COMO TEXTO (consume el stream)
      const responseText = await res.text();

      let data
      
      // 2. INTENTAR PARSEAR EL TEXTO
      try {
        data = JSON.parse(responseText)
      } catch (e) {
        // Falló el parseo a JSON. La respuesta es texto plano (el mensaje de error)
        if (!res.ok) {
            console.error('Error del servidor (no JSON):', responseText)
            toast.error(responseText || 'Error en el pago: Respuesta del servidor no válida')
            return
        }
        
        // Si fue OK pero no es JSON, es un formato inesperado
        console.warn('Respuesta de éxito no JSON:', responseText)
        toast.error('Error: El servidor devolvió un formato inesperado')
        return
      }
      
      // 3. Si el parseo a JSON fue exitoso, verificar el estado de la respuesta
      if (!res.ok) {
        // Manejamos el error si fue un JSON de error
        toast.error(data.msg || data.error || 'Error en el pago')
        return
      }

      // 4. Si la respuesta es OK y JSON
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