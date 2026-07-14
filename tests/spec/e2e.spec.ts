import { test, expect } from "@playwright/test";
import { Login } from "../pages/Login";
import { Logout } from "../pages/Logout";
import { Products } from "../pages/Products";
import { Filter } from "../pages/Filter";
import { Cart } from "../pages/AddProducts";
import { CheckOut } from "../pages/Checkout";
import {JiraReporter} from "../utils/JiraReporter"
import { JiraClient } from "../../jira/JiraClient";

test("End to End Test for E-commerce applications", async ({ page }) => {

  const login = new Login(page);
  const logout = new Logout(page);
  const checkout = new CheckOut(page);
  const products = new Products(page);
  const filter = new Filter(page);
  const cart = new Cart(page);
  const jira     = new JiraClient();

  try {
  await login.gotoUrl(); //Goto application URL
  await login.gotoLogin(); //Goto login page
  await login.performInvalidLogin(); //Perform login with invalid credentials
  await login.performLogin(); //Perform valid login
  await products.gotoShopNow(); // Click on Shop Now button and verify navigation 
  await filter.applyAllFilter(); // Apply all filter
  await cart.addProductsDynamically(); // To be implemented - Add products to cart based on JSON data and verify cart count
  await cart.gotoCart(); // Navigate to cart page
  await cart.verifyCartPricing(); //Verify cart pricing by calculating expected total based on product prices, quantities, applied discounts and shipping costs and comparing with displayed total

  // Apply HAUS20 promo code and verify discount
  await cart.applyPromoCode('HAUS20');
  await cart.verifyHaus20Discount();

  // Apply FREESHIP promo code and verify free shipping
  await cart.applyPromoCode('FREESHIP');
  await cart.verifyFreeShipping();

  // Apply invalid promo code and verify error message
  await cart.applyPromoCode('INVALID');

  //Proceed Checkout
  await cart.proceedToCheckout(); 
  await checkout.fillContactInformation(); // Fill mandatory details to place order
  await checkout.chooseShippingMethod();
  await checkout.fillPaymentDetails();
  await checkout.placeOrder();

  // Perform logout 
  await logout.performLogout();
} catch (error: any) {

        // ❌ Take screenshot on failure
        const screenshotPath = `test-results/failure-${Date.now()}.png`;
        await page.screenshot({ path: screenshotPath, fullPage: true });

        // ❌ Create Jira bug automatically
        await jira.reportFailure(
            "End to End Test for E-commerce applications",
            error.message,
            screenshotPath
        );

        // Re-throw so Playwright still marks the test as failed
        throw error;
    }

});


