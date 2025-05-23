# 🛠️ Backend Marketplace - Node.js + Express + PostgreSQL

Este proyecto es un backend desarrollado con **Node.js** y **Express**, utilizando una base de datos **PostgreSQL** desplegada en **Render**. Está diseñado para gestionar múltiples comercios (tenants) y sus respectivos catálogos, productos y promociones.

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

## 📦 Instalación de dependencias

Este proyecto requiere las siguientes dependencias:

- `dotenv`: Manejo de variables de entorno.
- `cors`: Habilita peticiones cross-origin desde el frontend.
- `morgan`: Middleware de logging.
- `pg`: Cliente de PostgreSQL para Node.js.
- `nodemon`: Recarga automática del servidor durante el desarrollo.
- `multer`: Manejo de subida de archivos.
- `cloudinary`: Servicio de almacenamiento de imágenes en la nube.

Instalarlas mediante el siguiente comando:
```bash
npm install
```

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
```

---

## 📁 Estructura de carpetas

```bash
src/
│
├── config/           # Configuración general (base de datos, variables de entorno)
│   ├── db_connection.js
│   ├── db_model.sql
│   ├── db_init_model.js
│   ├── db_exec_drop_tables.js
│   └── multerConfig.js      # Configuración de multer para subida de imágenes
│
├── controllers/      # Controladores con la lógica de negocio
│   ├── tenantController.js
│   ├── catalogController.js
│   ├── productController.js
│   ├── promotionsController.js
│   ├── categoriesController.js
│   └── sellerController.js
│
├── middlewares/      # Middlewares personalizados (próximamente)
│
├── models/           # Modelos de datos
│   ├── tenant.model.js
│   ├── catalogo.model.js
│   ├── producto.model.js
│   ├── promocion.model.js
│   └── categoria.model.js
│
├── routes/           # Rutas HTTP
│   ├── tenantRoutes.js
│   ├── catalogRoutes.js
│   ├── productRoutes.js
│   ├── promotionsRoutes.js
│   ├── categoriesRoutes.js
│   └── sellerRoutes.js
│
├── services/         # Servicios externos y utilidades
│   ├── geocodingService.js
│   ├── publisherService.js
│   └── imageUploadService.js  # Servicio de subida de imágenes a Cloudinary
│
├── utils/           # Utilidades y helpers
│   └── formatters.js
│
└── app.js             # Configuración, uso de middlewares y punto de entrada del servidor
```

---

## 🌐 Conexión segura a la base de datos en Render

Render exige el uso de conexiones **SSL seguras**. Por eso, en `db.js` se debe incluir:

```js
ssl: {
  rejectUnauthorized: false
}
```

> ⚠️ Este bloque es **obligatorio**. No eliminar.

---

## 📋 Estructura de la base de datos

A continuación se detalla el modelo relacional utilizado en la base de datos PostgreSQL:

### 🏢 Tenants

| Columna                  | Tipo                         | Nullable |
|---------------------------|------------------------------|----------|
| tenant_id                 | integer (PK)                 | NO       |
| nombre                    | varchar(100)                 | NO       |
| razon_social              | varchar(150)                 | SÍ       |
| cuenta_bancaria           | varchar(100)                 | SÍ       |
| calle                     | varchar(100)                 | SÍ       |
| numero                    | varchar(20)                  | SÍ       |
| ciudad                    | varchar(100)                 | SÍ       |
| provincia                 | varchar(100)                 | SÍ       |
| codigo_postal             | varchar(10)                  | SÍ       |
| lon                       | numeric(9,6)                 | SÍ       |
| lat                       | numeric(9,6)                 | SÍ       |
| configuracion_operativa   | jsonb                        | SÍ       |
| estado                    | varchar(20)                  | SÍ       |
| fecha_registro            | timestamp without time zone  | SÍ       |
| fecha_actualizacion       | timestamp without time zone  | SÍ       |

---

### 📦 Catálogos

| Columna           | Tipo                         | Nullable |
|-------------------|------------------------------|----------|
| catalogo_id       | integer (PK)                 | NO       |
| tenant_id         | integer                      | SÍ       |
| fecha_actualizacion | timestamp without time zone | SÍ       |

---

### 🛂 Productos

| Columna         | Tipo                         | Nullable |
|-----------------|------------------------------|----------|
| producto_id     | integer (PK)                 | NO       |
| catalogo_id     | integer                      | SÍ       |
| nombre_producto | text                         | NO       |
| descripcion     | text                         | SÍ       |
| precio          | numeric                      | SÍ       |
| cantidad_stock  | integer                      | SÍ       |
| categoria       | text                         | SÍ       |
| imagenes        | array                        | SÍ       |
| fecha_creacion  | timestamp without time zone  | SÍ       |

---

### 🏱️ Promociones

| Columna         | Tipo                         | Nullable |
|-----------------|------------------------------|----------|
| promocion_id    | integer (PK)                 | NO       |
| nombre          | varchar(100)                 | NO       |
| tipo_promocion  | varchar(20)                  | NO       |
| valor_descuento | numeric(10,2)                | NO       |
| fecha_inicio    | timestamp                    | NO       |
| fecha_fin       | timestamp                    | NO       |

---

### 🔗 Promociones - Productos

| Columna       | Tipo     | Nullable |
|---------------|----------|----------|
| promocion_id  | integer  | NO       |
| producto_id   | integer  | NO       |

---

### 📸 Imágenes de Producto

| Columna         | Tipo                         | Nullable |
|-----------------|------------------------------|----------|
| imagen_id       | integer (PK)                 | NO       |
| producto_id     | integer (FK)                 | NO       |
| url             | varchar(255)                 | NO       |
| descripcion     | varchar(255)                 | SÍ       |
| fecha_creacion  | timestamp                    | NO       |

---

## 🌍 Despliegue en Render

Este proyecto fue desplegado de la siguiente forma:

- **Backend**: Node.js + Express, desplegado como Web Service.
- **Base de Datos**: PostgreSQL, desplegada como servicio de base de datos en Render.

Todos los servicios se comunican entre sí utilizando HTTPS y conexiones seguras.

---

## 📄 Endpoints - API

### 🏢 **Tenants**

#### `GET /api/tenants`

Obtiene una lista paginada de todos los tenants registrados.

#####  Query Parameters

| Parámetro | Tipo    | Opcional | Descripción |
|:-----------|:--------|:---------|:------------|
| page       | integer | Sí       | Número de página (default: 1) |
| size       | integer | Sí       | Tamaño de página (default: 10) |

##### 📄 Ejemplo de respuesta

```json
{
  "data": [
    {
      "tenant_id": 1,
      "nombre": "Supermercado La Plaza",
      "razon_social": "La Plaza SRL",
      "cuenta_bancaria": "123-456-789",
      "direccion": "Av. Siempre Viva 742",
      "lat": -34.603722,
      "lon": -58.381592,
      "configuracion_operativa": {},
      "estado": "activo",
      "fecha_registro": "2025-04-27T15:00:00.000Z",
      "fecha_actualizacion": "2025-04-27T15:00:00.000Z",
      "email": "contacto@laplaza.com",
      "telefono": "011-1234-5678",
      "movil": "11-6543-2109",
      "direccion_contacto": "Sucursal 1, CABA",
      "sitio_web": "https://laplaza.com",
      "linkedin": "https://linkedin.com/company/laplaza"
    }
  ],
  "pagination": {
    "totalItems": 42,
    "totalPages": 5,
    "currentPage": 2
  }
}
```

---

#### `POST /api/tenants`

Crea un nuevo tenant.

- La dirección se geocodifica automáticamente a lat/lon.

#####  Body esperado

| Campo                     | Tipo     | Obligatorio | Descripción                                                  |
|:---------------------------|:---------|:------------|:-------------------------------------------------------------|
| `nombre`                   | string   | Sí          | Nombre del tenant (comercio o empresa).                      |
| `razon_social`             | string   | Sí          | Razón social registrada del tenant.                         |
| `cuenta_bancaria`          | string   | No          | Cuenta bancaria asociada (opcional).                         |
| `direccion`                | string   | No          | Dirección física del tenant (opcional).                      |
| `configuracion_operativa`  | JSON     | No          | Configuraciones internas (horarios de atención, políticas, etc). |


```json
{
  "nombre": "Supermercado La Plaza",
  "razon_social": "La Plaza SRL",
  "cuenta_bancaria": "123-456-789",
  "direccion": "Av. Corrientes 1000, CABA, Argentina",
  "configuracion_operativa": {
    "horario_apertura": "09:00",
    "horario_cierre": "18:00"
  }
}
```

---

#### `PATCH /api/tenants/:tenantId`

Actualiza parcialmente los datos de un tenant existente.

##### 📥 Body

Debe enviarse un JSON con **uno o más** de los siguientes campos:

| Campo                     | Tipo     | Obligatorio | Descripción                                                  |
|:---------------------------|:---------|:------------|:-------------------------------------------------------------|
| `nombre`                   | string   | No           | Nombre del tenant (comercio o empresa).                      |
| `razon_social`             | string   | No           | Razón social registrada del tenant.                         |
| `cuenta_bancaria`          | string   | No           | Cuenta bancaria asociada (opcional).                         |
| `direccion`                | string   | No           | Dirección física del tenant (opcional).                      |
| `configuracion_operativa`  | JSON     | No           | Configuraciones internas (horarios de atención, políticas, etc.). |


**Ejemplo de body (actualización parcial):**

```json
{
  "nombre": "Nuevo Nombre Actualizado",
  "cuenta_bancaria": "999-888-777"
}
```

#### `DELETE /api/tenants/:tenantId`

Elimina un tenant.

- Emite evento `baja_tenant_iniciada`.
- Respuesta: **204 No Content**

---

### 🛂 **Sellers (consulta de tenants cercanos)**

#### `GET /api/sellers?lat={lat}&lon={lon}`

Devuelve sellers cercanos según la ubicación del cliente.

- Radio de entrega de 5 km.
- Ordenado de **más cercano a más lejano**.

#####  Query Parameters

| Parámetro | Tipo    | Obligatorio | Descripción |
|:-----------|:--------|:------------|:------------|
| lat        | decimal | Sí          | Latitud cliente |
| lon        | decimal | Sí          | Longitud cliente |

##### 📄 Ejemplo de respuesta

```json
[
  {
    "tenant_id": 13,
    "nombre": "Café Obelisco",
    "direccion": "Av. Corrientes 1100, CABA",
    "lat": -34.603500,
    "lon": -58.381000,
    "configuracion_operativa": {
      "tipo": "cafetería"
    },
    "estado": "activo",
    "distance_km": 0.0595
  }
]
```

### 📦 **Catálogos**

#### `GET /api/sellers/:sellerId/catalogs`

Obtiene todos los catálogos de un seller específico.

##### Parámetros de URL
| Parámetro | Tipo    | Obligatorio | Descripción |
|:----------|:--------|:------------|:------------|
| sellerId  | integer | Sí          | ID del seller |

##### 📄 Ejemplo de respuesta
```json
[
  {
    "catalogo_id": "1",
    "tenant_id": "1",
    "productos": [
      {
        "producto_id": "1",
        "nombre_producto": "Pizza Margherita",
        "descripcion": "Pizza con salsa de tomate, mozzarella y albahaca",
        "precio": 3500,
        "cantidad_stock": 20,
        "categoria": "Pizzas",
        "imagenes": [
          "https://res.cloudinary.com/your-cloud/image/upload/v1234/marketplace/pizza-margherita.jpg"
        ],
        "promociones": [
          {
            "promocion_id": "1",
            "tenant_id": "1",
            "nombre": "2x1 en Pizzas",
            "descripcion": "Llevá 2 pizzas al precio de 1",
            "tipo_promocion": "2x1",
            "fecha_inicio": "2024-03-27T15:00:00.000Z",
            "fecha_fin": "2024-04-27T15:00:00.000Z",
            "productos_incluidos": ["1"],
            "estado": "activa"
          }
        ]
      }
    ],
    "fecha_actualizacion": "2024-03-27T15:00:00.000Z"
  }
]
```

---

#### `GET /api/catalogs/:catalogId`

Obtiene un catálogo específico por su ID.

##### Parámetros de URL
| Parámetro | Tipo    | Obligatorio | Descripción |
|:----------|:--------|:------------|:------------|
| catalogId | integer | Sí          | ID del catálogo |

##### 📄 Ejemplo de respuesta
```json
{
  "catalogo_id": "1",
  "tenant_id": "1",
  "productos": [],
  "fecha_actualizacion": "2024-03-27T15:00:00.000Z"
}
```

---

#### `POST /api/sellers/:sellerId/catalogs`

Crea un nuevo catálogo para un seller.

##### Parámetros de URL
| Parámetro | Tipo    | Obligatorio | Descripción |
|:----------|:--------|:------------|:------------|
| sellerId  | integer | Sí          | ID del seller |

##### 📄 Ejemplo de respuesta
```json
{
  "catalogo_id": "1",
  "tenant_id": "1",
  "productos": [],
  "fecha_actualizacion": "2024-03-27T15:00:00.000Z"
}
```

---

#### `DELETE /api/catalogs/:catalogId`

Elimina un catálogo específico.

##### Parámetros de URL
| Parámetro | Tipo    | Obligatorio | Descripción |
|:----------|:--------|:------------|:------------|
| catalogId | integer | Sí          | ID del catálogo |

##### 📄 Ejemplo de respuesta
```json
{
  "message": "Catálogo ID 1 del seller ID 1 fue eliminado exitosamente",
  "deleted_catalog": {
    "catalogo_id": "1",
    "tenant_id": "1"
  }
}
```

---

#### `GET /api/catalogs/:catalogId/products`

Obtiene todos los productos de un catálogo específico.

##### Parámetros de URL
| Parámetro | Tipo    | Obligatorio | Descripción |
|:----------|:--------|:------------|:------------|
| catalogId | integer | Sí          | ID del catálogo |

##### 📄 Ejemplo de respuesta
```json
[
  {
    "producto_id": "1",
    "nombre_producto": "Pizza Margherita",
    "descripcion": "Pizza con salsa de tomate, mozzarella y albahaca",
    "precio": 3500,
    "cantidad_stock": 20,
    "categoria": "Pizzas",
    "imagenes": [
      "https://res.cloudinary.com/your-cloud/image/upload/v1234/marketplace/pizza-margherita.jpg"
    ],
    "promociones": []
  }
]
```

---

### 🛍️ **Productos**

#### `GET /api/products`

Obtiene todos los productos del tenant actual.

##### 📄 Ejemplo de respuesta
```json
[
  {
    "producto_id": "1",
    "nombre_producto": "Pizza Margherita",
    "descripcion": "Pizza con salsa de tomate, mozzarella y albahaca",
    "precio": 3500,
    "cantidad_stock": 20,
    "categoria": {
      "categoria_id": "1",
      "nombre": "Pizzas",
      "descripcion": "Pizzas tradicionales"
    },
    "imagenes": [
      "https://res.cloudinary.com/your-cloud/image/upload/v1234/marketplace/pizza-margherita.jpg"
    ],
    "promociones": []
  }
]
```

#### `GET /api/products/:productId`

Obtiene un producto específico por su ID.

##### Parámetros de URL
| Parámetro | Tipo    | Obligatorio | Descripción |
|:----------|:--------|:------------|:------------|
| productId | integer | Sí          | ID del producto |

##### 📄 Ejemplo de respuesta
```json
{
  "producto_id": "1",
  "nombre_producto": "Pizza Margherita",
  "descripcion": "Pizza con salsa de tomate, mozzarella y albahaca",
  "precio": 3500,
  "cantidad_stock": 20,
  "categoria": {
    "categoria_id": "1",
    "nombre": "Pizzas",
    "descripcion": "Pizzas tradicionales"
  },
  "imagenes": [
    "https://res.cloudinary.com/your-cloud/image/upload/v1234/marketplace/pizza-margherita.jpg"
  ],
  "promociones": []
}
```

#### `POST /api/products`

Crea un nuevo producto.

##### Multipart Form Data
| Campo           | Tipo           | Obligatorio | Descripción |
|:----------------|:---------------|:------------|:------------|
| nombre_producto | string         | Sí          | Nombre del producto |
| descripcion     | string         | No          | Descripción del producto |
| precio          | number         | Sí          | Precio del producto |
| cantidad_stock  | number         | No          | Cantidad en stock |
| categoria_id    | integer        | No          | ID de la categoría |
| imagenes        | file (máx. 5)  | No          | Archivos de imagen (máx. 5MB c/u) |

##### 📄 Ejemplo de respuesta
```json
{
  "message": "Producto creado exitosamente",
  "producto": {
    "producto_id": "2",
    "nombre_producto": "Pizza Especial",
    "descripcion": "Pizza con jamón, morrón, huevo y aceitunas",
    "precio": 4300,
    "cantidad_stock": 50,
    "categoria": {
      "categoria_id": "1",
      "nombre": "Pizzas",
      "descripcion": "Pizzas tradicionales"
    },
    "imagenes": [
      "https://res.cloudinary.com/your-cloud/image/upload/v1234/marketplace/image1.jpg",
      "https://res.cloudinary.com/your-cloud/image/upload/v1234/marketplace/image2.jpg"
    ],
    "promociones": []
  }
}
```

#### `PATCH /api/products/:productId`

Actualiza parcialmente un producto específico.

##### Parámetros de URL
| Parámetro | Tipo    | Obligatorio | Descripción |
|:----------|:--------|:------------|:------------|
| productId | integer | Sí          | ID del producto |

##### Multipart Form Data
| Campo           | Tipo           | Obligatorio | Descripción |
|:----------------|:---------------|:------------|:------------|
| nombre_producto | string         | No          | Nombre del producto |
| descripcion     | string         | No          | Descripción del producto |
| precio          | number         | No          | Precio del producto |
| cantidad_stock  | number         | No          | Cantidad en stock |
| categoria_id    | integer        | No          | ID de la categoría |
| imagenes        | file (máx. 5)  | No          | Archivos de imagen (máx. 5MB c/u) |

##### 📄 Ejemplo de respuesta
```json
{
  "message": "Producto actualizado exitosamente",
  "producto": {
    "producto_id": "2",
    "nombre_producto": "Pizza Especial Actualizada",
    "descripcion": "Pizza con jamón, morrón, huevo y aceitunas negras",
    "precio": 4500,
    "cantidad_stock": 45,
    "categoria": {
      "categoria_id": "1",
      "nombre": "Pizzas",
      "descripcion": "Pizzas tradicionales"
    },
    "imagenes": [
      "https://res.cloudinary.com/your-cloud/image/upload/v1234/marketplace/new-image1.jpg"
    ],
    "promociones": []
  }
}
```

> ⚠️ **Nota sobre las imágenes**: Al actualizar un producto con nuevas imágenes, las imágenes anteriores serán eliminadas y reemplazadas por las nuevas. Si no se envían nuevas imágenes, las existentes se mantendrán sin cambios.

---

#### `DELETE /api/products/:productId`

Elimina un producto específico.

##### Parámetros de URL
| Parámetro | Tipo    | Obligatorio | Descripción |
|:----------|:--------|:------------|:------------|
| productId | integer | Sí          | ID del producto |

##### 📄 Ejemplo de respuesta
```json
{
  "message": "Producto eliminado exitosamente",
  "deleted_product": {
    "tenant_id": "1",
    "producto_id": "2",
    "nombre_producto": "Pizza Especial"
  }
}
```

### 📑 **Categorías**

#### `GET /api/categories`

Obtiene todas las categorías disponibles.

##### 📄 Ejemplo de respuesta
```json
[
  {
    "categoria_id": 1,
    "nombre": "Pizzas",
    "descripcion": "Pizzas tradicionales",
    "fecha_creacion": "2024-03-27T15:00:00.000Z"
  },
  {
    "categoria_id": 2,
    "nombre": "Bebidas",
    "descripcion": "Bebidas frías y calientes",
    "fecha_creacion": "2024-03-27T15:00:00.000Z"
  }
]
```

#### `GET /api/categories/:categoriaId`

Obtiene una categoría específica por su ID.

##### Parámetros de URL
| Parámetro   | Tipo    | Obligatorio | Descripción |
|:------------|:--------|:------------|:------------|
| categoriaId | integer | Sí          | ID de la categoría |

##### 📄 Ejemplo de respuesta
```json
{
  "categoria_id": 1,
  "nombre": "Pizzas",
  "descripcion": "Pizzas tradicionales",
  "fecha_creacion": "2024-03-27T15:00:00.000Z"
}
```

#### `POST /api/categories`

Crea una nueva categoría.

##### Body (JSON)
| Campo      | Tipo   | Obligatorio | Descripción |
|:-----------|:-------|:------------|:------------|
| nombre     | string | Sí          | Nombre de la categoría |
| descripcion| string | No          | Descripción de la categoría |

##### 📄 Ejemplo de respuesta
```json
{
  "categoria_id": 3,
  "nombre": "Postres",
  "descripcion": "Postres caseros",
  "fecha_creacion": "2024-03-27T15:00:00.000Z"
}
```

#### `DELETE /api/categories/:categoriaId`

Elimina una categoría específica.

##### Parámetros de URL
| Parámetro   | Tipo    | Obligatorio | Descripción |
|:------------|:--------|:------------|:------------|
| categoriaId | integer | Sí          | ID de la categoría |

##### 📄 Ejemplo de respuesta
```json
{
  "message": "Categoría 3 eliminada correctamente"
}
```

### 🎯 **Promociones**

#### `GET /api/promotions`

Obtiene todas las promociones del tenant ID que trae el JWT.

##### 📄 Ejemplo de respuesta
```json
[
  {
    "promocion_id": 1,
    "nombre": "2x1 en Hamburguesas",
    "tipo_promocion": "porcentaje",
    "valor_descuento": 50,
    "fecha_inicio": "2024-03-20T00:00:00.000Z",
    "fecha_fin": "2024-04-20T00:00:00.000Z",
    "productos": [
      {
        "producto_id": 1,
        "nombre_producto": "Hamburguesa Clásica",
        "precio": 1500,
        "descripcion": "Hamburguesa con queso y lechuga",
        // ... otros campos del producto
      }
    ]
  }
]
```

---

#### `POST /api/promotions`

Crea una nueva promoción.

##### Body esperado
```json
{
  "nombre": "2x1 en Hamburguesas",
  "tipo_promocion": "porcentaje",
  "valor_descuento": 50,
  "fecha_inicio": "2024-03-20",
  "fecha_fin": "2024-04-20",
  "lista_productos": [1, 2] // IDs de productos existentes del tenant
}
```

##### 📄 Ejemplo de respuesta (201 Created)
```json
{
  "message": "Promoción creada exitosamente",
  "promocion": {
    "promocion_id": 1,
    "nombre": "2x1 en Hamburguesas",
    "tipo_promocion": "porcentaje",
    "valor_descuento": 50,
    "fecha_inicio": "2024-03-20T00:00:00.000Z",
    "fecha_fin": "2024-04-20T00:00:00.000Z",
    "productos": [
      {
        "producto_id": 1,
        "nombre_producto": "Hamburguesa Clásica",
        // ... detalles del producto
      }
    ]
  }
}
```

---

#### `PATCH /api/promotions/:promotionId`

Actualiza parcialmente una promoción existente.

##### Body esperado (campos opcionales)
```json
{
  "nombre": "3x2 en Hamburguesas",
  "tipo_promocion": "porcentaje",
  "valor_descuento": 33.33,
  "fecha_inicio": "2024-03-20",
  "fecha_fin": "2024-04-20",
  "lista_productos": [1, 2, 3]
}
```

##### 📄 Ejemplo de respuesta
```json
{
  "message": "Promoción actualizada exitosamente",
  "promocion": {
    "promocion_id": 1,
    "nombre": "3x2 en Hamburguesas",
    "tipo_promocion": "porcentaje",
    "valor_descuento": 33.33,
    "fecha_inicio": "2024-03-20T00:00:00.000Z",
    "fecha_fin": "2024-04-20T00:00:00.000Z",
    "productos": [
      // Lista actualizada de productos
    ]
  }
}
```

---

#### `DELETE /api/promotions/:promotionId`

Elimina una promoción específica.

##### 📄 Ejemplo de respuesta
```json
{
  "message": "Promoción eliminada exitosamente",
  "deleted_promotion_id": "1"
}
```

##### Notas importantes:
- El campo `tipo_promocion` solo acepta "monto" o "porcentaje"
- `valor_descuento` representa el porcentaje de descuento o el monto fijo según el tipo
- `fecha_inicio` debe ser anterior a `fecha_fin`
- Solo se pueden asociar productos que pertenezcan al mismo tenant
- Las fechas deben enviarse en formato ISO (YYYY-MM-DD)
```