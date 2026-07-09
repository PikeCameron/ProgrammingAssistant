import { Router } from 'express';
import { config } from '../config.js';
import type { ReviewFinding, ReviewResult, ReviewSeverity } from '../../shared/types.js';
import { getReview, setReview, updateFindingComment, markFindingPosted, markFindingError, setFindingArchived } from '../reviewStore.js';

export const reviewRouter = Router();

const MAX_DIFF_CHARS = 80_000;
const CLAUDE_TIMEOUT_MS = 3 * 60 * 1000;
const SEVERITIES: ReviewSeverity[] = ['issue', 'suggestion', 'nit'];

interface GhFile {
  filename: string;
  status: string;
  patch?: string;
}

async function fetchChangedFiles(owner: string, repo: string, number: number): Promise<GhFile[]> {
  const res = await fetch(
    `https://api.github.com/repos/${owner}/${repo}/pulls/${number}/files?per_page=100`,
    { headers: { Authorization: `Bearer ${config.githubToken}`, Accept: 'application/vnd.github+json' } },
  );
  if (!res.ok) throw new Error(`GitHub files fetch returned ${res.status}: ${await res.text()}`);
  return res.json() as Promise<GhFile[]>;
}

async function runClaude(prompt: string, branch?: string, cloneUrl?: string, urlOverride?: string): Promise<string> {
  const macReviewUrl = urlOverride || config.macReviewUrl;
  if (!macReviewUrl) throw new Error('MAC_REVIEW_URL must be set in .env (e.g. http://camerons-macbook-pro.local:3002/review), or set a review server override in the app\'s Settings panel');
  if (!/^https?:\/\//.test(macReviewUrl)) throw new Error(`Invalid review server URL: ${macReviewUrl}`);

  const res = await fetch(macReviewUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt, branch, cloneUrl }),
    signal: AbortSignal.timeout(CLAUDE_TIMEOUT_MS),
  });

  if (!res.ok) throw new Error(`Review server returned ${res.status}: ${await res.text()}`);
  return res.text();
}

interface ClaudeReviewJson {
  summary?: string;
  findings: Array<{ file: string; line: number; severity: string; comment: string }>;
}

function parseClaudeReview(raw: string): ClaudeReviewJson {
  let text = raw.trim();
  const fenceMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fenceMatch) text = fenceMatch[1].trim();

  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new Error('Claude response was not valid JSON');
  }

  if (
    typeof parsed !== 'object' || parsed === null ||
    !('findings' in parsed) || !Array.isArray((parsed as { findings: unknown }).findings)
  ) {
    throw new Error('Claude response JSON missing a "findings" array');
  }

  const obj = parsed as { summary?: unknown; findings: unknown[] };
  const findings = obj.findings.filter((f): f is { file: string; line: number; severity: string; comment: string } =>
    Boolean(f) && typeof f === 'object' &&
    typeof (f as any).file === 'string' &&
    typeof (f as any).line === 'number' &&
    typeof (f as any).comment === 'string' &&
    SEVERITIES.includes((f as any).severity),
  );

  return { summary: typeof obj.summary === 'string' ? obj.summary : undefined, findings };
}

interface ParsedHunk { newStart: number; newLines: number; text: string; }

function parseHunks(patch: string): ParsedHunk[] {
  const lines = patch.split('\n');
  const hunks: ParsedHunk[] = [];
  let current: ParsedHunk | null = null;
  const hunkHeaderRe = /^@@ -\d+(?:,\d+)? \+(\d+)(?:,(\d+))? @@/;

  for (const line of lines) {
    const m = line.match(hunkHeaderRe);
    if (m) {
      current = { newStart: parseInt(m[1], 10), newLines: m[2] ? parseInt(m[2], 10) : 1, text: line };
      hunks.push(current);
    } else if (current) {
      current.text += '\n' + line;
    }
  }
  return hunks;
}

function findHunkForLine(patch: string | undefined, line: number): string | null {
  if (!patch) return null;
  const hunks = parseHunks(patch);
  const hit = hunks.find((h) => line >= h.newStart && line < h.newStart + h.newLines);
  return hit ? hit.text : null;
}

