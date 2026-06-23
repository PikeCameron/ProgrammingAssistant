import { useRef, useState } from 'react';

const THRESHOLD = 80;
const DIRECTION_LOCK = 8; // px of movement before we commit to a direction

type Direction = 'horizontal' | 'vertical' | null;

export function useSwipeToClear(onClear: (() => void) | undefined, enabled: boolean, onTap?: () => void) {
  const startX = useRef<number | null>(null);
  const startY = useRef<number | null>(null);
  const direction = useRef<Direction>(null);
  const maxDragX = useRef(0);
  const [dragX, setDragX] = useState(0);
  const [dragging, setDragging] = useState(false);
  const [flashing, setFlashing] = useState(false);

  function onTouchStart(e: React.TouchEvent) {
    startX.current = e.touches[0].clientX;
    startY.current = e.touches[0].clientY;
    direction.current = null;
    maxDragX.current = 0;
    // Don't set dragging yet — wait until we know the gesture direction
  }

  function onTouchMove(e: React.TouchEvent) {
    if (startX.current === null || startY.current === null) return;
    const dx = e.touches[0].clientX - startX.current;
    const dy = e.touches[0].clientY - startY.current;

    if (direction.current === null) {
      if (Math.abs(dx) < DIRECTION_LOCK && Math.abs(dy) < DIRECTION_LOCK) return;
      direction.current = Math.abs(dx) > Math.abs(dy) ? 'horizontal' : 'vertical';
      if (direction.current === 'horizontal') setDragging(true);
    }

    if (direction.current !== 'horizontal') return;

    if (dx < 0) {
      const clamped = Math.max(dx, -160);
      setDragX(clamped);
      maxDragX.current = Math.min(maxDragX.current, clamped);
    }
  }

  function onTouchEnd() {
    const wasTap = direction.current === null;
    if (wasTap) {
      onTap?.();
    } else if (direction.current === 'horizontal' && dragX < -THRESHOLD && onClear && enabled) {
      onClear();
      setFlashing(true);
      setTimeout(() => setFlashing(false), 350);
    }
    setDragX(0);
    setDragging(false);
    startX.current = null;
    startY.current = null;
    direction.current = null;
    maxDragX.current = 0;
  }

  // Mouse equivalents for dev/desktop testing
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
      onTap?.();
    } else if (dragX < -THRESHOLD && onClear && enabled) {
      onClear();
      setFlashing(true);
      setTimeout(() => setFlashing(false), 350);
    }
    setDragX(0);
    mouseStartX.current = null;
    mouseMaxDrag.current = 0;
  }

  const progress = Math.min(1, Math.abs(dragX) / THRESHOLD);

  return {
    dragX,
    dragging,
    flashing,
    progress,
    handlers: { onTouchStart, onTouchMove, onTouchEnd, onMouseDown, onMouseMove, onMouseUp },
  };
}
