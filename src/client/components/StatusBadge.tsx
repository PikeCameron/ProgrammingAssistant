import type { CheckStatus } from '@shared/types';

interface Props {
  status: CheckStatus;
}

const CLASS: Record<CheckStatus, string> = {
  success: 'badge badge--success',
  failure: 'badge badge--failure',
  pending: 'badge badge--pending',
  neutral: 'badge badge--neutral',
};

export function StatusBadge({ status }: Props) {
  return <span className={CLASS[status]} />;
}
