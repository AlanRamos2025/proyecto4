# Backend - Proyecto4

Instrucciones rápidas:

1. Copia `.env.example` a `.env` y completa las variables (DB y PORT).
2. En la carpeta `back` ejecutar:

```powershell
npm install
npm run dev   # o npm start
```

3. Rutas:
- POST /api/auth/register  { fullName, email, password }
- POST /api/auth/login     { email, password } -> devuelve { token }
- GET  /api/products      -> público
- POST /api/products      -> protegido (Authorization: Bearer <token>)
- PUT  /api/products/:id  -> protegido
- DELETE /api/products/:id -> protegido

La app crea/ sincroniza las tablas `users` y `products` al arrancar.
