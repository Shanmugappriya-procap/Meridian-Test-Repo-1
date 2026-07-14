import * as fs from 'fs';
import * as path from 'path';
import * as https from 'https';
import { jiraConfig } from '../config/jira.config';

export interface JiraBugPayload {
  testSuiteName: string;
  failedTest: string;
  friendlyError: string;
  actualError: string;
  failedLine: string;
  locatorInfo: string;
  screenshotPath?: string;
  tracePath?: string;
  browser: string;
  duration: number;
}

export class JiraClient {
  private readonly authHeader: string;
  private readonly apiBase: string;
  private readonly baseUrl: string;

  constructor() {
    const credentials = Buffer.from(
      `${jiraConfig.email}:${jiraConfig.apiToken}`
    ).toString('base64');
    this.authHeader = `Basic ${credentials}`;
    this.baseUrl = jiraConfig.baseUrl;
    this.apiBase = `${jiraConfig.baseUrl}/rest/api/3`;
  }

  // ─── Core HTTP request using Node.js https module ──────────
  private httpsRequest(
    urlStr: string,
    method: string,
    headers: Record<string, string>,
    body?: string
  ): Promise<{ status: number; body: string }> {
    return new Promise((resolve, reject) => {
      const url = new URL(urlStr);
      const options = {
        hostname: url.hostname,
        path: url.pathname + url.search,
        method,
        headers: {
          ...headers,
          ...(body ? { 'Content-Length': Buffer.byteLength(body) } : {}),
        },
      };

      const req = https.request(options, (res) => {
        let data = '';
        res.on('data', (chunk) => (data += chunk));
        res.on('end', () => resolve({ status: res.statusCode || 0, body: data }));
      });

      req.on('error', reject);
      if (body) req.write(body);
      req.end();
    });
  }

