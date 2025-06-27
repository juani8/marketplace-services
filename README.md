# 🛠️ Backend Marketplace - Node.js + Express + PostgreSQL + JWT

Este proyecto es un backend desarrollado con **Node.js** y **Express**, utilizando una base de datos **PostgreSQL** desplegada en **Render**. Está diseñado para gestionar múltiples comercios (tenants) y sus respectivos catálogos, productos y promociones con **autenticación JWT**.

---

## 🚀 Scripts disponibles

```json
"scripts": {
  "dev": "nodemon src/app.js",
  "start": "node src/app.js",
  "init-db": "node src/config/db_init_model.js",
  "drop-db": "node src/config/db_exec_drop_tables.js"
}
```

- `npm run dev`: Levanta el servidor en modo desarrollo con **nodemon**.
- `npm start`: Ejecuta el servidor en producción.
- `npm run init-db`: Inicializa las tablas en la base de datos.
- `npm run drop-db`: Elimina todas las tablas de la base de datos.

---

## 🔐 Autenticación JWT

Este proyecto implementa **autenticación JWT completa** en todos los endpoints (excepto autenticación y callbacks públicos). 

### Características:
- ✅ **Token Bearer**: Todos los endpoints requieren `Authorization: Bearer <token>`
- ✅ **Multi-tenant**: Usuarios aislados por tenant
- ✅ **Roles**: Admin (acceso completo) y Operador (acceso limitado)
- ✅ **Permisos granulares**: Control de acceso por comercio
- ✅ **Refresh tokens**: Sistema de renovación de tokens
- ✅ **Autorización automática**: Los datos se filtran por tenant/usuario automáticamente

---

## 📦 Instalación de dependencias

```bash
npm install
```

**Dependencias principales:**
- `dotenv`: Manejo de variables de entorno
- `cors`: Habilita peticiones cross-origin desde el frontend
- `morgan`: Middleware de logging
- `pg`: Cliente de PostgreSQL para Node.js
- `nodemon`: Recarga automática del servidor durante el desarrollo
- `multer`: Manejo de subida de archivos
- `cloudinary`: Servicio de almacenamiento de imágenes en la nube
- `jsonwebtoken`: Manejo de tokens JWT para autenticación
- `bcryptjs`: Hashing de contraseñas

---

## 🔐 Variables de Entorno

El proyecto requiere las siguientes variables de entorno en un archivo `.env`:

```bash
# Base de datos
DATABASE_URL=postgres://user:password@host:port/database

# Cloudinary
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# JWT Secrets (generar con crypto.randomBytes(64).toString('hex'))
JWT_SECRET=your_jwt_secret_128_chars
JWT_REFRESH_SECRET=your_refresh_secret_128_chars

# Hub de Eventos
HUB_USERNAME=marketplace-service
HUB_PASSWORD=12345
```

---

## 🔑 Autenticación JWT

Todos los endpoints (excepto autenticación y callbacks) requieren un token JWT válido en el header:

```bash
Authorization: Bearer <tu_jwt_token>
```

### Estructura del Token JWT:
```json
{
  "usuario_id": 1,
  "tenant_id": 1,
  "nombre": "Juan Pérez",
  "email": "juan@ejemplo.com",
  "rol": "admin",
  "tenant_nombre": "Mi Negocio",
  "comercios_autorizados_id": [1, 2, 3]
}
```

---

## 📋 API Endpoints

### 🔐 Autenticación

#### POST /api/auth/login
**Descripción:** Iniciar sesión
**Autenticación:** ❌ No requiere
**Body requerido:**
```json
{
  "email": "admin@ejemplo.com",
  "password": "tu_password"
}
```
**Respuesta exitosa:**
```json
{
  "message": "Login exitoso",
  "user": {
    "usuario_id": 1,
    "nombre": "Juan Pérez",
    "email": "admin@ejemplo.com",
    "rol": "admin"
  },
  "tenant_id": 1,
  "tokens": {
    "accessToken": "eyJhbGciOiJIUzI1NiIs...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
  }
}
```

