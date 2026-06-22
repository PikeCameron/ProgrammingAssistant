import { useRef, useState } from 'react';

const THRESHOLD = 80;

export function useSwipeToClear(onClear: (() => void) | undefined, enabled: boolean) {
  const startX = useRef<number | null>(null);
  const [dragX, setDragX] = useState(0);
  const [dragging, setDragging] = useState(false);
  const [flashing, setFlashing] = useState(false);

  function onTouchStart(e: React.TouchEvent) {
    if (!enabled) return;
    startX.current = e.touches[0].clientX;
    setDragging(true);
  }

  function onTouchMove(e: React.TouchEvent) {
    if (startX.current === null) return;
    const delta = e.touches[0].clientX - startX.current;
    if (delta < 0) setDragX(Math.max(delta, -160));
  }

  function onTouchEnd() {
    if (dragX < -THRESHOLD && onClear) {
      onClear();
      setFlashing(true);
      setTimeout(() => setFlashing(false), 350);
    }
    setDragX(0);
    setDragging(false);
    startX.current = null;
  }

  // Mouse equivalents for dev/desktop testing
  const mouseStartX = useRef<number | null>(null);

  function onMouseDown(e: React.MouseEvent) {
    if (!enabled) return;
    mouseStartX.current = e.clientX;
  }

  function onMouseMove(e: React.MouseEvent) {
    if (mouseStartX.current === null) return;
    const delta = e.clientX - mouseStartX.current;
    if (delta < 0) setDragX(Math.max(delta, -160));
  }

  function onMouseUp() {
    if (dragX < -THRESHOLD && onClear) {
      onClear();
      setFlashing(true);
      setTimeout(() => setFlashing(false), 350);
    }
    setDragX(0);
    mouseStartX.current = null;
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
