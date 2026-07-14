import { Page, expect } from '@playwright/test';
import cartData from '../Data/CartData.json';

export class Cart {
    readonly page: Page;
    readonly cartPageLanding;
    readonly summarySubtotal;
    readonly summaryShipping;
    readonly summaryTax;
    readonly summaryTotal;
    readonly promoInput;
    readonly promoApplyBtn;
    readonly toast;
    readonly checkoutBtn;
    readonly checkOutLanding;

    //XPath scoped to page-products
    get productNameLocator() {
        return this.page
            .locator('#page-products')
            .locator("//div[@class='product-name']");
    }

    get cartCount() {
        return this.page.locator("//span[@id='cart-count']").first();
    }

    constructor(page: Page) {
        this.page = page;
        this.cartPageLanding = page.getByText("Your Cart").first();
        this.summarySubtotal = page.locator('#page-cart').getByTestId('summary-subtotal').first();
        this.summaryShipping = page.locator('#page-cart').getByTestId('summary-shipping').first();
        this.summaryTax = page.locator('#page-cart').getByTestId('summary-tax').first();
        this.summaryTotal = page.locator('#page-cart').getByTestId('summary-total').first();
        this.promoInput = page.locator('#page-cart').getByTestId('promo-input').first();
        this.promoApplyBtn = page.locator('#page-cart').getByTestId('promo-apply-btn').first();
        this.toast = page.locator('#toast').first();
        this.checkoutBtn = page.getByRole('button', { name: 'Proceed to Checkout' }).first();
        this.checkOutLanding = page.locator('//h3[text()="Order Summary"]').first();
    }

    async addProductsDynamically() {
        const products = cartData.cartProducts.multipleAdd.products;

        for (const product of products) {

            // Pick product by index from JSON
            const productCard = this.productNameLocator
                .nth(product.index)
                .locator("xpath=ancestor::div[contains(@class,'product-card')]");

            // Click Add to Cart
            await productCard.getByTestId(product.testId).click();

            // Confirm toast
            await expect(this.page.locator('#toast').first())
                .toContainText('added to cart', { timeout: 6000 });

            console.log(`✅ Added: ${product.name}`);
        }

        // Final cart count assertion
        await expect(this.cartCount)
            .toHaveText(cartData.cartProducts.multipleAdd.expectedCartCount);
    }

    async gotoCart() {
        await this.cartCount.click();
        await expect(this.cartPageLanding).toBeVisible();

    }

    async verifyCartPricing() {
        const products = cartData.cartProducts.multipleAdd.products;
        const pricing = cartData.cartProducts.multipleAdd.pricing;

        // Calculate from JSON
        const calculatedSubtotal = products.reduce((sum, p) => sum + p.price, 0);
        const calculatedTax = parseFloat((calculatedSubtotal * pricing.taxRate).toFixed(2));
        const calculatedTotal = parseFloat((calculatedSubtotal + calculatedTax + pricing.shipping).toFixed(2));

        // Assert calculated values match JSON
        expect(calculatedSubtotal).toBe(pricing.subtotal);
        expect(calculatedTax).toBe(pricing.tax);
        expect(calculatedTotal).toBe(pricing.total);

        // Assert UI values match JSON
        await expect(this.summarySubtotal).toContainText(pricing.formattedSubtotal);
        await expect(this.summaryShipping).toContainText(pricing.formattedShipping);
        await expect(this.summaryTax).toContainText(pricing.formattedTax);
        await expect(this.summaryTotal).toContainText(pricing.formattedTotal);
    }

    // ── Apply promo code and verify ───────────────────────────
    async applyPromoCode(promoKey: 'HAUS20' | 'FREESHIP' | 'INVALID') {
        const promo = cartData.cartProducts.promoCodes[promoKey];

        await this.promoInput.fill(promo.code);
        await this.promoApplyBtn.click();

        await expect(this.toast)
            .toContainText(promo.expectedToast, { timeout: 6000 });
    }

    // ── Verify discounted total after HAUS20 ──────────────────
    async verifyHaus20Discount() {
        const p = cartData.cartProducts.promoCodes.HAUS20;

        const discountedSubtotal = parseFloat((p.discountedSubtotal).toFixed(2));
        const discountedTax = parseFloat((discountedSubtotal * 0.08).toFixed(2));
        const discountedTotal = parseFloat((discountedSubtotal + discountedTax).toFixed(2));

        expect(discountedSubtotal).toBe(p.discountedSubtotal);
        expect(discountedTax).toBe(p.tax);
        expect(discountedTotal).toBe(p.total);

        await expect(this.summaryTotal).toContainText(p.formattedTotal);
    }

    // ── Verify free shipping after FREESHIP ───────────────────
    async verifyFreeShipping() {
        const p = cartData.cartProducts.promoCodes.FREESHIP;

        await expect(this.summaryShipping).toContainText(p.formattedShipping);
        await expect(this.summaryTotal).toContainText(p.formattedTotal);
    }

    async proceedToCheckout() {
        await this.checkoutBtn.click();
        await expect(this.checkOutLanding).toHaveText('Order Summary');
    }
}