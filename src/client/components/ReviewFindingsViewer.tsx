import { useEffect, useState } from 'react';
import type { ReviewFinding } from '@shared/types';
import { DiffHunkView } from './DiffHunkView';
import { SEVERITY_CLASS } from './reviewSeverity';

interface Props {
  findings: ReviewFinding[];
  initialIndex: number;
  onSave: (findingId: string, comment: string) => Promise<void>;
  onSubmit: (findingId: string) => Promise<void>;
  onClose: () => void;
}

export function ReviewFindingsViewer({ findings, initialIndex, onSave, onSubmit, onClose }: Props) {
  const [index, setIndex] = useState(initialIndex);
  const finding = findings[index];
  const [draft, setDraft] = useState(finding.comment);
  const [saving, setSaving] = useState(false);
  const [posting, setPosting] = useState(false);

  useEffect(() => {
    setDraft(finding.comment);
  }, [finding.id, finding.comment]);

  const dirty = draft !== finding.comment;
  const locked = finding.status === 'posted';

  async function handleSave() {
    setSaving(true);
    try { await onSave(finding.id, draft); } finally { setSaving(false); }
  }

  async function handleSubmit() {
    setPosting(true);
    try { await onSubmit(finding.id); } finally { setPosting(false); }
  }

  return (
    <div className="finding-viewer">
      <div className="finding-viewer__header">
        <span className={SEVERITY_CLASS[finding.severity]}>{finding.severity.toUpperCase()}</span>
        <span className="finding-viewer__position">{index + 1} / {findings.length}</span>
        <button className="finding-viewer__close" onMouseDown={onClose} onTouchStart={onClose}>✕</button>
      </div>

      <div className="finding-viewer__loc">{finding.file}:{finding.line}</div>

      <DiffHunkView hunk={finding.diffHunk} className="diff-hunk--fill" />

      <textarea
        className="finding-viewer__textarea"
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        disabled={locked}
        rows={3}
      />

      {finding.postError && <div className="finding-row__error">{finding.postError}</div>}

      {locked ? (
        <a className="finding-row__link" href={finding.postedUrl} target="_blank" rel="noreferrer">View on GitHub</a>
      ) : (
        <div className="finding-viewer__actions">
          <button disabled={!dirty || saving} onMouseDown={handleSave}>{saving ? 'Saving…' : 'Save'}</button>
          <button disabled={dirty || posting} onMouseDown={handleSubmit}>{posting ? 'Posting…' : 'Post to GitHub'}</button>
        </div>
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
          disabled={index === findings.length - 1}
          onMouseDown={() => setIndex((i) => i + 1)}
        >
          Next ›
        </button>
      </div>
    </div>
  );
}
