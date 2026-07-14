import { test, expect } from "@playwright/test";
import { Login } from "../pages/Login";
import { Logout } from "../pages/Logout";
import { SearchProducts } from "../pages/SearchProducts";
import { JiraClient } from "../../jira/JiraClient";

test("Perform search and check the data", async ({ page }) => {
  const login = new Login(page);
  const searchProducts = new SearchProducts(page);
  const logout = new Logout(page);
  const jiraClient = new JiraClient();

  try{

  await login.gotoUrl(); //Goto application URL
  await login.gotoLogin(); //Goto login page
  await login.performLogin(); //Perform login with valid credentials and verify successful login by checking the presence of user profile icon or welcome message
  await searchProducts.performSearch(); // Perform search and verify results
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


