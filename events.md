# 🔔 Sistema de Eventos - Marketplace Services

Este documento detalla todos los eventos que el sistema **escucha** y **publica**, incluyendo formatos, tópicos y respuestas.

---

## 📥 Eventos que ESCUCHAMOS (Subscribers)

### 1. `pedido.creado`
**Descripción:** Evento recibido cuando se crea un nuevo pedido desde el sistema de core.deliver.ar  
**Endpoint:** `POST /callback`  
**Respuesta del sistema:** ❌ No envía respuesta automática, pero puede publicar `pedido.confirmar`

**Formato de entrada:**
```json
{
  "topic": "pedido.creado",
  "payload": {
    "pedidoId": "12345",
    "comercio_id": 1,
    "cliente_nombre": "Juan Pérez",
    "direccion_entrega": "Av. Corrientes 1234, CABA",
    "productos": [
      {
        "producto_id": 1,
        "cantidad": 2,
        "precio_unitario": 450.75
      }
    ],
    "medios_pago": "fiat",
    "total": 901.50
  }
}
```

**Acciones que realiza:**
1. Valida que el comercio pertenezca a un tenant válido
2. Valida stock disponible de los productos
3. Crea la orden en base de datos con estado 'pendiente'
4. Actualiza stock de productos (reserva)
5. **Publica evento `pedido.confirmar`** (ver sección de eventos publicados)

---

### 2. `pedido.entregado`
**Descripción:** Evento recibido cuando una entrega se completa exitosamente  
**Endpoint:** `POST /callback`  
**Respuesta del sistema:** ❌ No envía respuesta

**Formato de entrada:**
```json
{
  "topic": "pedido.entregado",
  "payload": {
    "pedidoId": "ORD_PHU998",
    "estado": "ENTREGADO"
  }
}
```

**Acciones que realiza:**
1. Valida que la orden existe y está en estado 'listo'
2. Actualiza el estado de la orden de 'listo' a 'finalizada'
3. Actualiza timestamp de `fecha_actualizacion`
4. No recupera stock (entrega exitosa)

---

### 3. `pedido.cancelado`
**Descripción:** Evento recibido cuando una entrega falla o se cancela  
**Endpoint:** `POST /callback`  
**Respuesta del sistema:** ❌ No envía respuesta

**Formato de entrada:**
```json
{
  "topic": "pedido.cancelado",
  "payload": {
    "pedidoId": "ORD_PHU998",
    "estado": "CANCELADO"
  }
}
```

**Acciones que realiza:**
1. Valida que la orden existe y está en estado válido para cancelar ('listo', 'aceptada', 'pendiente')
2. Actualiza el estado de la orden a 'cancelada'
3. **Recupera el stock** de todos los productos de la orden
4. Para cada producto, publica evento `stock.actualizado` individual con nueva cantidad
5. Actualiza timestamp de `fecha_actualizacion`

---

### 4. `iva.pedido`
**Descripción:** Solicitud de información de IVA para pedidos en un rango de fechas  
**Endpoint:** `POST /callback`  
**Respuesta del sistema:** ✅ Publica `iva.respuesta`

**Formato de entrada:**
```json
{
  "topic": "iva.pedido",
  "payload": {
    "fechaDesde": "2024-01-01",
    "fechaHasta": "2024-01-31"
  }
}
```

**Acciones que realiza:**
1. Busca todas las órdenes en el rango de fechas especificado
2. Calcula subtotal, IVA (21%) y total para cada orden
3. **Publica evento `iva.respuesta`** con los datos calculados

---

### 5. `ventas.mes`
**Descripción:** Solicitud de información de ventas mensuales  
**Endpoint:** `POST /callback`  
**Respuesta del sistema:** ✅ Publica `venta.mes.respuesta`

**Formato de entrada:**
```json
{
  "topic": "ventas.mes",
  "payload": {
    "fechaDesde": "2024-01-01",
    "fechaHasta": "2024-01-31"
  }
}
```

**Acciones que realiza:**
1. Busca todas las órdenes **finalizadas** en el rango de fechas
2. Calcula montos de IVA para cada orden y producto
3. Ordena por fecha de creación
4. **Publica evento `venta.mes.respuesta`** con información detallada

---

### 6. `ordenesbytenant.pedido`
**Descripción:** Solicitud de totales de órdenes agrupadas por tenant  
**Endpoint:** `POST /callback`  
**Respuesta del sistema:** ✅ Publica `ordenesbytenant.respuesta`

