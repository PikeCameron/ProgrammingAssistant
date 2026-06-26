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

  resendApiKey: require('RESEND_API_KEY'),
  emailFrom: process.env['EMAIL_FROM'] ?? 'PR Dashboard <onboarding@resend.dev>',
  reviewToEmail: process.env['REVIEW_TO_EMAIL'] ?? 'cameron@getmobly.com',

  macReviewUrl: process.env['MAC_REVIEW_URL'] ?? '',
};
