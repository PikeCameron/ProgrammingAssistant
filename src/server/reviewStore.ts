import type { ReviewResult, ReviewFinding } from '../shared/types.js';

const reviews = new Map<string, ReviewResult>();

export function getReview(prId: string): ReviewResult | null {
  return reviews.get(prId) ?? null;
}

export function setReview(review: ReviewResult): void {
  reviews.set(review.prId, review);
}

export function updateFindingComment(prId: string, findingId: string, comment: string): ReviewFinding | null {
  const review = reviews.get(prId);
  const finding = review?.findings.find((f) => f.id === findingId);
  if (!review || !finding) return null;
  if (finding.status === 'posted') return null;
  finding.comment = comment;
  finding.postError = undefined;
  return finding;
}

export function markFindingPosted(prId: string, findingId: string, postedUrl: string): ReviewFinding | null {
  const review = reviews.get(prId);
  const finding = review?.findings.find((f) => f.id === findingId);
  if (!review || !finding) return null;
  finding.status = 'posted';
  finding.postedUrl = postedUrl;
  finding.postError = undefined;
  return finding;
}

export function markFindingError(prId: string, findingId: string, message: string): void {
  const review = reviews.get(prId);
  const finding = review?.findings.find((f) => f.id === findingId);
  if (finding) finding.postError = message;
}

export function setFindingArchived(prId: string, findingId: string, archived: boolean): ReviewFinding | null {
  const review = reviews.get(prId);
  const finding = review?.findings.find((f) => f.id === findingId);
  if (!review || !finding) return null;
  if (finding.status === 'posted') return null;
  finding.status = archived ? 'archived' : 'pending';
  return finding;
}
