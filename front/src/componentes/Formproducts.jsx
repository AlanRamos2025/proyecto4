import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useStore } from '../store/useStore'
import { Save, X, Loader2, ArrowLeft, Upload, Trash2 } from 'lucide-react'
import { toast } from 'react-toastify'

const Formproducts = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useStore()
  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(false)
  const [imagePreview, setImagePreview] = useState(null)
  const [imageFile, setImageFile] = useState(null)
  const [originalData, setOriginalData] = useState({
    name: '',
    price: '',
    stock: '',
    image: ''
  })
  const [formData, setFormData] = useState({
    name: '',
    price: '',
    stock: ''
  })

  useEffect(() => {
    if (id) {
      fetchProducto()
    }
  }, [id])

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
      const producto = data.product || data
      
      const datosProducto = {
        name: producto.name || '',
        price: producto.price || '',
        stock: producto.stock || '',
        image: producto.image || ''
      }
      
      setOriginalData(datosProducto)
      setFormData({
        name: datosProducto.name,
        price: datosProducto.price,
        stock: datosProducto.stock
      })
      
      // Si hay imagen existente, mostrarla
      if (datosProducto.image) {
        setImagePreview(datosProducto.image)
      }
    } catch (error) {
      console.error('Error al cargar producto:', error)
      toast.error('Error al cargar el producto')
      navigate('/private/productos')
    } finally {
      setFetching(false)
    }
  }

  const handleImageChange = (e) => {
    const file = e.target.files[0]
    
    if (file) {
      // Validar tipo de archivo
      if (!file.type.startsWith('image/')) {
        toast.error('Por favor selecciona un archivo de imagen válido')
        return
      }
      
      // Validar tamaño (máximo 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast.error('La imagen no debe superar los 5MB')
        return
      }
      
      setImageFile(file)
      
      // Crear preview
      const reader = new FileReader()
      reader.onloadend = () => {
        setImagePreview(reader.result)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleRemoveImage = () => {
    setImageFile(null)
    setImagePreview(null)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    
    try {
      // Si estamos en modo edición, verificar si hay cambios
      if (id) {
        const hayChanges = 
          formData.name !== originalData.name ||
          formData.price !== originalData.price ||
          formData.stock !== originalData.stock ||
          imageFile !== null ||
          (imagePreview === null && originalData.image !== '')
        
        if (!hayChanges) {
          toast.info('No hay cambios para guardar')
          setLoading(false)
          return
        }
      }

      const url = id 
        ? `${import.meta.env.VITE_API_URL}/api/products/${id}`
        : `${import.meta.env.VITE_API_URL}/api/products`
      
      // Usar FormData para enviar la imagen
      const formDataToSend = new FormData()
      formDataToSend.append('name', formData.name)
      formDataToSend.append('price', parseFloat(formData.price))
      formDataToSend.append('stock', parseInt(formData.stock))
      
      // Si hay una nueva imagen, agregarla
      if (imageFile) {
        formDataToSend.append('image', imageFile)
      }
      
      // Si se eliminó la imagen (preview es null pero había imagen original)
      if (imagePreview === null && originalData.image) {
        formDataToSend.append('removeImage', 'true')
      }
      
      const response = await fetch(url, {
        method: id ? 'PUT' : 'POST',
        headers: {
          'Authorization': `Bearer ${user.token}`
          // NO incluir Content-Type cuando se usa FormData
        },
        body: formDataToSend
      })

      const data = await response.json()

      if (!response.ok) {
        if (response.status === 409) {
          throw new Error(data.msg || 'Ya existe un producto con ese nombre')
        }
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
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto p-6">
      {/* Header */}
      <div className="mb-8">
        <button
          onClick={() => navigate('/private/productos')}
          className="flex items-center gap-2 text-purple-300 hover:text-white transition-colors mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Volver a productos
        </button>
        <h1 className="text-3xl font-bold text-white">
          {id ? 'Editar Producto' : 'Nuevo Producto'}
        </h1>
      </div>

      {/* Formulario */}
      <form onSubmit={handleSubmit} className="bg-white/10 backdrop-blur-xl rounded-2xl p-6 border border-white/20 space-y-6">
        {/* Sección de Imagen */}
        <div>
          <label className="block text-purple-200 mb-2 font-medium">
            Imagen del Producto
          </label>
          
          {imagePreview ? (
            <div className="relative">
              <img 
                src={imagePreview} 
                alt="Preview" 
                className="w-full h-64 object-cover rounded-xl border-2 border-white/20"
              />
              <button
                type="button"
                onClick={handleRemoveImage}
                disabled={loading}
                className="absolute top-2 right-2 p-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors disabled:opacity-50"
              >
                <Trash2 className="w-5 h-5" />
              </button>
            </div>
          ) : (
            <label className="flex flex-col items-center justify-center w-full h-64 border-2 border-dashed border-white/30 rounded-xl cursor-pointer bg-white/5 hover:bg-white/10 transition-all">
              <div className="flex flex-col items-center justify-center pt-5 pb-6">
                <Upload className="w-12 h-12 text-purple-300 mb-3" />
                <p className="mb-2 text-sm text-purple-200">
                  <span className="font-semibold">Click para subir</span> o arrastra y suelta
                </p>
                <p className="text-xs text-purple-300/70">PNG, JPG, GIF (MAX. 5MB)</p>
              </div>
              <input
                type="file"
                className="hidden"
                accept="image/*"
                onChange={handleImageChange}
                disabled={loading}
              />
            </label>
          )}
        </div>

        {/* Nombre */}
        <div>
          <label className="block text-purple-200 mb-2 font-medium">
            Nombre del Producto
          </label>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            placeholder="Ej: Laptop HP"
            className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-purple-300/50 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
            required
            disabled={loading}
          />
        </div>

        {/* Precio y Stock */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-purple-200 mb-2 font-medium">
              Precio ($)
            </label>
            <input
              type="number"
              name="price"
              value={formData.price}
              onChange={handleChange}
              placeholder="0.00"
              step="0.01"
              min="0"
              className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-purple-300/50 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
              required
              disabled={loading}
            />
          </div>

          <div>
            <label className="block text-purple-200 mb-2 font-medium">
              Stock (unidades)
            </label>
            <input
              type="number"
              name="stock"
              value={formData.stock}
              onChange={handleChange}
              placeholder="0"
              min="0"
              className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-purple-300/50 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
              required
              disabled={loading}
            />
          </div>
        </div>

        {/* Botones */}
        <div className="flex flex-col sm:flex-row gap-3 pt-4">
          <button
            type="submit"
            disabled={loading}
            className="flex-1 py-3 px-6 rounded-xl font-semibold text-white bg-gradient-to-r from-purple-600 to-pink-600 hover:shadow-lg hover:shadow-purple-500/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                {id ? 'Actualizando...' : 'Creando...'}
              </>
            ) : (
              <>
                <Save className="w-5 h-5" />
                {id ? 'Actualizar Producto' : 'Crear Producto'}
              </>
            )}
          </button>

          <button
            type="button"
            onClick={() => navigate('/private/productos')}
            disabled={loading}
            className="flex-1 sm:flex-none py-3 px-6 rounded-xl font-semibold text-white bg-white/10 border border-white/20 hover:bg-white/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            <X className="w-5 h-5" />
            Cancelar
          </button>
        </div>
      </form>
    </div>
  )
}

export default Formproducts