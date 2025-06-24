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
  lon NUMERIC
);


-- Creamos la nueva tabla de horarios
CREATE TABLE IF NOT EXISTS horarios_comercio (
  horario_id SERIAL PRIMARY KEY,
  comercio_id INTEGER REFERENCES comercios(comercio_id) ON DELETE CASCADE,
  dia_semana INTEGER NOT NULL CHECK (dia_semana BETWEEN 0 AND 6), -- 0 = Domingo
  hora_apertura TIME, -- puede ser NULL si está cerrado
  hora_cierre TIME, -- puede ser NULL si está cerrado
  estado VARCHAR(20) DEFAULT 'activo' CHECK (estado IN ('activo','inactivo')),
  UNIQUE(comercio_id, dia_semana)
);

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

CREATE TABLE IF NOT EXISTS usuarios_tenant (
  usuario_id SERIAL PRIMARY KEY,
  tenant_id INTEGER REFERENCES tenants(tenant_id) ON DELETE CASCADE,
  nombre VARCHAR(100) NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  rol VARCHAR(50) NOT NULL CHECK (rol IN ('admin', 'operador')),
  fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS usuario_comercio (
  usuario_id INTEGER REFERENCES usuarios_tenant(usuario_id) ON DELETE CASCADE,
  comercio_id INTEGER REFERENCES comercios(comercio_id) ON DELETE CASCADE,
  PRIMARY KEY (usuario_id, comercio_id)
);

CREATE TABLE IF NOT EXISTS ordenes (
  orden_id INTEGER PRIMARY KEY,
  tenant_id INTEGER REFERENCES tenants(tenant_id) ON DELETE CASCADE,
  comercio_id INTEGER REFERENCES comercios(comercio_id) ON DELETE CASCADE,
  cliente_nombre VARCHAR(150) NOT NULL,
  medios_pago VARCHAR(10) NOT NULL CHECK (medios_pago IN ('fiat', 'crypto')),
  estado VARCHAR(20) NOT NULL CHECK (
                                    estado IN (
                                    'pendiente', -- recibido de cliente
                                    'aceptada', -- validado y stock reservado
                                    'rechazada', -- no hay stock
                                    'cancelada', -- delivery falló, recupero stock
                                    'listo', -- pedido preparado
                                    'finalizada' -- entregado
                                    )
                                    ),
  total NUMERIC(10,2) NOT NULL,
  direccion_entrega TEXT NOT NULL,
  fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


CREATE TABLE IF NOT EXISTS ordenes_productos (
  orden_id INTEGER REFERENCES ordenes(orden_id) ON DELETE CASCADE,
  producto_id INTEGER REFERENCES productos(producto_id) ON DELETE CASCADE,
  promocion_id INTEGER REFERENCES promociones(promocion_id) ON DELETE SET NULL,
  precio_unitario NUMERIC(10,2) NOT NULL,
  cantidad INTEGER NOT NULL,
  subtotal NUMERIC(10,2) GENERATED ALWAYS AS (precio_unitario * cantidad) STORED,
  PRIMARY KEY (orden_id, producto_id)
);



