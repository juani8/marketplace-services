# 🛠️ Backend Marketplace - Node.js + Express + PostgreSQL

Este proyecto es un backend desarrollado con **Node.js** y **Express**, utilizando una base de datos **PostgreSQL** desplegada en **Render**. Está diseñado para gestionar múltiples comercios (tenants) y sus respectivos catálogos, productos y promociones.

---

## 🚀 Scripts disponibles

```json
"scripts": {
  "dev": "nodemon src/app.js",
  "start": "node src/app.js",
  "init-db": "node src/config/db_init_model.js"
}
```

- `npm run dev`: Levanta el servidor en modo desarrollo con **nodemon**.
- `npm start`: Ejecuta el servidor en producción.
- `npm run init-db`: Inicializa las tablas en la base de datos (⚠️ ¡No correr, la base de datos ya fue creada!).

---

## 📦 Instalación de dependencias

Este proyecto requiere las siguientes dependencias:

- `dotenv`: Manejo de variables de entorno.
- `cors`: Habilita peticiones cross-origin desde el frontend.
- `morgan`: Middleware de logging.
- `pg`: Cliente de PostgreSQL para Node.js.
- `nodemon`: Recarga automática del servidor durante el desarrollo.
- `node-fetch`: (Usado para geolocalización)

Instalarlas mediante el siguiente comando:
```bash
npm install
```

---

## 📁 Estructura de carpetas

