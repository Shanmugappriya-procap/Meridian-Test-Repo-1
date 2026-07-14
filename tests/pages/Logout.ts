import { Page, Locator, expect } from '@playwright/test';
import testData from '../Data/TestData.json';

export class Logout {
    readonly page: Page;
    readonly profileIcon;
    readonly landingAssertion;
    readonly successfulLogout;

    constructor(page: Page) {
        this.page = page;
        this.landingAssertion = page.locator('#profile-email').first();
        this.profileIcon = page.locator('#auth-nav-btn').first();
        this.successfulLogout = page.locator('successfulLogout');

    }

    async performLogout() {
        // await expect(this.landingAssertion).toBeVisible();
        await this.profileIcon.click();
        await expect(this.page.locator('#toast').nth(0)).toContainText(testData.toastMessages.logout);
    }

}