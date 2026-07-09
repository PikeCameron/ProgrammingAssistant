import { useEffect, useRef } from 'react';

// Lets you drag from anywhere inside a scrollable element (not just a scrollbar
// thumb) to pan it, with iOS-like momentum on release. Scrolls both axes;
// an axis with nothing to scroll is a no-op since scrollLeft/scrollTop clamp to 0.
export function useDragScroll<T extends HTMLElement>() {
  const ref = useRef<T>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    let lastX = 0;
    let lastY = 0;
    let lastTime = 0;
    let isDown = false;
    let velocityX = 0; // px/ms
    let velocityY = 0; // px/ms
    let animFrameId: number | null = null;
    const recentMoves: { dx: number; dy: number; dt: number }[] = [];

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
        velocityX *= Math.pow(0.9969, dt);
        velocityY *= Math.pow(0.9969, dt);

        if (Math.abs(velocityX) < 0.01 && Math.abs(velocityY) < 0.01) {
          velocityX = 0;
          velocityY = 0;
          return;
        }

        el.scrollLeft += velocityX * dt;
        el.scrollTop += velocityY * dt;
        animFrameId = requestAnimationFrame(step);
      }

      animFrameId = requestAnimationFrame(step);
    }

    function onPointerDown(e: PointerEvent) {
      if (!e.isPrimary) return;
      cancelMomentum();
      isDown = true;
      lastX = e.clientX;
      lastY = e.clientY;
      lastTime = performance.now();
      velocityX = 0;
      velocityY = 0;
      recentMoves.length = 0;
    }

    function onPointerMove(e: PointerEvent) {
      if (!isDown || !e.isPrimary) return;
      const currentX = e.clientX;
      const currentY = e.clientY;
      const now = performance.now();
      const dx = lastX - currentX;
      const dy = lastY - currentY;
      const dt = now - lastTime;

      if (dt > 0) {
        recentMoves.push({ dx, dy, dt });
        if (recentMoves.length > 5) recentMoves.shift();
      }

      el.scrollLeft += dx;
      el.scrollTop += dy;
      lastX = currentX;
      lastY = currentY;
      lastTime = now;
    }

    function onPointerUp(e: PointerEvent) {
      if (!e.isPrimary) return;
      isDown = false;

      if (recentMoves.length > 0) {
        const totalDx = recentMoves.reduce((s, m) => s + m.dx, 0);
        const totalDy = recentMoves.reduce((s, m) => s + m.dy, 0);
        const totalDt = recentMoves.reduce((s, m) => s + m.dt, 0);
        velocityX = totalDt > 0 ? totalDx / totalDt : 0;
        velocityY = totalDt > 0 ? totalDy / totalDt : 0;
        recentMoves.length = 0;

        if (Math.abs(velocityX) > 0.1 || Math.abs(velocityY) > 0.1) startMomentum();
      }
    }

    el.addEventListener('pointerdown', onPointerDown, { passive: true });
    el.addEventListener('pointermove', onPointerMove, { passive: true });
    el.addEventListener('pointerup', onPointerUp, { passive: true });
    el.addEventListener('pointercancel', onPointerUp, { passive: true });

    return () => {
      cancelMomentum();
      el.removeEventListener('pointerdown', onPointerDown);
      el.removeEventListener('pointermove', onPointerMove);
      el.removeEventListener('pointerup', onPointerUp);
      el.removeEventListener('pointercancel', onPointerUp);
    };
  }, []);

  return ref;
}