#### POST /api/auth/register-tenant
**Descripción:** Crear nuevo tenant con usuario admin
**Autenticación:** ❌ No requiere
**Body requerido:**
```json
{
  "nombre": "Mi Negocio",
  "razon_social": "Mi Negocio S.A.",
  "cuenta_bancaria": "1234567890",
  "email": "admin@ejemplo.com",
  "telefono": "1234567890",
  "calle": "Av. Corrientes",
  "numero": "1234",
  "ciudad": "Buenos Aires",
  "provincia": "CABA",
  "codigo_postal": "1043",
  "nombre_usuario": "Juan Pérez",
  "password": "mi_password",
  "sitio_web": "https://miweb.com",
  "instagram": "@miweb"
}
```

#### POST /api/auth/register-internal
**Descripción:** Crear usuario interno (admins pueden hacer esto únicamente)
**Autenticación:** ✅ Requiere (Admin)
**Body requerido:**
```json
{
  "nombre": "María García",
  "email": "maria@ejemplo.com",
  "password": "password123",
  "rol": "operador",
  "comercios_ids": [1, 2]
}
```

#### POST /api/auth/refresh
**Descripción:** Renovar tokens JWT
**Autenticación:** ❌ No requiere
**Body requerido:**
```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
}
```

#### GET /api/auth/profile
**Descripción:** Obtener perfil del usuario autenticado
**Autenticación:** ✅ Requiere
**Body:** ❌ No requiere
**Respuesta exitosa:**
```json
{
  "success": true,
  "data": {
    "usuario_id": 1,
    "tenant_id": 1,
    "nombre": "Juan Pérez",
    "email": "admin@ejemplo.com",
    "rol": "admin",
    "tenant": {
      "nombre": "Mi Negocio",
      "razon_social": "Mi Negocio S.A.",
      "estado": "activo"
    },
    "comercios": [
      {"comercio_id": 1, "nombre": "Sucursal Centro"},
      {"comercio_id": 2, "nombre": "Sucursal Norte"}
    ]
  }
}
```

---

### 🏢 Tenants

#### GET /api/tenants
**Descripción:** Obtener tenants (admin ve su propio tenant)
**Autenticación:** ✅ Requiere (Admin)
**Body:** ❌ No requiere
**Query params:** `page=1&size=10`
**Respuesta exitosa:**
```json
{
  "data": [
    {
      "tenant_id": 1,
      "nombre": "Mi Negocio",
      "razon_social": "Mi Negocio S.A.",
      "cuenta_bancaria": "1234567890",
      "email": "admin@ejemplo.com",
      "telefono": "1234567890",
      "calle": "Av. Corrientes",
      "numero": "1234",
      "ciudad": "Buenos Aires",
      "provincia": "CABA",
      "codigo_postal": "1043"
    }
  ],
  "pagination": {
    "totalItems": 1,
    "totalPages": 1,
    "currentPage": 1
  }
}
```

#### POST /api/tenants
**Descripción:** Crear nuevo tenant
**Autenticación:** ✅ Requiere (Super Admin)
**Body requerido:**
```json
{
  "nombre": "Nuevo Negocio",
  "razon_social": "Nuevo Negocio S.A.",
  "cuenta_bancaria": "9876543210",
  "email": "nuevo@ejemplo.com",
  "telefono": "9876543210",
  "calle": "Av. Santa Fe",
  "numero": "5678",
  "ciudad": "Buenos Aires",
  "provincia": "CABA",
  "codigo_postal": "1425"
}
```

#### PATCH /api/tenants/:tenantId
**Descripción:** Actualizar tenant (solo el propio)
**Autenticación:** ✅ Requiere (Admin del mismo tenant)
**Body:** Campos opcionales para actualizar
```json
{
  "nombre": "Nuevo Nombre",
  "telefono": "1111111111"
}
```

#### DELETE /api/tenants/:tenantId
**Descripción:** Eliminar tenant (solo el propio)
**Autenticación:** ✅ Requiere (Admin del mismo tenant)
**Body:** ❌ No requiere
**Respuesta exitosa:**
```json
{
  "message": "Tenant eliminado",
  "tenant_id": 1
}
```

---

### 🏪 Sellers (Comercios)

#### GET /api/sellers
**Descripción:** Obtener comercios del tenant O buscar cercanos
**Autenticación:** ✅ Requiere
**Body:** ❌ No requiere
**Query params opcionales:**
- Sin params: Lista comercios del tenant
- `lat=-34.6037&lon=-58.3816`: Busca comercios cercanos (5km)
- `page=1&size=10`: Paginación (solo para lista del tenant)

