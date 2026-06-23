import { useRef, useState, useEffect } from 'react';

const THRESHOLD = 80;
const DIRECTION_LOCK = 8;

type Direction = 'horizontal' | 'vertical' | null;

export function useSwipeToClear(
  onClear: (() => void) | undefined,
  enabled: boolean,
) {
  const cardRef = useRef<HTMLDivElement>(null);

  const onClearRef = useRef(onClear);
  const enabledRef = useRef(enabled);
  onClearRef.current = onClear;
  enabledRef.current = enabled;

  const isDown = useRef(false);
  const startX = useRef(0);
  const startY = useRef(0);
  const directionRef = useRef<Direction>(null);
  const dragXRef = useRef(0);

  const [dragX, setDragX] = useState(0);
  const [dragging, setDragging] = useState(false);
  const [flashing, setFlashing] = useState(false);

  useEffect(() => {
    const el = cardRef.current;
    if (!el) return;

    function handlePointerDown(e: PointerEvent) {
      if (!e.isPrimary) return;
      isDown.current = true;
      startX.current = e.clientX;
      startY.current = e.clientY;
      directionRef.current = null;
      dragXRef.current = 0;
    }

    function handlePointerMove(e: PointerEvent) {
      if (!isDown.current || !e.isPrimary) return;
      const dx = e.clientX - startX.current;
      const dy = e.clientY - startY.current;

      if (directionRef.current === null) {
        if (Math.abs(dx) < DIRECTION_LOCK && Math.abs(dy) < DIRECTION_LOCK) return;
        directionRef.current = Math.abs(dx) > Math.abs(dy) ? 'horizontal' : 'vertical';
        if (directionRef.current === 'horizontal') setDragging(true);
      }

      if (directionRef.current === 'vertical') return;

      e.stopPropagation();
      if (dx < 0) {
        const clamped = Math.max(dx, -160);
        dragXRef.current = clamped;
        setDragX(clamped);
      }
    }

    function handlePointerUp(e: PointerEvent) {
      if (!e.isPrimary) return;
      isDown.current = false;

      if (
        directionRef.current === 'horizontal' &&
        dragXRef.current < -THRESHOLD &&
        enabledRef.current
      ) {
        onClearRef.current?.();
        setFlashing(true);
        setTimeout(() => setFlashing(false), 350);
      }

      dragXRef.current = 0;
      setDragX(0);
      setDragging(false);
      directionRef.current = null;
    }

    el.addEventListener('pointerdown', handlePointerDown, { passive: true });
    el.addEventListener('pointermove', handlePointerMove, { passive: true });
    el.addEventListener('pointerup', handlePointerUp, { passive: true });
    el.addEventListener('pointercancel', handlePointerUp, { passive: true });

    return () => {
      el.removeEventListener('pointerdown', handlePointerDown);
      el.removeEventListener('pointermove', handlePointerMove);
      el.removeEventListener('pointerup', handlePointerUp);
      el.removeEventListener('pointercancel', handlePointerUp);
    };
  }, []);

  const progress = Math.min(1, Math.abs(dragX) / THRESHOLD);

  return { cardRef, dragX, dragging, flashing, progress };
}
