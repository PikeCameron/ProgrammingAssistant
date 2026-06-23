import { useState } from 'react';
import type { PullRequest } from '@shared/types';
import { useDashboard } from './hooks/useDashboard';
import { useClearedComments } from './hooks/useClearedComments';
import { useClearedNewCommits } from './hooks/useClearedNewCommits';
import { PRSection } from './components/PRSection';
import { PRDetail } from './components/PRDetail';
import type { CardNotification } from './components/PRCard';

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export function App() {
  const { data, connected } = useDashboard();
  const { visibleCount, clearPR: clearComments } = useClearedComments();
  const { showNewCommitAlert, clearPR: clearNewCommit } = useClearedNewCommits();
  const [selectedPR, setSelectedPR] = useState<PullRequest | null>(null);

  function getNotifications(pr: PullRequest): CardNotification[] {
    const notes: CardNotification[] = [];
    if (showNewCommitAlert(pr)) notes.push({ type: 'new-commit' });
    const count = visibleCount(pr);
    if (count > 0) notes.push({ type: 'unresolved-threads', count });
    return notes;
  }

  function handleClear(pr: PullRequest) {
    clearNewCommit(pr.id, pr.latestCommitSha);
    clearComments(pr.id, pr.unresolvedThreads);
  }

  return (
    <div className="layout">
      {!connected && <div className="offline-overlay">Reconnecting…</div>}
      <div className="columns">
        <PRSection
          title="Review Queue"
          prs={data?.reviewRequests ?? []}
          getNotifications={getNotifications}
          onClearNotifications={handleClear}
          onTapPR={setSelectedPR}
        />
        <PRSection
          title="My PRs"
          prs={data?.myPRs ?? []}
          getNotifications={getNotifications}
          onClearNotifications={handleClear}
          onTapPR={setSelectedPR}
        />
      </div>
      {selectedPR && (
        <PRDetail
          pr={selectedPR}
          notifications={getNotifications(selectedPR)}
          onClose={() => setSelectedPR(null)}
        />
      )}
      <div className="footer">
        <span className={`status-dot ${connected ? 'status-dot--on' : 'status-dot--off'}`} />
        {data ? (
          <span>Updated {formatTime(data.fetchedAt)}{data.error ? ` · ⚠ ${data.error}` : ''}</span>
        ) : (
          <span>Loading…</span>
        )}
      </div>
    </div>
  );
}
