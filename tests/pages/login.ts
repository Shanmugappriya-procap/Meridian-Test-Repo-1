import { expect, Page } from '@playwright/test';
import * as fs from 'node:fs';
import * as path from 'node:path';
import data from '../data/test-data.json';

const authState = path.resolve('playwright/.auth/user.json');
if (!fs.existsSync(authState)) {
  fs.mkdirSync(path.dirname(authState), { recursive: true });
  fs.writeFileSync(authState, JSON.stringify({ cookies: [], origins: [] }));
}

export class Login {
  constructor(private readonly page: Page) {}
  async open() { await this.page.goto('/'); await expect(this.page.getByText('Objects of Desire')).toBeVisible(); }
  async openLogin() { await this.page.getByRole('button', { name: 'Sign In' }).first().click(); await expect(this.page.getByText('Sign In').first()).toBeVisible(); }
  async login() { await this.fill(data.validUser.email, data.validUser.password); await expect(this.page.locator('#profile-email')).toBeVisible(); }
  async invalidLogin() { await this.fill(data.invalidUser.email, data.invalidUser.password); await expect(this.page.locator('#login-error')).toContainText(data.invalidLogin); }
  private async fill(email: string, password: string) { await this.page.getByPlaceholder('you@example.com').last().fill(email); await this.page.locator('#login-password').first().fill(password); await this.page.getByTestId('login-btn').first().click(); }
}
