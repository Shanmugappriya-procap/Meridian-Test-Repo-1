import axios from 'axios';
import * as fs from 'fs';
import * as path from 'path';
import FormData from 'form-data';
import * as dotenv from 'dotenv';
dotenv.config({ override: true });

// ── Env validation ────────────────────────────────────────────────────────────
const BASE_URL  = process.env.JIRA_BASE_URL;
const EMAIL     = process.env.JIRA_EMAIL;
const API_TOKEN = process.env.JIRA_API_TOKEN;
const PROJECT   = process.env.JIRA_PROJECT_KEY;

const missingVars = ['JIRA_BASE_URL', 'JIRA_EMAIL', 'JIRA_API_TOKEN', 'JIRA_PROJECT_KEY']
    .filter(key => !process.env[key]);

if (missingVars.length > 0) {
    throw new Error(`❌ Missing required environment variables: ${missingVars.join(', ')}`);
}

// ── Auth header ───────────────────────────────────────────────────────────────
const authHeader = Buffer
    .from(`${EMAIL}:${API_TOKEN}`)
    .toString('base64');

const headers = {
    'Authorization': `Basic ${authHeader}`,
    'Content-Type':  'application/json',
    'Accept':        'application/json',
};

// ── Types ─────────────────────────────────────────────────────────────────────
interface JiraTransition {
    id:   string;
    name: string;
}

export class JiraClient {

    // ── Report failure: delegates to JiraReporter ─────────────────────────────
    async reportFailure(
        testName:          string,
        errorMessage:      string,
        screenshotPath?:   string,
        tracePath?:        string,
        errorContextPath?: string,  // ✅ error-context.md
        failedLine?:       string,  // ✅ exact failing line
        filePath?:         string,  // ✅ test file + line number
        customMessage?:    string   // ✅ custom assertion message
    ): Promise<void> {
        try {
            const { JiraReporter } = require('../tests/utils/JiraReporter');
            const reporter = new JiraReporter();
            await reporter.createBug({
                testName,
                errorMessage,
                screenshotPath,
                tracePath,
                errorContextPath,
                failedLine,
                filePath,
                customMessage,      // ✅ passed through to JiraReporter
            });
        } catch (err: any) {
            console.error('❌ reportFailure error:', err.message);
        }
    }

    // ── Transition issue status ───────────────────────────────────────────────
    async transitionIssue(issueKey: string, transitionName: string): Promise<void> {
        try {
            const res = await axios.get(
                `${BASE_URL}/rest/api/3/issue/${issueKey}/transitions`,
                { headers }
            );
            const transitions: JiraTransition[] = res.data.transitions;
            const target = transitions.find(
                (t) => t.name.toLowerCase() === transitionName.toLowerCase()
            );
            if (!target) {
                const available = transitions.map(t => `"${t.name}"`).join(', ');
                console.warn(`⚠️  Transition "${transitionName}" not found. Available: ${available}`);
                return;
            }
            await axios.post(
                `${BASE_URL}/rest/api/3/issue/${issueKey}/transitions`,
                { transition: { id: target.id } },
                { headers }
            );
            console.log(`✅ ${issueKey} transitioned to: "${transitionName}"`);
        } catch (error: any) {
            console.error(`❌ Failed to transition:`, error.response?.data || error.message);
            throw error;
        }
    }

    // ── List available transitions ────────────────────────────────────────────
    async listTransitions(issueKey: string): Promise<void> {
        try {
            const res = await axios.get(
                `${BASE_URL}/rest/api/3/issue/${issueKey}/transitions`,
                { headers }
            );
            const transitions: JiraTransition[] = res.data.transitions.map(
                (t: any) => ({ id: t.id, name: t.name })
            );
            console.log(`\n📋 Available transitions for ${issueKey}:`);
            console.table(transitions);
        } catch (error: any) {
            console.error(`❌ Failed to fetch transitions:`, error.response?.data || error.message);
            throw error;
        }
    }

    // ── Add comment ───────────────────────────────────────────────────────────
    async addComment(issueKey: string, comment: string): Promise<void> {
        try {
            await axios.post(
                `${BASE_URL}/rest/api/3/issue/${issueKey}/comment`,
                {
                    body: {
                        type:    'doc',
                        version: 1,
                        content: [{
                            type:    'paragraph',
                            content: [{ type: 'text', text: comment }],
                        }],
                    },
                },
                { headers }
            );
            console.log(`✅ Comment added to ${issueKey}`);
        } catch (error: any) {
            console.error(`❌ Failed to add comment:`, error.response?.data || error.message);
            throw error;
        }
    }

    // ── Attach file to an issue ───────────────────────────────────────────────
    async attachFile(issueKey: string, filePath: string): Promise<void> {
        try {
            if (!fs.existsSync(filePath)) {
                throw new Error(`File not found: ${filePath}`);
            }
            const form = new FormData();
            form.append('file', fs.createReadStream(filePath), path.basename(filePath));
            await axios.post(
                `${BASE_URL}/rest/api/3/issue/${issueKey}/attachments`,
                form,
                {
                    headers: {
                        ...headers,
                        'X-Atlassian-Token': 'no-check',
                        ...form.getHeaders(),
                    },
                }
            );
            console.log(`✅ Attached: ${path.basename(filePath)} → ${issueKey}`);
        } catch (error: any) {
            console.error(`❌ Failed to attach file:`, error.response?.data || error.message);
        }
    }
}