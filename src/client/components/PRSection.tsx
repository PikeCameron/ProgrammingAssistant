import type { PullRequest } from '@shared/types';
import { PRCard, type CardNotification } from './PRCard';

interface Props {
  title: string;
  prs: PullRequest[];
  getNotifications?: (pr: PullRequest) => CardNotification[];
  onClearNotifications?: (pr: PullRequest) => void;
  onTapPR?: (pr: PullRequest) => void;
}

export function PRSection({ title, prs, getNotifications, onClearNotifications, onTapPR }: Props) {
  return (
    <div className="pr-section">
      <div className="pr-section__header">
        <span className="pr-section__title">{title}</span>
        <span className="pr-section__count">{prs.length}</span>
      </div>
      <div className="pr-section__list">
        {prs.length === 0 ? (
          <div className="pr-section__empty">Nothing here</div>
        ) : (
          prs.map((pr) => (
            <PRCard
              key={pr.id}
              pr={pr}
              notifications={getNotifications?.(pr)}
              onClearNotifications={onClearNotifications ? () => onClearNotifications(pr) : undefined}
              onTap={onTapPR ? () => onTapPR(pr) : undefined}
            />
          ))
        )}
      </div>
    </div>
  );
}
