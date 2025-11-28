import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useStore } from '../store/useStore'
import { Loader2, ArrowLeft } from 'lucide-react'
import { toast } from 'react-toastify'
import { Input } from './Input'
import { Button } from './Button'

const Formproducts = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useStore()
  const [formData, setFormData] = useState({
    name: '',
    price: '',
    stock: ''
  })
  const [imageFile, setImageFile] = useState(null)
  const [previewUrl, setPreviewUrl] = useState(null)
  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(false)
  const [originalData, setOriginalData] = useState(null)
  useEffect(() => {
    if (id) fetchProduct()
  }, [id])

  useEffect(() => {
    return () => {
      if (previewUrl?.startsWith('blob:')) {
        URL.revokeObjectURL(previewUrl)
      }
    }
  }, [previewUrl])

  const fetchProduct = async () => {
    setFetching(true)
    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/products/${id}`,
        {
          headers: { 'Authorization': `Bearer ${user.token}` }
        }
      )
      
      if (!response.ok) throw new Error('No se pudo cargar el producto')

      const data = await response.json()
      const product = data.product || data
      
      const productData = {
        name: product.name || '',
        price: product.price || '',
        stock: product.stock || ''
      }
      
      setFormData(productData)
      setOriginalData(productData)
      
      if (product.image) {
        const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000'
        setPreviewUrl(`${baseUrl.replace(/\/$/, '')}/images/${product.image}`)
      }
    } catch (error) {
      console.error('Error al cargar producto:', error)
      toast.error('Error al cargar el producto')
      navigate('/private/productos')
    } finally {
      setFetching(false)
    }
  }

  const hasChanges = () => {
    if (!id || !originalData) return true
    
    return (
      formData.name !== originalData.name ||
      formData.price !== originalData.price ||
      formData.stock !== originalData.stock ||
      imageFile !== null
    )
  }

  const validateForm = () => {
    if (!id && !imageFile) {
      toast.error('Debe seleccionar una imagen para el producto')
      return false
    }
    if (id && !hasChanges()) {
      toast.info('No hay cambios para guardar')
      return false
    }

    return true
  }

  const createFormData = () => {
    const fd = new FormData()
    fd.append('name', formData.name)
    fd.append('price', parseFloat(formData.price))
    fd.append('stock', parseInt(formData.stock))
    if (imageFile) fd.append('image', imageFile)
    return fd
  }

  const createProduct = async () => {
    const response = await fetch(
      `${import.meta.env.VITE_API_URL}/api/products`,
      {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${user.token}` },
        body: createFormData()
      }
    )
    return response.json()
  }

  const updateProduct = async () => {
    const url = `${import.meta.env.VITE_API_URL}/api/products/${id}`
    if (imageFile) {
      const response = await fetch(url, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${user.token}` },
        body: createFormData()
      })
      return response.json()
    }

    const response = await fetch(url, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${user.token}`
      },
      body: JSON.stringify({
        name: formData.name,
        price: parseFloat(formData.price),
        stock: parseInt(formData.stock)
      })
    })
    return response.json()
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!validateForm()) return

    setLoading(true)
    
    try {
      const data = id ? await updateProduct() : await createProduct()

      if (data?.error) {
        throw new Error(data.msg || 'Error al guardar el producto')
      }

      toast.success(id ? 'Producto actualizado correctamente' : 'Producto creado correctamente')
      navigate('/private/productos')
      
    } catch (error) {
      if (!error.message.includes('Ya existe un producto')) {
        console.error('Error inesperado:', error)
      }
      toast.error(error.message)
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }))
  }

  const handleImageChange = (e) => {
    const file = e.target.files?.[0] ?? null
    if (previewUrl?.startsWith('blob:')) {
      URL.revokeObjectURL(previewUrl)
    }
    
    if (file) {
      setImageFile(file)
      setPreviewUrl(URL.createObjectURL(file))
    } else {
      setImageFile(null)
      setPreviewUrl(null)
    }
  }

  if (fetching) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto text-purple-500" />
          <p className="mt-2 text-purple-300">Cargando producto...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto p-6">
      {/* Header */}
      <div className="mb-8">
        <Button
          type="button"
          onClick={() => navigate('/private/productos')}
          className="w-auto inline-flex items-center gap-2 px-0 py-0 text-purple-300 hover:text-white transition-colors mb-4 bg-transparent shadow-none transform-none"
          value={(
            <>
              <ArrowLeft className="w-4 h-4" />
              <span>Volver a productos</span>
            </>
          )}
        />
        <h1 className="text-3xl font-bold text-white">
          {id ? 'Editar Producto' : 'Nuevo Producto'}
        </h1>
      </div>

      {/* Formulario */}
      <form onSubmit={handleSubmit} className="bg-white/10 backdrop-blur-xl rounded-2xl p-6 border border-white/20 space-y-6">
        
        {/* Imagen */}
        <div>
          <label className="block text-purple-200 mb-2 font-medium">
            Imagen del producto {!id && <span className="text-red-400">*</span>}
          </label>
          <input
            type="file"
            accept="image/*"
            onChange={handleImageChange}
            disabled={loading}
            className="w-full"
          />
          
          {previewUrl && (
            <div className="mt-3">
              <p className="text-sm text-purple-200 mb-2">Vista previa:</p>
              <img 
                src={previewUrl} 
                alt="Preview" 
                className="max-w-xs max-h-48 rounded-lg border border-white/20" 
              />
            </div>
          )}
        </div>

        {/* Nombre */}
        <Input
          id="name"
          name="name"
          title="Nombre del Producto"
          placeholder="Ej: Laptop HP"
          value={formData.name}
          onChange={handleChange}
          disabled={loading}
          required
        />

        {/* Precio y Stock */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            id="price"
            name="price"
            type="number"
            title="Precio ($)"
            placeholder="0.00"
            value={formData.price}
            onChange={handleChange}
            step="0.01"
            min="0"
            disabled={loading}
            required
          />

          <Input
            id="stock"
            name="stock"
            type="number"
            title="Stock (unidades)"
            placeholder="0"
            value={formData.stock}
            onChange={handleChange}
            min="0"
            disabled={loading}
            required
          />
        </div>
        
        {/* Botones */}
        <div className="flex flex-col sm:flex-row gap-3 pt-4">
          <div className="flex-1">
            <Button
              type="submit"
              value={
                loading 
                  ? (id ? 'Actualizando...' : 'Creando...') 
                  : (id ? 'Actualizar Producto' : 'Crear Producto')
              }
              disabled={loading}
            />
          </div>

          <div className="flex-1 sm:flex-none">
            <Button
              type="button"
              value="Cancelar"
              onClick={() => navigate('/private/productos')}
              disabled={loading}
              className="bg-white/10 text-white"
            />
          </div>
        </div>
      </form>
    </div>
  )
}

export default Formproducts