**Respuesta (lista del tenant):**
```json
{
  "success": true,
  "data": [
    {
      "comercio_id": 1,
      "tenant_id": 1,
      "nombre": "Sucursal Centro",
      "calle": "Av. Corrientes",
      "numero": "1234",
      "ciudad": "Buenos Aires",
      "provincia": "CABA",
      "codigo_postal": "1043",
      "lat": -34.6037,
      "lon": -58.3816,
      "horarios": [
        {
          "dia_semana": 1,
          "dia_nombre": "Lunes",
          "hora_apertura": "09:00",
          "hora_cierre": "18:00",
          "estado": "activo"
        }
      ]
    }
  ],
  "pagination": {
    "page": 1,
    "size": 10,
    "totalItems": 5,
    "totalPages": 1
  }
}
```

#### GET /api/sellers/:id
**Descripción:** Obtener comercio específico
**Autenticación:** ✅ Requiere
**Body:** ❌ No requiere
**Respuesta exitosa:**
```json
{
  "success": true,
  "data": {
    "comercio_id": 1,
    "tenant_id": 1,
    "nombre": "Sucursal Centro",
    "calle": "Av. Corrientes",
    "numero": "1234",
    "ciudad": "Buenos Aires",
    "horarios": [...]
  }
}
```

#### POST /api/sellers
**Descripción:** Crear nuevo comercio
**Autenticación:** ✅ Requiere
**Body requerido:**
```json
{
  "nombre": "Nueva Sucursal",
  "calle": "Av. Santa Fe",
  "numero": "5678",
  "ciudad": "Buenos Aires",
  "provincia": "CABA",
  "codigo_postal": "1425",
  "horarios": [
    {
      "dia_semana": 1,
      "hora_apertura": "09:00",
      "hora_cierre": "18:00"
    }
  ]
}
```

#### PATCH /api/sellers/:id
**Descripción:** Actualizar comercio
**Autenticación:** ✅ Requiere (acceso al comercio)
**Body:** Campos opcionales para actualizar
```json
{
  "nombre": "Nuevo Nombre",
  "horarios": [
    {
      "dia_semana": 1,
      "hora_apertura": "08:00",
      "hora_cierre": "19:00"
    }
  ]
}
```

#### DELETE /api/sellers/:id
**Descripción:** Eliminar comercio
**Autenticación:** ✅ Requiere (acceso al comercio)
**Body:** ❌ No requiere

---

### 📦 Productos

#### GET /api/products
**Descripción:** Obtener productos del tenant
**Autenticación:** ✅ Requiere
**Body:** ❌ No requiere
**Respuesta exitosa:**
```json
[
  {
    "producto_id": 1,
    "tenant_id": 1,
    "nombre_producto": "Pizza Margherita",
    "descripcion": "Pizza clásica con tomate y mozzarella",
    "precio": 850.50,
    "categoria_id": 1,
    "categoria_nombre": "Pizzas",
    "imagenes": [
      {
        "imagen_id": 1,
        "url": "https://res.cloudinary.com/.../image.jpg",
        "descripcion": "Imagen principal"
      }
    ],
    "promociones": []
  }
]
```

#### GET /api/products/:productId
**Descripción:** Obtener producto específico
**Autenticación:** ✅ Requiere
**Body:** ❌ No requiere

#### POST /api/products
**Descripción:** Crear nuevo producto
**Autenticación:** ✅ Requiere
**Body requerido (multipart/form-data):**
```json
{
  "nombre_producto": "Pizza Margherita",
  "descripcion": "Pizza clásica con tomate y mozzarella",
  "precio": 850.50,
  "categoria_id": 1
}
```
**Files:** `imagenes` (máximo 5 imágenes)

#### PATCH /api/products/:productId
**Descripción:** Actualizar producto
**Autenticación:** ✅ Requiere (producto del mismo tenant)
**Body:** Campos opcionales para actualizar (multipart/form-data)

#### DELETE /api/products/:productId
**Descripción:** Eliminar producto
**Autenticación:** ✅ Requiere (producto del mismo tenant)
**Body:** ❌ No requiere
**Respuesta exitosa:**
```json
{
  "message": "Producto eliminado exitosamente",
  "deleted_product": {
    "tenant_id": 1,
    "producto_id": 1,
    "nombre_producto": "Pizza Margherita"
  }
}
```

