import { Page, Locator, expect } from '@playwright/test';
import testData from '../Data/TestData.json';

export class Login {
    readonly page: Page;
    readonly url;
    readonly homeLanding;
    readonly loginButton;
    readonly loginLanding;
    readonly emailInput;
    readonly passwordInput;
    readonly signInButton;
    readonly successfulLogin;
    readonly loginValidation;

    constructor(page: Page) {
        this.page = page;
        this.url = "https://shanmugappriya-procap.github.io/haus-store/";
        this.homeLanding = page.getByRole('paragraph').filter({ hasText: 'New Collection — Spring' });
        this.loginButton = page.getByRole('button', { name: 'Sign In' }).first();
        this.loginLanding = page.getByText('Sign In').first();
        this.emailInput = page.getByPlaceholder('you@example.com').nth(1);
        this.passwordInput = page.locator('#login-password').first();
        this.signInButton = page.getByTestId('login-btn').first();
        this.successfulLogin = page.locator('#profile-email').first();
        this.loginValidation = page.locator('#login-error').first();

    }

    async gotoUrl() {
        await this.page.goto(this.url);
        await expect(this.homeLanding).toBeVisible();
    }

    async gotoLogin() {
        await this.loginButton.click();
        await expect(this.loginLanding).toBeVisible();
    }
    
    //Valid Login
    async performLogin() {
        await this.emailInput.fill(testData.users.validUser.email);
        await this.passwordInput.fill(testData.users.validUser.password);
        await this.signInButton.click();
        await expect(this.successfulLogin).toBeVisible();
    }

    //Invalid Login
    async performInvalidLogin() {
        await this.emailInput.fill(testData.users.invalidUser.email);
        await this.passwordInput.fill(testData.users.invalidUser.password);
        await this.signInButton.click();
        await expect(this.loginValidation).toContainText(testData.toastMessages.invalidLogin);
    }

}