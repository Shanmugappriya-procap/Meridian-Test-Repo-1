import { Page, Locator, expect } from '@playwright/test';
import CheckOutDetails from '../Data/CheckoutDetails.json';

export class CheckOut {
    readonly page: Page;
    readonly emailInput;
    readonly PhoneInput;
    readonly firstNameInput;
    readonly lastNameInput;
    readonly addressInput;
    readonly cityInput;
    readonly postalCodeInput;
    readonly countryInput;
    readonly cardnumberInput;
    readonly expiryInput;
    readonly cvvInput;
    readonly nameOnCardInput;
    readonly placeOrderBtn;
    readonly orderConfirmation;
    readonly shippingType;
    readonly successfulOrderMessage;

    constructor(page: Page) {
        this.page = page;
        this.emailInput = page.getByPlaceholder('you@example.com').first();
        this.PhoneInput = page.getByPlaceholder('+1 (555) 000-0000').first();
        this.firstNameInput = page.getByPlaceholder('Jane').first();
        this.lastNameInput = page.getByPlaceholder('Smith').first();
        this.addressInput = page.getByPlaceholder('123 Main Street').first();
        this.cityInput = page.getByPlaceholder('New York').first();
        this.postalCodeInput = page.getByPlaceholder('10001').first();
        this.countryInput = page.locator('#co-country').first();
        this.cardnumberInput = page.getByPlaceholder('1234 5678 9012 3456').first();
        this.expiryInput = page.getByPlaceholder('MM / YY').first();
        this.cvvInput = page.getByPlaceholder('•••').first();
        this.nameOnCardInput = page.getByPlaceholder('Jane Smith').first();
        this.placeOrderBtn = page.getByRole('button', { name: 'Place Order →' }).first();
        this.orderConfirmation = page.locator('#order-confirmation').first();
        this.shippingType = page.locator('//label[@class="radio-item selected"]').first();
        this.successfulOrderMessage = page.getByText("Order Placed!").first();

    }

    async fillContactInformation() {
        const c = CheckOutDetails.CheckoutDetails.ContactInfo;
        await this.emailInput.fill(c.email);
        await this.PhoneInput.fill(c.phone);
        await this.firstNameInput.fill(c.firstName);
        await this.lastNameInput.fill(c.lastName);
        await this.addressInput.fill(c.address);
        await this.cityInput.fill(c.city);
        await this.postalCodeInput.fill(c.zip);
        await this.countryInput.selectOption(c.country);
    }
    async chooseShippingMethod() {
        await this.shippingType.click();
        await expect(this.shippingType).toBeChecked();
    }
    async fillPaymentDetails() {
        const p = CheckOutDetails.CheckoutDetails.PaymentInfo;
        await this.cardnumberInput.fill(p.cardNumber);
        await this.expiryInput.fill(p.expiry);
        await this.cvvInput.fill(p.cvv);
        await this.nameOnCardInput.fill(p.nameOnCard);
    }
    async placeOrder() {
        await this.placeOrderBtn.click();
        await expect(this.successfulOrderMessage).toBeVisible();
    }   
}