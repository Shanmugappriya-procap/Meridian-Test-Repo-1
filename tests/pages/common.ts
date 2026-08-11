import { expect, Page } from '@playwright/test';
import data from '../data/test-data.json';

export class Products {
  constructor(private readonly page: Page) {}
  async openShop() { await this.page.getByRole('button', { name: 'Shop Now →' }).click(); await expect(this.page.getByRole('heading', { name: 'Shop All' })).toBeVisible(); }
}
export class Filters {
  constructor(private readonly page: Page) {}
  async apply(id: string, label: string, count: string) { await this.page.getByRole('button', { name: label }).click(); await expect(this.page.getByTestId(id)).toHaveClass(/filter-btn|active/); await expect(this.page.getByTestId('product-count')).toContainText(count); }
  async all() { await expect(this.page.getByTestId(data.filters.all.id)).toHaveClass(/active/); await expect(this.page.getByTestId('product-count')).toContainText(data.filters.all.count); }
}
export class Logout { constructor(private readonly page: Page) {} async run() { await this.page.locator('#auth-nav-btn').click(); await expect(this.page.locator('#toast')).toContainText(data.logout); } }
