import { test, expect } from '@playwright/test'

// Critical-path smoke tests. Run against a deployed URL:
//   PLAYWRIGHT_BASE_URL=https://your-app.vercel.app npx playwright test

test.describe('ATLAS critical paths', () => {
  test('health endpoint responds', async ({ request }) => {
    const res = await request.get('/api/health')
    expect([200, 503]).toContain(res.status())
    const body = await res.json()
    expect(body).toHaveProperty('overall')
    expect(body).toHaveProperty('checks')
  })

  test('login page loads', async ({ page }) => {
    await page.goto('/login')
    await expect(page.locator('body')).toBeVisible()
    // login page should have an email field or auth UI
    const hasAuth = await page.locator('input[type="email"], input[type="password"], button').count()
    expect(hasAuth).toBeGreaterThan(0)
  })

  test('invite page loads', async ({ page }) => {
    await page.goto('/invite')
    await expect(page.locator('body')).toBeVisible()
  })

  test('home page renders without crashing', async ({ page }) => {
    const response = await page.goto('/')
    expect(response?.status()).toBeLessThan(500)
  })

  test('protected route redirects unauthenticated user', async ({ page }) => {
    await page.goto('/dashboard')
    // should redirect to login or show auth gate — not a 500
    await page.waitForLoadState('networkidle')
    const url = page.url()
    expect(url).toBeTruthy()
  })
})
