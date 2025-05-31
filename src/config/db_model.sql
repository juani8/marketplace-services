-- Tabla: tenants (1:N con productos, 1:1 con datos_contacto)
CREATE TABLE tenants (
  tenant_id SERIAL PRIMARY KEY,
  nombre VARCHAR(100) NOT NULL,
  razon_social VARCHAR(150),
  cuenta_bancaria VARCHAR(100),
  estado VARCHAR(20) DEFAULT 'activo' CHECK (estado IN ('activo','inactivo')),
  fecha_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS comercios (
  comercio_id SERIAL PRIMARY KEY,
  tenant_id INTEGER REFERENCES tenants(tenant_id) ON DELETE CASCADE,
  nombre TEXT NOT NULL,
  calle VARCHAR(100),
  numero VARCHAR(20),
  ciudad VARCHAR(100),
  provincia VARCHAR(100),
  codigo_postal VARCHAR(10),
  lat NUMERIC,
  lon NUMERIC,
  horario_apertura TIME,
  horario_cierre TIME
)

CREATE TABLE IF NOT EXISTS categorias (
  categoria_id SERIAL PRIMARY KEY,
  nombre       VARCHAR(100) NOT NULL,
  descripcion  VARCHAR(255),
  fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla: productos (N:1 con catalogos, 1:N con imagenes_producto, 1:N con promociones)
CREATE TABLE IF NOT EXISTS productos (
  producto_id     SERIAL PRIMARY KEY,
  tenant_id     INTEGER REFERENCES tenants(tenant_id) ON DELETE CASCADE,
  categoria_id   INTEGER REFERENCES categorias(categoria_id) ON DELETE CASCADE,
  nombre_producto VARCHAR(100) NOT NULL,
  descripcion     VARCHAR(255),
  precio          NUMERIC(10,2),
  fecha_creacion  TIMESTAMP      DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS stock_comercio (
  comercio_id INTEGER REFERENCES comercios(comercio_id) ON DELETE CASCADE,
  producto_id INTEGER REFERENCES productos(producto_id) ON DELETE CASCADE,
  cantidad_stock INTEGER NOT NULL,
  PRIMARY KEY (comercio_id, producto_id)
)

-- Tabla: imagenes_producto (N:1 con productos)
CREATE TABLE IF NOT EXISTS imagenes_producto (
  imagen_id     SERIAL PRIMARY KEY,
  producto_id   INTEGER REFERENCES productos(producto_id) ON DELETE CASCADE,
  url           VARCHAR(255) NOT NULL,
  descripcion   VARCHAR(255),
  fecha_creacion TIMESTAMP     DEFAULT CURRENT_TIMESTAMP
);

-- Tabla: promociones (N:1 con productos)
CREATE TABLE IF NOT EXISTS promociones (
  promocion_id   SERIAL PRIMARY KEY,
  nombre         VARCHAR(100) NOT NULL,
  tipo_promocion VARCHAR(20) NOT NULL CHECK (tipo_promocion IN ('monto', 'porcentaje')),
  valor_descuento NUMERIC(10, 2) NOT NULL,
  fecha_inicio   TIMESTAMP,
  fecha_fin      TIMESTAMP
);

-- Tabla: datos_contacto (1:1 con tenants)
CREATE TABLE IF NOT EXISTS datos_contacto (
  contacto_id   SERIAL PRIMARY KEY,
  tenant_id     INTEGER REFERENCES tenants(tenant_id) ON DELETE CASCADE,
  email         VARCHAR(100),
  telefono      VARCHAR(20),
  movil         VARCHAR(20),
  direccion     VARCHAR(200),
  sitio_web     VARCHAR(100),
  linkedin      VARCHAR(100),
  fecha_creacion TIMESTAMP    DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS promociones_productos (
  promocion_id INTEGER REFERENCES promociones(promocion_id) ON DELETE CASCADE,
  producto_id  INTEGER REFERENCES productos(producto_id) ON DELETE CASCADE,
  PRIMARY KEY (promocion_id, producto_id)
);