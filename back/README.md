# Backend - Proyecto4

## Instrucciones rápidas
1. Crea la base de datos en mysql con el nombre `stock_ut`
--creara la base de datos `stock_ut` en caso de que no exista
CREATE DATABASE IF NOT EXISTS stock_utn;

2. Copia `.env-example` a `.env` y completa las variables (DB y PORT)

3. En la carpeta `back` ejecutar:

```powershell
cd "c:\Users\Estudiante\Escritorio\Proyecto4\back"
npm install
npm run dev   # o npm start
```
4. Rutas principales (resumen):
- `POST /api/auth/register`  { fullName, email, password }
- `POST /api/auth/login`     { email, password } -> devuelve `{ token }`
- `GET  /api/products`      -> público
- `POST /api/products`      -> protegido (Authorization: Bearer <token>)
- `PUT  /api/products/:id`  -> protegido
- `DELETE /api/products/:id` -> protegido

---

## Descripción General

- **Qué hace la API:** API REST para gestionar usuarios, autenticación, productos y carrito de compras para la aplicación Proyecto4.
- **Versión:** 1.0.0 (documentación del backend)
- **Stack:** Node.js (ESM), Express, MongoDB (o DB configurada en `config/db.mjs`), JWT para autenticación.

## Autenticación

- **Tipo:** JWT (JSON Web Tokens).
- **Cómo autenticarse:** 
  - Registrar cuenta: `POST /api/auth/register` (fullName/email/password).
  - Iniciar sesión: `POST /api/auth/login` → devuelve `{ token }`.
  - En rutas protegidas incluir cabecera: `Authorization: Bearer <token>`.

Ejemplo (login):

Request:

```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "secret123"
}
```

Response (200):

```json
{
  "token": "eyJhbGci...",
  "user": {
    "id": "642...",
    "fullName": "Juan Pérez",
    "email": "user@example.com"
  }
}
```

## Endpoints detallados

Nota: Las rutas se encuentran en `back/routes/` (ej. `authRoutes.mjs`, `productRoutes.mjs`, `user.mjs`, `cart.mjs`).

- **Auth**
  - POST `/api/auth/register`
    - Body: `{ fullName, email, password }`
    - Response 201: `{ message: "Usuario creado", user: { id, fullName, email } }`
    - Errores: 400 (datos incompletos), 409 (email ya registrado), 500 (error servidor)

  - POST `/api/auth/login`
    - Body: `{ email, password }`
    - Response 200: `{ token, user }`
    - Errores: 400 (datos incompletos), 401 (credenciales inválidas), 500

- **Productos**
  - GET `/api/products`
    - Parámetros query (opcionales): `?q=nombre&limit=10&page=1&sort=price`
    - Response 200: `[{ id, name, price, stock, image, createdAt }, ...]`
    - Errores: 500

  - POST `/api/products`
    - Protected: `Authorization: Bearer <token>`
    - Body: `{ name, price, stock, image }`
    - Response 201: `{ message: "Producto creado", product }`
    - Errores: 400 (datos invalidos), 401, 403, 500

  - PUT `/api/products/:id`
    - Protected
    - Path param: `id` (productId)
    - Body: `{ name?, price?, stock?, image? }`
    - Response 200: `{ message: "Producto actualizado", product }`
    - Errores: 400, 401, 403, 404 (no encontrado), 500

  - DELETE `/api/products/:id`
    - Protected
    - Response 200: `{ message: "Producto eliminado" }`
    - Errores: 401, 403, 404, 500

- **Usuarios**
  - GET `/api/users/:id` (si existe en la API)
    - Protected
    - Response 200: `{ id, fullName, email, role }` (no incluir password)
    - Errores: 401, 403, 404, 500

- **Carrito** (según `routes/cart.mjs`)
  - GET `/api/cart` - obtiene carrito del usuario autenticado
  - POST `/api/cart` - añade item `{ productId, quantity }`
  - PUT `/api/cart/:itemId` - actualiza cantidad
  - DELETE `/api/cart/:itemId` - elimina item
  - Todas protegidas por `Authorization: Bearer <token>`

### Ejemplos de request / response

- Crear producto (ejemplo):

Request:

```http
POST /api/products
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Cafetera ",
  "price": 40000.00,
  "stock": 4,
  "image": "cafetera.jpg"
}
```

Response 201:

```json
{
  "message": "Producto creado",
  "product": {
    "id": "64a...",
    "name": "Cafetera X",
    "price": 49.99,
    "stock": 10,
    "image": "cafetera.jpg",
    "createdAt": "2025-11-27T10:00:00.000Z"
  }
}
```

### Códigos de estado y errores comunes

- 200 OK: Petición correcta y respuesta válida.
- 201 Created: Recurso creado correctamente.
- 400 Bad Request: Datos de entrada inválidos o faltantes.
- 401 Unauthorized: Token ausente o inválido.
- 403 Forbidden: Usuario sin permisos para la acción.
- 404 Not Found: Recurso no encontrado.
- 409 Conflict: Conflicto (ej. email ya registrado).
- 500 Internal Server Error: Error en servidor.

## Modelos de datos (ejemplos)

- User

```json
{
  "id": "string",
  "fullName": "string",
  "email": "string",
  "password": "string (hashed)",
  "role": "string (opcional: admin|user)",
  "createdAt": "ISODate"
}
```

- Product

```json
{
  "id": "string",
  "name": "string",
  "price": number,
  "stock": number,
  "image": "string (ruta/nombre)",
  "createdAt": "ISODate"
}
```

- Cart (simplificado)

```json
{
  "userId": "string",
  "items": [
    { "productId": "string", "quantity": number }
  ]
}
```
## Configuración / Variables de entorno

- Variables habituales en `.env` (ejemplos):

```
NAME_DB=stock_utn
USER_DB=root
PASS_DB=12345678
DIALECT_DB=mysql
HOST_DB=localhost
PORT_DB=3306
```

## Instalación y ejecución

1. Ir a la carpeta `back`:

```powershell
cd "c:\Users\Estudiante\Escritorio\Proyecto4\back"
```

2. Instalar dependencias e iniciar en modo desarrollo:

```powershell
npm install
npm run dev
# o
npm start
```

3. Crear `.env` (copiar `.env-example`) y completar variables.