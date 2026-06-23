import type { PullRequest, ReviewDecision } from '@shared/types';
import type { CardNotification } from './PRCard';

interface Props {
  pr: PullRequest;
  notifications: CardNotification[];
  onClose: () => void;
}

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

        {(pr.hasUserCommented || pr.reviewDecision) && (
          <div className="pr-detail__tags">
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
      </div>
    </div>
  );
}
