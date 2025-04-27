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
│   └── promocion.controller.js
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
│   ├── tenant.routes.js
│   ├── catalogo.routes.js
│   ├── producto.routes.js
│   └── promocion.routes.js
│
└── app.js            # Configuración, uso de middlewares y punto de entrada del servidor
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
|--------------------------|------------------------------|----------|
| tenant_id                | integer (PK)                 | NO       |
| nombre                   | text                         | NO       |
| razon_social             | text                         | SÍ       |
| cuenta_bancaria          | text                         | SÍ       |
| datos_contacto           | jsonb                        | SÍ       |
| direccion                | text                         | SÍ       |
| configuracion_operativa | jsonb                        | SÍ       |
| catalogo_id              | integer                      | SÍ       |
| estado                   | text                         | SÍ       |
| fecha_registro           | timestamp without time zone | SÍ       |
| fecha_actualizacion      | timestamp without time zone | SÍ       |

---

### 📦 Catálogos

| Columna           | Tipo                         | Nullable |
|-------------------|------------------------------|----------|
| catalogo_id       | integer (PK)                 | NO       |
| tenant_id         | integer                      | SÍ       |
| fecha_actualizacion | timestamp without time zone | SÍ       |

---

### 🛒 Productos

| Columna         | Tipo                         | Nullable |
|-----------------|------------------------------|----------|
| producto_id     | integer (PK)                 | NO       |
| catalogo_id     | integer                      | SÍ       |
| nombre_producto | text                         | NO       |
| descripcion     | text                         | SÍ       |
| precio          | numeric                      | SÍ       |
| cantidad_stock  | integer                      | SÍ       |
| categoria       | text                         | SÍ       |
| imagenes        | ARRAY                        | SÍ       |
| fecha_creacion  | timestamp without time zone | SÍ       |

---

### 🎁 Promociones

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


## 📄 Endpoints - API

### 🏢 **Tenants**

#### `GET /api/tenants`

Obtiene una lista paginada de todos los tenants registrados en el sistema.

##### 📥 Parámetros de consulta (Query Parameters)

| Parámetro | Tipo    | Opcional | Descripción                                       |
|:----------|:--------|:---------|:-------------------------------------------------|
| `page`    | integer | Sí       | Número de página (por defecto `1`)               |
| `size`    | integer | Sí       | Cantidad de registros por página (por defecto `10`) |

##### 📤 Respuesta

```json
{
  "data": [
    {
      "tenant_id": 1,
      "nombre": "Supermercado La Plaza",
      "razon_social": "La Plaza SRL",
      "cuenta_bancaria": "123-456-789",
      "direccion": "Av. Siempre Viva 742",
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

#### `POST /api/tenants`

Crea un nuevo tenant en el sistema.

##### 📥 Body

Debe enviarse un JSON con los siguientes campos:

| Campo                     | Tipo     | Obligatorio | Descripción                                                  |
|:---------------------------|:---------|:------------|:-------------------------------------------------------------|
| `nombre`                   | string   | Sí          | Nombre del tenant (comercio o empresa).                      |
| `razon_social`             | string   | Sí          | Razón social registrada del tenant.                         |
| `cuenta_bancaria`          | string   | No          | Cuenta bancaria asociada (opcional).                         |
| `direccion`                | string   | No          | Dirección física del tenant (opcional).                      |
| `configuracion_operativa`  | JSON     | No          | Configuraciones internas (horarios de atención, políticas, etc). |

**Ejemplo de body:**

```json
{
  "nombre": "Supermercado La Plaza",
  "razon_social": "La Plaza SRL",
  "cuenta_bancaria": "123-456-789",
  "direccion": "Av. Siempre Viva 742",
  "configuracion_operativa": {
    "horario_apertura": "09:00",
    "horario_cierre": "18:00"
  }
}
```
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