```bash
src/
│
├── config/           # Configuración general (base de datos, variables de entorno)
│
├── controllers/      # Controladores con la lógica de negocio
│   ├── tenant.controller.js
│   ├── catalogo.controller.js
│   ├── producto.controller.js
│   ├── promocion.controller.js
│   └── seller.controller.js
│
├── middlewares/      # Middlewares personalizados (próximamente)
│
├── models/           # Modelos de datos
│   ├── tenant.model.js
│   ├── catalogo.model.js
│   ├── producto.model.js
│   ├── promocion.model.js
│
├── routes/           # Rutas HTTP
│   ├── tenant.routes.js
│   ├── catalogo.routes.js
│   ├── producto.routes.js
│   ├── promocion.routes.js
│   └── seller.routes.js
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
| direccion                 | varchar(200)                 | SÍ       |
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
| tenant_id       | integer                      | SÍ       |
| nombre          | text                         | NO       |
| descripcion     | text                         | SÍ       |
| tipo_promocion  | text                         | SÍ       |
| fecha_inicio    | timestamp without time zone | SÍ       |
| fecha_fin       | timestamp without time zone | SÍ       |
| estado          | text                         | SÍ       |

---

### 🔗 Productos - Promociones

| Columna       | Tipo     | Nullable |
|---------------|----------|----------|
| promocion_id  | integer  | NO       |
| producto_id   | integer  | NO       |

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


### 🛂 **Sellers (Gestión de catálogos y productos)**

#### `GET /api/sellers/{sellerId}/catalog`

Obtiene todos los catálogos de un seller con sus productos.

##### 📄 Ejemplo de respuesta

```json
[
  {
    "catalogo_id": "1",
    "tenant_id": "1",
    "productos": [
      {
        "producto_id": "1",
        "nombre_producto": "Pizza Especial",
        "descripcion": "Pizza con jamón, morrón, huevo y aceitunas",
        "precio": 4300,
        "cantidad_stock": 50,
        "categoria": "Pizzas",
        "imagenes": ["https://ejemplo.com/imagen1.jpg"],
        "promociones": []
      }
    ],
    "fecha_actualizacion": "2024-03-20T15:00:00.000Z"
  }
]
```

#### `GET /api/sellers/{sellerId}/catalog/{catalogId}`

Obtiene un catálogo específico con todos sus productos.

##### 📄 Ejemplo de respuesta

```json
{
  "catalogo_id": "1",
  "tenant_id": "1",
  "productos": [
    {
      "producto_id": "1",
      "nombre_producto": "Pizza Especial",
      "descripcion": "Pizza con jamón, morrón, huevo y aceitunas",
      "precio": 4300,
      "cantidad_stock": 50,
      "categoria": "Pizzas",
      "imagenes": ["https://ejemplo.com/imagen1.jpg"],
      "promociones": []
    }
  ],
  "fecha_actualizacion": "2024-03-20T15:00:00.000Z"
}
```

#### `POST /api/sellers/{sellerId}/catalog`

Crea un nuevo catálogo para un seller.

##### 📄 Ejemplo de respuesta

```json
{
  "catalogo_id": "1",
  "tenant_id": "1",
  "productos": [],
  "fecha_actualizacion": "2024-03-20T15:00:00.000Z"
}
```

#### `DELETE /api/sellers/{sellerId}/catalog/{catalogId}`

Elimina un catálogo específico y todos sus productos.

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

#### `GET /api/sellers/{sellerId}/catalog/{catalogId}/products`

Obtiene todos los productos de un catálogo específico.

##### 📄 Ejemplo de respuesta

```json
[
  {
    "producto_id": "1",
    "nombre_producto": "Pizza Especial",
    "descripcion": "Pizza con jamón, morrón, huevo y aceitunas",
    "precio": 4300,
    "cantidad_stock": 50,
    "categoria": "Pizzas",
    "imagenes": ["https://ejemplo.com/imagen1.jpg"],
    "promociones": []
  }
]
```

#### `GET /api/sellers/{sellerId}/catalog/{catalogId}/products/{productId}`

Obtiene un producto específico de un catálogo.

##### 📄 Ejemplo de respuesta

```json
{
  "producto_id": "1",
  "nombre_producto": "Pizza Especial",
  "descripcion": "Pizza con jamón, morrón, huevo y aceitunas",
  "precio": 4300,
  "cantidad_stock": 50,
  "categoria": "Pizzas",
  "imagenes": ["https://ejemplo.com/imagen1.jpg"],
  "promociones": []
}
```

#### `POST /api/sellers/{sellerId}/catalog/{catalogId}/products`

Crea un nuevo producto en un catálogo.

#####  Body esperado

```json
{
  "nombre_producto": "Pizza Especial",
  "descripcion": "Pizza con jamón, morrón, huevo y aceitunas",
  "precio": 4300,
  "cantidad_stock": 50,
  "categoria": "Pizzas",
  "imagenes": ["https://ejemplo.com/imagen1.jpg"]
}
```

##### 📄 Ejemplo de respuesta

```json
{
  "message": "Producto creado exitosamente",
  "producto": {
    "producto_id": "1",
    "nombre_producto": "Pizza Especial",
    "descripcion": "Pizza con jamón, morrón, huevo y aceitunas",
    "precio": 4300,
    "cantidad_stock": 50,
    "categoria": "Pizzas",
    "imagenes": ["https://ejemplo.com/imagen1.jpg"],
    "promociones": []
  }
}
```

#### `PATCH /api/sellers/{sellerId}/catalog/{catalogId}/products/{productId}`

Actualiza parcialmente un producto existente.

#####  Body esperado

```json
{
  "precio": 4500,
  "cantidad_stock": 45,
  "imagenes": ["https://ejemplo.com/nueva-imagen1.jpg"]
}
```

##### 📄 Ejemplo de respuesta

```json
{
  "message": "Producto actualizado exitosamente",
  "producto": {
    "producto_id": "1",
    "nombre_producto": "Pizza Especial",
    "descripcion": "Pizza con jamón, morrón, huevo y aceitunas",
    "precio": 4500,
    "cantidad_stock": 45,
    "categoria": "Pizzas",
    "imagenes": ["https://ejemplo.com/nueva-imagen1.jpg"],
    "promociones": []
  }
}
```

#### `DELETE /api/sellers/{sellerId}/catalog/{catalogId}/products/{productId}`

Elimina un producto específico.

##### 📄 Ejemplo de respuesta

```json
{
  "message": "Producto eliminado exitosamente",
  "deleted_product": {
    "seller_id": "1",
    "catalogo_id": "1",
    "producto_id": "1",
    "nombre_producto": "Pizza Especial"
  }
}
```
```
