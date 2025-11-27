import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export const useStore = create(persist(
  (set) => ({
    user: { // Obtener usuario
      email: null,
      full_name: null,
      token: null,
      role: null
    },
    setUser: (newuser) => set({ user: newuser }), // Establecer o modificar usuario

    // Carrito
    cart: [],
    addToCart: (product) => set((state) => {
      const existing = state.cart.find(item => item.id === product.id)
      if (existing) {
        return { cart: state.cart.map(item => item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item) }
      }
      return { cart: [...state.cart, { id: product.id, name: product.name, price: product.price, quantity: 1 }] }
    }),
    removeFromCart: (productId) => set((state) => ({ cart: state.cart.filter(i => i.id !== productId) })),
    updateQuantity: (productId, qty) => set((state) => ({ cart: state.cart.map(i => i.id === productId ? { ...i, quantity: qty } : i) })),
    clearCart: () => set({ cart: [] })
  }), // <- hay una coma
  { // Configuración de persistencia de datos
    name: "token_login_web"
  }
))