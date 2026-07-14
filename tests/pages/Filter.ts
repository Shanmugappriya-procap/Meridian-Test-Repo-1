import { Page, Locator, expect } from '@playwright/test';
import testData from '../Data/TestData.json';

export class Filter {
    readonly page: Page;
    readonly filterButton;
    readonly filterButtonClothing;
    readonly productCount;

    


    constructor(page: Page) {
        this.page = page;
        this.filterButton = page.locator('//button[@class="filter-btn"]');
        this.filterButtonClothing = page.getByRole('button', { name: 'Clothing' });
        this.productCount = page.getByTestId('product-count');

    }

    //Apply all filter and verify the product count and active state of filter button
    async applyAllFilter() {
        const f = testData.filters.all;
        // await this.filterButton.nth(0).click();
        await expect(this.productCount.nth(0)).toContainText(String(f.expectedCountText));
 
    // ✅ All filter button is active
    await expect(this.page.getByTestId(f.testId).nth(0))
      .toHaveClass(/active/);
      await this.page.waitForTimeout(5000);

    }

    //Apply clothing filter and verify the product count and active state of filter button
    async applyClothingFilter() {
        const f = testData.filters.clothing;
        await this.filterButtonClothing.click();
        await expect(this.productCount.nth(0)).toContainText(String(f.expectedCountText));
 
    // ✅ Clothing filter button is active
    await expect(this.page.getByTestId(f.testId).nth(1))
      .toHaveClass(/filter-btn/);

    }

        //Apply accessories filter and verify the product count and active state of filter button
    async applyAccessoriesFilter() {
        const f = testData.filters.accessories;
        await this.filterButton.nth(1).click();
        await expect(this.productCount.nth(2)).toContainText(String(f.expectedCount));
 
    // ✅ Accessories filter button is active
    await expect(this.page.getByTestId(f.testId).nth(2))
      .toHaveClass(/filter-btn/);

    }

            //Apply beauty filter and verify the product count and active state of filter button
    async applyHomeFilter() {
        const f = testData.filters.beauty;
        await this.filterButton.nth(2).click();
        await expect(this.productCount.nth(3)).toContainText(String(f.expectedCount));
 
    // ✅ Beauty filter button is active
    await expect(this.page.getByTestId(f.testId).nth(3))
      .toHaveClass(/filter-btn/);
    }
        //Apply beauty filter and verify the product count and active state of filter button
    async applyBeautyFilter() {
        const f = testData.filters.beauty;
        await this.filterButton.nth(3).click();
        await expect(this.productCount.nth(4)).toContainText(String(f.expectedCount));
 
    // ✅ Beauty filter button is active
    await expect(this.page.getByTestId(f.testId).nth(3))
      .toHaveClass(/filter-btn/);
    }

}