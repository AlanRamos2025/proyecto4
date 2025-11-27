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
  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(false)
  const [originalData, setOriginalData] = useState({
    name: '',
    price: '',
    stock: ''
  })
  const [formData, setFormData] = useState({
    name: '',
    price: '',
    stock: ''
  })
  const [imageFile, setImageFile] = useState(null)
  const [previewUrl, setPreviewUrl] = useState(null)

  useEffect(() => {
    if (id) {
      fetchProducto()
    }
  }, [id])

  // Limpiar object URL cuando cambie imageFile o al desmontar
  useEffect(() => {
    return () => {
      if (previewUrl && previewUrl.startsWith('blob:')) URL.revokeObjectURL(previewUrl)
    }
  }, [previewUrl])

  const fetchProducto = async () => {
    setFetching(true)
    try {
  const url = `${import.meta.env.VITE_API_URL}/api/products/${id}`
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${user.token}`
        }
      })
      
      
      if (!response.ok) {
        throw new Error('No se pudo cargar el producto')
      }

      const data = await response.json()
      console.debug('Create/Update product response:', { status: response.status, ok: response.ok, body: data })
      
      // Los datos están en data.product porque el backend devuelve { error: false, product: {...} }
      const producto = data.product || data
      const datosProducto = {
        name: producto.name || '',
        price: producto.price || '',
        stock: producto.stock || ''
      }
      setOriginalData(datosProducto)
      setFormData(datosProducto)
      // Si el producto tiene imagen, preparar preview apuntando al servidor
      if (producto.image) {
        const base = import.meta.env.VITE_API_URL || 'http://localhost:3000'
        setPreviewUrl(`${base.replace(/\/$/, '')}/images/${producto.image}`)
      }
    } catch (error) {
      console.error('Error al cargar producto:', error)
      toast.error('Error al cargar el producto')
      navigate('/private/productos')
    } finally {
      setFetching(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    
    try {
      // Si estamos en modo creación, requerir imagen
      if (!id && !imageFile) {
        toast.error('Debe seleccionar una imagen para el producto')
        setLoading(false)
        return
      }

      // Si estamos en modo edición, verificar si hay cambios
      if (id) {
        const hayChanges = 
          formData.name !== originalData.name ||
          formData.price !== originalData.price ||
          formData.stock !== originalData.stock
        
        if (!hayChanges) {
          toast.info('No hay cambios para guardar')
          setLoading(false)
          return
        }
      }

      const url = id 
        ? `${import.meta.env.VITE_API_URL}/api/products/${id}`
        : `${import.meta.env.VITE_API_URL}/api/products`
      let response
      let data

      if (!id) {
        // Crear producto enviando multipart/form-data (incluye imagen)
        const fd = new FormData()
        fd.append('name', formData.name)
        fd.append('price', parseFloat(formData.price))
        fd.append('stock', parseInt(formData.stock))
        if (imageFile) fd.append('image', imageFile)

        response = await fetch(url, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${user.token}`
          },
          body: fd
        })
        data = await response.json()
      } else {
        // Actualizar producto: si se seleccionó imagen, enviar multipart/form-data con la imagen
        if (imageFile) {
          const fd = new FormData()
          fd.append('name', formData.name)
          fd.append('price', parseFloat(formData.price))
          fd.append('stock', parseInt(formData.stock))
          fd.append('image', imageFile)

          response = await fetch(url, {
            method: 'PUT',
            headers: {
              'Authorization': `Bearer ${user.token}`
            },
            body: fd
          })
          data = await response.json()
        } else {
          // Actualizar sin imagen (JSON)
          response = await fetch(url, {
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
          data = await response.json()
        }
      }

      // El backend puede devolver { error: true, msg } incluso con status 200
      if (data?.error) {
        throw new Error(data.msg || 'Error al guardar el producto')
      }

      toast.success(id ? 'Producto actualizado correctamente' : 'Producto creado correctamente')

      // Si la respuesta incluye filename (imagen), mostrar preview
      if (data && data.product && data.product.image) {
        const base = import.meta.env.VITE_API_URL || 'http://localhost:3000'
        setPreviewUrl(`${base.replace(/\/$/, '')}/images/${data.product.image}`)
      }

      navigate('/private/productos')
    } catch (error) {
      // Solo mostramos el error en consola si no es un error 409 (conflicto de nombre)
      if (!error.message.includes('Ya existe un producto')) {
        console.error('Error inesperado:', error)
      }
      toast.error(error.message)
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  if (fetching) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto text-purple-500" />
          <p className="mt-2 text-purple-300">Cargando producto...</p>
        </div>

        <div>
          <label className="block text-purple-200 mb-2 font-medium">Imagen del producto (opcional)</label>
          <input
            type="file"
            accept="image/*"
            onChange={(e) => {
              const file = e.target.files?.[0] ?? null
              // liberar previous object url si existía
              if (previewUrl && previewUrl.startsWith('blob:')) URL.revokeObjectURL(previewUrl)
              if (file) {
                setImageFile(file)
                setPreviewUrl(URL.createObjectURL(file))
              } else {
                setImageFile(null)
              }
            }}
            disabled={loading}
            className="w-full"
          />

          {previewUrl && (
            <div className="mt-3">
              <p className="text-sm text-purple-200 mb-2">Vista previa:</p>
              <img src={previewUrl} alt="Preview" className="max-w-xs max-h-48 rounded-lg border border-white/20" />
            </div>
          )}
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
        <div>
          <label className="block text-purple-200 mb-2 font-medium">Imagen del producto</label>
          <input
            type="file"
            accept="image/*"
            onChange={(e) => {
              const file = e.target.files?.[0] ?? null
              if (previewUrl && previewUrl.startsWith('blob:')) URL.revokeObjectURL(previewUrl)
              if (file) {
                setImageFile(file)
                setPreviewUrl(URL.createObjectURL(file))
              } else {
                setImageFile(null)
              }
            }}
            disabled={loading}
            className="w-full mb-4"
          />
        </div>

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

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
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
          </div>

          <div>
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
        </div>
        
        <div className="flex flex-col sm:flex-row gap-3 pt-4">
          <div className="flex-1">
            <Button
              type="submit"
              value={loading ? (id ? 'Actualizando...' : 'Creando...') : (id ? 'Actualizar Producto' : 'Crear Producto')}
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