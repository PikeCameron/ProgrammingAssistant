import { Router } from 'express';
import nodemailer from 'nodemailer';
import { spawn } from 'child_process';
import { config } from '../config.js';
export const reviewRouter = Router();
const mailer = nodemailer.createTransport({
    host: config.smtpHost,
    port: config.smtpPort,
    secure: config.smtpSecure,
    auth: { user: config.smtpUser, pass: config.smtpPass },
});
const MAX_DIFF_CHARS = 80_000;
const CLAUDE_TIMEOUT_MS = 3 * 60 * 1000; // 3 minutes
function runClaude(prompt) {
    const { macSshUser, macSshHost } = config;
    if (!macSshUser || !macSshHost) {
        return Promise.reject(new Error('MAC_SSH_USER and MAC_SSH_HOST must be set in .env'));
    }
    return new Promise((resolve, reject) => {
        // SSH to Mac and run claude there; -l loads login shell so claude is in PATH
        const proc = spawn('ssh', [
            '-o', 'BatchMode=yes',
            '-o', 'ConnectTimeout=10',
            `${macSshUser}@${macSshHost}`,
            'zsh -c "source ~/.nvm/nvm.sh && claude --print"',
        ], {
            stdio: ['pipe', 'pipe', 'pipe'],
        });
        let stdout = '';
        let stderr = '';
        const timer = setTimeout(() => {
            proc.kill();
            reject(new Error('Claude Code timed out after 3 minutes'));
        }, CLAUDE_TIMEOUT_MS);
        proc.stdout.on('data', (chunk) => { stdout += chunk.toString(); });
        proc.stderr.on('data', (chunk) => { stderr += chunk.toString(); });
        proc.on('close', (code) => {
            clearTimeout(timer);
            if (code === 0)
                resolve(stdout.trim());
            else
                reject(new Error(`SSH/claude exited ${code}: ${stderr.slice(0, 500)}`));
        });
        proc.on('error', (err) => {
            clearTimeout(timer);
            reject(new Error(`SSH failed: ${err.message}`));
        });
        proc.stdin.write(prompt);
        proc.stdin.end();
    });
}
reviewRouter.post('/', async (req, res) => {
    const { owner, repo, number, title } = req.body;
    if (!owner || !repo || !number || !title) {
        res.status(400).json({ error: 'Missing required fields' });
        return;
    }
    // Fetch PR diff from GitHub
    const diffRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/pulls/${number}`, {
        headers: {
            Authorization: `Bearer ${config.githubToken}`,
            Accept: 'application/vnd.github.diff',
        },
    });
    if (!diffRes.ok) {
        res.status(502).json({ error: `GitHub returned ${diffRes.status}` });
        return;
    }
    let diff = await diffRes.text();
    const truncated = diff.length > MAX_DIFF_CHARS;
    if (truncated)
        diff = diff.slice(0, MAX_DIFF_CHARS) + '\n\n[diff truncated — too large to include in full]';
    const prompt = `You are a senior software engineer reviewing a pull request. Be thorough but concise.

PR: ${title} (#${number})
Repository: ${owner}/${repo}${truncated ? '\nNote: the diff was truncated due to size.' : ''}

Structure your review as:
**Summary** — what does this PR do?
**Issues** — bugs, edge cases, logic errors (if any)
**Code Quality** — style, naming, maintainability observations
**Security** — any concerns (if none, say so briefly)
**Recommendation** — Approve / Request Changes / Needs Discussion, with one-line rationale

<diff>
${diff}
</diff>`;
    const reviewText = await runClaude(prompt);
    await mailer.sendMail({
        from: config.smtpFrom,
        to: config.reviewToEmail,
        subject: `PR Review: ${title} (#${number})`,
        text: `PR Review — ${owner}/${repo} #${number}\n${title}\n\n${reviewText}`,
        html: `<h2>${title} <small style="color:#666">#${number}</small></h2>
<p style="color:#888">${owner}/${repo}</p>
<hr>
<pre style="font-family:system-ui,sans-serif;white-space:pre-wrap">${reviewText.replace(/</g, '&lt;')}</pre>`,
    });
    res.json({ ok: true });
});
