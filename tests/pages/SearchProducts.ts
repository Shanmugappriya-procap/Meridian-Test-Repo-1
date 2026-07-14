import { Page, Locator, expect } from '@playwright/test';
import testData from '../Data/TestData.json';

export class SearchProducts {
    readonly page: Page;
    readonly SearchIcon;
    readonly searchInput;
    readonly searchResults;
    readonly searchCount;

    constructor(page: Page) {
        this.page = page;
        this.SearchIcon = page.getByRole('button', { name: '🔍 Search' }).first();
        this.searchInput = page.getByPlaceholder('Search products…').first();
        this.searchResults = page.locator('.search-results').first();
        this.searchCount = page.locator('#search-results-count').first();

    }

    async performSearch() {
        //Perform search and validate results - To be implemented

        const s = testData.filters.search.validQueries;
        await this.SearchIcon.click();
        await this.searchInput.fill(s[0].query)
        await this.page.keyboard.press('Enter');
        await expect(this.searchCount).toContainText(String(s[0].expectedMinResults))
    }

}