#### GET /api/products/csv/template
**Descripción:** Obtener template CSV para carga masiva
**Autenticación:** ✅ Requiere
**Body:** ❌ No requiere

#### POST /api/products/csv/upload
**Descripción:** Subir CSV con productos (solo admins)
**Autenticación:** ✅ Requiere (Admin)
**Body:** File CSV
**Content-Type:** multipart/form-data

---

### 🏪 Stock de Comercios

#### GET /api/sellers/:id/products
**Descripción:** Obtener productos con stock del comercio
**Autenticación:** ✅ Requiere (acceso al comercio)
**Body:** ❌ No requiere
**Respuesta exitosa:**
```json
{
  "success": true,
  "data": {
    "comercio": {
      "comercio_id": 1,
      "nombre": "Sucursal Centro",
      "tenant_id": 1
    },
    "productos": [
      {
        "producto_id": 1,
        "nombre_producto": "Pizza Margherita",
        "precio": 850.50,
        "cantidad_stock": 25,
        "imagenes": [...],
        "promociones": [...]
      }
    ]
  }
}
```

#### GET /api/sellers/:id/products/:productId/stock
**Descripción:** Obtener stock específico de un producto
**Autenticación:** ✅ Requiere (acceso al comercio)
**Body:** ❌ No requiere

#### PATCH /api/sellers/:id/products/:productId/stock
**Descripción:** Actualizar stock de un producto
**Autenticación:** ✅ Requiere (acceso al comercio)
**Body requerido:**
```json
{
  "cantidad_stock": 30
}
```

---

### 🏷️ Categorías

#### GET /api/categories
**Descripción:** Obtener categorías con productos del tenant
**Autenticación:** ✅ Requiere
**Body:** ❌ No requiere
**Respuesta exitosa:**
```json
[
  {
    "categoria_id": 1,
    "nombre": "Pizzas",
    "descripcion": "Pizzas artesanales",
    "fecha_creacion": "2024-01-15T10:30:00.000Z"
  },
  {
    "categoria_id": 2,
    "nombre": "Hamburguesas",
    "descripcion": "Hamburguesas gourmet",
    "fecha_creacion": "2024-01-15T10:35:00.000Z"
  }
]
```

#### GET /api/categories/:categoriaId
**Descripción:** Obtener categoría específica
**Autenticación:** ✅ Requiere
**Body:** ❌ No requiere

#### POST /api/categories
**Descripción:** Crear nueva categoría (solo admins)
**Autenticación:** ✅ Requiere (Admin)
**Body requerido:**
```json
{
  "nombre": "Bebidas",
  "descripcion": "Bebidas frías y calientes"
}
```

#### PATCH /api/categories/:categoriaId
**Descripción:** Actualizar categoría (solo admins con productos asociados)
**Autenticación:** ✅ Requiere (Admin)
**Body:** Campos opcionales para actualizar
```json
{
  "nombre": "Nuevo Nombre",
  "descripcion": "Nueva descripción"
}
```

#### DELETE /api/categories/:categoriaId
**Descripción:** Eliminar categoría (solo admins sin productos asociados)
**Autenticación:** ✅ Requiere (Admin)
**Body:** ❌ No requiere

---

### 🎯 Promociones

#### GET /api/promotions
**Descripción:** Obtener promociones del tenant
**Autenticación:** ✅ Requiere
**Body:** ❌ No requiere
**Respuesta exitosa:**
```json
[
  {
    "promocion_id": 1,
    "nombre": "2x1 en Pizzas",
    "tipo_promocion": "porcentaje",
    "valor_descuento": 50.00,
    "fecha_inicio": "2024-01-15T00:00:00.000Z",
    "fecha_fin": "2024-01-31T23:59:59.000Z",
    "productos": [
      {
        "producto_id": 1,
        "nombre_producto": "Pizza Margherita",
        "precio": 850.50
      }
    ]
  }
]
```

