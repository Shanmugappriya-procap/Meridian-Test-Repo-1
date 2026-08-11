import { test } from '@playwright/test';
import { Login } from './pages/login';
import { Products, Filters, Logout } from './pages/common';

test.describe.configure({ mode: 'serial' });

test('seed authenticated storage state', async ({ page, context }) => {
  const login = new Login(page);
  await login.open();
  await login.openLogin();
  await login.login();
  await context.storageState({ path: 'playwright/.auth/user.json' });
});

test('seed coverage', async ({ page }) => {
  await new Products(page).openShop();
  await new Filters(page).all();
  await new Logout(page).run();
});
