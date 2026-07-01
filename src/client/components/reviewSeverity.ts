import type { ReviewFinding } from '@shared/types';

export const SEVERITY_CLASS: Record<ReviewFinding['severity'], string> = {
  issue: 'chip chip--changes',
  suggestion: 'chip chip--pending',
  nit: 'chip chip--draft',
};
