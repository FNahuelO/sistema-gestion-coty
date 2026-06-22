import { expect, test, type APIRequestContext, type Page } from '@playwright/test'

async function authenticateStaffRequest(request: APIRequestContext, email = 'admin@cotycafe.com') {
  const csrfResponse = await request.get('/api/auth/csrf')
  expect(csrfResponse.ok()).toBeTruthy()
  const { csrfToken } = await csrfResponse.json()

  const signInResponse = await request.post('/api/auth/callback/credentials', {
    form: {
      csrfToken,
      loginMode: 'password',
      email,
      password: 'cotycafe123',
      redirect: 'false',
      json: 'true',
    },
  })
  expect(signInResponse.ok()).toBeTruthy()
}

async function getOrderQuantity(request: APIRequestContext) {
  const catalog = await request.get('/api/catalog')
  expect(catalog.ok()).toBeTruthy()
  const { products, settings } = await catalog.json()
  const product = products.find((item: { available: boolean; id: string; price: number }) => item.available)
  expect(product).toBeTruthy()
  const minOrder = settings?.minOrderAmount ?? 0
  const quantity = Math.max(1, Math.ceil(minOrder / product.price))
  return { product, quantity }
}

async function loginWithEmail(page: Page, email: string, password = 'cotycafe123') {
  await page.goto('/login')
  await expect(page.locator('#email')).toBeVisible()
  await page.locator('#email').fill(email)
  await page.locator('#password').fill(password)
  await page.getByRole('button', { name: /iniciar sesión/i }).click()
  await expect(page).toHaveURL(/\/(admin|staff)/, { timeout: 25_000 })
}

async function loginWithPin(page: Page, pin: string) {
  await page.goto('/login')
  await page.getByRole('tab', { name: 'PIN' }).click()
  await page.locator('[data-slot="input-otp"]').fill(pin)
  await page.getByRole('button', { name: /entrar con pin/i }).click()
  await expect(page).toHaveURL(/\/staff/, { timeout: 25_000 })
}

test.describe('Login staff E2E', () => {
  test('admin ingresa con email y llega al panel admin', async ({ page }) => {
    test.setTimeout(60_000)
    await loginWithEmail(page, 'admin@cotycafe.com')
    await expect(page).toHaveURL(/\/admin/, { timeout: 20_000 })
    await expect(page.getByText(/pedidos de hoy|dashboard/i).first()).toBeVisible({ timeout: 15_000 })
  })

  test('cajero ingresa con email y llega al panel admin', async ({ page }) => {
    test.setTimeout(60_000)
    await loginWithEmail(page, 'cajero@cotycafe.com')
    await expect(page).toHaveURL(/\/admin/, { timeout: 20_000 })
    await expect(page.getByText(/mesas|pedidos/i).first()).toBeVisible({ timeout: 15_000 })
  })

  test('cadete ingresa con PIN y llega al panel staff', async ({ page }) => {
    test.setTimeout(60_000)
    await loginWithPin(page, '5678')
    await expect(page.getByRole('heading', { name: 'Pedidos', exact: true })).toBeVisible({ timeout: 15_000 })
  })
})

test.describe('Flujo delivery E2E', () => {
  test('crear pedido delivery desde API y verificar en panel staff', async ({ request }) => {
    test.setTimeout(90_000)

    const { product, quantity } = await getOrderQuantity(request)

    const createResponse = await request.post('/api/orders', {
      data: {
        type: 'delivery',
        paymentMethod: 'cash',
        customerName: 'Cliente Delivery E2E',
        customerPhone: '+5491199887766',
        customerAddress: 'Av. Corrientes 1234, CABA',
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
      throw new Error(`Pedido delivery falló (${createResponse.status()}): ${errorBody.error}`)
    }

    const order = await createResponse.json()
    expect(order.type).toBe('delivery')
    expect(order.publicTrackingCode).toBeTruthy()
    expect(order.status).toBe('confirmed')
    expect(order.customerPhone).toBe('')
    expect(order.customerAddress).toBeUndefined()
    expect(order.trackingProof).toBeTruthy()

    const trackResponse = await request.get(`/api/orders/track?query=${order.publicTrackingCode}`)
    expect(trackResponse.ok()).toBeTruthy()
    const tracked = await trackResponse.json()
    expect(tracked).toHaveLength(1)
    expect(tracked[0].type).toBe('delivery')
    expect(tracked[0].customerAddress).toBeUndefined()

    await authenticateStaffRequest(request)

    const ordersResponse = await request.get('/api/orders')
    expect(ordersResponse.ok()).toBeTruthy()
    const orders = await ordersResponse.json()
    const found = orders.find((candidate: { id: string }) => candidate.id === order.id)
    expect(found).toBeTruthy()
    expect(found.type).toBe('delivery')
    expect(found.customerAddress).toBe('Av. Corrientes 1234, CABA')
  })
})
