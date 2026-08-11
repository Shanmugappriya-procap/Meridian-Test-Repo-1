import { test, expect } from '@playwright/test';
import { Login } from './pages/login';
import { Products, Filters, Logout } from './pages/common';
import { Cart } from './pages/cart';
import { Checkout } from './pages/checkout';
test('End to end ecommerce flow', async ({ page }) => { const login=new Login(page); await login.open(); await login.openLogin(); await login.invalidLogin(); await login.login(); await new Products(page).openShop(); await new Filters(page).all(); const cart=new Cart(page); await cart.add(); await cart.open(); await cart.pricing(); await cart.promo('HAUS20','Promo code applied: 20% off!'); await cart.promo('FREESHIP','Free shipping applied!'); await cart.promo('FAKECODE','Invalid promo code'); await cart.checkout(); await new Checkout(page).run(); await expect(page.getByText('Order placed successfully')).toBeVisible(); await new Logout(page).run(); });