  // ─── Create a bug issue in Jira ────────────────────────────
  async createBug(payload: JiraBugPayload): Promise<string | null> {
    const description = this.buildDescription(payload);

    // Strip ANSI color codes from error text before sending to Jira
    const cleanError = payload.actualError.replace(/\u001b\[[0-9;]*m/g, '');
    const cleanFriendly = payload.friendlyError.replace(/\u001b\[[0-9;]*m/g, '');
    const cleanLocator = payload.locatorInfo.replace(/\u001b\[[0-9;]*m/g, '');

    const body = {
      fields: {
        project: { key: jiraConfig.projectKey },
        summary: `[Automation Failure] ${payload.failedTest}`,
        description: this.buildCleanDescription({ ...payload, actualError: cleanError, friendlyError: cleanFriendly, locatorInfo: cleanLocator }),
        issuetype: { name: jiraConfig.issueType },
        priority: { name: jiraConfig.priority },
        labels: jiraConfig.labels,
        parent: { key: jiraConfig.epicKey },
      },
    };

    const bodyStr = JSON.stringify(body);

    try {
      console.log(`[JiraReporter] 🔄 Calling: ${this.apiBase}/issue`);
      console.log(`[JiraReporter] 📦 Config: project=${jiraConfig.projectKey} | epic=${jiraConfig.epicKey} | email=${jiraConfig.email}`);

      const response = await this.httpsRequest(
        `${this.apiBase}/issue`,
        'POST',
        {
          'Authorization': this.authHeader,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        bodyStr
      );

      console.log(`[JiraReporter] 📡 Response Status: ${response.status}`);
      console.log(`[JiraReporter] 📡 Response Body: ${response.body}`);

      if (response.status < 200 || response.status >= 300) {
        console.error(`[JiraReporter] ❌ Failed: HTTP ${response.status} - ${response.body}`);
        return null;
      }

      const data = JSON.parse(response.body) as { key: string };
      console.log(`[JiraReporter] ✅ Bug created: ${this.baseUrl}/browse/${data.key}`);
      return data.key;
    } catch (err) {
      console.error('[JiraReporter] ❌ Network error calling Jira API:', err);
      return null;
    }
  }

  // ─── Attach a file to a Jira issue ─────────────────────────
  async attachFile(issueKey: string, filePath: string): Promise<void> {
    if (!fs.existsSync(filePath)) {
      console.warn(`[JiraReporter] File not found, skipping: ${filePath}`);
      return;
    }

    const fileName = path.basename(filePath);
    const fileContent = fs.readFileSync(filePath);
    const boundary = `----FormBoundary${Date.now()}`;

    const header = Buffer.from(
      `--${boundary}\r\nContent-Disposition: form-data; name="file"; filename="${fileName}"\r\nContent-Type: application/octet-stream\r\n\r\n`
    );
    const footer = Buffer.from(`\r\n--${boundary}--\r\n`);
    const bodyBuffer = Buffer.concat([header, fileContent, footer]);

    try {
      const url = new URL(`${this.apiBase}/issue/${issueKey}/attachments`);
      const response = await new Promise<{ status: number; body: string }>((resolve, reject) => {
        const options = {
          hostname: url.hostname,
          path: url.pathname,
          method: 'POST',
          headers: {
            'Authorization': this.authHeader,
            'X-Atlassian-Token': 'no-check',
            'Content-Type': `multipart/form-data; boundary=${boundary}`,
            'Content-Length': bodyBuffer.length,
          },
        };

        const req = https.request(options, (res) => {
          let data = '';
          res.on('data', (chunk) => (data += chunk));
          res.on('end', () => resolve({ status: res.statusCode || 0, body: data }));
        });

        req.on('error', reject);
        req.write(bodyBuffer);
        req.end();
      });

      if (response.status < 200 || response.status >= 300) {
        console.error(`[JiraReporter] Failed to attach ${fileName}: ${response.status} - ${response.body}`);
      } else {
        console.log(`[JiraReporter] 📎 Attached: ${fileName} to ${issueKey}`);
      }
    } catch (err) {
      console.error(`[JiraReporter] Error attaching ${fileName}:`, err);
    }
  }

  // ─── Build description with clean text ─────────────────────
  private buildCleanDescription(payload: JiraBugPayload): object {
    return {
      type: 'doc',
      version: 1,
      content: [
        this.heading('🚨 Test Failure Report'),
        this.heading('📋 Test Information', 3),
        this.infoTable([
          ['Test Suite', payload.testSuiteName],
          ['Failed Test', payload.failedTest],
          ['Browser', payload.browser],
          ['Duration', `${(payload.duration / 1000).toFixed(2)}s`],
        ]),
        this.heading('🔴 What Went Wrong (Simple Explanation)', 3),
        this.paragraph(payload.friendlyError),
        this.heading('🛠️ Technical Error Details', 3),
        this.codeBlock(payload.actualError),
        ...(payload.failedLine ? [
          this.heading('📍 Failed at Line', 3),
          this.codeBlock(payload.failedLine),
        ] : []),
        ...(payload.locatorInfo ? [
          this.heading('🔍 Locator / Element Info', 3),
          this.codeBlock(payload.locatorInfo),
        ] : []),
        this.heading('📎 Attachments', 3),
        this.paragraph('Screenshot and trace files are attached to this issue.\nOpen the trace at: https://trace.playwright.dev'),
        this.heading('🔧 Steps to Reproduce', 3),
        this.paragraph(
          '1. Run the Playwright test suite\n' +
          `2. Execute test: "${payload.failedTest}"\n` +
          '3. Observe failure as described above'
        ),
      ],
    };
  }

  private buildDescription(payload: JiraBugPayload): object {
    return this.buildCleanDescription(payload);
  }

  private heading(text: string, level = 2): object {
    return { type: 'heading', attrs: { level }, content: [{ type: 'text', text }] };
  }

  private paragraph(text: string): object {
    return { type: 'paragraph', content: [{ type: 'text', text }] };
  }

  private codeBlock(code: string): object {
    return { type: 'codeBlock', attrs: { language: 'text' }, content: [{ type: 'text', text: code || 'N/A' }] };
  }

  private infoTable(rows: [string, string][]): object {
    return {
      type: 'table',
      attrs: { isNumberColumnEnabled: false, layout: 'default' },
      content: rows.map(([label, value]) => ({
        type: 'tableRow',
        content: [
          {
            type: 'tableHeader',
            attrs: {},
            content: [{ type: 'paragraph', content: [{ type: 'text', text: label, marks: [{ type: 'strong' }] }] }],
          },
          {
            type: 'tableCell',
            attrs: {},
            content: [{ type: 'paragraph', content: [{ type: 'text', text: value }] }],
          },
        ],
      })),
    };
  }
}
