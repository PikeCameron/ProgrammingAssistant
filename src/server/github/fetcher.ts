import type { CheckStatus, DashboardData, PullRequest, ReviewDecision } from '../../shared/types.js';
import { config } from '../config.js';
import { githubClient } from './client.js';
import { DASHBOARD_QUERY } from './queries.js';

interface RawCommit {
  oid: string;
  committedDate: string;
  statusCheckRollup: { state: string } | null;
}

interface RawPR {
  id: string;
  number: number;
  title: string;
  url: string;
  isDraft: boolean;
  author: { login: string } | null;
  createdAt: string;
  repository: { nameWithOwner: string };
  commits: { nodes: Array<{ commit: RawCommit }> };
  reviewDecision: string | null;
  reviews?: {
    nodes: Array<{ author: { login: string } | null; submittedAt: string }>;
  };
  reviewThreads?: {
    nodes: Array<{ isResolved: boolean }>;
  };
}

interface QueryResult {
  reviewRequests: { nodes: RawPR[] };
  myPRs: { nodes: RawPR[] };
}

function toCheckStatus(state: string | null | undefined): CheckStatus {
  switch (state?.toUpperCase()) {
    case 'SUCCESS': return 'success';
    case 'FAILURE':
    case 'ERROR': return 'failure';
    case 'PENDING': return 'pending';
    default: return 'neutral';
  }
}

function toReviewDecision(decision: string | null | undefined): ReviewDecision {
  switch (decision) {
    case 'APPROVED': return 'approved';
    case 'CHANGES_REQUESTED': return 'changes_requested';
    case 'REVIEW_REQUIRED': return 'review_required';
    default: return null;
  }
}

function mapPR(raw: RawPR, login: string): PullRequest {
  const commit = raw.commits.nodes[0]?.commit;

  const userReviews = (raw.reviews?.nodes ?? []).filter(
    (r) => r.author?.login === login,
  );
  const hasUserCommented = userReviews.length > 0;
  const latestUserReviewMs = hasUserCommented
    ? Math.max(...userReviews.map((r) => new Date(r.submittedAt).getTime()))
    : 0;
  const latestCommitMs = commit?.committedDate
    ? new Date(commit.committedDate).getTime()
    : 0;
  const hasNewCommitSinceComment =
    hasUserCommented && latestCommitMs > latestUserReviewMs;

  const unresolvedThreads = raw.reviewThreads
    ? raw.reviewThreads.nodes.filter((t) => !t.isResolved).length
    : 0;

  return {
    id: raw.id,
    number: raw.number,
    title: raw.title,
    url: raw.url,
    author: raw.author?.login ?? 'unknown',
    repoName: raw.repository.nameWithOwner,
    createdAt: raw.createdAt,
    isDraft: raw.isDraft,
    checkStatus: toCheckStatus(commit?.statusCheckRollup?.state),
    reviewDecision: toReviewDecision(raw.reviewDecision),
    unresolvedThreads,
    hasUserCommented,
    hasNewCommitSinceComment,
    latestCommitSha: commit?.oid ?? '',
  };
}

export async function fetchDashboardData(): Promise<DashboardData> {
  const login = config.githubUsername;
  const repoFilter = config.githubRepo ? ` repo:${config.githubRepo}` : '';
  const result = await githubClient<QueryResult>(DASHBOARD_QUERY, {
    reviewQuery: `is:open is:pr -author:${login}${repoFilter}`,
    myPRsQuery: `is:open is:pr author:${login} archived:false${repoFilter}`,
  });

  return {
    reviewRequests: result.reviewRequests.nodes
      .filter((n): n is RawPR => 'id' in n)
      .map((n) => mapPR(n, login)),
    myPRs: result.myPRs.nodes
      .filter((n): n is RawPR => 'id' in n)
      .map((n) => mapPR(n, login)),
    fetchedAt: new Date().toISOString(),
  };
}