#### POST /api/promotions
**Descripción:** Crear nueva promoción
**Autenticación:** ✅ Requiere
**Body requerido:**
```json
{
  "nombre": "2x1 en Pizzas",
  "tipo_promocion": "porcentaje",
  "valor_descuento": 50.00,
  "lista_productos": [1, 2, 3],
  "fecha_inicio": "2024-01-15T00:00:00.000Z",
  "fecha_fin": "2024-01-31T23:59:59.000Z"
}
```

#### PATCH /api/promotions/:promotionId
**Descripción:** Actualizar promoción
**Autenticación:** ✅ Requiere
**Body:** Campos opcionales para actualizar

#### DELETE /api/promotions/:promotionId
**Descripción:** Eliminar promoción
**Autenticación:** ✅ Requiere
**Body:** ❌ No requiere

---

### 📋 Órdenes

#### GET /api/orders/:comercio_id
**Descripción:** Obtener órdenes de un comercio
**Autenticación:** ✅ Requiere (acceso al comercio)
**Body:** ❌ No requiere
**Respuesta exitosa:**
```json
{
  "success": true,
  "data": [
    {
      "orden_id": 1,
      "tenant_id": 1,
      "comercio_id": 1,
      "cliente_nombre": "Juan Pérez",
      "medios_pago": "fiat",
      "estado": "pendiente",
      "total": 1250.75,
      "direccion_entrega": "Av. Corrientes 1234, CABA",
      "fecha_creacion": "2024-01-15T14:30:00.000Z"
    }
  ]
}
```

---

### 🔗 Callbacks (Sin Autenticación)

#### GET /callback
**Descripción:** Verificación de suscripción del hub de eventos
**Autenticación:** ❌ No requiere (endpoint público)
**Body:** ❌ No requiere
**Query params:** `topic` y `challenge`

#### POST /callback
**Descripción:** Recepción de eventos del hub
**Autenticación:** ❌ No requiere (endpoint público)
**Body:** Estructura de evento
```json
{
  "event": "tipo.evento",
  "data": {...}
}
```

---

## 🔒 Autorización por Roles

### Admin
- Puede acceder a todos los recursos de su tenant
- Puede crear/modificar/eliminar categorías y promociones
- Puede crear usuarios internos
- Puede gestionar todos los comercios de su tenant

### Operador
- Solo puede acceder a comercios asignados
- Puede gestionar productos y stock de sus comercios
- No puede crear/eliminar categorías o promociones

---

## 🚨 Códigos de Error Comunes

- `401`: Token JWT faltante o inválido
- `403`: Sin permisos para acceder al recurso
- `404`: Recurso no encontrado
- `400`: Datos inválidos en el body
- `500`: Error interno del servidor

---

## 📁 Estructura de carpetas

```bash
src/
│
├── config/           # Configuración general
│   ├── db_connection.js
│   ├── db_model.sql
│   ├── multerConfig.js
│   └── csvMulterConfig.js
│
├── controllers/      # Controladores con lógica de negocio
│   ├── authController.js      # Autenticación JWT
│   ├── tenantController.js
│   ├── productController.js
│   ├── sellerController.js
│   ├── categoriesController.js
│   ├── promotionsController.js
│   ├── orderController.js
│   └── callbackController.js
│
├── middlewares/      # Middlewares de autenticación
│   └── authMiddleware.js      # JWT y validaciones
│
├── models/           # Modelos de datos
│   ├── user.model.js
│   ├── tenant.model.js
│   ├── producto.model.js
│   ├── seller.model.js
│   ├── categoria.model.js
│   ├── promocion.model.js
│   └── order.model.js
│
├── routes/           # Rutas HTTP
│   ├── authRoutes.js
│   ├── tenantRoutes.js
│   ├── productRoutes.js
│   ├── sellerRoutes.js
│   ├── categoriesRoutes.js
│   ├── promotionsRoutes.js
│   ├── orderRoutes.js
│   └── callbackRoutes.js
│
├── services/         # Servicios externos
│   ├── jwtService.js          # Manejo de tokens JWT
│   ├── geocodingService.js
│   ├── imageUploadService.js
│   └── timeServices.js
│
├── events/           # Sistema de eventos
│   ├── handlers/
│   ├── publishers/
│   ├── subscribers/
│   └── utils/
│
├── utils/           # Utilidades
│   └── formatters.js
│
└── app.js             # Punto de entrada del servidor
```