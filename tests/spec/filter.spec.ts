import { test, expect } from "@playwright/test";
import { Login } from "../pages/Login";
import { Logout } from "../pages/Logout";
import { Products } from "../pages/Products";
import { Filter } from "../pages/Filter";
import { JiraClient } from "../../jira/JiraClient";

test("End to End Test for E-commerce applications", async ({ page }) => {

  const login = new Login(page);
  const logout = new Logout(page);
  const products = new Products(page);
  const filter = new Filter(page);
  const jiraClient = new JiraClient();

  try {
  await login.gotoUrl(); //Goto application URL
  await login.gotoLogin(); //Goto login page
  await login.performLogin(); //Perform login
  await products.gotoShopNow(); // Navigate to products page using shop now option 

  // Perform filters for all categories and verify product count and active state of filter button
  await filter.applyAllFilter(); 
  await filter.applyClothingFilter();
  await filter.applyAccessoriesFilter();
  await filter.applyHomeFilter();
  await filter.applyBeautyFilter();
  await logout.performLogout(); // Perform logout
} catch (error: any) {

        // ❌ Take screenshot on failure
        const screenshotPath = `test-results/failure-${Date.now()}.png`;
        await page.screenshot({ path: screenshotPath, fullPage: true });

        // ❌ Create Jira bug automatically
        await jiraClient.reportFailure(
            "End to End Test for E-commerce applications",
            error.message,
            screenshotPath
        );

        // Re-throw so Playwright still marks the test as failed
        throw error;
    }

});