**Formato de entrada:**
```json
{
  "topic": "ordenesbytenant.pedido",
  "payload": {
    "tenant_id": 1,
    "fechaDesde": "2024-01-01",
    "fechaHasta": "2024-01-31"
  }
}
```

---

### 7. `get.balances.response`
**Descripción:** Respuesta con los balances de fiat y crypto de un tenant  
**Endpoint:** `POST /callback`  
**Respuesta del sistema:** ❌ No envía respuesta

**Formato de entrada:**
```json
{
  "topic": "get.balances.response",
  "payload": {
    "traceData": {
      "originModule": "marketplace-service",
      "traceId": "7f5a24c1-09db-4ba4-9023-d542a933cf9e"
    },
    "email": "juan.perez@example.com",
    "fiatBalance": 5000.00,
    "cryptoBalance": 150.75,
    "lastUpdated": "2024-01-15T10:30:00Z"
  }
}
```

**Notas sobre traceData:**
- Es un campo opcional
- Se utiliza para filtrar si el evento corresponde a este módulo (marketplace-service vs client/delivery)
- Se devuelve exactamente el mismo traceData recibido en la request para correlacionar la respuesta con el pedido original

**Acciones que realiza:**
1. Valida que el email corresponda a un tenant existente
2. Resuelve la promesa pendiente asociada al traceId
3. Retorna los balances (fiat y crypto) al endpoint que realizó la solicitud original

---

## 📤 Eventos que PUBLICAMOS (Publishers)

### 1. `pedido.confirmar`
**Descripción:** Confirmación de que un pedido fue procesado y validado exitosamente  
**Se publica cuando:** Se procesa exitosamente un evento `pedido.creado`

**Formato de salida:**
```json
{
  "topic": "pedido.confirmar",
  "payload": {
    "pedidoId": "12345",
    "comercio_id": 1,
    "cliente_nombre": "Juan Pérez",
    "direccion_entrega": "Av. Corrientes 1234, CABA",
    "productos": [
      {
        "producto_id": 1,
        "cantidad": 2,
        "precio_unitario": 450.75
      }
    ]
  }
}
```

---

### 2. `iva.respuesta`
**Descripción:** Respuesta con información de IVA calculada para pedidos  
**Se publica cuando:** Se procesa un evento `iva.pedido`

**Formato de salida:**
```json
{
  "topic": "iva.respuesta",
  "payload": {
    "pedidos": [
      {
        "pedidoId": 123,
        "fecha": "2024-01-15T10:30:00Z",
        "subtotal": 744.63,
        "montoIva": 156.37,
        "total": 901.00
      },
      {
        "pedidoId": 124,
        "fecha": "2024-01-16T11:15:00Z",
        "subtotal": 826.45,
        "montoIva": 173.55,
        "total": 1000.00
      }
    ]
  }
}
```

---

### 3. `venta.mes.respuesta`
**Descripción:** Respuesta con información detallada de ventas mensuales  
**Se publica cuando:** Se procesa un evento `ventas.mes`

**Formato de salida:**
```json
{
  "topic": "venta.mes.respuesta",
  "payload": {
    "ventas": [
      {
        "orden_id": 123,
        "comercio_id": 1,
        "fecha_creacion": "2024-01-15T10:30:00Z",
        "subtotal": 744.63,
        "monto_iva": 156.37,
        "total": 901.00,
        "direccion_entrega": "Av. Corrientes 1234, CABA",
        "productos": [
          {
            "producto_id": 1,
            "nombre": "Pizza Margherita",
            "cantidad": 2,
            "precio_unitario": 450.50,
            "subtotal": 744.63,
            "monto_iva": 156.37,
            "total": 901.00
          }
        ]
      }
    ],
    "timestamp": "2024-01-20T15:45:30Z"
  }
}
```

---

### 4. `ordenesbytenant.respuesta`
**Descripción:** Respuesta con totales de órdenes agrupadas por tenant  
**Se publica cuando:** Se procesa un evento `ordenesbytenant.pedido`

**Formato de salida:**
```json
{
  "topic": "ordenesbytenant.respuesta",
  "payload": {
    "tenant_id": 1,
    "totales": {
      "cantidad_ordenes": 45,
      "monto_total": 25430.75,
      "promedio_por_orden": 565.13
    },
    "timestamp": "2024-01-20T15:45:30Z"
  }
}
```

