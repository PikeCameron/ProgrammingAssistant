import { useRef, useState } from 'react';

const THRESHOLD = 80;

export function useSwipeToClear(onClear: (() => void) | undefined, enabled: boolean, onTap?: () => void) {
  const startX = useRef<number | null>(null);
  const maxDragX = useRef(0);
  const [dragX, setDragX] = useState(0);
  const [dragging, setDragging] = useState(false);
  const [flashing, setFlashing] = useState(false);

  function onTouchStart(e: React.TouchEvent) {
    startX.current = e.touches[0].clientX;
    maxDragX.current = 0;
    setDragging(true);
  }

  function onTouchMove(e: React.TouchEvent) {
    if (startX.current === null) return;
    const delta = e.touches[0].clientX - startX.current;
    if (delta < 0) {
      const clamped = Math.max(delta, -160);
      setDragX(clamped);
      maxDragX.current = Math.min(maxDragX.current, clamped);
    }
  }

  function onTouchEnd() {
    const wasTap = Math.abs(maxDragX.current) < 10;
    if (wasTap) {
      onTap?.();
    } else if (dragX < -THRESHOLD && onClear && enabled) {
      onClear();
      setFlashing(true);
      setTimeout(() => setFlashing(false), 350);
    }
    setDragX(0);
    setDragging(false);
    startX.current = null;
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
