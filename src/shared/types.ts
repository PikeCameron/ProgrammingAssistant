export type CheckStatus = 'success' | 'failure' | 'pending' | 'neutral';
export type ReviewDecision = 'approved' | 'changes_requested' | 'review_required' | null;

export interface PullRequest {
  id: string;
  number: number;
  title: string;
  url: string;
  author: string;
  repoName: string;
  createdAt: string;
  isDraft: boolean;
  branchName: string;
  cloneUrl: string;
  checkStatus: CheckStatus;
  reviewDecision: ReviewDecision;
  unresolvedThreads: number;
  hasUserCommented: boolean;
  hasNewCommitSinceComment: boolean;
  latestCommitSha: string;
}

export interface DashboardData {
  reviewRequests: PullRequest[];
  myPRs: PullRequest[];
  fetchedAt: string;
  error?: string;
}

export type ReviewSeverity = 'issue' | 'suggestion' | 'nit';
export type ReviewFindingStatus = 'pending' | 'posted' | 'archived';

export interface ReviewFinding {
  id: string;
  file: string;
  line: number;
  severity: ReviewSeverity;
  comment: string;
  diffHunk: string | null;
  status: ReviewFindingStatus;
  postedUrl?: string;
  postError?: string;
}

export interface ReviewResult {
  prId: string;
  owner: string;
  repo: string;
  number: number;
  commitSha: string;
  summary?: string;
  createdAt: string;
  findings: ReviewFinding[];
}
