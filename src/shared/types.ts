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
