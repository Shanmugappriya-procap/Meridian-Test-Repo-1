import { test } from '@playwright/test';
import { Login } from './pages/login';
import { Search } from './pages/search';
import { Logout } from './pages/common';
test('Perform search and check the data', async ({ page }) => { const login=new Login(page); await login.open(); await login.openLogin(); await login.login(); await new Search(page).run(); await new Logout(page).run(); });
