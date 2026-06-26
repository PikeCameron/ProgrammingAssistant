import { useState } from 'react';

function reviewKey(prId: string) { return `review-count:${prId}`; }
function getReviewCount(prId: string) { return parseInt(localStorage.getItem(reviewKey(prId)) ?? '0', 10); }
function incrementReviewCount(prId: string) { localStorage.setItem(reviewKey(prId), String(getReviewCount(prId) + 1)); }
import type { PullRequest, ReviewDecision } from '@shared/types';
import type { CardNotification } from './PRCard';

interface Props {
  pr: PullRequest;
  notifications: CardNotification[];
  onClose: () => void;
}

type ReviewState = 'idle' | 'loading' | 'done' | 'error';

const DECISION_LABEL: Record<NonNullable<ReviewDecision>, string> = {
  approved: 'APPROVED',
  changes_requested: 'CHANGES REQUESTED',
  review_required: 'NEEDS REVIEW',
};

const DECISION_CLASS: Record<NonNullable<ReviewDecision>, string> = {
  approved: 'chip chip--approved',
  changes_requested: 'chip chip--changes',
  review_required: 'chip chip--pending',
};

function fullDate(iso: string): string {
  return new Date(iso).toLocaleString([], {
    month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

export function PRDetail({ pr, notifications, onClose }: Props) {
  const [reviewState, setReviewState] = useState<ReviewState>('idle');
  const [reviewCount, setReviewCount] = useState(() => getReviewCount(pr.id));

  async function handleReview() {
    setReviewState('loading');
    const [owner, repo] = pr.repoName.split('/');
    try {
      const res = await fetch('/api/review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ owner, repo, number: pr.number, title: pr.title, branch: pr.branchName, cloneUrl: pr.cloneUrl }),
      });
      if (!res.ok) throw new Error(await res.text());
      incrementReviewCount(pr.id);
      setReviewCount(getReviewCount(pr.id));
      setReviewState('done');
    } catch {
      setReviewState('error');
    }
  }

  const reviewLabel =
    reviewState === 'loading' ? 'Reviewing…' :
    reviewState === 'done'    ? '✓ Review sent' :
    reviewState === 'error'   ? 'Failed — retry' :
    'Review with Claude';

  return (
    <div className="pr-detail-overlay" onMouseDown={onClose} onTouchStart={onClose}>
      <div
        className="pr-detail"
        onMouseDown={(e) => e.stopPropagation()}
        onTouchStart={(e) => e.stopPropagation()}
      >
        <div className="pr-detail__header">
          <span className="pr-detail__title">{pr.title}</span>
          <button className="pr-detail__close" onMouseDown={onClose} onTouchStart={onClose}>✕</button>
        </div>

        <div className="pr-detail__meta">
          {pr.repoName} &nbsp;·&nbsp; #{pr.number} &nbsp;·&nbsp; {pr.author} &nbsp;·&nbsp; opened {fullDate(pr.createdAt)}
        </div>

        {(pr.isDraft || pr.hasUserCommented || pr.reviewDecision) && (
          <div className="pr-detail__tags">
            {pr.isDraft && (
              <span className="chip chip--draft">DRAFT</span>
            )}
            {pr.hasUserCommented && (
              <span className="chip chip--commented">You commented</span>
            )}
            {pr.reviewDecision && (
              <span className={DECISION_CLASS[pr.reviewDecision]}>
                {DECISION_LABEL[pr.reviewDecision]}
              </span>
            )}
          </div>
        )}

        <div className="pr-detail__notifs">
          {notifications.length === 0 ? (
            <div className="pr-detail__notif-empty">No active notifications</div>
          ) : (
            notifications.map((n) => (
              <div key={n.type} className="pr-detail__notif-row">
                <span className={`notif-dot notif-dot--${n.type}`} />
                <span className="pr-detail__notif-text">
                  {n.type === 'unresolved-threads'
                    ? `${n.count} unresolved comment thread${n.count !== 1 ? 's' : ''}`
                    : `New commit since your review · ${pr.latestCommitSha.slice(0, 7)}`}
                </span>
              </div>
            ))
          )}
        </div>

        <div className="pr-detail__actions">
          {reviewCount > 0 && (
            <span className="pr-detail__review-count">
              <span className="pr-detail__review-check">✓</span>
              {reviewCount}
            </span>
          )}
          <button
            className={`pr-detail__review-btn${reviewState === 'done' ? ' pr-detail__review-btn--done' : ''}${reviewState === 'error' ? ' pr-detail__review-btn--error' : ''}`}
            onClick={handleReview}
            disabled={reviewState === 'loading' || reviewState === 'done'}
          >
            {reviewState === 'loading' && <span className="pr-detail__spinner" />}
            {reviewLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
