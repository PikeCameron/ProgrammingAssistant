import { useRef, useEffect } from 'react';
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
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const list = listRef.current;
    if (!list) return;

    let lastY = 0;

    function onTouchStart(e: TouchEvent) {
      lastY = e.touches[0].clientY;
    }

    function onTouchMove(e: TouchEvent) {
      const currentY = e.touches[0].clientY;
      list.scrollTop += lastY - currentY;
      lastY = currentY;
    }

    list.addEventListener('touchstart', onTouchStart, { passive: true });
    list.addEventListener('touchmove', onTouchMove, { passive: true });

    return () => {
      list.removeEventListener('touchstart', onTouchStart);
      list.removeEventListener('touchmove', onTouchMove);
    };
  }, []);

  return (
    <div className="pr-section">
      <div className="pr-section__header">
        <span className="pr-section__title">{title}</span>
        <span className="pr-section__count">{prs.length}</span>
      </div>
      <div className="pr-section__list" ref={listRef}>
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
