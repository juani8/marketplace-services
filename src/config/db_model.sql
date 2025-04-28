-- Tabla: tenants (1:N con catalogos, 1:1 con datos_contacto)
CREATE TABLE IF NOT EXISTS tenants (
  tenant_id SERIAL PRIMARY KEY,
  nombre            VARCHAR(100) NOT NULL,
  razon_social      VARCHAR(150),
  cuenta_bancaria   VARCHAR(100),
  direccion         VARCHAR(200),
  lon               NUMERIC(9,6), 
  lat               NUMERIC(9,6),
  configuracion_operativa JSONB,
  estado            VARCHAR(20)  DEFAULT 'activo' CHECK (estado IN ('activo','inactivo')),
  fecha_registro    TIMESTAMP     DEFAULT CURRENT_TIMESTAMP,
  fecha_actualizacion TIMESTAMP   DEFAULT CURRENT_TIMESTAMP
);

-- Tabla: catalogos (N:1 con tenants, 1:N con productos)
CREATE TABLE IF NOT EXISTS catalogos (
  catalogo_id        SERIAL PRIMARY KEY,
  tenant_id          INTEGER REFERENCES tenants(tenant_id) ON DELETE CASCADE,
  fecha_actualizacion TIMESTAMP    DEFAULT CURRENT_TIMESTAMP
);

-- Tabla: productos (N:1 con catalogos, 1:N con imagenes_producto, 1:N con promociones)
CREATE TABLE IF NOT EXISTS productos (
  producto_id     SERIAL PRIMARY KEY,
  catalogo_id     INTEGER REFERENCES catalogos(catalogo_id) ON DELETE CASCADE,
  nombre_producto VARCHAR(100) NOT NULL,
  descripcion     VARCHAR(255),
  precio          NUMERIC(10,2),
  cantidad_stock  INTEGER,
  categoria       VARCHAR(100),
  fecha_creacion  TIMESTAMP      DEFAULT CURRENT_TIMESTAMP
);

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
  producto_id    INTEGER REFERENCES productos(producto_id) ON DELETE CASCADE,
  nombre         VARCHAR(100) NOT NULL,
  descripcion    VARCHAR(255),
  tipo_promocion VARCHAR(100),
  fecha_inicio   TIMESTAMP,
  fecha_fin      TIMESTAMP,
  estado         VARCHAR(50)  DEFAULT 'activo' CHECK (estado IN ('activo','inactivo'))
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