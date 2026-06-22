# Coty Café — Guía del Sistema

Documento orientado al cliente. Describe qué hace la plataforma, quién la usa y cómo se opera el negocio día a día con las herramientas incluidas.

---

## Índice

1. [¿Qué es Coty Café?](#1-qué-es-coty-café)
2. [¿Quién usa el sistema?](#2-quién-usa-el-sistema)
3. [Experiencia del cliente final](#3-experiencia-del-cliente-final)
4. [Panel de Administración](#4-panel-de-administración)
5. [Panel de Operaciones (Staff)](#5-panel-de-operaciones-staff)
6. [Flujos de trabajo principales](#6-flujos-de-trabajo-principales)
7. [Funcionalidades de negocio](#7-funcionalidades-de-negocio)
8. [Integraciones y servicios externos](#8-integraciones-y-servicios-externos)
9. [Configuración del negocio](#9-configuración-del-negocio)
10. [Accesos y credenciales de prueba](#10-accesos-y-credenciales-de-prueba)
11. [Mapa de pantallas](#11-mapa-de-pantallas)
12. [Alcance actual y consideraciones](#12-alcance-actual-y-consideraciones)

---

## 1. ¿Qué es Coty Café?

**Coty Café** es una plataforma web integral para gestionar un café o restaurante. Reúne en un solo lugar:

- La **carta digital** que ven los clientes desde el celular o la computadora.
- El **panel de operaciones** para cocina, mesas, delivery, caja y atención en salón.
- El **panel de administración** para configurar productos, precios, horarios, promociones y reportes.

La aplicación funciona en **celular, tablet y escritorio**, puede **instalarse como app** en el teléfono (PWA) y está preparada para seguir tomando pedidos aunque la conexión a internet falle momentáneamente en el lado del cliente.

### Modalidades de venta soportadas

| Modalidad             | Descripción                                                            |
| --------------------- | ---------------------------------------------------------------------- |
| **Delivery**          | El cliente pide a domicilio con dirección y costo de envío.            |
| **Retiro (Takeaway)** | El cliente pide y retira en el local.                                  |
| **Mesa**              | El cliente escanea un QR en la mesa y pide desde ahí, sin registrarse. |

---

## 2. ¿Quién usa el sistema?

### Cliente final

- **No necesita cuenta ni contraseña.**
- Entra por la web pública, arma su pedido y lo confirma.
- Puede seguir el estado de su pedido con un código.
- Si escanea el QR de una mesa, el sistema lo identifica automáticamente con esa mesa.

### Administrador

- Acceso completo al panel de administración.
- Ingresa con **correo electrónico y contraseña**.
- Gestiona catálogo, personal, reportes, configuración y todas las áreas del negocio.

### Personal operativo

El personal se divide en dos perfiles de acceso:

| Perfil       | Nombre en pantalla | Acceso                                                                               |
| ------------ | ------------------ | ------------------------------------------------------------------------------------ |
| **Cajero/a** | Cajero/a           | Panel de operaciones + parte del panel admin (mesas, caja, configuración en lectura) |
| **Cadete**   | Cadete             | Solo panel de operaciones                                                            |

> **Importante:** Las pantallas de **Cocina**, **Mesas**, **Llamados de mozo** y **Cadetes** viven dentro del panel de operaciones (`/staff`). No son usuarios separados con login propio: cualquier miembro del personal autenticado puede usar esas secciones según la operación del turno.

### Formas de ingreso del personal

1. **Email + contraseña** — para administradores y personal.
2. **PIN numérico** (4 a 6 dígitos) — acceso rápido en el local, ideal para cajeros y cadetes.

Tras iniciar sesión, el sistema redirige automáticamente:

- Administradores y cajeros con permiso → **Panel Admin**
- Cadetes y personal sin permiso admin → **Panel de Operaciones**

---

## 3. Experiencia del cliente final

### Página de inicio (`/`)

La landing presenta la identidad visual de Coty Café e incluye:

- Carrusel de **productos destacados** con agregado rápido al carrito.
- **Banners de promociones** activas.
- Información del local: horarios, estado abierto/cerrado, estado de delivery y retiro.
- Dirección con enlace a **Google Maps**, teléfono y redes sociales.
- Acceso directo al menú.

### Menú digital (`/menu`)

- Navegación por **categorías** y **búsqueda** de productos.
- Sección de **promociones** con descuentos aplicados.
- Detalle de cada producto con **opciones configurables** (tamaño, leche, extras, etc.) y notas.
- **Carrito flotante** con total actualizado.
- Si el cliente llegó desde un QR de mesa, ve un banner: _"Estás en la Mesa X"_.

### Pedido desde mesa (QR)

Cada mesa puede tener su propio código QR. Al escanearlo:

- El menú queda vinculado a esa mesa.
- Los pedidos se registran como tipo **mesa** (sin elegir delivery ni retiro).
- El cliente puede usar el botón **"Llamar al mozo"** para solicitar atención.
- Los medios de pago en mesa son **efectivo, tarjeta o transferencia** (Mercado Pago no está disponible en este modo).

### Checkout (`/checkout`)

Pantalla de confirmación del pedido:

- Revisión del carrito con promociones ya aplicadas.
- Selección de modalidad: delivery, retiro o mesa (automático si viene del QR).
- Datos del cliente: nombre, teléfono, dirección (en delivery), notas.
- Selección de **zona de delivery** (si el negocio tiene zonas configuradas).
- Ingreso de **cupón de descuento** con validación en tiempo real.
- **Propina** opcional.
- Medios de pago: efectivo, tarjeta, transferencia y **Mercado Pago**.
- Validaciones automáticas: local cerrado, canal cerrado, pedido mínimo, campos obligatorios.
- Al confirmar: código de pedido, mensaje de éxito y opción de abrir **WhatsApp** con el resumen.

### Seguimiento de pedido (`/order-status`)

- Lista de pedidos del cliente (guardados en el navegador y consultados al servidor).
- Búsqueda por código de pedido.
- Barra de progreso: Pendiente → Confirmado → Preparando → Listo.
- Indicador si el pedido quedó pendiente de sincronización por falta de internet.
- Los pedidos de mesa no aparecen aquí (son internos al salón).

### Funcionamiento sin conexión

Si el cliente pierde internet:

- Puede confirmar el pedido (excepto con Mercado Pago).
- El pedido se guarda en el celular y se envía automáticamente al recuperar conexión.
- Hay una pantalla dedicada (`/offline`) cuando no hay red disponible.
- El menú y la configuración pueden mostrarse desde caché si ya se visitaron antes.

---

## 4. Panel de Administración

Acceso: `/admin` · Usuarios: Administrador y Cajero/a (con permisos limitados).

### Dashboard

Centro de control con métricas del negocio:

- **Reporte por período** con fechas personalizables: ingresos y cantidad de pedidos.
- **Resumen del día**: ventas, pedidos, ticket promedio y pedidos activos (con comparación vs. ayer).
- Gráfico de **ingresos por hora**.
- Desglose por **canal** (delivery, retiro, mesas).
- Gráfico de **ventas diarias** (últimos 14 días).
- **Top de productos** por ingresos.
- **Historial de ventas** con búsqueda y paginación.
- **Exportación** a CSV y Excel desde el historial.

> Solo el administrador puede ver el dashboard y exportar ventas.

### Productos

Gestión completa del catálogo:

- Alta, edición y baja de productos.
- Campos: nombre, descripción, imagen, precio, categoría, tiempo de preparación.
- **Opciones configurables** (tamaño, leche, extras, etc.) con precios adicionales.
- Marcadores: producto destacado, disponible / no disponible.
- **Control de stock** opcional: cantidad actual y umbral de alerta.

### Categorías

Organización del menú:

- Nombre, icono visual, orden de aparición y estado activo/inactivo.

### Promociones

Campañas de descuento:

- Título, descripción, imagen y porcentaje de descuento.
- Vigencia (fecha desde / hasta).
- Asociación a productos y/o categorías específicas.
- Activar o desactivar en cualquier momento.

### Mesas

Administración del salón:

- Grilla visual con estados: libre, ocupada, en espera, finalizada.
- Crear y editar mesas (número, capacidad, estado, activa/inactiva).
- **Códigos QR por mesa** y descarga masiva de QR.
- QR del menú general para imprimir.
- Carga manual de pedidos de mesa desde el admin.
- Restaurar mesas eliminadas.

### Personal

Gestión de usuarios del sistema:

- Alta y edición: nombre, email, teléfono, avatar.
- Rol: Administrador o Personal operativo.
- Función del personal: Cajero/a o Cadete.
- Contraseña y PIN opcional.
- Activar o desactivar usuario.
- Enlace directo a WhatsApp del teléfono registrado.

### Turnos y horarios

Control de cuándo se aceptan pedidos por canal:

- Interruptor global: negocio abierto / cerrado.
- Por cada canal (**Delivery**, **Local/mesa**, **Retiro**):
  - Activar o desactivar el canal.
  - Franjas horarias con nombre, hora de inicio/fin y días de la semana.
  - Crear, editar, activar/desactivar y eliminar turnos.
- Si un canal no tiene turnos propios, se usa el horario general del negocio.

### Caja

Control del turno de caja:

- **Abrir caja** con monto inicial.
- Registrar movimientos: gasto, retiro, depósito.
- **Cerrar turno**: monto contado, notas y cálculo de diferencia vs. monto esperado.
- Ver sesión activa, movimientos del turno e historial de cierres.

### Comercio

Herramientas comerciales agrupadas en pestañas:

| Pestaña      | Función                                                                 |
| ------------ | ----------------------------------------------------------------------- |
| **Zonas**    | Crear zonas de delivery con costo de envío y pedido mínimo por zona     |
| **Cupones**  | Crear códigos de descuento (% o monto fijo) con vigencia                |
| **Reservas** | Registrar reservas (cliente, teléfono, personas, fecha/hora)            |
| **Facturas** | Generar comprobante interno a partir de un pedido existente             |
| **Clientes** | Ver clientes recurrentes: teléfono, cantidad de pedidos y total gastado |

### Configuración

Datos generales del negocio:

- Nombre, logo, teléfono, dirección.
- Horarios de apertura y cierre.
- Costo de delivery por defecto, pedido mínimo y tasa impositiva.
- WhatsApp, Instagram y Facebook.
- Estado abierto/cerrado manual.
- Generación de QR del menú para imprimir.
- Métricas operativas rápidas (mesas atendidas, productos activos, pedidos recientes).

### Permisos por perfil en el Admin

| Sección                            | Administrador | Cajero/a |
| ---------------------------------- | :-----------: | :------: |
| Dashboard y analytics              |       ✓       |    ✗     |
| Productos, categorías, promociones |       ✓       |    ✗     |
| Mesas                              |       ✓       |    ✓     |
| Personal                           |       ✓       |    ✗     |
| Turnos y horarios                  |       ✓       |    ✗     |
| Caja                               |       ✓       |    ✓     |
| Comercio                           |       ✓       |    ✗     |
| Configuración (lectura)            |       ✓       |    ✓     |

---

## 5. Panel de Operaciones (Staff)

Acceso: `/staff` · Usuarios: todo el personal autenticado.

Panel unificado para el día a día del local. Incluye 6 secciones:

### Pedidos

Vista en tiempo real de todos los pedidos activos:

- Filtros por tipo (delivery, retiro, mesa), estado y búsqueda.
- Contadores: pendientes, preparando, listos, activos.
- Avance de estado paso a paso: Confirmar → Preparar → Listo → Entregar → Completar.
- Cancelar pedido o archivarlo (sale de operaciones, queda en historial).
- **Alerta sonora** ante nuevos pedidos pendientes.
- Detalle expandible de cada pedido.
- Indicador visual de pedidos guardados offline pendientes de sincronizar.

### Cocina (KDS — Kitchen Display System)

Pantalla de comandas para la cocina:

- Muestra pedidos en estado pendiente, confirmado o preparando.
- Detalle de ítems, mesa o tipo de pedido y total.
- Botón **"Tomar comanda"** → pasa a "preparando" y registra acuse de cocina.
- Actualización automática cada pocos segundos.

### Mesas

Mapa del salón para mozos y cajeros:

- Vista con estados en colores (libre, ocupada, en espera, finalizada).
- Seleccionar mesa → ver pedidos activos de la sesión.
- Agregar productos al pedido (catálogo completo con opciones y promociones).
- Enviar pedido a cocina.
- Cerrar cuenta de mesa con medio de pago (efectivo, tarjeta, transferencia).

### Cadetes

Gestión de entregas de delivery:

- Lista de entregas activas.
- Asignar cadete (solo usuarios registrados como Cadete).
- Marcar: retirado → entregado.
- Actualización automática periódica.

### Llamados (Mozos)

Atención de solicitudes desde mesas:

- El cliente presiona "Llamar al mozo" desde su celular.
- La solicitud aparece aquí en tiempo real.
- Botones: **Atender** y **Listo**.

### Caja

Misma funcionalidad que en el panel Admin: apertura, movimientos y cierre de turno.

---

## 6. Flujos de trabajo principales

### Pedido con retiro (Takeaway)

```
Cliente → Menú → Carrito → Checkout (Retiro)
       → Elige medio de pago → Confirma
       → Pedido confirmado (o pendiente si es Mercado Pago)
       → Staff avanza estados: Preparar → Listo
       → Cliente retira → Completado
```

### Pedido con delivery

```
Cliente → Checkout (Delivery + dirección + zona + propina/cupón)
       → Confirma → Staff recibe en Pedidos
       → Cocina toma comanda → Preparando → Listo
       → Cadetes: asignar cadete → Retirado → Entregado
       → Pedidos: Entregar → Completado
```

### Pedido en mesa

```
Cliente escanea QR de mesa → Menú en modo mesa → Checkout simplificado
       → Pedido asociado a la mesa
       → Cocina recibe comanda
       → Staff puede agregar más ítems desde panel Mesas
       → Cierre de cuenta con pago en mesa → Mesa queda libre
```

### Llamado de mozo

```
Cliente en mesa → "Llamar al mozo"
       → Aparece en Staff → Llamados
       → Mozo: Atender → Listo
```

### Cierre de caja

```
Personal autorizado → Caja → Abrir (monto inicial)
       → Durante el turno: registrar gastos, retiros y depósitos
       → Al finalizar: Cerrar caja → ingresa monto contado
       → Sistema calcula esperado vs. contado → muestra diferencia
```

### Pago con Mercado Pago

```
Cliente elige Mercado Pago → se crea pedido pendiente de pago
       → Redirección al checkout de Mercado Pago
       → Al aprobar el pago, el pedido pasa a confirmado automáticamente
       → Cliente vuelve a la pantalla de seguimiento
```

### Pedido sin conexión

```
Cliente sin internet → confirma pedido (excepto Mercado Pago)
       → Pedido guardado en el celular
       → Al volver online: sincronización automática con el servidor
```

---

## 7. Funcionalidades de negocio

### Caja y arqueo

- Sesiones de turno con apertura y cierre.
- Movimientos manuales: gastos, retiros y depósitos.
- Al cerrar, el sistema calcula el monto esperado (apertura + ventas en efectivo + depósitos − salidas) y muestra la diferencia con lo contado.

### Facturación / comprobantes

- Generación de comprobante interno (`FAC-...`) vinculado a un pedido.
- Incluye: cliente, subtotal, impuestos, total y número único.
- **No es facturación electrónica AFIP/ARCA** — es un registro interno del sistema.

### Reservas

- Creación y listado desde Admin → Comercio → Reservas.
- Datos: cliente, teléfono, cantidad de personas, fecha/hora y notas.
- **No hay reserva online pública** para el cliente final en la web.

### Cupones de descuento

- Descuento por porcentaje o monto fijo.
- Vigencia, monto mínimo de pedido y límite de usos.
- Validación en tiempo real en el checkout.

### Zonas de delivery

- Cada zona tiene nombre, costo de envío y pedido mínimo propio.
- El cliente elige la zona en el checkout; el sistema aplica el fee y valida el mínimo.

### Horarios por canal

- Tres canales independientes: Delivery, Local (mesas) y Retiro.
- Cada uno puede activarse/desactivarse y tener franjas horarias por día.
- La landing y el checkout informan si el canal está abierto o cerrado.

### Analytics y reportes

- Métricas del día con comparación vs. ayer.
- Ventas por hora, por canal y por producto.
- Reporte por rango de fechas personalizado.
- Mesas atendidas (hoy y total histórico).
- Exportación de ventas en CSV y Excel (solo administrador).

### Clientes recurrentes

- Registro automático por teléfono en pedidos de delivery y retiro.
- Historial de direcciones, cantidad de pedidos y total gastado.

### Control de stock

- Los productos pueden activar control de stock con umbral de alerta.
- Al crear un pedido se valida que haya stock suficiente.

### Auditoría

- El sistema registra acciones relevantes en base de datos (por ejemplo, cierre de pedido desde caja).
- No hay pantalla dedicada de auditoría en la interfaz actual.
