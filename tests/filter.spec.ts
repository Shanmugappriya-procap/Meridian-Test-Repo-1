import { test } from '@playwright/test';
import { Login } from './pages/login';
import { Products, Filters, Logout } from './pages/common';
import data from './data/test-data.json';
test('Filter products by category', async ({ page }) => { const login=new Login(page); await login.open(); await login.openLogin(); await login.login(); await new Products(page).openShop(); const f=new Filters(page); await f.all(); await f.apply(data.filters.clothing.id,'Clothing',data.filters.clothing.count); await f.apply(data.filters.accessories.id,'Accessories',data.filters.accessories.count); await f.apply(data.filters.home.id,'Home',data.filters.home.count); await f.apply(data.filters.beauty.id,'Beauty',data.filters.beauty.count); await new Logout(page).run(); });
