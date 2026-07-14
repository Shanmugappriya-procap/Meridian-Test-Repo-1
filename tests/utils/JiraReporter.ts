import axios from "axios";
import * as fs from "fs";
import * as path from "path";
import * as dotenv from "dotenv";
dotenv.config({ override: true });

// ── Strip ANSI terminal color codes ──────────────────────────────────────────
const stripAnsi = (str: string): string =>
  str.replace(/\u001b\[[0-9;]*m/g, "").replace(/\[[\d]+m/g, "").trim();

// ── Extract custom assertion message from Playwright error ───────────────────
// Playwright prepends the custom message like:
//   "The status label was not visible\n\nLocator: ..."
const extractCustomMessage = (rawError: string): string | undefined => {
  const cleaned = stripAnsi(rawError);

  // Playwright formats it as: "<custom message>\n\nLocator: ..." or
  // "<custom message>\n\nExpect: ..."
  const match = cleaned.match(/^([\s\S]+?)\n\n(?:Locator|Expect|Error|Call log)/m);
  if (match) {
    const candidate = match[1].trim();
    // Ignore generic Playwright-generated messages (no custom message was set)
    if (
      candidate.startsWith("expect(") ||
      candidate.startsWith("Error:") ||
      candidate.length === 0
    ) {
      return undefined;
    }
    return candidate;
  }
  return undefined;
};

interface JiraBugPayload {
  testName:          string;
  errorMessage:      string;
  stackTrace?:       string;
  suiteName?:        string;
  screenshotPath?:   string;
  tracePath?:        string;
  errorContextPath?: string;
  testLogs?:         string[];
  failedLine?:       string;
  filePath?:         string;
  customMessage?:    string;  // ✅ extracted custom assertion message
}

export class JiraReporter {
  private baseUrl    = process.env.JIRA_BASE_URL!;
  private email      = process.env.JIRA_EMAIL!;
  private apiToken   = process.env.JIRA_API_TOKEN!;
  private projectKey = process.env.JIRA_PROJECT_KEY!;
  private issueType  = process.env.JIRA_ISSUE_TYPE || "Bug";
  private assigneeId = process.env.JIRA_ASSIGNEE_ID;
  private reporterId = process.env.JIRA_REPORTER_ID;

  private get authHeader() {
    const encoded = Buffer.from(`${this.email}:${this.apiToken}`).toString("base64");
    return `Basic ${encoded}`;
  }

  private get requestHeaders() {
    return {
      Authorization:  this.authHeader,
      "Content-Type": "application/json",
    };
  }

  // ── Build ADF description ─────────────────────────────────────────────────
  private buildDescription(payload: JiraBugPayload) {
    const {
      testName, suiteName, testLogs,
      errorMessage: rawError,
      stackTrace:   rawStack,
      failedLine:   rawLine,
      filePath,
      customMessage,
    } = payload;

    const errorMessage = stripAnsi(rawError);
    const stackTrace   = rawStack ? stripAnsi(rawStack)  : undefined;
    const failedLine   = rawLine  ? stripAnsi(rawLine)   : undefined;
    const cleanLogs    = testLogs?.map(stripAnsi).filter(Boolean);

    const content: any[] = [
      // ── ✅ Custom assertion message (highlighted at the top) ───────────────
      ...(customMessage ? [
        {
          type: "panel",
          attrs: { panelType: "warning" },
          content: [
            {
              type: "paragraph",
              content: [
                { type: "text", text: "Assertion Failure: ", marks: [{ type: "strong" }] },
                { type: "text", text: customMessage, marks: [{ type: "em" }] },
              ],
            },
          ],
        },
      ] : []),

      // ── Test info ──────────────────────────────────────────────────────────
      {
        type: "paragraph",
        content: [
          { type: "text", text: "Test Suite: ", marks: [{ type: "strong" }] },
          { type: "text", text: suiteName || "N/A" },
        ],
      },
      {
        type: "paragraph",
        content: [
          { type: "text", text: "Failed Test: ", marks: [{ type: "strong" }] },
          { type: "text", text: testName },
        ],
      },

      // ── File location ──────────────────────────────────────────────────────
      ...(filePath ? [{
        type: "paragraph",
        content: [
          { type: "text", text: "Test File: ", marks: [{ type: "strong" }] },
          { type: "text", text: filePath },
        ],
      }] : []),

      // ── Error message ──────────────────────────────────────────────────────
      {
        type: "paragraph",
        content: [
          { type: "text", text: "Error Message: ", marks: [{ type: "strong" }] },
          { type: "text", text: errorMessage },
        ],
      },

      // ── Exact failing line ─────────────────────────────────────────────────
      ...(failedLine ? [
        {
          type: "paragraph",
          content: [{ type: "text", text: "Failed at Line:", marks: [{ type: "strong" }] }],
        },
        {
          type: "codeBlock",
          content: [{ type: "text", text: failedLine }],
        },
      ] : []),

      // ── Stack trace ────────────────────────────────────────────────────────
      ...(stackTrace ? [
        {
          type: "paragraph",
          content: [{ type: "text", text: "Stack Trace:", marks: [{ type: "strong" }] }],
        },
        {
          type: "codeBlock",
          content: [{ type: "text", text: stackTrace }],
        },
      ] : []),

      // ── Test run logs ──────────────────────────────────────────────────────
      ...(cleanLogs && cleanLogs.length > 0 ? [
        {
          type: "paragraph",
          content: [{ type: "text", text: "Test Run Logs:", marks: [{ type: "strong" }] }],
        },
        {
          type: "codeBlock",
          content: [{ type: "text", text: cleanLogs.join("\n") }],
        },
      ] : []),
    ];

    return { type: "doc", version: 1, content };
  }

  // ── Build summary (uses custom message when available) ────────────────────
  private buildSummary(payload: JiraBugPayload): string {
    const testName      = stripAnsi(payload.testName);
    const customMessage = payload.customMessage;

    if (customMessage) {
      // e.g. "[Automated Bug] The status label was not visible | login › verify status"
      return `[Automated Bug] ${customMessage} | ${testName}`;
    }
    return `[Automated Bug] ${testName}`;
  }

  // ── Create Bug ────────────────────────────────────────────────────────────
  async createBug(payload: JiraBugPayload): Promise<string | null> {
    // ✅ Auto-extract custom message from the raw error if not already provided
    if (!payload.customMessage && payload.errorMessage) {
      payload.customMessage = extractCustomMessage(payload.errorMessage);
    }

    try {
      const fields: any = {
        project:     { key: this.projectKey },
        summary:     this.buildSummary(payload),           // ✅ uses custom message
        description: this.buildDescription(payload),
        issuetype:   { name: this.issueType },
        labels:      ["automation", "playwright"],
        parent:      { key: "PC-71" },
      };

      if (this.assigneeId) fields.assignee = { accountId: this.assigneeId };
      if (this.reporterId) fields.reporter = { accountId: this.reporterId };

      const response = await axios.post(
        `${this.baseUrl}/rest/api/3/issue`,
        { fields },
        { headers: this.requestHeaders }
      );

      const issueKey: string = response.data.key;
      console.log(`✅ Jira bug created: ${this.baseUrl}/browse/${issueKey}`);

      if (payload.screenshotPath && fs.existsSync(payload.screenshotPath)) {
        await this.attachFile(issueKey, payload.screenshotPath);
      }
      if (payload.tracePath && fs.existsSync(payload.tracePath)) {
        await this.attachFile(issueKey, payload.tracePath);
      }
      if (payload.errorContextPath && fs.existsSync(payload.errorContextPath)) {
        await this.attachFile(issueKey, payload.errorContextPath);
      }

      return issueKey;

    } catch (error: any) {
      console.error("❌ Failed to create Jira bug:", error.response?.data || error.message);
      return null;
    }
  }

  // ── Attach any file ───────────────────────────────────────────────────────
  private async attachFile(issueKey: string, filePath: string): Promise<void> {
    const FormData = require("form-data");
    const form = new FormData();
    form.append("file", fs.createReadStream(filePath), path.basename(filePath));

    try {
      await axios.post(
        `${this.baseUrl}/rest/api/3/issue/${issueKey}/attachments`,
        form,
        {
          headers: {
            Authorization:       this.authHeader,
            "X-Atlassian-Token": "no-check",
            ...form.getHeaders(),
          },
        }
      );
      console.log(`✅ Attached: ${path.basename(filePath)} → ${issueKey}`);
    } catch (error: any) {
      console.error(`❌ Failed to attach ${path.basename(filePath)}:`, error.response?.data || error.message);
    }
  }

  // ── Check duplicate ───────────────────────────────────────────────────────
  async bugExists(testName: string): Promise<boolean> {
    const jql = `project = ${this.projectKey} AND summary ~ "[Automated Bug] ${testName}" AND statusCategory != Done`;
    try {
      const response = await axios.get(`${this.baseUrl}/rest/api/3/search`, {
        params: { jql, maxResults: 1 },
        headers: this.requestHeaders,
      });
      return response.data.total > 0;
    } catch {
      return false;
    }
  }
}