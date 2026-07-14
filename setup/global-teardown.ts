import * as path from "path";
import * as dotenv from "dotenv";
// ✅ Must load BEFORE importing JiraReporter
dotenv.config({ path: path.resolve(__dirname, "../.env"), override: true });

import { FullResult, Reporter, TestCase, TestResult } from "@playwright/test/reporter";
import { JiraReporter } from "../tests/utils/JiraReporter";

class JiraIntegrationReporter implements Reporter {
  private jira = new JiraReporter();
  private failedTests: {
    testName:          string;
    errorMessage:      string;
    stackTrace:        string;
    suiteName:         string;
    screenshotPath?:   string;
    tracePath?:        string;
    testLogs?:         string[];
    errorContextPath?: string;
    failedLine?:       string;
    filePath?:         string;
  }[] = [];

  onTestEnd(test: TestCase, result: TestResult): void {
    if (result.status === "failed" || result.status === "timedOut") {

      // ✅ KEY FIX: Only collect the FINAL retry, skip intermediate retries
      // e.g. retries=2: retry=0 → skip, retry=1 → skip, retry=2 → collect
      const isLastRetry = result.retry === test.retries;
      if (!isLastRetry) return;

      const errorMessage = result.errors?.[0]?.message || "Unknown error";
      const stackTrace   = result.errors?.[0]?.stack   || "";
      const suiteName    = test.parent?.title           || "";

      // ✅ Screenshot
      const screenshotAttachment = result.attachments.find(
        (a) => a.name === "screenshot" && a.path
      );

      // ✅ Trace
      const traceAttachment = result.attachments.find(
        (a) => a.name === "trace" && a.path
      );

      // ✅ Error context file
      const errorContextAttachment = result.attachments.find(
        (a) => a.name === "error-context" && a.path
      );

      // ✅ Stdout logs
      const testLogs = result.stdout
        .map((l) => (Buffer.isBuffer(l) ? l.toString("utf8") : String(l)))
        .filter(Boolean);

      // ✅ Exact failing line from stack trace
      const failedLine = this.extractFailedLine(stackTrace);

      // ✅ Test file path + line number
      const filePath = test.location
        ? `${test.location.file}:${test.location.line}:${test.location.column}`
        : undefined;

      this.failedTests.push({
        testName:         test.title,
        errorMessage,
        stackTrace,
        suiteName,
        screenshotPath:   screenshotAttachment?.path,
        tracePath:        traceAttachment?.path,
        errorContextPath: errorContextAttachment?.path,
        testLogs,
        failedLine,
        filePath,
      });
    }
  }

  // ✅ Extract the exact spec line that failed from stack trace
  private extractFailedLine(stackTrace: string): string | undefined {
    const lines = stackTrace.split("\n");
    const match = lines.find((l) =>
      l.includes(".spec.ts") || l.includes(".test.ts")
    );
    return match?.trim();
  }

  async onEnd(result: FullResult): Promise<void> {
    if (this.failedTests.length === 0) {
      console.log("✅ All tests passed. No Jira bugs to create.");
      return;
    }

    console.log(`\n🐛 Creating Jira bugs for ${this.failedTests.length} failed test(s)...`);

    for (const failedTest of this.failedTests) {
      const exists = await this.jira.bugExists(failedTest.testName);
      if (exists) {
        console.log(`⚠️  Bug already exists for: "${failedTest.testName}" — skipping`);
        continue;
      }
      await this.jira.createBug(failedTest);
    }
  }
}

export default JiraIntegrationReporter;