export type ComparisonStatus = 'identical' | 'different' | 'left-only' | 'right-only';

export const ALL_COMPARISON_STATUSES: readonly ComparisonStatus[] = [
  'identical',
  'different',
  'left-only',
  'right-only',
];

export function describeStatus(status: ComparisonStatus): string {
  switch (status) {
    case 'identical':
      return 'Identical';
    case 'different':
      return 'Different';
    case 'left-only':
      return 'Left only';
    case 'right-only':
      return 'Right only';
  }
}
