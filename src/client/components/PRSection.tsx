import { useRef, useEffect } from 'react';
import type { PullRequest } from '@shared/types';
import { PRCard, type CardNotification } from './PRCard';

interface Props {
  title: string;
  prs: PullRequest[];
  getNotifications?: (pr: PullRequest) => CardNotification[];
  onClearNotifications?: (pr: PullRequest) => void;
  onDetailPR?: (pr: PullRequest) => void;
}

export function PRSection({ title, prs, getNotifications, onClearNotifications, onDetailPR }: Props) {
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const list = listRef.current;
    if (!list) return;

    let lastY = 0;
    let isDown = false;

    function onPointerDown(e: PointerEvent) {
      if (!e.isPrimary) return;
      isDown = true;
      lastY = e.clientY;
    }

    function onPointerMove(e: PointerEvent) {
      if (!isDown || !e.isPrimary) return;
      const currentY = e.clientY;
      list.scrollTop += lastY - currentY;
      lastY = currentY;
    }

    function onPointerUp(e: PointerEvent) {
      if (!e.isPrimary) return;
      isDown = false;
    }

    list.addEventListener('pointerdown', onPointerDown, { passive: true });
    list.addEventListener('pointermove', onPointerMove, { passive: true });
    list.addEventListener('pointerup', onPointerUp, { passive: true });
    list.addEventListener('pointercancel', onPointerUp, { passive: true });

    return () => {
      list.removeEventListener('pointerdown', onPointerDown);
      list.removeEventListener('pointermove', onPointerMove);
      list.removeEventListener('pointerup', onPointerUp);
      list.removeEventListener('pointercancel', onPointerUp);
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
              onDetail={onDetailPR ? () => onDetailPR(pr) : undefined}
            />
          ))
        )}
      </div>
    </div>
  );
}
