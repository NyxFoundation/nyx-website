import { test, expect } from '@playwright/test'

const base = process.env.BASE_URL || 'http://localhost:3000'

test.describe('smoke @smoke', () => {
  test('home renders hero', async ({ page }) => {
    await page.goto(base)
    await expect(page.locator('h1:has-text("Nyx Foundation")')).toBeVisible()
    // ヘッダーナビゲーションの確認
    await expect(page.locator('header').getByRole('link', { name: 'Publication' })).toBeVisible()
    await expect(page.locator('header').getByRole('link', { name: 'News' })).toBeVisible()
  })

  test('header navigation exists', async ({ page }) => {
    await page.goto(base)
    // ヘッダーが存在することを確認
    await expect(page.locator('header')).toBeVisible()
    // ナビゲーションリンクが存在することを確認（ヘッダー内のリンクを指定）
    const header = page.locator('header')
    await expect(header.getByRole('link', { name: 'Publication' })).toBeVisible()
    await expect(header.getByRole('link', { name: 'Member' })).toBeVisible()
    await expect(header.getByRole('link', { name: 'Funding' })).toBeVisible()
    await expect(header.getByRole('link', { name: 'News' })).toBeVisible()
    await expect(header.getByRole('link', { name: 'Job' })).toBeVisible()
  })

  test('locale toggle exists', async ({ page }) => {
    await page.goto(base)
    // 言語切替ボタンが存在することを確認
    const hasLangButton = await page.locator('button:has-text("言語")').count()
    expect(hasLangButton).toBeGreaterThan(0)
  })

  test('hero section content', async ({ page }) => {
    await page.goto(base)
    // Heroセクションのコンテンツを確認（main内のみ）
    const main = page.locator('main')
    await expect(main.getByText('Building humanity\'s coordination space securely for open innovation')).toBeVisible()
    // mainセクション内のリンクを指定
    await expect(main.getByRole('link', { name: 'Publications' })).toBeVisible()
    await expect(main.getByRole('link', { name: 'News' })).toBeVisible()
    await expect(page.locator('text=Contact →')).toBeVisible()
  })
})