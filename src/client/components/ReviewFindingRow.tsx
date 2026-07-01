import type { ReviewFinding } from '@shared/types';
import { SEVERITY_CLASS } from './reviewSeverity';

interface Props {
  finding: ReviewFinding;
  onClick: () => void;
}

export function ReviewFindingRow({ finding, onClick }: Props) {
  const locked = finding.status === 'posted';
  return (
    <div className="finding-row" onMouseDown={onClick} onTouchStart={onClick}>
      <div className="finding-row__header">
        <span className={SEVERITY_CLASS[finding.severity]}>{finding.severity.toUpperCase()}</span>
        <span className="finding-row__loc">{finding.file}:{finding.line}</span>
        {locked && <span className="finding-row__posted">posted</span>}
        <span className="finding-row__chevron">›</span>
      </div>
    </div>
  );
}
