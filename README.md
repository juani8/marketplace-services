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
│   └── sellerController.js
│
├── middlewares/      # Middlewares personalizados (próximamente)
│
├── models/           # Modelos de datos
│   ├── tenant.model.js
│   ├── catalogo.model.js
│   ├── producto.model.js
│   └── promocion.model.js
│
├── routes/           # Rutas HTTP
│   ├── tenantRoutes.js
│   ├── catalogRoutes.js
│   ├── productRoutes.js
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

| Columna           | Tipo                         | Nullable | Descripción                                |
|-------------------|------------------------------|----------|--------------------------------------------|
| tenant_id         | SERIAL (PK)                  | NO       | Identificador único del tenant             |
| nombre            | VARCHAR(100)                 | NO       | Nombre del comercio                        |
| razon_social      | VARCHAR(150)                 | SÍ       | Razón social registrada                    |
| cuenta_bancaria   | VARCHAR(100)                 | SÍ       | Cuenta bancaria asociada                   |
| calle             | VARCHAR(100)                 | SÍ       | Calle de la dirección                      |
| numero            | VARCHAR(20)                  | SÍ       | Número de la dirección                     |
| ciudad            | VARCHAR(100)                 | SÍ       | Ciudad                                     |
| provincia         | VARCHAR(100)                 | SÍ       | Provincia                                  |
| codigo_postal     | VARCHAR(10)                  | SÍ       | Código postal                              |
| lon               | NUMERIC(9,6)                 | SÍ       | Longitud geográfica                        |
| lat               | NUMERIC(9,6)                 | SÍ       | Latitud geográfica                         |
| horario_apertura  | TIME                         | SÍ       | Hora de apertura                           |
| horario_cierre    | TIME                         | SÍ       | Hora de cierre                             |
| estado            | VARCHAR(20)                 | NO       | Estado del tenant (`activo`, `inactivo`)   |
| fecha_registro    | TIMESTAMP                   | NO       | Fecha de creación del registro             |
| fecha_actualizacion | TIMESTAMP                 | NO       | Fecha de última actualización              |

---

### 📦 Productos

| Columna         | Tipo                         | Nullable | Descripción                              |
|-----------------|------------------------------|----------|------------------------------------------|
| producto_id     | SERIAL (PK)                  | NO       | Identificador único del producto         |
| tenant_id       | INTEGER (FK)                 | NO       | Referencia al tenant                     |
| categoria_id    | INTEGER (FK)                 | NO       | Referencia a la categoría                |
| nombre_producto | VARCHAR(100)                 | NO       | Nombre del producto                      |
| descripcion     | VARCHAR(255)                 | SÍ       | Descripción detallada                    |
| precio          | NUMERIC(10,2)                | SÍ       | Precio del producto                      |
| cantidad_stock  | INTEGER                      | SÍ       | Stock disponible                         |
| fecha_creacion  | TIMESTAMP                    | NO       | Fecha de creación del producto           |

---

### 📸 Imágenes de Producto

| Columna         | Tipo                         | Nullable | Descripción                              |
|-----------------|------------------------------|----------|------------------------------------------|
| imagen_id       | SERIAL (PK)                  | NO       | Identificador de la imagen               |
| producto_id     | INTEGER (FK)                 | NO       | Referencia al producto                   |
| url             | VARCHAR(255)                 | NO       | URL de la imagen                         |
| descripcion     | VARCHAR(255)                 | SÍ       | Descripción de la imagen                 |
| fecha_creacion  | TIMESTAMP                    | NO       | Fecha de creación del registro           |

---

### 🎁 Promociones

| Columna         | Tipo                         | Nullable | Descripción                              |
|-----------------|------------------------------|----------|------------------------------------------|
| promocion_id    | SERIAL (PK)                  | NO       | Identificador de la promoción            |
| producto_id     | INTEGER (FK)                 | NO       | Producto al que aplica la promoción      |
| nombre          | VARCHAR(100)                 | NO       | Nombre de la promoción                   |
| descripcion     | VARCHAR(255)                 | SÍ       | Detalles adicionales                     |
| tipo_promocion  | VARCHAR(100)                 | SÍ       | Tipo (descuento, 2x1, etc.)              |
| fecha_inicio    | TIMESTAMP                    | SÍ       | Inicio de la promoción                   |
| fecha_fin       | TIMESTAMP                    | SÍ       | Fin de la promoción                      |
| estado          | VARCHAR(50)                  | SÍ       | Estado (`activo`, `inactivo`)            |

