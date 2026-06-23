import 'dotenv/config';

function require(key: string): string {
  const value = process.env[key];
  if (!value) throw new Error(`Missing required environment variable: ${key}`);
  return value;
}

export const config = {
  githubToken: require('GITHUB_TOKEN'),
  githubUsername: require('GITHUB_USERNAME'),
  githubRepo: process.env['GITHUB_REPO'] ?? '',
  pollIntervalMs: parseInt(process.env['POLL_INTERVAL_MS'] ?? '60000', 10),
  port: parseInt(process.env['PORT'] ?? '3000', 10),

  anthropicApiKey: require('ANTHROPIC_API_KEY'),

  smtpHost: require('SMTP_HOST'),
  smtpPort: parseInt(process.env['SMTP_PORT'] ?? '587', 10),
  smtpSecure: process.env['SMTP_SECURE'] === 'true',
  smtpUser: require('SMTP_USER'),
  smtpPass: require('SMTP_PASS'),
  smtpFrom: process.env['SMTP_FROM'] ?? process.env['SMTP_USER'] ?? '',
  reviewToEmail: process.env['REVIEW_TO_EMAIL'] ?? 'cameron@getmobly.com',
};
