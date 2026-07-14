import { Page, Locator, expect } from '@playwright/test';
import testData from '../Data/TestData.json';

export class Products {
    readonly page: Page;
    readonly logo;
    readonly shopNowButton;
    readonly assertion;


    constructor(page: Page) {
        this.page = page;
        this.logo = page.locator('//div[@data-testid="logo"]').first();
        this.shopNowButton = page.getByRole('button', { name: 'Shop Now →' });
        this.assertion = page.getByRole('heading', { name: 'Shop All' });

    }

    //Goto Shop Now page
    async gotoShopNow() {
        await this.logo.click();
        await this.shopNowButton.click();
        await expect(this.assertion).toBeVisible();
    }
}