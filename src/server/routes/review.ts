import { Router } from 'express';
import Anthropic from '@anthropic-ai/sdk';
import nodemailer from 'nodemailer';
import { config } from '../config.js';

export const reviewRouter = Router();

const anthropic = new Anthropic({ apiKey: config.anthropicApiKey });

const mailer = nodemailer.createTransport({
  host: config.smtpHost,
  port: config.smtpPort,
  secure: config.smtpSecure,
  auth: { user: config.smtpUser, pass: config.smtpPass },
});

const MAX_DIFF_CHARS = 80_000;

reviewRouter.post('/', async (req, res) => {
  const { owner, repo, number, title } = req.body as {
    owner: string;
    repo: string;
    number: number;
    title: string;
  };

  if (!owner || !repo || !number || !title) {
    res.status(400).json({ error: 'Missing required fields' });
    return;
  }

  // 1. Fetch PR diff from GitHub
  const diffRes = await fetch(
    `https://api.github.com/repos/${owner}/${repo}/pulls/${number}`,
    {
      headers: {
        Authorization: `Bearer ${config.githubToken}`,
        Accept: 'application/vnd.github.diff',
      },
    },
  );

  if (!diffRes.ok) {
    res.status(502).json({ error: `GitHub returned ${diffRes.status}` });
    return;
  }

  let diff = await diffRes.text();
  const truncated = diff.length > MAX_DIFF_CHARS;
  if (truncated) diff = diff.slice(0, MAX_DIFF_CHARS) + '\n\n[diff truncated — too large to include in full]';

  // 2. Claude review
  const message = await anthropic.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 2048,
    messages: [
      {
        role: 'user',
        content: `You are a senior software engineer reviewing a pull request. Provide a thorough but concise review.

PR: ${title} (#${number})
Repository: ${owner}/${repo}

Structure your review as:
**Summary** — what does this PR do?
**Issues** — bugs, edge cases, logic errors (if any)
**Code Quality** — style, naming, maintainability observations
**Security** — any concerns (if none, say so briefly)
**Recommendation** — Approve / Request Changes / Needs Discussion, with one-line rationale

<diff>
${diff}
</diff>`,
      },
    ],
  });

  const reviewText =
    message.content[0].type === 'text' ? message.content[0].text : '(no review text returned)';

  // 3. Send email
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
