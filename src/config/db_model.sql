-- Tabla: Tenants
CREATE TABLE IF NOT EXISTS tenants (
  tenant_id SERIAL PRIMARY KEY,
  nombre TEXT NOT NULL,
  razon_social TEXT,
  cuenta_bancaria TEXT,
  datos_contacto JSONB,
  direccion TEXT,
  configuracion_operativa JSONB,
  catalogo_id INTEGER,
  estado TEXT DEFAULT 'activo',
  fecha_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla: Catálogos
CREATE TABLE IF NOT EXISTS catalogos (
  catalogo_id SERIAL PRIMARY KEY,
  tenant_id INTEGER REFERENCES tenants(tenant_id) ON DELETE CASCADE,
  fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla: Productos
CREATE TABLE IF NOT EXISTS productos (
  producto_id SERIAL PRIMARY KEY,
  catalogo_id INTEGER REFERENCES catalogos(catalogo_id) ON DELETE CASCADE,
  nombre_producto TEXT NOT NULL,
  descripcion TEXT,
  precio NUMERIC(10,2),
  cantidad_stock INTEGER,
  categoria TEXT,
  imagenes TEXT[],
  fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla: Promociones
CREATE TABLE IF NOT EXISTS promociones (
  promocion_id SERIAL PRIMARY KEY,
  tenant_id INTEGER REFERENCES tenants(tenant_id) ON DELETE CASCADE,
  nombre TEXT NOT NULL,
  descripcion TEXT,
  tipo_promocion TEXT,
  fecha_inicio TIMESTAMP,
  fecha_fin TIMESTAMP,
  estado TEXT DEFAULT 'activa'
);

-- Relación muchos a muchos: productos-promociones
CREATE TABLE IF NOT EXISTS productos_promociones (
  promocion_id INTEGER REFERENCES promociones(promocion_id) ON DELETE CASCADE,
  producto_id INTEGER REFERENCES productos(producto_id) ON DELETE CASCADE,
  PRIMARY KEY (promocion_id, producto_id)
);
