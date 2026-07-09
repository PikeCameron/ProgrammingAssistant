import { useEffect, useState } from 'react';
import type { ReviewFinding } from '@shared/types';
import { DiffHunkView } from './DiffHunkView';
import { SEVERITY_CLASS } from './reviewSeverity';

interface Props {
  findings: ReviewFinding[];
  onSave: (findingId: string, comment: string) => Promise<void>;
  onSubmit: (findingId: string) => Promise<void>;
  onSetArchived: (findingId: string, archived: boolean) => Promise<void>;
  onClose: () => void;
}

export function ReviewFindingsViewer({ findings, onSave, onSubmit, onSetArchived, onClose }: Props) {
  const [viewingArchived, setViewingArchived] = useState(false);
  const [index, setIndex] = useState(0);
  const [draft, setDraft] = useState('');
  const [saving, setSaving] = useState(false);
  const [posting, setPosting] = useState(false);
  const [archiving, setArchiving] = useState(false);

  const activeFindings = findings.filter((f) => f.status !== 'archived');
  const archivedFindings = findings.filter((f) => f.status === 'archived');
  const list = viewingArchived ? archivedFindings : activeFindings;
  const finding: ReviewFinding | undefined = list[index];

  useEffect(() => {
    setIndex((i) => Math.min(i, Math.max(list.length - 1, 0)));
  }, [list.length, viewingArchived]);

  useEffect(() => {
    setDraft(finding?.comment ?? '');
  }, [finding?.id, finding?.comment]);

  const dirty = finding ? draft !== finding.comment : false;
  const locked = finding?.status === 'posted';

  async function handleSave() {
    if (!finding) return;
    setSaving(true);
    try { await onSave(finding.id, draft); } finally { setSaving(false); }
  }

  async function handleSubmit() {
    if (!finding) return;
    setPosting(true);
    try { await onSubmit(finding.id); } finally { setPosting(false); }
  }

  async function handleSetArchived(archived: boolean) {
    if (!finding) return;
    setArchiving(true);
    try { await onSetArchived(finding.id, archived); } finally { setArchiving(false); }
  }

  return (
    <div className="finding-viewer">
      <div className="finding-viewer__header">
        {finding && <span className={SEVERITY_CLASS[finding.severity]}>{finding.severity.toUpperCase()}</span>}
        <span className="finding-viewer__position">
          {list.length > 0 ? `${index + 1} / ${list.length}` : '0 / 0'}{viewingArchived ? ' · archived' : ''}
        </span>
        <button
          className="finding-viewer__archived-toggle"
          disabled={!viewingArchived && archivedFindings.length === 0}
          onMouseDown={() => setViewingArchived((v) => !v)}
          onTouchStart={() => setViewingArchived((v) => !v)}
        >
          {viewingArchived ? `‹ Active (${activeFindings.length})` : `Archived (${archivedFindings.length})`}
        </button>
        <button className="finding-viewer__close" onMouseDown={onClose} onTouchStart={onClose}>✕</button>
      </div>

      {!finding ? (
        <div className="finding-viewer__empty">
          {viewingArchived ? 'No archived findings.' : 'No active findings — nice work!'}
        </div>
      ) : (
        <>
          <div className="finding-viewer__loc">{finding.file}:{finding.line}</div>

          <DiffHunkView hunk={finding.diffHunk} className="diff-hunk--fill" />

          <textarea
            className="finding-viewer__textarea"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            disabled={locked || viewingArchived}
            rows={3}
          />

          {finding.postError && <div className="finding-row__error">{finding.postError}</div>}

          {locked ? (
            <a className="finding-row__link" href={finding.postedUrl} target="_blank" rel="noreferrer">View on GitHub</a>
          ) : viewingArchived ? (
            <div className="finding-viewer__actions">
              <button disabled={archiving} onMouseDown={() => handleSetArchived(false)}>
                {archiving ? 'Restoring…' : 'Restore'}
              </button>
            </div>
          ) : (
            <div className="finding-viewer__actions">
              <button className="finding-viewer__ignore" disabled={archiving} onMouseDown={() => handleSetArchived(true)}>
                {archiving ? 'Ignoring…' : 'Ignore'}
              </button>
              <div className="finding-viewer__actions-right">
                <button disabled={!dirty || saving} onMouseDown={handleSave}>{saving ? 'Saving…' : 'Save'}</button>
                <button disabled={dirty || posting} onMouseDown={handleSubmit}>{posting ? 'Posting…' : 'Post to GitHub'}</button>
              </div>
            </div>
          )}
        </>
      )}

      <div className="finding-viewer__nav">
        <button
          className="finding-viewer__nav-btn"
          disabled={index === 0}
          onMouseDown={() => setIndex((i) => i - 1)}
        >
          ‹ Prev
        </button>
        <button
          className="finding-viewer__nav-btn"
          disabled={index >= list.length - 1}
          onMouseDown={() => setIndex((i) => i + 1)}
        >
          Next ›
        </button>
      </div>
    </div>
  );
}