---

### 5. `tenant.creado`
**Descripción:** Evento publicado cuando se crea un nuevo tenant  
**Se publica cuando:** Se ejecuta `POST /api/auth/register-tenant` exitosamente

**Formato de salida:**
```json
{
  "topic": "tenant.creado",
  "payload": {
    "tenant_id": 1,
    "nombre": "Mi Negocio",
    "razon_social": "Mi Negocio S.A.",
    "cuenta_bancaria": "1234567890",
    "email": "admin@ejemplo.com",
    "telefono": "1234567890",
    "direccion_fiscal": {
      "calle": "Av. Corrientes",
      "numero": "1234",
      "ciudad": "Buenos Aires",
      "provincia": "CABA",
      "codigo_postal": "1043",
      "lat": -34.6037,
      "lon": -58.3816
    },
    "sitio_web": "https://miweb.com",
    "instagram": "@miweb",
    "estado": "activo",
    "fecha_registro": "2024-01-15T10:30:00Z",
    "fecha_actualizacion": "2024-01-15T10:30:00Z",
    "timestamp": "2024-01-15T10:30:00Z"
  }
}
```

---

### 6. `tenant.actualizado`
**Descripción:** Evento publicado cuando se actualiza un tenant  
**Se publica cuando:** Se ejecuta `PATCH /api/tenants/:id` exitosamente

**Formato de salida:**
```json
{
  "topic": "tenant.actualizado",
  "payload": {
    "tenant_id": 1,
    "cambios": {
      "telefono": "1111111111",
      "ubicacion": {
        "calle": "Nueva Calle",
        "numero": "5678"
      }
    },
    "timestamp": "2024-01-20T15:45:30Z"
  }
}
```

---

### 7. `tenant.eliminado`
**Descripción:** Evento publicado cuando se elimina un tenant  
**Se publica cuando:** Se ejecuta `DELETE /api/tenants/:id` exitosamente

**Formato de salida:**
```json
{
  "topic": "tenant.eliminado",
  "payload": {
    "tenant_id": 1,
    "nombre": "Mi Negocio",
    "timestamp": "2024-01-20T15:45:30Z"
  }
}
```

---

### 8. `comercio.creado`
**Descripción:** Evento publicado cuando se crea un nuevo comercio  
**Se publica cuando:** Se ejecuta `POST /api/sellers` exitosamente

**Formato de salida:**
```json
{
  "topic": "comercio.creado",
  "payload": {
    "comercio": {
      "comercio_id": 1,
      "tenant_id": 1,
      "nombre": "Sucursal Centro",
      "lat": -34.6037,
      "lon": -58.3816,
      "calle": "Av. Corrientes",
      "numero": "1234",
      "ciudad": "Buenos Aires",
      "provincia": "CABA",
      "codigo_postal": "1043"
    },
    "timestamp": "2024-01-15T10:30:00Z"
  }
}
```

---

### 9. `comercio.actualizado`
**Descripción:** Evento publicado cuando se actualiza un comercio  
**Se publica cuando:** Se ejecuta `PATCH /api/sellers/:id` exitosamente

**Formato de salida:**
```json
{
  "topic": "comercio.actualizado",
  "payload": {
    "seller_id": 1,
    "tenant_id": 1,
    "cambios": {
      "nombre": "Nuevo Nombre Sucursal",
      "horarios": [...]
    },
    "timestamp": "2024-01-20T15:45:30Z"
  }
}
```

---

### 10. `categoria.creada`
**Descripción:** Evento publicado cuando se crea una nueva categoría  
**Se publica cuando:** Se ejecuta `POST /api/categories` exitosamente

**Formato de salida:**
```json
{
  "topic": "categoria.creada",
  "payload": {
    "categoria": {
      "categoria_id": 1,
      "tenant_id": 1,
      "nombre": "Bebidas"
    },
    "timestamp": "2024-01-15T10:30:00Z"
  }
}
```

---

### 11. `stock.actualizado`
**Descripción:** Evento publicado cuando se actualiza el stock de un producto  
**Se publica cuando:**
- Se actualiza stock manualmente via `PATCH /api/sellers/:id/products/:productId/stock`
- Se reduce stock por venta (evento `pedido.creado`)
- Se recupera stock por cancelación (evento `delivery.failed`)

