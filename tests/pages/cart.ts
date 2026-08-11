import { expect, Page } from '@playwright/test';
import data from '../data/test-data.json';
export class Cart {
  constructor(private readonly page: Page) {}
  async add() { for (const [index, id] of ['quick-add-2', 'quick-add-3', 'quick-add-4'].entries()) { await this.page.getByTestId(id).click(); await expect(this.page.locator('#toast')).toContainText('added to cart'); } await expect(this.page.locator('#cart-count')).toHaveText(data.cart.count); }
  async open() { await this.page.locator('#cart-count').click(); await expect(this.page.getByText('Your Cart')).toBeVisible(); }
  async pricing() { await expect(this.page.getByTestId('summary-subtotal')).toContainText(data.cart.subtotal); await expect(this.page.getByTestId('summary-shipping')).toContainText(data.cart.shipping); await expect(this.page.getByTestId('summary-tax')).toContainText(data.cart.tax); await expect(this.page.getByTestId('summary-total')).toContainText(data.cart.total); }
  async promo(code: string, message: string) { await this.page.getByTestId('promo-input').fill(code); await this.page.getByTestId('promo-apply-btn').click(); await expect(this.page.locator('#toast')).toContainText(message); }
  async checkout() { await this.page.getByRole('button', { name: 'Proceed to Checkout' }).click(); await expect(this.page.getByText('Order Summary')).toBeVisible(); }
}
