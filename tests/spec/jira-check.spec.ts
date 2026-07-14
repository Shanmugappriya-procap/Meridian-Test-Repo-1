// import { test, expect } from "@playwright/test";
// import { JiraReporter } from "../utils/JiraReporter";

// test("Jira connection check", async () => {
//   const jira = new JiraReporter();
//   const issueKey = await jira.createBug({
//     testName: "Jira Connection Test",
//     errorMessage: "This is a test bug to verify Jira integration",
//     suiteName: "Connection Check",
//   });

//   console.log("issueKey received:", issueKey); // 👈 add this
//   expect(issueKey).not.toBeNull();
//   console.log(`Jira integration working! Created: ${issueKey}`);
// });