import { useState } from 'react';
import type { ReviewFinding } from '@shared/types';
import { DiffHunkView } from './DiffHunkView';

interface Props {
  finding: ReviewFinding;
  expanded: boolean;
  onToggle: () => void;
  onSave: (comment: string) => Promise<void>;
  onSubmit: () => Promise<void>;
}

const SEVERITY_CLASS: Record<ReviewFinding['severity'], string> = {
  issue: 'chip chip--changes',
  suggestion: 'chip chip--pending',
  nit: 'chip chip--draft',
};

export function ReviewFindingRow({ finding, expanded, onToggle, onSave, onSubmit }: Props) {
  const [draft, setDraft] = useState(finding.comment);
  const [saving, setSaving] = useState(false);
  const [posting, setPosting] = useState(false);
  const dirty = draft !== finding.comment;
  const locked = finding.status === 'posted';

  async function handleSave() {
    setSaving(true);
    try { await onSave(draft); } finally { setSaving(false); }
  }

  async function handleSubmit() {
    setPosting(true);
    try { await onSubmit(); } finally { setPosting(false); }
  }

  return (
    <div className="finding-row">
      <div className="finding-row__header" onMouseDown={onToggle} onTouchStart={onToggle}>
        <span className={SEVERITY_CLASS[finding.severity]}>{finding.severity.toUpperCase()}</span>
        <span className="finding-row__loc">{finding.file}:{finding.line}</span>
        {locked && <span className="finding-row__posted">posted</span>}
      </div>
      {expanded && (
        <div className="finding-row__body" onMouseDown={(e) => e.stopPropagation()} onTouchStart={(e) => e.stopPropagation()}>
          <DiffHunkView hunk={finding.diffHunk} />
          <textarea
            className="finding-row__textarea"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            disabled={locked}
            rows={3}
          />
          {finding.postError && <div className="finding-row__error">{finding.postError}</div>}
          {locked ? (
            <a className="finding-row__link" href={finding.postedUrl} target="_blank" rel="noreferrer">View on GitHub</a>
          ) : (
            <div className="finding-row__actions">
              <button disabled={!dirty || saving} onMouseDown={handleSave}>{saving ? 'Saving…' : 'Save'}</button>
              <button disabled={dirty || posting} onMouseDown={handleSubmit}>{posting ? 'Posting…' : 'Post to GitHub'}</button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
