import { useEffect, useState } from 'react';
import type { PullRequest, ReviewDecision, ReviewResult } from '@shared/types';
import type { CardNotification } from './PRCard';
import { ReviewFindingRow } from './ReviewFindingRow';

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
  const [review, setReview] = useState<ReviewResult | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const [owner, repo] = pr.repoName.split('/');

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/review/${owner}/${repo}/${pr.number}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data: { review: ReviewResult } | null) => {
        if (cancelled || !data?.review) return;
        setReview(data.review);
        setReviewState('done');
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [owner, repo, pr.number]);

  async function handleReview() {
    setReviewState('loading');
    try {
      const res = await fetch('/api/review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          owner, repo, number: pr.number, title: pr.title,
          branch: pr.branchName, cloneUrl: pr.cloneUrl, commitSha: pr.latestCommitSha,
        }),
      });
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json() as { review: ReviewResult };
      setReview(data.review);
      setReviewState('done');
    } catch {
      setReviewState('error');
    }
  }

  async function handleSaveFinding(findingId: string, comment: string) {
    const res = await fetch(`/api/review/${owner}/${repo}/${pr.number}/findings/${findingId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ comment }),
    });
    if (!res.ok) return;
    const data = await res.json() as { finding: ReviewResult['findings'][number] };
    setReview((prev) => prev && {
      ...prev,
      findings: prev.findings.map((f) => (f.id === findingId ? data.finding : f)),
    });
  }

  async function handleSubmitFinding(findingId: string) {
    const res = await fetch(`/api/review/${owner}/${repo}/${pr.number}/findings/${findingId}/submit`, {
      method: 'POST',
    });
    const data = await res.json() as { finding?: ReviewResult['findings'][number]; error?: string };
    if (!data.finding) return;
    const finding = data.finding;
    setReview((prev) => prev && {
      ...prev,
      findings: prev.findings.map((f) => (f.id === findingId ? finding : f)),
    });
  }

  const reviewLabel =
    reviewState === 'loading' ? 'Reviewing…' :
    reviewState === 'done'    ? 'Re-review with Claude' :
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

        {review && (
          <div className="pr-detail__findings">
            {review.summary && <div className="pr-detail__review-summary">{review.summary}</div>}
            {review.findings.length === 0 ? (
              <div className="pr-detail__notif-empty">No findings — looks clean.</div>
            ) : (
              review.findings.map((f) => (
                <ReviewFindingRow
                  key={f.id}
                  finding={f}
                  expanded={expandedId === f.id}
                  onToggle={() => setExpandedId(expandedId === f.id ? null : f.id)}
                  onSave={(comment) => handleSaveFinding(f.id, comment)}
                  onSubmit={() => handleSubmitFinding(f.id)}
                />
              ))
            )}
          </div>
        )}

        <div className="pr-detail__actions">
          {review && (
            <span className="pr-detail__review-count">
              <span className="pr-detail__review-check">✓</span>
              {review.findings.length}
            </span>
          )}
          <button
            className={`pr-detail__review-btn${reviewState === 'done' ? ' pr-detail__review-btn--done' : ''}${reviewState === 'error' ? ' pr-detail__review-btn--error' : ''}`}
            onClick={handleReview}
            disabled={reviewState === 'loading'}
          >
            {reviewState === 'loading' && <span className="pr-detail__spinner" />}
            {reviewLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