---

### 📇 Datos de Contacto

| Columna         | Tipo                         | Nullable | Descripción                              |
|-----------------|------------------------------|----------|------------------------------------------|
| contacto_id     | SERIAL (PK)                  | NO       | Identificador del contacto               |
| tenant_id       | INTEGER (FK)                 | NO       | Relación 1:1 con el tenant               |
| email           | VARCHAR(100)                 | SÍ       | Correo electrónico                       |
| telefono        | VARCHAR(20)                  | SÍ       | Teléfono fijo                            |
| movil           | VARCHAR(20)                  | SÍ       | Teléfono móvil                           |
| direccion       | VARCHAR(200)                 | SÍ       | Dirección completa                       |
| sitio_web       | VARCHAR(100)                 | SÍ       | Página web                               |
| linkedin        | VARCHAR(100)                 | SÍ       | Enlace a perfil de LinkedIn              |
| fecha_creacion  | TIMESTAMP                    | NO       | Fecha de registro                        |

---

### 🗂️ Categorías

| Columna         | Tipo                         | Nullable | Descripción                              |
|-----------------|------------------------------|----------|------------------------------------------|
| categoria_id    | SERIAL (PK)                  | NO       | Identificador de la categoría            |
| nombre          | VARCHAR(100)                 | NO       | Nombre de la categoría                   |
| descripcion     | VARCHAR(255)                 | SÍ       | Descripción adicional                    |
| fecha_creacion  | TIMESTAMP                    | NO       | Fecha de creación del registro           |

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
  "categoria": "Pizzas",
  "imagenes": [
    "https://res.cloudinary.com/your-cloud/image/upload/v1234/marketplace/pizza-margherita.jpg"
  ],
  "promociones": []
}
```

---

#### `POST /api/catalogs/:catalogId/products`

Crea un nuevo producto en un catálogo específico.

##### Parámetros de URL
| Parámetro | Tipo    | Obligatorio | Descripción |
|:----------|:--------|:------------|:------------|
| catalogId | integer | Sí          | ID del catálogo |

##### Multipart Form Data
| Campo           | Tipo           | Obligatorio | Descripción |
|:----------------|:---------------|:------------|:------------|
| nombre_producto | string         | Sí          | Nombre del producto |
| descripcion     | string         | No          | Descripción del producto |
| precio          | number         | Sí          | Precio del producto |
| cantidad_stock  | number         | No          | Cantidad en stock |
| categoria       | string         | No          | Categoría del producto |
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
    "categoria": "Pizzas",
    "imagenes": [
      "https://res.cloudinary.com/your-cloud/image/upload/v1234/marketplace/image1.jpg",
      "https://res.cloudinary.com/your-cloud/image/upload/v1234/marketplace/image2.jpg"
    ],
    "promociones": []
  }
}
```

---

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
| categoria       | string         | No          | Categoría del producto |
| imagenes        | file (máx. 5)  | No          | Archivos de imagen (máx. 5MB c/u) |



##### 📄 Ejemplo de respuesta
```json
{
  "message": "Producto actualizado exitosamente",
  "producto": {
    "producto_id": "2",
    "nombre_producto": "Pizza Especial",
    "descripcion": "Pizza con jamón, morrón, huevo y aceitunas",
    "precio": 4100,
    "cantidad_stock": 25,
    "categoria": "Pizzas",
    "imagenes": [
      "https://res.cloudinary.com/your-cloud/image/upload/v1234/marketplace/new-image.jpg"
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
    "seller_id": "1",
    "catalogo_id": "1",
    "producto_id": "2",
    "nombre_producto": "Pizza Especial"
  }
}
```
```
