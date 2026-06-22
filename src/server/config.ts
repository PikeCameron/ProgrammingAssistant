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
};
