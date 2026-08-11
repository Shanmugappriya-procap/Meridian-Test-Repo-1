import { expect, Page } from '@playwright/test';
import data from '../data/test-data.json';
export class Search { constructor(private readonly page: Page) {} async run() { await this.page.getByRole('button', { name: '🔍 Search' }).click(); const input = this.page.getByPlaceholder('Search products…'); await input.fill(data.search.query); await input.press('Enter'); await expect(this.page.locator('#search-results-count')).toContainText(String(data.search.expectedMinResults)); } }
