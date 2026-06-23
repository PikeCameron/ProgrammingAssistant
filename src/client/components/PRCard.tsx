import type { PullRequest, ReviewDecision } from '@shared/types';
import { useSwipeToClear } from '../hooks/useSwipeToClear';

export interface CardNotification {
  type: 'new-commit' | 'unresolved-threads';
  count?: number;
}

interface Props {
  pr: PullRequest;
  notifications?: CardNotification[];
  onClearNotifications?: () => void;
  onDetail?: () => void;
}

function relativeAge(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 60) return `${mins}m`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h`;
  return `${Math.floor(hours / 24)}d`;
}

const DECISION_LABEL: Record<NonNullable<ReviewDecision>, string> = {
  approved: 'APPROVED',
  changes_requested: 'CHANGES',
  review_required: 'NEEDS REVIEW',
};

const DECISION_CLASS: Record<NonNullable<ReviewDecision>, string> = {
  approved: 'chip chip--approved',
  changes_requested: 'chip chip--changes',
  review_required: 'chip chip--pending',
};

export function PRCard({ pr, notifications = [], onClearNotifications, onDetail }: Props) {
  const hasNotifications = notifications.length > 0;
  const { cardRef, dragX, dragging, flashing, progress } = useSwipeToClear(onClearNotifications, hasNotifications);

  return (
    <div className={`pr-card${pr.isDraft ? ' pr-card--draft' : ''}`} ref={cardRef}>
      {hasNotifications && (
        <div className="pr-card__swipe-bg" style={{ opacity: progress }}>
          <span className="pr-card__swipe-label">Clear</span>
        </div>
      )}
      <div
        className={`pr-card__inner${flashing ? ' pr-card__inner--flash' : ''}`}
        style={{
          transform: `translateX(${dragX}px)`,
          transition: dragging ? 'none' : 'transform 0.2s ease',
        }}
      >
        <div className="pr-card__body">
          <button className="pr-card__detail-btn" onClick={onDetail} aria-label="View details" />
          <div className="pr-card__content">
            <div className="pr-card__top">
              <span className="pr-card__title">{pr.title}</span>
              <div className="pr-card__chips">
                {pr.isDraft && (
                  <span className="chip chip--draft">DRAFT</span>
                )}
                {pr.hasUserCommented && (
                  <span className="chip chip--commented">reviewed</span>
                )}
                {pr.reviewDecision && (
                  <span className={DECISION_CLASS[pr.reviewDecision]}>
                    {DECISION_LABEL[pr.reviewDecision]}
                  </span>
                )}
              </div>
            </div>
            <span className="pr-card__meta">
              #{pr.number} · {pr.author} · {relativeAge(pr.createdAt)}
            </span>
          </div>
          {notifications.length > 0 && (
            <div className="pr-card__dots">
              {notifications.map((n) => (
                <span
                  key={n.type}
                  className={`notif-dot notif-dot--${n.type}`}
                  title={n.type === 'new-commit' ? 'New commit since your review' : `${n.count} unresolved thread${n.count !== 1 ? 's' : ''}`}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