**Formato de salida:**
```json
{
  "topic": "stock.actualizado",
  "payload": {
    "comercio": {
      "comercio_id": 1,
      "nombre": "Sucursal Centro",
      "tenant_id": 1
    },
    "producto": {
      "producto_id": 15,
      "nombre_producto": "Pizza Margherita",
      "descripcion": "Pizza clásica con tomate y mozzarella",
      "precio": 850.50,
      "categoria_id": 2,
      "categoria_nombre": "Pizzas"
    },
    "stock": {
      "cantidad_anterior": 25,
      "cantidad_nueva": 20
    },
    "timestamp": "2024-01-15T14:30:00Z"
  }
}
```

### 12. `producto.actualizado`
**Descripción:** Evento publicado cuando se actualiza un producto  
**Se publica cuando:**
- Se actualiza información de un producto via `PUT /api/products/:id`
- Se modifican campos como nombre, descripción, precio, categoría o imágenes

**Formato de salida:**
```json
{
  "topic": "producto.actualizado",
  "payload": {
    "tenant_id": 1,
    "producto": {
      "producto_id": 15,
      "nombre_producto": "Pizza Margherita Especial",
      "descripcion": "Pizza clásica con tomate, mozzarella y albahaca fresca",
      "precio": 950.50,
      "categoria": {
        "categoria_id": 2,
        "nombre_categoria": "Pizzas"
      },
      "promociones": [
        {
          "promocion_id": 5,
          "nombre": "2x1 en Pizzas",
          "descripcion": "Lleva 2 pizzas y paga solo 1",
          "descuento_porcentaje": 50.00,
          "fecha_inicio": "2024-01-01T00:00:00Z",
          "fecha_fin": "2024-01-31T23:59:59Z",
          "estado": "activa"
        }
      ],
      "estado": "activo"
    },
    "campos_cambiados": ["nombre_producto", "precio", "descripcion"],
    "timestamp": "2024-01-15T14:30:00Z"
  }
}
```

**Posibles valores en `campos_cambiados`:**
- `"nombre_producto"`: Se cambió el nombre del producto
- `"descripcion"`: Se cambió la descripción del producto
- `"precio"`: Se cambió el precio del producto
- `"categoria_id"`: Se cambió la categoría del producto
- `"imagenes"`: Se cambiaron las imágenes del producto

---

### 4. `get.balances.request`
**Descripción:** Solicitud para obtener los balances de blockchain de un tenant  
**Se publica cuando:** Un tenant solicita consultar sus balances a través del endpoint GET /balance

**Formato de salida:**
```json
{
  "topic": "get.balances.request",
  "payload": {
    "email": "tenant@example.com",
    "traceData": {
      "originModule": "marketplace-service",
      "traceId": "tenant_id_123"
    }
  }
}
```

---

## 📊 Flujo Típico de Eventos

### Flujo de Pedido Completo:
1. **Recibe:** `pedido.creado` → Valida y crea orden
2. **Publica:** `pedido.confirmar` → Confirma procesamiento
3. **Publica:** `stock.actualizado` → Notifica reducción de stock
4. **Recibe:** `delivery.successful` → Finaliza orden
5. **Recibe:** `delivery.failed` → Cancela orden y recupera stock
6. **Publica:** `stock.actualizado` → Notifica recuperación de stock
7. **Recibe:** `ventas.mes` → Calcula estadísticas
8. **Publica:** `venta.mes.respuesta` → Envía reporte

### Flujo de Gestión de Negocio:
1. **Acción:** Crear tenant via API
2. **Publica:** `tenant.creado` → Notifica creación
3. **Acción:** Crear comercio via API  
4. **Publica:** `comercio.creado` → Notifica nueva sucursal

---

## ⚙️ Configuración Técnica

### Tópicos Registrados:
- ✅ `pedido.creado` 
- ✅ `delivery.successful`
- ✅ `delivery.failed`
- ✅ `iva.pedido`
- ✅ `ventas.mes`
- ✅ `ordenesbytenant.pedido`

### Respuestas HTTP del Callback:
- **200:** Evento procesado pero con advertencias
- **204:** Evento procesado exitosamente (sin contenido)
- **400:** Parámetros faltantes en verificación
- **500:** Error interno del servidor

### Logs del Sistema:
Todos los eventos se registran con formato:
```
[HUB EVENT RECEIVED] Topic: {topic}
[HUB EVENT RECEIVED] Body: {json_payload}
[HUB VERIFICATION] Topic: {topic}, Challenge: {challenge}
```
