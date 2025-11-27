🛍️ Proyecto Frontend: Catálogo y Gestión de Inventario
Este proyecto constituye el frontend de la aplicación, desarrollado con React para la construcción de la interfaz de usuario. Utiliza React Router DOM para el enrutamiento y aplica un sistema de rutas protegidas para la gestión de inventario y datos sensibles.

⚙️ Tecnologías Principales
React: Biblioteca principal para construir la interfaz de usuario.

React Router DOM: Gestión de la navegación, enrutamiento y definición de layouts.

Tailwind CSS / Estilos personalizados: Utilizado para el diseño, la maquetación rápida y la estilización de componentes.

React Toastify: Implementación de notificaciones (toasts) globales para feedback de usuario.

🧭 Estructura de Rutas y Navegación
El enrutamiento se organiza en bloques Públicos y Privados anidados bajo Layouts específicos (<Public /> y <Private />).

1. Rutas Públicas (Layout: <Public />)
Estas rutas son accesibles para todos sin necesidad de autenticación.

Ruta / (Componente Listproducts):

Descripción: Página de Inicio o Catálogo. Muestra los productos disponibles para su visualización.

Ruta /register (Componente Register):

Descripción: Formulario para la creación de nuevas cuentas de usuario.

Ruta /login (Componente Login):

Descripción: Formulario de inicio de sesión.

2. Rutas Privadas/Protegidas (Layout: <Private />)
El Layout <Private /> implementa la lógica de protección de ruta, validando la autenticación antes de permitir el acceso a estos recursos de gestión interna.

Ruta /private/productos (Componente Listproducts):

Descripción: Gestión de Inventario. Lista de productos con opciones CRUD para personal autorizado.

Ruta /private/productos/nuevo (Componente Formproducts):

Descripción: Formulario dedicado a añadir un nuevo producto al inventario.

Ruta /private/productos/editar/:id (Componente Formproducts):

Descripción: Formulario para modificar un producto existente. El :id es el parámetro de identificación.

Ruta /private/empleados/nuevo (Componente EmployeeForm):

Descripción: Formulario para el registro de nuevo personal (empleados o administradores).

Ruta /private/cart (Componente Cart):

Descripción: Carrito de Compras del usuario autenticado.

3. Ruta de Fallback (404)
Ruta * (Componente <div>...</div>):

Descripción: Página 404. Se muestra cuando la URL solicitada no coincide con ninguna ruta definida.

📢 Notificaciones Globales (react-toastify)
El componente <ToastContainer /> se utiliza de forma global para mostrar notificaciones consistentes en toda la aplicación (éxito, error, etc.).

Configuración Principal:

Posición: position="top-right" (Esquina superior derecha).

Cierre Automático: autoClose={3000} (Se cierra después de 3 segundos).

Tema: theme="dark" (Utiliza el tema oscuro).