reviewRouter.post('/', async (req, res) => {
  const { owner, repo, number, title, branch, cloneUrl, commitSha, macReviewUrl } = req.body as {
    owner: string; repo: string; number: number; title: string;
    branch?: string; cloneUrl?: string; commitSha: string; macReviewUrl?: string;
  };

  if (!owner || !repo || !number || !title || !commitSha) {
    res.status(400).json({ error: 'Missing required fields (owner, repo, number, title, commitSha)' });
    return;
  }

  let files: GhFile[];
  try {
    files = await fetchChangedFiles(owner, repo, number);
  } catch (err) {
    res.status(502).json({ error: `Failed to fetch PR files: ${(err as Error).message}` });
    return;
  }

  const filesWithPatch = files.filter((f) => f.patch);
  let diff = filesWithPatch.map((f) => `--- a/${f.filename}\n+++ b/${f.filename}\n${f.patch}`).join('\n\n');
  const truncated = diff.length > MAX_DIFF_CHARS;
  if (truncated) diff = diff.slice(0, MAX_DIFF_CHARS) + '\n\n[diff truncated — too large to include in full]';

  const hasCheckout = Boolean(branch && cloneUrl);
  const prompt = `You are a senior software engineer reviewing a pull request. Be thorough but concise.

PR: ${title} (#${number})
Repository: ${owner}/${repo}
${hasCheckout ? 'The repository is checked out at this PR branch — use your file reading tools to explore the codebase for full context.' : ''}${truncated ? '\nNote: the diff was truncated due to size.' : ''}

Respond with ONLY a single JSON object (no prose before or after, no markdown code fences) matching exactly this shape:

{
  "summary": "one or two sentence description of what this PR does",
  "findings": [
    { "file": "path/exactly/as/in/diff.ts", "line": 42, "severity": "issue" | "suggestion" | "nit", "comment": "specific, actionable comment about this exact line" }
  ]
}

Rules:
- "line" must be the NEW-file line number (the right-hand/added-file side of the diff), i.e. the line number GitHub would show for that line in the PR's "Files changed" tab.
- Only cite lines that actually appear in the diff below (added or context lines) — never a line from the base/old side only.
- "severity": "issue" = bug/correctness/security problem, "suggestion" = worth considering but not blocking, "nit" = minor style/naming.
- Omit findings for things that are fine; only include genuine observations. It is OK to return an empty "findings" array.
- Do not include markdown formatting, backticks, or file:line prose citations inside "comment" — plain text only, since it will be posted verbatim as a GitHub review comment.

<diff>
${diff}
</diff>`;

  let rawResponse: string;
  try {
    rawResponse = await runClaude(prompt, branch, cloneUrl, macReviewUrl);
  } catch (err) {
    res.status(502).json({ error: `Claude review failed: ${(err as Error).message}` });
    return;
  }

  let parsed: ClaudeReviewJson;
  try {
    parsed = parseClaudeReview(rawResponse);
  } catch (err) {
    res.status(502).json({ error: (err as Error).message, raw: rawResponse.slice(0, 2000) });
    return;
  }

  const patchByFile = new Map(files.map((f) => [f.filename, f.patch]));
  const findings: ReviewFinding[] = parsed.findings.map((f, i) => ({
    id: `${i}:${f.file}:${f.line}`,
    file: f.file,
    line: f.line,
    severity: f.severity as ReviewSeverity,
    comment: f.comment,
    diffHunk: findHunkForLine(patchByFile.get(f.file), f.line),
    status: 'pending',
  }));

  const result: ReviewResult = {
    prId: `${owner}/${repo}/${number}`,
    owner, repo, number,
    commitSha,
    summary: parsed.summary,
    createdAt: new Date().toISOString(),
    findings,
  };

  setReview(result);
  res.json({ ok: true, review: result });
});

reviewRouter.get('/:owner/:repo/:number', (req, res) => {
  const { owner, repo, number } = req.params;
  const review = getReview(`${owner}/${repo}/${number}`);
  if (!review) { res.status(404).json({ review: null }); return; }
  res.json({ review });
});

reviewRouter.patch('/:owner/:repo/:number/findings/:findingId', (req, res) => {
  const { owner, repo, number, findingId } = req.params;
  const { comment } = req.body as { comment?: string };
  if (typeof comment !== 'string' || !comment.trim()) {
    res.status(400).json({ error: 'comment is required' });
    return;
  }
  const prId = `${owner}/${repo}/${number}`;
  const review = getReview(prId);
  const existing = review?.findings.find((f) => f.id === findingId);
  if (!review || !existing) { res.status(404).json({ error: 'Review or finding not found' }); return; }
  if (existing.status === 'posted') { res.status(409).json({ error: 'Finding already posted, cannot edit' }); return; }

  const finding = updateFindingComment(prId, findingId, comment);
  if (!finding) { res.status(404).json({ error: 'Review or finding not found' }); return; }
  res.json({ finding });
});

reviewRouter.post('/:owner/:repo/:number/findings/:findingId/archive', (req, res) => {
  const { owner, repo, number, findingId } = req.params;
  const { archived } = req.body as { archived?: boolean };
  if (typeof archived !== 'boolean') {
    res.status(400).json({ error: 'archived (boolean) is required' });
    return;
  }
  const prId = `${owner}/${repo}/${number}`;
  const finding = setFindingArchived(prId, findingId, archived);
  if (!finding) { res.status(404).json({ error: 'Review or finding not found, or finding already posted' }); return; }
  res.json({ finding });
});

reviewRouter.post('/:owner/:repo/:number/findings/:findingId/submit', async (req, res) => {
  const { owner, repo, number, findingId } = req.params;
  const prId = `${owner}/${repo}/${number}`;
  const review = getReview(prId);
  const finding = review?.findings.find((f) => f.id === findingId);
  if (!review || !finding) { res.status(404).json({ error: 'Review or finding not found' }); return; }
  if (finding.status === 'posted') { res.status(409).json({ error: 'Finding already posted', finding }); return; }

  const ghRes = await fetch(
    `https://api.github.com/repos/${owner}/${repo}/pulls/${number}/comments`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${config.githubToken}`,
        Accept: 'application/vnd.github+json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        body: finding.comment,
        commit_id: review.commitSha,
        path: finding.file,
        line: finding.line,
        side: 'RIGHT',
      }),
    },
  );

  if (!ghRes.ok) {
    const errText = await ghRes.text();
    markFindingError(prId, findingId, `GitHub returned ${ghRes.status}: ${errText}`);
    res.status(502).json({ error: `GitHub returned ${ghRes.status}`, detail: errText });
    return;
  }

  const ghComment = await ghRes.json() as { html_url: string };
  const updated = markFindingPosted(prId, findingId, ghComment.html_url);
  res.json({ finding: updated });
});
