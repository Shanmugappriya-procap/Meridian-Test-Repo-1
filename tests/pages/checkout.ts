import { expect, Page } from '@playwright/test';
import data from '../data/test-data.json';
export class Checkout {
  constructor(private readonly page: Page) {}
  async run() { const c=data.checkout; for (const [p,v] of [['you@example.com',c.email],['+1 (555) 000-0000',c.phone],['Jane',c.firstName],['Smith',c.lastName],['123 Main Street',c.address],['New York',c.city],['10001',c.zip],['1234 5678 9012 3456',c.card],['MM / YY',c.expiry],['•••',c.cvv],['Jane Smith',c.name]] as const) await this.page.getByPlaceholder(p).first().fill(v); await this.page.locator('#co-country').selectOption(c.country); await this.page.getByRole('button', { name: 'Place Order →' }).click(); await expect(this.page.getByText('Order Placed!')).toBeVisible(); }
}
