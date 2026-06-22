import { useState } from 'react';
import type { PullRequest } from '@shared/types';

const STORAGE_KEY = 'pr-dashboard:cleared-comments';

function load(): Record<string, number> {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '{}');
  } catch {
    return {};
  }
}

export function useClearedComments() {
  const [cleared, setCleared] = useState<Record<string, number>>(load);

  function clearPR(prId: string, count: number) {
    const next = { ...cleared, [prId]: count };
    setCleared(next);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  }

  // Returns the count to display: 0 means hide the badge.
  // Badge reappears if unresolvedThreads grows beyond the last cleared count.
  function visibleCount(pr: PullRequest): number {
    if (pr.unresolvedThreads === 0) return 0;
    const clearedAt = cleared[pr.id] ?? 0;
    return pr.unresolvedThreads > clearedAt ? pr.unresolvedThreads : 0;
  }

  return { visibleCount, clearPR };
}
