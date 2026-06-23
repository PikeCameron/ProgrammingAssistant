import { useRef, useState, useEffect } from 'react';

const THRESHOLD = 80;
const DIRECTION_LOCK = 8;

type Direction = 'horizontal' | 'vertical' | null;

export function useSwipeToClear(
  onClear: (() => void) | undefined,
  enabled: boolean,
  onTap?: () => void,
) {
  const cardRef = useRef<HTMLDivElement>(null);

  // Keep latest callbacks in refs so the effect closure never goes stale
  const onClearRef = useRef(onClear);
  const enabledRef = useRef(enabled);
  const onTapRef = useRef(onTap);
  onClearRef.current = onClear;
  enabledRef.current = enabled;
  onTapRef.current = onTap;

  const startX = useRef<number | null>(null);
  const startY = useRef<number | null>(null);
  const directionRef = useRef<Direction>(null);
  const dragXRef = useRef(0);

  const [dragX, setDragX] = useState(0);
  const [dragging, setDragging] = useState(false);
  const [flashing, setFlashing] = useState(false);

  useEffect(() => {
    const el = cardRef.current;
    if (!el) return;

    function handleTouchStart(e: TouchEvent) {
      startX.current = e.touches[0].clientX;
      startY.current = e.touches[0].clientY;
      directionRef.current = null;
      dragXRef.current = 0;
    }

    function handleTouchMove(e: TouchEvent) {
      if (startX.current === null || startY.current === null) return;
      const dx = e.touches[0].clientX - startX.current;
      const dy = e.touches[0].clientY - startY.current;

      if (directionRef.current === null) {
        if (Math.abs(dx) < DIRECTION_LOCK && Math.abs(dy) < DIRECTION_LOCK) return;
        directionRef.current = Math.abs(dx) > Math.abs(dy) ? 'horizontal' : 'vertical';
        if (directionRef.current === 'horizontal') setDragging(true);
      }

      if (directionRef.current !== 'horizontal') return;

      if (dx < 0) {
        const clamped = Math.max(dx, -160);
        dragXRef.current = clamped;
        setDragX(clamped);
      }
    }

    function handleTouchEnd() {
      const wasTap = directionRef.current === null;
      if (wasTap) {
        onTapRef.current?.();
      } else if (
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
      startX.current = null;
      startY.current = null;
      directionRef.current = null;
    }

    // passive: true lets the browser scroll without waiting for JS
    el.addEventListener('touchstart', handleTouchStart, { passive: true });
    el.addEventListener('touchmove', handleTouchMove, { passive: true });
    el.addEventListener('touchend', handleTouchEnd, { passive: true });

    return () => {
      el.removeEventListener('touchstart', handleTouchStart);
      el.removeEventListener('touchmove', handleTouchMove);
      el.removeEventListener('touchend', handleTouchEnd);
    };
  }, []); // empty deps — callbacks accessed via refs

  // Mouse equivalents for desktop testing (React synthetic events are fine here)
  const mouseStartX = useRef<number | null>(null);
  const mouseMaxDrag = useRef(0);

  function onMouseDown(e: React.MouseEvent) {
    mouseStartX.current = e.clientX;
    mouseMaxDrag.current = 0;
  }

  function onMouseMove(e: React.MouseEvent) {
    if (mouseStartX.current === null) return;
    const delta = e.clientX - mouseStartX.current;
    if (delta < 0) {
      const clamped = Math.max(delta, -160);
      setDragX(clamped);
      mouseMaxDrag.current = Math.min(mouseMaxDrag.current, clamped);
    }
  }

  function onMouseUp() {
    const wasTap = Math.abs(mouseMaxDrag.current) < 10;
    if (wasTap) {
      onTapRef.current?.();
    } else if (dragX < -THRESHOLD && enabledRef.current) {
      onClearRef.current?.();
      setFlashing(true);
      setTimeout(() => setFlashing(false), 350);
    }
    setDragX(0);
    mouseStartX.current = null;
    mouseMaxDrag.current = 0;
  }

  const progress = Math.min(1, Math.abs(dragX) / THRESHOLD);

  return {
    cardRef,
    dragX,
    dragging,
    flashing,
    progress,
    mouseHandlers: { onMouseDown, onMouseMove, onMouseUp },
  };
}
