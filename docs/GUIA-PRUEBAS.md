# Coty Café — Guía de pruebas (QA)

Guía para testers y usuarios del negocio que validen la aplicación de punta a punta antes de producción o tras un despliegue.

**Tiempo estimado:** 2 a 4 horas (completa) · 45 min (recorrido rápido).

---

## Índice

1. [Objetivo](#1-objetivo)
2. [Antes de empezar](#2-antes-de-empezar)
3. [Credenciales y datos de prueba](#3-credenciales-y-datos-de-prueba)
4. [Dispositivos recomendados](#4-dispositivos-recomendados)
5. [Recorrido rápido (smoke test)](#5-recorrido-rápido-smoke-test)
6. [Pruebas del cliente final](#6-pruebas-del-cliente-final)
7. [Pruebas del panel de operaciones (Staff)](#7-pruebas-del-panel-de-operaciones-staff)
8. [Pruebas del panel de administración](#8-pruebas-del-panel-de-administración)
9. [Flujos integrados (end-to-end)](#9-flujos-integrados-end-to-end)
10. [Casos especiales y validaciones negativas](#10-casos-especiales-y-validaciones-negativas)
11. [Cómo reportar un problema](#11-cómo-reportar-un-problema)
12. [Checklist final de cobertura](#12-checklist-final-de-cobertura)
13. [Anexo: levantar entorno local (opcional)](#13-anexo-levantar-entorno-local-opcional)

---

## 1. Objetivo

Validar que funcionen correctamente:

- La **web pública** (menú, carrito, checkout, seguimiento).
- El **panel de operaciones** (`/staff`) para el día a día del local.
- El **panel de administración** (`/admin`) para configuración y reportes.
- Los **tres canales de venta**: mesa, retiro y delivery.
- Integraciones clave: **Mercado Pago**, **modo offline**, **QR de mesas**.

Al terminar cada sección, marcá con ✅ lo que pasó y con ❌ lo que falló (y reportalo según la sección 11).

---

## 2. Antes de empezar

### URL de la app

Reemplazá `{URL}` por la dirección que te indique el equipo (ejemplo: `https://coty-cafe.ejemplo.com` o `http://localhost:3000`).

| Pantalla | Ruta |
| -------- | ---- |
| Inicio | `{URL}/` |
| Menú | `{URL}/menu` |
| Checkout | `{URL}/checkout` |
| Seguimiento de pedido | `{URL}/order-status` |
| Login personal | `{URL}/login` |
| Panel operaciones | `{URL}/staff` |
| Panel admin | `{URL}/admin` |

### Datos precargados

Si el entorno fue inicializado con el seed de demostración, ya hay productos, mesas, promociones y pedidos de ejemplo. Si el entorno está vacío, pedile al equipo técnico que ejecute el seed antes de probar.

### Reglas generales al probar

- Usá **navegador en incógnito** para simular clientes sin sesión.
- Para probar distintos roles del personal, **cerrá sesión** entre cada uno (`/login` → cerrar sesión).
- Anotá **hora, navegador y dispositivo** cuando encuentres un error.
- No uses datos reales de tarjetas: Mercado Pago debe estar en modo **TEST**.

---

## 3. Credenciales y datos de prueba

### Personal — email y contraseña

Contraseña común de prueba: **`cotycafe123`**

| Rol | Email | Redirige a |
| --- | ----- | ---------- |
| Administrador | `admin@cotycafe.com` | `/admin` (dashboard) |
| Cajero/a | `cajero@cotycafe.com` | `/admin` (mesas por defecto) |
| Cadete | `cadete@cotycafe.com` | `/staff` |

### Personal — acceso rápido con PIN

| Rol | PIN |
| --- | --- |
| Cajero/a | `4321` |
| Cadete | `5678` |

### Mesas de ejemplo (seed)

| Mesa | ID interno | Estado inicial | Uso sugerido en pruebas |
| ---- | ---------- | -------------- | ----------------------- |
| Mesa 4 | `t4` | Libre | Pedido nuevo desde QR |
| Mesa 2 | `t2` | Ocupada | Ver pedidos existentes en staff |
| Mesa 5 | `t5` | Ocupada | Probar cierre de cuenta |

**URL de menú con mesa (sin escanear QR):**

```
{URL}/menu?mesa=t4
```

### Códigos de seguimiento precargados

| Código | Tipo | Estado aproximado |
| ------ | ---- | ----------------- |
| `TRACK-000005` | Delivery | Pendiente |
| `TRACK-000006` | Retiro | Listo |

> Los pedidos de **mesa** no aparecen en el seguimiento público del cliente.

### Parámetros del negocio (seed)

| Concepto | Valor |
| -------- | ----- |
| Pedido mínimo | $9.000 |
| Costo delivery por defecto | $2.500 |
| Impuesto (IVA) | 21% |
| Horario general | 07:00 – 21:00 (configurable en admin) |

### Mercado Pago (solo si está habilitado)

- Debe usarse cuenta y credenciales **TEST** de Mercado Pago.
- En checkout, elegir **Mercado Pago** y completar el pago con tarjetas de prueba de MP.
- Si no tenés credenciales TEST configuradas, saltá esas pruebas y reportalo como bloqueante para producción.

---

## 4. Dispositivos recomendados

Probá al menos en **dos** de estos:

| Dispositivo | Qué validar |
| ----------- | ----------- |
| Celular (Chrome/Safari) | Menú, QR, checkout, PWA, offline |
| Tablet | Panel staff en cocina y mesas |
| Computadora | Admin completo, exportaciones, gráficos |

También conviene probar:

- Rotación horizontal/vertical en celular.
- Instalación como app (PWA): menú del navegador → “Agregar a pantalla de inicio”.

---

## 5. Recorrido rápido (smoke test)

Si tenés poco tiempo, hacé solo esto (~45 min):

| # | Paso | Resultado esperado |
| - | ---- | ------------------ |
| 1 | Abrí `{URL}/` | Carga la landing con productos destacados y estado del local |
| 2 | Entrá al menú, agregá un producto con opciones (ej. Americano → tamaño) | El carrito muestra el total correcto |
| 3 | Hacé un pedido de **retiro** con efectivo | Aparece código de pedido y mensaje de éxito |
| 4 | En `/order-status`, buscá el código | Se ve el estado del pedido |
| 5 | Iniciá sesión como **cadete** (`5678`) | Entrás a `/staff` |
| 6 | En Staff → Pedidos, avanzá el pedido del paso 3 | Los estados cambian: Confirmado → Preparando → Listo → Completado |
| 7 | Iniciá sesión como **admin** | Ves el dashboard con métricas |
| 8 | Abrí `{URL}/menu?mesa=t4` y confirmá un pedido de mesa | En Staff → Cocina aparece la comanda |
| 9 | En Staff → Llamados, probá “Llamar al mozo” desde el celular en mesa | La solicitud aparece en tiempo real |

Si los 9 pasos pasan, el núcleo del sistema funciona.

---

## 6. Pruebas del cliente final

> No requiere login. Usá ventana de incógnito.

### 6.1 Landing (`/`)

| # | Acción | Esperado |
| - | ------ | -------- |
| 1 | Cargar la página de inicio | Logo, nombre “Coty Café”, horarios visibles |
| 2 | Revisar carrusel de destacados | Al menos un producto; botón de agregar funciona |
| 3 | Revisar banners de promociones | Se muestran promos activas |
| 4 | Tocar enlace a Google Maps | Abre mapa con la dirección |
| 5 | Tocar WhatsApp / redes | Abre la app o web correspondiente |
| 6 | Ir al menú desde el botón principal | Navega a `/menu` |

### 6.2 Menú (`/menu`)

| # | Acción | Esperado |
| - | ------ | -------- |
| 1 | Navegar por categorías | Filtra productos correctamente |
| 2 | Buscar “cappuccino” | Aparece el producto |
| 3 | Abrir detalle de un producto con opciones | Opciones obligatorias bloquean “Agregar” hasta elegirlas |
| 4 | Agregar producto con extras (ej. shot extra) | El precio sube según el extra |
| 5 | Agregar producto en promoción | Se ve el descuento aplicado |
| 6 | Abrir carrito flotante | Lista de ítems y total coinciden |
| 7 | Modificar cantidad en carrito | Total se actualiza |
| 8 | Vaciar carrito y volver al menú | Carrito en cero |

### 6.3 Checkout — Retiro

| # | Acción | Esperado |
| - | ------ | -------- |
| 1 | Con carrito ≥ $9.000, ir a checkout | Modalidad “Retiro” disponible |
| 2 | Elegir retiro, efectivo | Campos nombre y teléfono visibles |
| 3 | Confirmar sin completar campos | Muestra error de validación |
| 4 | Completar nombre + teléfono y confirmar | Pedido creado; código visible; opción WhatsApp |
| 5 | Ir a `/order-status` | El pedido aparece en la lista |

### 6.4 Checkout — Delivery

| # | Acción | Esperado |
| - | ------ | -------- |
| 1 | Elegir modalidad Delivery | Pide dirección |
| 2 | Si hay zonas configuradas, elegir una | Aplica costo de envío y mínimo de esa zona |
| 3 | Probar pedido por debajo del mínimo | No deja confirmar; mensaje claro |
| 4 | Agregar propina opcional | El total incluye la propina |
| 5 | Aplicar cupón válido (crear uno en Admin → Comercio si no existe) | Descuento reflejado en total |
| 6 | Aplicar cupón inválido o vencido | Mensaje de error, no descuenta |
| 7 | Confirmar con transferencia | Pedido creado correctamente |

### 6.5 Checkout — Mesa (QR)

| # | Acción | Esperado |
| - | ------ | -------- |
| 1 | Abrir `{URL}/menu?mesa=t4` | Banner “Estás en la Mesa 4” |
| 2 | Ir a checkout | Modalidad mesa automática; sin elegir delivery/retiro |
| 3 | Verificar medios de pago | Efectivo, tarjeta, transferencia — **sin** Mercado Pago |
| 4 | Confirmar pedido | Éxito; no redirige a seguimiento público obligatorio |
| 5 | Tocar “Llamar al mozo” | Mensaje de confirmación en el celular |

### 6.6 Checkout — Mercado Pago

| # | Acción | Esperado |
| - | ------ | -------- |
| 1 | Pedido retiro o delivery, elegir Mercado Pago | Redirige al checkout de MP |
| 2 | Pagar con tarjeta TEST aprobada | Vuelve a la app; pedido pasa a confirmado |
| 3 | Cancelar pago en MP | Pedido queda pendiente o se informa el estado |
| 4 | Intentar MP desde mesa | No debe estar disponible |

### 6.7 Seguimiento (`/order-status`)

| # | Acción | Esperado |
| - | ------ | -------- |
| 1 | Ver lista de pedidos propios | Solo pedidos de este navegador |
| 2 | Buscar `TRACK-000006` | Encuentra el pedido de retiro en estado “Listo” |
| 3 | Buscar código parcial `ORD` | No devuelve resultados (privacidad) |
| 4 | Buscar código inventado | Lista vacía, sin error confuso |
| 5 | Ver barra de progreso | Estados: Pendiente → Confirmado → Preparando → Listo |

### 6.8 Modo offline

| # | Acción | Esperado |
| - | ------ | -------- |
| 1 | Con el menú ya cargado, activar “Modo avión” | Banner o aviso de sin conexión |
| 2 | Confirmar pedido en efectivo (no MP) | Se guarda localmente; mensaje de sincronización pendiente |
| 3 | Restaurar conexión | El pedido se envía solo; desaparece el indicador offline |
| 4 | Visitar `{URL}/offline` sin red | Pantalla dedicada de sin conexión |

---

## 7. Pruebas del panel de operaciones (Staff)

Acceso: `{URL}/staff` · Login: cadete, cajero o admin.

### 7.1 Pedidos

| # | Acción | Esperado |
| - | ------ | -------- |
| 1 | Ver contadores (pendientes, preparando, listos) | Coinciden con la lista |
| 2 | Filtrar por tipo: delivery / retiro / mesa | Filtra correctamente |
| 3 | Buscar por nombre o código | Encuentra el pedido |
| 4 | Abrir detalle de un pedido | Ítems, opciones, total y notas visibles |
| 5 | Avanzar estados paso a paso | Cada cambio se guarda y actualiza la UI |
| 6 | Cancelar un pedido de prueba | Pasa a cancelado |
| 7 | Crear pedido nuevo desde retiro y verificar alerta sonora | Suena al llegar pendiente (si el navegador lo permite) |

### 7.2 Cocina (KDS)

| # | Acción | Esperado |
| - | ------ | -------- |
| 1 | Ver comandas pendientes/confirmadas | Lista actualizada |
| 2 | “Tomar comanda” en un pedido | Pasa a “Preparando” |
| 3 | Ver detalle: mesa o tipo, ítems | Información completa y legible |
| 4 | Esperar ~10 s sin tocar nada | La pantalla se actualiza sola |

### 7.3 Mesas

| # | Acción | Esperado |
| - | ------ | -------- |
| 1 | Ver mapa con colores por estado | Libre, ocupada, espera, finalizada |
| 2 | Seleccionar mesa ocupada (ej. Mesa 2) | Muestra pedidos de la sesión |
| 3 | Agregar productos desde el panel | Se suman al pedido de la mesa |
| 4 | Enviar a cocina | Aparece en Cocina |
| 5 | Cerrar cuenta con efectivo/tarjeta/transferencia | Mesa queda libre; pedido completado |

### 7.4 Cadetes

| # | Acción | Esperado |
| - | ------ | -------- |
| 1 | Ver entregas activas de delivery | Lista con dirección y total |
| 2 | Asignar cadete (Isaac / cadete@cotycafe.com) | Queda asignado |
| 3 | Marcar “Retirado” → “Entregado” | Estados avanzan |
| 4 | Completar desde Pedidos | Pedido finalizado en historial |

### 7.5 Llamados de mozo

| # | Acción | Esperado |
| - | ------ | -------- |
| 1 | Desde celular en `{URL}/menu?mesa=t4`, llamar al mozo | Solicitud aparece en Staff → Llamados |
| 2 | Tocar “Atender” | Estado cambia |
| 3 | Tocar “Listo” | Solicitud desaparece o queda resuelta |

### 7.6 Caja (desde Staff — cajero/admin)

| # | Acción | Esperado |
| - | ------ | -------- |
| 1 | Abrir caja con monto inicial (ej. $5000) | Sesión activa visible |
| 2 | Registrar un gasto | Aparece en movimientos |
| 3 | Registrar retiro y depósito | Saldo esperado se recalcula |
| 4 | Cerrar turno con monto contado | Muestra diferencia vs. esperado |

### 7.7 Permisos del cadete

| # | Acción | Esperado |
| - | ------ | -------- |
| 1 | Login como cadete (`5678`) | Solo `/staff`, no `/admin` |
| 2 | Intentar abrir `{URL}/admin` manualmente | Acceso denegado o redirección |
| 3 | Entrar a Caja en staff | La sección es visible, pero abrir/cerrar caja debe fallar (sin permiso `cashier:close`) |

---

## 8. Pruebas del panel de administración

Acceso: `{URL}/admin` · Login: admin o cajero (permisos limitados).

### 8.1 Dashboard (solo admin)

| # | Acción | Esperado |
| - | ------ | -------- |
| 1 | Ver resumen del día | Ventas, pedidos, ticket promedio |
| 2 | Cambiar rango de fechas en reporte | Gráficos y totales se actualizan |
| 3 | Ver gráfico por hora y por canal | Datos coherentes |
| 4 | Buscar en historial de ventas | Paginación y búsqueda funcionan |
| 5 | Exportar CSV y Excel | Archivo descargado con datos |

### 8.2 Productos

| # | Acción | Esperado |
| - | ------ | -------- |
| 1 | Crear producto de prueba “QA Test Latte” | Aparece en menú público |
| 2 | Agregar opción obligatoria (tamaño) | En menú, exige elegir tamaño |
| 3 | Marcar como no disponible | Desaparece o no se puede pedir |
| 4 | Activar control de stock con umbral | Alerta al bajar del umbral |
| 5 | Editar precio | Reflejado en menú y checkout |
| 6 | Eliminar o desactivar producto QA | Ya no visible para clientes |

### 8.3 Categorías

| # | Acción | Esperado |
| - | ------ | -------- |
| 1 | Crear categoría “Pruebas QA” con icono | Visible en admin |
| 2 | Cambiar orden de aparición | Orden correcto en menú |
| 3 | Desactivar categoría | Sus productos no se muestran en menú |

### 8.4 Promociones

| # | Acción | Esperado |
| - | ------ | -------- |
| 1 | Crear promo 10% en un producto | Descuento visible en menú/checkout |
| 2 | Definir vigencia futura | No aplica antes de la fecha |
| 3 | Desactivar promo | Descuento deja de aplicarse |

### 8.5 Mesas

| # | Acción | Esperado |
| - | ------ | -------- |
| 1 | Crear mesa nueva (número, capacidad) | Aparece en grilla |
| 2 | Ver y descargar QR de la mesa | QR abre menú con mesa correcta |
| 3 | Descarga masiva de QR | Archivo con todos los QR |
| 4 | Cargar pedido manual desde admin | Pedido asociado a la mesa |
| 5 | Cambiar estado de mesa | Color actualizado en staff |

### 8.6 Personal

| # | Acción | Esperado |
| - | ------ | -------- |
| 1 | Crear usuario staff de prueba | Puede iniciar sesión |
| 2 | Asignar rol Cajero y PIN | Login con PIN funciona |
| 3 | Desactivar usuario | No puede iniciar sesión |
| 4 | Editar teléfono | Enlace WhatsApp correcto |

### 8.7 Turnos y horarios

| # | Acción | Esperado |
| - | ------ | -------- |
| 1 | Cerrar el negocio (interruptor global) | Checkout bloqueado; landing muestra cerrado |
| 2 | Desactivar canal Retiro | No se puede elegir retiro en checkout |
| 3 | Crear franja horaria solo para delivery | Fuera de horario, delivery cerrado |
| 4 | Volver a abrir todo | Canales habilitados de nuevo |

### 8.8 Comercio

| Pestaña | Prueba | Esperado |
| ------- | ------ | -------- |
| Zonas | Crear “Zona Norte” con fee $50 y mínimo $150 | Checkout aplica valores al elegir zona |
| Cupones | Crear `QA10` 10% con mínimo $9.000 | Válido en checkout |
| Reservas | Registrar reserva para mañana 20:00 | Aparece en listado |
| Facturas | Generar comprobante de un pedido existente | Número `FAC-...` generado |
| Clientes | Ver cliente con pedidos previos | Teléfono, cantidad y total correctos |

### 8.9 Configuración

| # | Acción | Esperado |
| - | ------ | -------- |
| 1 | Cambiar nombre del negocio | Reflejado en landing |
| 2 | Subir o cambiar logo | Visible en header |
| 3 | Modificar pedido mínimo y fee delivery | Checkout valida nuevos valores |
| 4 | Generar QR del menú general | QR abre menú sin mesa |
| 5 | Activar/desactivar Mercado Pago | Opción aparece o desaparece en checkout |

### 8.10 Permisos del cajero

| # | Acción | Esperado |
| - | ------ | -------- |
| 1 | Login `cajero@cotycafe.com` | Entra a admin en sección Mesas |
| 2 | Verificar menú lateral | **No** ve: Dashboard, Productos, Personal, Comercio, Turnos |
| 3 | Acceder a Mesas y Caja | Funciona con normalidad |
| 4 | Ver Configuración | Solo lectura |

---

## 9. Flujos integrados (end-to-end)

Estos escenarios cruzan varios roles. Ideal para una demo o validación final.

### Escenario A — Retiro completo

```
Cliente (incógnito)          Staff (cadete)              Admin (opcional)
─────────────────────────────────────────────────────────────────────────
1. Menú → 2 Cappuccinos
2. Checkout retiro + efectivo
3. Anotar código TRACK-...
                             4. Staff → Pedidos: confirmar
                             5. Cocina: tomar comanda
                             6. Pedidos: Listo → Completado
7. order-status: ver "Completado"
                                                         8. Dashboard: venta en historial
```

**Criterio de éxito:** el pedido recorre todos los estados y aparece en el historial del admin.

### Escenario B — Delivery con cadete

```
Cliente                    Cocina                    Cadetes
────────────────────────────────────────────────────────────
1. Delivery + dirección
2. Confirmar
                           3. Tomar comanda
                           4. Marcar Listo
                                                     5. Asignar cadete
                                                     6. Retirado → Entregado
Staff → Pedidos: Entregar → Completado
```

### Escenario C — Mesa con llamado y cierre

```
Cliente (QR mesa t4)       Cocina          Staff Mesas        Caja
──────────────────────────────────────────────────────────────────
1. Pedir desde QR
2. Llamar al mozo
                           3. Comanda
                                           4. Atender llamado
                                           5. Agregar postre
                                           6. Cerrar cuenta (efectivo)
7. Mesa queda libre en mapa
```

### Escenario D — Mercado Pago

```
Cliente                         Sistema
────────────────────────────────────────
1. Retiro + Mercado Pago
2. Pagar en MP (tarjeta TEST)
3. Volver a la app
4. order-status: Confirmado
```

### Escenario E — Offline

```
Cliente (celular)              Al recuperar red
───────────────────────────────────────────────
1. Modo avión ON
2. Pedido retiro + efectivo
3. Ver “pendiente de sincronizar”
                               4. Pedido aparece en Staff → Pedidos
```

---

## 10. Casos especiales y validaciones negativas

| Caso | Cómo probarlo | Esperado |
| ---- | ------------- | -------- |
| Local cerrado | Admin → Turnos → cerrar negocio | Checkout no permite confirmar |
| Canal cerrado | Desactivar solo Delivery | Retiro y mesa siguen; delivery no |
| Pedido mínimo | Carrito de $5.000 con mínimo $9.000 | Mensaje claro, botón deshabilitado |
| Producto sin stock | Stock 0 en un producto | No permite agregar o checkout falla con mensaje |
| Opciones obligatorias | Agregar Latte sin tamaño | No agrega al carrito |
| Sesión expirada staff | Dejar panel abierto mucho tiempo | Pide login de nuevo sin perder datos críticos |
| QR mesa inválida | `{URL}/menu?mesa=no-existe` | Mensaje de mesa no válida o menú sin mesa |
| Seguridad seguimiento | Buscar `TRACK-000005` | Muestra pedido **sin** teléfono ni dirección |
| Doble clic en confirmar | Tocar “Confirmar” dos veces rápido | Un solo pedido creado |
| PWA instalada | Abrir desde ícono en inicio | Funciona igual que en navegador |

---

## 11. Cómo reportar un problema

Copiá esta plantilla por cada bug:

```
Título: [breve descripción]

Severidad: Bloqueante / Alta / Media / Baja

Entorno: {URL}
Fecha y hora:
Dispositivo y navegador:
Usuario / rol (si aplica):

Pasos para reproducir:
1.
2.
3.

Resultado esperado:

Resultado actual:

Capturas o video: (adjuntar)

Datos extra: código de pedido, mesa, producto, etc.
```

**Severidad sugerida:**

- **Bloqueante:** no se pueden tomar o cobrar pedidos.
- **Alta:** flujo principal roto (checkout, cocina, cierre de mesa).
- **Media:** funciona con workaround.
- **Baja:** visual, textos, mejoras.

---

## 12. Checklist final de cobertura

Marcá cuando hayas probado cada área:

### Cliente
- [ ] Landing e información del local
- [ ] Menú, búsqueda y categorías
- [ ] Carrito y promociones
- [ ] Checkout retiro
- [ ] Checkout delivery (zonas, cupón, propina)
- [ ] Checkout mesa (QR)
- [ ] Mercado Pago
- [ ] Seguimiento de pedido
- [ ] Modo offline
- [ ] PWA / instalación en celular

### Staff
- [ ] Pedidos (filtros, estados, cancelar)
- [ ] Cocina (KDS)
- [ ] Mesas (agregar ítems, cerrar cuenta)
- [ ] Cadetes
- [ ] Llamados de mozo
- [ ] Caja (apertura, movimientos, cierre)

### Admin
- [ ] Dashboard y exportaciones
- [ ] Productos y categorías
- [ ] Promociones
- [ ] Mesas y QR
- [ ] Personal y permisos
- [ ] Turnos y horarios
- [ ] Comercio (zonas, cupones, reservas, facturas, clientes)
- [ ] Configuración general

### Integración
- [ ] Flujo retiro E2E
- [ ] Flujo delivery E2E
- [ ] Flujo mesa E2E
- [ ] Flujo Mercado Pago E2E
- [ ] Flujo offline E2E
- [ ] Permisos admin vs cajero vs cadete

---

## 13. Anexo: levantar entorno local (opcional)

Solo para quienes prueban en su propia máquina.

### Requisitos

- Node.js 20+
- pnpm 10+
- PostgreSQL local

### Pasos

```bash
# 1. Clonar e instalar
pnpm install

# 2. Variables de entorno
cp .env.example .env
# Editar .env con DATABASE_URL, NEXTAUTH_SECRET, etc.

# 3. Base de datos
pnpm prisma:migrate
pnpm db:seed

# 4. Servidor de desarrollo
pnpm dev
# Abrir http://localhost:3000
```

### Tests automáticos (referencia técnica)

```bash
pnpm test:e2e
```

Cubre: API de seguimiento, validación de pedidos, flujo retiro y checkout UI básico.

---

## Documentos relacionados

- [Guía del sistema (funcional)](./GUIA-CLIENTE.md) — qué hace cada pantalla y flujo de negocio.
- Credenciales y datos: generados por `pnpm db:seed`.

---

*Última actualización: junio 2026 · Coty Café*
