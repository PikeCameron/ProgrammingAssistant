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
    let lastTime = 0;
    let isDown = false;
    let velocity = 0; // px/ms, positive = scrolling down
    let animFrameId: number | null = null;
    const recentMoves: { dy: number; dt: number }[] = [];

    function cancelMomentum() {
      if (animFrameId !== null) {
        cancelAnimationFrame(animFrameId);
        animFrameId = null;
      }
    }

    function startMomentum() {
      let lastTs = performance.now();

      function step(ts: number) {
        const dt = Math.min(ts - lastTs, 50);
        lastTs = ts;

        // iOS-like exponential friction (~0.9969 per ms ≈ 325ms half-life)
        velocity *= Math.pow(0.9969, dt);

        if (Math.abs(velocity) < 0.01) {
          velocity = 0;
          return;
        }

        list.scrollTop += velocity * dt;
        animFrameId = requestAnimationFrame(step);
      }

      animFrameId = requestAnimationFrame(step);
    }

    function onPointerDown(e: PointerEvent) {
      if (!e.isPrimary) return;
      cancelMomentum();
      isDown = true;
      lastY = e.clientY;
      lastTime = performance.now();
      velocity = 0;
      recentMoves.length = 0;
    }

    function onPointerMove(e: PointerEvent) {
      if (!isDown || !e.isPrimary) return;
      const currentY = e.clientY;
      const now = performance.now();
      const dy = lastY - currentY;
      const dt = now - lastTime;

      if (dt > 0) {
        recentMoves.push({ dy, dt });
        if (recentMoves.length > 5) recentMoves.shift();
      }

      list.scrollTop += dy;
      lastY = currentY;
      lastTime = now;
    }

    function onPointerUp(e: PointerEvent) {
      if (!e.isPrimary) return;
      isDown = false;

      if (recentMoves.length > 0) {
        const totalDy = recentMoves.reduce((s, m) => s + m.dy, 0);
        const totalDt = recentMoves.reduce((s, m) => s + m.dt, 0);
        velocity = totalDt > 0 ? totalDy / totalDt : 0;
        recentMoves.length = 0;

        if (Math.abs(velocity) > 0.1) startMomentum();
      }
    }

    list.addEventListener('pointerdown', onPointerDown, { passive: true });
    list.addEventListener('pointermove', onPointerMove, { passive: true });
    list.addEventListener('pointerup', onPointerUp, { passive: true });
    list.addEventListener('pointercancel', onPointerUp, { passive: true });

    return () => {
      cancelMomentum();
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
