import { expect, test } from '@playwright/test'

test.describe('Seguridad API de seguimiento', () => {
  test('búsqueda parcial no expone pedidos ajenos', async ({ request }) => {
    const partial = await request.get('/api/orders/track?query=ORD')
    expect(partial.ok()).toBeTruthy()
    const partialBody = await partial.json()
    expect(partialBody).toEqual([])
  })

  test('código exacto del seed devuelve pedido sin PII', async ({ request }) => {
    const exact = await request.get('/api/orders/track?query=TRACK-000005')
    expect(exact.ok()).toBeTruthy()
    const orders = await exact.json()
    expect(orders.length).toBeGreaterThan(0)

    const order = orders[0]
    expect(order.publicTrackingCode).toBe('TRACK-000005')
    expect(order.customerPhone).toBe('')
    expect(order.customerAddress).toBeUndefined()
    expect(order.paymentUrl).toBeUndefined()
  })

  test('código inventado devuelve lista vacía', async ({ request }) => {
    const response = await request.get('/api/orders/track?query=TRK-INVENTADO99')
    expect(response.ok()).toBeTruthy()
    expect(await response.json()).toEqual([])
  })
})

test.describe('Validación de pedidos API', () => {
  test('payload vacío responde 400', async ({ request }) => {
    const response = await request.post('/api/orders', {
      data: {},
    })
    expect(response.status()).toBe(400)
    const body = await response.json()
    expect(body.error).toBeTruthy()
  })

  test('mesa inexistente en llamado mozo responde 404', async ({ request }) => {
    const response = await request.post('/api/table-calls', {
      data: { tableId: 'mesa-inexistente-qa' },
    })
    expect(response.status()).toBe(404)
  })

  test('preferencia MP requiere trackingProof', async ({ request }) => {
    const response = await request.post('/api/payments/mercadopago/create-preference', {
      data: { orderId: 'fake-order-id' },
    })
    expect(response.status()).toBe(400)
  })

  test('preferencia MP con prueba inválida responde 403', async ({ request }) => {
    const track = await request.get('/api/orders/track?query=TRACK-000005')
    expect(track.ok()).toBeTruthy()
    const orders = await track.json()
    expect(orders.length).toBeGreaterThan(0)

    const response = await request.post('/api/payments/mercadopago/create-preference', {
      data: { orderId: orders[0].id, trackingProof: '0'.repeat(64) },
    })
    expect(response.status()).toBe(403)
  })
})

test.describe('Flujo cliente retiro E2E', () => {
  test('crear pedido retiro desde API y verificar seguimiento', async ({ request }) => {
    const catalog = await request.get('/api/catalog')
    expect(catalog.ok()).toBeTruthy()
    const catalogData = await catalog.json()
    const { products, settings } = catalogData
    const product = products.find((item: { available: boolean; id: string; price: number }) => item.available)
    expect(product).toBeTruthy()

    const minOrder = settings?.minOrderAmount ?? 0
    const quantity = Math.max(1, Math.ceil(minOrder / product.price))

    const createResponse = await request.post('/api/orders', {
      data: {
        type: 'pickup',
        paymentMethod: 'cash',
        customerName: 'Cliente QA E2E',
        customerPhone: '+5491112345678',
        items: [
          {
            productId: product.id,
            quantity,
            selectedOptions: [],
          },
        ],
      },
    })

    if (createResponse.status() !== 201) {
      const errorBody = await createResponse.json()
      throw new Error(`Pedido falló (${createResponse.status()}): ${errorBody.error}`)
    }

    const order = await createResponse.json()
    expect(order.publicTrackingCode).toBeTruthy()
    expect(order.status).toBe('confirmed')
    expect(order.customerPhone).toBe('')
    expect(order.customerAddress).toBeUndefined()
    expect(order.trackingProof).toBeTruthy()

    const trackResponse = await request.get(`/api/orders/track?query=${order.publicTrackingCode}`)
    expect(trackResponse.ok()).toBeTruthy()
    const tracked = await trackResponse.json()
    expect(tracked).toHaveLength(1)
    expect(tracked[0].id).toBe(order.id)
    expect(tracked[0].customerPhone).toBe('')
  })
})

test.describe('Flujo UI cliente', () => {
  test('checkout retiro con carrito precargado', async ({ page, request }) => {
    test.setTimeout(60_000)

    const catalogResponse = await request.get('/api/catalog')
    const { products } = await catalogResponse.json()
    const product = products.find((item: { id: string }) => item.id === 'espresso')
    expect(product).toBeTruthy()

    const cartItem = {
      id: 'cart-e2e-test',
      product,
      quantity: 3,
      selectedOptions: [],
    }

    await page.addInitScript((cart) => {
      window.localStorage.setItem('coty-cafe-cart', JSON.stringify(cart))
    }, [cartItem])
    await page.goto('/checkout')
    await page.waitForLoadState('networkidle')
    await expect(page.getByText('Espresso').first()).toBeVisible({ timeout: 15_000 })

    const confirmOpenButton = page.getByRole('button', { name: /confirmar pedido/i })
    await expect(confirmOpenButton).toBeVisible({ timeout: 15_000 })
    await expect(confirmOpenButton).toBeEnabled({ timeout: 15_000 })
    await confirmOpenButton.click()

    await expect(page.locator('#name')).toBeVisible({ timeout: 10_000 })
    await page.locator('#name').fill('Cliente UI E2E')
    await page.locator('#phone').fill('1122334455')

    await page.getByRole('button', { name: /confirmar y enviar/i }).click()

    await expect(page.getByText(/pedido|confirmado|gracias|whatsapp/i).first()).toBeVisible({ timeout: 20_000 })
  })

  test('menú carga productos disponibles', async ({ page }) => {
    await page.goto('/menu')
    await expect(page.getByText('Espresso').first()).toBeVisible({ timeout: 15_000 })
  })
})
