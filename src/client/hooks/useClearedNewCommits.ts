import { useState } from 'react';
import type { PullRequest } from '@shared/types';

const STORAGE_KEY = 'pr-dashboard:cleared-new-commits';

function load(): Record<string, string> {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '{}');
  } catch {
    return {};
  }
}

export function useClearedNewCommits() {
  const [cleared, setCleared] = useState<Record<string, string>>(load);

  function clearPR(prId: string, commitSha: string) {
    const next = { ...cleared, [prId]: commitSha };
    setCleared(next);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  }

  // Returns true when the PR has a new commit since the user commented
  // AND they haven't dismissed the notification for this specific commit yet.
  function showNewCommitAlert(pr: PullRequest): boolean {
    if (!pr.hasNewCommitSinceComment) return false;
    return cleared[pr.id] !== pr.latestCommitSha;
  }

  return { showNewCommitAlert, clearPR };
}
